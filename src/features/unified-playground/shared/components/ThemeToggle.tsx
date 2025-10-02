/**
 * Theme Toggle Component - Instant Wow Factor
 * Beautiful light/dark/system theme switching with pure CSS transitions
 * Now uses centralized ThemeProvider for consistency across all APIs
 */
/* eslint-disable react-refresh/only-export-components */

import { startTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useTheme, type Theme } from '@/providers/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'icon' | 'button' | 'dropdown';
}

export function ThemeToggle({
  className = '',
  showLabel = false,
  variant = 'dropdown',
}: ThemeToggleProps) {
  // Use centralized theme context
  const { theme, setTheme: updateTheme } = useTheme();

  const handleThemeChange = (newTheme: Theme) => {
    startTransition(() => {
      updateTheme(newTheme);
    });
  };


  const getThemeIcon = (themeType: Theme) => {
    switch (themeType) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Palette className="w-4 h-4" />;
    }
  };

  const getThemeLabel = (themeType: Theme) => {
    switch (themeType) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Theme';
    }
  };

  // Simple icon button variant
  if (variant === 'icon') {
    const nextTheme: Theme =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleThemeChange(nextTheme)}
        className={`
          transition-all duration-200 ease-out
          hover:scale-105 hover:bg-muted/80
          focus-ring rounded-md p-2
          ${className}
        `}
        aria-label={`Switch to ${getThemeLabel(nextTheme)} theme`}
      >
        <div className="transition-transform duration-200 ease-out hover:rotate-12">
          {getThemeIcon(theme)}
        </div>
        {showLabel && (
          <span className="ml-2 text-sm font-medium">
            {getThemeLabel(theme)}
          </span>
        )}
      </Button>
    );
  }

  // Full button variant
  if (variant === 'button') {
    return (
      <div className={`flex gap-1 p-1 bg-muted/50 rounded-lg ${className}`}>
        {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
          <Button
            key={themeOption}
            variant={theme === themeOption ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleThemeChange(themeOption)}
            className={`
              transition-all duration-200 ease-out
              hover:scale-105 focus-ring rounded-md
              ${
                theme === themeOption
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-muted/80'
              }
            `}
            aria-label={`Switch to ${getThemeLabel(themeOption)} theme`}
          >
            <div className="transition-transform duration-200 ease-out hover:rotate-12">
              {getThemeIcon(themeOption)}
            </div>
            {showLabel && (
              <span className="ml-2 text-sm font-medium">
                {getThemeLabel(themeOption)}
              </span>
            )}
          </Button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`
            transition-all duration-200 ease-out
            hover:scale-105 hover:bg-muted/80
            focus-ring rounded-md p-2
            ${className}
          `}
          aria-label="Toggle theme"
        >
          <div className="transition-transform duration-200 ease-out hover:rotate-12">
            {getThemeIcon(theme)}
          </div>
          {showLabel && (
            <span className="ml-2 text-sm font-medium">
              {getThemeLabel(theme)}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="animate-fadeInDown border-border/50 bg-background/95 backdrop-blur-sm"
      >
        {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
          <DropdownMenuItem
            key={themeOption}
            onClick={() => handleThemeChange(themeOption)}
            className={`
              transition-all duration-150 ease-out
              hover:bg-muted/80 focus:bg-muted/80
              cursor-pointer flex items-center gap-2
              ${theme === themeOption ? 'bg-muted/50' : ''}
            `}
          >
            <div className="transition-transform duration-200 ease-out group-hover:rotate-12">
              {getThemeIcon(themeOption)}
            </div>
            <span className="font-medium">{getThemeLabel(themeOption)}</span>
            {theme === themeOption && (
              <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Re-export useTheme from ThemeProvider for backwards compatibility
export { useTheme } from '@/providers/ThemeProvider';
