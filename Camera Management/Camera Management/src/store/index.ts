import { createStore, persist } from 'easy-peasy';
import { StoreModel, authModel, themeModel, cameraConfigModel } from './model';

// Create the store with the models
const store = createStore<StoreModel>(
  persist(
    {
      auth: authModel,
      theme: themeModel,
      cameraConfig: cameraConfigModel,
    },
    {
      storage: 'localStorage',
      allow: ['auth', 'theme', 'cameraConfig'], // Persist auth, theme and camera config in localStorage
    }
  )
);

export default store;

// Type-safe hooks
export type RootStore = typeof store;
export type AppDispatch = typeof store.dispatch;
