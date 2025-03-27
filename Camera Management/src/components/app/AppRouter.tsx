import { useRoutes } from "react-router-dom";
import { routes } from "../../routes";

export const AppRouter = () => {
  const routeElement = useRoutes(routes);
  return routeElement;
}; 