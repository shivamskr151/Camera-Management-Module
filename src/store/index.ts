import { createStore, persist } from 'easy-peasy';
import { StoreModel, authModel, themeModel, cameraConfigModel, activityModel } from './model';

// Create the store with the models
const store = createStore<StoreModel>(
  persist(
    {
      auth: authModel,
      theme: themeModel,
      cameraConfig: cameraConfigModel,
      activity: activityModel,
    },
    {
      storage: 'localStorage',
      allow: ['auth', 'theme', 'cameraConfig', 'activity'], // Persist auth, theme, camera config and activity in localStorage
    }
  )
);

export default store;

// Type-safe hooks
export type RootStore = typeof store;
export type AppDispatch = typeof store.dispatch;
