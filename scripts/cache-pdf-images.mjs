import { createHash } from 'node:crypto'
import { mkdir, writeFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const catalog = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../src/data/attractionCatalog.json', import.meta.url), 'utf8'))
const images = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../src/data/attractionImages.json', import.meta.url), 'utf8'))
const cache = fileURLToPath(new URL('../tmp/pdfs/images/', import.meta.url))
await mkdir(cache, { recursive: true })

const needed = new Set()
for (const attractions of Object.values(catalog)) {
  needed.add(attractions[0].query)
  for (let day = 1; day <= 7; day++) needed.add(attractions[((day - 1) * 2) % attractions.length].query)
}
const entries = [...needed].map(query => ({ query, info: images[query] })).filter(item => item.info)

let cursor = 0
let finished = 0
let failed = 0
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function download(item, attempt = 0) {
  const name = `${createHash('sha1').update(item.query).digest('hex')}.jpg`
  const path = `${cache}/${name}`
  try { await access(path); return }
  catch {}
  try {
    const response = await fetch(item.info.url, { headers: { 'User-Agent': 'MKTravelGuide/1.0' }, signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(String(response.status))
    await writeFile(path, Buffer.from(await response.arrayBuffer()))
  } catch (error) {
    if (attempt < 2) { await sleep(1500 * (attempt + 1)); return download(item, attempt + 1) }
    failed++
    process.stdout.write(`Failed ${item.query}: ${error.message}\n`)
  }
}
async function worker() {
  while (cursor < entries.length) {
    const item = entries[cursor++]
    await download(item)
    finished++
    if (finished % 20 === 0) process.stdout.write(`Cached ${finished}/${entries.length}\n`)
  }
}
await Promise.all(Array.from({ length: 8 }, worker))
process.stdout.write(`Cached PDF photographs: ${finished - failed}/${entries.length}; failed ${failed}.\n`)
