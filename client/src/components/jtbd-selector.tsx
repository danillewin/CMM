import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Target, Tag } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Jtbd } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface JtbdSelectorProps {
  entityId: number;
  entityType: "research" | "meeting";
  selectedJtbds: Jtbd[];
  onJtbdsChange: (jtbds: Jtbd[]) => void;
}

export function JtbdSelector({
  entityId,
  entityType,
  selectedJtbds,
  onJtbdsChange
}: JtbdSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Fetch all JTBDs
  const { data: allJtbds = [], isLoading } = useQuery<Jtbd[]>({
    queryKey: ["/api/jtbds"],
  });

  // Filtered JTBDs based on search
  const filteredJtbds = allJtbds.filter(
    (jtbd) =>
      !selectedJtbds.some((selected) => selected.id === jtbd.id) &&
      ((jtbd.title || '').toLowerCase().includes(search.toLowerCase()) ||
       (jtbd.description || '').toLowerCase().includes(search.toLowerCase()))
  );

  // Fetch JTBDs connected to this entity when the component mounts (only for existing entities)
  useEffect(() => {
    const fetchEntityJtbds = async () => {
      try {
        // Skip API call for new entities (entityId = 0 or undefined)
        if (!entityId || entityId === 0) return;
        
        const response = await apiRequest("GET", `/api/${entityType === 'research' ? 'researches' : entityType + 's'}/${entityId}/jtbds`);
        if (!response.ok) {
          throw new Error(`Error fetching JTBDs: ${response.statusText}`);
        }
        
        const data = await response.json();
        onJtbdsChange(data);
      } catch (error) {
        console.error("Error fetching entity JTBDs:", error);
      }
    };

    fetchEntityJtbds();
  }, [entityId, entityType, onJtbdsChange]);

  // Add a JTBD to the entity
  const addJtbd = async (jtbd: Jtbd) => {
    try {
      // For new entities (entityId = 0), just add to local state without API call
      if (!entityId || entityId === 0) {
        const updatedJtbds = [...selectedJtbds, jtbd];
        onJtbdsChange(updatedJtbds);
        
        toast({
          title: "JTBD added",
          description: `"${jtbd.title}" will be linked when the ${entityType} is saved`
        });
        return;
      }
      
      const res = await apiRequest(
        "POST", 
        `/api/${entityType === 'research' ? 'researches' : entityType + 's'}/${entityId}/jtbds/${jtbd.id}`,
        {}
      );
      
      if (res.ok) {
        const updatedJtbds = [...selectedJtbds, jtbd];
        onJtbdsChange(updatedJtbds);
        
        toast({
          title: "JTBD added",
          description: `Successfully added "${jtbd.title}" to ${entityType}`
        });
      } else {
        throw new Error(`Failed to add JTBD: ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error adding JTBD:", error);
      toast({
        title: "Error",
        description: `Failed to add JTBD: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  // Remove a JTBD from the entity
  const removeJtbd = async (jtbd: Jtbd) => {
    try {
      // For new entities (entityId = 0), just remove from local state without API call
      if (!entityId || entityId === 0) {
        const updatedJtbds = selectedJtbds.filter(j => j.id !== jtbd.id);
        onJtbdsChange(updatedJtbds);
        
        toast({
          title: "JTBD removed",
          description: `Removed "${jtbd.title}" from selection`
        });
        return;
      }
      
      const res = await apiRequest(
        "DELETE", 
        `/api/${entityType === 'research' ? 'researches' : entityType + 's'}/${entityId}/jtbds/${jtbd.id}`
      );
      
      if (res.ok) {
        const updatedJtbds = selectedJtbds.filter(j => j.id !== jtbd.id);
        onJtbdsChange(updatedJtbds);
        
        toast({
          title: "JTBD removed",
          description: `Successfully removed "${jtbd.title}" from ${entityType}`
        });
      } else {
        throw new Error(`Failed to remove JTBD: ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error removing JTBD:", error);
      toast({
        title: "Error",
        description: `Failed to remove JTBD: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const getBadgeVariant = (priority?: string | null) => {
    if (!priority) return "outline";
    return priority === "High" ? "destructive" : 
           priority === "Medium" ? "default" : "outline";
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedJtbds.map((jtbd) => (
          <Badge 
            key={jtbd.id} 
            variant={getBadgeVariant(jtbd.priority)}
            className="flex items-center gap-1 text-sm py-1.5 px-3"
          >
            {jtbd.priority && <Target className="h-3 w-3" />}
            {jtbd.title}
            <button
              className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5"
              onClick={() => removeJtbd(jtbd)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Add JTBD Button */}
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Jobs to be Done</DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                <Command className="rounded-lg border shadow-md">
                  <CommandInput 
                    placeholder="Search jobs..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No jobs found.</CommandEmpty>
                    <CommandGroup>
                      {filteredJtbds.map((jtbd) => (
                        <CommandItem
                          key={jtbd.id}
                          onSelect={() => {
                            addJtbd(jtbd);
                            setSearch("");
                          }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <span>{jtbd.title}</span>
                            {jtbd.category && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {jtbd.category}
                              </Badge>
                            )}
                          </div>
                          {jtbd.priority && (
                            <Badge
                              variant={getBadgeVariant(jtbd.priority)}
                              className="text-xs ml-2"
                            >
                              <Target className="h-2.5 w-2.5 mr-1" />
                              {jtbd.priority}
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
              
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <a href="/jtbds" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    Manage Jobs
                  </Button>
                </a>
              </div>
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
}