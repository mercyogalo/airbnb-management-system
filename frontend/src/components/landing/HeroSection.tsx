import Link from 'next/link';

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative isolate flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-[url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center"
    >
      <div className="absolute inset-0 -z-10 bg-dark/60" />

      <div className="container-shell py-20 text-center text-white">
        <h1 className="mx-auto max-w-4xl text-4xl font-semibold !text-white sm:text-5xl lg:text-6xl">
          Discover Exceptional Stays Crafted for Modern Travelers
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-white/90 sm:text-lg">
          Browse curated homes, book in minutes, and unlock seamless hosting experiences.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#properties" className="btn-primary">
            Explore Properties
          </a>
          <Link href="/register" className="btn-ghost border-white/50 text-white hover:bg-white/10">
            List Your Property
          </Link>
        </div>
      </div>

   
    </section>
  );
}
