import { MedplumClient } from '@medplum/core';

export const medplum = new MedplumClient({
  // Important: point to SERVER, not the Medplum “App” UI
  baseUrl: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'http://localhost:8103',
  onUnauthenticated: () => { /* we handle in pages */ }
});
