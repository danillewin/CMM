import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const ERROR_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  [TextAnnotationErrorType.SUBSTITUTION]: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    border: "border-yellow-400",
    text: "text-yellow-700 dark:text-yellow-300",
  },
  [TextAnnotationErrorType.INSERTION]: {
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-400",
    text: "text-green-700 dark:text-green-300",
  },
  [TextAnnotationErrorType.DELETION]: {
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-400",
    text: "text-red-700 dark:text-red-300",
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
  const textRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

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

  const { data: annotations = [], isLoading } = useQuery<TextAnnotation[]>({
    queryKey: ["/api/meetings", meetingId, "annotations"],
    enabled: !!meetingId,
  });

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
    if (!textRef.current || isEditing) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);
    const container = textRef.current;

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
  }, [isEditing]);

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
    if (!value) return <span className="text-muted-foreground">{placeholder}</span>;

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
            "relative cursor-pointer border-b-2 px-0.5 rounded-sm",
            colors?.bg,
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

  const handleSaveEdit = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(value);
    setIsEditing(false);
  };

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

      <div className="flex gap-2 mb-2">
        {!isEditing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={disabled}
            data-testid="button-edit-text"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Редактировать текст
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSaveEdit}
              data-testid="button-save-text"
            >
              Сохранить
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              data-testid="button-cancel-edit"
            >
              Отмена
            </Button>
          </>
        )}
      </div>

      {isEditing ? (
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[300px] font-mono text-sm"
          data-testid="annotated-text-edit-textarea"
        />
      ) : (
        <>
          <div
            ref={textRef}
            className={cn(
              "min-h-[200px] p-4 border rounded-lg bg-background whitespace-pre-wrap break-words leading-relaxed select-text cursor-text",
              disabled && "opacity-50 cursor-not-allowed select-none"
            )}
            onMouseUp={handleTextSelection}
            data-testid="annotated-text-display"
          >
            {isLoading ? (
              <span className="text-muted-foreground">Загрузка...</span>
            ) : (
              renderAnnotatedText()
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Выделите текст мышью, чтобы отметить ошибку
          </p>
        </>
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
                      <span className="truncate max-w-[300px] font-mono text-xs">
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
