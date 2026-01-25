import Link from 'next/link';

export default function PatientsPage() {
	// temporary demo list
	const patients = [
		{ id: 'p001', name: 'Anna Robertson' },
		{ id: 'p002', name: 'James Miller' },
	];

	return (
		<div>
			<h1 className='text-2xl font-semibold'>Patients</h1>
			<ul className='mt-4 space-y-2'>
				{patients.map(p => (
					<li key={p.id} className='border rounded-xl p-3'>
						<Link className='hover:underline' href={`/patients/${p.id}`}>
							{p.name} → ({p.id})
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
