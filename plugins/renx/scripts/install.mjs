#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REPOSITORY = "Jackyhaorockman/renx-plugin";
const MARKETPLACE = "renx-plugins";
const PLUGIN = `renx@${MARKETPLACE}`;
const HOSTS = ["codex", "claude"];
const HELP = `Usage: renx-setup [--host codex|claude|all] [--dry-run]

Install the RenX plugin using the host's native plugin commands.
Without --host, install for supported CLIs found on PATH.
--dry-run checks the hosts and prints commands without installing anything.
--help shows this help. --version shows the installer version.

Local-agent mode requires signed-in RenX Desktop and connection approval.
Download Desktop: https://renx.openmercury.com/#download
`;

function options(argv) {
  let host;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--host" && !host && HOSTS.concat("all").includes(argv[i + 1])) {
      host = argv[++i];
    } else if (argv[i] === "--dry-run") {
      dryRun = true;
    } else {
      throw new Error(`Invalid argument: ${argv[i]}. ${HELP}`);
    }
  }
  return { host, dryRun };
}

function run(command, args, capture = false) {
  if (process.platform === "win32") {
    const found = spawnSync("where.exe", [command], { timeout: 15_000, stdio: "ignore" });
    if (found.status !== 0) return { error: { code: "ENOENT" }, status: null };
  }
  // Windows npm shims are .cmd files; all commands and arguments are fixed here.
  return spawnSync(command, args, {
    shell: process.platform === "win32",
    stdio: capture ? "pipe" : "inherit",
    encoding: "utf8",
    timeout: capture ? 15_000 : 120_000,
  });
}

function succeeded(result) {
  return !result.error && result.status === 0 && !result.signal;
}

function marketplaceState(host, result) {
  let data;
  try {
    data = JSON.parse(result.stdout);
  } catch {
    throw new Error(`${host} returned an invalid marketplace list. Update ${host} and retry.`);
  }
  const entries = host === "codex" ? data?.marketplaces : data;
  if (!Array.isArray(entries)) {
    throw new Error(`${host} returned an unsupported marketplace list. Update ${host} and retry.`);
  }
  const existing = entries.find((entry) => entry?.name === MARKETPLACE);
  if (!existing) return false;
  const source = host === "codex" ? existing.marketplaceSource?.source : existing.repo ?? existing.url;
  const trustedSources = [REPOSITORY, `https://github.com/${REPOSITORY}`, `https://github.com/${REPOSITORY}.git`];
  if (!trustedSources.includes(source)) {
    throw new Error(`${host}: ${MARKETPLACE} already exists with a different or unrecognised source. Review it in ${host} before retrying; nothing was overwritten.`);
  }
  return true;
}

/** Install only the plugin; leave runtime setup, sign-in and approval to Desktop. */
export function install(argv, { execute = run, log = console.log } = {}) {
  if (argv.length === 1 && argv[0] === "--help") {
    log(HELP);
    return;
  }
  if (argv.length === 1 && argv[0] === "--version") {
    log(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
    return;
  }
  const { host, dryRun } = options(argv);
  const requested = host && host !== "all" ? [host] : HOSTS;
  const targets = [];
  // Check every selected host before modifying any of them.
  for (const name of requested) {
    const result = execute(name, ["plugin", "marketplace", "list", "--json"], true);
    if (result.error?.code === "ENOENT" && !host) continue;
    if (!succeeded(result)) {
      throw new Error(`Cannot read ${name}'s plugin marketplaces. Install or update its CLI, check it is on PATH, then retry with --host ${name}.`);
    }
    targets.push({ name, registered: marketplaceState(name, result) });
  }
  if (!targets.length) {
    throw new Error("No supported CLI found on PATH. Install Codex or Claude Code, then rerun RenX setup. RenX Desktop alone does not provide these CLIs.");
  }
  for (const { name, registered } of targets) {
    const commands = [];
    if (!registered) commands.push(["plugin", "marketplace", "add", REPOSITORY]);
    commands.push(name === "codex"
      ? ["plugin", "add", PLUGIN]
      : ["plugin", "install", PLUGIN, "--scope", "user"]);
    for (const args of commands) {
      log(`${dryRun ? "Would run" : "Running"}: ${name} ${args.join(" ")}`);
      if (!dryRun && !succeeded(execute(name, args))) {
        throw new Error(`${name} installation did not finish. Check the host output above and retry. Completed host installs are kept; no sign-in or agent connection was performed.`);
      }
    }
    if (!dryRun) log(`RenX plugin installed for ${name}.`);
  }
  if (dryRun) {
    log("Dry run complete. No plugins, MCP settings or credentials were changed.");
    return;
  }
  log(`\nNext: open RenX Desktop and sign in on this machine so it can register the local MCP connection.
Download Desktop: https://renx.openmercury.com/#download
Start a new Codex or Claude Code session, then ask:
"Use renx-local-agent to connect this session as my developer agent."
Approve the connection in RenX Desktop or mobile. Keep Desktop or its approved background bridge running.
The plugin also supports hosted access via browser sign-in; that is optional for local-agent mode.
Plugin installation alone does not connect an agent or grant permissions.`);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    install(process.argv.slice(2));
  } catch (error) {
    console.error(`RenX setup failed: ${error.message}`);
    process.exitCode = 1;
  }
}
