import Link from 'next/link';

export function CTASection() {
  return (
    <section className="bg-secondary py-16">
      <div className="container-shell text-center">
        <h2 className="text-3xl font-semibold !text-white sm:text-4xl">Ready to find your perfect stay?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80">
          Join thousands of travelers and hosts already building unforgettable experiences with StayEasy.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="rounded-xl bg-white px-6 py-2.5 font-semibold text-secondary">
            Sign Up as Guest
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-white/40 px-6 py-2.5 font-semibold text-white transition hover:bg-white/10"
          >
            List Your Property
          </Link>
        </div>
      </div>
    </section>
  );
}
