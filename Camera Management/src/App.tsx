import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppInitializer } from "@/components/app/AppInitializer";
import { AppRouter } from "@/components/app/AppRouter";

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <AppInitializer>
        <AppRouter />
      </AppInitializer>
    </BrowserRouter>
  </AppProviders>
);

export default App;
