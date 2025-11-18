/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { ReactNode, useEffect, useState } from 'react';
import { MedplumProvider } from '@medplum/react';
import { medplum } from '../lib/medplum';

export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) return null;
  if (!Boolean(medplum.getProfile())) { if (typeof window !== 'undefined') location.assign('/signin'); return null; }
  return <MedplumProvider medplum={medplum}>{children}</MedplumProvider>;
}
