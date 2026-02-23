# PDFLibrary — Static Digital Library Platform

A production-ready static PDF library website. No server required.

## 🚀 Quick Start

1. Upload all files to any static host (GitHub Pages, Netlify, Vercel)
2. Open `index.html` in your browser

## 📁 Structure

```
/
├── index.html         — Landing page
├── library.html       — Public PDF listing
├── viewer.html        — PDF flipbook viewer
├── premium.html       — Premium gated library
├── assets/
│   ├── css/style.css  — All styles
│   ├── js/
│   │   ├── main.js    — Shared utilities + nav
│   │   ├── auth.js    — Static auth system
│   │   └── library.js — Dynamic PDF grid
│   ├── data/
│   │   └── pdfs.json  — All content + user credentials
│   ├── images/        — PDF thumbnails (add your own)
│   └── pdfs/          — PDF files (add your own)
```

## 🔑 Demo Credentials (Premium Login)

| Username | Password    |
|----------|-------------|
| admin    | admin123    |
| student  | student123  |

## 📄 Adding Your Own PDFs

1. Add PDF files to `assets/pdfs/`
2. Add thumbnail images to `assets/images/`
3. Edit `assets/data/pdfs.json` — add entries to `public_pdfs` or `premium_pdfs`

## 🎨 Customization

- Colors: Edit CSS variables in `assets/css/style.css` (`:root` block)
- Fonts: Change Google Fonts import at top of `style.css`
- Credentials: Edit `users` array in `assets/data/pdfs.json`

## 📦 Dependencies (CDN)

- **PDF.js** 3.11.174 — PDF rendering
- **PageFlip.js** 2.0.7 — Book flip animation
- **Google Fonts** — Playfair Display + DM Sans
