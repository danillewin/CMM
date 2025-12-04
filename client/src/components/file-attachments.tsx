import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileAudio, 
  FileVideo, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type MeetingAttachment } from "@shared/schema";
import { AnnotatedTextField } from "./annotated-text-field";

interface FileAttachmentsProps {
  meetingId: number;
}

interface TranscriptionSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
}

export default function FileAttachments({ meetingId }: FileAttachmentsProps) {
  const { toast } = useToast();
  
  // State for tracking edited transcription texts
  const [editedTranscriptions, setEditedTranscriptions] = useState<Record<number, string>>({});
  
  // State for tracking expanded transcription sections (all expanded by default)
  const [expandedTranscriptions, setExpandedTranscriptions] = useState<Record<number, boolean>>({});

  // Query for file attachments with conditional real-time updates
  const { data: attachments, isLoading, error, refetch: refetchAttachments } = useQuery<MeetingAttachment[]>({
    queryKey: ['/api/meetings', meetingId, 'attachments'],
    queryFn: async () => {
      const response = await fetch(`/api/meetings/${meetingId}/files`);
      if (!response.ok) {
        throw new Error(`Failed to fetch attachments: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!meetingId,
    // Poll for updates when there's active processing
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || !Array.isArray(data)) return false;
      
      // Check if any files are currently being processed
      const hasActiveProcessing = data.some(att => 
        att.transcriptionStatus === 'in_progress' || att.transcriptionStatus === 'pending'
      );
      
      return hasActiveProcessing ? 3000 : false; // Poll every 3 seconds if processing
    },
  });

  // Query for transcription summary - only poll when there's active processing
  const { data: summary, refetch: refetchSummary } = useQuery<TranscriptionSummary>({
    queryKey: ['/api/meetings', meetingId, 'transcription-summary'],
    queryFn: async () => {
      const response = await fetch(`/api/meetings/${meetingId}/transcription-summary`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transcription summary: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!meetingId,
    // Only poll when there are active transcriptions, same as attachments
    refetchInterval: (query) => {
      // Check if attachments data indicates active processing
      if (!attachments || !Array.isArray(attachments)) return false;
      
      const hasActiveProcessing = attachments.some(att => 
        att.transcriptionStatus === 'in_progress' || att.transcriptionStatus === 'pending'
      );
      
      return hasActiveProcessing ? 5000 : false; // Poll every 5 seconds only when processing
    },
  });

  // Manual refresh function for both queries
  const handleRefresh = () => {
    refetchAttachments();
    refetchSummary();
    toast({
      title: "Refreshing status",
      description: "Checking for updated transcription status...",
    });
  };

  // Mutation for retrying transcription
  const retryTranscriptionMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("POST", `/api/files/${fileId}/transcription/retry`);
      if (!response.ok) {
        throw new Error('Failed to retry transcription');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transcription retry started",
        description: "The file will be processed again.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meetingId, 'attachments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meetingId, 'transcription-summary'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to retry transcription",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Mutation for starting all transcriptions
  const startAllTranscriptionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/meetings/${meetingId}/transcription/start`);
      if (!response.ok) {
        throw new Error('Failed to start transcriptions');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transcription processing started",
        description: "All pending files will be processed.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meetingId, 'attachments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meetingId, 'transcription-summary'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to start transcriptions",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Mutation for saving transcription text
  const saveTranscriptionMutation = useMutation({
    mutationFn: async ({ attachmentId, transcriptionText }: { attachmentId: number; transcriptionText: string }) => {
      const response = await apiRequest("PATCH", `/api/files/${attachmentId}`, { transcriptionText });
      if (!response.ok) {
        throw new Error('Failed to save transcription');
      }
      return response.json();
    },
    onSuccess: (_, { attachmentId }) => {
      toast({
        title: "Transcription saved",
        description: "Your changes have been saved.",
      });
      // Remove from edited state
      setEditedTranscriptions(prev => {
        const updated = { ...prev };
        delete updated[attachmentId];
        return updated;
      });
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meetingId, 'attachments'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save transcription",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle transcription text change
  const handleTranscriptionChange = useCallback((attachmentId: number, text: string) => {
    setEditedTranscriptions(prev => ({
      ...prev,
      [attachmentId]: text
    }));
  }, []);

  // Get the current text value for a transcription
  const getTranscriptionText = useCallback((attachment: MeetingAttachment) => {
    // If the user has edited this transcription, return the edited value
    if (editedTranscriptions[attachment.id] !== undefined) {
      return editedTranscriptions[attachment.id];
    }
    // Otherwise return the original value
    return attachment.transcriptionText || '';
  }, [editedTranscriptions]);

  // Check if a transcription has unsaved changes
  const hasUnsavedChanges = useCallback((attachmentId: number) => {
    return editedTranscriptions[attachmentId] !== undefined;
  }, [editedTranscriptions]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('audio/')) {
      return <FileAudio className="h-8 w-8 text-blue-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    }
    return <FileAudio className="h-8 w-8 text-gray-500" />;
  };

  const getStatusBadge = (status: string, retryCount: number) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'failed':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed {retryCount > 0 && `(${retryCount} retries)`}
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const response = await apiRequest("GET", `/api/files/${fileId}/download`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Downloading ${fileName}...`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading attachments...</span>
        </CardContent>
      </Card>
    );
  }

  // Don't show error if we have data - this fixes stale error states
  if (error && !attachments) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load file attachments. Please try again.
              <br />
              <small className="text-gray-500 mt-1 block">
                Error: {error.message}
              </small>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              File Attachments
              {attachments && attachments.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {attachments.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Uploaded files and their transcription status
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              data-testid="button-refresh-status"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            {summary && (summary.pending > 0 || summary.failed > 0) && (
              <Button
                onClick={() => startAllTranscriptionsMutation.mutate()}
                disabled={startAllTranscriptionsMutation.isPending}
                variant="outline"
                size="sm"
                data-testid="button-start-all-transcriptions"
              >
                {startAllTranscriptionsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Process All
              </Button>
            )}
          </div>
        </div>

        {summary && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {summary.completed > 0 && (
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                {summary.completed} Completed
              </Badge>
            )}
            {summary.inProgress > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                {summary.inProgress} Processing
              </Badge>
            )}
            {summary.pending > 0 && (
              <Badge variant="outline" className="border-yellow-300 text-yellow-800">
                {summary.pending} Pending
              </Badge>
            )}
            {summary.failed > 0 && (
              <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                {summary.failed} Failed
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {!attachments || !Array.isArray(attachments) || attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileAudio className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No files uploaded yet</p>
            <p className="text-sm">Upload files to get started with transcription</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attachments.map((attachment) => (
              <div 
                key={attachment.id}
                className="border border-gray-200 rounded-lg p-4"
                data-testid={`attachment-${attachment.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(attachment.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={attachment.originalName}>
                        {attachment.originalName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                        {attachment.lastTranscriptionAttempt && (
                          <p className="text-xs text-gray-500">
                            • Last attempt: {new Date(attachment.lastTranscriptionAttempt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(attachment.transcriptionStatus, attachment.transcriptionRetryCount)}
                    
                    <Button
                      onClick={() => handleDownload(attachment.id, attachment.originalName)}
                      variant="outline"
                      size="sm"
                      className="h-8"
                      data-testid={`button-download-${attachment.id}`}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    
                    {attachment.transcriptionStatus === 'failed' && (
                      <Button
                        onClick={() => retryTranscriptionMutation.mutate(attachment.id)}
                        disabled={retryTranscriptionMutation.isPending}
                        variant="outline"
                        size="sm" 
                        className="h-8"
                        data-testid={`button-retry-${attachment.id}`}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {attachment.errorMessage && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Error: {attachment.errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {attachments && attachments.some(a => a.transcriptionStatus === 'completed' && a.transcriptionText) && (
        <>
          <CardHeader className="border-t">
            <CardTitle className="text-base">Transcriptions</CardTitle>
            <CardDescription>
              Transcribed text from uploaded audio/video files. Select text to mark errors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {attachments
              .filter(a => a.transcriptionStatus === 'completed' && a.transcriptionText)
              .map((attachment) => {
                const isExpanded = expandedTranscriptions[attachment.id] !== false;
                
                return (
                  <Collapsible
                    key={`transcription-${attachment.id}`}
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedTranscriptions(prev => ({
                      ...prev,
                      [attachment.id]: open
                    }))}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                    data-testid={`transcription-section-${attachment.id}`}
                  >
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b flex items-center justify-between">
                      <CollapsibleTrigger asChild>
                        <button 
                          type="button"
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                          data-testid={`button-toggle-transcription-${attachment.id}`}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                          {getFileIcon(attachment.mimeType)}
                          <span className="font-medium text-sm">{attachment.originalName}</span>
                        </button>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getTranscriptionText(attachment).length} characters
                        </Badge>
                        {hasUnsavedChanges(attachment.id) && (
                          <Button
                            onClick={() => saveTranscriptionMutation.mutate({ 
                              attachmentId: attachment.id, 
                              transcriptionText: editedTranscriptions[attachment.id] 
                            })}
                            disabled={saveTranscriptionMutation.isPending}
                            variant="default"
                            size="sm"
                            className="h-7"
                            data-testid={`button-save-transcription-${attachment.id}`}
                          >
                            {saveTranscriptionMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            Save
                          </Button>
                        )}
                      </div>
                    </div>
                    <CollapsibleContent>
                      <div 
                        className="p-4 bg-white dark:bg-gray-950"
                        data-testid={`transcription-text-${attachment.id}`}
                      >
                        <AnnotatedTextField
                          meetingId={meetingId}
                          attachmentId={attachment.id}
                          value={getTranscriptionText(attachment)}
                          onChange={(text) => handleTranscriptionChange(attachment.id, text)}
                          placeholder="Transcription text..."
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
          </CardContent>
        </>
      )}
    </Card>
  );
}