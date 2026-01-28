import { Appointment } from '@/types/appointments';
import { normalizeName } from '@/lib/appointments';
import {
	endOfDay,
	endOfISOWeek,
	startOfDay,
	startOfISOWeek,
	yyyyMmDd,
} from '@/lib/dates';

export type DashboardStats = {
	totalToday: number;
	totalWeek: number;
	checkedIn: number;
	cancelled: number;
	upcoming: Appointment[];
	next: Appointment | null;
	todayItems: Appointment[];
	countsByDay: { day: Date; key: string; count: number }[];
	maxCount: number;
	totalPatients: number;
	newPatientsThisWeek: number;
	returningPatients: number;
	topPatients: { displayName: string; firstISO: string; count: number }[];
};

export function computeDashboardStats(
	appointments: Appointment[],
	now = new Date(),
): DashboardStats {
	const todayStart = startOfDay(now);
	const todayEnd = endOfDay(now);

	// Use ISO week (Mon-Sun) for the dashboard week
	const weekStart = startOfISOWeek(now);
	const days = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(weekStart);
		d.setDate(weekStart.getDate() + i);
		return startOfDay(d);
	});
	const weekEnd = endOfDay(days[6]);

	const isToday = (iso: string) => {
		const dt = new Date(iso);
		return dt >= todayStart && dt <= todayEnd;
	};
	const isThisWeek = (iso: string) => {
		const dt = new Date(iso);
		return dt >= weekStart && dt <= weekEnd;
	};

	const totalToday = appointments.filter(a => isToday(a.datetimeISO)).length;
	const totalWeek = appointments.filter(
		a => isThisWeek(a.datetimeISO) && a.status !== 'Cancelled',
	).length;

	const checkedIn = appointments.filter(a => a.status === 'Checked-in').length;
	const cancelled = appointments.filter(a => a.status === 'Cancelled').length;

	const upcoming = appointments
		.filter(a => new Date(a.datetimeISO) >= now && a.status !== 'Cancelled')
		.sort((a, b) => a.datetimeISO.localeCompare(b.datetimeISO));

	const next = upcoming[0] ?? null;

	const todayItems = appointments
		.filter(a => isToday(a.datetimeISO))
		.sort((a, b) => a.datetimeISO.localeCompare(b.datetimeISO));

	const countsByDay = days.map(day => {
		const key = yyyyMmDd(day);
		const count = appointments.filter(a => {
			const dt = new Date(a.datetimeISO);
			return yyyyMmDd(dt) === key && a.status !== 'Cancelled';
		}).length;

		return { day, key, count };
	});

	const maxCount = Math.max(1, ...countsByDay.map(x => x.count));

	// Patient summary
	const byPatient = new Map<
		string,
		{ displayName: string; firstISO: string; count: number }
	>();

	for (const a of appointments) {
		const key = normalizeName(a.patientName);
		const existing = byPatient.get(key);

		if (!existing) {
			byPatient.set(key, {
				displayName: a.patientName.trim(),
				firstISO: a.datetimeISO,
				count: 1,
			});
		} else {
			existing.count += 1;
			if (a.datetimeISO < existing.firstISO) existing.firstISO = a.datetimeISO;
		}
	}

	const totalPatients = byPatient.size;

	const isWithinWeek = (iso: string) => {
		const dt = new Date(iso);
		return dt >= weekStart && dt <= weekEnd;
	};

	const newPatientsThisWeek = Array.from(byPatient.values()).filter(p =>
		isWithinWeek(p.firstISO),
	).length;

	const returningPatients = Math.max(0, totalPatients - newPatientsThisWeek);

	const topPatients = Array.from(byPatient.values())
		.sort((a, b) => b.count - a.count)
		.slice(0, 3);

	return {
		totalToday,
		totalWeek,
		checkedIn,
		cancelled,
		upcoming,
		next,
		todayItems,
		countsByDay,
		maxCount,
		totalPatients,
		newPatientsThisWeek,
		returningPatients,
		topPatients,
	};
}
