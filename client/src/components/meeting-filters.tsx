import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UniversalSearchableSelect } from "./universal-searchable-select";

export interface MeetingFilters {
  research: string[];
  manager: string[];
  recruiter: string[];
  researcher: string[];
  position: string[];
  status: string;
  gift: string;
}

interface MeetingFiltersProps {
  filters: MeetingFilters;
  onChange: (filters: MeetingFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "SET", label: "Set" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
  { value: "DECLINED", label: "Declined" }
];

const GIFT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" }
];

export function MeetingFiltersComponent({ filters, onChange, onApply, onClear }: MeetingFiltersProps) {
  const { t } = useTranslation();

  const updateFilter = (key: keyof MeetingFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold">{t("filters.title")}</h3>
      
      {/* Grid layout for filter fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
        {/* Research - Searchable Multi-Select */}
        <div className="space-y-2">
          <Label>{t("filters.research")}</Label>
          <UniversalSearchableSelect
            placeholder={t("filters.research")}
            searchEndpoint="/api/search/researches"
            value={filters.research}
            onChange={(value) => updateFilter("research", value)}
            isMultiSelect={true}
          />
        </div>

        {/* Relationship Manager - Searchable Multi-Select */}
        <div className="space-y-2">
          <Label>{t("filters.manager")}</Label>
          <UniversalSearchableSelect
            placeholder={t("filters.manager")}
            searchEndpoint="/api/search/managers"
            value={filters.manager}
            onChange={(value) => updateFilter("manager", value)}
            isMultiSelect={true}
          />
        </div>

        {/* Recruiter - Searchable Multi-Select */}
        <div className="space-y-2">
          <Label>{t("filters.recruiter")}</Label>
          <UniversalSearchableSelect
            placeholder={t("filters.recruiter")}
            searchEndpoint="/api/search/recruiters"
            value={filters.recruiter}
            onChange={(value) => updateFilter("recruiter", value)}
            isMultiSelect={true}
          />
        </div>

        {/* Researcher - Searchable Multi-Select */}
        <div className="space-y-2">
          <Label>{t("filters.researcher")}</Label>
          <UniversalSearchableSelect
            placeholder={t("filters.researcher")}
            searchEndpoint="/api/search/researchers"
            value={filters.researcher}
            onChange={(value) => updateFilter("researcher", value)}
            isMultiSelect={true}
          />
        </div>

        {/* Position - Searchable Multi-Select */}
        <div className="space-y-2">
          <Label>{t("filters.position")}</Label>
          <UniversalSearchableSelect
            placeholder={t("filters.position")}
            searchEndpoint="/api/search/positions"
            value={filters.position}
            onChange={(value) => updateFilter("position", value)}
            isMultiSelect={true}
          />
        </div>

        {/* Status - Predefined Dropdown */}
        <div className="space-y-2">
          <Label>{t("filters.status")}</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.value === "all" ? t("filters.all") : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gift - Predefined Dropdown */}
        <div className="space-y-2">
          <Label>{t("filters.gift")}</Label>
          <Select value={filters.gift} onValueChange={(value) => updateFilter("gift", value)}>
            <SelectTrigger>
              <SelectValue placeholder={t("filters.gift")} />
            </SelectTrigger>
            <SelectContent>
              {GIFT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.value === "all" ? t("filters.all") : 
                   option.value === "yes" ? t("filters.yes") :
                   option.value === "no" ? t("filters.no") : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4">
        <Button onClick={onApply} className="flex-1">
          {t("filters.applyFilters")}
        </Button>
        <Button variant="outline" onClick={onClear}>
          {t("filters.clearFilters")}
        </Button>
      </div>
    </div>
  );
}