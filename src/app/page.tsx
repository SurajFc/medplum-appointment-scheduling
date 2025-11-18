'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Patient, Appointment } from '@medplum/fhirtypes';
import { notifications } from '@mantine/notifications';
import { medplum } from './lib/medplum';
import { AuthGate } from './components/AuthGate';

interface DashboardStats {
  totalPatients: number;
  totalPractitioners: number;
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalPractitioners: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get patient display name
  const getPatientName = (patient: Patient) => {
    const name = patient.name?.[0];
    if (!name) return `Patient/${patient.id}`;
    const full = [name.given?.join(' '), name.family].filter(Boolean).join(' ');
    return full || `Patient/${patient.id}`;
  };

  // Helper function to check if date is today
  const isToday = (date: string) => {
    const today = new Date().toDateString();
    return new Date(date).toDateString() === today;
  };

  // Helper function to check if date is in the future
  const isFuture = (date: string) => {
    return new Date(date) > new Date();
  };

  // Load dashboard data function (wrapped with useCallback for stable reference)
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Starting dashboard data load...');
      
      const profile = await medplum.getProfile();
      if (!profile) {
        console.log('Dashboard: No profile found, user not authenticated');
        return;
      }
      
      console.log('Dashboard: User authenticated, profile:', profile.id, 'loading data...');

      // Load all data in parallel
      const [patientsResult, practitionersResult, appointmentsResult] = await Promise.all([
        medplum.searchResources('Patient', { _count: 100 }),
        medplum.searchResources('Practitioner', { _count: 100 }),
        medplum.searchResources('Appointment', { _count: 100 }) // Removed invalid _sort parameter
      ]);

      // Ensure we have arrays
      const patients = Array.isArray(patientsResult) ? patientsResult : [];
      const practitioners = Array.isArray(practitionersResult) ? practitionersResult : [];
      const appointments = Array.isArray(appointmentsResult) ? appointmentsResult : [];

      console.log('Dashboard data loaded:', {
        patients: patients.length,
        practitioners: practitioners.length,
        appointments: appointments.length,
        patientsType: typeof patientsResult,
        practitionersType: typeof practitionersResult,
        appointmentsType: typeof appointmentsResult,
        patientsResult,
        practitionersResult,
        appointmentsResult
      });

      // Calculate stats
      const todayAppointments = appointments.filter((app: Appointment) => 
        app.start && isToday(app.start)
      ).length;

      const upcomingAppointments = appointments.filter((app: Appointment) => 
        app.start && isFuture(app.start)
      ).length;

      setStats({
        totalPatients: patients.length,
        totalPractitioners: practitioners.length,
        totalAppointments: appointments.length,
        todayAppointments,
        upcomingAppointments,
      });

      // Set recent data (last 5 items)
      setRecentAppointments(appointments.slice(0, 5));
      setRecentPatients(patients.slice(0, 5));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      
      // Try to provide more specific error information
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      
      notifications.show({
        title: 'Error loading dashboard',
        message: 'Failed to load dashboard data. Please refresh the page or try signing in again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <AuthGate>
        <div className="space-y-6">
          <div className="bg-white rounded-xl2 shadow p-8 text-center text-gray-600">
            Loading dashboard...
          </div>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Healthcare Dashboard</h1>
            <button
              onClick={() => loadDashboardData()}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
          <p className="text-gray-600 mt-1">Welcome to Altura EHR Demo</p>
          {(stats.totalPatients === 0 && stats.totalPractitioners === 0 && stats.totalAppointments === 0) && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                📋 No data found. Try clicking the &quot;Seed demo data&quot; button in the navigation to populate sample records.
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 text-lg sm:text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Practitioners</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalPractitioners}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 text-lg sm:text-xl">👨‍⚕️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 text-lg sm:text-xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Today&apos;s Appointments</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-yellow-600 text-lg sm:text-xl">🗓️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <span className="text-indigo-600 text-lg sm:text-xl">⏰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/patients"
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white text-lg">👥</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">View Patients</p>
                <p className="text-sm text-gray-600">Manage patient records</p>
              </div>
            </Link>

            <Link
              href="/appointments"
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white text-lg">📅</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Appointments</p>
                <p className="text-sm text-gray-600">Schedule & manage</p>
              </div>
            </Link>

            <button
              onClick={() => notifications.show({
                title: 'Feature Coming Soon',
                message: 'Calendar view will be available in the next update!',
                color: 'blue',
              })}
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white text-lg">📊</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Reports</p>
                <p className="text-sm text-gray-600">Analytics & insights</p>
              </div>
            </button>

            <button
              onClick={() => notifications.show({
                title: 'Feature Coming Soon',
                message: 'Vital signs tracking will be available soon!',
                color: 'blue',
              })}
              className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white text-lg">🩺</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Vital Signs</p>
                <p className="text-sm text-gray-600">Track health metrics</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Appointments */}
          <div className="bg-white rounded-xl2 shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h2>
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No appointments yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.start ? new Date(appointment.start).toLocaleDateString() : 'No date'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {appointment.start ? new Date(appointment.start).toLocaleTimeString() : 'No time'}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      appointment.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      appointment.status === 'checked-in' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link 
                href="/appointments" 
                className="text-altura-primary hover:text-altura-primary/80 text-sm font-medium"
              >
                View all appointments →
              </Link>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-xl2 shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Patients</h2>
            {recentPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No patients yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getPatientName(patient)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {patient.birthDate ? `Born ${patient.birthDate}` : 'No birth date'}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full capitalize ${
                      patient.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                      patient.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.gender || 'Unknown'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link 
                href="/patients" 
                className="text-altura-primary hover:text-altura-primary/80 text-sm font-medium"
              >
                View all patients →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
