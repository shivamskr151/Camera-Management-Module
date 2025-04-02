import { useEffect, useState } from 'react';

interface ThemeColor {
  [key: string]: string;
}

export interface ThemeConfig {
  name: string;
  colors: ThemeColor;
  radius: string;
}

interface ThemesConfig {
  themes: {
    [key: string]: ThemeConfig;
  };
  activeTheme: string;
}

const defaultConfig: ThemesConfig = {
  themes: {
    light: {
      name: "Light",
      colors: {},
      radius: "0.75rem"
    },
    dark: {
      name: "Dark",
      colors: {},
      radius: "0.75rem"
    }
  },
  activeTheme: "light"
};

export const useThemeConfig = () => {
  const [themeConfig, setThemeConfig] = useState<ThemesConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadThemeConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/themes.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load theme configuration: ${response.statusText}`);
        }
        
        const data = await response.json();
        setThemeConfig(data);
        setError(null);
      } catch (err) {
        console.error('Error loading theme configuration:', err);
        setError(err instanceof Error ? err.message : 'Failed to load theme configuration');
      } finally {
        setLoading(false);
      }
    };

    loadThemeConfig();
  }, []);

  const getTheme = (themeName: string): ThemeConfig | undefined => {
    return themeConfig.themes[themeName];
  };

  const getAllThemes = (): { id: string; name: string }[] => {
    return Object.entries(themeConfig.themes).map(([id, theme]) => ({
      id,
      name: theme.name
    }));
  };

  const getActiveThemeName = (): string => {
    return themeConfig.activeTheme;
  };

  return {
    themeConfig,
    loading,
    error,
    getTheme,
    getAllThemes,
    getActiveThemeName
  };
}; 