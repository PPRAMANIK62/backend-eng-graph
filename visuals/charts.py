"""Generate the phase 1 data charts from experiment 0001's raw data.

Usage: python3 visuals/charts.py
Reads lab/microbench/data/run-1/, writes SVGs to content/nodes/phase-1/img/.
Every number drawn comes from the raw data or, for Dean's 2009 values, from
content/sources/dean-ladis-2009.md.
"""
import math
import re
import statistics
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "lab/microbench/data/run-1"
OUT = ROOT / "content/nodes/phase-1/img"

# The shared style block, copied from the reference figure so the charts match.
STYLE = re.search(r"<style>.*?</style>", (ROOT / "visuals/reference.svg").read_text(), re.S).group(0)
STYLE = STYLE.replace("</style>", """    .grid{stroke:#8a8984;stroke-opacity:.3;stroke-width:1}
    .dot{fill:#2a78d6} .ring{fill:none;stroke:#52514e;stroke-width:1.5}
    .curve{stroke:#2a78d6;stroke-width:2;fill:none}
    @media (prefers-color-scheme: dark){ .dot{fill:#3987e5} .ring{stroke:#c3c2b7} .curve{stroke:#3987e5} }
  </style>""")
FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif"


def rows(name):
    return [line.split("\t") for line in (DATA / name).read_text().splitlines() if line]


def pct(xs, p):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(round(p / 100 * (len(xs) - 1))))]


def fmt_ns(ns):
    for unit, scale in (("ms", 1e6), ("µs", 1e3)):
        if ns >= scale:
            v = ns / scale
            return f"{v:.1f} {unit}" if v < 100 else f"{v:.0f} {unit}"
    return f"{ns:.1f} ns" if ns < 100 else f"{ns:.0f} ns"


def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
            f'font-family="{FONT}">\n  {STYLE}\n{body}\n</svg>\n')


# ---- measured values -------------------------------------------------------

chase = defaultdict(list)
for r in rows("chase.tsv"):
    chase[int(r[1])].append(float(r[2]))
chase = {size: statistics.median(v) for size, v in sorted(chase.items())}

syscall = statistics.median(float(r[1]) for r in rows("syscall.tsv"))
pipe = statistics.median(float(r[1]) for r in rows("ctxswitch.tsv"))
ssd = pct([int(r[1]) for r in rows("ssdread.tsv")], 50)
ping_min = float(re.search(r"= ([\d.]+)/", (DATA / "ping-gateway.txt").read_text()).group(1)) * 1e6
tcp = defaultdict(list)
for r in rows("tcp-connect.tsv"):
    if float(r[2]) > 0:
        tcp[r[0]].append((float(r[2]) - float(r[1])) * 1e9)
tcp = {k: statistics.median(v) for k, v in tcp.items()}

# ---- chart 1: latency ladder (dot plot, log x) ----------------------------

KiB, MiB = 1024, 1024 * 1024
ladder = [  # label, measured ns, Dean 2009 ns for the same operation (or None)
    ("Load from L1 (16 KiB set)", chase[16 * KiB], 0.5),
    ("Load from L2 (256 KiB set)", chase[256 * KiB], 7),
    ("Load from L3 (8 MiB set)", chase[8 * MiB], None),
    ("Empty system call", syscall, None),
    ("Load from RAM (64 MiB set)", chase[64 * MiB], 100),
    ("Pipe round trip, 2 switches", pipe, None),
    ("Random 4 KiB SSD read (p50)", ssd, None),
    ("Ping home router (best)", ping_min, None),
    ("TCP handshake, AWS Mumbai", tcp["ap-south-1"], None),
    ("TCP handshake, AWS Virginia", tcp["us-east-1"], None),
]
W, left, right, top, rowh = 720, 230, 40, 56, 30
lo, hi = -1, 9  # log10 ns: 0.1 ns to 1 s
H = top + rowh * len(ladder) + 44
x = lambda ns: left + (math.log10(ns) - lo) / (hi - lo) * (W - left - right)
b = []
for d, lab in [(-1, "0.1 ns"), (0, "1 ns"), (1, ""), (2, "100 ns"), (3, "1 µs"), (4, ""), (5, "100 µs"),
               (6, "1 ms"), (7, ""), (8, "100 ms"), (9, "1 s")]:
    xx = x(10 ** d)
    b.append(f'  <line x1="{xx:.1f}" y1="{top - 10}" x2="{xx:.1f}" y2="{H - 34}" class="grid"/>')
    if lab:
        b.append(f'  <text x="{xx:.1f}" y="{H - 16}" text-anchor="middle" class="ink2 n">{lab}</text>')
