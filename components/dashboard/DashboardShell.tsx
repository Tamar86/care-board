'use client';

import { useState } from 'react';
import Link from 'next/link';
import SidebarNav from './SidebarNav';
import { HeartPulse } from 'lucide-react';

export default function DashboardShell({
	children,
}: {
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);

	return (
		<div className='min-h-screen bg-white'>
			{/* Topbar */}
			<header className='sticky top-0 z-30 border-b bg-white/90 backdrop-blur'>
				<div className='mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3'>
					<div className='flex items-center gap-3'>
						{/* Mobile menu button */}
						<button
							type='button'
							className='md:hidden inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50'
							onClick={() => setOpen(true)}
							aria-label='Open menu'
						>
							☰
						</button>

						<Link
							href='/dashboard'
							className='flex items-center gap-2 font-semibold text-lg'
						>
							<HeartPulse
								className='h-5 w-5 text-green-600'
								aria-hidden='true'
							/>
							CareBoard
						</Link>
					</div>

					{/* Search (UI only) */}
					<div className='hidden sm:block w-full max-w-md'>
						<input
							className='w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50 focus:outline-none'
							placeholder='Search patients, appointments...'
						/>
					</div>

					{/* Profile placeholder */}
					<div className='flex items-center gap-2'>
						<div className='hidden sm:block text-sm opacity-70'>Reception</div>
						<div className='h-9 w-9 rounded-full border flex items-center justify-center text-sm'>
							TC
						</div>
					</div>
				</div>
			</header>

			{/* Layout */}
			<div className='mx-auto max-w-6xl px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6'>
				{/* Desktop sidebar */}
				<aside className='hidden md:block'>
					<div className='rounded-2xl border p-4'>
						<SidebarNav />
					</div>
				</aside>

				{/* Main content */}
				<main className='min-w-0'>{children}</main>
			</div>

			{/* Mobile drawer */}
			{open && (
				<div className='fixed inset-0 z-50 md:hidden'>
					{/* overlay */}
					<button
						type='button'
						className='absolute inset-0 bg-black/30'
						onClick={() => setOpen(false)}
						aria-label='Close menu overlay'
					/>
					{/* drawer */}
					<div className='absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-xl p-4'>
						<div className='flex items-center justify-between'>
							<div className='font-semibold text-lg'>ClinicFlow</div>
							<button
								type='button'
								className='rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50'
								onClick={() => setOpen(false)}
								aria-label='Close menu'
							>
								✕
							</button>
						</div>

						<SidebarNav onNavigate={() => setOpen(false)} />
					</div>
				</div>
			)}
		</div>
	);
}
