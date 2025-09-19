import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SearchMultiselect } from "@/components/search-multiselect";
import { GripVertical, Settings, Filter, Search, X, Save, Bookmark, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Column configuration type
export type ColumnConfig = {
  id: string;
  name: string;
  visible: boolean;
  render: (item: any) => React.ReactNode;
  sortField?: string;
};

// Filter configuration type
export type FilterConfig = {
  id: string;
  name: string;
  options?: { label: string | null; value: string | null }[];
  value?: string;
  onChange?: ((value: string) => void) | ((values: string[]) => void);
  customComponent?: React.ReactNode;
  isActive?: () => boolean; // Custom function to determine if filter is active
  enableCustomFilters?: boolean; // Enable custom filter save/load for this filter
  // For SearchMultiselect components
  component?: "searchMultiselect";
  apiEndpoint?: string;
  selectedValues?: string[];
  formatOption?: (option: any) => { label: string; value: string };
};

// Props for the ConfigurableTable component
interface ConfigurableTableProps<T> {
  data: T[];
  columns: ColumnConfig[];
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onRowClick?: (item: T) => void;
  rowClassName?: string;
  storeConfigKey?: string; // Key for local storage
  filters?: FilterConfig[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  emptyStateMessage?: string;
  onApplyFilters?: () => void;
  hasUnappliedFilters?: boolean;
  isLoading?: boolean;
}

// Props for the sortable item component
interface SortableItemProps {
  id: string;
  name: string;
  visible: boolean;
  onChange: (id: string, visible: boolean) => void;
}

// Sortable item for the column configuration dialog
function SortableItem({ id, name, visible, onChange }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded mb-2 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center space-x-3">
        <div className="cursor-move text-gray-400 hover:text-gray-600" {...attributes} {...listeners}>
          <GripVertical size={20} />
        </div>
        <Checkbox 
          id={`checkbox-${id}`}
          checked={visible}
          onCheckedChange={() => onChange(id, !visible)}
        />
        <label
          htmlFor={`checkbox-${id}`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {name}
        </label>
      </div>
    </div>
  );
}

// The main ConfigurableTable component
export function ConfigurableTable<T extends { id: number | string }>({
  data,
  columns: initialColumns,
  onSort,
  sortField,
  sortDirection = "asc",
  onRowClick,
  rowClassName = "",
  storeConfigKey = "tableConfig",
  filters = [],
  searchValue = "",
  onSearchChange,
  emptyStateMessage,
  onApplyFilters,
  hasUnappliedFilters,
  isLoading
}: ConfigurableTableProps<T>) {
  // Load column config from local storage or use initial columns
  const loadSavedConfig = useCallback(() => {
    try {
      const savedConfig = localStorage.getItem(`${storeConfigKey}-columns`);
      if (!savedConfig) return initialColumns;
      
      const savedOrder = JSON.parse(savedConfig) as Array<{id: string, visible: boolean}>;
      
      // Start with initial columns to ensure all are present
      const result: ColumnConfig[] = [];
      
      // First, add columns that exist in saved configuration
      savedOrder.forEach(savedCol => {
        const matchingColumn = initialColumns.find(col => col.id === savedCol.id);
        if (matchingColumn) {
          result.push({
            ...matchingColumn,
            visible: savedCol.visible
          });
        }
      });
      
      // Then add any new columns that weren't in the saved configuration
      initialColumns.forEach(initialCol => {
        if (!result.some(col => col.id === initialCol.id)) {
          result.push(initialCol);
        }
      });
      
      return result;
    } catch (error) {
      console.error("Error loading table configuration:", error);
      return initialColumns;
    }
  }, [initialColumns, storeConfigKey]);

  const [columns, setColumns] = useState<ColumnConfig[]>(loadSavedConfig);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState(searchValue);
  
  const visibleColumns = columns.filter(col => col.visible);

  // Count active filters - handle both array and string values
  const activeFilterCount = filters.filter(filter => {
    if (filter.isActive) {
      return filter.isActive();
    }
    // Handle SearchMultiselect components (use selectedValues property)
    if (filter.component === "searchMultiselect" && filter.selectedValues) {
      return Array.isArray(filter.selectedValues) && filter.selectedValues.length > 0;
    }
    // Handle array values (SearchMultiselect components using value property)
    if (Array.isArray(filter.value)) {
      return filter.value.length > 0;
    }
    // Handle string values (regular dropdowns)
    return filter.value && filter.value !== "ALL" && filter.value !== "";
  }).length;

  // Update search value when changed externally
  useEffect(() => {
    setSearchInputValue(searchValue);
  }, [searchValue]);

  // Save column configuration
  const saveColumnConfig = useCallback((newColumns: ColumnConfig[]) => {
    try {
      const configToSave = newColumns.map(({ id, visible }) => ({ id, visible }));
      localStorage.setItem(`${storeConfigKey}-columns`, JSON.stringify(configToSave));
    } catch (error) {
      console.error("Error saving table configuration:", error);
    }
  }, [storeConfigKey]);

  // Handle toggling column visibility
  const handleColumnVisibilityChange = useCallback((columnId: string, isVisible: boolean) => {
    const updatedColumns = columns.map(col => 
      col.id === columnId ? { ...col, visible: isVisible } : col
    );
    setColumns(updatedColumns);
    saveColumnConfig(updatedColumns);
  }, [columns, saveColumnConfig]);

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        saveColumnConfig(newArray);
        return newArray;
      });
    }
  }, [saveColumnConfig]);

  const handleSortClick = (sortFieldValue: string | undefined) => {
    if (onSort && sortFieldValue) {
      onSort(sortFieldValue);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInputValue(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleClearSearch = () => {
    setSearchInputValue("");
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 p-4 bg-white/80 backdrop-blur-sm rounded-md border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-8 pr-8 bg-white border-gray-200"
              value={searchInputValue}
              onChange={handleSearchChange}
            />
            {searchInputValue && (
              <button 
                className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>
        
        <div className="flex gap-3">
          {filters.length > 0 && (
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="relative bg-white border-gray-200 hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Фильтры
                  {activeFilterCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 bg-primary text-white h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-4" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Фильтры</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {filters?.map(filter => (
                      <div key={filter.id} className="space-y-1">
                        {filter.customComponent ? (
                          filter.customComponent
                        ) : filter.component === "searchMultiselect" ? (
                          <>
                            <label className="text-sm font-medium">{filter.name}</label>
                            <SearchMultiselect
                              apiEndpoint={filter.apiEndpoint || ""}
                              placeholder={`Выберите ${filter.name}`}
                              selectedValues={filter.selectedValues || []}
                              onSelectionChange={(values: string[]) => {
                                if (filter.onChange) {
                                  (filter.onChange as (values: string[]) => void)(values);
                                }
                              }}
                              formatOption={filter.formatOption}
                            />
                          </>
                        ) : (
                          <>
                            <label className="text-sm font-medium">{filter.name}</label>
                            <Select value={filter.value} onValueChange={filter.onChange as (value: string) => void}>
                              <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder={`Выберите ${filter.name}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {filter.options?.map(option => (
                                  <SelectItem 
                                    key={option.value || 'empty'} 
                                    value={option.value || ''}
                                  >
                                    {option.label || 'N/A'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </>
                        )}
                      </div>
                    )) || []}
                  </div>
                  <div className="col-span-2 mt-4 flex gap-2">
                    {onApplyFilters && (
                      <Button 
                        variant={hasUnappliedFilters ? "default" : "outline"}
                        size="sm" 
                        onClick={onApplyFilters}
                        className={`flex-1 ${hasUnappliedFilters 
                          ? "bg-primary hover:bg-primary/90 text-white" 
                          : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Применить фильтры
                      </Button>
                    )}
                    {activeFilterCount > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 bg-white"
                        onClick={() => {
                          // Reset all filters to empty arrays or "ALL"
                          filters?.forEach(filter => {
                            if (filter.onChange) {
                              // For SearchMultiselect components, reset to empty array
                              if (filter.component === "searchMultiselect") {
                                (filter.onChange as (value: string[]) => void)([]);
                              } else if (Array.isArray(filter.value)) {
                                (filter.onChange as (value: string[]) => void)([]);
                              } else if (filter.value !== "ALL") {
                                // For regular dropdowns, reset to "ALL"
                                (filter.onChange as (value: string) => void)("ALL");
                              }
                            }
                          });
                          // Auto-apply filters after clearing
                          if (onApplyFilters) {
                            setTimeout(() => onApplyFilters(), 100);
                          }
                        }}
                      >
                        Очистить все фильтры
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50">
                <Settings className="h-4 w-4 mr-2" />
                Настроить
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Колонки таблицы</DialogTitle>
              </DialogHeader>
              <div className="max-h-[400px] overflow-y-auto p-1">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={columns.map(col => col.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columns.map((column) => (
                      <SortableItem
                        key={column.id}
                        id={column.id}
                        name={column.name}
                        visible={column.visible}
                        onChange={handleColumnVisibilityChange}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden mt-2">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/90 transition-colors duration-200">
              {visibleColumns.map((column) => (
                <TableHead key={column.id} className="font-medium py-4">
                  {column.sortField && onSort ? (
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium hover:bg-transparent hover:text-primary"
                      onClick={() => handleSortClick(column.sortField)}
                    >
                      {column.name}
                      {sortField === column.sortField && (
                        <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </Button>
                  ) : (
                    column.name
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-16">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500 mr-2" />
                    <span className="text-gray-500">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-gray-500">
                  {emptyStateMessage || "Нет доступных данных"}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className={`${rowClassName} ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {visibleColumns.map((column) => (
                    <TableCell key={`${item.id}-${column.id}`}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}