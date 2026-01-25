import { Appointment, AppointmentStatus } from '@/types/appointments';

export function matchesQuery(a: Appointment, q: string) {
	const s = q.toLowerCase();
	return (
		a.id.toLowerCase().includes(s) ||
		a.patientName.toLowerCase().includes(s) ||
		a.doctor.toLowerCase().includes(s) ||
		a.type.toLowerCase().includes(s) ||
		a.status.toLowerCase().includes(s)
	);
}

export const mockAppointments: Appointment[] = [
	{
		id: 'A-1001',
		patientName: 'Anna Robertson',
		doctor: 'Dr. Patel',
		type: 'Consultation (30m)',
		datetimeISO: '2026-01-24T09:30:00',
		status: 'Booked',
		notes: 'First visit. Prefers morning appointments.',
	},
	{
		id: 'A-1002',
		patientName: 'James Miller',
		doctor: 'Dr. Ahmed',
		type: 'Follow-up (15m)',
		datetimeISO: '2026-01-24T10:15:00',
		status: 'Checked-in',
		notes: 'Review blood test results.',
	},
	{
		id: 'A-1003',
		patientName: 'Sofia Grant',
		doctor: 'Dr. Chen',
		type: 'Vaccination (15m)',
		datetimeISO: '2026-01-24T11:00:00',
		status: 'Completed',
	},
	{
		id: 'A-1004',
		patientName: 'Daniel Hughes',
		doctor: 'Dr. Patel',
		type: 'Consultation (30m)',
		datetimeISO: '2026-01-25T14:00:00',
		status: 'Cancelled',
		notes: 'Cancelled by patient (travel).',
	},
	{
		id: 'A-1005',
		patientName: 'Maya Singh',
		doctor: 'Dr. Ahmed',
		type: 'Follow-up (15m)',
		datetimeISO: '2026-01-25T15:30:00',
		status: 'No-show',
	},
];

export const statuses: (AppointmentStatus | 'All')[] = [
	'All',
	'Booked',
	'Checked-in',
	'Completed',
	'Cancelled',
	'No-show',
];
