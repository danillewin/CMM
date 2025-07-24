import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CustomFilter, InsertCustomFilter } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Save, 
  Plus, 
  Filter, 
  Trash2, 
  Edit, 
  Users, 
  Lock 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface FilterData {
  // Common filters
  search?: string;
  statusFilter?: string;
  
  // Meetings specific
  researchFilter?: number | null;
  managerFilter?: string;
  recruiterFilter?: string;
  researcherFilter?: string;
  positionFilter?: string;
  giftFilter?: string;
  
  // Researches specific
  teamFilter?: string;
  researchTypeFilters?: string[];
  productFilters?: string[];
  showStartsInNWeeks?: boolean;
  weeksNumber?: string;
  
  // Calendar specific
  selectedResearchIds?: number[];
}

interface CustomFilterManagerProps {
  pageType: "meetings" | "researches" | "calendar";
  currentFilters: FilterData;
  onApplyFilter: (filters: FilterData) => void;
  onResetFilters: () => void;
}

export default function CustomFilterManager({
  pageType,
  currentFilters,
  onApplyFilter,
  onResetFilters,
}: CustomFilterManagerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [editingFilter, setEditingFilter] = useState<CustomFilter | null>(null);

  // Get current user - for demo purposes, use a placeholder
  const currentUser = "demo-user";

  // Fetch saved filters for this page type
  const { data: savedFilters = [], refetch: refetchFilters } = useQuery<CustomFilter[]>({
    queryKey: ["/api/custom-filters", { pageType }],
    queryFn: async () => {
      const response = await fetch(`/api/custom-filters?pageType=${pageType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch filters');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Create filter mutation
  const createFilterMutation = useMutation({
    mutationFn: async (data: InsertCustomFilter) => {
      const response = await apiRequest("POST", "/api/custom-filters", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t("filters.saveSuccess") });
      setIsCreateDialogOpen(false);
      resetForm();
      refetchFilters();
    },
    onError: (error: Error) => {
      toast({
        title: t("errors.generic"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update filter mutation
  const updateFilterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCustomFilter> }) => {
      const response = await apiRequest("PATCH", `/api/custom-filters/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t("filters.updateSuccess") });
      setIsCreateDialogOpen(false);
      resetForm();
      refetchFilters();
    },
    onError: (error: Error) => {
      toast({
        title: t("errors.generic"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete filter mutation
  const deleteFilterMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/custom-filters/${id}`);
    },
    onSuccess: () => {
      toast({ title: t("filters.deleteSuccess") });
      refetchFilters();
    },
    onError: (error: Error) => {
      toast({
        title: t("errors.generic"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFilterName("");
    setFilterDescription("");
    setIsPublic(false);
    setEditingFilter(null);
  };

  const handleSaveCurrentFilters = () => {
    if (!filterName.trim()) {
      toast({
        title: t("errors.validation"),
        description: t("filters.nameRequired"),
        variant: "destructive",
      });
      return;
    }

    const filterData: InsertCustomFilter = {
      name: filterName.trim(),
      description: filterDescription.trim() || undefined,
      pageType,
      filterData: JSON.stringify(currentFilters),
      createdBy: currentUser,
      isPublic: isPublic ? "true" : "false",
    };

    if (editingFilter) {
      updateFilterMutation.mutate({
        id: editingFilter.id,
        data: filterData,
      });
    } else {
      createFilterMutation.mutate(filterData);
    }
  };

  const handleApplyFilter = (filter: CustomFilter) => {
    try {
      const filterData = JSON.parse(filter.filterData) as FilterData;
      onApplyFilter(filterData);
      toast({ title: t("filters.applied", { name: filter.name }) });
    } catch (error) {
      toast({
        title: t("errors.generic"),
        description: t("filters.corruptedData"),
        variant: "destructive",
      });
    }
  };

  const handleEditFilter = (filter: CustomFilter) => {
    setEditingFilter(filter);
    setFilterName(filter.name);
    setFilterDescription(filter.description || "");
    setIsPublic(filter.isPublic === "true");
    setIsCreateDialogOpen(true);
  };

  const handleDeleteFilter = (id: number) => {
    deleteFilterMutation.mutate(id);
  };

  const hasActiveFilters = () => {
    return Object.values(currentFilters).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value;
      if (typeof value === "string") return value !== "" && value !== "ALL";
      if (typeof value === "number") return value !== null && value !== undefined;
      return false;
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save Current Filters */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={!hasActiveFilters()}
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Save className="h-4 w-4 mr-1" />
            {t("filters.save")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFilter ? t("filters.editFilter") : t("filters.saveFilter")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-name">{t("filters.name")}</Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder={t("filters.namePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="filter-description">{t("filters.description")}</Label>
              <Textarea
                id="filter-description"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                placeholder={t("filters.descriptionPlaceholder")}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="filter-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="filter-public" className="flex items-center gap-2">
                {isPublic ? <Users className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {t("filters.shareWithTeam")}
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSaveCurrentFilters}
                disabled={createFilterMutation.isPending || updateFilterMutation.isPending}
              >
                {editingFilter ? t("common.update") : t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Saved Filters */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            {t("filters.manage")} ({savedFilters.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("filters.savedFilters")}</DialogTitle>
          </DialogHeader>
          
          {savedFilters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("filters.noSavedFilters")}</p>
              <p className="text-sm mt-2">{t("filters.createFirstFilter")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedFilters.map((filter) => (
                <Card key={filter.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">
                          {filter.name}
                        </CardTitle>
                        {filter.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {filter.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={filter.isPublic === "true" ? "default" : "secondary"}>
                            {filter.isPublic === "true" ? (
                              <>
                                <Users className="h-3 w-3 mr-1" />
                                {t("filters.shared")}
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                {t("filters.private")}
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {t("filters.createdBy")} {filter.createdBy}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplyFilter(filter)}
                        >
                          {t("filters.apply")}
                        </Button>
                        {filter.createdBy === currentUser && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditFilter(filter)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("filters.deleteConfirmTitle")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("filters.deleteConfirmMessage", { name: filter.name })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t("common.cancel")}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteFilter(filter.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t("common.delete")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Filters */}
      {hasActiveFilters() && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
        >
          {t("filters.reset")}
        </Button>
      )}
    </div>
  );
}