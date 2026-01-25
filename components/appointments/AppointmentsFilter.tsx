import { statuses } from '@/lib/appointments';
import { Appointment } from '@/types/appointments';
import { DateRange } from '@/lib/dates';

interface AppointmentsFilterProps {
	query: string;
	setQuery: (query: string) => void;
	status: (typeof statuses)[number];
	setStatus: (status: (typeof statuses)[number]) => void;
	doctor: string;
	setDoctor: (doctor: string) => void;
	dateRange: DateRange;
	setDateRange: (dateRange: DateRange) => void;
	fromDate: string;
	setFromDate: (fromDate: string) => void;
	toDate: string;
	setToDate: (toDate: string) => void;
	filtered: Appointment[];
	doctorsList: string[]; // already passed ✅
}

export default function AppointmentsFilter({
	query,
	setQuery,
	status,
	setStatus,
	doctor,
	setDoctor,
	dateRange,
	setDateRange,
	fromDate,
	setFromDate,
	toDate,
	setToDate,
	filtered,
	doctorsList,
}: AppointmentsFilterProps) {
	const doctorOptions = ['All', ...doctorsList];

	return (
		<div className='rounded-2xl border p-4'>
			<div className='flex flex-wrap gap-2'>
				{(['All', 'Today', 'This week', 'Custom'] as const).map(r => {
					const active = dateRange === r;
					return (
						<button
							key={r}
							type='button'
							onClick={() => {
								setDateRange(r);
								if (r !== 'Custom') {
									setFromDate('');
									setToDate('');
								}
							}}
							className={[
								'rounded-xl px-3 py-2 text-sm border transition hover:bg-neutral-50',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2',
								active
									? 'bg-green-50 text-green-700 border-green-200'
									: 'border-neutral-200',
							].join(' ')}
						>
							{r}
						</button>
					);
				})}
			</div>

			<div className='mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>From</label>
					<input
						title='From date'
						type='date'
						value={fromDate}
						onChange={e => {
							setFromDate(e.target.value);
							setDateRange('Custom');
						}}
						className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					/>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>To</label>
					<input
						title='To date'
						type='date'
						value={toDate}
						onChange={e => {
							setToDate(e.target.value);
							setDateRange('Custom');
						}}
						className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					/>
				</div>

				<div className='flex items-end'>
					<button
						type='button'
						onClick={() => {
							setDateRange('All');
							setFromDate('');
							setToDate('');
						}}
						className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					>
						Clear dates
					</button>
				</div>
			</div>

			<div className='my-4 border-t' />

			<div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Search</label>
					<input
						value={query}
						onChange={e => setQuery(e.target.value)}
						placeholder='Patient, doctor, ID, type...'
						className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					/>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Status</label>
					<select
						title='Status filter'
						value={status}
						onChange={e =>
							setStatus(e.target.value as (typeof statuses)[number])
						}
						className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					>
						{statuses.map(s => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Doctor</label>
					<select
						title='Doctor filter'
						value={doctor}
						onChange={e => setDoctor(e.target.value)}
						className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2'
					>
						{doctorOptions.map(d => (
							<option key={d} value={d}>
								{d}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className='mt-3 text-sm opacity-70'>
				Showing{' '}
				<span className='font-medium opacity-100'>{filtered.length}</span>{' '}
				appointments
			</div>
		</div>
	);
}
