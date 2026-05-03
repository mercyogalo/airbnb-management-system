const stats = [
  { label: 'Total Properties', value: '1,250+' },
  { label: 'Cities Covered', value: '80+' },
  { label: 'Happy Guests', value: '24K+' },
  { label: 'Happy guests', value: '1,900+' },
];

export function AboutSection() {
  return (
    <section id="about" className="bg-muted py-20">
      <div className="container-shell grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold sm:text-4xl">Built for guests who crave comfort and confidence</h2>
          <p className="mt-5 max-w-xl text-dark/75">
            StayEasy brings travelers and curated listings together in one polished experience. From discovery to
            checkout, every touchpoint is designed to feel calm, transparent, and fast.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-secondary/15 bg-white p-5 shadow-soft">
              <p className="text-sm text-dark/65">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-secondary">{stat.value}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