for i, (label, ns, dean) in enumerate(ladder):
    y = top + i * rowh + rowh / 2
    b.append(f'  <text x="{left - 12}" y="{y + 4:.1f}" text-anchor="end" class="ink n">{label}</text>')
    if dean:
        b.append(f'  <circle cx="{x(dean):.1f}" cy="{y:.1f}" r="8" class="ring"/>')
    b.append(f'  <circle cx="{x(ns):.1f}" cy="{y:.1f}" r="5" class="dot"/>')
    tx, anchor = x(ns) + 13, "start"
    if dean and dean > ns:  # keep the value label clear of the Dean ring
        tx, anchor = x(ns) - 10, "end"
    b.append(f'  <text x="{tx:.1f}" y="{y + 4:.1f}" text-anchor="{anchor}" class="ink n">{fmt_ns(ns)}</text>')
b.append(f'  <circle cx="{left + 6}" cy="22" r="5" class="dot"/>'
         f'<text x="{left + 18}" y="26" class="ink n">This laptop (median)</text>')
b.append(f'  <circle cx="{left + 256}" cy="22" r="8" class="ring"/>'
         f'<text x="{left + 268}" y="26" class="ink n">Dean\'s 2009 table, same operation</text>')
(OUT / "latency-numbers-ladder.svg").write_text(svg(W, H, "\n".join(b)))

# ---- chart 2: the staircase (log x, log y) ---------------------------------

W, H, left, right, top, bottom = 720, 360, 64, 30, 30, 56
xs = sorted(chase)
xlo, xhi = math.log2(xs[0]), math.log2(xs[-1])
ylo, yhi = 0, math.log10(200)  # 1 ns to 200 ns
px = lambda size: left + (math.log2(size) - xlo) / (xhi - xlo) * (W - left - right)
py = lambda ns: top + (1 - (math.log10(ns) - ylo) / (yhi - ylo)) * (H - top - bottom)
b = []
for ns in (1, 2, 5, 10, 20, 50, 100, 200):
    b.append(f'  <line x1="{left}" y1="{py(ns):.1f}" x2="{W - right}" y2="{py(ns):.1f}" class="grid"/>')
    b.append(f'  <text x="{left - 8}" y="{py(ns) + 4:.1f}" text-anchor="end" class="ink2 n">{ns}</text>')
b.append(f'  <text x="16" y="{top + (H - top - bottom) / 2:.1f}" text-anchor="middle" class="ink2 n" '
         f'transform="rotate(-90 16 {top + (H - top - bottom) / 2:.1f})">ns per load</text>')
for size in xs:
    lab = f"{size // KiB} KiB" if size < MiB else (f"{size // MiB} MiB" if size < 1024 * MiB else "1 GiB")
    b.append(f'  <text x="{px(size):.1f}" y="{H - bottom + 18}" text-anchor="middle" class="ink2 n">{lab}</text>')
b.append(f'  <text x="{left + (W - left - right) / 2:.1f}" y="{H - 10}" text-anchor="middle" class="ink2 n">'
         f'working set (log scale)</text>')
l3 = px(18 * MiB)
b.append(f'  <line x1="{l3:.1f}" y1="{top}" x2="{l3:.1f}" y2="{H - bottom}" class="ring" stroke-dasharray="4 4"/>')
b.append(f'  <text x="{l3 - 6:.1f}" y="{H - bottom - 10}" text-anchor="end" class="ink2 n">L3 size, 18 MiB</text>')
pts = " ".join(f"{px(s):.1f},{py(chase[s]):.1f}" for s in xs)
b.append(f'  <polyline points="{pts}" class="curve"/>')
for s in xs:
    b.append(f'  <circle cx="{px(s):.1f}" cy="{py(chase[s]):.1f}" r="4" class="dot"/>')
for s, above in ((16 * KiB, True), (256 * KiB, True), (8 * MiB, True), (64 * MiB, True), (1024 * MiB, False)):
    y = py(chase[s]) - 12 if above else py(chase[s]) + 22
    b.append(f'  <text x="{px(s):.1f}" y="{y:.1f}" text-anchor="middle" class="ink n">{fmt_ns(chase[s])}</text>')
(OUT / "memory-hierarchy-staircase.svg").write_text(svg(W, H, "\n".join(b)))

print("wrote", OUT / "latency-numbers-ladder.svg", OUT / "memory-hierarchy-staircase.svg")
