// Creates a .github/workflows/main.yml file.
// Additional options include:
// - Support for prereleases (requires a seperate branch)
// - Supports for uploading via FTP to external servers
// - Discord webhook notifications

import * as p from "@clack/prompts";
import { cyan } from "kolorist";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Grab main.yml template
const mainYmlTemplate = await readFile(`${__dirname}/main.yml`, "utf8");

// Get the module directory from environment variable
const moduleDir = process.env.MODULE_DIR || process.cwd();

let mainYml = mainYmlTemplate;

// Create main.yml file
const workflowDir = `${moduleDir}/.github/workflows`;
await mkdir(workflowDir, { recursive: true });
await writeFile(`${workflowDir}/main.yml`, mainYml);

let note = "✅ Installed!";
note += "\nThe Github workflow is triggered by making a new release. To make a new release go to your repository's Releases page which can be found in the sidebar on the right and press \"Draft a new release.\" Fill in the version number and you're done!"

p.note(note, "Github Workflow");
