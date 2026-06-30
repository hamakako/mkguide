import { readFile, writeFile, mkdir } from 'node:fs/promises'

const catalog = JSON.parse(await readFile(new URL('../src/data/attractionCatalog.json', import.meta.url), 'utf8'))
const outputPath = new URL('../src/data/attractionImages.json', import.meta.url)
const allEntries = Object.values(catalog).flat()
const repairQueries = new Set([
  'Hagia Sophia Istanbul', 'Grand Bazaar Istanbul', 'Great Mosque Mardin',
  'Van Castle Turkey', 'Van Museum Turkey', 'Van Cat House', 'Boztepe Trabzon',
  'Museum of the Future Dubai', 'Palm Jumeirah Dubai', 'Yas Island Abu Dhabi',
  'Warner Bros World Abu Dhabi', 'Al Majaz Waterfront Sharjah', 'Sharjah Aquarium',
  'Little Venice Baku', 'Tufandag Gabala', 'Holy Trinity Cathedral Tbilisi',
  'Mother of Georgia statue', 'Ali and Nino statue Batumi', 'Alphabetic Tower Batumi',
  'Juta Georgia', 'Ramsar Iran', 'Grand Bazaar Tehran', 'Niavaran Palace',
  'National Jewelry Museum Iran', 'Coptic Cairo', 'Valley of the Kings',
  'Bardo National Museum', 'El Ghriba Synagogue', 'Flamingo Island Djerba',
  'Ayn Jarziz Salalah', 'Atatürk Mansion Trabzon'
])
const entries = process.argv.includes('--repair') ? allEntries.filter(item => repairQueries.has(item.query)) : allEntries
let results = {}
if (!process.argv.includes('--refresh')) {
  try { results = JSON.parse(await readFile(outputPath, 'utf8')) } catch {}
}
if (process.argv.includes('--repair')) {
  for (const query of repairQueries) delete results[query]
}

const clean = (value = '') => value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
let nextRequestAt = 0
const rejectedVisuals = /map|logo|icon|flag|coat of arms|drawing|engraving|sketch|plan|section|elevation|illustration|painting|postcard|stamp|diagram|blueprint|lithograph|watercolou?r|aquarell|laengsschnitt|grundriss|floor.?plan|cross.?section|historic print|art project/i
const genericWords = new Set(['the','of','and','in','at','on','to','old','great','grand','national','city','museum','park','palace','castle','fortress','mosque','church','cathedral','temple','beach','island','lake','waterfall','bazaar','souk','market','tower','avenue','square','garden','gardens','aquarium','monastery','medrese','ruins','ancient','archaeological','center','centre','waterfront','corniche','boulevard'])

const normalizedWords = value => clean(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean)
const anchorsFor = query => {
  const words = normalizedWords(query).filter(word => word.length > 2 && !genericWords.has(word))
  return words.length ? words : normalizedWords(query).filter(word => word.length > 2)
}
const matchScore = (candidate, query) => {
  const haystack = ` ${normalizedWords(candidate).join(' ')} `
  const anchors = anchorsFor(query)
  const hits = anchors.filter(word => haystack.includes(` ${word} `) || haystack.includes(word.slice(0, Math.max(4, word.length - 2)))).length
  return hits * 20 - Math.max(0, anchors.length - hits) * 4
}

async function apiRequest(base, params, rateRetries = 0) {
  const wait = Math.max(0, nextRequestAt - Date.now())
  if (wait) await sleep(wait)
  nextRequestAt = Date.now() + 950
  const response = await fetch(`${base}?${params}`, {
    headers: { 'User-Agent': 'MKTravelGuide/1.0 (travel guide image attribution resolver)' },
    signal: AbortSignal.timeout(30000)
  })
  if (response.status === 429 && rateRetries < 7) {
    const retryAfter = Number(response.headers.get('retry-after') || 0) * 1000
    process.stdout.write(`Rate limited; retrying in ${Math.ceil(Math.max(retryAfter + 2000, 5000) / 1000)}s\n`)
    await sleep(Math.max(retryAfter + 2000, Math.min(60000, 5000 * (rateRetries + 1))))
    return apiRequest(base, params, rateRetries + 1)
  }
  if (!response.ok) throw new Error(`MediaWiki ${response.status}`)
  return response.json()
}

