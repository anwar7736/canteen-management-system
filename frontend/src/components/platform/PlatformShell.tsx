'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faBuilding,
  faCreditCard,
  faHouse,
  faLayerGroup,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';

const navigation = [
  { href: '/platform', label: 'Overview', icon: faHouse },
  { href: '/platform#canteens', label: 'Canteens', icon: faBuilding },
  { href: '/platform#plans', label: 'Plans', icon: faLayerGroup },
  { href: '/platform/payments', label: 'Payments', icon: faCreditCard },
];

export default function PlatformShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  function isActive(href: string) {
    if (href === '/platform/payments') return pathname === href;
    if (href === '/platform') return pathname === href && !hash;
    return pathname === '/platform' && hash === href.slice('/platform'.length);
  }

  return (
    <>
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Platform navigation">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">C</div>
          <div className="min-w-0">
            <div className="brand-title">CanteenOS</div>
            <div className="brand-subtitle">Platform administration</div>
          </div>
        </div>
        <div className="sidebar-section-label">Platform</div>
        <nav className="sidebar-nav">
          {navigation.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive(href) ? 'active' : ''}`}
              aria-current={isActive(href) ? 'page' : undefined}
              onClick={() => setSidebarOpen(false)}
            >
              <FontAwesomeIcon icon={icon} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="font-semibold text-slate-200">Platform admin</div>
          <div className="mt-1">All tenant workspaces</div>
        </div>
      </aside>

      <button
        type="button"
        className={`admin-sidebar-backdrop ${sidebarOpen ? 'is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close platform navigation"
      />

      <header className="admin-topbar">
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={() => setSidebarOpen((current) => !current)}
          aria-label="Open platform navigation"
        >
          <FontAwesomeIcon icon={faBars} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <div className="topbar-shop">Platform administration</div>
          <div className="topbar-caption truncate">CanteenOS control plane</div>
        </div>
        <button
          type="button"
          className="sidebar-link ml-auto w-auto"
          onClick={() => signOut({ callbackUrl: '/platform/login' })}
        >
          <FontAwesomeIcon icon={faPowerOff} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </header>

      <main className="admin-app-main">{children}</main>
    </>
  );
}
