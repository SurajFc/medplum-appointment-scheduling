'use client';
import { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Appointment, Patient, Practitioner } from '@medplum/fhirtypes';
import { notifications } from '@mantine/notifications';
import { medplum } from '../lib/medplum';
import { AuthGate } from '../components/AuthGate';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

export default function AppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientRef, setPatientRef] = useState('');
  const [practRef, setPractRef] = useState('');
  const [start, setStart] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [end, setEnd] = useState('');
  
  // Calendar state management
  const [calendarView, setCalendarView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Convert appointments to calendar events
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [appointmentsList, patientsList, practitionersList] = await Promise.all([
        medplum.searchResources('Appointment', { _count: 20 }),
        medplum.searchResources('Patient', { _count: 100 }),
        medplum.searchResources('Practitioner', { _count: 100 })
      ]);
      setRows(appointmentsList);
      setPatients(patientsList);
      setPractitioners(practitionersList);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      notifications.show({
        title: 'Error loading data',
        message: 'Failed to fetch appointments, patients, or practitioners. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    const checkAndLoad = async () => {
      try {
        const profile = await medplum.getProfile();
        if (profile) {
          await load();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        notifications.show({
          title: 'Authentication Error',
          message: 'Failed to verify authentication. Please sign in again.',
          color: 'red',
        });
        setLoading(false);
      }
    };
    checkAndLoad();
  }, [load]); // Include load dependency

  async function create() {
    setSaving(true);
    try {
      // Convert datetime-local to FHIR instant format (ISO 8601 with timezone)
      const startISO = new Date(start).toISOString();
      const endISO = new Date(end).toISOString();
      
      await medplum.createResource<Appointment>({
        resourceType: 'Appointment',
        status: 'booked',
        start: startISO,
        end: endISO,
        participant: [
          { actor: { reference: patientRef }, status: 'accepted' },
          { actor: { reference: practRef }, status: 'accepted' }
        ]
      });
      
      await load();
      setPatientRef(''); setPractRef(''); setStart(''); setEnd('');
      
      notifications.show({
        title: 'Success',
        message: 'Appointment created successfully!',
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to create appointment:', error);
      notifications.show({
        title: 'Error creating appointment',
        message: 'Failed to create the appointment. Please check the details and try again.',
        color: 'red',
      });
    } finally { 
      setSaving(false); 
    }
  }

  // Helper function to get patient display name
  const getPatientName = (patient: Patient) => {
    const name = patient.name?.[0];
    if (!name) return `Patient/${patient.id}`;
    const full = [name.given?.join(' '), name.family].filter(Boolean).join(' ');
    return full || `Patient/${patient.id}`;
  };

  // Helper function to get practitioner display name
  const getPractitionerName = (practitioner: Practitioner) => {
    const name = practitioner.name?.[0];
    if (!name) return `Practitioner/${practitioner.id}`;
    const full = [name.given?.join(' '), name.family].filter(Boolean).join(' ');
    return full || `Practitioner/${practitioner.id}`;
  };

  // Helper function to resolve participant references to names
  const getParticipantName = useCallback((appointment: Appointment, resourceType: 'Patient' | 'Practitioner'): string => {
    if (!appointment.participant) return '';
    
    const participant = appointment.participant.find(p => 
      p.actor?.reference?.startsWith(`${resourceType}/`)
    );
    
    if (!participant?.actor?.reference) return '';
    
    if (resourceType === 'Patient') {
      const patientId = participant.actor.reference.replace('Patient/', '');
      const patient = patients.find(p => p.id === patientId);
      return patient ? getPatientName(patient) : '';
    } else {
      const practitionerId = participant.actor.reference.replace('Practitioner/', '');
      const practitioner = practitioners.find(p => p.id === practitionerId);
      return practitioner ? getPractitionerName(practitioner) : '';
    }
  }, [patients, practitioners]);

  const convertToCalendarEvents = useCallback((appointments: Appointment[]): CalendarEvent[] => {
    return appointments.map((appointment) => {
      const patientName = getParticipantName(appointment, 'Patient') || 'Unknown Patient';
      const practitionerName = getParticipantName(appointment, 'Practitioner') || 'Unknown Practitioner';
      
      return {
        id: appointment.id || '',
        title: `${patientName} with ${practitionerName}`,
        start: appointment.start ? new Date(appointment.start) : new Date(),
        end: appointment.end ? new Date(appointment.end) : new Date(),
        resource: appointment
      };
    });
  }, [getParticipantName]);

  // Update calendar events when appointments, patients, or practitioners change
  useEffect(() => {
    if (rows.length > 0 && patients.length > 0 && practitioners.length > 0) {
      setCalendarEvents(convertToCalendarEvents(rows));
    }
  }, [rows, patients, practitioners, convertToCalendarEvents]);

  const getParticipantNames = (appointment: Appointment) => {
    if (!appointment.participant) return '—';
    
    return appointment.participant
      .map(participant => {
        const reference = participant.actor?.reference;
        if (!reference) return 'Unknown';
        
        if (reference.startsWith('Patient/')) {
          const patientId = reference.replace('Patient/', '');
          const patient = patients.find(p => p.id === patientId);
          return patient ? getPatientName(patient) : reference;
        } else if (reference.startsWith('Practitioner/')) {
          const practitionerId = reference.replace('Practitioner/', '');
          const practitioner = practitioners.find(p => p.id === practitionerId);
          return practitioner ? getPractitionerName(practitioner) : reference;
        }
        
      return reference;
    })
    .join(', ');
};

// Update appointment status
const updateAppointmentStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
  try {
    await medplum.patchResource('Appointment', appointmentId, [
      { op: 'replace', path: '/status', value: newStatus }
    ]);
    
    notifications.show({
      title: 'Status updated',
      message: 'Appointment status updated successfully!',
      color: 'green',
    });
    
    // Reload appointments to reflect the change
    await load();
  } catch (error) {
    console.error('Failed to update appointment status:', error);
    notifications.show({
      title: 'Error updating status',
      message: 'Failed to update appointment status. Please try again.',
      color: 'red',
    });
  }
  };

  // Get color for calendar events based on status
  const getCalendarEventColor = (status?: string) => {
    switch (status) {
      case 'booked': return '#2563eb'; // blue
      case 'arrived': return '#059669'; // green
      case 'fulfilled': return '#10b981'; // emerald
      case 'cancelled': return '#dc2626'; // red
      case 'noshow': return '#9ca3af'; // gray
      case 'pending': return '#d97706'; // orange
      default: return '#6b7280'; // default gray
    }
  };

  return (
    <AuthGate>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Appointments</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setView('list')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm ${
              view === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl2 shadow p-8 text-center text-gray-600 mb-6">
          Loading…
        </div>
      )}

      {!loading && (
        <>
          {/* List View */}
          {view === 'list' && (
            <>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow mb-6">
                <h2 className="font-medium mb-3">New Appointment</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <select 
                    className="w-full border rounded px-3 py-3 text-base" 
                    value={patientRef} 
                    onChange={e => setPatientRef(e.target.value)}
                  >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={`Patient/${patient.id}`}>
                    {getPatientName(patient)}
                  </option>
                ))}
              </select>

                  <select 
                    className="w-full border rounded px-3 py-3 text-base" 
                    value={practRef} 
                    onChange={e => setPractRef(e.target.value)}
                  >
                    <option value="">Select Practitioner</option>
                    {practitioners.map(practitioner => (
                      <option key={practitioner.id} value={`Practitioner/${practitioner.id}`}>
                        {getPractitionerName(practitioner)}
                      </option>
                    ))}
                  </select>

                  <input type="datetime-local" className="w-full border rounded px-3 py-3 text-base" value={start} onChange={e=>setStart(e.target.value)} />
                  <input type="datetime-local" className="w-full border rounded px-3 py-3 text-base" value={end} onChange={e=>setEnd(e.target.value)} />
                </div>
                <button onClick={create} disabled={saving || !patientRef || !practRef || !start || !end}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded text-base font-medium">
                  {saving ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b">
              <h2 className="font-medium">Appointments ({rows.length})</h2>
            </div>
            {rows.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                No appointments yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px] sm:min-w-0">
                <thead className="bg-altura-primaryLight/10 hidden sm:table-header-group">
                  <tr>
                    <th className="p-3 text-left">Start</th>
                    <th className="p-3 text-left">End</th>
                    <th className="p-3 text-left">Participants</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(a => (
                    <tr key={a.id} className="border-t hover:bg-gray-50 block sm:table-row border rounded-lg sm:border-0 sm:rounded-none mb-4 sm:mb-0 p-3 sm:p-0">
                      <td className="p-0 sm:p-3 block sm:table-cell">
                        <div className="flex sm:block">
                          <span className="font-medium sm:hidden text-gray-600 w-20 flex-shrink-0">Start:</span>
                          <div>
                            {a.start ? new Date(a.start).toLocaleDateString() : '—'}
                            <div className="text-xs text-gray-500">
                              {a.start ? new Date(a.start).toLocaleTimeString() : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 sm:p-3 block sm:table-cell">
                        <div className="flex sm:block">
                          <span className="font-medium sm:hidden text-gray-600 w-20 flex-shrink-0">End:</span>
                          <div>
                            {a.end ? new Date(a.end).toLocaleDateString() : '—'}
                            <div className="text-xs text-gray-500">
                              {a.end ? new Date(a.end).toLocaleTimeString() : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 sm:p-3 block sm:table-cell">
                        <div className="flex sm:block">
                          <span className="font-medium sm:hidden text-gray-600 w-20 flex-shrink-0">Participants:</span>
                          <div className="text-xs sm:text-sm">
                            {getParticipantNames(a)}
                          </div>
                        </div>
                      </td>
                      <td className="p-0 sm:p-3 block sm:table-cell">
                        <div className="flex sm:block">
                          <span className="font-medium sm:hidden text-gray-600 w-20 flex-shrink-0">Status:</span>
                          <select
                            value={a.status || 'booked'}
                            onChange={(e) => a.id && updateAppointmentStatus(a.id, e.target.value as Appointment['status'])}
                            className={`text-xs border rounded px-2 py-1 font-medium ${
                              a.status === 'booked' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                              a.status === 'fulfilled' ? 'bg-green-50 border-green-200 text-green-800' :
                              a.status === 'cancelled' ? 'bg-red-50 border-red-200 text-red-800' :
                              a.status === 'checked-in' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                              a.status === 'pending' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                              'bg-gray-50 border-gray-200 text-gray-800'
                            }`}
                          >
                            <option value="booked">Booked</option>
                            <option value="pending">Pending</option>
                            <option value="checked-in">Checked In</option>
                            <option value="fulfilled">Fulfilled</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="noshow">No Show</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          )}          {/* Calendar View */}
          {view === 'calendar' && (
            <div className="bg-white rounded-xl shadow p-4 sm:p-6" style={{ height: '500px' }}>
              <style jsx global>{`
                .rbc-calendar {
                  height: 100%;
                }
                .rbc-btn-group > button:first-child {
                  border-radius: 4px 0 0 4px;
                }
                .rbc-btn-group > button:last-child {
                  border-radius: 0 4px 4px 0;
                }
                .rbc-btn-group > button {
                  padding: 6px 8px;
                  border: 1px solid #d1d5db;
                  background: white;
                  color: #374151;
                  font-size: 12px;
                }
                @media (min-width: 640px) {
                  .rbc-btn-group > button {
                    padding: 8px 12px;
                    font-size: 14px;
                  }
                }
                .rbc-btn-group > button:hover {
                  background: #f3f4f6;
                }
                .rbc-btn-group > button.rbc-active {
                  background: #3b82f6;
                  color: white;
                  border-color: #3b82f6;
                }
                .rbc-toolbar {
                  margin-bottom: 15px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  flex-wrap: wrap;
                  gap: 8px;
                }
                @media (min-width: 640px) {
                  .rbc-toolbar {
                    margin-bottom: 20px;
                    gap: 10px;
                  }
                }
                .rbc-toolbar-label {
                  font-size: 1rem;
                  font-weight: 600;
                  color: #1f2937;
                  order: 1;
                  width: 100%;
                  text-align: center;
                  margin-bottom: 8px;
                }
                @media (min-width: 640px) {
                  .rbc-toolbar-label {
                    font-size: 1.25rem;
                    order: 0;
                    width: auto;
                    margin-bottom: 0;
                  }
                }
                .rbc-btn-group {
                  flex-shrink: 0;
                }
              `}</style>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                view={calendarView}
                date={currentDate}
                onView={(newView: View) => setCalendarView(newView)}
                onNavigate={(date: Date) => setCurrentDate(date)}
                popup
                onSelectEvent={(event: CalendarEvent) => {
                  notifications.show({
                    title: 'Appointment Details',
                    message: `${event.title} - Status: ${event.resource.status}`,
                    color: 'blue',
                  });
                }}
                eventPropGetter={(event: CalendarEvent) => ({
                  style: {
                    backgroundColor: getCalendarEventColor(event.resource.status),
                    borderRadius: '4px',
                    opacity: 0.8,
                    color: 'white',
                    border: '0px',
                    display: 'block'
                  }
                })}
              />
            </div>
          )}
        </>
      )}
    </AuthGate>
  );
}
