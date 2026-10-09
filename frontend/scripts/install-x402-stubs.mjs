import { cpSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(__dirname, "x402-stubs");
const target = path.join(__dirname, "..", "node_modules", "@x402");

if (!existsSync(target)) {
  mkdirSync(target, { recursive: true });
}

cpSync(source, target, { recursive: true });

console.log("Installed @x402 stub packages (workaround for @coinbase/cdp-sdk's unpublished @x402/* dependencies).");
