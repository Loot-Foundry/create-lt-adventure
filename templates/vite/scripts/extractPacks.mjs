#!/usr/bin/env node

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import * as p from "@clack/prompts";
import { extractPack } from "@foundryvtt/foundryvtt-cli";
// import moduleJSON from "../module.json" with { type: "json" };

const foundryDataDir = "packs/";
const jsonDataDir = "data/";

p.intro(`Extracting ${foundryDataDir} into ${jsonDataDir}...`)

const outDir = path.resolve(process.cwd());
const packsCompiled = path.resolve(outDir, foundryDataDir);
if (!existsSync(packsCompiled)) {
	p.log.warn("Packs directory does not exist in the build!")
}

const packFolders = await fs.readdir(packsCompiled);

const prog = p.progress({ max: packFolders.length })

prog.start("Extracting...")

for (const pack of packFolders) {
	if (!existsSync(`${jsonDataDir}/${pack}`)) {
		await fs.mkdir(`${jsonDataDir}/${pack}`);
	}
	await extractPack(
		path.resolve(packsCompiled, pack),
		`${jsonDataDir}/${pack}`,
		{
			expandAdventures: true,
			omitVolatile: true,
			folders: false,
			clean: true,
			log: false
		},
	);
	prog.advance(1, `Extracted /${pack} directory.`)
}

prog.stop("Extraction Complete.")

p.outro("Finished!");