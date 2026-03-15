const testimonials = [
  {
    name: 'Maya R.',
    quote: 'The booking process was smooth, and the place looked exactly like the photos. I am sold.',
    rating: 5,
  },
  {
    name: 'Daniel K.',
    quote: 'As a frequent traveler, this is the first platform that made every step feel effortless.',
    rating: 5,
  },
  {
    name: 'Priya S.',
    quote: 'Great customer support and wonderful hosts. I found my new go-to app for short stays.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-primary py-20">
      <div className="container-shell">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">What Our Guests Say</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-soft">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl font-semibold text-secondary">
                {testimonial.name.charAt(0)}
              </div>
              <h3 className="text-xl font-semibold">{testimonial.name}</h3>
              <p className="mt-1 text-sm text-amber-500">{'★'.repeat(testimonial.rating)}</p>
              <p className="mt-4 text-sm text-dark/75">{testimonial.quote}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
