import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

interface LinkifiedTextProps {
  text: string;
  className?: string;
  onSave?: (text: string) => void;
  readOnly?: boolean;
}

export function LinkifiedText({ text, className, onSave, readOnly = false }: LinkifiedTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle markdown hotkeys
    if (e.metaKey || e.ctrlKey) {
      const selection = e.currentTarget.value.substring(
        e.currentTarget.selectionStart,
        e.currentTarget.selectionEnd
      );

      switch (e.key) {
        case 'b':
          e.preventDefault();
          wrapText(e.currentTarget, '**', '**', selection);
          break;
        case 'i':
          e.preventDefault();
          wrapText(e.currentTarget, '_', '_', selection);
          break;
        case 'k':
          e.preventDefault();
          if (selection) {
            wrapText(e.currentTarget, '[', '](url)', selection);
          }
          break;
        case 's':
          if (onSave) {
            e.preventDefault();
            handleSave();
          }
          break;
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedText(text);
    }
  }, [text, onSave]);

  const wrapText = (
    input: HTMLTextAreaElement,
    before: string,
    after: string,
    selection: string
  ) => {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const textBefore = input.value.substring(0, start);
    const textAfter = input.value.substring(end);

    const newText = `${textBefore}${before}${selection}${after}${textAfter}`;
    setEditedText(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedText);
    }
    setIsEditing(false);
  };

  if (isEditing && !readOnly) {
    return (
      <div className="space-y-2">
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[200px] font-mono"
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setEditedText(text);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Hotkeys: <kbd>⌘/Ctrl + B</kbd> for bold, <kbd>⌘/Ctrl + I</kbd> for italic, 
          <kbd>⌘/Ctrl + K</kbd> for link, <kbd>⌘/Ctrl + S</kbd> to save, <kbd>Esc</kbd> to cancel
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {!readOnly && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ ...props }) => (
              <a 
                {...props} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              />
            )
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}