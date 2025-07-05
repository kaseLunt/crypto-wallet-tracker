import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-5xl">
        <h1 className="gradient-crypto mb-8 bg-clip-text text-center font-bold text-6xl text-transparent">
          Crypto Portfolio Tracker
        </h1>
        <p className="mb-12 text-center text-black/60 text-xl dark:text-white/60">
          Track your multi-chain crypto portfolio with real-time analytics
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard" className="btn-primary glow-crypto">
            Get Started
          </Link>
          <Link
            href="/demo"
            className="rounded-lg border border-black/20 px-6 py-3 transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
          >
            View Demo
          </Link>
        </div>
      </div>
    </main>
  );
}
