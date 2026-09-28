---
id: fsync
title: What does fsync actually promise?
depth: deep
phase: 1
note: >-
  Forcing data from the page cache to stable storage. What "durable"
  really means, and where drives and filesystems lie.
needs: [page-cache]
leads_to: [crash-consistency, fsync-errors]
compare_with: []
updated: 2026-09-28
---

# What does fsync actually promise?

`fsync(fd)` is the system call that asks the kernel to put a file's data
on storage that survives a power cut, and to block until it's there. It's
the line between "the computer has my data" and "my data is saved", so
every database, queue and log you'll build leans on it. It also promises
less than most people assume, and costs far more on some drives than
others.

## Five places your bytes can be

Take a small order service. A client sends an order; the service writes
it to `orders.log` and replies "saved". Before that reply is honest, the
bytes have to get through several layers, and each one can hold them:

1. **Your program's buffer.** The order sits in memory you allocated.
2. **A library buffer.** If you write through C's `fwrite` or a buffered
   writer in your language, the library may keep the data in your
   process and not make a system call yet.
3. **The [[page-cache]].** After `write`, the kernel has copied the data
   into its cache and marked the pages dirty. It will write them out
   later, when it decides to.
4. **The drive's write cache.** Many drives, especially consumer ones,
   have a volatile cache of their own. They report a write as done once
   it's in that cache, before it's on the flash or platter.
5. **Stable storage.** Only here does the data survive losing power.

A crash of your process loses layers 1 and 2. A kernel crash or power
cut also loses layer 3. A power cut loses layer 4 too. "Saved" means
layer 5.

The laptop this project runs on is a normal case: its WD SN740 NVMe SSD
reports its write cache as "write back", a volatile cache in layer 4
([experiment 0003](../../experiments/0003-what-my-ssd-reports-to-the-kernel.md)
records the setting, and that the driver supports FUA).

![Five layers stacked from top to bottom: your program's buffer, the library buffer, the page cache, the drive's volatile write cache, and stable storage, with the call that moves data down each step. Bars on the right show a process crash wipes out layers 1 and 2, a kernel crash layers 1 to 3, and a power cut layers 1 to 4.](img/fsync-layers.svg)

*The five places a write can wait, and what each kind of failure wipes out. Adapted from Jeff Moyer, "Ensuring data reaches disk" (LWN, 2011).*

## What fsync does

When the order service calls `fsync` on `orders.log`, the kernel does
three things:

- It writes all of the file's dirty pages from the page cache to the
  drive.
- It writes the file's metadata too (the inode: size, timestamps and
  so on).
- It makes the drive flush its volatile cache, or write through it, so
  the data isn't only sitting in layer 4.

Then it waits, and returns only when the device reports the transfer is
complete. At that point the service can reply "saved".

Two things fsync doesn't touch. It can't reach your library's buffer, so
with stdio you call `fflush` first to get the data into the kernel, then
`fsync`. And it isn't free: it waits on the slowest thing in the stack,
the drive.

## Down at the drive: flushes and FUA

The drive's cache is where the kernel needs help from the hardware. The
Linux block layer has two tools for it:

- **A cache flush** (`REQ_PREFLUSH` inside the kernel). Sent before a
  write, it guarantees every write the drive already reported as done is
  on non-volatile storage before this one starts. It can also be sent
  alone, as a pure flush.
- **Force Unit Access, or FUA** (`REQ_FUA`). Set on a write, it tells the
  drive to report completion only after that write is on non-volatile
  storage.

A filesystem implementing fsync sets these flags where it needs them. It
doesn't have to know whether the drive has a volatile cache or supports
FUA. The block layer handles that: for a drive with no volatile cache it
drops the flags, and for a drive with a cache but no FUA it sends a
separate flush after the write.

So on a drive like the SN740, an fsync has to end in a flush or a FUA
write sent to the drive. The kernel's work is done when the drive acknowledges it.
Whether the drive's firmware really moved the data to flash before
saying so is something no program above it can see.

![Two timelines. Top: write A and write B are reported done while still in the drive cache, then a FLUSH completes once both are on flash, and only then does fsync return. Bottom: a single write with FUA set is reported done only after it is on flash, then fsync returns.](img/fsync-flush-fua.svg)

*The two ways fsync gets past the drive cache: writes followed by a flush, or a write with FUA set.*

## fdatasync, O_SYNC and O_DSYNC

fsync has a cheaper sibling and two flags that build it into every write:

- **`fdatasync`** flushes the data and only the metadata needed to read
  it back. A changed file size counts; a changed modification time
  doesn't. It exists to save disk work when you don't need timestamps
  to be durable. For a log you append to, the size changes with every
  write, so that part of the metadata still gets flushed.
- **`O_DSYNC`**, set when opening the file, makes every `write` behave
  like `write` followed by `fdatasync`.
- **`O_SYNC`** makes every `write` behave like `write` followed by
  `fsync`.

The flags trade control for simplicity. With them you can't batch ten
orders and pay for one flush; each write pays its own.

## What fsync doesn't cover

