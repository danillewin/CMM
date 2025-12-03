import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, AlertCircle, Plus, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TextAnnotation, TextAnnotationErrorType } from "@shared/schema";

interface AnnotatedTextFieldProps {
  meetingId: number | undefined;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const ERROR_TYPE_STYLES: Record<string, { borderColor: string; bgColor: string; textColor: string }> = {
  [TextAnnotationErrorType.SUBSTITUTION]: {
    borderColor: "#eab308",
    bgColor: "rgba(234, 179, 8, 0.1)",
    textColor: "text-yellow-800 dark:text-yellow-200",
  },
  [TextAnnotationErrorType.INSERTION]: {
    borderColor: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.1)",
    textColor: "text-green-800 dark:text-green-200",
  },
  [TextAnnotationErrorType.DELETION]: {
    borderColor: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
    textColor: "text-red-800 dark:text-red-200",
  },
};

const ERROR_TYPE_LABELS: Record<string, { label: string; icon: JSX.Element }> = {
  [TextAnnotationErrorType.SUBSTITUTION]: {
    label: "Подмена",
    icon: <Edit2 className="h-3 w-3" />,
  },
  [TextAnnotationErrorType.INSERTION]: {
    label: "Вставка",
    icon: <Plus className="h-3 w-3" />,
  },
  [TextAnnotationErrorType.DELETION]: {
    label: "Удаление",
    icon: <Minus className="h-3 w-3" />,
  },
};

