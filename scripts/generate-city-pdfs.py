#!/usr/bin/env python3
import hashlib, json, os, re
from io import BytesIO
from pathlib import Path
from urllib.parse import quote_plus

import arabic_reshaper
import requests
from bidi.algorithm import get_display
from PIL import Image
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / 'src/data/attractionCatalog.json').read_text())
IMAGES = json.loads((ROOT / 'src/data/attractionImages.json').read_text())
OUT = ROOT / 'public/pdfs'
CACHE = ROOT / 'tmp/pdfs/images'
OUT.mkdir(parents=True, exist_ok=True)
CACHE.mkdir(parents=True, exist_ok=True)

FONT = Path('/System/Library/Fonts/Supplemental/Arial.ttf')
BOLD = Path('/System/Library/Fonts/Supplemental/Arial Bold.ttf')
pdfmetrics.registerFont(TTFont('Noor', str(FONT)))
pdfmetrics.registerFont(TTFont('NoorBold', str(BOLD)))

NAVY, TEAL, CREAM, INK, MUTED = map(HexColor, ['#170C79','#56B6C6','#EFE3CA','#17172C','#6D6B79'])
W, H = A4

CITIES = {
 'istanbul':('ئێستانبوڵ','تورکیا'),'ankara':('ئەنقەرە','تورکیا'),'diyarbakir':('ئامەد','تورکیا'),'mardin':('ماردین','تورکیا'),'van':('وان','تورکیا'),'izmir':('ئیزمیر','تورکیا'),'alanya':('ئالانیا','تورکیا'),'bodrum':('بۆدروم','تورکیا'),'trabzon':('ترابزۆن','تورکیا'),
 'dubai':('دوبەی','میرنشینە عەرەبییە یەکگرتووەکان'),'abu-dhabi':('ئەبو زەبی','میرنشینە عەرەبییە یەکگرتووەکان'),'sharjah':('شارقە','میرنشینە عەرەبییە یەکگرتووەکان'),
 'muscat':('مەسقەت','عومان'),'salalah':('سەلالە','عومان'),'nizwa':('نیزوا','عومان'),'beirut':('بەیروت','لوبنان'),'byblos':('جوبەیل','لوبنان'),'baalbek':('بەعلەبەک','لوبنان'),
 'baku':('باکۆ','ئازەربایجان'),'gabala':('قەبەلە','ئازەربایجان'),'shaki':('شەکی','ئازەربایجان'),'tbilisi':('تفلیس','جۆرجیا'),'batumi':('باتومی','جۆرجیا'),'kazbegi':('کازبێگی','جۆرجیا'),'kutaisi':('کوتایسی','جۆرجیا'),
 'north-iran':('باکووری ئێران','ئێران'),'tehran':('تاران','ئێران'),'kish':('دوورگەی کیش','ئێران'),'cairo':('قاهیرە','میسر'),'sharm':('شەرم ئەلشێخ','میسر'),'hurghada':('غەردەقە','میسر'),'luxor':('لوکسۆر','میسر'),
 'tunis':('تونس','تونس'),'sousse':('سوسە','تونس'),'hammamet':('حەمامەت','تونس'),'djerba':('جەربە','تونس')
}

def rtl(text):
    return get_display(arabic_reshaper.reshape(str(text)))

def kd(num):
    return str(num).translate(str.maketrans('0123456789','٠١٢٣٤٥٦٧٨٩'))

def clean(value):
    return re.sub(r'<[^>]+>', '', value or '').strip()

def get_image(query):
    info = IMAGES.get(query)
    if not info: return None
    path = CACHE / f"{hashlib.sha1(query.encode()).hexdigest()}.jpg"
    if path.exists(): return path
    if os.environ.get('PDF_OFFLINE') == '1': return None
    try:
        response = requests.get(info['url'], timeout=30, headers={'User-Agent':'MKTravelGuide/1.0'})
        response.raise_for_status()
        image = Image.open(BytesIO(response.content)).convert('RGB')
        image.thumbnail((1200, 900))
        image.save(path, 'JPEG', quality=82, optimize=True)
        return path
    except Exception:
        return None

def crop_image(c, path, x, y, width, height):
    if not path:
        c.setFillColor(HexColor('#E6F2F1')); c.roundRect(x,y,width,height,10,fill=1,stroke=0)
        c.setFillColor(NAVY); c.setFont('NoorBold',14); c.drawCentredString(x+width/2,y+height/2,'MK')
        return
    with Image.open(path) as im:
        iw, ih = im.size
    scale = max(width/iw, height/ih)
    dw, dh = iw*scale, ih*scale
    c.saveState(); p=c.beginPath(); p.roundRect(x,y,width,height,10); c.clipPath(p,stroke=0,fill=0)
    c.drawImage(ImageReader(str(path)),x-(dw-width)/2,y-(dh-height)/2,width=dw,height=dh,mask='auto')
    c.restoreState()

def footer(c, page):
    c.setStrokeColor(HexColor('#E8E5DE')); c.line(36,30,W-36,30)
    c.setFillColor(MUTED); c.setFont('Noor',8)
    c.drawRightString(W-36,16,rtl('ڕێبەری گەشتی MK - ٠٧٥٠ ٠٢٢ ٩٢٩٢'))
    c.setFont('Helvetica',8); c.drawString(36,16,f'{page}')

def wrap_rtl(c, text, x_right, y, width, font='Noor', size=10, leading=16, max_lines=3):
    words = text.split(); lines=[]; line=[]
    for word in words:
        candidate=' '.join(line+[word])
        if pdfmetrics.stringWidth(rtl(candidate),font,size) <= width: line.append(word)
        else:
            if line: lines.append(' '.join(line))
            line=[word]
    if line: lines.append(' '.join(line))
    c.setFont(font,size)
    for i,line in enumerate(lines[:max_lines]): c.drawRightString(x_right,y-i*leading,rtl(line))
    return y-min(len(lines),max_lines)*leading

