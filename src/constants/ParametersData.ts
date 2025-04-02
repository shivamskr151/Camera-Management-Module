import { ParameterValue } from "@/components/ParametersForm";

type Point = [number, number];
type SpeedLimit = { [key: string]: number };
type Distance = { [key: string]: number };
type Capacity = { [key: string]: number };

export interface ActivityData {
  id: string;
  name: string;
  data: {
    parameters: Record<string, ParameterValue | Point[] | SpeedLimit | Distance | Capacity>;
  };
}

export const activityData: ActivityData[] = [
  {
    id: "ppe",
    name: "ppe",
    data: {
      parameters: {
        subcategory_mapping: [
          "no-vest",
          "head",
          "foot",
          "no-arc-suit",
          "no-glasses",
          "hands",
          "face",
          "ear"
        ],
        frame_accuracy: 20
      }
    }
  },
  {
    id: "fire_and_smoke",
    name: "fire_and_smoke",
    data: {
      parameters: {
        subcategory_mapping: ["fire", "smoke"],
        frame_accuracy: 20,
        last_frame_check: 2,
        alert_interval: 6
      }
    }
  },
  {
    id: "person_violations",
    name: "person_violations",
    data: {
      parameters: {
        subcategory_mapping: ["unconscious", "fallen", "sitting"],
        acts: ["SITTING", "FALLEN", "UNCONSCIOUS", "HELP"],
        frame_accuracy: 5,
        iou: 0.8,
        conf: 0.4,
        FALL_ANGLE_THRESHOLD: 45,
        UNCONSCIOUS_TIME_THRESHOLD: 20,
        FALL_CONFIRMATION_FRAMES: 2,
        SEATED_RATIO_THRESHOLD: 0.5,
        SITTING_TORSO_ANGLE_THRESHOLD: 55
      }
    }
  },
  {
    id: "perimeter_monitoring",
    name: "perimeter_monitoring",
    data: {
      parameters: {
        subcategory_mapping: ["person"],
        frame_accuracy: 10
      }
    }
  },
  {
    id: "climbing",
    name: "climbing",
    data: {
      parameters: {
        subcategory_mapping: ["person"],
        frame_accuracy: 20
      }
    }
  },
  {
    id: "traffic_overspeeding",
    name: "traffic_overspeeding",
    data: {
      parameters: {
        SOURCE: [
          [52, 39],
          [1223, 45],
          [1245, 708],
          [36, 706]
        ] as Point[],
        TARGET_WIDTH: 25,
        TARGET_HEIGHT: 250,
        speed_limit: { car: 20 } as SpeedLimit,
        calibration: 1
      }
    }
  },
  {
    id: "workplace_overspeeding",
    name: "workplace_overspeeding",
    data: {
      parameters: {
        speed_limit: { car: 20 } as SpeedLimit,
        calibration: 1,
        distance: { gate1: 20 } as Distance,
        error_threshold: 120
      }
    }
  },
  {
    id: "vehicle_interaction",
    name: "vehicle_interaction",
    data: {
      parameters: {
        vehicle_classes: ["forklift", "car", "truck", "bus"],
        person_classes: ["person"],
        motion_thr: 5,
        collision_angel_threshold: 30,
        vv_hor_interaction_percentage: 0.5,
        vv_ver_interaction_percentage: 0.7,
        hor_interaction_percentage: 0.5,
        ver_interaction_percentage: 0.7
      }
    }
  },
  {
    id: "workforce_efficiency",
    name: "workforce_efficiency",
    data: {
      parameters: {}
    }
  },
  {
    id: "desk_occupancy",
    name: "desk_occupancy",
    data: {
      parameters: {}
    }
  },
  {
    id: "entry_exit_logs",
    name: "entry_exit_logs",
    data: {
      parameters: {}
    }
  },
  {
    id: "resource_utilization",
    name: "resource_utilization",
    data: {
      parameters: {}
    }
  },
  {
    id: "people_gathering",
    name: "people_gathering",
    data: {
      parameters: {
        person_limit: 2,
        last_time: 30,
        frame_accuracy: 300
      }
    }
  },
  {
    id: "workplace_area_occupancy",
    name: "workplace_area_occupancy",
    data: {
      parameters: {
        capacity: { office_room: 20 } as Capacity
      }
    }
  }
]; 