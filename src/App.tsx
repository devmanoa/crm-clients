import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import ClientListPage from './pages/clients/ClientListPage';
import ClientCreatePage from './pages/clients/ClientCreatePage';
import ClientEditPage from './pages/clients/ClientEditPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/clients" replace />} />
            {/* Clients */}
            <Route path="clients" element={<ClientListPage />} />
            <Route path="clients/add" element={<ClientCreatePage />} />
            <Route path="clients/dashboard" element={<div className="p-6"><h1 className="text-2xl font-bold">Tableau de bord clients - A venir</h1></div>} />
            <Route path="clients/duplicates" element={<div className="p-6"><h1 className="text-2xl font-bold">Gestion des doublons - A venir</h1></div>} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="clients/:id/edit" element={<ClientEditPage />} />
            <Route path="clients/:id/merge" element={<div className="p-6"><h1 className="text-2xl font-bold">Fusion clients - A venir</h1></div>} />
            {/* Opportunities */}
            <Route path="opportunities" element={<div className="p-6"><h1 className="text-2xl font-bold">Opportunités - A venir</h1></div>} />
            <Route path="opportunities/pipeline" element={<div className="p-6"><h1 className="text-2xl font-bold">Pipeline - A venir</h1></div>} />
            <Route path="opportunities/dashboard" element={<div className="p-6"><h1 className="text-2xl font-bold">Dashboard opportunités - A venir</h1></div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
