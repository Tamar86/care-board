'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarClock, Users, Settings } from 'lucide-react';

type NavItem = {
	href: string;
	label: string;
	Icon: React.ElementType;
};

const navItems: NavItem[] = [
	{
		href: '/dashboard',
		label: 'Dashboard',
		Icon: LayoutDashboard,
	},
	{
		href: '/dashboard/appointments',
		label: 'Appointments',
		Icon: CalendarClock,
	},
	{
		href: '/dashboard/patients',
		label: 'Patients',
		Icon: Users,
	},
	{
		href: '/dashboard/settings',
		label: 'Settings',
		Icon: Settings,
	},
];

function isActivePath(pathname: string, href: string) {
	// patients stays active for /dashboard/patients/[id]
	if (href === '/dashboard/patients') {
		return (
			pathname === '/dashboard/patients' ||
			pathname.startsWith('/dashboard/patients/')
		);
	}

	return pathname === href;
}

export default function SidebarNav({
	onNavigate,
}: {
	onNavigate?: () => void;
}) {
	const pathname = usePathname();

	return (
		<nav className='mt-6 space-y-1' aria-label='Primary navigation'>
			{navItems.map(item => {
				const active = isActivePath(pathname, item.href);
				const Icon = item.Icon;

				return (
					<Link
						key={item.href}
						href={item.href}
						onClick={onNavigate}
						aria-current={active ? 'page' : undefined}
						className={[
							'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
							'border border-transparent',
							'hover:bg-neutral-50',
							// keyboard focus
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2',
							active
								? 'bg-green-100/60 text-green-700 border-green-200'
								: 'text-neutral-700',
						].join(' ')}
					>
						{/* Active indicator */}
						<span
							className={[
								'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r',
								active ? 'bg-green-600' : 'bg-transparent',
							].join(' ')}
						/>

						{/* Icon */}
						<Icon
							className={[
								'h-4 w-4 shrink-0',
								active
									? 'text-green-700'
									: 'text-neutral-500 group-hover:text-neutral-700',
							].join(' ')}
							aria-hidden='true'
						/>

						<span className='pl-1 truncate'>{item.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}
