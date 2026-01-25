export type AppointmentStatus =
	| 'Booked'
	| 'Checked-in'
	| 'Completed'
	| 'Cancelled'
	| 'No-show';

export type Appointment = {
	id: string;
	patientName: string;
	doctor: string;
	type: string;
	datetimeISO: string; // store as ISO string
	status: AppointmentStatus;
	notes?: string;
};
