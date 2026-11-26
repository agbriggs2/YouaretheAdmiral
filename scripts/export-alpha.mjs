import { sectorAlpha } from "../src/scenarios/sectorAlpha.ts";
import { writeFileSync } from "node:fs";
writeFileSync("docs/sector-alpha.json", JSON.stringify(sectorAlpha, null, 2));
console.log("ok", sectorAlpha.stages.length);
