"""Build a local, inspectable index of verified overnight race recordings."""
from pathlib import Path
from html import escape
import json

root = Path(__file__).resolve().parent / 'evidence' / 'overnight'
passes = []
for folder in sorted(root.iterdir()):
    if not folder.is_dir() or not (folder/'loaded-source-verification.json').exists():
        continue
    decision = folder/'review-decision.json'
    if decision.exists() and json.loads(decision.read_text()).get('accepted') is False:
        continue
    verification = json.loads((folder/'loaded-source-verification.json').read_text())
    if not verification or not all(item.get('match') is True for item in verification.values()):
        continue
    report = json.loads((folder/'demo-report.json').read_text())
    if report.get('errors') or report.get('failure'):
        continue
    sources = json.loads((folder/'source-hashes.json').read_text())['files']
    loaded = report.get('loadedFiles', {})
    if not loaded or set(loaded) != set(verification):
        continue
    if not all(data['sha256'] == sources.get(path.lstrip('/')) == verification[path]['sha256']
               for path,data in loaded.items()):
        continue
    passes.append((folder, report))
latest, report = passes[-1]
def link(folder, filename, label):
    p = folder/filename
    return f'<a href="{escape(str(p.relative_to(root)))}">{escape(label)}</a>' if p.exists() else '—'
rows = ''.join(f'''<tr><th>{escape(p.name)}</th><td>{r.get('fps',0):.2f}</td><td>{r.get('elapsed',0):.1f}s</td><td>{link(p,'keyboard-demo.webm','Full race')}</td><td>{link(p,'contact.png','Frames')}</td><td>{link(p,'loaded-source-verification.json','Hashes')}</td></tr>''' for p,r in reversed(passes))
comparisons = ''.join(f'''<section><h3>{name.capitalize()}</h3><div class="pair"><figure><img loading="lazy" src="00-baseline/{name}.png" alt="Before overnight: {name}"><figcaption>Before overnight loop</figcaption></figure><figure><img loading="lazy" src="{latest.name}/{name}.png" alt="Latest: {name}"><figcaption>{escape(latest.name)} · staged comparison</figcaption></figure></div></section>''' for name in ['grid','climb','bank','glider'] if (latest/f'{name}.png').exists())
study = root.parent / 'asset-study' / 'stadium-converted'
next_study = ''
if (study / 'report.json').exists():
    next_study = '''<h2 id="next-course">Local source course</h2><p>This local Nintendo source-course conversion has passed exported-geometry checks. The latest source-course race uses its measured three-dimensional surface. The earlier route probe is a geometry diagnostic, separate from the keyboard recording above.</p><nav><a href="../asset-study/stadium-probe/route-probe.webm">Geometry route probe</a><a href="../asset-study/stadium-converted/report.json">Export and surface verification</a></nav><figure><img loading="lazy" src="../asset-study/stadium-converted/0650.png" alt="Converted source stadium bank, geometry diagnostic"><figcaption>Local Nintendo source conversion; lighting, spectators and remaining racers still need improvement.</figcaption></figure>'''
html = f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OpenWii overnight visual review</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#10151d;color:#e8edf4;font:16px/1.6 system-ui,sans-serif}}main{{max-width:1200px;margin:auto;padding:40px 24px 80px}}h1{{font-size:36px;line-height:1.15;margin:10px 0 20px}}h2{{margin-top:46px}}h3{{margin-top:32px}}p{{max-width:850px;color:#bdc9d8}}a{{color:#8acaff}}.tag{{color:#ffdc85;font-size:13px;letter-spacing:1px}}video{{display:block;width:100%;max-height:72vh;background:#05070b;border:1px solid #344051}}.pair{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}figure{{margin:0}}img{{width:100%;display:block}}figcaption{{font-size:13px;color:#aebdcd;margin-top:8px}}table{{border-collapse:collapse;width:100%;font-size:14px}}td,th{{text-align:left;padding:12px 10px;border-bottom:1px solid #344051}}.scroll{{overflow-x:auto}}nav{{display:flex;gap:24px;flex-wrap:wrap;margin:20px 0}}@media(max-width:650px){{.pair{{grid-template-columns:1fr}}h1{{font-size:29px}}main{{padding:24px 14px}}}}
</style><main><div class="tag">OPENWII · RECORDED BUILD EVIDENCE</div><h1>Mario Kart overnight review</h1><p>The latest verified recording is <strong>{escape(latest.name)}</strong>. Every listed race has a preserved source snapshot and matching hashes from the actual files loaded by the browser. The focused demo iteration is ready for review; broader visual polish is deferred.</p><nav>{link(latest,"review.html","Latest feedback review")}<a href="current-demo-review.html">Previous five-priority review</a>{link(latest,'keyboard-demo.webm','Full latest race')}{link(latest,'source-hashes.json','Source snapshot')}{link(latest,'loaded-source-verification.json','Loaded-file verification')}<a href="../../OVERNIGHT-LOOP.md">Iteration decisions</a><a href="#next-course">Source course provenance</a><a href="https://www.youtube.com/watch?v=4DBL1iUeFyA">MK8 gameplay reference</a></nav><video controls preload="metadata" poster="{latest.name}/demo-antigravity.png" src="{latest.name}/preview.mp4"></video><p>Unaltered 48-second excerpt of keyboard-driven gameplay. Renderer: {report.get('fps',0):.2f} fps; browser recording: 25 fps. Phone sensor feel still needs Patrick's hands-on review. Sound is deferred.</p><h2>Race views, before and after</h2><p>The latest local pack changes the course geometry itself, so these are comparable race situations rather than identical spatial poses. Use the full recording above to judge motion, camera clearance and race flow.</p>{comparisons}{next_study}<h2>Verified race history</h2><div class="scroll"><table><thead><tr><th>Pass</th><th>Renderer fps</th><th>Race time</th><th>Recording</th><th>Contact sheet</th><th>Verification</th></tr></thead><tbody>{rows}</tbody></table></div><p>Rejected and intermediate experiments, including the blank-render and underpass failures, are retained in the iteration log. Passing checks do not establish visual equivalence to Mario Kart 8.</p></main></html>'''
(root/'review.html').write_text(html)
print(root/'review.html')
