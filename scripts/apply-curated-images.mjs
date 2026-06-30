import { readFile, writeFile } from 'node:fs/promises'

const outputPath = new URL('../src/data/attractionImages.json', import.meta.url)
const images = JSON.parse(await readFile(outputPath, 'utf8'))
delete images['Flamingo Island Djerba']

const curated = {
  'Great Mosque Mardin': 'Mardin Ulu Cami DSCF9803.jpg',
  'Van Castle Turkey': 'Van Fortress From Northwest.JPG',
  'Van Museum Turkey': 'Van Museum building.jpg',
  'Boztepe Trabzon': 'Boztepe, Trabzon.jpg',
  'Al Majaz Waterfront Sharjah': 'Al Majaz Waterfront, Sharjah UAE.jpg',
  'Sharjah Aquarium': 'Sharjah Aquarium.jpg',
  'Mother of Georgia statue': 'Kartlis Deda - Mother of a Kartli or Mother of a Georgian - Photo by Mostafa Meraji 01.jpg',
  'Ali and Nino statue Batumi': 'Ali and Nino (2).jpg',
  'Alphabetic Tower Batumi': 'Alphabet Tower, Batumi.jpg',
  'Juta Georgia': 'Juta, Kazbegi Municipality, Georgia.jpg',
  'Ayn Jarziz Salalah': 'Ayn garziz salalah.jpg',
  'Atatürk Mansion Trabzon': "Ataturk's Mansion.jpg",
  'Yas Island Abu Dhabi': 'Yas Bay Waterfront, Yas Island, Abu Dhabi.jpg',
  'Djerba lagoon': 'Lagoon Souk el Ghebli-sky walker.jpg'
}

const clean = (value = '') => value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
const titles = Object.values(curated).map(name => `File:${name}`).join('|')
const params = new URLSearchParams({ action: 'query', titles, prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '1400', format: 'json', formatversion: '2', origin: '*' })
const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': 'MKTravelGuide/1.0' } })
if (!response.ok) throw new Error(`Commons ${response.status}`)
const data = await response.json()
const byFile = new Map((data.query?.pages ?? []).map(page => [page.title.replace(/^File:/, ''), page]))

for (const [query, file] of Object.entries(curated)) {
  const page = byFile.get(file)
  const info = page?.imageinfo?.[0]
  if (!info) throw new Error(`Missing curated image: ${file}`)
  const meta = info.extmetadata ?? {}
  images[query] = {
    url: info.thumburl || info.url,
    source: info.descriptionurl,
    author: clean(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons'),
    license: clean(meta.LicenseShortName?.value || meta.UsageTerms?.value || 'Wikimedia Commons'),
    file
  }
}

await writeFile(outputPath, `${JSON.stringify(images, null, 2)}\n`)
process.stdout.write(`Applied ${Object.keys(curated).length} curated landmark photographs.\n`)
