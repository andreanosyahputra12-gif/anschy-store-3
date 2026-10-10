// Copies the static site in src/ into dist/, the publish directory configured on Netlify.
import { cpSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
cpSync("src", "dist", { recursive: true });
console.log("Built site into dist/");
