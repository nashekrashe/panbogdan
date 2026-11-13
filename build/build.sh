#!/usr/bin/env bash
# Builds dist/preview.html (standalone page for review) and dist/poland-wp.html (what goes into the WordPress page 5595).
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm install --silent
python3 build.py
node min.js
node wrap.js
node dopatch.js
sha256sum ../dist/poland-wp.html | cut -c1-16
# panbogdan.com: site/ with own fonts, meta tags and prerendered text
python3 mksite.py
node prerender.js ../site/index.html
