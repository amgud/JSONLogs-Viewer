import { DropZone } from './DropZone';

interface WelcomeProps {
  onLoad: (text: string, name: string) => void;
}

export function Welcome({ onLoad }: WelcomeProps) {
  return (
    <div className="bg-background flex h-full items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <p className="text-muted-foreground mb-8 text-center text-sm">
          Load a <code>.jsonl</code> log file to get started
        </p>
        <DropZone onLoad={onLoad} />
      </div>
    </div>
  );
}
