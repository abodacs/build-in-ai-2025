/**
 * Code Theme Toggle Component
 *
 * Toggle button specifically for code block theming
 * Works independently from the main app theme
 */

import { Sun, Moon, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCodeTheme, type CodeTheme } from '@/providers/CodeThemeProvider';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface CodeThemeToggleProps {
  /** Button size */
  size?: 'sm' | 'icon';

  /** Additional CSS classes */
  className?: string;

  /** Show label text */
  showLabel?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Code theme toggle button
 *
 * Cycles through: auto → light → dark → auto
 *
 * @example
 * ```tsx
 * <CodeThemeToggle size="sm" />
 * ```
 */
export function CodeThemeToggle({
  size = 'sm',
  className,
  showLabel = false,
}: CodeThemeToggleProps) {
  const { codeTheme, resolvedCodeTheme, cycleCodeTheme } = useCodeTheme();

  // Get icon based on current theme
  const getThemeIcon = (theme: CodeTheme) => {
    const iconClass = 'w-4 h-4';

    switch (theme) {
      case 'light':
        return <Sun className={iconClass} />;
      case 'dark':
        return <Moon className={iconClass} />;
      case 'auto':
        return <MonitorSmartphone className={iconClass} />;
    }
  };

  // Get label text
  const getThemeLabel = (theme: CodeTheme) => {
    switch (theme) {
      case 'light':
        return 'Light Code';
      case 'dark':
        return 'Dark Code';
      case 'auto':
        return 'Auto Code';
    }
  };

  // Get tooltip text
  const getTooltipText = () => {
    const current = getThemeLabel(codeTheme);
    const next =
      codeTheme === 'auto' ? 'Light Code'
      : codeTheme === 'light' ? 'Dark Code'
      : 'Auto Code';

    return `${current} (click for ${next})`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            onClick={cycleCodeTheme}
            className={cn(
              'h-7 px-2 transition-all duration-200 ease-out',
              'relative group shrink-0',
              className
            )}
            aria-label={getTooltipText()}
          >
            <div className="transition-transform duration-200 ease-out group-hover:rotate-12">
              {getThemeIcon(codeTheme)}
            </div>

            {showLabel && (
              <span className="ml-2 text-xs font-medium">
                {getThemeLabel(codeTheme)}
              </span>
            )}

            {/* Indicator dot for resolved theme */}
            <span
              className={cn(
                'absolute -bottom-0.5 left-1/2 -translate-x-1/2',
                'w-1 h-1 rounded-full transition-colors',
                resolvedCodeTheme === 'dark'
                  ? 'bg-slate-700'
                  : 'bg-yellow-500'
              )}
              aria-hidden="true"
            />
          </Button>
        </TooltipTrigger>

        <TooltipContent side="bottom" className="text-xs">
          <p>{getTooltipText()}</p>
          <p className="text-muted-foreground mt-1">
            Currently: {resolvedCodeTheme === 'dark' ? 'Dark' : 'Light'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CodeThemeToggle;
