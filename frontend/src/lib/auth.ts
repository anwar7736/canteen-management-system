import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { API_BACKEND_URL } from './server-api-base-url';

type LoginRole = 'user' | 'admin';
type LoginUser = User & {
  role: LoginRole;
  email?: string | null;
  phone?: string;
  token_no?: string;
  photo?: string;
  address?: string;
  apiToken: string;
};

async function authorizeLogin(credentials: Record<string, string>): Promise<LoginUser | null> {
  const role = credentials.role === 'admin' ? 'admin' : 'user';
  const username = credentials.username?.trim();
  const password = credentials.password;

  if (!username || !password) return null;

  try {
    let response: Response;
    if (role === 'admin') {
      const body = new FormData();
      body.append('username', username);
      body.append('password', password);
      response = await fetch(`${API_BACKEND_URL}admin_login`, {
        method: 'POST',
        body,
        cache: 'no-store',
      });
    } else {
      response = await fetch(`${API_BACKEND_URL}login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        cache: 'no-store',
      });
    }

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();
    let user: LoginUser | null = null;
    if (
      role === 'user' &&
      Array.isArray(data) &&
      data[0] === 'user' &&
      data[1] &&
      typeof data[1] === 'object'
    ) {
      const record = data[1] as Record<string, unknown>;
      if (typeof record.api_token !== 'string' || record.role !== 'user') return null;
      user = {
        id: String(record.id),
        name: String(record.name || username),
        email: typeof record.email === 'string' ? record.email : null,
        role,
        token_no: typeof record.token_no === 'string' ? record.token_no : undefined,
        photo: typeof record.photo === 'string' ? record.photo : undefined,
        address: typeof record.address === 'string' ? record.address : undefined,
        apiToken: record.api_token,
      };
    } else if (role === 'admin' && data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (record.id !== undefined && record.role === 'admin' && typeof record.api_token === 'string') {
        user = {
          id: String(record.id),
          name: username,
          email: typeof record.email === 'string' ? record.email : null,
          phone: typeof record.phone === 'string' ? record.phone : undefined,
          role,
          apiToken: record.api_token,
        };
      }
    }

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Authentication service request failed:', error);
    throw new Error('Authentication service is unavailable.');
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Canteen account',
      credentials: {
        role: { label: 'Account type', type: 'text' },
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: authorizeLogin,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const account = user as LoginUser;
        token.sub = account.id;
        token.role = account.role;
        token.name = account.name;
        token.email = account.email;
        token.phone = account.phone;
        token.token_no = account.token_no;
        token.photo = account.photo;
        token.address = account.address;
        token.apiToken = account.apiToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.role = token.role === 'admin' ? 'admin' : 'user';
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.phone = token.phone;
        session.user.token_no = token.token_no;
        session.user.photo = token.photo;
        session.user.address = token.address;
      }
      return session;
    },
  },
};
