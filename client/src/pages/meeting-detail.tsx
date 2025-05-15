import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Meeting, MeetingStatus, Research, InsertMeeting } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import MeetingForm from "@/components/meeting-form";
import ReactMarkdown from 'react-markdown';
import MDEditor from '@uiw/react-md-editor';

// Helper type for handling Meeting with ID
type MeetingWithId = Meeting;

export default function MeetingDetail() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const id = isNew ? null : parseInt(params.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  
  // Parse query parameters if we're creating a new meeting
  const searchParams = isNew ? new URLSearchParams(window.location.search) : null;
  const preselectedResearchId = searchParams ? parseInt(searchParams.get("researchId") || "0") : 0;
  
  // For storing the preselected research details
  const [preselectedResearch, setPreselectedResearch] = useState<Research | null>(null);

  const { data: meeting, isLoading: isMeetingLoading } = useQuery<Meeting>({
    queryKey: ["/api/meetings", id],
    queryFn: async () => {
      if (isNew) return undefined;
      const res = await fetch(`/api/meetings/${id}`);
      if (!res.ok) throw new Error("Meeting not found");
      return res.json();
    },
    enabled: !isNew && !!id,
  });

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
    enabled: isNew, // Only load all meetings when creating a new one (for duplicate detection)
  });

  const { data: researches = [], isLoading: isResearchesLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  // Effect to set preselected research when researches data is loaded
  useEffect(() => {
    if (isNew && preselectedResearchId > 0 && researches.length > 0) {
      const research = researches.find((r: Research) => r.id === preselectedResearchId);
      if (research) {
        setPreselectedResearch(research);
      }
    }
  }, [isNew, preselectedResearchId, researches]);

  const createMutation = useMutation({
    mutationFn: async (meetingData: InsertMeeting) => {
      const res = await apiRequest("POST", "/api/meetings", meetingData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: "Meeting created successfully" });
      // Redirect to the newly created meeting detail page
      setLocation(`/meetings/${data.id}`);
    },
    onError: (error) => {
      toast({ 
        title: "Error creating meeting", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: MeetingWithId) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/meetings/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", id] });
      toast({ title: "Meeting updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating meeting", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await apiRequest("DELETE", `/api/meetings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: "Meeting deleted successfully" });
      setLocation("/");  // Return to meetings list
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting meeting", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
  
  const handleSubmit = (formData: InsertMeeting) => {
    if (!isNew && id) {
      // For update, we need to include the ID
      const updateData = { ...formData, id } as MeetingWithId;
      updateMutation.mutate(updateData);
    } else {
      // For create, we check for duplicates first
      const duplicateMeeting = meetings.find(m => m.cnum === formData.cnum);
      if (duplicateMeeting) {
        if (confirm("A meeting with this CNUM already exists. Create anyway?")) {
          createMutation.mutate(formData);
        }
      } else {
        createMutation.mutate(formData);
      }
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const handleCancel = () => {
    setLocation("/");
  };

  const isLoading = isMeetingLoading || isResearchesLoading;
  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] px-4 py-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with breadcrumb-style navigation */}
        <div className="mb-6 flex items-center text-sm text-gray-500">
          <Button 
            variant="ghost" 
            className="p-1 text-gray-400 hover:text-gray-700 rounded-full" 
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="mx-2 text-gray-300">/</span>
          <span className="hover:text-gray-800 cursor-pointer" onClick={() => setLocation("/")}>Meetings</span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-gray-800 font-medium truncate">
            {isNew ? "New Meeting" : meeting?.respondentName || "Meeting Details"}
          </span>
        </div>

        {/* Main content container - Notion-style UI */}
        <div className="bg-white overflow-hidden">
          {/* Document title - Notion style with Company Name (CNUM or GCC): Respondent Name format */}
          <div className="px-8 pt-8 pb-4 border-b border-gray-100">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 outline-none focus:ring-0 empty:before:content-['Untitled'] empty:before:text-gray-400 w-full">
              {isNew ? "Create New Meeting" : (
                `${meeting?.companyName || ''} (${meeting?.cnum || meeting?.gcc || ''}): ${meeting?.respondentName || ''}`
              )}
            </h1>
            <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500 my-2">
              {/* Status badge with Notion-like styling */}
              <div className="flex items-center gap-1">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={isNew ? MeetingStatus.IN_PROGRESS : meeting?.status}>
                  {isNew ? MeetingStatus.IN_PROGRESS : meeting?.status}
                </span>
              </div>
              
              {/* Meeting date with Notion-like tag styling */}
              {!isNew && meeting?.date && (
                <div className="px-2.5 py-0.5 rounded-md text-xs bg-gray-100 text-gray-800 font-medium whitespace-nowrap" title={new Date(meeting.date).toLocaleDateString()}>
                  {new Date(meeting.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              )}
              
              {/* Display research name if available - clickable to go to research page */}
              {!isNew && meeting?.researchId && (
                <div 
                  className="px-2.5 py-0.5 rounded-md text-xs bg-purple-100 text-purple-800 font-medium cursor-pointer hover:bg-purple-200 transition-colors duration-200 flex items-center gap-1 whitespace-nowrap overflow-hidden max-w-[150px]"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    setLocation(`/researches/${meeting.researchId}`);
                  }}
                  title={`${researches.find((r: Research) => r.id === meeting.researchId)?.name || 'Research'} - Click to view research details`}
                >
                  <span className="truncate">{researches.find((r: Research) => r.id === meeting.researchId)?.name || 'Research'}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </div>
              )}

              {/* Position information */}
              {!isNew && meeting?.respondentPosition && (
                <div className="px-2.5 py-0.5 rounded-md text-xs bg-amber-100 text-amber-800 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={meeting.respondentPosition}>
                  {meeting.respondentPosition}
                </div>
              )}
            </div>
          </div>

          {/* Main form area - More Notion-like with generous spacing */}
          <div className="px-8 py-6">
            <MeetingForm
              onSubmit={handleSubmit}
              initialData={meeting || (preselectedResearchId ? {
                id: 0, // New meeting
                researchId: preselectedResearchId,
                date: new Date(),
                // Default values for required fields
                respondentName: "",
                respondentPosition: "",
                cnum: "",
                gcc: null,
                companyName: null,
                email: "",
                researcher: preselectedResearch?.researcher || "", // Set the researcher from the selected research
                relationshipManager: "",
                salesPerson: "",
                status: MeetingStatus.IN_PROGRESS,
                notes: null
              } as Meeting : undefined)}
              isLoading={isPending}
              onCancel={handleCancel}
              onDelete={!isNew ? handleDelete : undefined}
            />
          </div>
        </div>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-white rounded-lg border-0 shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">Delete Meeting</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to delete this meeting? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="bg-white border border-gray-200 hover:bg-gray-50">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white border-0"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}