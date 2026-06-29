import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpLeft, CalendarDays, Check, ChevronDown, Clock3, Compass, Headphones, Heart, Map, MapPin, Menu, MessageCircle, Search, ShieldCheck, Sparkles, Star, Users, Utensils, X } from 'lucide-react'
import { cities, countries, filterTags, getAttraction, getCity, getCountryCities, planFor, type City, type Tag } from './data/destinations'
import { BrandedImage } from './components/BrandedImage'

const wa = 'https://wa.me/9647500229292'
const kn = (value: number) => value.toLocaleString('ar-EG')

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="site-header">
    <div className="container nav-wrap">
      <Link to="/" className="brand"><img src="/brand/mk-logo.png" alt="MK" /><span><b>MK</b><small>Business & Travel</small></span></Link>
      <button className="menu-btn" aria-label="کردنەوەی مینیو" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <nav className={open ? 'open' : ''} onClick={() => setOpen(false)}>
        <Link to="/">سەرەکی</Link><Link to="/#countries">وڵاتەکان</Link><Link to="/#cities">شارەکان</Link><Link to="/#plans">پلانی ڕۆژانە</Link>
        <a href={wa} className="nav-cta"><MessageCircle size={18}/> پەیوەندی بە MK</a>
      </nav>
    </div>
  </header>
}

function SearchBox({ large = false }: { large?: boolean }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const matches = useMemo(() => query.trim() ? cities.filter(c => `${c.name} ${c.country} ${c.attractions.map(a=>a.name).join(' ')}`.includes(query.trim())).slice(0, 6) : [], [query])
  return <div className={`search-box ${large ? 'large' : ''}`}>
    <Search aria-hidden="true" />
    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="گەڕان بۆ شار، وڵات یان شوێن…" aria-label="گەڕان" onKeyDown={e => { if(e.key === 'Enter' && matches[0]) navigate(`/city/${matches[0].slug}`) }} />
    <button onClick={() => matches[0] && navigate(`/city/${matches[0].slug}`)}>گەڕان</button>
    {matches.length > 0 && <div className="search-results">{matches.map(c => <Link key={c.slug} to={`/city/${c.slug}`} onClick={()=>setQuery('')}><MapPin size={17}/><span><b>{c.name}</b><small>{c.country}</small></span><ArrowLeft size={17}/></Link>)}</div>}
  </div>
}

