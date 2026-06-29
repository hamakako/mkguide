# MK Business Travel Guide

ڕێبەری گەشتیاریی کوردیی سۆرانی بۆ کڕیارانی MK Business and Travel.

## Run locally

```bash
npm install
npm run dev
```

Production check: `npm run build && npm run preview`.

## Deploy on Render

1. Push this folder to a GitHub repository.
2. In Render choose **New → Static Site** and connect the repository.
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. No environment variables are required.
6. Deploy; Render will provide the final `onrender.com` URL.

The included `render.yaml` can also configure the Static Site automatically.
