import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // if (isLoading) {
  //   return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  // }
  
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }
  
  return <>{children}</>;
}; 