**The file's name.** fsync on a file makes its data and inode durable,
but not necessarily the directory entry that points to it. If the order
service creates `orders-2026-09-28.log` and fsyncs it, a crash can still
leave a directory with no such name. You have to open the directory and
fsync that too. Whether it's needed depends on the filesystem and mount
options, so portable code always does it. The full pattern for replacing
a file safely (write a temp file, fsync it, rename it, fsync the
directory) has its own page, [[atomic-rename]], and the wider question
of what state files are in after a crash is [[crash-consistency]].

**Errors from earlier.** With buffered writes, a failed disk write often
isn't reported by the `write` call, because that call only touched the
page cache. It shows up later, at `fsync`, `msync` or `close`, so their
return values matter. What the kernel does with your data after such a
failure turned out to be a nasty surprise; that's [[fsync-errors]].

**Skipping the cache doesn't replace it.** Files opened with
[[direct-io]] (`O_DIRECT`) bypass the page cache, but the drive's
volatile cache is still there. `O_DIRECT` alone doesn't promise
durability. You still need fsync, or `O_SYNC`/`O_DSYNC` on top.

## What it costs

fsync costs whatever the drive takes to make data durable, and that
varies enormously between drives.

Mark Callaghan measured this in January 2026 on his own machines: fio
writing 16 KB blocks with `O_DIRECT` and calling fsync after each write,
one job, Ubuntu 24.04, mostly ext4. These are his numbers on his drives,
not a rule for yours:

| Drive (his machines) | Kind | fsync after a 16 KB write |
|---|---|---|
| Samsung 990 Pro | consumer | 2,974 µs |
| Crucial T500 | consumer | 891 µs |
| Intel D7-P5520 | datacenter | 12.4 µs |
| Samsung PM-9a3 | enterprise, with power loss protection | 1.6 µs |

On the T500 machine, the same 16 KB writes went from 43,400 writes per
second with no fsync to 1,083 per second with an fsync after each one.

The difference lines up with power loss protection. Enterprise drives
with it have extra hardware, such as capacitors, meant to make losing
cached writes in a power cut unlikely, and in these tests their fsync
was fast. Consumer drives mostly don't have it. The short version of
Callaghan's result: without power loss protection, writes are fast and
fsync is slow.

No fsync timing has been run on this project's laptop yet, so there's no
number for the SN740 here.

## Where it gets tricky

**"Durable" is a chain, and you can see only the top of it.** fsync
returns when the drive says the data is safe. If a mount option or old
software skips the flush, or the drive acknowledges a flush it hasn't
finished, fsync still returns success. For example, with barriers turned
off (the `nobarrier` mount option, as documented in 2011 for ext3, ext4,
XFS and btrfs), fsync doesn't flush the drive's cache at all. Very old kernels and
little-used filesystems also didn't know how to flush drive caches. An
application can't tell which kind of drive or cache it's on, so the safe
assumption is a volatile cache.

**A power loss protection claim isn't the same as a fast fsync.** In
Callaghan's tests the Crucial T500 is described online as having power
loss protection, yet its fsync still took almost 1 ms. Measure your own
drives rather than trusting a spec sheet in either direction.

**A failed fsync needs its own plan.** Don't assume that calling fsync
again after a failure retries the write. Read [[fsync-errors]] before
you write any retry logic.

**The directory rule depends on the filesystem.** Some filesystems make
the new name durable along with the file; others don't. Code that works
on one can lose files on another, which is why the portable answer is to
always fsync the directory.

**`O_DIRECT` is not "durable I/O".** It's easy to read "direct to disk"
as "on disk". It only skips the page cache.

## What this means when you build

- Decide per write whether it must survive a power cut. Scratch data and
  anything you can regenerate may not need fsync. Anything you
  acknowledge to a client does.
- Reply "saved" only after fsync (or fdatasync) returns success.
- Flush your language's buffered writer before calling fsync.
- When you create a file, fsync the directory too.
- Check the return value of fsync and close, and don't retry a failed
  fsync as if nothing happened.
- Batch: many writes, then one fsync, and acknowledge all of them
  together. On Callaghan's Crucial T500, one fsync per 16 KB write held
  the rate to about 1,083 writes per second. Sharing one fsync across
  many writes is how you get past a limit like that.
- Measure fsync latency on the drives you'll deploy on. It can differ by
  a factor of a thousand.

## Further reading

- [fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html), man-pages, 2026. What fsync and fdatasync flush, the directory caveat, and how EIO is reported since Linux 4.13.
- [Ensuring data reaches disk](https://lwn.net/Articles/457667/), Jeff Moyer, 2011. The layer-by-layer model of where data waits, and practical rules for when to fsync. Old, but the model still holds.
- [Explicit volatile write back cache control](https://docs.kernel.org/block/writeback_cache_control.html), Linux kernel developers. How the block layer uses cache flushes and FUA to make fsync reach non-volatile storage.
- [open(2)](https://man7.org/linux/man-pages/man2/open.2.html), man-pages, 2026. The exact meaning of O_SYNC, O_DSYNC and O_DIRECT.
- [SSDs, power loss protection and fsync latency](http://smalldatum.blogspot.com/2026/01/ssds-power-loss-protection-and-fsync.html), Mark Callaghan, 2026. Measured fsync and fdatasync latency on consumer and enterprise SSDs, and why power loss protection matters.
