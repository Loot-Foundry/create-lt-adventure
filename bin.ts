#!/usr/bin/env bun
import * as p from "@clack/prompts";
import { cyan } from "kolorist";
import { mkdir, cp } from "fs/promises";
import { packs, systems } from "./options";

p.intro(`Creating new Foundry VTT module...`);

const data = await p.group(
	{
		title: () =>
			p.text({
				message: "Module Title?",
				placeholder: "My New Module",
				defaultValue: "My New Module",
			}),
		id: ({ results }: any) =>
			p.text({
				message: "Module ID?",
				initialValue:
					results.title
						?.toLowerCase()
						.replace(/\s+/g, "-")
						.replace(/[^a-z0-9-]/g, "") ?? "my-module",
				placeholder:
					results.title
						?.toLowerCase()
						.replace(/\s+/g, "-")
						.replace(/[^a-z0-9-]/g, "") ?? "my-module",
			}),
		description: () => p.text({ message: "Module Description?" }),
		version: () =>
			p.select({
				message: "Foundry Version?",
				initialValue: "13",
				options: [
					// Just V13 and V14
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
	},
	{ onCancel: () => process.exit(0) },
);

console.log(data);

await p.tasks([
	{
		title: "Making directory",
		task: async () => {
			await mkdir(data.id, { recursive: true });
			return "Directory created";
		},
	},
	{
		title: "Copying template",
		task: async () => {
			await cp(new URL("templates/default", import.meta.url), data.id, {
				recursive: true,
			});
			return "Template copied";
		},
	},
	{
		title: "Modifying files",
		task: async () => {
			const modPath = `${data.id}/module.json`;
			const mod = (await Bun.file(modPath).json()) as Record<string, any>;

			// inject user data
			mod.id = data.id;
			mod.title = data.title;
			mod.description = data.description;
			mod.version = {
				minimum: data.version,
				verified: data.version,
				maximum: data.version + 1,
			};
			mod.relationships.system = data.system.map((system) =>
				systems.find((s) => s.id === system),
			);
			mod.esmodules = [`dist/${data.id}.js`];
			mod.styles = [`dist/${data.id}.css`];
			mod.packs = data.packs;
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
		},
	},
]);

p.outro(`cd ${cyan(data.id)} && bun install`);
