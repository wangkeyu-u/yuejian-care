import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workerPath = resolve(projectRoot, "dist/server/index.js");
const manifestPath = resolve(projectRoot, "dist/.openai/hosting.json");

const [source, manifest] = await Promise.all([
  readFile(workerPath, "utf8"),
  readFile(manifestPath, "utf8"),
]);
JSON.parse(manifest);

// A data URL forces ESM parsing even though the generated output has no package.json.
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const workerModule = await import(moduleUrl);
assert.equal(
  typeof workerModule.default?.fetch,
  "function",
  `${pathToFileURL(workerPath)} must export default.fetch`,
);

const site = workerModule.default;
const home = await site.fetch(new Request('https://validate.test/'));
assert.equal(home.status, 200);
assert.match(home.headers.get('Content-Security-Policy'), /connect-src 'self'/);
const html = await home.text();
assert.match(html, /id="day-dialog"/);
assert.match(html, /id="day-analysis"/);
for (const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css)(?:\?[^\"]*)?)"/g)) {
  const response = await site.fetch(new Request(new URL(match[1], 'https://validate.test/')));
  assert.equal(response.status, 200, `Missing asset: ${match[1]}`);
}
assert.equal((await site.fetch(new Request('https://validate.test/PERSONAL-PROFILE.md'))).status,404);
assert.equal((await site.fetch(new Request('https://validate.test/api/analyze',{method:'POST',headers:{Origin:'https://validate.test','Content-Type':'application/json'},body:'{}'}))).status,401);
assert.equal((await site.fetch(new Request('https://validate.test/api/day',{method:'POST',headers:{Origin:'https://validate.test','Content-Type':'application/json'},body:'{}'}))).status,401);
console.log("Artifact exports default.fetch; page, assets, CSP and AI route checks passed.");
