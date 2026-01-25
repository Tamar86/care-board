export default function LoginPage() {
	return (
		<section className='w-full max-w-sm border rounded-2xl p-6'>
			<h1 className='text-2xl font-semibold'>Sign in</h1>
			<p className='text-sm opacity-70 mt-1'>
				Demo login screen (UI only for now)
			</p>

			<form className='mt-6 space-y-3'>
				<div className='space-y-1'>
					<label className='text-sm'>Email</label>
					<input
						className='w-full border rounded-xl px-3 py-2'
						type='email'
						placeholder='you@clinic.com'
					/>
				</div>

				<div className='space-y-1'>
					<label className='text-sm'>Password</label>
					<input
						className='w-full border rounded-xl px-3 py-2'
						type='password'
						placeholder='••••••••'
					/>
				</div>

				<button type='button' className='w-full rounded-xl px-3 py-2 border'>
					Sign in
				</button>
			</form>
		</section>
	);
}
