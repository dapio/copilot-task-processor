import { redirect } from 'next/navigation';

export default function HomePage() {
  // Przekieruj do nowego complete dashboard
  redirect('/complete-dashboard');

  return (
    <div>
      <h1>Przekierowanie...</h1>
    </div>
  );
}
