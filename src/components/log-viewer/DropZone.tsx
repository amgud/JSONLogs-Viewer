import { Clipboard, FileText, Upload } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DropZone({ onLoad }: { onLoad: (text: string, name: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onLoad(e.target?.result as string, file.name);
    reader.readAsText(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onLoad],
  );

  const handlePaste = async () => {
    setPasteError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setPasteError('Clipboard is empty');
        return;
      }
      onLoad(text, 'clipboard');
    } catch {
      setPasteError('Clipboard access denied — try Cmd+V in the page');
    }
  };

  // Also handle global Cmd+V / Ctrl+V on the drop-zone page
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // ignore if a text input is focused
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return;
      const text = e.clipboardData?.getData('text') ?? '';
      if (text.trim()) onLoad(text, 'clipboard');
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [onLoad]);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="rounded-full border border-border bg-muted p-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">
          Drop a <code>.jsonl</code> file here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">or choose an option below</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Choose file
        </Button>
        <Button variant="outline" size="sm" onClick={handlePaste}>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste logs
        </Button>
      </div>
      {pasteError && <p className="text-xs text-destructive">{pasteError}</p>}
      <p className="text-xs text-muted-foreground/60">
        or press{' '}
        <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">⌘V</kbd>{' '}
        anywhere on the page
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".jsonl,.txt,.log,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) readFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
