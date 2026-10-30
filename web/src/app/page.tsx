/** @jsxImportSource preact */
import { LandingPage } from '../components/LandingPage.js';

export const metadata = {
  title: 'Froot Framework — Ultra-Fast, Monomorphic TypeScript Web Framework',
  description:
    'Engineered for 124,000+ req/sec, monomorphic inline caching, Next.js-style file-based routing, Preact SSR, and native Tailwind CSS v4.',
};

export default function HomePage() {
  return <LandingPage />;
}
