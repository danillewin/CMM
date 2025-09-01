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
  "Функциональная",
  "Эмоциональная",
  "Социальная",
  "Финансовая",
  "Экономящая время",
  "Другая"
];

// JTBD Priorities
const JTBD_PRIORITIES = [
  "Высокий",
  "Средний",
  "Низкий"
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
  // Determine the level based on existing data or parent
  const itemLevel = initialData?.level || (parentId ? (allJtbds.find(j => j.id === parentId)?.level || 1) + 1 : 1);
  
  const form = useForm<InsertJtbd & { parentId?: number }>({
    resolver: zodResolver(
      insertJtbdSchema.extend({
        title: itemLevel < 3 ? z.string().min(1, "Название обязательно") : z.string().optional(),
        description: itemLevel < 3 ? z.string().min(1, "Описание обязательно") : z.string().optional(),
        jobStatement: z.string().optional(),
        jobStory: z.string().optional(),
        parentId: z.number().optional(),
        level: z.number().min(1).max(3),
        contentType: itemLevel === 3 ? z.enum(["job_story", "job_statement"]) : z.string().optional()
      }).refine((data) => {
        if (itemLevel === 3) {
          if (data.contentType === "job_story") {
            return data.jobStory && data.jobStory.trim().length > 0;
          } else if (data.contentType === "job_statement") {
            return data.jobStatement && data.jobStatement.trim().length > 0;
          }
        }
        return true;
      }, {
        message: "Контент обязателен для Job Stories и Job Statements",
        path: ["jobStatement"]
      })
    ),
    defaultValues: {
      title: initialData?.title || "",
      jobStatement: initialData?.jobStatement || "",
      jobStory: initialData?.jobStory || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      priority: initialData?.priority || "",
      parentId: parentId !== undefined ? parentId : initialData?.parentId || undefined,
      level: initialData?.level || itemLevel,
      contentType: initialData?.contentType || (itemLevel === 3 ? "job_statement" : undefined)
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title - Only for Level 1 & 2 */}
        {itemLevel < 3 && (
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {itemLevel === 1 ? "Main Job Title" : "Job Title"} <RequiredFieldIndicator />
                </FormLabel>
                <FormControl>
                  <Input placeholder={`Enter ${itemLevel === 1 ? "main job" : "sub-job"} title`} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Description - Only for Level 1 & 2 */}
        {itemLevel < 3 && (
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
                    placeholder={`Describe the ${itemLevel === 1 ? "main job" : "sub-job"} to be done`}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Content Type Selection - Only for Level 3 */}
        {itemLevel === 3 && (
          <FormField
            control={form.control}
            name="contentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content Type <RequiredFieldIndicator /></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип контента" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="job_statement">📋 Job Statement</SelectItem>
                    <SelectItem value="job_story">📖 Job Story</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Job Statement - Only for Level 3 */}
        {itemLevel === 3 && form.watch("contentType") !== "job_story" && (
          <FormField
            control={form.control}
            name="jobStatement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Job Statement <RequiredFieldIndicator />
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="When I [situation], I want to [motivation], so I can [expected outcome]"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Job Story - Only for Level 3 and if content type is job_story */}
        {itemLevel === 3 && form.watch("contentType") === "job_story" && (
          <FormField
            control={form.control}
            name="jobStory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Job Story <RequiredFieldIndicator />
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="As a [type of user], I want [goal] so that [benefit]"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                      <SelectValue placeholder="Выберите категорию" />
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
                      <SelectValue placeholder="Выберите приоритет" />
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
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : (
                `${initialData ? "Update" : "Create"} JTBD`
              )}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Helper function to get icon based on level
function getJtbdIcon(level: number) {
  if (level === 1) {
    return <Briefcase className="h-5 w-5 text-blue-600" />;
  } else if (level === 2) {
    return <ListChecks className="h-4 w-4 text-green-600" />;
  } else {
    // Level 3 are job stories/statements
    return <FileText className="h-4 w-4 text-orange-500" />;
  }
}

// Helper function to get typography classes based on level
function getTypographyClasses(level: number) {
  if (level === 1) {
    return "text-xl font-bold text-gray-900"; // H1 style
  } else if (level === 2) {
    return "text-lg font-semibold text-gray-800"; // H2 style
  } else {
    return "text-base font-medium text-gray-700"; // Body style
  }
}

// Component for rendering Level 3 job stories/statements
function JobStoryCard({ jtbd, onEdit }: { jtbd: Jtbd; onEdit: (jtbd: Jtbd) => void }) {
  const contentType = jtbd.contentType || 'job_statement';
  const content = contentType === 'job_story' ? jtbd.jobStory : jtbd.jobStatement;
  
  if (!content) return null;
  
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/60 p-4 mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {getJtbdIcon(3)}
          <div className="flex-1 space-y-2">
            {/* Content Type Badge */}
            <Badge 
              variant={contentType === 'job_story' ? 'default' : 'secondary'}
              className="text-xs font-medium"
            >
              {contentType === 'job_story' ? '📖 Job Story' : '📋 Job Statement'}
            </Badge>
            
            {/* Main Content */}
            <div className="text-sm text-gray-800 leading-relaxed">
              <LinkifiedText text={content} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
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
            className="h-7 w-7 opacity-70 hover:opacity-100"
            onClick={() => onEdit(jtbd)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Component for rendering a single job item with its children
function JobItem({ 
  jtbd, 
  childrenMap, 
  expandedItems, 
  setExpandedItems, 
  onEdit, 
  onAddSubJob 
}: {
  jtbd: Jtbd;
  childrenMap: Record<number, Jtbd[]>;
  expandedItems: Record<number, boolean>;
  setExpandedItems: (fn: (prev: Record<number, boolean>) => Record<number, boolean>) => void;
  onEdit: (jtbd: Jtbd) => void;
  onAddSubJob: (id: number) => void;
}) {
  const hasChildren = childrenMap[jtbd.id]?.length > 0;
  const isExpanded = expandedItems[jtbd.id];
  const level = jtbd.level || 1;
  const indentLevel = (level - 1) * 24; // 24px per level
  
  // For level 3 items (job stories/statements), render as cards
  if (level === 3) {
    return (
      <div className="ml-12 mb-3">
        <JobStoryCard jtbd={jtbd} onEdit={onEdit} />
      </div>
    );
  }
  
  // Recursive function to render child jobs
  const renderChildren = () => {
    if (!hasChildren || !isExpanded) return null;
    
    return (
      <div className={`${level < 3 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
        {childrenMap[jtbd.id].map((childJob: Jtbd) => (
          <JobItem 
            key={childJob.id}
            jtbd={childJob}
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
    <div className="mb-3">
      <div 
        className={`
          group hover:bg-gray-50/80 rounded-lg transition-colors duration-150
          ${level === 1 ? 'border-b border-gray-100 pb-3 mb-4' : ''}
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
              onClick={() => setExpandedItems((prev: Record<number, boolean>) => ({
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
            {getJtbdIcon(level)}
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
            
            {/* Description - always shown for level 1 & 2 */}
            {jtbd.description && (
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
            {level < 3 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title={level === 1 ? "Add sub-job" : "Add job story/statement"}
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
  const { t } = useTranslation();
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
    // Get all top-level jobs (level 1 or parentId is null/0)
    const topLevelJobs = jtbds.filter(jtbd => jtbd.level === 1 || (!jtbd.parentId || jtbd.parentId === 0));
    
    // Map of parent IDs to their child jobs
    const childrenMap: Record<number, Jtbd[]> = {};
    
    // Group children by parent ID
    jtbds.forEach(jtbd => {
      if (jtbd.parentId && jtbd.parentId !== 0) {
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
        (jtbd.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (jtbd.description || '').toLowerCase().includes(search.toLowerCase());
      
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jtbds"], exact: true });
      setShowNewJtbdForm(false);
      setSubJobParentId(null);
      toast({
        title: "JTBD created",
        description: "The job to be done was successfully created.",
      });
    },
    onError: (error: any) => {
      console.error('Create JTBD error:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to create JTBD';
      toast({
        title: "Failed to create JTBD",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update JTBD
  const updateJtbdMutation = useMutation({
    mutationFn: async ({ id, ...jtbd }: { id: number } & Partial<Jtbd>) => {
      const res = await apiRequest("PATCH", `/api/jtbds/${id}`, {
        title: jtbd.title || "",
        jobStatement: jtbd.jobStatement || "",
        jobStory: jtbd.jobStory || "",
        description: jtbd.description || "",
        category: jtbd.category || "",
        priority: jtbd.priority || "",
        level: jtbd.level,
        contentType: jtbd.level === 3 ? jtbd.contentType : null,
        parentId: jtbd.parentId
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jtbds"], exact: true });
      setEditingJtbd(null);
      toast({
        title: "JTBD updated",
        description: "The job to be done was successfully updated.",
      });
    },
    onError: (error: any) => {
      console.error('Update JTBD error:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to update JTBD';
      toast({
        title: "Failed to update JTBD",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete JTBD
  const deleteJtbdMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/jtbds/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jtbds"], exact: true });
      setEditingJtbd(null);
      setDeleteDialogOpen(false);
      toast({
        title: "JTBD deleted",
        description: "The job to be done was successfully deleted.",
      });
    },
    onError: (error: any) => {
      console.error('Delete JTBD error:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to delete JTBD';
      toast({
        title: "Failed to delete JTBD",
        description: errorMessage,
        variant: "destructive",
      });
      setDeleteDialogOpen(false); // Close dialog on error
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
        <h1 className="text-2xl font-bold">{"Jobs to be Done"}</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Поиск Jobs To Be Done..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[300px]"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все категории</SelectItem>
              {JTBD_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Приоритет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все приоритеты</SelectItem>
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
                <Plus className="mr-2 h-4 w-4" /> {"Создать"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]" aria-describedby="new-jtbd-description">
              <DialogHeader>
                <DialogTitle>
                  {subJobParentId 
                    ? (() => {
                        const parentLevel = jtbds.find(j => j.id === subJobParentId)?.level || 1;
                        const newLevel = parentLevel + 1;
                        return newLevel === 2 ? "Create New Sub-Job" : "Create New Job Story/Statement";
                      })()
                    : "Create New Main Job"
                  }
                </DialogTitle>
                <div id="new-jtbd-description" className="sr-only">
                  Form to create a new job to be done item
                </div>
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
          <h2 className="text-xl font-medium text-gray-600">{"Сохранить"}</h2>
          <p className="text-gray-500 mt-1">
            {search || categoryFilter !== "ALL" || priorityFilter !== "ALL"
              ? "Нет результатов, соответствующих вашим критериям поиска"
              : "Создайте ваш первый JTBD, чтобы начать"}
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
              Очистить фильтры
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="text-sm text-gray-500 px-3 py-2 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="font-medium">Иерархия Jobs to be Done</span>
              <Badge variant="outline" className="text-xs">
                {filteredJtbds.length} основных {filteredJtbds.length === 1 ? 'работа' : 'работ'}
              </Badge>
            </div>
          </div>
          
          {/* Job Items */}
          <div className="space-y-2">
            {filteredJtbds.map((jtbd) => (
              <JobItem 
                key={jtbd.id}
                jtbd={jtbd}
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
          <DialogContent className="sm:max-w-[550px]" aria-describedby="edit-jtbd-description">
            <DialogHeader>
              <DialogTitle>
                {editingJtbd.level === 1 ? "Edit Main Job" : 
                 editingJtbd.level === 2 ? "Edit Sub-Job" : 
                 "Edit Job Story/Statement"}
              </DialogTitle>
              <div id="edit-jtbd-description" className="sr-only">
                Form to edit the selected job to be done item
              </div>
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
        <DialogContent className="sm:max-w-[425px]" aria-describedby="delete-confirmation-description">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <div id="delete-confirmation-description" className="sr-only">
              Confirmation dialog to delete the selected job to be done item
            </div>
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
              {deleteJtbdMutation.isPending ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}