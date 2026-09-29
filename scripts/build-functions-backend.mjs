import fs from "node:fs";
import path from "node:path";
import { builtinModules } from "node:module";
import { build } from "esbuild";

const root = process.cwd();
const serverFile = path.join(root, "server.ts");
const functionsDir = path.join(root, "functions");
const rootPackagePath = path.join(root, "package.json");
const functionPackagePath = path.join(functionsDir, "package.json");

const source = fs.readFileSync(serverFile, "utf8");
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
const functionPackage = JSON.parse(fs.readFileSync(functionPackagePath, "utf8"));

const packageNames = new Set();

function addPackage(specifier) {
  if (
    !specifier ||
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    specifier.startsWith("node:")
  ) {
    return;
  }

  const first = specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];

  if (builtinModules.includes(first)) return;
  packageNames.add(first);
}

for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
  addPackage(match[1]);
}

for (const match of source.matchAll(/import\s*\(\s*["']([^"']+)["']\s*\)/g)) {
  addPackage(match[1]);
}

const rootDeps = {
  ...(rootPackage.dependencies || {}),
  ...(rootPackage.devDependencies || {})
};

functionPackage.dependencies ||= {};

for (const name of packageNames) {
  const version =
    rootDeps[name] ||
    functionPackage.dependencies[name];

  if (!version) {
    throw new Error(
      `server.ts imports "${name}", but no dependency version was found`
    );
  }

  functionPackage.dependencies[name] = version;
}

functionPackage.dependencies["firebase-functions"] ||=
  rootDeps["firebase-functions"] || "^6.4.0";

functionPackage.engines = {
  ...(functionPackage.engines || {}),
  node: "22"
};

fs.writeFileSync(
  functionPackagePath,
  JSON.stringify(functionPackage, null, 2) + "\n"
);

await build({
  entryPoints: [serverFile],
  outfile: path.join(functionsDir, "server.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  packages: "external",
  sourcemap: false,
  logLevel: "info"
});

console.log("");
console.log("Canonical backend bundle created.");
console.log("External packages:");
console.log([...packageNames].sort().join(", "));