function Home() {
  const [tag, setTag] = useState<Tag | 'هەموو'>('هەموو')
  const shown = tag === 'هەموو' ? cities.slice(0, 8) : cities.filter(c => c.tags.includes(tag)).slice(0, 8)
  useEffect(() => { document.title = 'ڕێبەری گەشتی MK | گەشتێکی ئاسانتر' }, [])
  return <>
    <section className="hero">
      <div className="hero-orb one"/><div className="hero-orb two"/>
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={16}/> ڕێبەری خۆڕایی بۆ کڕیارانی MK</span>
          <h1>گەشتەکەت بە <em>دڵنیایی</em><br/>و خۆشی پلان بکە</h1>
          <p>باشترین شوێنەکان، پلانی ڕۆژانە و ئامۆژگاریی سادە—هەمووی بە کوردی بۆ ئەوەی هیچ ساتێک لە گەشتەکەت لەدەست نەدەیت.</p>
          <SearchBox large />
          <div className="hero-trust"><span><Check/> زانیاریی سادە</span><span><Check/> پلانی ئامادە</span><span><Check/> بەبێ بەرامبەر</span></div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo"><BrandedImage src={cities[8].hero} alt="گەشت و سروشت" eager/><span className="photo-label"><MapPin/> ترابزۆن <small>تورکیا</small></span></div>
          <div className="float-card rating"><span className="icon"><Heart fill="currentColor"/></span><div><b>گەشتێکی دڵخۆش</b><small>لەگەڵ خێزانەکەت</small></div></div>
          <div className="float-card places"><b>+١٠٠</b><span>شوێنی پێشنیارکراو</span></div>
          <svg className="doodle" viewBox="0 0 180 70" aria-hidden="true"><path d="M3 60c25-40 78-50 126-32 18 7 30 5 45-17"/><path d="m160 5 16 6-11 14"/></svg>
        </div>
      </div>
    </section>

    <section className="stats"><div className="container stats-grid"><div><b>٩</b><span>وڵاتی جیاواز</span></div><div><b>{kn(cities.length)}</b><span>شار و ناوچە</span></div><div><b>٣ / ٥ / ٧</b><span>پلانی ڕۆژانە</span></div><div><b>١٠٠٪</b><span>بە زمانی کوردی</span></div></div></section>

    <section className="section" id="countries"><div className="container">
      <SectionHead kicker="لە کوێوە دەست پێدەکەیت؟" title="وڵاتەکەت هەڵبژێرە" text="هەر وڵاتێک ڕەنگ و چێژی خۆی هەیە؛ ئێمە ڕێگاکەت بۆ کورت کردووەتەوە." />
      <div className="country-grid">{countries.map((c,i) => <Link to={`/country/${c.slug}`} className="country-card" key={c.slug}><span className="flag">{c.flag}</span><div><h3>{c.name}</h3><p>{c.description}</p><small>{kn(getCountryCities(c.slug).length)} شار و ناوچە</small></div><span className="round-arrow"><ArrowUpLeft/></span><i style={{background: ['#8acbd0','#efe3ca','#d8e7d4'][i%3]}}/></Link>)}</div>
    </div></section>

    <section className="section cities-section" id="cities"><div className="container">
      <SectionHead kicker="هەڵبژاردە ناسراوەکان" title="شارە دڵخوازەکان" text="لە شارە مێژووییەکانەوە تا کەناراو و سروشتی سەوز." />
      <div className="filters"><button className={tag==='هەموو'?'active':''} onClick={()=>setTag('هەموو')}>هەموو</button>{filterTags.slice(0,7).map(t=><button key={t} className={tag===t?'active':''} onClick={()=>setTag(t)}>{t}</button>)}</div>
      <div className="city-grid">{shown.map(city => <CityCard key={city.slug} city={city}/>)}</div>
      <div className="center"><Link to="/all-cities" className="outline-btn">بینینی هەموو شارەکان <ArrowLeft/></Link></div>
    </div></section>

    <section className="section plan-intro" id="plans"><div className="container plan-grid">
      <div className="plan-collage"><BrandedImage src={cities[9].hero} alt="دوبەی"/><BrandedImage src={cities[3].hero} alt="ماردین"/><div className="stamp"><b>MK</b><span>ڕێبەری تۆ</span></div></div>
      <div><span className="eyebrow cream"><CalendarDays size={17}/> پلانی ئامادە بۆ هەر ڕۆژێک</span><h2>ئێمە پلانی دەکەین،<br/><em>تۆ تەنها چێژ وەربگرە</em></h2><p>بەیانی لە کوێ بیت؟ نیوەڕۆ چی بکەیت؟ ئێوارە لە کوێ پیاسە بکەیت؟ هەر ڕۆژێک بە شێوەیەکی سادە و ئارام بۆت ڕێکخراوە.</p><ul><li><span>١</span> پلانی ٣ ڕۆژە بۆ گەشتی کورت</li><li><span>٢</span> پلانی ٥ ڕۆژە بۆ بینینی گرنگترین شوێنەکان</li><li><span>٣</span> پلانی ٧ ڕۆژە بۆ گەشتێکی پڕ و ئارام</li></ul><Link to="/city/istanbul" className="cream-btn">نمونەی پلان ببینە <ArrowLeft/></Link></div>
    </div></section>

    <section className="section"><div className="container"><div className="free-card"><div><span className="eyebrow"><ShieldCheck/> تایبەت بە کڕیارانی ئێمە</span><h2>ڕێبەرەکەت، دیارییەک لە MK</h2><p>ئەم خزمەتگوزارییە بە تەواوی خۆڕاییە. ئێمە تەنها فرۆشی گەشت ناکەین؛ دڵنیادەبین لە هەموو ساتێکی گەشتەکەت.</p><a href={wa} className="primary-btn"><MessageCircle/> قسە لەگەڵ ڕاوێژکار بکە</a></div><div className="benefits"><div><Headphones/><b>پشتیوانیی ڕاستەوخۆ</b><span>لە پێش و کاتی گەشتدا</span></div><div><Map/><b>ڕێبەری بەردەست</b><span>لە مۆبایلەکەتدا</span></div><div><Users/><b>گونجاو بۆ خێزان</b><span>سادە و بێ ئاڵۆزی</span></div></div></div></div></section>
  </>
}

