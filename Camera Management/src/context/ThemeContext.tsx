import React, { createContext, useContext, useEffect, useState } from 'react';
import { useThemeConfig, ThemeConfig } from '@/hooks/useThemeConfig';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  themeConfig: ThemeConfig | undefined;
  availableThemes: { id: string; name: string }[];
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to convert hex to HSL
const hexToHSL = (hex: string): string => {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else {
    r = parseInt(hex.slice(0, 2), 16) / 255;
    g = parseInt(hex.slice(2, 4), 16) / 255;
    b = parseInt(hex.slice(4, 6), 16) / 255;
  }
  
  // Find min and max
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Calculate lightness
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    // Achromatic
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    
    h /= 6;
  }
  
  // Convert to HSL format
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
};

// Helper function to determine if a value is a hex color
const isHexColor = (value: string): boolean => {
  return /^#([A-Fa-f0-9]{3}){1,2}$/.test(value);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getTheme, getAllThemes, getActiveThemeName, loading } = useThemeConfig();
  const [theme, setTheme] = useState<string>(() => {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme');
    
    // Check for system preference if no saved theme
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    
    return savedTheme || 'light';
  });

  const themeConfig = getTheme(theme);
  const availableThemes = getAllThemes();

  useEffect(() => {
    // Apply theme to document element
    const root = window.document.documentElement;
    
    // Remove all theme classes
    const possibleThemes = availableThemes.map(t => t.id);
    root.classList.remove(...possibleThemes);
    
    // Add current theme class
    root.classList.add(theme);
    
    // Apply theme colors from config
    if (themeConfig) {
      // Apply colors
      Object.entries(themeConfig.colors).forEach(([property, value]) => {
        // Convert hex to HSL if it's a hex color
        const colorValue = isHexColor(value) ? hexToHSL(value) : value;
        root.style.setProperty(`--${property}`, colorValue);
      });
      
      // Apply radius
      root.style.setProperty('--radius', themeConfig.radius);
    }
    
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, themeConfig, availableThemes]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    // Toggle between light and dark, ignoring custom themes
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        toggleTheme, 
        themeConfig, 
        availableThemes,
        isLoading: loading
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
