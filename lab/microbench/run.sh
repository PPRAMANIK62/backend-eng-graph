#!/usr/bin/env bash
# Runs every measurement for experiment 0001 and writes raw results to data/<date>/.
# Usage: lab/microbench/run.sh
set -euo pipefail
cd "$(dirname "$0")"

CPU=2          # a P-core on the i5-13500H (CPUs 0-7 are P-cores); not CPU 0, which takes more interrupts
RUNS=11
OUT="data/$(date +%F)"
SCRATCH="out"  # gitignored: holds the 2 GiB test file
mkdir -p "$OUT" "$SCRATCH"

gcc -O2 -Wall -o "$SCRATCH/latency" latency.c
BIN="$SCRATCH/latency"
PIN="taskset -c $CPU"

{
  echo "date: $(date -Is)"
  uname -a
  lscpu | grep -E 'Model name|^CPU\(s\)|L1d|L1i|L2|L3'
  echo "governor: $(cat /sys/devices/system/cpu/cpu$CPU/cpufreq/scaling_governor)"
  gcc --version | head -1
  free -b | head -2
  findmnt -no FSTYPE,OPTIONS -T "$SCRATCH"
  lsblk -dno NAME,MODEL /dev/nvme0n1
} > "$OUT/machine.txt"

# Cache and RAM: dependent loads over working sets from 16 KiB to 1 GiB.
: > "$OUT/chase.tsv"
for size in 16384 32768 262144 1048576 2097152 8388608 16777216 67108864 268435456 1073741824; do
  for r in $(seq $RUNS); do $PIN "$BIN" chase "$size" 50000000 >> "$OUT/chase.tsv"; done
done

# Sequential read of 1 MiB that sits in RAM (and mostly in L3 after the first rep).
$PIN "$BIN" memread 1048576 $RUNS > "$OUT/memread.tsv"
# Sequential read of 256 MiB, far bigger than L3, so it streams from RAM.
$PIN "$BIN" memread 268435456 $RUNS >> "$OUT/memread.tsv"

: > "$OUT/syscall.tsv"
for r in $(seq $RUNS); do $PIN "$BIN" syscall 10000000 >> "$OUT/syscall.tsv"; done

: > "$OUT/ctxswitch.tsv"
for r in $(seq $RUNS); do $PIN "$BIN" ctxswitch 1000000 >> "$OUT/ctxswitch.tsv"; done

# SSD: 2 GiB of random bytes, compression off for this file (chattr +m on btrfs),
# then random 4 KiB reads with O_DIRECT so the page cache is skipped.
FILE="$SCRATCH/ssd.bin"
if [ ! -f "$FILE" ]; then
  touch "$FILE"
  chattr +m "$FILE"
  dd if=/dev/urandom of="$FILE" bs=1M count=2048 status=none
  sync "$FILE"
fi
lsattr "$FILE" >> "$OUT/machine.txt"
$PIN "$BIN" ssdread "$FILE" 20000 > "$OUT/ssdread.tsv"

# Network: one TCP handshake = one round trip. time_connect minus time_namelookup
# is the handshake alone. Over this machine's Wi-Fi.
ping -c 50 -i 0.2 -q "$(ip route | awk '/^default/ {print $3; exit}')" > "$OUT/ping-gateway.txt"
: > "$OUT/tcp-connect.tsv"
for region in ap-south-1 ap-southeast-1 eu-west-1 us-east-1 us-west-2 sa-east-1; do
  for r in $(seq $RUNS); do
    curl -s -o /dev/null --max-time 10 \
      -w "$region\t%{time_namelookup}\t%{time_connect}\n" \
      "https://dynamodb.$region.amazonaws.com/" >> "$OUT/tcp-connect.tsv" || true
  done
done

echo "raw data in lab/microbench/$OUT"
