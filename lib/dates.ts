export type DateRange = 'All' | 'Today' | 'This week' | 'Custom';

export function formatDateTime(iso: string) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '—';
	// Deterministic formatting to avoid server/client locale mismatches
	const parts = new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).formatToParts(d);
	const byType = Object.fromEntries(parts.map(p => [p.type, p.value]));
	return `${byType.weekday}, ${byType.day} ${byType.month}, ${byType.hour}:${byType.minute}`;
}

export function formatTime(iso: string) {
	const d = new Date(iso);
	return d.toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function yyyyMmDd(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
export function endOfDay(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function startOfISOWeek(d: Date) {
	// ISO week starts Monday
	const day = d.getDay(); // Sun=0, Mon=1...Sat=6
	const diffToMonday = day === 0 ? -6 : 1 - day;
	const monday = new Date(d);
	monday.setDate(d.getDate() + diffToMonday);
	return startOfDay(monday);
}
export function endOfISOWeek(d: Date) {
	const monday = startOfISOWeek(d);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	return endOfDay(sunday);
}

export function inDateFilter(
	dateISO: string,
	mode: DateRange,
	from: string,
	to: string,
) {
	if (mode === 'All') return true;

	const now = new Date();
	const dt = new Date(dateISO);

	if (mode === 'Today') {
		return dt >= startOfDay(now) && dt <= endOfDay(now);
	}
	if (mode === 'This week') {
		const start = startOfISOWeek(now);
		const end = endOfISOWeek(now);
		return dt >= start && dt <= end;
	}
	// Custom
	return inCustomRange(dateISO, from, to);
}

function inCustomRange(dateISO: string, from: string, to: string) {
	if (!from && !to) return true;

	const dt = new Date(dateISO);

	// Build boundary dates in local time
	const fromBound = from ? new Date(from + 'T00:00:00') : null;
	const toBound = to ? new Date(to + 'T23:59:59.999') : null;

	if (fromBound && dt < fromBound) return false;
	if (toBound && dt > toBound) return false;
	return true;
}

export function shortWeekday(d: Date) {
	return d.toLocaleDateString(undefined, { weekday: 'short' }); // Mon, Tue...
}
