import * as p from "@clack/prompts";
import { mkdir, readdir, rm, readFile, writeFile, stat, copyFile } from "fs/promises";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { join, basename } from "path";
import AdmZip from "adm-zip";
import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { yellow, cyan } from "kolorist";

interface ModuleJson {
	id?: string;
	title?: string;
	description?: string;
	download?: string;
	packs?: Array<{ name: string; label: string; type: string; path: string; system?: string; ownership?: Record<string, string> }>;
	packFolders?: Array<{ name: string; packs: string[]; sorting?: string; color?: string }>;
	[key: string]: unknown;
}

function isUrl(input: string): boolean {
	return input.startsWith("http://") || input.startsWith("https://");
}

async function readModuleJson(source: string): Promise<ModuleJson> {
	let jsonPath: string;

	if (isUrl(source)) {
		const spinner = p.spinner();
		spinner.start(`Fetching module.json from ${cyan(source)}...`);
		try {
			const response = await fetch(source);
			if (!response.ok) {
				throw new Error(`Failed to fetch module.json: ${response.status} ${response.statusText}`);
			}
			const text = await response.text();
			const parsed = JSON.parse(text) as ModuleJson;
			spinner.stop(`module.json fetched successfully`);
			return parsed;
		} catch (err) {
			spinner.stop(`Failed to fetch module.json: ${err instanceof Error ? err.message : String(err)}`);
			throw err;
		}
	}

	if (existsSync(source)) {
		const sourceStat = await stat(source);
		if (sourceStat.isDirectory()) {
			jsonPath = join(source, "module.json");
		} else {
			jsonPath = source;
		}

		if (!existsSync(jsonPath)) {
			throw new Error(`module.json not found at ${source}`);
		}

		const content = await readFile(jsonPath, "utf8");
		return JSON.parse(content) as ModuleJson;
	}

	throw new Error(`Path does not exist: ${source}`);
}

async function downloadZipBuffer(url: string): Promise<Buffer> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download zip: ${response.status} ${response.statusText}`);
	}

	return Buffer.from(await response.arrayBuffer());
}

async function findCompendiumFolders(extractDir: string): Promise<Array<{ folderPath: string; folderName: string }>> {
	const result: Array<{ folderPath: string; folderName: string }> = [];

	async function scanDirectory(dirPath: string): Promise<void> {
		const entries = await readdir(dirPath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dirPath, entry.name);

			if (entry.isDirectory()) {
				if (entry.name === "packs" || entry.name === "data") {
					const subEntries = await readdir(fullPath);
					for (const subEntry of subEntries) {
						const subPath = join(fullPath, subEntry);
						const subStat = await stat(subPath);
						if (subStat.isDirectory()) {
							const dbFiles = (await readdir(subPath)).filter((f) => f.endsWith(".db"));
							if (dbFiles.length > 0) {
								result.push({ folderPath: subPath, folderName: subEntry });
							}
						}
					}
				} else {
					await scanDirectory(fullPath);
				}
			}
		}
	}

	await scanDirectory(extractDir);
	return result;
}

function simpleReplacer(_key: string, value: unknown): unknown {
	return value;
}

export async function migrateFrom(source: string, modulePath: string): Promise<void> {
	const moduleJson = await readModuleJson(source);

	if (!moduleJson.download) {
		throw new Error("No download URL found in module.json. The source module does not have a download property.");
	}

	p.log.step(`Downloading module from ${cyan(moduleJson.download)}`);

	const tempDir = join(tmpdir(), `fvtt-migrate-${Date.now()}`);
	const extractDir = join(tempDir, "extracted");

	try {
		await mkdir(tempDir, { recursive: true });
		const zipBuffer = await downloadZipBuffer(moduleJson.download);
		const zip = new AdmZip(zipBuffer);
		zip.extractAllTo(extractDir, true);

		p.log.step("Finding compendium folders...");
		const compendiumFolders = await findCompendiumFolders(extractDir);

		if (compendiumFolders.length === 0) {
			p.log.warn("No compendium folders found in the source module.");
			return;
		}

		p.log.info(`Found ${compendiumFolders.length} compendium folder(s): ${compendiumFolders.map((f) => f.folderName).join(", ")}`);

	const sourcePackMap = new Map<string, string>();
	if (moduleJson.packs) {
		for (const pack of moduleJson.packs) {
			const packName = basename(pack.path);
			if (pack.type) {
				sourcePackMap.set(packName, pack.type);
			}
		}
	}

	const targetPacksDir = join(modulePath, "packs");
	const targetDataDir = join(modulePath, "data");
	await mkdir(targetPacksDir, { recursive: true });
	await mkdir(targetDataDir, { recursive: true });

	const newPacks: Array<{ name: string; label: string; type: string; path: string; system: string; ownership: Record<string, string> }> = [];
	const newPackNames: string[] = [];

	for (const compendium of compendiumFolders) {
		const packEntries = await readdir(compendium.folderPath);
		const dbFiles = packEntries.filter((f) => f.endsWith(".db"));

		for (const dbFile of dbFiles) {
			const packName = basename(dbFile, ".db");
			const packType = sourcePackMap.get(packName) || "JournalEntry";

			await copyFile(join(compendium.folderPath, dbFile), join(targetPacksDir, dbFile));

			p.log.step(`Extracting ${yellow(packName)}...`);

			const targetDataPath = join(targetDataDir, packName);
			await mkdir(targetDataPath, { recursive: true });
			await extractPack(
				join(targetPacksDir, dbFile),
				targetDataPath,
				{
					expandAdventures: true,
					omitVolatile: true,
					folders: true,
					clean: true,
					log: false,
					jsonOptions: {
						replacer: simpleReplacer,
						space: "\t",
					},
				},
			);

			newPacks.push({
				name: packName,
				label: packName.charAt(0).toUpperCase() + packName.slice(1).replace(/-/g, " "),
				type: packType,
				path: `packs/${packName}`,
				system: "",
				ownership: {
					PLAYER: "OBSERVER",
					ASSISTANT: "OBSERVER",
				},
			});
			newPackNames.push(packName);
		}
	}

		if (newPacks.length > 0) {
			const targetModuleJsonPath = join(modulePath, "module.json");
			if (existsSync(targetModuleJsonPath)) {
				const content = await readFile(targetModuleJsonPath, "utf8");
				const targetModuleJson = JSON.parse(content) as ModuleJson;

				targetModuleJson.packs = newPacks;
				targetModuleJson.packFolders = [
					{
						name: "Migrated Packs",
						packs: newPackNames,
						sorting: "m",
						color: "#00000f",
					},
				];

				await writeFile(targetModuleJsonPath, JSON.stringify(targetModuleJson, null, "\t"));
				p.log.step("Updated module.json with migrated packs");
			}
		}

		p.log.info(`Migration complete! ${compendiumFolders.length} compendium folder(s) processed.`);
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}
}
