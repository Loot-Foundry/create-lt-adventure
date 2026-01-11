import { id, title } from "moduleJSON";

// https://github.com/foundryvtt/pf2e/blob/master/src/scripts/hooks/get-prosemirror-menu-dropdowns.ts
Hooks.on("getProseMirrorMenuDropDowns", (menu, dropdowns) => {
	const toggleMark = foundry.prosemirror.commands.toggleMark;
	const wrapIn = foundry.prosemirror.commands.wrapIn;
	if ("format" in dropdowns) {
		dropdowns.format.entries.push({
			action: `${id}`,
			title,
			children: [
				{
					action: "green-check",
					class: `${id} Checks-and-Saves`,
					title: "Checks and Saves",
					mark: menu.schema.marks.span,
					attrs: { _preserve: { class: `${id} Checks-and-Saves` } },
					priority: 1,
					cmd: toggleMark(menu.schema.marks.span, {
						_preserve: { class: `${id} Checks-and-Saves` },
					}),
				},
				{
					action: "sidebar",
					class: "sidebar",
					title: "Sidebar",
					node: menu.schema.nodes.section,
					attrs: { _preserve: { class: `${id} sidebar right` } },
					priority: 1,
					cmd: () => {
						menu._toggleBlock(menu.schema.nodes.section, wrapIn, {
							attrs: { _preserve: { class: `${id} sidebar right` } },
						});
						return true;
					},
				},
			],
		});
	}
});

if (import.meta.hot) {
	import.meta.hot.accept()
	import.meta.hot.dispose(() => {
		Hooks.off(hook)
	});
}