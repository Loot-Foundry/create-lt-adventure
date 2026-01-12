import moduleJSON from "moduleJSON";

const affectedDocuments = ["journal"];

const backgrounds = [
	{ maxWidth: 130, image: "bg-header-length-01.svg" },
	{ maxWidth: 150, image: "bg-header-length-02.svg" },
	{ maxWidth: 210, image: "bg-header-length-03.svg" },
	{ maxWidth: 250, image: "bg-header-length-04.svg" },
	{ maxWidth: 300, image: "bg-header-length-05.svg" },
	{ maxWidth: 400, image: "bg-header-length-06.svg" },
	{ maxWidth: Infinity, image: "bg-header-length-07.svg" },
];

const DnDSheet = CONFIG.JournalEntry.sheetClasses.base['dnd5e.JournalEntrySheet5e'].cls;

export class LootTavernSheet extends DnDSheet {
	static DEFAULT_OPTIONS = {
		classes: [`${moduleJSON.id}-journal`],
		actions: {
			"openLootDevTools": this.openLootDevTools
		},
		window: {
			controls: [
				{
					"icon": "fa-solid fa-wrench",
					"label": "Loot Tavern Dev Tools",
					"action": "openLootDevTools",
					visible: () => moduleJSON.version === "dev",
				}
			]
		}
	}

	static openLootDevTools(event) {
		event.stopPropagation(); // Don't trigger other events
		if (event.detail > 1) return; // Ignore repeated clicks
		const docSheetConfigWidth = foundry.applications.apps.DocumentSheetConfig.DEFAULT_OPTIONS.position.width;
		const fields = foundry.applications.fields;

		const placeholder = `modules/${moduleJSON.id}/assets/setup.webp`

		const headersInput = fields.createCheckboxInput({ name: "helianaHeaders", value: this.document.getFlag(moduleJSON.id, "helianaHeaders"), placeholder })
		const selectGroup = fields.createFormGroup({
			input: headersInput,
			label: "Heliana-styled Headers",
			hint: undefined
		})

		const imageInput = fields.createTextInput({ name: "image", value: this.document.getFlag(moduleJSON.id, "image"), placeholder })
		const imageGroup = fields.createFormGroup({
			input: imageInput,
			label: "Main Image",
			hint: undefined
		})

		const sidebarImageInput = fields.createTextInput({ name: "sidebarImage", value: this.document.getFlag(moduleJSON.id, "sidebarImage"), placeholder })
		const sidebarImageGroup = fields.createFormGroup({
			input: sidebarImageInput,
			label: "Sidebar Background Image",
			hint: undefined
		})

		const borderNumberInput = fields.createSelectInput({
			options: Array(31).fill().map((x, i) => ({ label: i, value: i })),
			name: 'borderNumber',
			value: this.document.getFlag(moduleJSON.id, "borderNumber") || 26,
		})
		const borderNumberGroup = fields.createFormGroup({
			input: borderNumberInput,
			label: "Border Select",
			hint: "Pick a style of border you want."
		})

		const formContent = [
			selectGroup,
			imageGroup,
			sidebarImageGroup,
			borderNumberGroup
		]

		const updateFlags = (flags) => this.document.update({ [`flags.${moduleJSON.id}`]: flags });

		const dialog = new foundry.applications.api.DialogV2({
			id: `${this.id}-dev-menu`,
			classes: [],
			window: {
				title: `${this.document.name} Dev Config`,
				resizable: true,
			},
			position: {
				width: 550,
				top: this.position.top + 40,
				left: this.position.left + ((this.position.width - docSheetConfigWidth) / 2)
			},
			// ../../assets/Art/ReignOfIron-Landscape-Vertical.webp
			content: formContent.map(x => x.outerHTML).join(""),
			buttons: [
				{
					action: "submit",
					label: "Submit",
					default: true,
					callback: async function (event, target) {
						const flags = Object.fromEntries(Object.values(target.form.elements).map(x => [x.name, x.checked || x.value]).filter(x => x[0]))

						await updateFlags(flags)
					},
				},
			],
		});
		dialog.render(true);
	}

