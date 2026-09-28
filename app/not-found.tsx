import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="font-mono text-xs text-muted-foreground">404</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Nothing here</h1>
        <p className="mt-2 text-muted-foreground">That concept isn&apos;t written yet, or the link is wrong.</p>
        <Link href="/" className="mt-5 inline-block rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
          Back to the map
        </Link>
      </div>
    </main>
  );
}
