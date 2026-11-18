import { Suspense } from 'react';
import LoginForm from '../../components/auth/LoginForm';
import LoadingScreen from '../../components/LoadingScreen';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading sign in" />}>
      <LoginForm role="user" />
    </Suspense>
  );
}
