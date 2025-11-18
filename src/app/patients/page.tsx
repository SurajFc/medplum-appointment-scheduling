'use client';
import { useEffect, useState } from 'react';
import type { Patient, Appointment } from '@medplum/fhirtypes';
import { notifications } from '@mantine/notifications';
import { medplum } from '../lib/medplum';
import { AuthGate } from '../components/AuthGate';

export default function PatientsPage() {
  const [rows, setRows] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Helper function to get patient display name
  const getPatientName = (patient: Patient) => {
    const name = patient.name?.[0];
    if (!name) return `Patient/${patient.id}`;
    const full = [name.given?.join(' '), name.family].filter(Boolean).join(' ');
    return full || `Patient/${patient.id}`;
  };

  // Filter patients based on search term and gender
  const filteredPatients = rows.filter((patient) => {
    const name = getPatientName(patient).toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Load patient appointments when patient is selected
  const loadPatientAppointments = async (patientId: string) => {
    try {
      setLoadingAppointments(true);
      const appointments = await medplum.searchResources('Appointment', {
        'participant': `Patient/${patientId}`,
        '_count': 10,
        '_sort': '-start'
      });
      setPatientAppointments(appointments);
    } catch (error) {
      console.error('Failed to load patient appointments:', error);
      setPatientAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    if (patient.id) {
      loadPatientAppointments(patient.id);
    }
  };

  // Close patient modal
  const closePatientModal = () => {
    setSelectedPatient(null);
    setPatientAppointments([]);
  };

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const profile = await medplum.getProfile();
        if (!profile) {
          setError('Not authenticated');
          return;
        }
        
        const patients = await medplum.searchResources('Patient', { _count: 20 });
        setRows(patients);
      } catch (err) {
        console.error('Failed to load patients:', err);
        setError('Failed to load patients');
        notifications.show({
          title: 'Error loading patients',
          message: 'Failed to fetch patient data. Please try again.',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  return (
    <AuthGate>
      <h1 className="text-2xl font-semibold mb-4">Patients</h1>
      
      {/* Search and Filter Controls */}
      {!loading && !error && (
        <div className="bg-white rounded-xl2 shadow p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search patients by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-altura-primary focus:border-transparent"
              />
            </div>
            <div className="sm:w-40">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-altura-primary focus:border-transparent"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-2 text-sm text-gray-600">
            {searchTerm || genderFilter !== 'all' ? (
              <>Showing {filteredPatients.length} of {rows.length} patients</>
            ) : (
              <>{rows.length} total patients</>
            )}
          </div>
        </div>
      )}
      
      {loading && (
        <div className="bg-white rounded-xl2 shadow p-8 text-center text-gray-600">
          Loading…
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl2 p-4 text-red-700">
          {error}
        </div>
      )}
      
      {!loading && !error && filteredPatients.length === 0 && rows.length > 0 && (
        <div className="bg-white rounded-xl2 shadow p-8 text-center text-gray-600">
          No patients match your search criteria
        </div>
      )}
      
      {!loading && !error && rows.length === 0 && (
        <div className="bg-white rounded-xl2 shadow p-8 text-center text-gray-600">
          No patients yet
        </div>
      )}
      
      {!loading && !error && filteredPatients.length > 0 && (
        <div className="bg-white rounded-xl2 shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px] sm:min-w-0">
              <thead className="bg-altura-primaryLight/10 hidden sm:table-header-group">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Birth Date</th>
                  <th className="text-left p-3">Gender</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => {
                  const patientName = getPatientName(p);
                  return (
                    <tr key={p.id} className="border-t hover:bg-gray-50 block sm:table-row border rounded-lg sm:border-0 sm:rounded-none mb-4 sm:mb-0 p-3 sm:p-0">
                      <td className="p-0 sm:p-3 block sm:table-cell">
                        <div className="flex sm:block">
                          <span className="font-medium sm:hidden text-gray-600 w-16 flex-shrink-0">Name:</span>
                          <button 
                            className="text-altura-primary hover:text-altura-primary/80 hover:underline font-medium text-left"
                            onClick={() => handlePatientSelect(p)}
                          >
                            {patientName}
                          </button>
                        </div>
                      </td>
                      <td className="p-0 sm:p-3 block sm:table-cell">
                        <div className="flex sm:block">
                          <span className="font-medium sm:hidden text-gray-600 w-16 flex-shrink-0">DOB:</span>
                          <span>{p.birthDate || '—'}</span>
                        </div>
                      </td>
                      <td className="p-0 sm:p-3 block sm:table-cell">
                        <div className="flex sm:block">
                          <span className="font-medium sm:hidden text-gray-600 w-16 flex-shrink-0">Gender:</span>
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            p.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                            p.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {p.gender || 'Unknown'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Patient Details
              </h2>
              <button
                onClick={closePatientModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{getPatientName(selectedPatient)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.birthDate || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <p className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full capitalize ${
                        selectedPatient.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                        selectedPatient.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedPatient.gender || 'Unknown'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPatient.id}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {selectedPatient.telecom && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    {selectedPatient.telecom.map((contact, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm text-gray-700 capitalize">{contact.system}</span>
                        <span className="text-sm text-gray-900">{contact.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address Information */}
              {selectedPatient.address && selectedPatient.address.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
                  {selectedPatient.address.map((addr, index) => (
                    <div key={index} className="text-sm text-gray-900">
                      {addr.line?.join(', ')}{addr.line && ', '}
                      {addr.city}{addr.city && ', '}
                      {addr.state} {addr.postalCode}
                      {addr.country && `, ${addr.country}`}
                    </div>
                  ))}
                </div>
              )}

              {/* Appointment History */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Appointments</h3>
                {loadingAppointments ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-600">Loading appointments...</div>
                  </div>
                ) : patientAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {patientAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.start ? new Date(appointment.start).toLocaleDateString() : 'No date'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {appointment.start ? new Date(appointment.start).toLocaleTimeString() : 'No time'}
                          </div>
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
                ) : (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-600">No appointments found</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGate>
  );
}
