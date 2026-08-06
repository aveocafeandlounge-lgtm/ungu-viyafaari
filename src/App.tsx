import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Shops from './pages/Shops';
import Batches from './pages/Batches';
import Collections from './pages/Collections';
import Recipes from './pages/Recipes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Users from './pages/Users';
import Visitors from './pages/Visitors';
import PromotionalPresentations from './pages/PromotionalPresentations';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user is pending approval (super-admin bypasses this check)
  if (user.status === 'pending' && !isSuperAdmin) {
    return <Navigate to="/pending-approval" replace />;
  }
  
  // Check if user is rejected
  if (user.status === 'rejected' && !isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="shops" element={<Shops />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="sales" element={<Sales />} />
              <Route path="batches" element={<Batches />} />
              <Route path="collections" element={<Collections />} />
              <Route path="recipes" element={<Recipes />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<Users />} />
              <Route path="visitors" element={<Visitors />} />
              <Route path="promotional-presentations" element={<PromotionalPresentations />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
