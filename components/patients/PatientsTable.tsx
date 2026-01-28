'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Appointment } from '@/types/appointments';
import { mockAppointments } from '@/lib/appointments';
import { formatDateTime } from '@/lib/dates';

const STORAGE_KEY = 'clinicflow_appointments_v1';

type PatientRow = {
	id: string; // stable key derived from name
	name: string;
	visits: number;
	firstVisitISO: string;
	lastVisitISO: string;
	nextVisitISO: string | null;
};

function normalizeName(name: string) {
	return name.trim().toLowerCase();
}

function makePatientId(name: string) {
	return normalizeName(name)
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}

export default function PatientsTable() {
	const [appointments, setAppointments] =
		useState<Appointment[]>(mockAppointments);
	const [query, setQuery] = useState('');

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

	const patients = useMemo(() => {
		const now = new Date();

		const map = new Map<
			string,
			{
				name: string;
				visits: number;
				firstISO: string;
				lastISO: string;
				nextISO: string | null;
			}
		>();

		for (const a of appointments) {
			const key = normalizeName(a.patientName);
			const entry = map.get(key);

			if (!entry) {
				map.set(key, {
					name: a.patientName.trim(),
					visits: 1,
					firstISO: a.datetimeISO,
					lastISO: a.datetimeISO,
					nextISO:
						new Date(a.datetimeISO) >= now && a.status !== 'Cancelled'
							? a.datetimeISO
							: null,
				});
			} else {
				entry.visits += 1;
				if (a.datetimeISO < entry.firstISO) entry.firstISO = a.datetimeISO;
				if (a.datetimeISO > entry.lastISO) entry.lastISO = a.datetimeISO;

				const aDate = new Date(a.datetimeISO);
				if (aDate >= now && a.status !== 'Cancelled') {
					if (!entry.nextISO || a.datetimeISO < entry.nextISO)
						entry.nextISO = a.datetimeISO;
				}
			}
		}

		const rows: PatientRow[] = Array.from(map.values()).map(p => ({
			id: makePatientId(p.name),
			name: p.name,
			visits: p.visits,
			firstVisitISO: p.firstISO,
			lastVisitISO: p.lastISO,
			nextVisitISO: p.nextISO,
		}));

		// Sort: most recent last visit first
		rows.sort((a, b) => b.lastVisitISO.localeCompare(a.lastVisitISO));

		return rows;
	}, [appointments]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return patients;
		return patients.filter(p => p.name.toLowerCase().includes(q));
	}, [patients, query]);

	return (
		<div className='space-y-4'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-2xl font-semibold'>Patients</h1>
					<p className='mt-1 text-sm opacity-70'>
						Search patients and view visit history.
					</p>
				</div>

				<div className='w-full sm:w-80 space-y-1'>
					<label className='text-sm font-medium'>Search</label>
					<input
						value={query}
						onChange={e => setQuery(e.target.value)}
						placeholder='Patient name...'
						className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					/>
				</div>
			</div>

			<div className='rounded-2xl border overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='min-w-[900px] w-full text-sm'>
						<thead className='bg-neutral-50'>
							<tr className='text-left'>
								<th className='px-4 py-3 font-medium'>Patient</th>
								<th className='px-4 py-3 font-medium'>Visits</th>
								<th className='px-4 py-3 font-medium'>First visit</th>
								<th className='px-4 py-3 font-medium'>Last visit</th>
								<th className='px-4 py-3 font-medium'>Next appointment</th>
								<th className='px-4 py-3 font-medium text-right'>Action</th>
							</tr>
						</thead>

						<tbody>
							{filtered.length === 0 ? (
								<tr>
									<td colSpan={6} className='px-4 py-6 opacity-70'>
										No patients match your search.
									</td>
								</tr>
							) : (
								filtered.map(p => (
									<tr key={p.id} className='border-t hover:bg-neutral-50/60'>
										<td className='px-4 py-3'>
											<div className='font-medium'>{p.name}</div>
											<div className='text-xs opacity-70'>{p.id}</div>
										</td>
										<td className='px-4 py-3'>{p.visits}</td>
										<td className='px-4 py-3 whitespace-nowrap'>
											{formatDateTime(p.firstVisitISO)}
										</td>
										<td className='px-4 py-3 whitespace-nowrap'>
											{formatDateTime(p.lastVisitISO)}
										</td>
										<td className='px-4 py-3 whitespace-nowrap'>
											{p.nextVisitISO ? formatDateTime(p.nextVisitISO) : '—'}
										</td>
										<td className='px-4 py-3 text-right'>
											<Link
												href={`/dashboard/patients/${p.id}`}
												className='rounded-xl border px-3 py-2 text-xs hover:bg-white
												focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
											>
												View history
											</Link>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			<div className='text-sm opacity-70'>
				Showing{' '}
				<span className='font-medium opacity-100'>{filtered.length}</span>{' '}
				patients
			</div>
		</div>
	);
}
