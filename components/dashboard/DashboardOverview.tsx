'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, startTransition } from 'react';
import { mockAppointments, STORAGE_KEY } from '@/lib/appointments';
import { Appointment } from '@/types/appointments';
import { formatDateTime, formatTime, shortWeekday } from '@/lib/dates';
import { computeDashboardStats } from '@/lib/calcStats';

export default function DashboardOverview() {
	const [appointments, setAppointments] =
		useState<Appointment[]>(mockAppointments);

	// Load from localStorage (so dashboard matches appointments page)
	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Appointment[];
			if (Array.isArray(parsed)) {
				startTransition(() => setAppointments(parsed));
			}
		} catch {
			// ignore
		}
	}, []);

	const stats = useMemo(
		() => computeDashboardStats(appointments),
		[appointments],
	);

	return (
		<div className='space-y-6'>
			<div className='flex flex-col gap-1'>
				<h1 className='text-2xl font-semibold'>Dashboard</h1>
				<p className='text-sm opacity-70'>
					Today’s overview and upcoming appointments.
				</p>
			</div>

			{/* KPI cards */}
			<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
				<Card
					title='Today'
					value={stats.totalToday}
					hint='Appointments today'
				/>
				<Card title='This week' value={stats.totalWeek} hint='Mon–Sun' />
				<Card
					title='Checked-in'
					value={stats.checkedIn}
					hint='Currently arrived'
				/>
				<Card title='Cancelled' value={stats.cancelled} hint='This dataset' />
			</div>

			{/* Patients summary */}
			<div className='rounded-2xl border p-4'>
				<div className='flex items-center justify-between'>
					<div>
						<div className='text-sm font-medium'>Patients</div>
						<div className='mt-1 text-xs opacity-70'>
							Unique patients in your dataset
						</div>
					</div>

					<Link
						href='/dashboard/patients'
						className='rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
			focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					>
						View patients
					</Link>
				</div>

				<div className='mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3'>
					<div className='rounded-xl border p-3'>
						<div className='text-xs opacity-70'>Total patients</div>
						<div className='mt-1 text-2xl font-semibold'>
							{stats.totalPatients}
						</div>
					</div>

					<div className='rounded-xl border p-3'>
						<div className='text-xs opacity-70'>New this week</div>
						<div className='mt-1 text-2xl font-semibold'>
							{stats.newPatientsThisWeek}
						</div>
					</div>

					<div className='rounded-xl border p-3'>
						<div className='text-xs opacity-70'>Returning</div>
						<div className='mt-1 text-2xl font-semibold'>
							{stats.returningPatients}
						</div>
					</div>
				</div>

				{stats.topPatients.length > 0 && (
					<div className='mt-4'>
						<div className='text-xs font-medium opacity-70'>Most frequent</div>
						<ul className='mt-2 space-y-2'>
							{stats.topPatients.map(p => (
								<li
									key={p.displayName}
									className='flex items-center justify-between rounded-xl border p-3'
								>
									<div className='font-medium'>{p.displayName}</div>
									<div className='text-xs opacity-70'>{p.count} visits</div>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			{/* Appointments this week (bar chart) */}
			<div className='rounded-2xl border p-4'>
				<div className='flex items-center justify-between'>
					<div>
						<div className='text-sm font-medium'>Appointments this week</div>
						<div className='mt-1 text-xs opacity-70'>
							This week (Mon–Sun, cancelled excluded)
						</div>
					</div>
					<div className='text-xs opacity-70'>Total: {stats.totalWeek}</div>
				</div>

				<div className='mt-4 grid grid-cols-7 gap-2 items-end h-28'>
					{stats.countsByDay.map(({ day, count, key }) => {
						const heightPct = Math.round((count / stats.maxCount) * 100);
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						const isDayToday = day.getTime() === today.getTime();
						return (
							<div key={key} className='flex flex-col items-center gap-2'>
								<div className='w-full rounded-xl border bg-neutral-50 h-24 relative flex items-end overflow-visible'>
									{/* Floating count badge */}
									<div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
										<div
											className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold shadow-sm ${
												isDayToday
													? 'bg-green-900 text-white'
													: 'bg-white text-green-800'
											}`}
										>
											{count > 0 ? count : '—'}
										</div>
									</div>
									<div
										className={`w-full rounded-xl flex items-end justify-center ${
											isDayToday ? 'bg-green-800/90' : 'bg-green-600/80'
										}`}
										style={{ height: `${heightPct}%` }}
										role='img'
										aria-label={`${shortWeekday(day)}: ${count} appointments`}
										title={`${shortWeekday(day)}: ${count}`}
									>
										{/* optional small inside label removed to keep badge clear */}
									</div>
								</div>
								<div className='text-[11px] opacity-70'>
									{shortWeekday(day)}
								</div>
								<div className='text-[12px] font-semibold text-neutral-800'>
									{count > 0 ? count : '—'}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Next appointment */}
			<div className='rounded-2xl border p-4'>
				<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
					<div>
						<div className='text-sm font-medium'>Next appointment</div>
						{stats.next ? (
							<div className='mt-1'>
								<div className='text-lg font-semibold'>
									{stats.next.patientName}
								</div>
								<div className='text-sm opacity-70'>
									{formatDateTime(stats.next.datetimeISO)} • {stats.next.doctor}{' '}
									• {stats.next.type}
								</div>
							</div>
						) : (
							<div className='mt-1 text-sm opacity-70'>
								No upcoming appointments.
							</div>
						)}
					</div>

					<Link
						href='/dashboard/appointments'
						className='inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					>
						View appointments
					</Link>
				</div>
			</div>
			{/* Today’s schedule */}
			<div className='rounded-2xl border overflow-hidden'>
				<div className='flex items-center justify-between px-4 py-3 bg-neutral-50'>
					<div className='text-sm font-medium'>Today’s schedule</div>
					<div className='text-xs opacity-70'>
						{stats.todayItems.length}{' '}
						{stats.todayItems.length === 1 ? 'appointment' : 'appointments'}
					</div>
				</div>

				{stats.todayItems.length === 0 ? (
					<div className='px-4 py-6 text-sm opacity-70'>
						No appointments scheduled for today.
					</div>
				) : (
					<ul className='px-4 py-4 space-y-3'>
						{stats.todayItems.map((a, idx) => (
							<li key={a.id} className='flex gap-3'>
								{/* Timeline line */}
								<div className='flex flex-col items-center'>
									<div className='mt-1 h-2.5 w-2.5 rounded-full border' />
									{idx !== stats.todayItems.length - 1 && (
										<div className='mt-1 w-px flex-1 bg-neutral-200' />
									)}
								</div>

								{/* Content */}
								<div className='flex-1 rounded-xl border p-3 hover:bg-neutral-50/60'>
									<div className='flex items-start justify-between gap-3'>
										<div>
											<div className='text-xs opacity-70'>
												{formatTime(a.datetimeISO)}
											</div>
											<div className='mt-0.5 font-medium'>{a.patientName}</div>
											<div className='mt-1 text-xs opacity-70'>
												{a.doctor} • {a.type}
											</div>
										</div>

										<div className='text-xs opacity-70'>{a.status}</div>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			{/* Upcoming list */}
			<div className='rounded-2xl border overflow-hidden'>
				<div className='flex items-center justify-between px-4 py-3 bg-neutral-50'>
					<div className='text-sm font-medium'>Upcoming</div>
					<div className='text-xs opacity-70'>
						Next {Math.min(8, stats.upcoming.length)}
					</div>
				</div>

				{stats.upcoming.length === 0 ? (
					<div className='px-4 py-6 text-sm opacity-70'>Nothing scheduled.</div>
				) : (
					<ul className='divide-y'>
						{stats.upcoming.slice(0, 8).map(a => (
							<li key={a.id} className='px-4 py-3 hover:bg-neutral-50/60'>
								<div className='flex items-start justify-between gap-3'>
									<div>
										<div className='font-medium'>{a.patientName}</div>
										<div className='text-xs opacity-70'>
											{formatDateTime(a.datetimeISO)} • {a.doctor} • {a.type}
										</div>
									</div>
									<div className='text-xs opacity-70'>{a.status}</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

function Card({
	title,
	value,
	hint,
}: {
	title: string;
	value: number;
	hint: string;
}) {
	return (
		<div className='rounded-2xl border p-4'>
			<div className='text-sm font-medium'>{title}</div>
			<div className='mt-2 text-3xl font-semibold'>{value}</div>
			<div className='mt-1 text-xs opacity-70'>{hint}</div>
		</div>
	);
}
