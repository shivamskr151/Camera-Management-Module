import { RouteObject } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import SettingsLayout from "@/pages/settings/SettingsLayout";
import MasksAndZones from "@/pages/settings/MasksAndZones";
import PTZCamera from "@/pages/settings/PTZCamera";
import CameraConfiguration from "@/pages/settings/CameraConfiguration";
import { Navigate } from "react-router-dom";

export const dashboardRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: "dashboard",
    element: <Dashboard />
  },
  {
    path: "settings",
    element: <SettingsLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/settings/masks" replace />
      },
      {
        path: "masks",
        element: <MasksAndZones />
      },
      {
        path: "ptz",
        element: <PTZCamera />
      },
      {
        path: "config",
        element: <CameraConfiguration />
      }
    ]
  }
  // Add more dashboard routes here
]; 