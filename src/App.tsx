import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import { PageLayout } from './components/layout/PageLayout';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        {/* Landing page — tanpa global layout */}
        <Route path="/" element={<Landing />} />

        {/* Public Routes with Layout */}
        <Route element={<PageLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/recommendations" element={<div className="p-8 text-center text-gray-500">Recommendations (Coming Soon)</div>} />
            <Route path="/history" element={<div className="p-8 text-center text-gray-500">History (Coming Soon)</div>} />
            <Route path="/articles" element={<div className="p-8 text-center text-gray-500">Articles (Coming Soon)</div>} />
            <Route path="/profile" element={<div className="p-8 text-center text-gray-500">Profile (Coming Soon)</div>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
