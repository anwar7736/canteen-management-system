import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'user' | 'admin' | 'platform_admin';
      tenantSlug?: string;
      phone?: string;
      token_no?: string;
      photo?: string;
      address?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'user' | 'admin' | 'platform_admin';
    tenantSlug?: string;
    apiToken: string;
    phone?: string;
    token_no?: string;
    photo?: string;
    address?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'user' | 'admin' | 'platform_admin';
    tenantSlug?: string;
    apiToken?: string;
    phone?: string;
    token_no?: string;
    photo?: string;
    address?: string;
    impersonationId?: number;
    impersonatedUserName?: string;
    tenantName?: string;
    expiresAt?: string;
  }
}
