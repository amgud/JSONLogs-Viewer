import { LogViewer } from '@/components/LogViewer';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      {!import.meta.env.DEV && <link rel="manifest" href="/manifest.webmanifest" />}
      <LogViewer />
    </TooltipProvider>
  );
}
