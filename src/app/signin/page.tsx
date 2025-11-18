'use client';
import { MedplumProvider, SignInForm } from '@medplum/react';
import { medplum } from '../lib/medplum';

export default function SignInPage() {
  return (
    <MedplumProvider medplum={medplum}>
      <div className="mx-auto max-w-md bg-white p-6 rounded-xl2 shadow">
        <h1 className="text-xl font-semibold mb-4">Sign in to Medplum</h1>
        <SignInForm onSuccess={() => location.assign('/')} />
      </div>
    </MedplumProvider>
  );
}
