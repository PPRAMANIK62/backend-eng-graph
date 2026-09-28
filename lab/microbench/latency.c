// Small latency measurements for the latency-numbers article (experiment 0001).
// Not a phase build. Each mode prints one line per measurement, tab-separated.
//
//   latency chase <bytes> <loads>     ns per dependent load, working set of <bytes>
//   latency syscall <calls>           ns per getppid() system call
//   latency ctxswitch <roundtrips>    ns per switch, two processes ping-ponging a pipe
//   latency ssdread <file> <reads>    ns per random 4 KiB O_DIRECT read, one line per read
//   latency memread <bytes> <reps>    ns to read <bytes> sequentially from RAM
#define _GNU_SOURCE
#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

static uint64_t now_ns(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)ts.tv_sec * 1000000000u + ts.tv_nsec;
}

// xorshift64: a fast PRNG so the shuffle doesn't dominate setup time.
static uint64_t rng = 88172645463325252ull;
static uint64_t next_rand(void) {
    rng ^= rng << 13;
    rng ^= rng >> 7;
    rng ^= rng << 17;
    return rng;
}

// One node per 64-byte cache line. The nodes form a single random cycle, so
// each load depends on the one before and the prefetcher can't guess the next.
struct node { struct node *next; char pad[56]; };

static void chase(size_t bytes, uint64_t loads) {
    size_t n = bytes / sizeof(struct node);
    struct node *nodes = aligned_alloc(4096, n * sizeof(struct node));
    size_t *order = malloc(n * sizeof(size_t));
    for (size_t i = 0; i < n; i++) order[i] = i;
    for (size_t i = n - 1; i > 0; i--) {
        size_t j = next_rand() % (i + 1);
        size_t t = order[i]; order[i] = order[j]; order[j] = t;
    }
    for (size_t i = 0; i < n; i++) nodes[order[i]].next = &nodes[order[(i + 1) % n]];
    free(order);

    struct node *p = &nodes[0];
    for (size_t i = 0; i < n; i++) p = p->next;  // warm up: touch every line once
    uint64_t t0 = now_ns();
    for (uint64_t i = 0; i < loads; i++) p = p->next;
    uint64_t t1 = now_ns();
    // Print p so the compiler can't drop the loop.
    printf("chase\t%zu\t%.2f\t%p\n", bytes, (double)(t1 - t0) / loads, (void *)p);
    free(nodes);
}

static void sys_call(uint64_t calls) {
    uint64_t t0 = now_ns();
    for (uint64_t i = 0; i < calls; i++) syscall(SYS_getppid);
    uint64_t t1 = now_ns();
    printf("syscall\t%.2f\n", (double)(t1 - t0) / calls);
}

// Parent writes a byte to pipe a, child reads it and writes it back on pipe b.
// Pinned to one core, every hop forces a switch between the two processes.
// One round trip = 2 switches, plus 2 writes and 2 reads.
static void ctx_switch(uint64_t trips) {
    int a[2], b[2];
    char c = 'x';
    if (pipe(a) || pipe(b)) { perror("pipe"); exit(1); }
    pid_t pid = fork();
    if (pid == 0) {
        for (uint64_t i = 0; i < trips; i++) {
            if (read(a[0], &c, 1) != 1 || write(b[1], &c, 1) != 1) _exit(1);
        }
        _exit(0);
    }
    uint64_t t0 = now_ns();
    for (uint64_t i = 0; i < trips; i++) {
        if (write(a[1], &c, 1) != 1 || read(b[0], &c, 1) != 1) exit(1);
    }
    uint64_t t1 = now_ns();
    waitpid(pid, NULL, 0);
    printf("ctxswitch_roundtrip\t%.2f\n", (double)(t1 - t0) / trips);
}

static void ssd_read(const char *path, uint64_t reads) {
    int fd = open(path, O_RDONLY | O_DIRECT);
    if (fd < 0) { perror("open"); exit(1); }
    struct stat st;
    fstat(fd, &st);
    uint64_t blocks = st.st_size / 4096;
    void *buf = aligned_alloc(4096, 4096);
    for (uint64_t i = 0; i < reads; i++) {
        off_t off = (off_t)(next_rand() % blocks) * 4096;
        uint64_t t0 = now_ns();
        if (pread(fd, buf, 4096, off) != 4096) { perror("pread"); exit(1); }
        uint64_t t1 = now_ns();
        printf("ssdread\t%llu\n", (unsigned long long)(t1 - t0));
    }
    close(fd);
}

static void mem_read(size_t bytes, int reps) {
    uint64_t *buf = aligned_alloc(4096, bytes);
    memset(buf, 1, bytes);
    size_t n = bytes / sizeof(uint64_t);
    uint64_t sum = 0;
    for (int r = 0; r < reps; r++) {
        uint64_t t0 = now_ns();
        for (size_t i = 0; i < n; i++) sum += buf[i];
        uint64_t t1 = now_ns();
        printf("memread\t%zu\t%llu\t%llu\n", bytes, (unsigned long long)(t1 - t0), (unsigned long long)(sum & 1));
    }
    free(buf);
}

int main(int argc, char **argv) {
    if (argc < 3) { fprintf(stderr, "usage: see top of latency.c\n"); return 2; }
    const char *mode = argv[1];
    if (!strcmp(mode, "chase") && argc == 4) chase(strtoull(argv[2], 0, 10), strtoull(argv[3], 0, 10));
    else if (!strcmp(mode, "syscall")) sys_call(strtoull(argv[2], 0, 10));
    else if (!strcmp(mode, "ctxswitch")) ctx_switch(strtoull(argv[2], 0, 10));
    else if (!strcmp(mode, "ssdread") && argc == 4) ssd_read(argv[2], strtoull(argv[3], 0, 10));
    else if (!strcmp(mode, "memread") && argc == 4) mem_read(strtoull(argv[2], 0, 10), atoi(argv[3]));
    else { fprintf(stderr, "bad arguments\n"); return 2; }
    return 0;
}