async function commonsMetadata(fileName) {
  const params = new URLSearchParams({
    action: 'query', titles: `File:${fileName}`, prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata', iiurlwidth: '1400', format: 'json', formatversion: '2', origin: '*'
  })
  const data = await apiRequest('https://commons.wikimedia.org/w/api.php', params)
  const page = data.query?.pages?.[0]
  const info = page?.imageinfo?.[0]
  if (!info || !/^image\/(jpeg|png|webp)/.test(info.mime ?? '')) return null
  return imageRecord(fileName, info)
}

function imageRecord(fileName, info) {
  const meta = info.extmetadata ?? {}
  return {
    url: info.thumburl || info.url,
    source: info.descriptionurl,
    author: clean(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons'),
    license: clean(meta.LicenseShortName?.value || meta.UsageTerms?.value || 'Wikimedia Commons'),
    file: fileName.replace(/^File:/, '')
  }
}

async function wikipediaLeadImage(item) {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: item.query, gsrnamespace: '0', gsrlimit: '5',
    prop: 'pageimages', piprop: 'name|thumbnail', pithumbsize: '1400', pilimit: '5', format: 'json', formatversion: '2', origin: '*'
  })
  const data = await apiRequest('https://en.wikipedia.org/w/api.php', params)
  const pages = (data.query?.pages ?? [])
    .filter(page => page.pageimage && !rejectedVisuals.test(page.pageimage))
    .sort((a, b) => matchScore(b.title, item.query) - matchScore(a.title, item.query))
  for (const page of pages) {
    if (matchScore(page.title, item.query) < 12) continue
    if (page.thumbnail?.source) {
      return {
        url: page.thumbnail.source,
        source: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(page.pageimage)}`,
        author: 'Wikimedia Commons contributors',
        license: 'See source license',
        file: page.pageimage
      }
    }
  }
  return null
}

async function commonsSearch(item, attempt = 0) {
  const suffix = attempt === 0 ? '' : ' landmark exterior'
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `${item.query}${suffix}`,
    gsrnamespace: '6', gsrlimit: '20', prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata', iiurlwidth: '1400', format: 'json', formatversion: '2', origin: '*'
  })
  const data = await apiRequest('https://commons.wikimedia.org/w/api.php', params)
  const pages = (data.query?.pages ?? []).filter(page => {
    const info = page.imageinfo?.[0]
    return info && /^image\/(jpeg|png|webp)/.test(info.mime ?? '') && !rejectedVisuals.test(page.title)
  }).sort((a, b) => matchScore(b.title, item.query) - matchScore(a.title, item.query))
  const page = pages[0]
  if ((!page || matchScore(page.title, item.query) < 8) && attempt === 0) return commonsSearch(item, 1)
  if (!page) return null
  const info = page.imageinfo[0]
  return imageRecord(page.title, info)
}

async function resolveImage(item) {
  return await wikipediaLeadImage(item) || await commonsSearch(item)
}

let cursor = 0
let completed = 0
const misses = []
async function worker() {
  while (cursor < entries.length) {
    const item = entries[cursor++]
    if (results[item.query]) continue
    try {
      const image = await resolveImage(item)
      if (image) results[item.query] = image
      else misses.push(item.query)
    } catch (error) {
      misses.push(`${item.query}: ${error.message}`)
    }
    completed++
    if (completed % 5 === 0) process.stdout.write(`Resolved ${completed}/${entries.length}\n`)
  }
}

await Promise.all(Array.from({ length: 1 }, worker))
await mkdir(new URL('../src/data/', import.meta.url), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`)
process.stdout.write(`Saved ${Object.keys(results).length} attraction-specific images.\n`)
if (misses.length) process.stdout.write(`Missing ${misses.length}:\n${misses.join('\n')}\n`)