function SectionHead({kicker,title,text}:{kicker:string,title:string,text:string}) { return <div className="section-head"><span>{kicker}</span><h2>{title}</h2><p>{text}</p></div> }

function CityCard({city}:{city:City}) { return <Link to={`/city/${city.slug}`} className="city-card"><div className="city-image"><BrandedImage src={city.hero} alt={city.name}/><span>{city.country}</span><button aria-label="دڵخواز"><Heart/></button></div><div className="city-body"><div><h3>{city.name}</h3><p><MapPin/> {city.country}</p></div><small>{city.tags.slice(0,2).join(' • ')}</small><span className="card-link">ڕێبەرەکە ببینە <ArrowLeft/></span></div></Link> }

function AllCities() {
  const [q,setQ] = useState(''); const [tag,setTag] = useState<Tag|'هەموو'>('هەموو')
  const list = cities.filter(c => (tag==='هەموو'||c.tags.includes(tag)) && `${c.name} ${c.country}`.includes(q))
  return <main className="page"><div className="container"><div className="page-head"><span className="eyebrow"><Compass/> هەموو ڕێگاکان لێرەوە دەست پێدەکەن</span><h1>شارەکان و ناوچەکان</h1><p>گەڕان بکە و شوێنی گونجاو بۆ گەشتەکەت بدۆزەرەوە.</p></div><div className="catalog-search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="ناوی شار یان وڵات…"/></div><div className="filters"><button className={tag==='هەموو'?'active':''} onClick={()=>setTag('هەموو')}>هەموو</button>{filterTags.map(t=><button key={t} className={tag===t?'active':''} onClick={()=>setTag(t)}>{t}</button>)}</div><p className="result-count">{kn(list.length)} ئەنجام دۆزرایەوە</p><div className="city-grid">{list.map(c=><CityCard key={c.slug} city={c}/>)}</div></div></main>
}

function CountryPage() {
  const {slug=''}=useParams(); const country=countries.find(c=>c.slug===slug); const list=getCountryCities(slug)
  if(!country) return <NotFound/>
  return <main className="page"><div className="container"><div className="country-hero"><span className="giant-flag">{country.flag}</span><div><span className="eyebrow">ڕێبەری گەشتی وڵات</span><h1>{country.name}</h1><p>{country.description}. شارێک هەڵبژێرە و پلانی تەواوی گەشتەکەت ببینە.</p></div></div><div className="city-grid">{list.map(c=><CityCard city={c} key={c.slug}/>)}</div></div></main>
}

