const mod = (await Bun.file("../module.json").json());
const pack = (await Bun.file("../package.json").json());

// Module
mod.esmodules = [`dist/${mod.id}.js`];
mod.styles = [`dist/${mod.id}.css`];

// Package
pack.name = mod.id;

await Bun.write("../module.json", JSON.stringify(mod, null, "\t"));
await Bun.write("../package.json", JSON.stringify(pack, null, "\t"));

export { };