export function AnnotatedTextField({
  meetingId,
  value,
  onChange,
  label,
  placeholder = "Введите текст...",
  disabled = false,
}: AnnotatedTextFieldProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  const { data: annotationsData, isLoading } = useQuery<TextAnnotation[]>({
    queryKey: ["/api/meetings", meetingId, "annotations"],
    enabled: !!meetingId,
  });
  
  const annotations = Array.isArray(annotationsData) ? annotationsData : [];

  const createAnnotationMutation = useMutation({
    mutationFn: async (data: { errorType: string; startOffset: number; endOffset: number; selectedText: string }) => {
      return apiRequest("POST", `/api/meetings/${meetingId}/annotations`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "annotations"] });
      setSelectedRange(null);
      setPopoverOpen(false);
    },
  });

  const deleteAnnotationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/annotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "annotations"] });
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverOpen) {
        const target = event.target as Node;
        const popoverElement = document.querySelector('[data-testid="annotation-popover"]');
        if (popoverElement && !popoverElement.contains(target)) {
          setPopoverOpen(false);
          setSelectedRange(null);
          window.getSelection()?.removeAllRanges();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  const getTextContent = (element: HTMLElement): string => {
    let text = '';
    element.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'BR') {
          text += '\n';
        } else if (el.tagName === 'DIV' || el.tagName === 'P') {
          if (text.length > 0 && !text.endsWith('\n')) {
            text += '\n';
          }
          text += getTextContent(el);
        } else {
          text += getTextContent(el);
        }
      }
    });
    return text;
  };

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newValue = getTextContent(editorRef.current);
      onChange(newValue);
    }
  }, [onChange]);

  const handleTextSelection = useCallback(() => {
    if (!editorRef.current || disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);
    const container = editorRef.current;

    if (!container.contains(range.commonAncestorContainer)) {
      return;
    }

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;

    const selectedText = selection.toString();
    const end = start + selectedText.length;

    if (end > start && selectedText.trim().length > 0) {
      const rect = range.getBoundingClientRect();
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 10,
      });
      setSelectedRange({ start, end });
      setPopoverOpen(true);
    }
  }, [disabled]);

  const handleAnnotate = (errorType: string) => {
    if (!selectedRange || !meetingId) return;

    const selectedText = value.substring(selectedRange.start, selectedRange.end);
    createAnnotationMutation.mutate({
      errorType,
      startOffset: selectedRange.start,
      endOffset: selectedRange.end,
      selectedText,
    });
  };

  const renderAnnotatedContent = () => {
    if (!value) {
      return null;
    }

    const sortedAnnotations = [...annotations].sort((a, b) => a.startOffset - b.startOffset);
    
    if (sortedAnnotations.length === 0) {
      return value.split('\n').map((line, i) => (
        <div key={i}>{line || <br />}</div>
      ));
    }

    const lines = value.split('\n');
    let currentPos = 0;
    const result: JSX.Element[] = [];

    lines.forEach((line, lineIndex) => {
      const lineStart = currentPos;
      const lineEnd = currentPos + line.length;
      
      const lineAnnotations = sortedAnnotations.filter(
        a => a.startOffset < lineEnd && a.endOffset > lineStart
      );

      if (lineAnnotations.length === 0) {
        result.push(<div key={lineIndex}>{line || <br />}</div>);
      } else {
        const lineParts: JSX.Element[] = [];
        let pos = lineStart;

        lineAnnotations.forEach((annotation, annIndex) => {
          const annStart = Math.max(annotation.startOffset, lineStart);
          const annEnd = Math.min(annotation.endOffset, lineEnd);

          if (pos < annStart) {
            lineParts.push(
              <span key={`text-${lineIndex}-${annIndex}`}>
                {value.substring(pos, annStart)}
              </span>
            );
          }

          const styles = ERROR_TYPE_STYLES[annotation.errorType];
          lineParts.push(
            <span
              key={`ann-${annotation.id}`}
              style={{
                borderLeft: `3px solid ${styles?.borderColor}`,
                backgroundColor: styles?.bgColor,
                paddingLeft: '4px',
                paddingRight: '2px',
              }}
              title={`${ERROR_TYPE_LABELS[annotation.errorType]?.label}`}
              data-testid={`annotation-${annotation.id}`}
            >
              {value.substring(annStart, annEnd)}
            </span>
          );

          pos = annEnd;
        });

        if (pos < lineEnd) {
          lineParts.push(
            <span key={`text-${lineIndex}-end`}>
              {value.substring(pos, lineEnd)}
            </span>
          );
        }

        result.push(<div key={lineIndex}>{lineParts.length > 0 ? lineParts : <br />}</div>);
      }

      currentPos = lineEnd + 1;
    });

    return result;
  };

  const groupedAnnotations = annotations.reduce((acc, annotation) => {
    if (!acc[annotation.errorType]) {
      acc[annotation.errorType] = [];
    }
    acc[annotation.errorType].push(annotation);
    return acc;
  }, {} as Record<string, TextAnnotation[]>);

  if (!meetingId) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium">{label}</label>}
        <div
          contentEditable
          suppressContentEditableWarning
          className="min-h-[200px] p-4 border rounded-lg bg-background whitespace-pre-wrap break-words leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
          onInput={handleInput}
          data-testid="annotated-text-editor-no-meeting"
        >
          {value || <span className="text-muted-foreground">{placeholder}</span>}
        </div>
        <p className="text-sm text-muted-foreground">
          Сохраните встречу, чтобы добавлять аннотации к тексту
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="annotated-text-field">
      {label && <label className="text-sm font-medium">{label}</label>}

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        className={cn(
          "min-h-[200px] p-4 border rounded-lg bg-background whitespace-pre-wrap break-words leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring select-text",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onInput={handleInput}
        onMouseUp={handleTextSelection}
        data-testid="annotated-text-editor"
        data-placeholder={placeholder}
      >
        {isLoading ? (
          <span className="text-muted-foreground">Загрузка...</span>
        ) : value ? (
          renderAnnotatedContent()
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Выделите текст мышью, чтобы отметить ошибку
      </p>

      {popoverOpen && selectedRange && (
        <div
          className="fixed z-50 bg-popover border rounded-lg shadow-lg p-2"
          style={{
            left: `${popoverPosition.x}px`,
            top: `${popoverPosition.y}px`,
            transform: "translateX(-50%)",
          }}
          data-testid="annotation-popover"
        >
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground px-2 py-1">Тип ошибки:</p>
            {Object.entries(ERROR_TYPE_LABELS).map(([type, { label, icon }]) => {
              const styles = ERROR_TYPE_STYLES[type];
              return (
                <Button
                  key={type}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn("justify-start", styles?.textColor)}
                  onClick={() => handleAnnotate(type)}
                  disabled={createAnnotationMutation.isPending}
                  data-testid={`button-annotate-${type}`}
                >
                  {icon}
                  <span className="ml-2">{label}</span>
                </Button>
              );
            })}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start text-muted-foreground"
              onClick={() => {
                setPopoverOpen(false);
                setSelectedRange(null);
              }}
              data-testid="button-cancel-annotation"
            >
              <X className="h-3 w-3" />
              <span className="ml-2">Отмена</span>
            </Button>
          </div>
        </div>
      )}

      {annotations.length > 0 && (
        <div className="space-y-3 mt-4" data-testid="annotations-list">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Отмеченные ошибки ({annotations.length})
          </h4>

          {Object.entries(groupedAnnotations).map(([errorType, items]) => {
            const styles = ERROR_TYPE_STYLES[errorType];
            const typeInfo = ERROR_TYPE_LABELS[errorType];
            return (
              <div key={errorType} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={styles?.textColor}
                    style={{ 
                      borderColor: styles?.borderColor,
                      backgroundColor: styles?.bgColor 
                    }}
                  >
                    {typeInfo?.icon}
                    <span className="ml-1">{typeInfo?.label}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
                <div className="pl-4 space-y-1">
                  {items.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="flex items-center justify-between gap-2 text-sm py-1 px-2 rounded-sm hover:bg-muted"
                      data-testid={`annotation-item-${annotation.id}`}
                    >
                      <span 
                        className="truncate max-w-[300px] font-mono text-xs px-1 rounded"
                        style={{ 
                          borderLeft: `3px solid ${styles?.borderColor}`,
                          backgroundColor: styles?.bgColor,
                          paddingLeft: '4px'
                        }}
                      >
                        "{annotation.selectedText}"
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteAnnotationMutation.mutate(annotation.id)}
                        disabled={deleteAnnotationMutation.isPending}
                        data-testid={`button-delete-annotation-${annotation.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
