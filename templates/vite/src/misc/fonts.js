import { id } from "moduleJSON";

CONFIG.fontDefinitions["Candara"] = {
	editor: true,
	fonts: [
		{ urls: [`modules/${id}/assets/journals/fonts/Candara.ttf`] }
	]
};

CONFIG.fontDefinitions["Coinage Caps Kruger Gray"] = {
	editor: true,
	fonts: [
		{ urls: [`modules/${id}/assets/journals/fonts/CoinageCapsKrugerGray.ttf`] }
	]
};

CONFIG.fontDefinitions["Geizer"] = {
	editor: true,
	fonts: [
		{ urls: [`modules/${id}/assets/journals/fonts/GeizerModifiedO.otf`] }
	]
};

CONFIG.fontDefinitions["Kings Caslon"] = {
	editor: true,
	fonts: [
		{ urls: [`modules/${id}/assets/journals/fonts/Kings Caslon/Kings_Caslon_Regular.otf`] },
		{ urls: [`modules/${id}/assets/journals/fonts/Kings Caslon/Kings_Caslon_Bold.otf`], weight: 700 },
		{ urls: [`modules/${id}/assets/journals/fonts/Kings Caslon/Kings_Caslon_Italic.otf`], style: "italic" },
		{ urls: [`modules/${id}/assets/journals/fonts/Kings Caslon/Kings_Caslon_BoldItalic.otf`], style: "italic", weight: 700 }
	]
};

CONFIG.fontDefinitions["Modesto"] = {
	editor: true,
	fonts: [
		{ urls: [`modules/${id}/assets/journals/fonts/Modesto/ModestoText_Light.otf`], weight: 300 },
		{ urls: [`modules/${id}/assets/journals/fonts/Modesto/ModestoText_Medium.otf`], weight: 500 },
		{ urls: [`modules/${id}/assets/journals/fonts/Modesto/ModestoText_Bold.otf`], weight: 700 },
		{ urls: [`modules/${id}/assets/journals/fonts/Modesto/ModestoText_LightItalic.otf`], style: "italic", weight: 300 },
		{ urls: [`modules/${id}/assets/journals/fonts/Modesto/ModestoText_BoldItalic.otf`], style: "italic", weight: 700 },
		{ urls: [`modules/${id}/assets/journals/fonts/Modesto/ModestoText_MediumItalic.otf`], style: "italic", weight: 500 },
	]
};

if (import.meta.hot) {
	import.meta.hot.accept();
}