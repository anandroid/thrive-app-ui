import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-warm-gray/10 bg-stone">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-sage mb-4">Thrive</h3>
            <p className="text-sm text-foreground/60">
              Your journey to holistic wellness begins here.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><Link href="/services/massage" className="text-sm text-foreground/60 hover:text-foreground">Massage Therapy</Link></li>
              <li><Link href="/services/acupuncture" className="text-sm text-foreground/60 hover:text-foreground">Acupuncture</Link></li>
              <li><Link href="/services/reiki" className="text-sm text-foreground/60 hover:text-foreground">Reiki Healing</Link></li>
              <li><Link href="/services/meditation" className="text-sm text-foreground/60 hover:text-foreground">Meditation</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-foreground/60 hover:text-foreground">About Us</Link></li>
              <li><Link href="/practitioners" className="text-sm text-foreground/60 hover:text-foreground">Our Practitioners</Link></li>
              <li><Link href="/testimonials" className="text-sm text-foreground/60 hover:text-foreground">Testimonials</Link></li>
              <li><Link href="/blog" className="text-sm text-foreground/60 hover:text-foreground">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-sm text-foreground/60">123 Wellness Street</li>
              <li className="text-sm text-foreground/60">Healing City, HC 12345</li>
              <li className="text-sm text-foreground/60">Phone: (555) 123-4567</li>
              <li className="text-sm text-foreground/60">Email: info@thrive.com</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-warm-gray/10">
          <p className="text-center text-sm text-foreground/60">
            © {new Date().getFullYear()} Thrive. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}