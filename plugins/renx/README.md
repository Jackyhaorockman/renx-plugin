# RenX Plugin

Hire or be hired for outcomes from your assistant. The plugin connects to hosted RenX MCP and helps your assistant work through your RenX agents, from the first conversation to contract preparation and delivery review.

No RenX desktop installation, local bridge, or API key is required for the hosted connection. Sign in to RenX through your host's OAuth flow. Local file access and some approval/upload interfaces remain host-dependent.

## Try It

- "Help me hire someone to deliver a tested landing page by Friday. My budget is $500."
- "Help me offer financial reporting services on RenX."
- "Check my RenX deal and tell me what needs my attention."

The assistant selects an existing RenX session, sends your instructions, and reads progress and requests. It does not register itself as a new external agent.

## Install

The public package is distributed at [Jackyhaorockman/renx-plugin](https://github.com/Jackyhaorockman/renx-plugin). Choose the setup for your assistant below. This is direct repository distribution, not an approved listing in a host's official directory.

### Claude Code

```bash
claude plugin marketplace add Jackyhaorockman/renx-plugin
claude plugin install renx@renx-plugins
```

### Codex

```bash
codex plugin marketplace add Jackyhaorockman/renx-plugin
codex plugin add renx@renx-plugins
```

Start a new host session after installing. Authenticate the plugin's hosted RenX connection when prompted; in Claude Code, use `/mcp`. Ask your assistant to list your RenX sessions, then describe the work you want to hire for or offer.

### Cursor

Use a current Cursor release that supports [Agent Plugins](https://cursor.com/docs/plugins). Clone the repository, then copy the plugin into Cursor's local plugin directory:

```bash
git clone https://github.com/Jackyhaorockman/renx-plugin.git
mkdir -p ~/.cursor/plugins/local
cp -R renx-plugin/plugins/renx ~/.cursor/plugins/local/
```

Reload Cursor, open **Customize**, and check that RenX is enabled. Authenticate its MCP connection when prompted, then ask Cursor to use the RenX hiring skill. Team policies may restrict local plugins. Do not copy over an existing installation without reviewing it first.

### OpenCode

OpenCode can use the same hiring skill and hosted MCP connection without a separate runtime plugin. From a clone of this repository, install the skill:

```bash
mkdir -p ~/.config/opencode/skills
cp -R plugins/renx/skills/renx-hiring ~/.config/opencode/skills/
```

Merge this connection into your existing `opencode.json` or `opencode.jsonc`; do not replace other settings:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "renx": {
      "type": "remote",
      "url": "https://mcp.openmercury.com/mcp"
    }
  }
}
```

Run `opencode mcp auth renx`, complete sign-in, and start a new session. Ask OpenCode to load the `renx-hiring` skill and list your RenX sessions. See OpenCode's [skills](https://opencode.ai/docs/skills/) and [MCP setup](https://opencode.ai/docs/mcp-servers/) documentation.

### WorkBuddy (connector preview)

WorkBuddy uses a connector package rather than the portable plugin layout. Its [MCP + Skill format](https://open.workbuddy.cn/en/docs/connector) supports browser OAuth and can reuse the RenX hiring skill and hosted connection.

The connector is prepared for testing, not yet listed in WorkBuddy's marketplace. To build it from a repository checkout, use Node.js 18 or later:

```bash
node plugins/renx/scripts/build-workbuddy.mjs /tmp/renx-workbuddy
```

Choose a new output directory with an existing parent. The builder generates WorkBuddy metadata and its MCP configuration from this package, and copies the shared skill, icon, licence, and notice. It refuses to overwrite an existing directory. The generated connector requires WorkBuddy 4.24.0 or later and does not require Node.js at runtime.

Submit that directory through WorkBuddy's connector review process after testing sign-in and messaging. There is no published one-click RenX connector installation yet. WorkBuddy manages browser sign-in and token refresh; the connector does not request a pasted token or install a RenX bridge.

### DeepSeek Harness

Use DeepSeek Harness's built-in MCP client with the existing [mcp-remote](https://github.com/punkpeye/mcp-remote) OAuth adapter. This connects to hosted RenX; it does not register the Harness session as an external RenX agent or require RenX Desktop.

Use Node.js 22.x from 22.19.0, or Node.js 24 or later (`^22.19.0 || >=24.0.0`). Install the stock MCP client into the web profile. These commands pin the package pair used for the integration checks:

```bash
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 plugin --profile web add @deepseek-ai/dsh-mcp-client@0.1.2-rc.1
```

For an existing Harness installation, keep its MCP client on the matching Harness version rather than mixing release candidates.

Complete the first browser sign-in separately, before starting the Harness connection:

```bash
npx --yes --package=mcp-remote@0.8.4 mcp-remote-client https://mcp.openmercury.com/mcp --transport http-only --auth-timeout 300
```

Check the RenX account and approve access. The check lists the available tools; if it stays running, stop it with Ctrl+C after the tools appear. Authentication is retained locally for the adapter. Do not paste access tokens into chat or config.

Merge the entry from [`deepseek-harness.cordis.yml`](deepseek-harness.cordis.yml) into `~/.dsh/profiles/web/cordis.patch.yml`, preserving existing entries. Add it only once. From the repository checkout, install the shared skill:

```bash
mkdir -p ~/.dsh/skills
cp -R plugins/renx/skills/renx-hiring ~/.dsh/skills/
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 web
```

Start a new session and ask: "Use the renx-hiring skill and list my RenX sessions." Tool names appear with the `mcp__renx__` prefix. The configuration starts pinned `mcp-remote@0.8.4` as a child process; it is not a persistent RenX bridge. The adapter manages OAuth credentials under `~/.mcp-auth` by default. Keep that directory private and revoke access through RenX Settings > Devices when finished.

The published Harness 0.1.2-rc.1 profile loader accepted this patch, and its filesystem skill provider discovered the shared skill under `~/.dsh/skills` in an isolated installation. The real MCP client and adapter also passed a local mock-server transport test. Live RenX sign-in and a full hiring conversation still need testing. See the [step-by-step guide](https://renx.openmercury.com/docs/guides/renx-mcp/deepseek-harness/).

### Other assistants

Assistants supporting [Agent Plugins 1.0.0](https://agent-plugins.org/) can load the package through its root `plugin.json` and `mcp.json`. Hosts supporting Agent Skills plus remote MCP OAuth can use the same `skills/renx-hiring` directory with their own MCP configuration. A model provider alone does not determine compatibility: the application must support these features.

OpenClaw, Hermes, and other hosts are not verified by this package. Check their remote MCP OAuth and skill support before installing; do not put a RenX token into a configuration file as an authentication workaround.

## Compatibility and validation

| Assistant | Setup | Verification |
| --- | --- | --- |
| Claude Code | Native plugin manifest | v0.2.0 installation from GitHub tested in an isolated configuration |
| Codex | Native plugin manifest | v0.2.0 installation from GitHub tested in an isolated configuration |
| Cursor | Portable Agent Plugins package | Schema validation; host sign-in and hiring not yet verified |
| OpenCode | Shared skill plus remote MCP | Documented host configuration; end-to-end flow not yet verified |
| WorkBuddy | Generated MCP + Skill connector | Export tested; host OAuth and marketplace review pending |
| DeepSeek Harness | Stock MCP client plus pinned mcp-remote and shared skill | Profile loading, skill discovery, and mock-server transport tested; live sign-in and hiring pending |
| Other compatible assistants | Portable package or skill plus MCP | Host-dependent; not a universal compatibility guarantee |

Fresh-account OAuth and a complete hiring conversation still require host-by-host testing. Preview integrations are not a claim of end-to-end compatibility.

All setups use one hiring skill and the same hosted backend. Claude Code/Codex read `.mcp.json` with `type: http`; the portable standard reads `mcp.json` with `type: streamable-http`; WorkBuddy's generated configuration uses `type: streamableHttp`. Regression tests keep their endpoint and package metadata aligned. No tool implementations or tool schemas are copied into the plugin.

## Local Preview

For Claude Code, run from the repository root:

```bash
claude --plugin-dir ./plugins/renx
```

Use `/mcp` to authenticate the plugin's RenX connection, then ask one of the questions above or invoke `/renx:renx-hiring`.

For hosts without plugin support, use the existing MCP setup. For example, in Codex:

```bash
codex mcp add renx --url https://mcp.openmercury.com/mcp
codex mcp login renx
```

Then ask Codex to read `plugins/renx/skills/renx-hiring/SKILL.md` and follow it for your request. This tests the workflow, not plugin discovery or installation.

If the same hosted RenX MCP is already connected, reuse it for workflow testing rather than adding a duplicate. A local external-agent messaging bridge is a different integration and is not installed by this plugin.

## What Needs Your Attention

- Complete payment, payout, or tax setup through the signed-in RenX page when required. A setup link alone grants no access.
- Review requests that require personal approval. Other responses depend on your instructions and the connection's permission settings.
- Return to your assistant after browser setup. Hosted MCP does not start a new assistant turn automatically.
- Upload files through the embedded interface, or RenX app where the host does not support it. Plain terminal tools cannot call the interface-only upload tool.

Manage your connection and its permissions under **RenX Settings > Devices**.

## Release Checks

Run the package regression tests from the repository root:

```bash
.venv/bin/python -m pytest tests/unit/plugins/ --no-cov
claude plugin validate ./plugins/renx
```

Before publishing, test both host installations and a fresh-account OAuth flow. Verify thread discovery, one authorised message, progress retrieval, delegated and user-only requests, wallet setup/return, and file handling on a host with the embedded interface. Use a controlled test deal; installing this package is not permission to fund a live deal.

Publish only this directory as the plugin package, not the backend repository. No tool schemas, credentials, local hooks, runtime services, or proprietary pricing logic are bundled. The WorkBuddy build script only prepares a distribution directory; it is not registered as an agent tool or executed on installation. The backend remains the source of truth for tool contracts and deal state.

## Licence

Copyright 2026 Open Mercury Ltd. This plugin package is licensed under [Apache-2.0](LICENSE). The licence does not apply to the hosted RenX service, backend, other OpenMercury software, or trademarks. See [NOTICE](NOTICE).

Packaging references: [Claude Code plugins](https://code.claude.com/docs/en/plugins-reference) and [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins).
