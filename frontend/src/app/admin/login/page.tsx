import { Suspense } from 'react';
import LoginForm from '../../../components/auth/LoginForm';
import LoadingScreen from '../../../components/LoadingScreen';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading sign in" />}>
      <LoginForm role="admin" />
    </Suspense>
  );
}
