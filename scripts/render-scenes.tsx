// Renders every measured scene to .cache/scenes/<mechanic>__<state>[--<variation>].svg for side-by-side QA
// against the Yan source image. Scenes with variation-dependent shapes are rendered once per combination.
// Run: npx vite-node scripts/render-scenes.tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Arena } from "../src/arena/Arena";
import { allMechanics, geometry } from "../src/data";
import { allSelections, resolveScene, variationsFor } from "../src/model/variants";

mkdirSync(".cache/scenes", { recursive: true });
for (const [key, raw] of Object.entries(geometry.scenes)) {
  const m = allMechanics.find((x) => x.id === key.split("/")[0])!;
  const used = new Set((raw.shapes ?? []).flatMap((s) => Object.keys(s.when ?? {})));
  const spec = variationsFor(m, geometry);
  const sels = used.size ? allSelections({ ...spec, groups: spec.groups.filter((g) => used.has(g.id)) }) : [{}];
  for (const sel of sels) {
    const scene = resolveScene(raw, sel)!;
    const svg = renderToStaticMarkup(<Arena scene={scene} title={key} phase={m.phase} still />)
      .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" font-family="DejaVu Sans, sans-serif" ')
      .replace(/class="[^"]*"/g, "");
    const suffix = Object.entries(sel).map(([k, v]) => `${k}-${v}`).join("_");
    const out = `.cache/scenes/${key.replace("/", "__")}${suffix ? "--" + suffix : ""}.svg`;
    writeFileSync(out, svg);
    console.log(out, scene.image ?? "");
  }
}
