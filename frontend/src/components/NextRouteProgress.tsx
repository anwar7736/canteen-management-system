'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { RouteProgressBar } from './RouteProgress';

function isLegacyRoute(pathname: string) {
  return pathname.startsWith('/t/') ||
    pathname === '/admin' ||
    (pathname.startsWith('/admin/') && pathname !== '/admin/login');
}

export default function NextRouteProgress() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  return (
    <RouteProgressBar
      routeKey={`${pathname}?${search}`}
      enabled={!isLegacyRoute(pathname)}
    />
  );
}
