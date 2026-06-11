import { Route, Routes } from 'react-router-dom';
import MPDetailPage from '@/pages/MPDetailPage';
import MPsPage from '@/pages/MPsPage';

export default function App() {
  return (
    <div className="min-h-screen bg-bg-primary font-base text-text-primary">
      <Routes>
        <Route path="/" element={<MPsPage />} />
        <Route path="/mps/:id" element={<MPDetailPage />} />
      </Routes>
    </div>
  );
}
