const packs = [
	{
		label: "Adventures",
		name: "adventure",
		path: "packs/adventure",
		system: "",
		type: "Adventure",
		ownership: {
			PLAYER: "OBSERVER",
			ASSISTANT: "OBSERVER",
		},
	},
	{
		label: "Items",
		name: "items",
		path: "packs/items",
		system: "",
		type: "Item",
		ownership: {
			PLAYER: "OBSERVER",
			ASSISTANT: "OBSERVER",
		},
	},
	{
		label: "Journals",
		name: "journals",
		path: "packs/journals",
		system: "",
		type: "JournalEntry",
		ownership: {
			PLAYER: "OBSERVER",
			ASSISTANT: "OBSERVER",
		},
	},
	{
		label: "Actors",
		name: "actors",
		path: "packs/actors",
		system: "",
		type: "Actor",
		ownership: {
			PLAYER: "OBSERVER",
			ASSISTANT: "OWNER",
		},
	},
];

const systems = [
	{
		id: "dnd5e",
		type: "system",
		manifest:
			"https://github.com/foundryvtt/dnd5e/releases/latest/download/system.json",
		compatibility: {
			minimum: "5.2",
		},
	},
	{
		id: "pf2e",
		type: "system",
		manifest:
			"https://github.com/foundryvtt/pf2e/releases/latest/download/system.json",
		compatibility: {
			minimum: "7.8",
		},
	},
];

export { packs, systems };
