import { Link, Route, Routes } from 'react-router-dom';
import MPDetailPage from '@/pages/MPDetailPage';
import MPsPage from '@/pages/MPsPage';

export default function App() {
  return (
    <div className="min-h-screen bg-bg-primary font-base text-text-primary">
      <Routes>
        <Route path="/" element={<MPsPage />} />
        <Route path="/mps/:id" element={<MPDetailPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-label text-text-secondary">404</p>
      <h1 className="mt-2 text-2xl font-medium text-text-primary">
        Page not found
      </h1>
      <p className="mt-3 text-base text-text-secondary">
        That page doesn&rsquo;t exist. The MP list is the place to start.
      </p>
      <p className="mt-6">
        <Link
          to="/"
          className="text-base text-accent underline-offset-4 hover:underline"
        >
          Go to the MP list
        </Link>
      </p>
    </main>
  );
}
