#!/bin/sh
# Build and publish to https://tsh594.github.io/safe-space-webxr/
set -e
cd "$(dirname "$0")"
npx vite build
cd dist && rm -rf .git && git init -q -b gh-pages && touch .nojekyll && git add -A && git commit -q -m "Deploy build" && git remote add origin https://github.com/tsh594/safe-space-webxr.git && git push -q -f origin gh-pages
echo "Deployed. Live in ~1 minute at https://tsh594.github.io/safe-space-webxr/"
