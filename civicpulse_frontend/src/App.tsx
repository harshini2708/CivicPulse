import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ComplaintProvider } from './context/ComplaintContext';
import { LandingPage } from './components/landing/LandingPage';
import { CitizenPortal } from './components/citizen/CitizenPortal';
import { WorkerPortal } from './components/worker/WorkerPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { ToastContainer } from './components/common/ToastContainer';

const PortalRouter: React.FC = () => {
  const { portalMode } = useAuth();

  switch (portalMode) {
    case 'citizen':
      return <CitizenPortal />;
    case 'worker':
      return <WorkerPortal />;
    case 'admin':
      return <AdminPortal />;
    case 'landing':
    default:
      return <LandingPage />;
  }
};

export function App() {
  return (
    <AuthProvider>
      <ComplaintProvider>
        <PortalRouter />
        <ToastContainer />
      </ComplaintProvider>
    </AuthProvider>
  );
}

export default App;
