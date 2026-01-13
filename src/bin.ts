#!/usr/bin/env bun
import * as p from "@clack/prompts";
import { cyan } from "kolorist";
import { mkdir, cp } from "fs/promises";
import { packs, systems } from "./options.js";
import { existsSync, readdirSync, rmSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

p.intro(`Creating a new Foundry VTT module...`);

const packageDir = (d: string) => resolve(import.meta.dir, d);

let deleteFolder = false;
const cliArgs = process.argv.slice(2);
const cliTitle = cliArgs[0];
const autoId = cliArgs.includes("--auto-id");
// Grab available templates from dir
const templates = readdirSync(packageDir("../templates"));
// Grab addons from addons/dirs
const addonDirs = readdirSync(packageDir("../addons")).filter((item) => {
	const stat = statSync(packageDir(`../addons/${item}`));
	return stat.isDirectory();
});

interface Addon {
	name: string;
	description: string;
	default: boolean;
}

const addons: (Addon & { id: string })[] = await Promise.all(
	addonDirs.map(async (dir) => {
		const addonJson = (await Bun.file(packageDir(`../addons/${dir}/addon.json`)).json()) as Addon;
		return {
			...addonJson,
			id: dir,
		};
	}),
);

const data = await p.group(
	{
		template: async () => {
			if (templates.length === 1) {
				return templates[0];
			}
			const template = await p.select({
				message: "Select a template",
				options: templates.map((template) => ({
					label: template,
					value: template,
				})),
			});
			return template;
		},
		title: () =>
			cliTitle
				? Promise.resolve(cliTitle)
				: p.text({
						message: "Module Title?",
						placeholder: "My New Module",
						defaultValue: "My New Module",
					}),
		id: ({ results }: any) => {
			const defaultId =
				results.title
					?.toLowerCase()
					.replace(/\s+/g, "-")
					.replace(/[^a-z0-9-]/g, "") ?? "my-module";
			return autoId
				? Promise.resolve(defaultId)
				: p.text({
						message: "Module ID?",
						initialValue: defaultId,
						defaultValue: defaultId,
						placeholder: defaultId,
					});
		},
		exists: async ({ results }: any) => {
			const fullPath = resolve(process.cwd(), results.id);
			const exists = existsSync(fullPath);
			if (exists) {
				const confirm = await p.confirm({
					message: `Folder already exists at ${fullPath}. Overwrite?`,
					initialValue: false,
				});
				if (!confirm) {
					p.cancel("Cancelled due to already existing folder.");
					process.exit(0);
				} else {
					deleteFolder = true;
				}
			}
			return Promise.resolve();
		},
		description: () =>
			p.text({ message: "Module Description?", defaultValue: "" }),
		version: () =>
			p.select({
				message: "Foundry Version?",
				initialValue: "13",
				options: [
					{ label: "V13", value: "13" },
					{ label: "V14", value: "14" },
				],
			}),
		system: () =>
			p.multiselect({
				message: "What System?",
				initialValues: ["dnd5e"],
				options: systems.map((system) => ({
					label: system.id,
					value: system.id,
				})),
			}),
		packs: () =>
			p.multiselect({
				message: "What Packs?",
				required: false,
				initialValues: packs,
				options: packs.map((pack) => ({
					label: pack.label,
					value: pack,
				})),
			}),
		containPacks: ({ results }: any) =>
			results.packs?.length > 0
				? p.confirm({
						message: "Put Packs in a Folder?",
						initialValue: true,
					})
				: Promise.resolve(false),
		containPacksFolder: ({ results }: any) =>
			results.containPacks
				? p.text({
						message: "Folder Name?",
						placeholder: results.title,
						defaultValue: results.title,
					})
				: Promise.resolve(),
		enabledAddons: () => {
			if (addons.length > 0) {
				return p.multiselect({
					message: "Enable addons?",
					required: false,
					initialValues: addons.filter(x => x.default).map(x => x.id),
					options: addons.map((addon) => ({
						label: `${addon.name} - ${addon.description}`,
						value: addon.id,
					})),
				})
			}
			else {
				return Promise.resolve([])
			}
		},
	},
	{ onCancel: () => process.exit(0) },
);

// Resolve module path relative to cwd
const modulePath = resolve(process.cwd(), data.id);

function hasPackageJSON(): boolean {
	return existsSync(join(modulePath, "package.json"));
}

await p.tasks([
	{
		title: "[Task] Deleting existing directory",
		enabled: deleteFolder,
		task: async () => {
			if (deleteFolder) rmSync(modulePath, { recursive: true });
			return "✅ Existing directory deleted";
		},
	},
	{
		title: "[Task] Making directory",
		task: async () => {
			await mkdir(modulePath, { recursive: true });
			return `✅ ${modulePath} directory created`;
		},
	},
	{
		title: "[Task] Copying template",
		task: async () => {
			await cp(
				new URL(`../templates/${data.template}`, import.meta.url),
				modulePath,
				{
					recursive: true,
				},
			);
			return "✅ Template copied";
		},
	},
	{
		title: "[Task] Writing module.json",
		task: async () => {
			const modPath = join(modulePath, "module.json");
			const mod = (await Bun.file(modPath).json()) as Record<string, any>;

			// inject user data
			mod.id = data.id;
			mod.title = data.title;
			mod.description = data.description;
			mod.compatibility = {
				minimum: data.version,
				verified: data.version,
			};
			mod.relationships.system = data.system.map((system) =>
				systems.find((s) => s.id === system),
			);
			mod.packs = data.packs.flatMap((pack) =>
				data.system.map((system) => ({ ...pack, system })),
			);
			if (data.containPacks) {
				mod.packFolders = [
					{
						name: data.containPacksFolder,
						sorting: "m",
						color: "#00000f",
						packs: data.packs.map((x) => x.name),
					},
				];
			}
			if (data.system.includes("dnd5e")) {
				mod.flags.dnd5e = {
					sourceBooks: {
						[data.id]: data.title,
					},
					spellLists: [],
				};
			}

			await Bun.write(modPath, JSON.stringify(mod, null, "\t"));

			return "✅ module.json created";
		},
	},
	{
		title: "[Task] Writing README.md",
		task: async () => {
			const readmePath = join(modulePath, "README.md");
			const readme = `# ${data.title}
${data.description}

## Installation

\`\`\`
cd ${data.id} ${hasPackageJSON() ? "&& bun install" : "and get to making stuff!"}
\`\`\`

## Resources

${
	data.system.includes("dnd5e")
		? `D&D5e Wiki: https://github.com/foundryvtt/dnd5e/wiki
D&D5e Specific Module Flags: https://github.com/foundryvtt/dnd5e/wiki/Module-Registration`
		: ""
}

${
	data.system.includes("pf2e")
		? `PF2e Wiki: https://github.com/foundryvtt/pf2e/wiki`
		: ""
}
`;

			await Bun.write(readmePath, readme);

			return "✅ README.md created";
		},
	},
]);

// Run enabled addons
if (data.enabledAddons && data.enabledAddons.length > 0) {
	for (const addonId of data.enabledAddons) {
		p.note(`[Addon] Running ${addonId} setup...`);
		const addonProcess = Bun.spawn(
			["bun", "run", packageDir(`../addons/${addonId}/setup.ts`)],
			{
				stdio: ["inherit", "inherit", "inherit"],
				env: {
					...process.env,
					MODULE_DIR: modulePath,
					ADDON_ID: addonId,
				},
			},
		);
		await addonProcess.exited;

		if (addonProcess.exitCode !== 0) {
			throw new Error(`❗ Addon ${addonId} setup failed`);
		}
	}
}

// Check if template has a scripts/onCreate, ask to run it
const onCreatePath = join(modulePath, "scripts", "onCreate.ts");
if (await Bun.file(onCreatePath).exists()) {
	const runOnCreate = await p.confirm({
		message: `Run onCreate script?`,
		initialValue: true,
	});
	if (runOnCreate) {
		const spin = p.spinner();
		spin.start("[Task] Running onCreate script...");
		const process = Bun.spawn(["bun", "run", "onCreate.ts"], {
			cwd: join(modulePath, "scripts"),
		});
		await process.exited;
		if (process.exitCode !== 0) {
			throw new Error(`❗ onCreate script failed`);
		}
		spin.stop("✅ onCreate script completed");
	}
}

p.outro(`cd ${cyan(data.id)} ${hasPackageJSON() ? "&& bun install" : "and get to making stuff!"}`);