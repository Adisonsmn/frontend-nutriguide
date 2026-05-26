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
import { Recommendation } from './pages/Recommendation';
import { Profile } from './pages/Profile';
import { History } from './pages/History';
import { Articles } from './pages/Articles';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { FoodDetail } from './pages/FoodDetail';
import { RecipePage } from './pages/RecipePage';
import { ArticleDetail } from './pages/ArticleDetail';
import { NotFound } from './pages/NotFound';
import { Notifications } from './pages/Notifications';

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
            <Route path="/recommendations" element={<Recommendation />} />
            <Route path="/food/:foodId" element={<FoodDetail />} />
            <Route path="/food/:foodId/recipe" element={<RecipePage />} />
            <Route path="/history" element={<History />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:articleId" element={<ArticleDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
