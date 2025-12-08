import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  X,
  Loader2,
  Download,
  Trash2,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ResearchAttachment } from "@shared/schema";

interface ResearchArtifactUploadProps {
  researchId: number | null;
  onUploadComplete?: () => void;
  onDeleteComplete?: () => void;
}

interface SelectedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

export default function ResearchArtifactUpload({
  researchId,
  onUploadComplete,
  onDeleteComplete,
}: ResearchArtifactUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: attachments = [], isLoading } = useQuery<ResearchAttachment[]>({
    queryKey: ["/api/researches", researchId, "attachments"],
    queryFn: async () => {
      if (!researchId) return [];
      const response = await fetch(`/api/researches/${researchId}/attachments`);
      if (!response.ok) throw new Error("Failed to fetch attachments");
      return response.json();
    },
    enabled: !!researchId,
  });

  const acceptedTypes = [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  const isValidFileType = (file: File): boolean => {
    return (
      acceptedTypes.includes(file.type) ||
      /\.(pdf|txt|doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.name)
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Байт";
    const k = 1024;
    const sizes = ["Байт", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (ext === 'xls' || ext === 'xlsx') {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    } else if (ext === 'doc' || ext === 'docx') {
      return <FileText className="h-5 w-5 text-blue-600" />;
    } else if (ext === 'txt') {
      return <FileText className="h-5 w-5 text-gray-600" />;
    } else if (ext === 'ppt' || ext === 'pptx') {
      return <FileText className="h-5 w-5 text-orange-500" />;
    }
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: SelectedFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (!isValidFileType(file)) {
        errors.push(`${file.name}: неверный тип файла`);
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        errors.push(`${file.name}: слишком большой (макс. 50 МБ)`);
        return;
      }

      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      });
    });

    if (errors.length > 0) {
      setError(errors.join("; "));
    } else {
      setError(null);
    }

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      e.target.value = "";
    },
    [handleFiles]
  );

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const clearAllSelected = () => {
    setSelectedFiles([]);
    setError(null);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0 || !researchId) {
      setError("Необходимо выбрать файлы и сохранить исследование.");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    const totalFiles = selectedFiles.length;
    let uploadedCount = 0;

    try {
      for (const selectedFile of selectedFiles) {
        const formData = new FormData();
        formData.append("file", selectedFile.file);

        const response = await apiRequest(
          "POST",
          `/api/researches/${researchId}/attachments`,
          formData
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Ошибка загрузки ${selectedFile.name}`);
        }

        uploadedCount++;
        setProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      toast({
        title: "Файлы загружены",
        description: `Загружено ${uploadedCount} файл(ов).`,
      });

      setSelectedFiles([]);
      
      queryClient.invalidateQueries({ queryKey: ["/api/researches", researchId, "attachments"] });

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(
        error instanceof Error ? error.message : "Произошла неизвестная ошибка"
      );
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Произошла неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const downloadFile = async (attachmentId: number) => {
    try {
      window.open(`/api/research-attachments/${attachmentId}/download`, '_blank');
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Ошибка скачивания",
        description: "Не удалось скачать файл",
        variant: "destructive",
      });
    }
  };

  const deleteFile = async (attachmentId: number) => {
    setDeletingId(attachmentId);
    setError(null);

    try {
      const response = await apiRequest(
        "DELETE",
        `/api/research-attachments/${attachmentId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка удаления файла");
      }

      toast({
        title: "Файл удален",
        description: "Файл успешно удален.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/researches", researchId, "attachments"] });

      if (onDeleteComplete) {
        onDeleteComplete();
      }
    } catch (error) {
      console.error("Delete error:", error);
      setError(
        error instanceof Error ? error.message : "Произошла неизвестная ошибка"
      );
      toast({
        title: "Ошибка удаления",
        description: error instanceof Error ? error.message : "Произошла неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(attachment.originalName)}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" data-testid={`text-attachment-filename-${attachment.id}`}>
                      {attachment.originalName}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(attachment.id)}
                    data-testid={`button-download-attachment-${attachment.id}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Скачать
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteFile(attachment.id)}
                    disabled={deletingId === attachment.id}
                    data-testid={`button-delete-attachment-${attachment.id}`}
                  >
                    {deletingId === attachment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Удалить
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!researchId && (
        <div className="text-sm text-amber-600 dark:text-amber-400 mb-2">
          Сохраните исследование перед загрузкой файлов
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        } ${isUploading || !researchId ? "pointer-events-none opacity-50" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={handleFileInput}
          className="hidden"
          id="attachment-upload"
          disabled={isUploading}
          multiple
        />

        <div className="flex flex-col items-center gap-3">
          <Upload className="h-10 w-10 text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              {dragActive
                ? "Перетащите файлы сюда"
                : "Перетащите файлы или нажмите для выбора"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, TXT, DOC, DOCX, XLS, XLSX (макс. 50 МБ на файл)
            </p>
          </div>
          <label
            htmlFor="attachment-upload"
            className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Выбрать файлы
          </label>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Выбранные файлы ({selectedFiles.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllSelected}
              disabled={isUploading}
            >
              Очистить все
            </Button>
          </div>
          {selectedFiles.map((file, index) => (
            <div key={index} className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSelectedFile(index)}
                  disabled={isUploading}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Загрузка файлов...</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {selectedFiles.length > 0 && !isUploading && (
        <Button
          onClick={uploadFiles}
          disabled={!researchId}
          className="w-full"
          data-testid="button-upload-attachments"
        >
          <Upload className="h-4 w-4 mr-2" />
          Загрузить {selectedFiles.length} файл(ов)
        </Button>
      )}
    </div>
  );
}
