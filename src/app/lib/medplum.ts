import { MedplumClient } from '@medplum/core';

export const medplum = new MedplumClient({
  // Important: point to SERVER, not the Medplum “App” UI
  baseUrl: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'http://localhost:8103',
  clientId: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID,
  cacheTime: 600,
  autoBatchTime: 100,
  onUnauthenticated: () => { /* we handle in pages */ }
});

export function getStoredProfile() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const authMeStr = window.localStorage.getItem('medplum_auth_me');
    if (!authMeStr) {
      return null;
    }

    // The response has structure: { user, project, membership, profile, ... }
    // We want to return the profile object
    const authMe = JSON.parse(authMeStr);
    return authMe.profile || null;
  } catch (err) {
    console.error('Failed to parse medplum_auth_me:', err);
    return null;
  }
}
