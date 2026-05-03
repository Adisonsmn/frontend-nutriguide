import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const NotFound = () => {
  const { isAuthenticated } = useAuthStore();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      {isAuthenticated ? (
        <Link to="/dashboard" className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90">
          Return to Dashboard
        </Link>
      ) : (
        <Link to="/" className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90">
          Return Home
        </Link>
      )}
    </div>
  );
};
