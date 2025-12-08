import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface ResearchArtifactUploadProps {
  researchId: number | null;
  currentFileName?: string | null;
  currentFileSize?: number | null;
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
  currentFileName,
  currentFileSize,
  onUploadComplete,
  onDeleteComplete,
}: ResearchArtifactUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const acceptedTypes = [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const isValidFileType = (file: File): boolean => {
    return (
      acceptedTypes.includes(file.type) ||
      /\.(pdf|txt|doc|docx|xls|xlsx)$/i.test(file.name)
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
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (ext === 'xls' || ext === 'xlsx') {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    } else if (ext === 'doc' || ext === 'docx') {
      return <FileText className="h-6 w-6 text-blue-600" />;
    } else if (ext === 'txt') {
      return <FileText className="h-6 w-6 text-gray-600" />;
    }
    return <FileIcon className="h-6 w-6 text-gray-500" />;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!isValidFileType(file)) {
      setError("Неверный тип файла. Поддерживаются только PDF, TXT, DOC, DOCX, XLS, XLSX.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("Файл слишком большой. Максимальный размер 50 МБ.");
      return;
    }

    setError(null);
    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    });
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

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const clearSelection = () => {
    setSelectedFile(null);
    setError(null);
  };

  const uploadFile = async () => {
    if (!selectedFile || !researchId) {
      setError("Необходимо выбрать файл и сохранить исследование.");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile.file);

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiRequest(
        "POST",
        `/api/researches/${researchId}/artifact`,
        formData
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка загрузки файла");
      }

      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: "Файл загружен успешно",
        description: `${selectedFile.name} загружен.`,
      });

      setSelectedFile(null);
      
      queryClient.invalidateQueries({ queryKey: ["/api/researches", researchId] });

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

  const downloadFile = async () => {
    if (!researchId || !currentFileName) return;

    try {
      window.open(`/api/researches/${researchId}/artifact/download`, '_blank');
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Ошибка скачивания",
        description: "Не удалось скачать файл",
        variant: "destructive",
      });
    }
  };

  const deleteFile = async () => {
    if (!researchId) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await apiRequest(
        "DELETE",
        `/api/researches/${researchId}/artifact`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка удаления файла");
      }

      toast({
        title: "Файл удален",
        description: "Артефакт успешно удален.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/researches", researchId] });

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
      setIsDeleting(false);
    }
  };

  const hasExistingFile = currentFileName && currentFileName.length > 0;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasExistingFile && (
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(currentFileName)}
              <div>
                <p className="font-medium text-sm" data-testid="text-artifact-filename">{currentFileName}</p>
                {currentFileSize && (
                  <p className="text-xs text-gray-500">{formatFileSize(currentFileSize)}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFile}
                data-testid="button-download-artifact"
              >
                <Download className="h-4 w-4 mr-1" />
                Скачать
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteFile}
                disabled={isDeleting}
                data-testid="button-delete-artifact"
              >
                {isDeleting ? (
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
      )}

      {!hasExistingFile && (
        <>
          {!researchId && (
            <div className="text-sm text-amber-600 dark:text-amber-400 mb-2">
              Сохраните исследование перед загрузкой файла артефакта
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
              accept=".pdf,.txt,.doc,.docx,.xls,.xlsx"
              onChange={handleFileInput}
              className="hidden"
              id="artifact-upload"
              disabled={isUploading}
            />

            <div className="flex flex-col items-center gap-3">
              <Upload className="h-10 w-10 text-gray-400" />
              <div>
                <p className="text-sm font-medium">
                  {dragActive
                    ? "Перетащите файл сюда"
                    : "Перетащите файл или нажмите для выбора"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, TXT, DOC, DOCX, XLS, XLSX (макс. 50 МБ)
                </p>
              </div>
              <label
                htmlFor="artifact-upload"
                className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Выбрать файл
              </label>
            </div>
          </div>

          {selectedFile && (
            <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(selectedFile.name)}
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={isUploading}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Загрузка файла...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {selectedFile && !isUploading && (
            <Button
              onClick={uploadFile}
              disabled={!researchId}
              className="w-full"
              data-testid="button-upload-artifact"
            >
              <Upload className="h-4 w-4 mr-2" />
              Загрузить артефакт
            </Button>
          )}
        </>
      )}
    </div>
  );
}
