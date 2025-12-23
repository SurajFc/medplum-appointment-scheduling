'use client';
import { MedplumProvider, SignInForm } from '@medplum/react';
import { useRouter } from 'next/navigation';
import { medplum } from '../lib/medplum';

export default function SignInPage() {
  const router = useRouter();
  return (
    <MedplumProvider medplum={medplum}>
      <div className="mx-auto max-w-md bg-white p-6 rounded-xl2 shadow">
        <h1 className="text-xl font-semibold mb-4">Sign in to Medplum</h1>
        <SignInForm onSuccess={async () => {
          console.log('Signed in');
          try {
            const me = await medplum.get('auth/me');
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('isAuthenticated', 'true');
              window.localStorage.setItem('medplum_auth_me', JSON.stringify(me));
            }
          } catch (err) {
            console.error('Failed to fetch/save auth/me:', err);
          }
          router.push('/');
        }} />
      </div>
    </MedplumProvider>
  );
}
