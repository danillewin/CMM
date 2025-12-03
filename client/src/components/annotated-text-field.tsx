import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, AlertCircle, Plus, Minus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TextAnnotation, TextAnnotationErrorType } from "@shared/schema";

interface AnnotatedTextFieldProps {
  meetingId: number | undefined;
  attachmentId?: number;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const REQUIRES_CORRECTION_INPUT = [
  TextAnnotationErrorType.SUBSTITUTION,
  TextAnnotationErrorType.DELETION,
];

const ERROR_TYPE_STYLES: Record<string, { borderColor: string; bgColor: string; textColor: string }> = {
  [TextAnnotationErrorType.SUBSTITUTION]: {
    borderColor: "#eab308",
    bgColor: "rgba(253, 224, 71, 0.5)",
    textColor: "text-yellow-800 dark:text-yellow-200",
  },
  [TextAnnotationErrorType.INSERTION]: {
    borderColor: "#22c55e",
    bgColor: "rgba(134, 239, 172, 0.5)",
    textColor: "text-green-800 dark:text-green-200",
  },
  [TextAnnotationErrorType.DELETION]: {
    borderColor: "#ef4444",
    bgColor: "rgba(252, 165, 165, 0.5)",
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
    label: "Пропущенное слово",
    icon: <Minus className="h-3 w-3" />,
  },
};

export function AnnotatedTextField({
  meetingId,
  attachmentId,
  value,
  onChange,
  label,
  placeholder = "Введите текст...",
  disabled = false,
}: AnnotatedTextFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const correctionInputRef = useRef<HTMLInputElement>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [pendingErrorType, setPendingErrorType] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState("");

  // Determine API endpoints based on whether this is for an attachment or meeting fullText
  const annotationsEndpoint = attachmentId 
    ? `/api/attachments/${attachmentId}/annotations`
    : `/api/meetings/${meetingId}/annotations`;
  
  const queryKeyBase = attachmentId 
    ? ['/api/attachments', attachmentId, 'annotations'] 
    : ['/api/meetings', meetingId, 'annotations'];

  const { data: annotationsData, isLoading } = useQuery<TextAnnotation[]>({
    queryKey: queryKeyBase,
    queryFn: async () => {
      const res = await fetch(annotationsEndpoint);
      if (!res.ok) throw new Error('Failed to fetch annotations');
      return res.json();
    },
    enabled: attachmentId ? !!attachmentId : !!meetingId,
  });
  
  const annotations = Array.isArray(annotationsData) ? annotationsData : [];

  const createAnnotationMutation = useMutation({
    mutationFn: async (data: { errorType: string; startOffset: number; endOffset: number; selectedText: string; correctionText?: string }) => {
      return apiRequest("POST", annotationsEndpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyBase });
      setSelectedRange(null);
      setPopoverOpen(false);
      setPendingErrorType(null);
      setCorrectionText("");
    },
  });

