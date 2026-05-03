#!/usr/bin/env bash
# Builds JS/CSS then packs an install-ready ZIP for WordPress (Plugins → Upload).
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$ROOT"

VERSION="$( node -p "require('./package.json').version" )"

npm run build

TMP="$( mktemp -d )"
trap 'rm -rf "$TMP"' EXIT

DEST="$TMP/learn-gutenberg-development"
mkdir "$DEST"

rsync -a \
	--exclude node_modules \
	--exclude vendor \
	--exclude .git \
	--exclude '*.zip' \
	--exclude .DS_Store \
	"$ROOT/" "$DEST/"

ZIP_NAME="learn-gutenberg-development-${VERSION}.zip"
OUT="$ROOT/$ZIP_NAME"

( cd "$TMP" && zip -qr "$OUT" learn-gutenberg-development )

echo "Created ${OUT}"
