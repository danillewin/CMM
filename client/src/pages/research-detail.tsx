import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Research, ResearchStatus, InsertResearch, ResearchStatusType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import ResearchForm from "@/components/research-form";
import { LinkifiedText } from "@/components/linkified-text";

// Helper type for handling Research with ID
type ResearchWithId = Research;

export default function ResearchDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const id = isNew ? null : parseInt(params.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  const { data: research, isLoading: isResearchLoading } = useQuery<Research>({
    queryKey: ["/api/researches", id],
    queryFn: async () => {
      if (isNew) return undefined;
      console.log(`Fetching research with ID: ${id}`);
      try {
        // Use regular fetch like meeting-detail.tsx does
        const res = await fetch(`/api/researches/${id}`);
        console.log("Response status:", res.status);
        
        if (!res.ok) {
          console.error("Error in response:", await res.text());
          throw new Error("Research not found");
        }
        
        const data = await res.json();
        console.log("Fetched research data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching research:", error);
        throw error;
      }
    },
    enabled: !isNew && !!id,
  });

  const { data: researches = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
    enabled: isNew, // Only load all researches when creating a new one (for duplicate detection)
  });

  const createMutation = useMutation({
    mutationFn: async (researchData: InsertResearch) => {
      const res = await apiRequest("POST", "/api/researches", researchData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      toast({ title: "Research created successfully" });
      // Redirect to the newly created research detail page
      setLocation(`/researches/${data.id}`);
    },
    onError: (error) => {
      toast({ 
        title: "Error creating research", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: ResearchWithId) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/researches/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/researches", id] });
      toast({ title: "Research updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating research", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const res = await apiRequest("DELETE", `/api/researches/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete research");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      toast({ title: "Research deleted successfully" });
      setLocation("/researches");  // Return to researches list
    },
    onError: (error: Error) => {
      // Check if the error is due to associated meetings
      if (error.message?.includes("associated meetings")) {
        setErrorMessage("This research cannot be deleted because it has associated meetings. Please delete all related meetings first.");
      } else {
        setErrorMessage(error.message || "An error occurred while deleting the research.");
      }
      setErrorDialogOpen(true);
    },
  });
  
  const handleSubmit = (formData: InsertResearch) => {
    if (!isNew && id) {
      // For update, we need to include the ID
      const updateData = { ...formData, id } as ResearchWithId;
      updateMutation.mutate(updateData);
    } else {
      // For create, we check for duplicates first
      const duplicateResearch = researches.find(r => 
        r.name.toLowerCase() === formData.name.toLowerCase() && 
        r.team.toLowerCase() === formData.team.toLowerCase()
      );
      if (duplicateResearch) {
        if (confirm("A research with this name and team already exists. Create anyway?")) {
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
    setLocation("/researches");
  };

  const isLoading = isResearchLoading;
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
            onClick={() => setLocation("/researches")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="mx-2 text-gray-300">/</span>
          <span className="hover:text-gray-800 cursor-pointer" onClick={() => setLocation("/researches")}>Researches</span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-gray-800 font-medium truncate">
            {isNew ? "New Research" : research?.name || "Research Details"}
          </span>
        </div>

        {/* Main content container - Notion-style UI */}
        <div className="bg-white overflow-hidden">
          {/* Document title - Notion style */}
          <div className="px-8 pt-8 pb-4 border-b border-gray-100">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 outline-none focus:ring-0 empty:before:content-['Untitled'] empty:before:text-gray-400 w-full">
              {isNew ? "Create New Research" : research?.name}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 my-2">
              {!isNew && research && (
                <>
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium
                      ${research.status === ResearchStatus.DONE ? 'bg-green-100 text-green-800' :
                        research.status === ResearchStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}`}
                    >
                      {research.status}
                    </span>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-md text-xs bg-gray-100 text-gray-800 font-medium">
                    {research.team}
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: research.color }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(research?.dateStart).toLocaleDateString()} - {new Date(research?.dateEnd).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main form area - More Notion-like with generous spacing and clean dividers */}
          <div className="px-8 py-6">
            <ResearchForm
              onSubmit={handleSubmit}
              initialData={research || undefined}
              isLoading={isPending}
              onCancel={handleCancel}
              onDelete={!isNew ? handleDelete : undefined}
            />
          </div>
        </div>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-white rounded-lg border-0 shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">Delete Research</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to delete this research? This action cannot be undone.
                If this research has associated meetings, they must be deleted first.
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

        <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
          <AlertDialogContent className="bg-white rounded-lg border-0 shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">Error</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                {errorMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                className="bg-primary hover:bg-primary/90 text-white border-0"
              >
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}