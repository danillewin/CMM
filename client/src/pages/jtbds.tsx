import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Pencil, Trash, Plus, Tag, Target, Layers, ChevronRight, ChevronDown,
  Briefcase, ListChecks, FileText, Circle, MoreHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Jtbd, InsertJtbd } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertJtbdSchema } from "@shared/schema";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkifiedText } from "@/components/linkified-text";
import { RequiredFieldIndicator } from "@/components/required-field-indicator";

// JTBD Categories
const JTBD_CATEGORIES = [
  "Functional",
  "Emotional",
  "Social",
  "Financial",
  "Time-saving",
  "Other"
];

// JTBD Priorities
const JTBD_PRIORITIES = [
  "High",
  "Medium",
  "Low"
];

interface JtbdFormProps {
  onSubmit: (data: InsertJtbd & { parentId?: number }) => void;
  initialData?: Jtbd | null;
  isLoading?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  allJtbds?: Jtbd[];
  parentId?: number;
}

function JtbdForm({
  onSubmit,
  initialData = null,
  isLoading = false,
  onCancel,
  onDelete,
  allJtbds = [],
  parentId
}: JtbdFormProps) {
  const form = useForm<InsertJtbd & { parentId?: number }>({
    resolver: zodResolver(
      insertJtbdSchema.extend({
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        parentId: z.number().optional()
      })
    ),
    defaultValues: {
      title: initialData?.title || "",
      jobStatement: initialData?.jobStatement || "",
      jobStory: initialData?.jobStory || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      priority: initialData?.priority || "",
      parentId: parentId !== undefined ? parentId : initialData?.parentId || undefined
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Title <RequiredFieldIndicator />
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter JTBD title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobStatement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Statement</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="When I [situation], I want to [motivation], so I can [expected outcome]"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobStory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Story</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="When I [situation], I want to [motivation], so I can [expected outcome]"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description <RequiredFieldIndicator />
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the job to be done"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {JTBD_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {JTBD_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Parent Job Selection - only show when creating a sub-job */}
        {parentId !== undefined && (
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Job</FormLabel>
                <FormControl>
                  <div className="p-2 border rounded-md bg-muted/10">
                    <p className="text-sm font-medium">
                      {allJtbds.find(j => j.id === parentId)?.title || "Selected Job"}
                    </p>
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  This job will be created as a sub-job of the selected parent
                </FormDescription>
              </FormItem>
            )}
          />
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {initialData && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {initialData ? "Update" : "Create"} JTBD
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Helper function to get icon based on level and content
function getJtbdIcon(level: number, jtbd: Jtbd) {
  if (level === 0) {
    return <Briefcase className="h-4 w-4 text-blue-600" />;
  } else if (level === 1) {
    return <ListChecks className="h-4 w-4 text-green-600" />;
  } else {
    // Level 2+ are job stories/statements
    return <Circle className="h-3 w-3 text-orange-500 fill-current" />;
  }
}

// Helper function to get typography classes based on level
function getTypographyClasses(level: number) {
  if (level === 0) {
    return "text-lg font-semibold text-gray-900";
  } else if (level === 1) {
    return "text-base font-medium text-gray-800";
  } else {
    return "text-sm font-normal text-gray-700";
  }
}

// Component for rendering job stories/statements at level 2+
function JobStoryCard({ jtbd, level, onEdit }: { jtbd: Jtbd; level: number; onEdit: (jtbd: Jtbd) => void }) {
  const hasJobStatement = jtbd.jobStatement && jtbd.jobStatement.trim();
  const hasJobStory = jtbd.jobStory && jtbd.jobStory.trim();
  
  return (
    <Card className="bg-blue-50/50 border-blue-200/60 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          {getJtbdIcon(level, jtbd)}
          <div className="flex-1">
            <h4 className={getTypographyClasses(level)}>{jtbd.title}</h4>
            {jtbd.description && (
              <p className="text-xs text-gray-600 mt-1">
                <LinkifiedText text={jtbd.description} />
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {jtbd.priority && (
            <Badge 
              variant={
                jtbd.priority === "High" ? "destructive" : 
                jtbd.priority === "Medium" ? "default" : "outline"
              }
              className="text-xs"
            >
              {jtbd.priority}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(jtbd)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Job Statement */}
      {hasJobStatement && (
        <div className="space-y-1">
          <Badge variant="secondary" className="text-xs font-medium">
            Job Statement
          </Badge>
          <p className="text-sm text-gray-700 italic leading-relaxed">
            {jtbd.jobStatement}
          </p>
        </div>
      )}
      
      {/* Job Story */}
      {hasJobStory && (
        <div className="space-y-1">
          <Badge variant="secondary" className="text-xs font-medium">
            Job Story
          </Badge>
          <p className="text-sm text-gray-700 italic leading-relaxed">
            {jtbd.jobStory}
          </p>
        </div>
      )}
    </Card>
  );
}

// Component for rendering a single job item with its children
function JobItem({ jtbd, level = 0, childrenMap, expandedItems, setExpandedItems, onEdit, onAddSubJob }) {
  const hasChildren = childrenMap[jtbd.id]?.length > 0;
  const isExpanded = expandedItems[jtbd.id];
  const indentLevel = level * 24; // 24px per level instead of 50px
  
  // For level 2+ items (job stories/statements), render as cards
  if (level >= 2) {
    return (
      <div className="ml-12 mb-3">
        <JobStoryCard jtbd={jtbd} level={level} onEdit={onEdit} />
      </div>
    );
  }
  
  // Recursive function to render child jobs
  const renderChildren = () => {
    if (!hasChildren || !isExpanded) return null;
    
    return (
      <div className={`${level < 2 ? 'ml-6 border-l-2 border-gray-100' : ''}`}>
        {childrenMap[jtbd.id].map(childJob => (
          <JobItem 
            key={childJob.id}
            jtbd={childJob}
            level={level + 1}
            childrenMap={childrenMap}
            expandedItems={expandedItems}
            setExpandedItems={setExpandedItems}
            onEdit={onEdit}
            onAddSubJob={onAddSubJob}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="mb-2">
      <div 
        className={`
          group hover:bg-gray-50/80 rounded-lg transition-colors duration-150
          ${level === 0 ? 'border-b border-gray-100 pb-2' : ''}
        `}
        style={{ paddingLeft: `${indentLevel}px` }}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Expand/Collapse Button - only show if has children */}
          {hasChildren ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0 shrink-0 hover:bg-gray-200" 
              onClick={() => setExpandedItems(prev => ({
                ...prev,
                [jtbd.id]: !prev[jtbd.id]
              }))}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          ) : (
            <div className="w-6 h-6 shrink-0" /> // Placeholder for alignment
          )}
          
          {/* Icon */}
          <div className="shrink-0">
            {getJtbdIcon(level, jtbd)}
          </div>
          
          {/* Title and Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`${getTypographyClasses(level)} truncate`}>
                {jtbd.title}
              </h3>
              {hasChildren && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {childrenMap[jtbd.id].length}
                </Badge>
              )}
              {jtbd.category && (
                <Badge variant="outline" className="text-xs shrink-0">
                  <Tag className="h-3 w-3 mr-1" />
                  {jtbd.category}
                </Badge>
              )}
              {jtbd.priority && (
                <Badge 
                  variant={
                    jtbd.priority === "High" ? "destructive" : 
                    jtbd.priority === "Medium" ? "default" : "outline"
                  }
                  className="text-xs shrink-0"
                >
                  {jtbd.priority}
                </Badge>
              )}
            </div>
            
            {/* Description - shown when expanded */}
            {isExpanded && jtbd.description && (
              <div className="mt-2 text-sm text-gray-600 leading-relaxed">
                <LinkifiedText text={jtbd.description} />
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(jtbd)}
              title="Edit"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            {level < 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Add sub-job"
                onClick={() => onAddSubJob(jtbd.id)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Render children recursively */}
      {renderChildren()}
    </div>
  );
}

export default function JtbdsPage() {
  const [showNewJtbdForm, setShowNewJtbdForm] = useState(false);
  const [editingJtbd, setEditingJtbd] = useState<Jtbd | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [subJobParentId, setSubJobParentId] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch JTBDs
  const { data: jtbds = [], isLoading } = useQuery<Jtbd[]>({
    queryKey: ["/api/jtbds"],
  });

  // Organize JTBDs into hierarchy
  const organizedJtbds = useMemo(() => {
    // Get all top-level jobs (parentId is null)
    const topLevelJobs = jtbds.filter(jtbd => !jtbd.parentId);
    
    // Map of parent IDs to their child jobs
    const childrenMap: Record<number, Jtbd[]> = {};
    
    // Group children by parent ID
    jtbds.forEach(jtbd => {
      if (jtbd.parentId) {
        if (!childrenMap[jtbd.parentId]) {
          childrenMap[jtbd.parentId] = [];
        }
        childrenMap[jtbd.parentId].push(jtbd);
      }
    });
    
    return { topLevelJobs, childrenMap };
  }, [jtbds]);
  
  // Filter JTBDs
  const filteredJtbds = useMemo(() => {
    // Function to check if a job matches the filters
    const matchFilters = (jtbd: Jtbd) => {
      const searchMatch = !search || 
        jtbd.title.toLowerCase().includes(search.toLowerCase()) ||
        jtbd.description.toLowerCase().includes(search.toLowerCase());
      
      const categoryMatch = categoryFilter === "ALL" || jtbd.category === categoryFilter;
      const priorityMatch = priorityFilter === "ALL" || jtbd.priority === priorityFilter;
      
      return searchMatch && categoryMatch && priorityMatch;
    };
    
    // Function to check if a job or any of its children match the filters
    const matchesFilterTree = (jtbd: Jtbd): boolean => {
      // Check if this job matches
      if (matchFilters(jtbd)) {
        return true;
      }
      
      // Check if any children match
      const children = organizedJtbds.childrenMap[jtbd.id] || [];
      return children.some(child => matchesFilterTree(child));
    };
    
    // Filter top-level jobs
    return organizedJtbds.topLevelJobs.filter(matchesFilterTree);
  }, [search, categoryFilter, priorityFilter, organizedJtbds]);

  // Create new JTBD
  const createJtbdMutation = useMutation({
    mutationFn: async (jtbd: InsertJtbd & { parentId?: number }) => {
      const res = await apiRequest("POST", "/api/jtbds", jtbd);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jtbds"] });
      setShowNewJtbdForm(false);
      setSubJobParentId(null);
      toast({
        title: "JTBD created",
        description: "The job to be done was successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create JTBD",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update JTBD
  const updateJtbdMutation = useMutation({
    mutationFn: async ({ id, ...jtbd }: { id: number } & Partial<Jtbd>) => {
      const res = await apiRequest("PATCH", `/api/jtbds/${id}`, {
        title: jtbd.title,
        jobStatement: jtbd.jobStatement || "",
        jobStory: jtbd.jobStory || "",
        description: jtbd.description,
        category: jtbd.category || "",
        priority: jtbd.priority || ""
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jtbds"] });
      setEditingJtbd(null);
      toast({
        title: "JTBD updated",
        description: "The job to be done was successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update JTBD",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete JTBD
  const deleteJtbdMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/jtbds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jtbds"] });
      setEditingJtbd(null);
      setDeleteDialogOpen(false);
      toast({
        title: "JTBD deleted",
        description: "The job to be done was successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete JTBD",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const handleCreateSubmit = (data: InsertJtbd & { parentId?: number }) => {
    createJtbdMutation.mutate(data);
  };

  const handleUpdateSubmit = (data: InsertJtbd) => {
    if (!editingJtbd) return;
    updateJtbdMutation.mutate({ ...data, id: editingJtbd.id });
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!editingJtbd) return;
    deleteJtbdMutation.mutate(editingJtbd.id);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Jobs to be Done</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search JTBDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[300px]"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {JTBD_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              {JTBD_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showNewJtbdForm} onOpenChange={(open) => {
            if (!open) {
              setSubJobParentId(null);
            }
            setShowNewJtbdForm(open);
          }}>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <Plus className="mr-2 h-4 w-4" /> Add JTBD
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>
                  {subJobParentId 
                    ? "Create New Sub-Job" 
                    : "Create New Job to be Done"
                  }
                </DialogTitle>
              </DialogHeader>
              <JtbdForm
                onSubmit={handleCreateSubmit}
                isLoading={createJtbdMutation.isPending}
                onCancel={() => {
                  setShowNewJtbdForm(false);
                  setSubJobParentId(null);
                }}
                parentId={subJobParentId || undefined}
                allJtbds={jtbds}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredJtbds.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Layers className="h-12 w-12 text-gray-400 mb-2" />
          <h2 className="text-xl font-medium text-gray-600">No Jobs to be Done found</h2>
          <p className="text-gray-500 mt-1">
            {search || categoryFilter !== "ALL" || priorityFilter !== "ALL"
              ? "No results match your search criteria"
              : "Create your first JTBD to get started"}
          </p>
          {(search || categoryFilter !== "ALL" || priorityFilter !== "ALL") && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearch("");
                setCategoryFilter("ALL");
                setPriorityFilter("ALL");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="text-sm text-gray-500 px-3 py-2 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="font-medium">Jobs to be Done Hierarchy</span>
              <Badge variant="outline" className="text-xs">
                {filteredJtbds.length} main {filteredJtbds.length === 1 ? 'job' : 'jobs'}
              </Badge>
            </div>
          </div>
          
          {/* Job Items */}
          <div className="space-y-2">
            {filteredJtbds.map((jtbd) => (
              <JobItem 
                key={jtbd.id}
                jtbd={jtbd}
                level={0}
                childrenMap={organizedJtbds.childrenMap}
                expandedItems={expandedItems}
                setExpandedItems={setExpandedItems}
                onEdit={setEditingJtbd}
                onAddSubJob={(id: number) => {
                  setSubJobParentId(id);
                  setShowNewJtbdForm(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingJtbd && (
        <Dialog open={!!editingJtbd} onOpenChange={(open) => !open && setEditingJtbd(null)}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit Job to be Done</DialogTitle>
            </DialogHeader>
            <JtbdForm
              onSubmit={handleUpdateSubmit}
              initialData={editingJtbd}
              isLoading={updateJtbdMutation.isPending}
              onCancel={() => setEditingJtbd(null)}
              onDelete={handleDeleteClick}
              allJtbds={jtbds}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete this job? This action cannot be undone.
            </p>
            {editingJtbd && organizedJtbds.childrenMap[editingJtbd.id]?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm">
                <p className="font-medium">Warning: This job has sub-jobs</p>
                <p className="mt-1">Deleting this job will also delete all its sub-jobs.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteJtbdMutation.isPending}
            >
              {deleteJtbdMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}