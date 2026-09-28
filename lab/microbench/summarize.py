"""Summarize the raw data from run.sh. Usage: python3 lab/microbench/summarize.py lab/microbench/data/<run>"""
import statistics
import sys
from collections import defaultdict
from pathlib import Path

d = Path(sys.argv[1])


def pct(xs, p):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(round(p / 100 * (len(xs) - 1))))]


def rows(name):
    return [line.split("\t") for line in (d / name).read_text().splitlines() if line]


print("chase: working set -> ns per dependent load (median of runs, min, max)")
by = defaultdict(list)
for r in rows("chase.tsv"):
    by[int(r[1])].append(float(r[2]))
for size, xs in sorted(by.items()):
    print(f"  {size // 1024:>8} KiB  {statistics.median(xs):7.2f}  ({min(xs):.2f}-{max(xs):.2f})")

print("memread: bytes -> µs to read sequentially (median of reps after the first, min, max)")
by = defaultdict(list)
for r in rows("memread.tsv"):
    by[int(r[1])].append(int(r[2]) / 1000)
for size, xs in sorted(by.items()):
    xs = xs[1:]
    print(f"  {size // 1024:>8} KiB  {statistics.median(xs):9.1f} µs  ({min(xs):.1f}-{max(xs):.1f})"
          f"  = {size / (statistics.median(xs) / 1e6) / 1e9:.1f} GB/s")

for name, label in [("syscall.tsv", "syscall ns per getppid"), ("ctxswitch.tsv", "ctxswitch ns per pipe round trip")]:
    xs = [float(r[1]) for r in rows(name)]
    print(f"{label}: median {statistics.median(xs):.1f} ({min(xs):.1f}-{max(xs):.1f})")

xs = [int(r[1]) / 1000 for r in rows("ssdread.tsv")]
print(f"ssdread µs per 4 KiB O_DIRECT read, n={len(xs)}: p50 {pct(xs, 50):.1f}  p99 {pct(xs, 99):.1f}"
      f"  p99.9 {pct(xs, 99.9):.1f}  max {max(xs):.1f}")

print("ping gateway:", (d / "ping-gateway.txt").read_text().strip().splitlines()[-1])

print("tcp connect ms (handshake only): region p50 min max n")
by = defaultdict(list)
for r in rows("tcp-connect.tsv"):
    if float(r[2]) > 0:
        by[r[0]].append((float(r[2]) - float(r[1])) * 1000)
for region, xs in by.items():
    print(f"  {region:15} {statistics.median(xs):7.1f} {min(xs):7.1f} {max(xs):7.1f} {len(xs)}")