def make_pdf(slug, city, country, attractions):
    path = OUT / f'{slug}-daily-guide.pdf'
    c = canvas.Canvas(str(path), pagesize=A4, pageCompression=1)
    c.setTitle(f'MK Travel Guide - {city}')
    hero = get_image(attractions[0]['query'])
    crop_image(c,hero,0,H-390,W,390)
    c.setFillColor(Color(23/255,12/255,121/255,alpha=.82)); c.rect(0,H-390,W,390,fill=1,stroke=0)
    c.setFillColor(white); c.setFont('Helvetica-Bold',23); c.drawString(42,H-75,'MK BUSINESS & TRAVEL')
    c.setFont('NoorBold',36); c.drawRightString(W-42,H-185,rtl(city))
    c.setFont('Noor',16); c.drawRightString(W-42,H-220,rtl(f'پلانی گەشتی حەوت ڕۆژە - {country}'))
    c.setFillColor(CREAM); c.roundRect(W-220,H-275,178,40,10,fill=1,stroke=0)
    c.setFillColor(NAVY); c.setFont('NoorBold',13); c.drawCentredString(W-131,H-260,rtl('PDFی تایبەت بە کڕیارانی MK'))
    c.setFillColor(NAVY); c.setFont('NoorBold',22); c.drawRightString(W-42,H-445,rtl('چۆن ئەم پلانە بەکاربهێنیت؟'))
    c.setFillColor(MUTED)
    wrap_rtl(c,'ئەم پلانە بۆ گەشتێکی ئارام و خێزانی دروست کراوە. دەتوانیت کات و ڕیزبەندی شوێنەکان بە پێی حەزی خۆت بگۆڕیت.',W-42,H-480,W-84,'Noor',12,20,4)
    c.setFillColor(HexColor('#F0F7F6')); c.roundRect(42,90,W-84,100,16,fill=1,stroke=0)
    c.setFillColor(NAVY); c.setFont('NoorBold',14); c.drawRightString(W-62,160,rtl('ئامۆژگاریی MK'))
    c.setFillColor(MUTED); wrap_rtl(c,'پێڵاوی ئاسوودە، ئاو و وێنەی بەڵگەکانت لەگەڵ بێت. پێش چوون کاتی کارکردن و نرخی بلیت بپشکنە.',W-62,135,W-124,'Noor',10,17,3)
    footer(c,1); c.showPage()

    for day in range(1,8):
        if day % 2 == 1:
            c.setFillColor(NAVY); c.rect(0,H-58,W,58,fill=1,stroke=0)
            c.setFillColor(white); c.setFont('NoorBold',16); c.drawRightString(W-36,H-37,rtl(f'پلانی حەوت ڕۆژەی {city}'))
            c.setFont('Helvetica-Bold',11); c.drawString(36,H-37,'MK GUIDE')
        block = 0 if day % 2 == 1 else 1
        top = H-82-block*360
        a = attractions[((day-1)*2) % len(attractions)]
        b = attractions[((day-1)*2+1) % len(attractions)]
        e = attractions[((day-1)*2+2) % len(attractions)]
        c.setFillColor(CREAM); c.roundRect(36,top-315,W-72,315,18,fill=1,stroke=0)
        c.setFillColor(TEAL); c.circle(W-72,top-37,25,fill=1,stroke=0)
        c.setFillColor(white); c.setFont('NoorBold',15); c.drawCentredString(W-72,top-42,rtl(kd(day)))
        c.setFillColor(NAVY); c.setFont('NoorBold',18); c.drawRightString(W-110,top-35,rtl(f'ڕۆژی {kd(day)}: گەشت و ئەزموونی نوێ'))
        image_path = get_image(a['query'])
        crop_image(c,image_path,W-245,top-205,185,135)
        info = IMAGES.get(a['query'],{})
        c.setFillColor(MUTED); c.setFont('Helvetica',6)
        c.drawRightString(W-60,top-215,f"Wikimedia Commons - {clean(info.get('license',''))[:35]}")
        c.setFillColor(INK)
        wrap_rtl(c,f'بەیانی: سەردانی {a["name"]} و کات بۆ وێنەگرتن.',W-270,top-90,250,'NoorBold',10,16,3)
        wrap_rtl(c,f'نیوەڕۆ: نانخواردن و گەشت لە {b["name"]}.',W-270,top-155,250,'Noor',10,16,3)
        wrap_rtl(c,f'ئێوارە: پیاسە و پشوودان لە {e["name"]}.',W-270,top-220,250,'Noor',10,16,3)
        c.setFillColor(NAVY); c.roundRect(58,top-286,150,30,8,fill=1,stroke=0)
        c.setFillColor(white); c.setFont('NoorBold',9); c.drawCentredString(133,top-276,rtl('٦ تا ٨ کاتژمێر - تاکسی یان پاس'))
        map_url=f'https://www.google.com/maps/search/?api=1&query={quote_plus(a["query"])}'
        c.linkURL(map_url,(58,top-286,208,top-256),relative=0)
        if day % 2 == 0 or day == 7:
            footer(c,2+(day-1)//2); c.showPage()
    c.save()

for slug, attractions in CATALOG.items():
    city,country=CITIES[slug]
    make_pdf(slug,city,country,attractions)
    print(f'Generated {slug}')
print(f'Generated {len(CATALOG)} city PDFs in {OUT}')