	async render(force, options) {
		const doc = this.document;
		const modFlags = doc.flags?.[moduleJSON.id] ?? {};
		await super.render(force, options);

		const html = this.element;

		// Sidebar Background
		const sidebarImg = this.document.getFlag(moduleJSON.id, "sidebarImage");
		if (sidebarImg) html.style.setProperty("--sidebarImage", `url("/${sidebarImg}")`);

		const borderNumber = this.document.getFlag(moduleJSON.id, "borderNumber");
		if (!isNaN(borderNumber)) html.style.setProperty("--urlBorderImage", `url("/modules/${moduleJSON.id}/assets/journals/borders/panel-border-${("00" + Number(borderNumber)).slice(-3)}.webp")`);

		if (this.mode === 2) {
			const imgPath = this.document.flags[moduleJSON.id]?.image;
			if (!imgPath) return;
			const scrollable = html.querySelector(".journal-entry-content .scrollable");

			// Create and insert scenery element
			const sceneryDiv = document.createElement("div");
			sceneryDiv.className = "scenery mask upside-down";
			sceneryDiv.innerHTML = `<img src="/${imgPath}">`;
			scrollable.prepend(sceneryDiv);

			const scenery = scrollable.querySelector(".scenery");

			scrollable.addEventListener("scroll", ({ target }) => {
				const opacity = Math.max(10, 100 - target.scrollTop / 2);
				scenery.style.opacity = `${opacity}%`;
				scenery.style.pointerEvents = opacity < 50 ? "none" : "auto";
			});


			const header = html.querySelector("header.journal-header");
			header.remove();

			const title = document.createElement('header');
			title.textContent = this.document.name;
			scenery.appendChild(title);
		}

		// Level Select
		const levelSelect = html.querySelector("#level-select");

		if (levelSelect) {
			// Add radio inputs to each level
			const levelOptions = levelSelect.querySelectorAll("[data-level]");
			levelOptions.forEach((option) => {
				const input = document.createElement("input");
				input.type = "radio";
				input.name = "level-selector";
				option.prepend(input);
			});

			// Handle radio button clicks
			const radioInputs = levelSelect.querySelectorAll("input[type='radio']");
			radioInputs.forEach((radio) => {
				radio.addEventListener("click", function () {
					const radioElement = this;

					if (radioElement.checked) {
						// Uncheck all radios in the group
						const groupName = radioElement.name;
						const allRadios = levelSelect.querySelectorAll(`input[type='radio'][name='${groupName}']`);
						allRadios.forEach((r) => {
							(r).checked = false;
						});

						// Check the clicked radio
						radioElement.checked = true;

						// Get level and update
						const parent = radioElement.parentElement;
						const level = parseInt(parent.dataset.level || "0", 10);

						ui.notifications.info(`Setting the adventure level to ${level}!`);
						doc.update({ flags: { [moduleJSON.id]: { level } } });

						// Determine changes based on level
						let changes = [11, 3, 3, "1d6"];
						switch (level) {
							case 1:
							case 2:
								changes = [11, 3, 3, "1d6"];
								break;
							case 3:
							case 4:
								changes = [12, 4, 3, "1d6"];
								break;
							case 5:
							case 6:
								changes = [13, 5, 5, "2d4"];
								break;
							case 7:
							case 8:
								changes = [14, 6, 7, "2d6"];
								break;
							case 9:
							case 10:
							case 11:
								changes = [15, 7, 10, "3d6"];
								break;
							case 12:
							case 13:
							case 14:
								changes = [16, 8, 14, "4d6"];
								break;
							case 15:
							case 16:
							case 17:
								changes = [17, 9, 21, "6d6"];
								break;
							case 18:
							case 19:
							case 20:
								changes = [18, 10, 28, "8d6"];
								break;
						}

						// Update all flags
						doc.update({
							flags: {
								[moduleJSON.id]: {
									level,
									dc: changes[0],
									mod: changes[1],
									damage: changes[2],
									damageDice: changes[3],
								},
							},
						});
					} else {
						(this).checked = false;
					}
				});
			});

			// Set checked state for previously chosen level
			const chosenLevel = modFlags.level;
			if (chosenLevel) {
				const chosenOption = levelSelect.querySelector(`[data-level="${chosenLevel}"]`);
				if (chosenOption) {
					const chosenInput = chosenOption.querySelector("input");
					chosenInput.checked = true;
				}
			}
		}
	}

	async _renderPageViews(context, options) {
		const rendered = await super._renderPageViews(context, options);
		this.applyHelianaHeaders()
		return rendered;
	}

	applyHelianaHeaders(target = this.element) {
		const headers = target.querySelectorAll("h2");
		headers.forEach((h2) => {
			const parent = h2.parentElement;
			if (!parent) return;
			parent.classList.add("heliana-style-bg");

			// Find appropriate background based on header width
			const background = backgrounds.find((bg) => h2.offsetWidth <= bg.maxWidth);

			if (background) {
				parent.style.backgroundImage = `url("/modules/${moduleJSON.id}/assets/journals/headers/${background.image}")`;
			}
		});
	}

	async deleteSelf() {
		await this.close({ force: true });
		// @ts-expect-error Intentional for purposes of HMR
		this.document._sheet = null;
	}
}

function registerSheet(sheet) {
	foundry.applications.apps.DocumentSheetConfig.registerSheet(JournalEntry, moduleJSON.id, sheet, {
		label: `${moduleJSON.title} Sheet`,
		canBeDefault: false,
	});
}

function unregisterSheet(sheet) {
	foundry.applications.apps.DocumentSheetConfig.unregisterSheet(JournalEntry, moduleJSON.id, sheet);
}

// Assuming we are inside a Hooks.on("ready")
registerSheet(LootTavernSheet)

if (import.meta.hot) {
	import.meta.hot.accept(async (newModule) => {
		if (!newModule) return;
		let reopenedDocuments = [];

		unregisterSheet(LootTavernSheet);

		for (const type of affectedDocuments) {
			for (const doc of game[type].contents) {
				// @ts-expect-error Custom function for LootTavernSheets
				if (doc.sheet.deleteSelf) {
					// @ts-expect-error Custom function for LootTavernSheets
					await doc.sheet.deleteSelf();
					reopenedDocuments.push(doc.uuid);
				}
			}
		};

		registerSheet(newModule.LootTavernSheet);
		console.log(`Registered new ${newModule.LootTavernSheet.name} sheet.`)

		reopenedDocuments.forEach(async (uuid) => {
			const doc = await fromUuid(uuid);
			if (!doc) return;

			doc?.sheet?.render(true);
		});
		reopenedDocuments = [];
	});
}