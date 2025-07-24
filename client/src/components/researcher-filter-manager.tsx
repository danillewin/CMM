import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bookmark, Save } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomFilter {
  id: number;
  name: string;
  description?: string;
  pageType: string;
  filters: Record<string, any>;
  shared: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ResearcherFilterManagerProps {
  currentFilters: Record<string, any>;
  onApplyFilter: (filters: Record<string, any>) => void;
  pageType: string;
}

export default function ResearcherFilterManager({ 
  currentFilters, 
  onApplyFilter, 
  pageType 
}: ResearcherFilterManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  const [newFilterDescription, setNewFilterDescription] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch saved filters for researchers
  const { data: savedFilters = [], refetch } = useQuery<CustomFilter[]>({
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

  const saveFilterMutation = useMutation({
    mutationFn: async (filterData: { name: string; description?: string; filters: Record<string, any> }) => {
      return apiRequest("POST", "/api/custom-filters", {
        ...filterData,
        pageType,
        shared: false,
        createdBy: "current-user"
      });
    },
    onSuccess: () => {
      toast({ title: t("filters.saveSuccess", "Filter saved successfully") });
      refetch();
      setIsOpen(false);
      setNewFilterName("");
      setNewFilterDescription("");
    },
    onError: () => {
      toast({ title: "Error saving filter", variant: "destructive" });
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/custom-filters/${id}`);
    },
    onSuccess: () => {
      toast({ title: t("filters.deleteSuccess", "Filter deleted successfully") });
      refetch();
    },
    onError: () => {
      toast({ title: "Error deleting filter", variant: "destructive" });
    },
  });

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) {
      toast({ title: t("filters.nameRequired", "Filter name is required"), variant: "destructive" });
      return;
    }

    saveFilterMutation.mutate({
      name: newFilterName.trim(),
      description: newFilterDescription.trim() || undefined,
      filters: currentFilters
    });
  };

  const handleApplyFilter = (filter: CustomFilter) => {
    onApplyFilter(filter.filters);
    toast({ title: t("filters.applied", "Filter '{{name}}' applied", { name: filter.name }) });
  };

  const hasActiveFilters = Object.values(currentFilters).some(value => {
    if (typeof value === 'string') return value !== "" && value !== "ALL";
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return value !== null && value !== undefined;
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2 h-8 w-8 p-0"
          title={t("filters.saveFilter", "Save Current Filter")}
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("filters.manage", "Manage Research Filters")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Save Current Filter Section */}
          {hasActiveFilters && (
            <div className="space-y-3 border-b pb-4">
              <h4 className="font-medium text-sm">{t("filters.saveFilter", "Save Current Filter")}</h4>
              <div className="space-y-2">
                <Label htmlFor="filter-name">{t("filters.name", "Filter Name")}</Label>
                <Input
                  id="filter-name"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder={t("filters.namePlaceholder", "Enter a name for this filter...")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-description">{t("filters.description", "Description")}</Label>
                <Input
                  id="filter-description"
                  value={newFilterDescription}
                  onChange={(e) => setNewFilterDescription(e.target.value)}
                  placeholder={t("filters.descriptionPlaceholder", "Describe what this filter is for...")}
                />
              </div>
              <Button 
                onClick={handleSaveFilter} 
                disabled={saveFilterMutation.isPending || !newFilterName.trim()}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {t("common.save", "Save")}
              </Button>
            </div>
          )}

          {/* Saved Filters Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">{t("filters.savedFilters", "Saved Filters")}</h4>
            {savedFilters.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("filters.noSavedFilters", "No saved filters yet")}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedFilters.map((filter) => (
                  <div key={filter.id} className="flex items-center justify-between p-2 border rounded-sm">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{filter.name}</div>
                      {filter.description && (
                        <div className="text-xs text-gray-500">{filter.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApplyFilter(filter)}
                        className="h-8 px-2"
                      >
                        {t("filters.apply", "Apply")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFilterMutation.mutate(filter.id)}
                        disabled={deleteFilterMutation.isPending}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                      >
                        {t("common.delete", "Delete")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}