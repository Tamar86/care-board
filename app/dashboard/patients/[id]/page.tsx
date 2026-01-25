export default function PatientProfilePage({
	params,
}: {
	params: { id: string };
}) {
	return (
		<div>
			<h1 className='text-2xl font-semibold'>Patient Profile</h1>
			<p className='opacity-70 mt-2'>Patient ID: {params.id}</p>
		</div>
	);
}
