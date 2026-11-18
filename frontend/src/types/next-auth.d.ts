import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'user' | 'admin';
      phone?: string;
      token_no?: string;
      photo?: string;
      address?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'user' | 'admin';
    apiToken: string;
    phone?: string;
    token_no?: string;
    photo?: string;
    address?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'user' | 'admin';
    apiToken?: string;
    phone?: string;
    token_no?: string;
    photo?: string;
    address?: string;
  }
}