function CityPage() {
  const {slug=''}=useParams(); const city=getCity(slug); const [days,setDays]=useState(3)
  useEffect(()=>{ if(city){ document.title=`ڕێبەری ${city.name} | MK`; window.scrollTo(0,0)}},[city])
  if(!city) return <NotFound/>
  const plans=planFor(city,days)
  return <main className="city-page">
    <section className="city-hero"><BrandedImage src={city.hero} alt={city.name} eager/><div className="city-hero-shade"/><div className="container city-hero-content"><div className="breadcrumbs"><Link to="/">سەرەکی</Link><span>/</span><Link to={`/country/${city.countrySlug}`}>{city.country}</Link><span>/</span><b>{city.name}</b></div><span className="eyebrow light"><MapPin/> {city.country}</span><h1>{city.name}</h1><p>{city.overview}</p><div className="city-tags">{city.tags.map(t=><span key={t}>{t}</span>)}</div></div></section>
    <section className="quick-strip"><div className="container"><div><CalendarDays/><span>باشترین کات<b>{city.bestTime}</b></span></div><div><Clock3/><span>پلانی پێشنیارکراو<b>٥ تا ٧ ڕۆژ</b></span></div><div><Star/><span>گونجاو بۆ<b>{city.tags.slice(0,3).join('، ')}</b></span></div></div></section>
    <section className="section"><div className="container"><SectionHead kicker="نابێت لەدەستت بچێت" title={`شوێنە گرنگەکانی ${city.name}`} text="هەر شوێنێک بە کاتی پێویست و لینکێکی ڕاستەوخۆی نەخشە."/><div className="attraction-grid">{city.attractions.map((a,i)=><article className="attraction" key={a.name}><Link className="attraction-hit" to={`/city/${city.slug}/attraction/${a.slug}`} aria-label={`زانیاریی زیاتر دەربارەی ${a.name}`}/><div><BrandedImage src={a.image} alt={a.name}/><span className="number">{kn(i+1)}</span></div><section><h3>{a.name}</h3><p>{a.description}</p><span className="more-link">زانیاریی زیاتر <ArrowLeft/></span><footer><span><Clock3/> {a.duration}</span><a href={a.map} target="_blank" rel="noreferrer"><MapPin/> لە نەخشە</a></footer></section></article>)}</div></div></section>
    <section className="section itinerary"><div className="container"><SectionHead kicker="ڕۆژ بە ڕۆژ" title="پلانی گەشتەکەت" text="کاتەکان بە ئارامی ڕێکخراون؛ دەتوانیت بە پێی حەزت بیانگۆڕیت."/><div className="day-tabs">{[3,5,7].map(d=><button className={days===d?'active':''} onClick={()=>setDays(d)} key={d}>{kn(d)} ڕۆژ</button>)}</div><div className="timeline">{plans.map((p)=><article className="day" key={p.day}><div className="day-marker"><span>{kn(p.day)}</span><i/></div><div className="day-card"><div className="day-photo"><BrandedImage src={p.image} alt={`ڕۆژی ${kn(p.day)}`}/></div><div className="day-copy"><small>ڕۆژی {kn(p.day)}</small><h3>{p.title}</h3><p>{p.morning}</p><p>{p.afternoon}</p><p>{p.evening}</p><div className="day-meta"><span><Clock3/> {p.duration}</span><span><Compass/> {p.transport}</span></div><div className="advice"><Sparkles/> {p.advice}</div><a href={p.map} target="_blank" rel="noreferrer">کردنەوە لە نەخشە <ArrowUpLeft/></a></div></div></article>)}</div></div></section>
    <section className="section"><div className="container info-grid"><div className="nearby"><span className="eyebrow">گەشتێک بۆ دەوروبەر</span><h2>شوێنی نزیک و گەشتی یەک ڕۆژە</h2>{city.nearby.map((n,i)=><a key={n} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n)}`} target="_blank" rel="noreferrer"><span>{kn(i+1)}</span><b>{n}</b><ArrowUpLeft/></a>)}</div><div className="tip-stack"><InfoCard icon={<Utensils/>} title="خواردن و بازاڕ" text={city.food}/><InfoCard icon={<Compass/>} title="گواستنەوە" text={city.transport}/><InfoCard icon={<ShieldCheck/>} title="تێبینیی گرنگ" text={city.note}/><div className="mk-tip"><img src="/brand/mk-logo.png" alt="MK"/><div><b>ئامۆژگاریی MK</b><p>{city.tip}</p></div></div></div></div></section>
    <section className="city-cta"><div className="container"><span>ئامادەیت بۆ گەشت؟</span><h2>با MK گەشتەکەت ئاسان بکات</h2><p>بۆ بلیت، هوتێل و ڕاوێژی تایبەت ڕاستەوخۆ پەیوەندیمان پێوە بکە.</p><a href={wa} className="cream-btn"><MessageCircle/> نامە لە واتسئاپ بنێرە</a></div></section>
  </main>
}

function InfoCard({icon,title,text}:{icon:React.ReactNode,title:string,text:string}) { return <div className="info-card"><span>{icon}</span><div><h3>{title}</h3><p>{text}</p></div></div> }

function AttractionPage() {
  const { slug = '', attractionSlug = '' } = useParams()
  const city = getCity(slug)
  const attraction = getAttraction(slug, attractionSlug)
  useEffect(() => {
    if (city && attraction) {
      document.title = `${attraction.name}، ${city.name} | MK`
      window.scrollTo(0, 0)
    }
  }, [city, attraction])
  if (!city || !attraction) return <NotFound />
  const related = city.attractions.filter(item => item.slug !== attraction.slug)
  return <main className="attraction-page">
    <section className="attraction-detail-hero">
      <BrandedImage src={attraction.image} alt={attraction.name} eager />
      <div className="city-hero-shade" />
      <div className="container attraction-hero-copy">
        <div className="breadcrumbs"><Link to="/">سەرەکی</Link><span>/</span><Link to={`/city/${city.slug}`}>{city.name}</Link><span>/</span><b>{attraction.name}</b></div>
        <span className="eyebrow light"><MapPin /> {city.name}، {city.country}</span>
        <h1>{attraction.name}</h1>
        <p>{attraction.description}</p>
      </div>
    </section>
    <section className="detail-facts"><div className="container">
      <div><Clock3/><span>ماوەی سەردان<b>{attraction.duration}</b></span></div>
      <div><CalendarDays/><span>باشترین کات<b>{attraction.bestVisitTime}</b></span></div>
      <div><ShieldCheck/><span>بلیت و چوونەژوورەوە<b>{attraction.ticketNote}</b></span></div>
    </div></section>
    <section className="section"><div className="container detail-layout">
      <article className="detail-story"><span className="eyebrow">شوێنەکە بناسە</span><h2>بۆچی سەردانی {attraction.name} بکەیت؟</h2><p>{attraction.longDescription}</p>
        <h3>چی ببینیت و چی بکەیت؟</h3><div className="highlight-list">{attraction.highlights.map((item,i)=><div key={item}><span>{kn(i+1)}</span><p>{item}</p></div>)}</div>
      </article>
      <aside className="visit-card"><div className="visit-card-image"><BrandedImage src={attraction.image} alt={attraction.name}/></div><h3>پلانی سەردان</h3>{attraction.tips.map(tip=><p key={tip}><Check/> {tip}</p>)}<a href={attraction.map} target="_blank" rel="noreferrer" className="primary-btn"><MapPin/> کردنەوە لە نەخشە</a><Link to={`/city/${city.slug}`} className="outline-btn"><ArrowLeft/> گەڕانەوە بۆ ڕێبەری {city.name}</Link></aside>
    </div></section>
    <section className="section related-section"><div className="container"><SectionHead kicker="لە نزیک ئەم شوێنە" title="شوێنی تری پێشنیارکراو" text={`سەردانی ${city.name} بە یەک شوێن تەواو نابێت.`}/><div className="attraction-grid">{related.map((item,i)=><Link className="related-card" key={item.slug} to={`/city/${city.slug}/attraction/${item.slug}`}><BrandedImage src={item.image} alt={item.name}/><div><span>٠{kn(i+1)}</span><h3>{item.name}</h3><p>{item.duration}</p></div><ArrowLeft/></Link>)}</div></div></section>
    <section className="city-cta"><div className="container"><span>پرسیارت هەیە؟</span><h2>MK ڕێگاکەت بۆ ئاسان دەکات</h2><p>بۆ پلانی گەشت، بلیت و هوتێل ڕاستەوخۆ لە واتسئاپ پەیوەندیمان پێوە بکە.</p><a href={wa} className="cream-btn"><MessageCircle/> قسە لەگەڵ ڕاوێژکار بکە</a></div></section>
  </main>
}

function NotFound(){return <main className="page"><div className="container center"><h1>ئەم پەڕەیە نەدۆزرایەوە</h1><Link className="primary-btn" to="/">گەڕانەوە بۆ سەرەکی</Link></div></main>}

function Footer(){return <footer className="footer"><div className="container"><div className="footer-main"><div className="footer-brand"><img src="/brand/mk-logo.png" alt="MK"/><h3>MK Business & Travel</h3><p>لە پلانکردنەوە تا گەڕانەوە، هاوڕێی گەشتەکەتین.</p></div><div><h4>بەستەرە خێراکان</h4><Link to="/">سەرەکی</Link><Link to="/all-cities">هەموو شارەکان</Link><a href="/#countries">وڵاتەکان</a><a href="https://unsplash.com" target="_blank" rel="noreferrer">سەرچاوەی وێنەکان: Unsplash</a></div><div><h4>پەیوەندی</h4><a href="tel:07500229292">٠٧٥٠ ٠٢٢ ٩٢٩٢</a><a href={wa}>واتسئاپ</a><p>هۆتێلی گڕاند سویس، نهۆمی زەوی، پیرمام</p></div></div><div className="footer-bottom"><span>© ٢٠٢٦ MK Business & Travel</span><span>بە خۆشەویستی بۆ گەشتیارانی کورد</span></div></div></footer>}

export default function App(){return <BrowserRouter><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/all-cities" element={<AllCities/>}/><Route path="/country/:slug" element={<CountryPage/>}/><Route path="/city/:slug" element={<CityPage/>}/><Route path="/city/:slug/attraction/:attractionSlug" element={<AttractionPage/>}/><Route path="*" element={<NotFound/>}/></Routes><a href={wa} className="wa-float" aria-label="واتسئاپ"><MessageCircle/></a><Footer/></BrowserRouter>}
