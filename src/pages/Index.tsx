import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import HomePage from '@/components/HomePage';
import DeliveryDashboard from '@/components/DeliveryDashboard';
import CustomerVerification from '@/components/CustomerVerification';
import AdminDashboard from '@/components/AdminDashboard';
import AuthPage from '@/components/AuthPage';

const Index = () => {
  const [currentView, setCurrentView] = useState('home');
  const { user, profile, loading } = useAuth();

  // Auto-redirect based on user role
  useEffect(() => {
    if (profile) {
      if (profile.role === 'agent') {
        setCurrentView('agent');
      } else if (profile.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('customer');
      }
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'agent':
        return <DeliveryDashboard />;
      case 'customer':
        return <CustomerVerification />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <HomePage onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {renderCurrentView()}
    </div>
  );
};

export default Index;
