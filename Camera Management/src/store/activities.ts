import { createStore, action, Action } from 'easy-peasy';
import { persist } from 'easy-peasy';

export interface ActivityConfig {
  id: string;
  name: string;
  data: {
    zones: Record<string, any>;
    parameters: {
      subcategory_mapping: any[];
    };
  };
  status: 'active' | 'inactive';
  lastModified: string;
}

interface ActivityModel {
  activities: ActivityConfig[];
  addActivity: Action<ActivityModel, ActivityConfig>;
  updateActivity: Action<ActivityModel, ActivityConfig>;
  deleteActivity: Action<ActivityModel, string>;
  getActivityNames: Action<ActivityModel, string[]>;
}

const activityStore = createStore<ActivityModel>(
  persist(
    {
      activities: [],
      addActivity: action((state, activity) => {
        state.activities.push(activity);
      }),
      updateActivity: action((state, activity) => {
        const index = state.activities.findIndex(a => a.id === activity.id);
        if (index !== -1) {
          state.activities[index] = activity;
        }
      }),
      deleteActivity: action((state, id) => {
        state.activities = state.activities.filter(a => a.id !== id);
      }),
      getActivityNames: action((state) => {
        return state.activities.map(activity => activity.name);
      })
    },
    {
      storage: localStorage,
      name: 'activity-store'
    }
  )
);

export default activityStore; 