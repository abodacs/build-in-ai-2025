/**
 * Theme Toggle Component - Instant Wow Factor
 * Beautiful light/dark/system theme switching with pure CSS transitions
 */

import { useEffect, useState, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'icon' | 'button' | 'dropdown';
}

export function ThemeToggle({
  className = '',
  showLabel = false,
  variant = 'dropdown'
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering (prevent hydration mismatch)
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }

    // Add smooth transition animation
    root.classList.add('animate-themeSwitch');
    setTimeout(() => {
      root.classList.remove('animate-themeSwitch');
    }, 200);
  };

  const handleThemeChange = (newTheme: Theme) => {
    startTransition(() => {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    });
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-md animate-pulse bg-muted ${className}`} />
    );
  }

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
    const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

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
              ${theme === themeOption
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
            <span className="font-medium">
              {getThemeLabel(themeOption)}
            </span>
            {theme === themeOption && (
              <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook for using theme in other components
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'system';
    setTheme(savedTheme);

    const updateResolvedTheme = () => {
      if (savedTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(savedTheme as 'light' | 'dark');
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, []);

  return { theme, resolvedTheme };
}