  const deleteAnnotationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/annotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyBase });
    },
  });

  useEffect(() => {
    // Skip cleanup if neither meetingId nor attachmentId is set
    if ((!meetingId && !attachmentId) || annotations.length === 0) return;

    const invalidAnnotations = annotations.filter((annotation) => {
      if (annotation.endOffset > value.length) {
        return true;
      }
      const currentText = value.substring(annotation.startOffset, annotation.endOffset);
      if (currentText !== annotation.selectedText) {
        return true;
      }
      return false;
    });

    invalidAnnotations.forEach((annotation) => {
      deleteAnnotationMutation.mutate(annotation.id);
    });
  }, [value, annotations, meetingId, attachmentId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverOpen) {
        const target = event.target as Node;
        const popoverElement = document.querySelector('[data-testid="annotation-popover"]');
        if (popoverElement && !popoverElement.contains(target)) {
          setPopoverOpen(false);
          setSelectedRange(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current || disabled) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (end > start) {
      const rect = textarea.getBoundingClientRect();
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setSelectedRange({ start, end });
      setPopoverOpen(true);
    }
  }, [disabled]);

  const handleAnnotate = (errorType: string) => {
    if (!selectedRange || (!meetingId && !attachmentId)) return;

    if (REQUIRES_CORRECTION_INPUT.includes(errorType as typeof TextAnnotationErrorType.SUBSTITUTION | typeof TextAnnotationErrorType.DELETION)) {
      setPendingErrorType(errorType);
      setCorrectionText("");
      setTimeout(() => correctionInputRef.current?.focus(), 100);
    } else {
      const selectedText = value.substring(selectedRange.start, selectedRange.end);
      createAnnotationMutation.mutate({
        errorType,
        startOffset: selectedRange.start,
        endOffset: selectedRange.end,
        selectedText,
      });
    }
  };

  const handleSubmitCorrection = () => {
    if (!selectedRange || !pendingErrorType || (!meetingId && !attachmentId)) return;

    const selectedText = value.substring(selectedRange.start, selectedRange.end);
    createAnnotationMutation.mutate({
      errorType: pendingErrorType,
      startOffset: selectedRange.start,
      endOffset: selectedRange.end,
      selectedText,
      correctionText: correctionText.trim() || undefined,
    });
  };

  const handleCancelCorrection = () => {
    setPendingErrorType(null);
    setCorrectionText("");
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const renderAnnotatedHTML = () => {
    if (!value) {
      return `<span style="color: #9ca3af;">${escapeHtml(placeholder)}</span>`;
    }

    const sortedAnnotations = [...annotations].sort((a, b) => a.startOffset - b.startOffset);
    
    if (sortedAnnotations.length === 0) {
      return escapeHtml(value).replace(/\n/g, '<br>') + '<br>';
    }

    let result = '';
    let lastEnd = 0;

    sortedAnnotations.forEach((annotation) => {
      if (annotation.startOffset > lastEnd) {
        result += escapeHtml(value.substring(lastEnd, annotation.startOffset));
      }

      const styles = ERROR_TYPE_STYLES[annotation.errorType];
      const annotatedText = escapeHtml(value.substring(annotation.startOffset, annotation.endOffset));
      result += `<mark style="border-left: 3px solid ${styles?.borderColor}; background-color: ${styles?.bgColor}; padding-left: 4px; padding-right: 2px; border-radius: 2px;">${annotatedText}</mark>`;

      lastEnd = annotation.endOffset;
    });

    if (lastEnd < value.length) {
      result += escapeHtml(value.substring(lastEnd));
    }

    return result.replace(/\n/g, '<br>') + '<br>';
  };

  const groupedAnnotations = annotations.reduce((acc, annotation) => {
    if (!acc[annotation.errorType]) {
      acc[annotation.errorType] = [];
    }
    acc[annotation.errorType].push(annotation);
    return acc;
  }, {} as Record<string, TextAnnotation[]>);

  // Show fallback without annotations if neither meetingId nor attachmentId is set
  if (!meetingId && !attachmentId) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium">{label}</label>}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full min-h-[200px] p-4 border rounded-lg bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm leading-relaxed"
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

      <div className="relative border rounded-lg bg-white dark:bg-gray-950 overflow-hidden">
        <div
          ref={backdropRef}
          className="absolute top-0 left-0 right-0 p-4 pointer-events-none whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-gray-900 dark:text-gray-100"
          style={{
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: renderAnnotatedHTML() }}
          aria-hidden="true"
        />
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          placeholder=""
          disabled={disabled}
          className={cn(
            "relative w-full min-h-[200px] p-4 resize-y focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm leading-relaxed",
            "bg-transparent border-0",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{
            color: 'transparent',
            caretColor: 'black',
          }}
          data-testid="annotated-text-textarea"
        />
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
            transform: "translate(-50%, -100%)",
          }}
          data-testid="annotation-popover"
        >
          {pendingErrorType ? (
            <div className="flex flex-col gap-2 min-w-[250px]">
              <div className="flex items-center gap-2 px-2 py-1">
                {ERROR_TYPE_LABELS[pendingErrorType]?.icon}
                <span className={cn("text-sm font-medium", ERROR_TYPE_STYLES[pendingErrorType]?.textColor)}>
                  {ERROR_TYPE_LABELS[pendingErrorType]?.label}
                </span>
              </div>
              <div className="px-2">
                <p className="text-xs text-muted-foreground mb-1">
                  {pendingErrorType === TextAnnotationErrorType.SUBSTITUTION 
                    ? "Введите правильное слово:" 
                    : "Введите пропущенное слово:"}
                </p>
                <Input
                  ref={correctionInputRef}
                  type="text"
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmitCorrection();
                    } else if (e.key === "Escape") {
                      handleCancelCorrection();
                    }
                  }}
                  placeholder="Введите слово..."
                  className="h-8 text-sm"
                  data-testid="input-correction-text"
                />
              </div>
              <div className="flex gap-1 px-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 h-7"
                  onClick={handleSubmitCorrection}
                  disabled={createAnnotationMutation.isPending}
                  data-testid="button-submit-correction"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Сохранить
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={handleCancelCorrection}
                  data-testid="button-cancel-correction"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
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
          )}
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
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span 
                          className="truncate font-mono text-xs px-1 rounded"
                          style={{ 
                            borderLeft: `3px solid ${styles?.borderColor}`,
                            backgroundColor: styles?.bgColor,
                            paddingLeft: '4px'
                          }}
                        >
                          "{annotation.selectedText}"
                        </span>
                        {annotation.correctionText && (
                          <>
                            <span className="text-xs text-muted-foreground">→</span>
                            <span className="font-mono text-xs px-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 truncate">
                              "{annotation.correctionText}"
                            </span>
                          </>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive flex-shrink-0"
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
