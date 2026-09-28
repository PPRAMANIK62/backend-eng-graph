# microbench

Small latency measurements on this machine, for the `latency-numbers`
article (experiment 0001). Not a phase build: no harness, nothing else
depends on it.

- `latency.c`: one binary, one mode per measurement (see the top of the file).
- `run.sh`: builds it, runs every mode pinned to CPU 2, writes raw data to
  `data/<date>/`. Needs gcc, taskset, chattr (for btrfs), curl, ping.
  Creates a 2 GiB scratch file in `out/` (gitignored); delete it after.
- `summarize.py`: prints the tables in the experiment write-up.

Leaves out: huge pages, other CPUs (E-cores), writes (the phase 1
fsyncbench covers those), and the bare drive without btrfs and dm-crypt.
