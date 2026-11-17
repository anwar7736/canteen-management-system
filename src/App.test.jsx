import { afterEach, beforeEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import AdminRoutes from './admin/routes/Routes';

afterEach(cleanup);

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/login');
});

test('renders the user login route', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'User Login' })).toBeInTheDocument();
});

test('renders the admin login route', async () => {
  render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <AdminRoutes />
    </MemoryRouter>
  );
  expect(await screen.findByRole('heading', { name: 'Admin Login' })).toBeInTheDocument();
});
