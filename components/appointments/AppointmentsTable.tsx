'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';

import StatusPill from './StatusPill';
import AppointmentDetailsDrawer from './AppointmentDetailsDrawer';
import AppointmentFormModal from './AppointmentFormModal';
import AppointmentsFilter from './AppointmentsFilter';

import { DateRange, formatDateTime, inDateFilter } from '@/lib/dates';
import { matchesQuery, mockAppointments, statuses } from '@/lib/appointments';
import { Appointment, AppointmentStatus } from '@/types/appointments';

const STORAGE_KEY = 'clinicflow_appointments_v1';
const storeListeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedAppointments: Appointment[] = mockAppointments;

function readStoredAppointments(): Appointment[] {
	if (typeof window === 'undefined') return mockAppointments;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === cachedRaw) return cachedAppointments;
		if (!raw) {
			cachedRaw = raw;
			cachedAppointments = mockAppointments;
			return cachedAppointments;
		}

		const parsed = JSON.parse(raw) as Appointment[];
		cachedRaw = raw;
		cachedAppointments =
			Array.isArray(parsed) && parsed.length ? parsed : mockAppointments;
		return cachedAppointments;
	} catch {
		cachedRaw = null;
		cachedAppointments = mockAppointments;
		return cachedAppointments;
	}
}

function subscribeAppointments(listener: () => void) {
	storeListeners.add(listener);
	return () => storeListeners.delete(listener);
}

function writeAppointments(next: Appointment[]) {
	if (typeof window === 'undefined') return;
	try {
		const raw = JSON.stringify(next);
		localStorage.setItem(STORAGE_KEY, raw);
		cachedRaw = raw;
		cachedAppointments = next;
	} catch {
		// ignore write errors (private mode, storage full, etc.)
	}
	storeListeners.forEach(listener => listener());
}

function updateAppointments(updater: (prev: Appointment[]) => Appointment[]) {
	const next = updater(readStoredAppointments());
	writeAppointments(next);
}

