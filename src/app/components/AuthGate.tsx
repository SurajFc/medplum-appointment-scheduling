/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { ReactNode, useEffect, useState } from 'react';
import { MedplumProvider } from '@medplum/react';
import { useRouter } from 'next/navigation';
import { medplum } from '../lib/medplum';

export function AuthGate({ children }: { children: ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Fast check using our manual flag
      const hasAuthFlag = typeof window !== 'undefined' && window.localStorage.getItem('isAuthenticated') === 'true';

      if (!hasAuthFlag) {
        console.log('AuthGate: No local storage flag, redirecting to signin');
        router.push('/signin');
        return;
      }

      setAuthorized(true);

      // const profile = await medplum.getProfile();
      // console.log('AuthGate check:', !!profile);
      // if (profile) {
      //     setAuthorized(true);
      // } else {
      //     // Even if flag is present, if medplum profile fails, we aren't auth'd
      //      if (typeof window !== 'undefined') {
      //         window.localStorage.removeItem('isAuthenticated');
      //       }
      //     router.push('/signin');
      // }
    };
    checkAuth();
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading authentication...</div>
      </div>
    );
  }

  return <MedplumProvider medplum={medplum}>{children}</MedplumProvider>;
}
