import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="container-shell grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-2xl font-semibold !text-white">StayEasy</h3>
          <p className="mt-3 text-sm text-white/80">Curated stays, clear availability, and M-Pesa checkout for guests.</p>
        </div>

        <div>
          <h4 className="text-lg font-semibold !text-white">Quick links</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <a href="#about">About</a>
            </li>
            <li>
              <a href="#properties">Properties</a>
            </li>
            <li>
              <a href="#testimonials">Testimonials</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold !text-white">Guests</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <Link href="/register">Sign up</Link>
            </li>
            <li>
              <Link href="/login">Log in</Link>
            </li>
            <li>
              <Link href="/properties">Browse stays</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold !text-white">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>support@stayeasy.com</li>
            <li>+254 (0) 700 000 000</li>
            <li>Nairobi, Kenya</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="container-shell py-4 text-center text-sm text-white/70">
          {new Date().getFullYear()} StayEasy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
