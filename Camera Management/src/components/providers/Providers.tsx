import { ReactNode, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoreProvider } from "easy-peasy";
import { ThemeProvider } from "@/context/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import store from "@/store";
import { useAuth } from "@/hooks/useStore";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const ProvidersContent = () => {
  const { restoreAuth } = useAuth();

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  return (
    <TooltipProvider>
      <Outlet />
      <Toaster />
      <Sonner />
    </TooltipProvider>
  );
};

const Providers = () => (
  <StoreProvider store={store}>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ProvidersContent />
      </QueryClientProvider>
    </ThemeProvider>
  </StoreProvider>
);

export default Providers; 