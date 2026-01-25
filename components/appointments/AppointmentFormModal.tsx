'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import type { Appointment, AppointmentStatus } from '@/types/appointments';

type Mode = 'create' | 'edit';

type Props = {
	open: boolean;
	mode: Mode;
	initial?: Appointment | null;
	doctors: string[];
	types: string[];
	onClose: () => void;
	onSubmit: (data: Appointment) => void;
};

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

function toDateInputValue(iso: string) {
	// ISO -> YYYY-MM-DD
	const d = new Date(iso);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function toTimeInputValue(iso: string) {
	// ISO -> HH:MM (local)
	const d = new Date(iso);
	const hh = String(d.getHours()).padStart(2, '0');
	const min = String(d.getMinutes()).padStart(2, '0');
	return `${hh}:${min}`;
}

function combineLocalDateTime(date: string, time: string) {
	// date: YYYY-MM-DD, time: HH:MM → ISO string in local time
	const [y, m, d] = date.split('-').map(Number);
	const [hh, mm] = time.split(':').map(Number);
	const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
	return dt.toISOString();
}

function generateId() {
	// Simple ID for demo
	return `A-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function AppointmentFormModal({
	open,
	mode,
	initial,
	doctors,
	types,
	onClose,
	onSubmit,
}: Props) {
	const dialogRef = useRef<HTMLElement | null>(null);
	const firstFieldRef = useRef<HTMLInputElement | null>(null);
	const previouslyFocusedRef = useRef<HTMLElement | null>(null);

	const titleId = useId();
	const descId = useId();

	const isEdit = mode === 'edit';

	const initialValues = useMemo(() => {
		if (isEdit && initial) {
			return {
				patientName: initial.patientName,
				doctor: initial.doctor,
				type: initial.type,
				date: toDateInputValue(initial.datetimeISO),
				time: toTimeInputValue(initial.datetimeISO),
				status: initial.status as AppointmentStatus,
				notes: initial.notes ?? '',
			};
		}
		return {
			patientName: '',
			doctor: doctors[0] ?? 'Dr. Patel',
			type: types[0] ?? 'Consultation (30m)',
			date: '',
			time: '',
			status: 'Booked' as AppointmentStatus,
			notes: '',
		};
	}, [doctors, types, isEdit, initial]);

	const [patientName, setPatientName] = useState(initialValues.patientName);
	const [doctor, setDoctor] = useState(initialValues.doctor);
	const [type, setType] = useState(initialValues.type);
	const [date, setDate] = useState(initialValues.date);
	const [time, setTime] = useState(initialValues.time);
	const [status, setStatus] = useState<AppointmentStatus>(initialValues.status);
	const [notes, setNotes] = useState(initialValues.notes);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		if (!open) return;

		previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		requestAnimationFrame(() => {
			firstFieldRef.current?.focus();
		});

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				e.preventDefault();
				onClose();
				return;
			}

			if (e.key !== 'Tab') return;

			const dialog = dialogRef.current;
			if (!dialog) return;

			const focusables = getFocusableElements(dialog);
			if (focusables.length === 0) return;

			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			const active = document.activeElement as HTMLElement | null;

			if (e.shiftKey && active === first) {
				e.preventDefault();
				last.focus();
				return;
			}

			if (!e.shiftKey && active === last) {
				e.preventDefault();
				first.focus();
			}
		}

		document.addEventListener('keydown', onKeyDown);

		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.body.style.overflow = prevOverflow;
			previouslyFocusedRef.current?.focus?.();
		};
	}, [open, onClose]);

	if (!open) return null;

	function handleSubmit() {
		setError('');

		if (!patientName.trim()) {
			setError('Patient name is required.');
			return;
		}
		if (!date || !time) {
			setError('Please select a date and time.');
			return;
		}

		const datetimeISO = combineLocalDateTime(date, time);

		const payload: Appointment = {
			id: isEdit && initial ? initial.id : generateId(),
			patientName: patientName.trim(),
			doctor,
			type,
			datetimeISO,
			status,
			notes: notes.trim() ? notes.trim() : undefined,
		};

		onSubmit(payload);
		onClose();
	}

	return (
		<div className='fixed inset-0 z-50'>
			<button
				className='absolute inset-0 bg-black/30'
				onClick={onClose}
				aria-label='Close modal overlay'
			/>

			<aside
				ref={dialogRef}
				className='absolute left-1/2 top-1/2 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border p-5'
				role='dialog'
				aria-modal='true'
				aria-labelledby={titleId}
				aria-describedby={descId}
			>
				<div className='flex items-start justify-between gap-3'>
					<div>
						<h2 id={titleId} className='text-xl font-semibold'>
							{isEdit ? 'Edit appointment' : 'New appointment'}
						</h2>
						<p id={descId} className='mt-1 text-sm opacity-70'>
							Fill the details below to {isEdit ? 'update' : 'create'} an
							appointment.
						</p>
					</div>

					<button
						type='button'
						className='rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
						onClick={onClose}
						aria-label='Close modal'
					>
						✕
					</button>
				</div>

				<div className='mt-5 grid grid-cols-1 gap-3'>
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Patient name *</label>
						<input
							ref={firstFieldRef}
							value={patientName}
							onChange={e => setPatientName(e.target.value)}
							className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
							focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
							placeholder='e.g. Anna Robertson'
						/>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Doctor</label>
							<select
								title='Select doctor'
								value={doctor}
								onChange={e => setDoctor(e.target.value)}
								className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
								focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
							>
								{doctors.map(d => (
									<option key={d} value={d}>
										{d}
									</option>
								))}
							</select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Type</label>
							<select
								title='Select appointment type'
								value={type}
								onChange={e => setType(e.target.value)}
								className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
								focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
							>
								{types.map(t => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Date *</label>
							<input
								title='Select appointment date'
								type='date'
								value={date}
								onChange={e => setDate(e.target.value)}
								className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
								focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
							/>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Time *</label>
							<input
								title='Select appointment time'
								type='time'
								value={time}
								onChange={e => setTime(e.target.value)}
								className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
								focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
							/>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Status</label>
							<select
								title='Select appointment status'
								value={status}
								onChange={e => setStatus(e.target.value as AppointmentStatus)}
								className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
								focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
							>
								<option value='Booked'>Booked</option>
								<option value='Checked-in'>Checked-in</option>
								<option value='Completed'>Completed</option>
								<option value='Cancelled'>Cancelled</option>
								<option value='No-show'>No-show</option>
							</select>
						</div>
					</div>

					<div className='space-y-1'>
						<label className='text-sm font-medium'>Notes</label>
						<textarea
							value={notes}
							onChange={e => setNotes(e.target.value)}
							rows={3}
							className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
							focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
							placeholder='Optional notes…'
						/>
					</div>

					{error && (
						<div className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
							{error}
						</div>
					)}
				</div>

				<div className='mt-6 flex gap-2'>
					<button
						type='button'
						className='flex-1 rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						type='button'
						className='flex-1 rounded-xl border px-4 py-2 text-sm bg-green-600 text-white border-green-600 hover:opacity-90
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
						onClick={handleSubmit}
					>
						{isEdit ? 'Save changes' : 'Create'}
					</button>
				</div>
			</aside>
		</div>
	);
}
