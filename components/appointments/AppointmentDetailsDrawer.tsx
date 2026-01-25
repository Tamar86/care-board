'use client';

import { formatDateTime } from '@/lib/dates';
import { Appointment, AppointmentStatus } from '@/types/appointments';
import { useEffect, useId, useRef, useState } from 'react';
import StatusPill from './StatusPill';

function getFocusableElements(container: HTMLElement) {
	const selectors = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
	].join(',');

	return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
		el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
	);
}

function prefersReducedMotion() {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function toDateInputValue(iso: string) {
	const d = new Date(iso);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function toTimeInputValue(iso: string) {
	const d = new Date(iso);
	const hh = String(d.getHours()).padStart(2, '0');
	const min = String(d.getMinutes()).padStart(2, '0');
	return `${hh}:${min}`;
}

function combineLocalDateTime(date: string, time: string) {
	const [y, m, d] = date.split('-').map(Number);
	const [hh, mm] = time.split(':').map(Number);
	const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
	return dt.toISOString();
}

export default function AppointmentDetailsDrawer({
	appointment,
	onClose,
	onEdit,
	onStatusChange,
	onUpdateNotes,
	onReschedule,
	onDelete,
}: {
	appointment: Appointment;
	onClose: () => void;
	onEdit: (appointment: Appointment) => void;
	onStatusChange: (id: string, status: AppointmentStatus) => void;
	onUpdateNotes: (id: string, notes: string) => void;
	onReschedule: (id: string, datetimeISO: string) => void;
	onDelete: (id: string) => void;
}) {
	const drawerRef = useRef<HTMLElement | null>(null);
	const closeBtnRef = useRef<HTMLButtonElement | null>(null);
	const previouslyFocusedRef = useRef<HTMLElement | null>(null);

	const titleId = useId();
	const descId = useId();

	// Animation states
	const [mounted, setMounted] = useState(false);
	const [closing, setClosing] = useState(false);
	const [actionsOpen, setActionsOpen] = useState(false);
	const [note, setNote] = useState(appointment.notes ?? '');
	const [rescheduleOpen, setRescheduleOpen] = useState(false);
	const [date, setDate] = useState(toDateInputValue(appointment.datetimeISO));
	const [time, setTime] = useState(toTimeInputValue(appointment.datetimeISO));
	const [rescheduleError, setRescheduleError] = useState('');

	const closeWithAnimation = () => {
		if (closing) return;

		// If user prefers reduced motion, close instantly
		if (prefersReducedMotion()) {
			onClose();
			return;
		}

		setClosing(true);
		// Must match duration-200 below
		window.setTimeout(() => onClose(), 200);
	};

	useEffect(() => {
		setNote(appointment.notes ?? '');
		setDate(toDateInputValue(appointment.datetimeISO));
		setTime(toTimeInputValue(appointment.datetimeISO));
		setRescheduleError('');
		setActionsOpen(false);
		setRescheduleOpen(false);
	}, [appointment]);

	useEffect(() => {
		previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		// Trigger enter animation + set initial focus
		const rafId = requestAnimationFrame(() => {
			setMounted(true);
			closeBtnRef.current?.focus();
		});

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				e.preventDefault();
				closeWithAnimation();
				return;
			}

			if (e.key !== 'Tab') return;

			const drawer = drawerRef.current;
			if (!drawer) return;

			const focusables = getFocusableElements(drawer);
			if (focusables.length === 0) return;

			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			const active = document.activeElement as HTMLElement | null;

			// If shift+tab on first -> jump to last
			if (e.shiftKey && active === first) {
				e.preventDefault();
				last.focus();
				return;
			}

			// If tab on last -> jump to first
			if (!e.shiftKey && active === last) {
				e.preventDefault();
				first.focus();
			}
		}

		document.addEventListener('keydown', onKeyDown);

		return () => {
			cancelAnimationFrame(rafId);
			document.removeEventListener('keydown', onKeyDown);
			document.body.style.overflow = prevOverflow;
			previouslyFocusedRef.current?.focus?.();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const show = mounted && !closing;
	const statusOptions: AppointmentStatus[] = [
		'Booked',
		'Checked-in',
		'Completed',
		'Cancelled',
		'No-show',
	];
	const availableStatusActions = statusOptions.filter(
		status => status !== appointment.status,
	);

	return (
		<div className='fixed inset-0 z-50'>
			{/* Overlay (click closes) */}
			<button
				className={[
					'absolute inset-0 bg-black/30',
					// fade overlay
					'motion-safe:transition-opacity motion-safe:duration-200',
					show ? 'opacity-100' : 'opacity-0',
				].join(' ')}
				onClick={closeWithAnimation}
				aria-label='Close details overlay'
			/>

			<aside
				ref={drawerRef}
				className={[
					'absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l p-5',
					// slide drawer
					'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out',
					show ? 'translate-x-0' : 'translate-x-full',
				].join(' ')}
				role='dialog'
				aria-modal='true'
				aria-labelledby={titleId}
				aria-describedby={descId}
			>
				<div className='flex items-start justify-between gap-3'>
					<div>
						<div className='text-xs opacity-70'>Appointment</div>
						<h2 id={titleId} className='text-xl font-semibold'>
							{appointment.patientName}
						</h2>
						<div id={descId} className='mt-1 text-sm opacity-70'>
							{formatDateTime(appointment.datetimeISO)} • {appointment.doctor}
						</div>
					</div>

					<button
						ref={closeBtnRef}
						type='button'
						className='rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
						onClick={closeWithAnimation}
						aria-label='Close details'
					>
						✕
					</button>
				</div>

				<div className='mt-4 flex items-center justify-between'>
					<StatusPill status={appointment.status} />
					<div className='text-xs opacity-70'>{appointment.id}</div>
				</div>

				<div className='mt-5 space-y-3 text-sm'>
					<div className='rounded-xl border p-3'>
						<div className='text-xs font-medium opacity-70'>
							Appointment type
						</div>
						<div className='mt-1'>{appointment.type}</div>
					</div>

					<div className='rounded-xl border p-3'>
						<div className='text-xs font-medium opacity-70'>Quick notes</div>
						<textarea
							value={note}
							onChange={e => setNote(e.target.value)}
							rows={3}
							placeholder='Add note...'
							className='mt-2 w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
							focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
						/>
						<div className='mt-2 flex justify-end'>
							<button
								type='button'
								className='rounded-xl border px-3 py-2 text-xs hover:bg-neutral-50
								focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
								onClick={() => onUpdateNotes(appointment.id, note)}
							>
								Save notes
							</button>
						</div>
					</div>
				</div>

				<div className='mt-6 flex flex-wrap gap-2'>
					<button
						type='button'
						className='flex-1 rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
						onClick={() => onEdit(appointment)}
					>
						Edit
					</button>

					<div className='relative flex-1'>
						<button
							type='button'
							className='w-full rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50
							focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
							onClick={() => setActionsOpen(v => !v)}
						>
							Actions
						</button>

						{actionsOpen && (
							<div className='absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg p-2 text-sm z-10'>
								{availableStatusActions.map(status => (
									<button
										key={status}
										type='button'
										className='w-full rounded-lg px-3 py-2 text-left hover:bg-neutral-50'
										onClick={() => {
											onStatusChange(appointment.id, status);
											setActionsOpen(false);
										}}
									>
										Mark as {status}
									</button>
								))}
								<button
									type='button'
									className='w-full rounded-lg px-3 py-2 text-left hover:bg-neutral-50'
									onClick={() => {
										setRescheduleOpen(true);
										setActionsOpen(false);
									}}
								>
									Reschedule...
								</button>
							</div>
						)}
					</div>
				</div>

				<div className='mt-3 flex flex-wrap gap-2'>
					<button
						type='button'
						className='rounded-xl border px-3 py-2 text-xs hover:bg-neutral-50
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
						onClick={() => {
							const text = `${appointment.patientName} — ${formatDateTime(
								appointment.datetimeISO,
							)} — ${appointment.doctor} — ${appointment.type}`;
							navigator.clipboard.writeText(text);
						}}
					>
						Copy details
					</button>

					<button
						type='button'
						className='rounded-xl border px-3 py-2 text-xs hover:bg-neutral-50
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
						onClick={() => alert('Reminder sent')}
					>
						Send reminder
					</button>

					<button
						type='button'
						className='rounded-xl border px-3 py-2 text-xs text-red-600 hover:bg-red-50
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
						onClick={() => {
							if (window.confirm('Delete this appointment?')) {
								onDelete(appointment.id);
							}
						}}
					>
						Delete
					</button>
				</div>
			</aside>

			{rescheduleOpen && (
				<div className='fixed inset-0 z-50'>
					<button
						className='absolute inset-0 bg-black/30'
						onClick={() => setRescheduleOpen(false)}
						aria-label='Close reschedule overlay'
					/>
					<aside
						className='absolute left-1/2 top-1/2 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border p-5'
						role='dialog'
						aria-modal='true'
					>
						<h3 className='text-lg font-semibold'>Reschedule</h3>
						<p className='mt-1 text-sm opacity-70'>Pick a new date and time.</p>

						<div className='mt-4 grid grid-cols-1 gap-3'>
							<div className='space-y-1'>
								<label
									htmlFor='reschedule-date'
									className='text-sm font-medium'
								>
									Date
								</label>
								<input
									id='reschedule-date'
									type='date'
									value={date}
									onChange={e => setDate(e.target.value)}
									className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
									focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
								/>
							</div>
							<div className='space-y-1'>
								<label
									htmlFor='reschedule-time'
									className='text-sm font-medium'
								>
									Time
								</label>
								<input
									id='reschedule-time'
									type='time'
									value={time}
									onChange={e => setTime(e.target.value)}
									className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
									focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
								/>
							</div>
						</div>

						{rescheduleError && (
							<div className='mt-2 text-sm text-red-600'>{rescheduleError}</div>
						)}

						<div className='mt-4 flex justify-end gap-2'>
							<button
								type='button'
								className='rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50'
								onClick={() => setRescheduleOpen(false)}
							>
								Cancel
							</button>
							<button
								type='button'
								className='rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
								focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
								onClick={() => {
									setRescheduleError('');
									if (!date || !time) {
										setRescheduleError('Please select a date and time.');
										return;
									}
									onReschedule(
										appointment.id,
										combineLocalDateTime(date, time),
									);
									setRescheduleOpen(false);
								}}
							>
								Save
							</button>
						</div>
					</aside>
				</div>
			)}
		</div>
	);
}
