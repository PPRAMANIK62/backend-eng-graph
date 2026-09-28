#!/usr/bin/env bash
# Render an SVG figure to PNG twice, light and dark, to check it by eye.
# Usage: visuals/render.sh <file.svg> [out-dir]   (default out-dir: visuals/out, gitignored)
set -euo pipefail
svg="$1"
out="${2:-$(dirname "$0")/out}"
mkdir -p "$out"
name="$(basename "$svg" .svg)"
rsvg-convert -w 1440 -b '#fcfcfb' "$svg" -o "$out/$name-light.png"
# rsvg-convert ignores prefers-color-scheme, so make a copy with the dark
# rules unwrapped: they come last, so they override the light ones.
python3 - "$svg" "$out/$name-dark.svg" <<'EOF'
import re, sys
s = open(sys.argv[1]).read()
m = re.search(r"@media \(prefers-color-scheme: dark\)\s*\{", s)
if m:
    depth, i = 1, m.end()
    while depth:
        depth += {"{": 1, "}": -1}.get(s[i], 0)
        i += 1
    s = s[:m.start()] + s[m.end():i - 1] + s[i:]
open(sys.argv[2], "w").write(s)
EOF
rsvg-convert -w 1440 -b '#1a1a19' "$out/$name-dark.svg" -o "$out/$name-dark.png"
rm "$out/$name-dark.svg"
echo "$out/$name-light.png $out/$name-dark.png"
