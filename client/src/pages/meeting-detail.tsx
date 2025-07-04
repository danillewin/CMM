import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Meeting, MeetingStatus, Research, InsertMeeting } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, ExternalLink, ExternalLinkIcon } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import MeetingForm from "@/components/meeting-form";
import ReactMarkdown from 'react-markdown';
import MDEditor from '@uiw/react-md-editor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMeetingSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Helper type for handling Meeting with ID
type MeetingWithId = Meeting;

// Component for Meeting Info tab (all fields except notes and fullText)
function MeetingInfoForm({ meeting, onUpdate, isLoading }: { meeting?: Meeting; onUpdate: (data: InsertMeeting) => void; isLoading: boolean }) {
  return (
    <MeetingForm
      onSubmit={onUpdate}
      initialData={meeting || null}
      isLoading={isLoading}
      hideNotesAndFullText={true}
    />
  );
}

// Component for Meeting Results tab (notes and fullText only)
function MeetingResultsForm({ meeting, onUpdate, isLoading }: { meeting?: Meeting; onUpdate: (data: InsertMeeting) => void; isLoading: boolean }) {
  const form = useForm<{ notes: string; fullText: string }>({
    defaultValues: {
      notes: meeting?.notes || "",
      fullText: meeting?.fullText || "",
    },
  });

  const handleSubmit = (data: { notes: string; fullText: string }) => {
    if (meeting) {
      onUpdate({
        respondentName: meeting.respondentName,
        respondentPosition: meeting.respondentPosition,
        cnum: meeting.cnum,
        gcc: meeting.gcc || "",
        companyName: meeting.companyName || "",
        email: meeting.email || "",
        researcher: meeting.researcher || "",
        relationshipManager: meeting.relationshipManager,
        salesPerson: meeting.salesPerson,
        date: meeting.date,
        researchId: meeting.researchId,
        status: meeting.status as any,
        notes: data.notes,
        fullText: data.fullText,
        hasGift: (meeting.hasGift as "yes" | "no") || "no",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">Meeting Notes</FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => field.onChange(val || "")}
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
                  height={300}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="fullText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">Full Text</FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => field.onChange(val || "")}
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
                  height={300}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Results
        </Button>
      </form>
    </Form>
  );
}

export default function MeetingDetail() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const id = isNew ? null : parseInt(params.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateMeetings, setDuplicateMeetings] = useState<Meeting[]>([]);
  const [pendingFormData, setPendingFormData] = useState<InsertMeeting | null>(null);
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
      const res = await apiRequest("GET", `/api/meetings/${id}`);
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
  
  const handleCnumChange = (cnum: string) => {
    if (!isNew) return; // Only check for duplicates when creating a new meeting
    if (!cnum) return; // Don't check empty values
    
    const duplicates = meetings.filter(m => m.cnum === cnum);
    if (duplicates.length > 0) {
      // Store duplicates and show the dialog
      setDuplicateMeetings(duplicates);
      setShowDuplicateDialog(true);
    }
  };
  
  const handleSubmit = (formData: InsertMeeting) => {
    if (!isNew && id) {
      // For update, we need to include the ID
      const updateData = { ...formData, id } as MeetingWithId;
      updateMutation.mutate(updateData);
    } else {
      // Check for duplicates again when submitting
      const duplicates = meetings.filter(m => m.cnum === formData.cnum);
      if (duplicates.length > 0) {
        // Store duplicates and pending form data, then show the dialog
        setDuplicateMeetings(duplicates);
        setPendingFormData(formData);
        setShowDuplicateDialog(true);
      } else {
        createMutation.mutate(formData);
      }
    }
  };
  
  const handleConfirmCreate = () => {
    if (pendingFormData) {
      createMutation.mutate(pendingFormData);
      setShowDuplicateDialog(false);
      setPendingFormData(null);
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

          {/* Tabbed interface - Notion-style */}
          <div className="px-8 py-6">
            {isNew ? (
              // For new meetings, show the full meeting form without tabs
              <MeetingForm
                onSubmit={handleSubmit}
                initialData={preselectedResearchId ? {
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
                } as Meeting : undefined}
                isLoading={isPending}
                onCancel={handleCancel}
                onCnumChange={handleCnumChange}
                meetings={meetings}
              />
            ) : (
              // For existing meetings, show tabbed interface
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-50 p-1 rounded-lg">
                  <TabsTrigger 
                    value="info" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2.5 text-sm font-medium transition-all"
                  >
                    Info
                  </TabsTrigger>
                  <TabsTrigger 
                    value="results" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2.5 text-sm font-medium transition-all"
                  >
                    Results
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-0">
                  <MeetingInfoForm 
                    meeting={meeting} 
                    onUpdate={handleSubmit} 
                    isLoading={isPending}
                  />
                </TabsContent>

                <TabsContent value="results" className="mt-0">
                  <MeetingResultsForm 
                    meeting={meeting} 
                    onUpdate={handleSubmit} 
                    isLoading={isPending}
                  />
                </TabsContent>
              </Tabs>
            )}
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

        {/* Duplicate CNUM Dialog */}
        <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <DialogContent className="sm:max-w-[600px] bg-white rounded-lg border-0 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-amber-600">
                {pendingFormData ? 'Duplicate CNUM Detected' : 'Duplicate CNUM Warning'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                The following meeting(s) already exist with this CNUM:
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-[300px] overflow-auto my-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Respondent</TableHead>
                    <TableHead>Research</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duplicateMeetings.map((meeting) => {
                    const research = researches.find(r => r.id === meeting.researchId);
                    return (
                      <TableRow key={meeting.id}>
                        <TableCell>{new Date(meeting.date).toLocaleDateString()}</TableCell>
                        <TableCell>{meeting.respondentName}</TableCell>
                        <TableCell>{research?.name || 'Unknown Research'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="p-1 h-7"
                            onClick={() => {
                              window.open(`/meetings/${meeting.id}`, '_blank');
                            }}
                            title="Open meeting in new tab"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDuplicateDialog(false)}
                className="bg-white border border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
              {pendingFormData && (
                <Button
                  onClick={handleConfirmCreate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Anyway
                </Button>
              )}
              {!pendingFormData && (
                <Button
                  onClick={() => setShowDuplicateDialog(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Acknowledge
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}