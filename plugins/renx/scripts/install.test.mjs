import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { install } from "./install.mjs";

const repo = "Jackyhaorockman/renx-plugin";
const packageRoot = new URL("../", import.meta.url);

function harness({ missing = [], existing = {}, fail } = {}) {
  const calls = [];
  const output = [];
  return {
    calls,
    output,
    execute(host, args, capture) {
      calls.push({ host, args, capture });
      if (missing.includes(host)) return { error: { code: "ENOENT" }, status: null };
      if (fail?.(host, args)) return { status: 1 };
      if (capture) {
        const entries = existing[host] ? [{
          name: "renx-plugins", repo: existing[host],
          marketplaceSource: { source: existing[host] },
        }] : [];
        return { status: 0, stdout: JSON.stringify(host === "codex" ? { marketplaces: entries } : entries) };
      }
      return { status: 0 };
    },
    log(message) { output.push(message); },
  };
}

test("default installs both detected hosts using native commands", () => {
  const h = harness();
  install([], h);
  assert.deepEqual(h.calls.filter(c => !c.capture), [
    { host: "codex", args: ["plugin", "marketplace", "add", repo], capture: undefined },
    { host: "codex", args: ["plugin", "add", "renx@renx-plugins"], capture: undefined },
    { host: "claude", args: ["plugin", "marketplace", "add", repo], capture: undefined },
    { host: "claude", args: ["plugin", "install", "renx@renx-plugins", "--scope", "user"], capture: undefined },
  ]);
  assert.match(h.output.at(-1), /open RenX Desktop and sign in/);
  assert.match(h.output.at(-1), /Approve the connection/);
  assert.match(h.output.at(-1), /optional for local-agent mode/);
});

test("auto detection skips absent hosts", () => {
  const h = harness({ missing: ["claude"] });
  install([], h);
  assert.equal(h.calls.filter(c => !c.capture).length, 2);
  assert.throws(() => install([], harness({ missing: ["codex", "claude"] })), /No supported CLI/);
});

test("explicit host selection and all require the selected CLIs", () => {
  const h = harness();
  install(["--host", "claude"], h);
  assert.ok(h.calls.every(c => c.host === "claude"));
  for (const argv of [["--host", "claude"], ["--host", "all"]]) {
    const missing = harness({ missing: ["claude"] });
    assert.throws(() => install(argv, missing), /Cannot read claude/);
    assert.ok(missing.calls.every(c => c.capture));
  }
});

test("rerun reuses only marketplaces from the expected repository", () => {
  const h = harness({ existing: { codex: `https://github.com/${repo}.git`, claude: repo } });
  install([], h);
  assert.equal(h.calls.filter(c => !c.capture).length, 2);
  assert.ok(h.calls.filter(c => !c.capture).every(c => c.args[1] !== "marketplace"));
  const conflict = harness({ existing: { claude: "someone/other-plugin" } });
  assert.throws(() => install([], conflict), /different or unrecognised source/);
  assert.ok(conflict.calls.every(c => c.capture));
});

test("dry run prints commands but performs no install", () => {
  const h = harness();
  install(["--dry-run"], h);
  assert.ok(h.calls.every(c => c.capture));
  assert.equal(h.output.filter(line => line.startsWith("Would run:")).length, 4);
  assert.match(h.output.at(-1), /No plugins, MCP settings or credentials were changed/);
});

test("invalid arguments never execute a command", () => {
  for (const args of [["--host"], ["--host", "cursor"], ["--host", "codex; echo nope"], ["--yes"], ["--host", "codex", "--host", "claude"]]) {
    const h = harness();
    assert.throws(() => install(args, h), /Invalid argument/);
    assert.equal(h.calls.length, 0);
  }
});

test("help and version work without any host CLI", () => {
  const h = harness();
  install(["--help"], h);
  install(["--version"], h);
  assert.equal(h.calls.length, 0);
  assert.equal(h.output[1], JSON.parse(readFileSync(new URL("package.json", packageRoot))).version);
});

test("unsupported, malformed and failed marketplace lists prevent all installs", () => {
  for (const result of [{ status: 0, stdout: "oops" }, { status: 0, stdout: "null" }, { status: 1 }, { status: null, signal: "SIGTERM" }, { status: null, error: { code: "ETIMEDOUT" } }]) {
    const h = harness();
    const execute = h.execute;
    h.execute = (host, args, capture) => host === "claude" ? result : execute(host, args, capture);
    assert.throws(() => install([], h));
    assert.ok(h.calls.every(c => c.capture));
  }
});

test("native command failure stops execution without claiming success", () => {
  const h = harness({ fail: (_host, args) => args[1] === "add" });
  assert.throws(() => install([], h), /installation did not finish/);
  assert.ok(!h.output.some(line => /plugin installed/.test(line)));
  assert.ok(!h.calls.some(c => c.host === "claude" && !c.capture));
});

test("packaged command has a working entrypoint and no lifecycle scripts or dependencies", () => {
  const manifest = JSON.parse(readFileSync(new URL("package.json", packageRoot)));
  assert.equal(manifest.name, "@openmercury/renx");
  assert.equal(manifest.publishConfig.registry, "https://registry.npmjs.org/");
  assert.equal(manifest.dependencies, undefined);
  assert.deepEqual(Object.keys(manifest.scripts), ["test"]);
  const entry = new URL(manifest.bin["renx-setup"], packageRoot);
  const result = spawnSync(process.execPath, [fileURLToPath(entry), "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: renx-setup/);
  const invalid = spawnSync(process.execPath, [fileURLToPath(entry), "--oops"], { encoding: "utf8" });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /RenX setup failed/);
});

test("npm-style symlink entrypoint runs the CLI", { skip: process.platform === "win32" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "renx-setup-test-"));
  try {
    const bin = join(dir, "renx-setup");
    symlinkSync(fileURLToPath(new URL("scripts/install.mjs", packageRoot)), bin);
    const result = spawnSync(process.execPath, [bin, "--help"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage: renx-setup/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("npm tarball excludes the bridge, skills, test fixtures and other scripts", () => {
  const cache = mkdtempSync(join(tmpdir(), "renx-pack-test-"));
  try {
    const result = spawnSync("npm", ["pack", "--dry-run", "--ignore-scripts", "--json", "--cache", cache], {
      cwd: fileURLToPath(packageRoot),
      shell: process.platform === "win32",
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.equal(result.status, 0, result.stderr);
    const [tarball] = JSON.parse(result.stdout);
    assert.deepEqual(tarball.files.map(file => file.path).sort(), [
      "LICENSE", "NOTICE", "README.md", "package.json", "scripts/install.mjs",
    ]);
  } finally {
    rmSync(cache, { recursive: true, force: true });
  }
});
