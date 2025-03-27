import { useTheme } from "@/context/ThemeContext";
import { Button } from "./button";
import { Check, Moon, PaintBucket, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Skeleton } from "./skeleton";

export function ThemeSelector() {
  const { theme, setTheme, availableThemes, isLoading } = useTheme();

  if (isLoading) {
    return <Skeleton className="h-9 w-9" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {theme === "light" ? (
            <Sun className="h-5 w-5" />
          ) : theme === "dark" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <PaintBucket className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
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
} 