export default function AppointmentsTable() {
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<(typeof statuses)[number]>('All');
	const [doctor, setDoctor] = useState<string>('All');
	const [selected, setSelected] = useState<Appointment | null>(null);
	const [dateRange, setDateRange] = useState<DateRange>('All');

	const [fromDate, setFromDate] = useState<string>(''); // 'YYYY-MM-DD'
	const [toDate, setToDate] = useState<string>(''); // 'YYYY-MM-DD'

	const [editTarget, setEditTarget] = useState<Appointment | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);

	const appointments = useSyncExternalStore(
		subscribeAppointments,
		readStoredAppointments,
		() => mockAppointments,
	);

	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const doctorsList = useMemo(() => {
		return Array.from(new Set(appointments.map(a => a.doctor))).sort();
	}, [appointments]);

	const filtered = useMemo(() => {
		return appointments
			.filter(a => inDateFilter(a.datetimeISO, dateRange, fromDate, toDate))
			.filter(a => (status === 'All' ? true : a.status === status))
			.filter(a => (doctor === 'All' ? true : a.doctor === doctor))
			.filter(a => (query.trim() ? matchesQuery(a, query.trim()) : true))
			.sort((a, b) => a.datetimeISO.localeCompare(b.datetimeISO));
	}, [appointments, query, status, doctor, dateRange, fromDate, toDate]);

	const handleStatusChange = (id: string, nextStatus: AppointmentStatus) => {
		updateAppointments(prev =>
			prev.map(a => (a.id === id ? { ...a, status: nextStatus } : a)),
		);
		setSelected(prev =>
			prev?.id === id ? { ...prev, status: nextStatus } : prev,
		);
	};

	const handleNotesUpdate = (id: string, notes: string) => {
		const cleaned = notes.trim();
		updateAppointments(prev =>
			prev.map(a => (a.id === id ? { ...a, notes: cleaned || undefined } : a)),
		);
		setSelected(prev =>
			prev?.id === id ? { ...prev, notes: cleaned || undefined } : prev,
		);
	};

	const handleReschedule = (id: string, datetimeISO: string) => {
		updateAppointments(prev =>
			prev.map(a => (a.id === id ? { ...a, datetimeISO } : a)),
		);
		setSelected(prev => (prev?.id === id ? { ...prev, datetimeISO } : prev));
	};

	const handleDelete = (id: string) => {
		updateAppointments(prev => prev.filter(a => a.id !== id));
		setSelected(prev => (prev?.id === id ? null : prev));
		setEditTarget(prev => (prev?.id === id ? null : prev));
		setIsEditOpen(false);
	};

	return (
		<div className='space-y-4'>
			{/* Header */}
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-2xl font-semibold'>Appointments</h1>
					<p className='mt-1 text-sm opacity-70'>
						Search, filter, and view appointment details.
					</p>
				</div>

				<button
					type='button'
					className='inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50
					focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					onClick={() => setIsCreateOpen(true)}
				>
					+ New appointment
				</button>
			</div>

			{/* Filters */}
			<AppointmentsFilter
				query={query}
				setQuery={setQuery}
				status={status}
				setStatus={setStatus}
				doctor={doctor}
				setDoctor={setDoctor}
				dateRange={dateRange}
				setDateRange={setDateRange}
				fromDate={fromDate}
				setFromDate={setFromDate}
				toDate={toDate}
				setToDate={setToDate}
				filtered={filtered}
				// strongly recommended to use this inside filter dropdown
				doctorsList={doctorsList}
			/>

			{/* Table */}
			<div className='rounded-2xl border overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='min-w-210 w-full text-sm'>
						<thead className='bg-neutral-50'>
							<tr className='text-left'>
								<th className='px-4 py-3 font-medium'>Time</th>
								<th className='px-4 py-3 font-medium'>Patient</th>
								<th className='px-4 py-3 font-medium'>Doctor</th>
								<th className='px-4 py-3 font-medium'>Type</th>
								<th className='px-4 py-3 font-medium'>Status</th>
								<th className='px-4 py-3 font-medium text-right'>Actions</th>
							</tr>
						</thead>

						<tbody>
							{filtered.length === 0 ? (
								<tr>
									<td className='px-4 py-6 opacity-70' colSpan={6}>
										No appointments match your filters.
									</td>
								</tr>
							) : (
								filtered.map(a => (
									<tr key={a.id} className='border-t hover:bg-neutral-50/60'>
										<td className='px-4 py-3 whitespace-nowrap'>
											{formatDateTime(a.datetimeISO)}
										</td>
										<td className='px-4 py-3'>
											<div className='font-medium'>{a.patientName}</div>
											<div className='text-xs opacity-70'>{a.id}</div>
										</td>
										<td className='px-4 py-3 whitespace-nowrap'>{a.doctor}</td>
										<td className='px-4 py-3'>{a.type}</td>
										<td className='px-4 py-3'>
											<StatusPill status={a.status} />
										</td>
										<td className='px-4 py-3 text-right'>
											<button
												type='button'
												className='rounded-xl border px-3 py-2 text-xs hover:bg-white
												focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
												onClick={() => setSelected(a)}
											>
												View
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			<button
				type='button'
				className='rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50'
				onClick={() => writeAppointments(mockAppointments)}
			>
				Reset demo data
			</button>

			{/* Create modal */}
			<AppointmentFormModal
				key={`create-${isCreateOpen ? 'open' : 'closed'}`}
				open={isCreateOpen}
				mode='create'
				doctors={doctorsList}
				types={[
					'Consultation (30m)',
					'Follow-up (15m)',
					'Vaccination (15m)',
					'Procedure (60m)',
				]}
				onClose={() => setIsCreateOpen(false)}
				onSubmit={newAppt => updateAppointments(prev => [newAppt, ...prev])}
			/>

			<AppointmentFormModal
				key={`edit-${editTarget?.id ?? 'none'}`}
				open={isEditOpen}
				mode='edit'
				initial={editTarget}
				doctors={doctorsList}
				types={[
					'Consultation (30m)',
					'Follow-up (15m)',
					'Vaccination (15m)',
					'Procedure (60m)',
				]}
				onClose={() => setIsEditOpen(false)}
				onSubmit={(updated: Appointment) => {
					updateAppointments(prev =>
						prev.map(a => (a.id === updated.id ? updated : a)),
					);
					// Optional: keep drawer open but refreshed, or close it:
					setSelected(updated);
				}}
			/>

			{/* Details drawer */}
			{selected && (
				<AppointmentDetailsDrawer
					appointment={selected}
					onClose={() => setSelected(null)}
					onEdit={(appt: Appointment) => {
						setEditTarget(appt);
						setIsEditOpen(true);
						setSelected(null);
					}}
					onStatusChange={handleStatusChange}
					onUpdateNotes={handleNotesUpdate}
					onReschedule={handleReschedule}
					onDelete={handleDelete}
				/>
			)}
		</div>
	);
}
