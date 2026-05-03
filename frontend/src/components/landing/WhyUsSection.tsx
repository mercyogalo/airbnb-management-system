import { BadgeCheck, CalendarCheck2, Headset, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: BadgeCheck,
    title: 'Verified Properties',
    text: 'Every listing is reviewed to ensure quality, safety, and trust.',
  },
  {
    icon: CalendarCheck2,
    title: 'Instant Booking',
    text: 'Reserve your stay in minutes with transparent pricing and fast checkout.',
  },
  {
    icon: Headset,
    title: '24/7 Support',
    text: 'Need help? Our support team is always one message away.',
  },
  {
    icon: ShieldCheck,
    title: 'Best Price Guarantee',
    text: 'Straightforward pricing with no hidden fees — what you see is what you pay.',
  },
];

export function WhyUsSection() {
  return (
    <section className="bg-muted py-20">
      <div className="container-shell">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">Why Choose StayEasy?</h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
                <span className="inline-flex rounded-xl bg-muted p-3 text-secondary">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-dark/70">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
