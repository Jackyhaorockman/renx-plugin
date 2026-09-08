import { mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const json = (value) => `${JSON.stringify(value, null, 2)}\n`

/** Build a self-contained WorkBuddy connector from the shared plugin sources. */
export async function buildWorkbuddy(output) {
  const requested = resolve(output)
  const destination = resolve(await realpath(dirname(requested)), basename(requested))
  const withinPackage = relative(await realpath(packageRoot), destination)
  if (withinPackage !== '..' && !withinPackage.startsWith(`..${sep}`) && !isAbsolute(withinPackage)) {
    throw new Error('Choose an output directory outside the plugin package.')
  }

  const manifest = JSON.parse(await readFile(new URL('../plugin.json', import.meta.url), 'utf8'))
  const shared = JSON.parse(await readFile(new URL('../mcp.json', import.meta.url), 'utf8'))
  const server = shared.mcpServers.renx
  if (server.type !== 'streamable-http' || Object.keys(shared.mcpServers).length !== 1) {
    throw new Error('WorkBuddy export requires the single shared Streamable HTTP server.')
  }
  const description = 'Find clients, hire talent, and manage pay-for-results deals through your RenX agents.'
  const metadata = {
    name: 'RenX',
    name_en: 'RenX',
    name_zh: 'RenX',
    description,
    description_en: description,
    description_zh: '通过 RenX 智能体寻找客户、招聘人才，并管理按结果付费的服务交易。',
    source: 'openmercury-renx',
    type: 'mcp',
    version: manifest.version,
    minWorkbuddyVersion: '4.24.0',
    examples_en: [
      'Help me hire someone to build a landing page by Friday.',
      'Help me offer financial reporting services on RenX.',
    ],
    examples_zh: [
      '帮我找人在周五前完成一个落地页。',
      '帮我在 RenX 上提供财务报告服务。',
    ],
  }
  const files = new Map([
    ['connector-meta.json', json(metadata)],
    ['mcp.json', json({ mcpServers: { renx: { type: 'streamableHttp', url: server.url } } })],
  ])
  for (const [source, target] of [
    ['skills/renx-hiring/SKILL.md', 'skills/renx-hiring/SKILL.md'],
    ['assets/icon.svg', 'icon.svg'],
    ['LICENSE', 'LICENSE'],
    ['NOTICE', 'NOTICE'],
  ]) {
    files.set(target, await readFile(resolve(packageRoot, source)))
  }

  // Refuse existing destinations; never merge a release into a stale package.
  await mkdir(destination)
  try {
    for (const [name, content] of files) {
      await mkdir(dirname(resolve(destination, name)), { recursive: true })
      await writeFile(resolve(destination, name), content, { flag: 'wx' })
    }
  } catch (error) {
    await rm(destination, { recursive: true, force: true })
    throw error
  }
  return destination
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/build-workbuddy.mjs <new-output-directory>')
    console.log(`WorkBuddy connector built: ${await buildWorkbuddy(process.argv[2])}`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
