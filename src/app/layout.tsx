'use client';

import './globals.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { medplum } from './lib/medplum';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = checking, false = not auth, true = auth
  const [showSeedButton, setShowSeedButton] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Debug: Check storage availability
        if (typeof window !== 'undefined') {
          const token = window.localStorage.getItem('medplum.accessToken');
          console.log('RootLayout storage check:', {
            hasToken: !!token,
            tokenStart: token?.substring(0, 10),
            medplumToken: medplum.getAccessToken()
          });
        }

        // const profile = await medplum.getProfile();
        // console.log('Profile: medplum', profile);
        // const nowAuthenticated = !!profile;

        setIsAuthenticated(true);

        // setIsAuthenticated((prevAuth) => {
        //   // Check demo data only when transitioning from unauthenticated to authenticated  
        //   if (nowAuthenticated && !prevAuth) {
        //     checkDemoDataExists().catch(console.error);
        //   }
        //   return nowAuthenticated;
        // });

        // console.log('Auth check:', { profile: !!profile, authenticated: nowAuthenticated });
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };

    // Initial check only - no interval to avoid auth conflicts
    checkAuth();
  }, []);

  const checkDemoDataExists = async () => {
    try {
      const [patients, practitioners, appointments] = await Promise.all([
        medplum.searchResources('Patient', { _count: 1 }),
        medplum.searchResources('Practitioner', { _count: 1 }),
        medplum.searchResources('Appointment', { _count: 1 })
      ]);

      // Show seed button only if no data exists
      setShowSeedButton(patients.length === 0 && practitioners.length === 0 && appointments.length === 0);
    } catch (error) {
      console.error('Failed to check demo data:', error);
      setShowSeedButton(true); // Show button if check fails
    }
  };

  const seedDemoData = async () => {
    setSeeding(true);
    console.log('Starting to seed demo data...');
    try {
      const batchRequest = {
        resourceType: 'Bundle' as const,
        type: 'batch' as const,
        entry: [
          // 3 Patients
          {
            request: { method: 'POST' as const, url: 'Patient' },
            resource: {
              resourceType: 'Patient' as const,
              name: [{ given: ['John'], family: 'Doe' }],
              gender: 'male' as const,
              birthDate: '1985-06-15'
            }
          },
          {
            request: { method: 'POST' as const, url: 'Patient' },
            resource: {
              resourceType: 'Patient' as const,
              name: [{ given: ['Jane'], family: 'Smith' }],
              gender: 'female' as const,
              birthDate: '1990-03-22'
            }
          },
          {
            request: { method: 'POST' as const, url: 'Patient' },
            resource: {
              resourceType: 'Patient' as const,
              name: [{ given: ['Robert'], family: 'Johnson' }],
              gender: 'male' as const,
              birthDate: '1978-11-08'
            }
          },
          // 1 Practitioner
          {
            request: { method: 'POST' as const, url: 'Practitioner' },
            resource: {
              resourceType: 'Practitioner' as const,
              name: [{ given: ['Dr. Sarah'], family: 'Wilson' }],
              qualification: [{ code: { text: 'MD' } }]
            }
          }
        ]
      };

      console.log('Executing batch request with', batchRequest.entry.length, 'entries...');
      const result = await medplum.executeBatch(batchRequest);
      console.log('Batch result:', result);

      // Create appointment using the created resources
      const patientRef = result.entry?.[0]?.response?.location || 'Patient/demo1';
      const practitionerRef = result.entry?.[3]?.response?.location || 'Practitioner/demo1';

      const appointmentRequest = {
        resourceType: 'Bundle' as const,
        type: 'batch' as const,
        entry: [
          {
            request: { method: 'POST' as const, url: 'Appointment' },
            resource: {
              resourceType: 'Appointment' as const,
              status: 'booked' as const,
              start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
              end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // 30 mins later
              participant: [
                { actor: { reference: patientRef }, status: 'accepted' as const },
                { actor: { reference: practitionerRef }, status: 'accepted' as const }
              ]
            }
          }
        ]
      };

      console.log('Creating appointment batch...');
      await medplum.executeBatch(appointmentRequest);
      console.log('Appointment created successfully!');

      notifications.show({
        title: 'Demo data created',
        message: 'Successfully created 3 patients, 1 practitioner, and 1 appointment!',
        color: 'green',
      });

      setShowSeedButton(false);
    } catch (error) {
      console.error('Failed to seed demo data:', error);
      notifications.show({
        title: 'Error seeding data',
        message: 'Failed to create demo data. Please try again.',
        color: 'red',
      });
    } finally {
      setSeeding(false);
    }
  };

  // Redirect to sign-in if not authenticated and not already on sign-in page
  // useEffect(() => {
  //   // if (isAuthenticated === false && typeof window !== 'undefined') {
  //   //   const currentPath = window.location.pathname;
  //   //   if (currentPath !== '/signin') {
  //   //     console.log('Redirecting to sign-in, current path:', currentPath);
  //   //     window.location.href = '/signin';
  //   //   }
  //   // }
  // }, [isAuthenticated]);

  const handleSignOut = async () => {
    try {
      await medplum.signOut();
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('isAuthenticated');
      }
      setIsAuthenticated(false);
      window.location.href = '/signin';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <html lang="en">
        <body suppressHydrationWarning>
          <MantineProvider defaultColorScheme="light">
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-gray-600">Loading…</div>
            </div>
          </MantineProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <MantineProvider defaultColorScheme="light">
          <Notifications />
          <div className="min-h-screen">
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
              <div className="mx-auto max-w-6xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <Image src="/image.png" alt="Wellpro Logo" width={96} height={96} className="w-12 h-12 sm:w-16 sm:h-16" />
                    <span className="font-semibold text-sm sm:text-base">Wellpro EHR Demo</span>
                  </Link>

                  {/* Mobile menu button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-md hover:bg-gray-100"
                    aria-label="Toggle menu"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {mobileMenuOpen ? (
                        <path d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>

                  {/* Desktop navigation */}
                  <nav className="hidden md:flex gap-4 text-sm items-center">
                    <Link className="hover:text-Wellpro-primary" href="/">Dashboard</Link>
                    <a className="hover:text-Wellpro-primary" href="/patients">Patients</a>
                    <a className="hover:text-Wellpro-primary" href="/appointments">Appointments</a>
                    {showSeedButton && (
                      <button
                        onClick={seedDemoData}
                        disabled={seeding}
                        className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded border disabled:opacity-50"
                      >
                        {seeding ? 'Seeding...' : 'Seed demo data'}
                      </button>
                    )}
                    {isAuthenticated === true ? (
                      <button
                        onClick={handleSignOut}
                        className="hover:text-Wellpro-primary text-left"
                      >
                        Sign out
                      </button>
                    ) : (
                      <a className="hover:text-Wellpro-primary" href="/signin">Sign in</a>
                    )}
                  </nav>
                </div>

                {/* Mobile navigation */}
                {mobileMenuOpen && (
                  <nav className="md:hidden mt-4 pb-4 border-t pt-4">
                    <div className="flex flex-col space-y-3">
                      <Link
                        href="/"
                        className="block py-2 hover:text-Wellpro-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/patients"
                        className="block py-2 hover:text-Wellpro-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Patients
                      </Link>
                      <Link
                        href="/appointments"
                        className="block py-2 hover:text-Wellpro-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Appointments
                      </Link>
                      {showSeedButton && (
                        <button
                          onClick={() => {
                            seedDemoData();
                            setMobileMenuOpen(false);
                          }}
                          disabled={seeding}
                          className="text-sm px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded border disabled:opacity-50 text-left"
                        >
                          {seeding ? 'Seeding...' : 'Seed demo data'}
                        </button>
                      )}
                      {isAuthenticated === true ? (
                        <button
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="block py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded border text-left"
                        >
                          Sign Out
                        </button>
                      ) : (
                        <Link
                          href="/signin"
                          className="block py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 rounded border text-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                      )}
                    </div>
                  </nav>
                )}
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6">{children}</main>
          </div>
        </MantineProvider>
      </body>
    </html>
  );
}