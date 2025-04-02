import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Check, Moon, PaintBucket, Sun } from 'lucide-react';
import { Skeleton } from './skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface ThemeToggleProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'outline',
  size = 'icon',
  className = '',
}) => {
  const { theme, setTheme, toggleTheme, availableThemes, isLoading } = useTheme();

  if (isLoading) {
    return <Skeleton className="h-9 w-9" />;
  }

  // If only light and dark themes are available, use the simple toggle
  if (availableThemes.length <= 2) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={toggleTheme}
        className={`duration-300 ${className}`}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Sun className="h-4 w-4 transition-all" />
        ) : (
          <Moon className="h-4 w-4 transition-all" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  // If there are more themes, use the dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`duration-300 ${className}`}
        >
          {theme === "light" ? (
            <Sun className="h-4 w-4" />
          ) : theme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <PaintBucket className="h-4 w-4" />
          )}
          <span className="sr-only">Select theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableThemes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{themeOption.name}</span>
            {theme === themeOption.id && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
