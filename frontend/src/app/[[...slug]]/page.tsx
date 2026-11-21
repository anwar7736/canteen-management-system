import type { Metadata } from 'next';
import LegacyApp from '../legacy-app';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug?.[0] === 'admin') {
    return {
      manifest: '/admin/manifest.webmanifest',
      applicationName: 'Canteen Admin',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Canteen Admin',
      },
    };
  }
  return {};
}

export default async function AppPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  if (!slug?.length) {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="landing-title">
          <div className="auth-brand" aria-hidden="true">C</div>
          <p className="auth-eyebrow">CanteenOS</p>
          <h1 id="landing-title">Run your canteen in one place</h1>
          <p className="auth-description">
            Manage meals, members, orders and statements with a workspace built for your canteen.
          </p>
          <Link className="btn btn-success auth-submit grid place-items-center" href="/signup">
            Create a canteen workspace
          </Link>
          <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
            Already have a workspace? Open <code>/t/your-canteen</code>
          </p>
        </section>
      </main>
    );
  }
  return <LegacyApp />;
}
