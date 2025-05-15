import { useState, useCallback } from "react";
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { GripVertical, Settings } from "lucide-react";

// Column configuration type
export type ColumnConfig = {
  id: string;
  name: string;
  visible: boolean;
  render: (item: any) => React.ReactNode;
  sortField?: string;
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
  storeConfigKey = "tableConfig"
}: ConfigurableTableProps<T>) {
  // Load column config from local storage or use initial columns
  const loadSavedConfig = useCallback(() => {
    try {
      const savedConfig = localStorage.getItem(`${storeConfigKey}-columns`);
      if (!savedConfig) return initialColumns;
      
      const savedOrder = JSON.parse(savedConfig) as Array<{id: string, visible: boolean}>;
      
      // Ensure all initial columns are present and merge with saved configuration
      const mergedColumns = [...initialColumns];
      
      // Update visibility and order based on saved config
      return savedOrder.map(savedCol => {
        const matchingColumn = mergedColumns.find(col => col.id === savedCol.id);
        if (matchingColumn) {
          return {
            ...matchingColumn,
            visible: savedCol.visible
          };
        }
        return null;
      }).filter(Boolean) as ColumnConfig[];
    } catch (error) {
      console.error("Error loading table configuration:", error);
      return initialColumns;
    }
  }, [initialColumns, storeConfigKey]);

  const [columns, setColumns] = useState<ColumnConfig[]>(loadSavedConfig);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const visibleColumns = columns.filter(col => col.visible);

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

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure Columns
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Table Columns</DialogTitle>
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

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/80 transition-colors duration-200">
              {visibleColumns.map((column) => (
                <TableHead key={column.id} className="font-medium">
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
            {data.map((item) => (
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}