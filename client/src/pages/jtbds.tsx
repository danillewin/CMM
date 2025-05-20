import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pencil, Trash, Plus, Tag, Target, Layers, ChevronRight, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
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
      description: initialData?.description || "",
      category: initialData?.category || "",
      priority: initialData?.priority || "",
      parentId: parentId !== undefined ? parentId : initialData?.parentId || 0
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

  // Create new JTBD
  const createJtbdMutation = useMutation({
    mutationFn: async (jtbd: InsertJtbd) => {
      const res = await apiRequest("POST", "/api/jtbds", jtbd);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jtbds"] });
      setShowNewJtbdForm(false);
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
        description: jtbd.description,
        category: jtbd.category || null,
        priority: jtbd.priority || null
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

  // Filter JTBDs
  const filteredJtbds = jtbds.filter(
    (jtbd) => {
      return (
        (jtbd.title.toLowerCase().includes(search.toLowerCase()) ||
        jtbd.description.toLowerCase().includes(search.toLowerCase())) &&
        (categoryFilter === "ALL" || jtbd.category === categoryFilter) &&
        (priorityFilter === "ALL" || jtbd.priority === priorityFilter)
      );
    }
  );

  // Handle form submissions
  const handleCreateSubmit = (data: InsertJtbd) => {
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
          <Dialog open={showNewJtbdForm} onOpenChange={setShowNewJtbdForm}>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <Plus className="mr-2 h-4 w-4" /> Add JTBD
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Job to be Done</DialogTitle>
              </DialogHeader>
              <JtbdForm
                onSubmit={handleCreateSubmit}
                isLoading={createJtbdMutation.isPending}
                onCancel={() => setShowNewJtbdForm(false)}
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
            {search || categoryFilter || priorityFilter
              ? "No results match your search criteria"
              : "Create your first JTBD to get started"}
          </p>
          {(search || categoryFilter || priorityFilter) && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setPriorityFilter("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full border rounded-lg shadow-sm">
          <div className="bg-gray-50 p-3 border-b rounded-t-lg">
            <div className="grid grid-cols-12 text-sm font-medium text-gray-500">
              <div className="col-span-5">Title</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
          </div>
          
          <div className="divide-y">
            {filteredJtbds.map((jtbd) => (
              <div key={jtbd.id} className="hover:bg-gray-50">
                <div className="p-3 grid grid-cols-12 items-center">
                  <div className="col-span-5 font-medium flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 p-0 mr-1 hover:bg-gray-100" 
                      onClick={() => setExpandedItems(prev => ({
                        ...prev,
                        [jtbd.id]: !prev[jtbd.id]
                      }))}
                    >
                      {expandedItems[jtbd.id] ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                    {jtbd.title}
                  </div>
                  <div className="col-span-3">
                    {jtbd.category && (
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Tag className="h-3 w-3" />
                        {jtbd.category}
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-2">
                    {jtbd.priority && (
                      <Badge 
                        variant={
                          jtbd.priority === "High" ? "destructive" : 
                          jtbd.priority === "Medium" ? "default" : "outline"
                        }
                        className="flex items-center gap-1 w-fit"
                      >
                        <Target className="h-3 w-3" />
                        {jtbd.priority}
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingJtbd(jtbd)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500"
                      title="Add sub-job (coming soon)"
                      onClick={() => {
                        toast({
                          title: "Coming soon",
                          description: "Creating sub-jobs will be available in a future update",
                        });
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Description expandable section */}
                {expandedItems[jtbd.id] && (
                  <div className="px-10 py-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-100">
                    <div className="font-medium mb-1 text-gray-700">Description:</div>
                    <LinkifiedText text={jtbd.description} />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Edit Dialog - moved outside the loop but keeping the same functionality */}
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
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this Job to be Done?</p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone and will remove all associations with researches and meetings.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cancelDelete}
              disabled={deleteJtbdMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteJtbdMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}