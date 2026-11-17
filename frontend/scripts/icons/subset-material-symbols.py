#!/usr/bin/env python3
"""Subset Material Symbols Outlined to the icon names used by the app.

The full variable font (FILL 0-1, wght 100-700) holds ~4,300 icons and weighs
1.1 MB. This keeps only the ligatures listed by `material-symbols.cjs --write`,
plus the letters that spell them, and preserves both variation axes. The output
name carries a content hash so it can be cached long-term, and
`src/app/fonts.css` is updated to point at it.

Usage (from `frontend`): python3 scripts/icons/subset-material-symbols.py
Requires: pip install fonttools brotli
"""
import hashlib
import pathlib
import re
import subprocess

from fontTools import subset
from fontTools.ttLib import TTFont

FRONTEND = pathlib.Path(__file__).resolve().parents[2]
HERE = FRONTEND / 'scripts' / 'icons'
FONTS = FRONTEND / 'public' / 'fonts'
CSS = FRONTEND / 'src' / 'app' / 'fonts.css'
SPELLING = 'abcdefghijklmnopqrstuvwxyz0123456789_'


def main() -> None:
    subprocess.run(['node', str(HERE / 'material-symbols.cjs'), '--write'], check=True, cwd=FRONTEND)
    names = {line.strip() for line in (HERE / 'material-symbols-used.txt').read_text().splitlines() if line.strip()}

    font = TTFont(HERE / 'material-symbols-outlined-full.woff2')
    char_of = {glyph: chr(code) for code, glyph in font.getBestCmap().items()}
    kept_glyphs, found = set(), set()
    for lookup in font['GSUB'].table.LookupList.Lookup:
        for table in lookup.SubTable:
            table = table.ExtSubTable if lookup.LookupType == 7 else table
            if not hasattr(table, 'ligatures'):
                continue
            for first in list(table.ligatures):
                keep = []
                for ligature in table.ligatures[first]:
                    word = char_of.get(first, '') + ''.join(char_of.get(c, '') for c in ligature.Component)
                    if word in names:
                        keep.append(ligature)
                        kept_glyphs.add(ligature.LigGlyph)
                        found.add(word)
                if keep:
                    table.ligatures[first] = keep
                else:
                    del table.ligatures[first]
    missing = names - found
    if missing:
        raise SystemExit(f'No ligature found for: {", ".join(sorted(missing))}')

    options = subset.Options()
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.notdef_outline = True
    options.flavor = 'woff2'
    subsetter = subset.Subsetter(options)
    subsetter.populate(glyphs=sorted(kept_glyphs), unicodes=[ord(c) for c in SPELLING])
    subsetter.subset(font)

    output = FONTS / 'material-symbols-outlined.tmp.woff2'
    font.save(output)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()[:10]
    final = FONTS / f'material-symbols-outlined.{digest}.woff2'
    for old in FONTS.glob('material-symbols-outlined*.woff2'):
        if old not in (output, final):
            old.unlink()
    output.replace(final)

    css = CSS.read_text()
    updated = re.sub(r'/fonts/material-symbols-outlined[^)]*\.woff2', f'/fonts/{final.name}', css)
    if updated == css and f'/fonts/{final.name}' not in css:
        raise SystemExit(f'Could not find the Material Symbols url in {CSS}')
    CSS.write_text(updated)
    print(f'{final.relative_to(FRONTEND)}: {len(found)} icons, {final.stat().st_size / 1024:.1f} KB')


if __name__ == '__main__':
    main()
