# Original turf texture

`turf-v1.png` was generated with the built-in image_gen tool on 2026-09-11 for OpenWii. No game assets or reference screenshots were used as image inputs. The original generated PNG is preserved without pixel edits.

Final prompt:

Use case: stylized-concept. Asset type: seamless tileable game texture, base-color/albedo map only. Create an original square 1024x1024 overhead turf texture for the grassy infield of a polished colorful kart-racing stadium. Entire image is densely trimmed, healthy short grass, subtle intersecting small blades with soft clumps and tiny glimpses of darker thatch. Material scale represents about 2 metres square. Attractive natural yellow-green and olive-green palette, medium value, restrained variation; clean stylized realism with believable fine blade detail suitable for a console racing game. Perfectly orthographic top-down, uniform diffuse illumination, no directional shadows, no highlights baked from a sun, no horizon, no depth perspective. Truly seamless matching all opposite edges. Avoid large patches, visible mowing stripes, flowers, weeds, stones, dirt holes, focal objects, vignette, text, logos, borders, watermarks, scenery, and any UI. Deliver just the flat repeating grass material.

Runtime use: diffuse turf map, repeating across the infield with mipmaps and anisotropic filtering. A local procedural texture remains the loading/error fallback. Inspect repeating patterns in the actual course before accepting a visual pass.
