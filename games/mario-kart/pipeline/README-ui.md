# Optional native UI assets

The runtime uses the original game's Latin letter shapes, counters and character portraits when this local pack is present. Assets stay in the ignored `assets/mario-kart/ui/` folder; an asset-free checkout uses the existing fallback portraits and system font.

Sources inspected September 15, 2026:

- [Fonts, uploaded by Random Talking Bush](https://www.spriters-resource.com/wii_u/mariokart8/asset/69863/): `turbo_MessageFontOutline_50_US_62x77.png` and `turbo_DigitalNum_51x75.png`.
- [Character menu icons, uploaded by Random Talking Bush](https://www.spriters-resource.com/wii_u/mariokart8/asset/68237/).
- [GameXplain native menu tour](https://www.youtube.com/watch?v=4wlwytZVknM&t=45s): blue character panel, rectangular yellow selection frame, character preview, restrained white labels. OpenWii retains its single race flow.
- Patrick's September 15 gameplay screenshot: item circle, lower-left coin/lap counters, right-middle minimap and lower-right position proportions.

Download the font archive and run:

```sh
python3 games/mario-kart/pipeline/prepare-ui-font.py /path/to/69863.zip
```

Requires Pillow, numpy, opencv-python and fonttools. The script traces the white Latin glyph contours at the supplied raster resolution into local WOFF files. These preserve the supplied glyph shapes but are **not** the original commercial font binary, kerning or full multilingual character set. The countdown, position and FINISH display art remains the existing vector approximation of the bespoke race artwork.

Save the unmodified character sprite sheet as `assets/mario-kart/ui/driver-icons.png`. `loadSourcePortraits()` crops the eight relevant cells in the browser and shares the resulting sprites between the menu, map and standings. Source sheets are never modified. Nintendo artwork remains Nintendo's; uploader attribution above.
