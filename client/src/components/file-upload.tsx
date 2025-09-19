import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileAudio,
  FileVideo,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  meetingId: number | null;
  onUploadComplete?: () => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

export default function FileUpload({
  meetingId,
  onUploadComplete,
  isProcessing,
  setIsProcessing,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const acceptedTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "audio/aac",
    "audio/flac",
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/webm",
    "video/mkv",
  ];

  const isValidFileType = (file: File): boolean => {
    return (
      acceptedTypes.includes(file.type) ||
      file.name.match(
        /\.(mp3|wav|ogg|m4a|aac|flac|mp4|avi|mov|wmv|webm|mkv)$/i,
      ) !== null
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Байт";
    const k = 1024;
    const sizes = ["Байт", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("audio/")) {
      return <FileAudio className="h-8 w-8 text-blue-500" />;
    } else if (type.startsWith("video/")) {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    }
    return <Upload className="h-8 w-8 text-gray-500" />;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles: UploadedFile[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (isValidFileType(file)) {
        validFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          file,
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setError(
        `Неверные типы файлов: ${invalidFiles.join(", ")}. Загружайте только аудио или видео файлы.`,
      );
      return;
    }

    setError(null);
    setUploadedFiles(validFiles);
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
    [handleFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles],
  );

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    console.log(
      "processFiles called, uploadedFiles length:",
      uploadedFiles.length,
    );
    if (uploadedFiles.length === 0) {
      console.log("No files to process");
      return;
    }

    if (!meetingId) {
      setError("Meeting ID is required. Please save the meeting first.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();

      // Add all files to FormData
      uploadedFiles.forEach((uploadedFile, index) => {
        formData.append("files", uploadedFile.file);
        console.log(
          `Added file ${index}: ${uploadedFile.file.name}, size: ${uploadedFile.file.size}`,
        );
      });

      console.log(
        "FormData entries:",
        Array.from(formData.entries()).map(([key, value]) => [
          key,
          value instanceof File ? `${value.name} (${value.size} bytes)` : value,
        ]),
      );

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await apiRequest(
        "POST",
        `/api/meetings/${meetingId}/files`,
        formData,
      );

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.statusText}`);
      }

      const result = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: "Файлы загружены успешно",
        description: `${uploadedFiles.length} файл(ов) загружено. Запущена автоматическая транскрибация.`,
      });

      // Clear uploaded files
      setUploadedFiles([]);

      // Invalidate queries to refresh file attachments and transcription summary
      if (meetingId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/meetings", meetingId, "attachments"],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/meetings", meetingId, "transcription-summary"],
        });
      }

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(
        error instanceof Error ? error.message : "Произошла неизвестная ошибка",
      );
      toast({
        title: "Ошибка загрузки",
        description:
          error instanceof Error
            ? error.message
            : "Произошла неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Загрузка аудио/видео файлов
        </CardTitle>
        <CardDescription>
          Загрузите аудио и видео файлы для сохранения их в хранилище и
          автоматический транскрипции.
          {!meetingId &&
            " Пожалуйста, сохраните встречу перед началом загрузки."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          } ${isProcessing || !meetingId ? "pointer-events-none opacity-50" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="audio/*,video/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={isProcessing}
          />

          <div className="flex flex-col items-center gap-4">
            <Upload className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium">
                {dragActive
                  ? "Перетащите файлы сюда"
                  : "Перетащите файлы сюда или нажмите для выбора"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Поддерживаются MP3, WAV, MP4, AVI, MOV и другие аудио/видео
                форматы
              </p>
            </div>
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Upload className="h-4 w-4 mr-2" />
              Выбрать файлы
            </label>
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Выбранные файлы:</h4>
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={isProcessing}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Обработка файлов...</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={processFiles}
            disabled={uploadedFiles.length === 0 || isProcessing || !meetingId}
            className="flex-1"
            data-testid="button-upload-files"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Загрузить файлы
              </>
            )}
          </Button>

          {uploadedFiles.length > 0 && !isProcessing && (
            <Button variant="outline" onClick={() => setUploadedFiles([])}>
              Очистить все
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
