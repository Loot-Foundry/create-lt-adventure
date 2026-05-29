import { renameSync, readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { execSync } from "child_process";

const mod = JSON.parse(readFileSync("../module.json", "utf8"));
const pack = JSON.parse(readFileSync("../package.json", "utf8"));
const css = readFileSync("../src/module.css", "utf8");

// CSS
const updatedCss = css.replaceAll("module-template", mod.id);

// Package
pack.name = mod.id;

// Module
mod.esmodules = [`dist/${mod.id}.js`];
mod.styles = [`dist/${mod.id}.css`];
mod.media = [
	{
		"type": "setup",
		"url": `modules/${mod.id}/assets/setup.webp`,
		"thumbnail": `modules/${mod.id}/assets/setup.webp`
	}
];
const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
mod.flags.ftpPath = `NEW/${mod.id}-${randomHash}`;
mod.manifest = `https://loottavern.com/Foundry%20packs/${mod.flags.ftpPath}/module.json`;
mod.download = `https://loottavern.com/Foundry%20packs/${mod.flags.ftpPath}/module.zip`;

// Final writes and global renames

const modString = JSON.stringify(mod, null, "\t")
	// .replaceAll("AUTHOR", data.author)
	.replaceAll("REPO", mod.id);

const packString = JSON.stringify(pack, null, "\t")
	// .replaceAll("AUTHOR", data.author)
	.replaceAll("REPO", mod.id);

writeFileSync("../module.json", modString);
writeFileSync("../package.json", packString);
writeFileSync("../src/module.css", updatedCss);

// Rename gitignore to .gitignore
try {
	renameSync("../gitignore", "../.gitignore");
} catch (err) {
	// EEXIST means .gitignore already exists - delete gitignore and move on
	// ENOENT means gitignore was already renamed - also fine
	if (err.code !== "EEXIST" && err.code !== "ENOENT") {
		throw err;
	}
	// Clean up the non-canonical name if it somehow still exists
	if (existsSync("../gitignore")) {
		try {
			unlinkSync("../gitignore");
		} catch {
			// Already gone or doesn't exist - fine
		}
	}
}

// Initialize git repository
const parentDir = "..";
const gitDir = `${parentDir}/.git`;

if (!existsSync(gitDir)) {
	console.log("Initializing git repository...");
	execSync("git init", { cwd: parentDir, stdio: "inherit" });
	
	// Stage all files including dot-prefixed ones
	execSync("git add -A", { cwd: parentDir, stdio: "inherit" });
	
	// Create initial commit
	execSync('git commit -m "Initial commit"', { cwd: parentDir, stdio: "inherit" });
	
	console.log("Git repository initialized with initial commit");
}
