import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bold, List, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SimpleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function SimpleMarkdownEditor({
  value,
  onChange,
  placeholder = "",
  className = "",
  id,
}: SimpleMarkdownEditorProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle bold formatting
  const handleBold = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      // Wrap selected text in bold
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = `${before}**${selectedText}**${after}`;
      onChange(newValue);
      
      // Restore focus and selection
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, end + 2);
      }, 0);
    } else {
      // Insert bold placeholder
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = `${before}**текст**${after}`;
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 8);
      }, 0);
    }
  };

  // Handle bullet list formatting
  const handleBulletList = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      // Convert selected lines to bullet list
      const lines = selectedText.split('\n');
      const bulletLines = lines.map(line => {
        const trimmed = line.trim();
        // If already a bullet point, don't add another
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return line;
        }
        return trimmed ? `- ${trimmed}` : line;
      }).join('\n');
      
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = `${before}${bulletLines}${after}`;
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
      }, 0);
    } else {
      // Insert bullet list item
      const before = value.substring(0, start);
      const after = value.substring(end);
      
      // Check if we're at the start of a line
      const beforeLastNewline = before.lastIndexOf('\n');
      const currentLineStart = beforeLastNewline >= 0 ? beforeLastNewline + 1 : 0;
      const currentLine = before.substring(currentLineStart);
      
      if (currentLine.trim() === '') {
        // At start of empty line, just add bullet
        const newValue = `${before}- ${after}`;
        onChange(newValue);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      } else {
        // In middle of text, add newline and bullet
        const newValue = `${before}\n- ${after}`;
        onChange(newValue);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 3, start + 3);
        }, 0);
      }
    }
  };

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && !isFullScreen) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, isFullScreen]);

  const containerClasses = isFullScreen
    ? "fixed inset-0 z-50 bg-white p-8 overflow-auto"
    : className;

  return (
    <div className={containerClasses} id={id}>
      {/* Toolbar - only show when editing */}
      {isEditing && (
        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBold}
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
            data-testid="button-bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBulletList}
            className="h-8 w-8 p-0"
            title="Bullet List"
            data-testid="button-bullet-list"
          >
            <List className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleFullScreen}
            className="h-8 w-8 p-0"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            data-testid="button-toggle-fullscreen"
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Editor/Preview Area */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            if (value) {
              setIsEditing(false);
            }
          }}
          placeholder=""
          className={`w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
            isFullScreen ? "min-h-[calc(100vh-200px)]" : "min-h-[150px]"
          }`}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'b') {
              e.preventDefault();
              handleBold();
            }
          }}
          autoFocus
          data-testid="textarea-markdown-input"
        />
      ) : (
        <div
          className={`w-full p-3 border rounded-md prose prose-sm max-w-none cursor-text hover:bg-gray-50 transition-colors ${
            isFullScreen ? "min-h-[calc(100vh-200px)]" : "min-h-[150px]"
          } ${!value ? "text-gray-400" : ""}`}
          onClick={() => setIsEditing(true)}
          data-testid="div-markdown-preview"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom rendering for lists to ensure proper formatting
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside space-y-1" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className={!value ? "text-gray-400" : "text-gray-900"} {...props} />
              ),
              // Bold text
              strong: ({ node, ...props }) => (
                <strong className={!value ? "text-gray-400 font-bold" : "text-gray-900 font-bold"} {...props} />
              ),
              // Paragraph
              p: ({ node, ...props }) => (
                <p className={!value ? "text-gray-400 mb-2" : "text-gray-900 mb-2"} {...props} />
              ),
            }}
          >
            {value || placeholder}
          </ReactMarkdown>
        </div>
      )}

      {isFullScreen && (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={toggleFullScreen}
            data-testid="button-close-fullscreen"
          >
            Закрыть
          </Button>
        </div>
      )}
    </div>
  );
}
