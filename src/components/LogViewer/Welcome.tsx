import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropZone } from './DropZone';

interface WelcomeProps {
  theme: string;
  toggleTheme: () => void;
  onLoad: (text: string, name: string) => void;
}

export function Welcome({ onLoad, toggleTheme, theme }: WelcomeProps) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight">Logs Viewer</h1>
        <p className="text-muted-foreground mb-8 text-center text-sm">
          Load a <code>.jsonl</code> log file to get started
        </p>
        <DropZone onLoad={onLoad} />
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
        </div>
      </div>
    </div>
  );
}
