'use client';

import dynamic from 'next/dynamic';
import LoadingScreen from '../components/LoadingScreen';

const App = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => <LoadingScreen label="Loading Canteen Management" />,
});

export default function LegacyApp() {
  return <App />;
}
