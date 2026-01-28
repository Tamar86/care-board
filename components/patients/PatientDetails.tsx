'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Appointment } from '@/types/appointments';
import { mockAppointments } from '@/lib/appointments';
import { formatDateTime } from '@/lib/dates';
import StatusPill from '@/components/appointments/StatusPill';
import AppointmentFormModal from '@/components/appointments/AppointmentFormModal';

const STORAGE_KEY = 'clinicflow_appointments_v1';

function normalizeName(name: string) {
	return name.trim().toLowerCase();
}

function makePatientId(name: string) {
	return normalizeName(name)
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}

export default function PatientDetails({ patientId }: { patientId: string }) {
	const [appointments, setAppointments] =
		useState<Appointment[]>(mockAppointments);
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const doctorsList = useMemo(() => {
		return Array.from(new Set(appointments.map(a => a.doctor))).sort();
	}, [appointments]);

	const typesList = [
		'Consultation (30m)',
		'Follow-up (15m)',
		'Vaccination (15m)',
		'Procedure (60m)',
	];

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Appointment[];
			if (Array.isArray(parsed)) setAppointments(parsed);
		} catch {
			// ignore
		}
	}, []);

	const data = useMemo(() => {
		const matches = appointments.filter(
			a => makePatientId(a.patientName) === patientId,
		);

		if (matches.length === 0) {
			return {
				found: false as const,
				name: '',
				history: [] as Appointment[],
				visits: 0,
				firstISO: '',
				lastISO: '',
				nextISO: null as string | null,
			};
		}

		const name = matches[0].patientName.trim();

		const sortedAsc = [...matches].sort((a, b) =>
			a.datetimeISO.localeCompare(b.datetimeISO),
		);
		const firstISO = sortedAsc[0].datetimeISO;
		const lastISO = sortedAsc[sortedAsc.length - 1].datetimeISO;

		const now = new Date();
		const upcoming = sortedAsc
			.filter(a => new Date(a.datetimeISO) >= now && a.status !== 'Cancelled')
			.sort((a, b) => a.datetimeISO.localeCompare(b.datetimeISO));

		const nextISO = upcoming[0]?.datetimeISO ?? null;

		// History newest first
		const history = [...matches].sort((a, b) =>
			b.datetimeISO.localeCompare(a.datetimeISO),
		);

		return {
			found: true as const,
			name,
			history,
			visits: matches.length,
			firstISO,
			lastISO,
			nextISO,
		};
	}, [appointments, patientId]);

	if (!data.found) {
		return (
			<div className='space-y-4'>
				<Link
					href='/dashboard/patients'
					className='inline-flex items-center rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
					focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
				>
					← Back to patients
				</Link>

				<div className='rounded-2xl border p-5'>
					<div className='text-lg font-semibold'>Patient not found</div>
					<p className='mt-1 text-sm opacity-70'>
						This patient ID doesn’t exist in your current dataset.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<Link
						href='/dashboard/patients'
						className='inline-flex items-center rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					>
						← Back
					</Link>

					<h1 className='mt-3 text-2xl font-semibold'>{data.name}</h1>
					<p className='mt-1 text-sm opacity-70'>
						Patient details and visit history.
					</p>
				</div>
				<div className='flex gap-2'>
					<button
						type='button'
						className='inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50
		focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
						onClick={() => setIsCreateOpen(true)}
					>
						+ New appointment
					</button>

					<Link
						href='/dashboard/appointments'
						className='inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50
		focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					>
						Go to appointments
					</Link>
				</div>
			</div>

			{/* Summary cards */}
			<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
				<SummaryCard label='Visits' value={String(data.visits)} />
				<SummaryCard
					label='First visit'
					value={formatDateTime(data.firstISO)}
				/>
				<SummaryCard
					label='Next appointment'
					value={data.nextISO ? formatDateTime(data.nextISO) : '—'}
				/>
			</div>

			{/* History */}
			<div className='rounded-2xl border overflow-hidden'>
				<div className='flex items-center justify-between px-4 py-3 bg-neutral-50'>
					<div className='text-sm font-medium'>Appointment history</div>
					<div className='text-xs opacity-70'>{data.history.length} total</div>
				</div>

				<div className='overflow-x-auto'>
					<table className='min-w-[900px] w-full text-sm'>
						<thead className='bg-neutral-50'>
							<tr className='text-left'>
								<th className='px-4 py-3 font-medium'>Date & time</th>
								<th className='px-4 py-3 font-medium'>Doctor</th>
								<th className='px-4 py-3 font-medium'>Type</th>
								<th className='px-4 py-3 font-medium'>Status</th>
								<th className='px-4 py-3 font-medium text-right'>ID</th>
							</tr>
						</thead>

						<tbody>
							{data.history.map(a => (
								<tr key={a.id} className='border-t hover:bg-neutral-50/60'>
									<td className='px-4 py-3 whitespace-nowrap'>
										{formatDateTime(a.datetimeISO)}
									</td>
									<td className='px-4 py-3 whitespace-nowrap'>{a.doctor}</td>
									<td className='px-4 py-3'>{a.type}</td>
									<td className='px-4 py-3'>
										<StatusPill status={a.status} />
									</td>
									<td className='px-4 py-3 text-right text-xs opacity-70'>
										{a.id}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<AppointmentFormModal
				open={isCreateOpen}
				mode='create'
				doctors={doctorsList}
				types={typesList}
				prefill={{ patientName: data.name }}
				onClose={() => setIsCreateOpen(false)}
				onSubmit={newAppt => {
					// Update local state immediately
					setAppointments(prev => [newAppt, ...prev]);

					// Persist to localStorage (same key used everywhere)
					try {
						const raw = localStorage.getItem(STORAGE_KEY);
						const parsed = raw ? (JSON.parse(raw) as Appointment[]) : [];
						const next = Array.isArray(parsed)
							? [newAppt, ...parsed]
							: [newAppt];
						localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
					} catch {
						// ignore
					}
				}}
			/>
		</div>
	);
}

function SummaryCard({ label, value }: { label: string; value: string }) {
	return (
		<div className='rounded-2xl border p-4'>
			<div className='text-xs opacity-70'>{label}</div>
			<div className='mt-2 text-lg font-semibold'>{value}</div>
		</div>
	);
}
