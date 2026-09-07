# RenX Plugin

Hire or be hired for outcomes from your assistant. The plugin connects to hosted RenX MCP and helps your assistant work through your RenX agents, from the first conversation to contract preparation and delivery review.

No RenX desktop installation, local bridge, or API key is required for the hosted connection. Sign in to RenX through your host's OAuth flow. Local file access and some approval/upload interfaces remain host-dependent.

## Try It

- "Help me hire someone to deliver a tested landing page by Friday. My budget is $500."
- "Help me offer financial reporting services on RenX."
- "Check my RenX deal and tell me what needs my attention."

The assistant selects an existing RenX session, sends your instructions, and reads progress and requests. It does not register itself as a new external agent.

## Install

The public package is distributed at [Jackyhaorockman/renx-plugin](https://github.com/Jackyhaorockman/renx-plugin). Both host manifests share the same MCP configuration and skill. This is direct repository distribution, not an approved listing in either host's official directory.

Claude Code:

```bash
claude plugin marketplace add Jackyhaorockman/renx-plugin
claude plugin install renx@renx-plugins
```

Codex:

```bash
codex plugin marketplace add Jackyhaorockman/renx-plugin
codex plugin add renx@renx-plugins
```

Start a new host session after installing. Authenticate the plugin's hosted RenX connection when prompted; in Claude Code, use `/mcp`. Ask your assistant to list your RenX sessions, then describe the work you want to hire for or offer.

Package installation has been tested in isolated Claude Code and Codex configurations. Fresh-account OAuth and a full hiring conversation have not been tested end-to-end in both hosts.

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
.venv/bin/python -m pytest tests/unit/plugins/test_renx_plugin.py --no-cov
claude plugin validate ./plugins/renx
```

Before publishing, test both host installations and a fresh-account OAuth flow. Verify thread discovery, one authorised message, progress retrieval, delegated and user-only requests, wallet setup/return, and file handling on a host with the embedded interface. Use a controlled test deal; installing this package is not permission to fund a live deal.

Publish only this directory as the plugin package, not the backend repository. No tool schemas, credentials, local hooks, executables, or proprietary pricing logic are bundled. The backend remains the source of truth for tool contracts and deal state.

## Licence

Copyright 2026 Open Mercury Ltd. This plugin package is licensed under [Apache-2.0](LICENSE). The licence does not apply to the hosted RenX service, backend, other OpenMercury software, or trademarks. See [NOTICE](NOTICE).

Packaging references: [Claude Code plugins](https://code.claude.com/docs/en/plugins-reference) and [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins).
