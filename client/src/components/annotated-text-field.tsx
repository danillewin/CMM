import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, AlertCircle, Plus, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TextAnnotation, TextAnnotationErrorType } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

interface AnnotatedTextFieldProps {
  meetingId: number | undefined;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const ERROR_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; highlight: string }> = {
  [TextAnnotationErrorType.SUBSTITUTION]: {
    bg: "bg-yellow-200 dark:bg-yellow-800",
    border: "border-yellow-500",
    text: "text-yellow-800 dark:text-yellow-200",
    highlight: "bg-yellow-300 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 font-medium",
  },
  [TextAnnotationErrorType.INSERTION]: {
    bg: "bg-green-200 dark:bg-green-800",
    border: "border-green-500",
    text: "text-green-800 dark:text-green-200",
    highlight: "bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100 font-medium",
  },
  [TextAnnotationErrorType.DELETION]: {
    bg: "bg-red-200 dark:bg-red-800",
    border: "border-red-500",
    text: "text-red-800 dark:text-red-200",
    highlight: "bg-red-300 dark:bg-red-700 text-red-900 dark:text-red-100 font-medium line-through",
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
  const previewRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

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

  const handleTextSelection = useCallback(() => {
    if (!previewRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);
    const container = previewRef.current;

    if (!container.contains(range.commonAncestorContainer)) {
      return;
    }

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;

    const selectedText = selection.toString();
    const end = start + selectedText.length;

    if (end > start) {
      const rect = range.getBoundingClientRect();
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 10,
      });
      setSelectedRange({ start, end });
      setPopoverOpen(true);
    }
  }, []);

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

  const renderAnnotatedText = () => {
    if (!value) return <span className="text-muted-foreground italic">{placeholder}</span>;

    const sortedAnnotations = [...annotations].sort((a, b) => a.startOffset - b.startOffset);

    if (sortedAnnotations.length === 0) {
      return <span>{value}</span>;
    }

    const parts: JSX.Element[] = [];
    let lastEnd = 0;

    sortedAnnotations.forEach((annotation, index) => {
      if (annotation.startOffset > lastEnd) {
        parts.push(
          <span key={`text-${index}`}>{value.substring(lastEnd, annotation.startOffset)}</span>
        );
      }

      const colors = ERROR_TYPE_COLORS[annotation.errorType];
      parts.push(
        <span
          key={`annotation-${annotation.id}`}
          className={cn(
            "relative px-1 py-0.5 rounded border-b-2",
            colors?.highlight,
            colors?.border
          )}
          title={`${ERROR_TYPE_LABELS[annotation.errorType]?.label}: "${annotation.selectedText}"`}
          data-testid={`annotation-${annotation.id}`}
        >
          {value.substring(annotation.startOffset, annotation.endOffset)}
        </span>
      );

      lastEnd = annotation.endOffset;
    });

    if (lastEnd < value.length) {
      parts.push(<span key="text-end">{value.substring(lastEnd)}</span>);
    }

    return <>{parts}</>;
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
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[200px]"
          data-testid="annotated-text-textarea-no-meeting"
        />
        <p className="text-sm text-muted-foreground">
          Сохраните встречу, чтобы добавлять аннотации к тексту
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="annotated-text-field">
      {label && <label className="text-sm font-medium">{label}</label>}

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[200px] font-mono text-sm"
        data-testid="annotated-text-textarea"
      />

      {value && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Предпросмотр с аннотациями (выделите текст мышью для добавления ошибки):
          </p>
          <div
            ref={previewRef}
            className={cn(
              "min-h-[100px] p-4 border rounded-lg bg-muted/30 whitespace-pre-wrap break-words leading-relaxed select-text cursor-text",
              disabled && "opacity-50 cursor-not-allowed select-none"
            )}
            onMouseUp={handleTextSelection}
            data-testid="annotated-text-preview"
          >
            {isLoading ? (
              <span className="text-muted-foreground">Загрузка...</span>
            ) : (
              renderAnnotatedText()
            )}
          </div>
        </div>
      )}

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
              const colors = ERROR_TYPE_COLORS[type];
              return (
                <Button
                  key={type}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn("justify-start", colors?.text)}
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
            const colors = ERROR_TYPE_COLORS[errorType];
            const typeInfo = ERROR_TYPE_LABELS[errorType];
            return (
              <div key={errorType} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(colors?.bg, colors?.text, colors?.border)}>
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
                      <span className={cn("truncate max-w-[300px] font-mono text-xs px-1 rounded", colors?.highlight)}>
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
