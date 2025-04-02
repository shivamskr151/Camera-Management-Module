import { RouteObject } from "react-router-dom";
import { authRoutes } from "./authRoutes";
import { dashboardRoutes } from "./dashboardRoutes";
import { ProtectedRoute } from "./ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import NotFound from "@/pages/NotFound";
import Providers from "@/components/providers/Providers";
import { Navigate } from "react-router-dom";

// Combined route configuration
export const routes: RouteObject[] = [
  {
    element: <Providers />,
    children: [
      // Root redirect
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      
      // Auth routes
      ...authRoutes,
      
      // Protected routes with MainLayout
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        ),
        children: dashboardRoutes
      },
      
      // Catch-all route
      {
        path: "*",
        element: <NotFound />
      }
    ]
  }
]; 