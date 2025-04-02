import { RouteObject } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotAuthorized from "@/pages/NotAuthorized";

export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/not-authorized",
    element: <NotAuthorized />
  }
]; 