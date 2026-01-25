import { AppointmentStatus } from '@/types/appointments';

const statusStyles: Record<AppointmentStatus, string> = {
	Booked: 'bg-blue-50 text-blue-700 border-blue-200',
	'Checked-in': 'bg-amber-50 text-amber-700 border-amber-200',
	Completed: 'bg-green-50 text-green-700 border-green-200',
	Cancelled: 'bg-red-50 text-red-700 border-red-200',
	'No-show': 'bg-neutral-50 text-neutral-700 border-neutral-200',
};

export default function StatusPill({ status }: { status: AppointmentStatus }) {
	return (
		<span
			className={[
				'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
				statusStyles[status],
			].join(' ')}
		>
			{status}
		</span>
	);
}
