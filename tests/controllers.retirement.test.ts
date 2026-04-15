import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function collectTypeScriptFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTypeScriptFiles(fullPath));
    } else if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
      files.push(fullPath);
    }
  }
  return files;
}

test("controller files are retired", () => {
  assert.equal(existsSync("src/controllers/accountController.ts"), false);
  assert.equal(existsSync("src/controllers/userController.ts"), false);
  assert.equal(existsSync("src/controllers/characterController.ts"), false);
  assert.equal(existsSync("src/controllers/userCharacterController.ts"), false);
  assert.equal(existsSync("src/controllers/batchStateController.ts"), false);
  assert.equal(existsSync("src/controllers/itemController.ts"), false);
});

test("codebase has no direct controller imports", () => {
  const sourceFiles = collectTypeScriptFiles("src");
  for (const filePath of sourceFiles) {
    const source = readFileSync(filePath, "utf8");
    assert.equal(
      source.includes("@/controllers/"),
      false,
      `Found deprecated controller import in ${filePath}`
    );
  }
});
