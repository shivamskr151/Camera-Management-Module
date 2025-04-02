// Configuration schema for the application
export interface AppConfig {
  // Dashboard configuration
  dashboard: {
    title: string;
    welcomeMessage: string;
  };
  
  // Authentication pages configuration
  auth: {
    login: {
      title: string;
      subtitle: string;
    };
    register: {
      title: string;
      subtitle: string;
    };
  };
  
  // Sidebar configuration
  sidebar: {
    appName: string;
    sections: {
      [key: string]: {
        title: string;
        items: {
          name: string;
          icon: string;
          href: string;
        }[];
      };
    };
    // User roles configuration
    roles: {
      [role: string]: string[]; // Array of section keys accessible to this role
    };
  };
}

// Default configuration
export const defaultConfig: AppConfig = {
  dashboard: {
    title: "Dashboard",
    welcomeMessage: "Welcome back to your dashboard overview."
  },
  auth: {
    login: {
      title: "Welcome back",
      subtitle: "Enter your credentials to access your account"
    },
    register: {
      title: "Create an account",
      subtitle: "Enter your details to get started"
    }
  },
  sidebar: {
    appName: "DashboardX",
    sections: {
      main: {
        title: "Menu",
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", href: "/dashboard" },
          { name: "Reports", icon: "BarChart3", href: "/reports" },
          { name: "Documents", icon: "FileText", href: "/documents" }
        ]
      },
      settings: {
        title: "Settings",
        items: [
          { name: "Settings", icon: "Settings", href: "/settings" }
        ]
      },
      support: {
        title: "Support",
        items: [
          { name: "Help Center", icon: "Package", href: "/help" }
        ]
      }
    },
    roles: {
      user: ["main", "settings", "support"],
      admin: ["main", "settings", "support"]
    }
  }
};

// Function to load custom configuration and merge with defaults
export function loadConfig(): AppConfig {
  try {
    // In a real application, this could load from an API, localStorage, or a JSON file
    const customConfig = localStorage.getItem('appConfig');
    if (customConfig) {
      return { ...defaultConfig, ...JSON.parse(customConfig) };
    }
  } catch (error) {
    console.error("Error loading custom configuration:", error);
  }
  
  return defaultConfig;
}

// Export the config as a singleton
export const appConfig = loadConfig(); 