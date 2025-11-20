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
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = `${before}**${selectedText}**${after}`;
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, end + 2);
      }, 0);
    } else {
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
      const lines = selectedText.split('\n');
      const bulletLines = lines.map(line => {
        const trimmed = line.trim();
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
      const before = value.substring(0, start);
      const after = value.substring(end);
      
      const beforeLastNewline = before.lastIndexOf('\n');
      const currentLineStart = beforeLastNewline >= 0 ? beforeLastNewline + 1 : 0;
      const currentLine = before.substring(currentLineStart);
      
      if (currentLine.trim() === '') {
        const newValue = `${before}- ${after}`;
        onChange(newValue);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      } else {
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
      {/* Toolbar - Always visible */}
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

      {/* Editor/Preview Area - Always similar appearance */}
      <div className="relative">
        {isEditing ? (
          <>
            {/* Rendered placeholder shown underneath textarea when empty */}
            {!value && placeholder && (
              <div 
                className="absolute inset-0 p-3 prose prose-sm max-w-none text-gray-400 pointer-events-none"
                data-testid="div-markdown-placeholder"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside space-y-1" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="text-gray-400" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="text-gray-400 font-bold" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-gray-400 mb-2" {...props} />
                    ),
                  }}
                >
                  {placeholder}
                </ReactMarkdown>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => {
                if (value) {
                  setIsEditing(false);
                }
              }}
              className={`w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed bg-transparent relative z-10 ${
                isFullScreen ? "min-h-[calc(100vh-200px)]" : "min-h-[150px]"
              }`}
              style={{ fontFamily: 'inherit' }}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'b') {
                  e.preventDefault();
                  handleBold();
                }
              }}
              autoFocus
              data-testid="textarea-markdown-input"
            />
          </>
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
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside space-y-1" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className={!value ? "text-gray-400" : "text-gray-900"} {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className={!value ? "text-gray-400 font-bold" : "text-gray-900 font-bold"} {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className={!value ? "text-gray-400 mb-2" : "text-gray-900 mb-2"} {...props} />
                ),
              }}
            >
              {value || placeholder}
            </ReactMarkdown>
          </div>
        )}
      </div>

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
