import { renameSync } from "fs";

const mod = (await Bun.file("../module.json").json());
const pack = (await Bun.file("../package.json").json());

// Module
mod.esmodules = [`dist/${mod.id}.js`];
mod.styles = [`dist/${mod.id}.css`];

// Package
pack.name = mod.id;

mod.media = [
	{
		"type": "setup",
		"url": `modules/${mod.id}/assets/setup.webp`,
		"thumbnail": `modules/${mod.id}/assets/setup.webp`
	}
];

const modString = JSON.stringify(mod, null, "\t")
	// .replaceAll("AUTHOR", data.author)
	.replaceAll("REPO", mod.id);

const packString = JSON.stringify(pack, null, "\t")
	// .replaceAll("AUTHOR", data.author)
	.replaceAll("REPO", mod.id);

await Bun.write("../module.json", modString);
await Bun.write("../package.json", packString);

// Rename gitignore to .gitignore
renameSync("../gitignore", "../.gitignore");

export { };
