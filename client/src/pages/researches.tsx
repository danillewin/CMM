import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Research } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ResearchForm from "@/components/research-form";

export default function Researches() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editResearch, setEditResearch] = useState<Research | null>(null);
  const { toast } = useToast();

  const { data: researches = [], isLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  const createMutation = useMutation({
    mutationFn: async (research: Omit<Research, "id">) => {
      const res = await apiRequest("POST", "/api/researches", research);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      setShowForm(false);
      toast({ title: "Research created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...research }: Research) => {
      const res = await apiRequest("PATCH", `/api/researches/${id}`, research);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      setShowForm(false);
      setEditResearch(null);
      toast({ title: "Research updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/researches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      toast({ title: "Research deleted successfully" });
    },
  });

  const handleSubmit = (data: Omit<Research, "id">) => {
    if (editResearch) {
      updateMutation.mutate({ ...data, id: editResearch.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredResearches = researches.filter(
    (research) =>
      research.name.toLowerCase().includes(search.toLowerCase()) ||
      research.team.toLowerCase().includes(search.toLowerCase()) ||
      research.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleRowClick = (research: Research) => {
    setEditResearch(research);
    setShowForm(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Researches</h1>

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6">
        <Input
          placeholder="Search researches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80"
        />

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Research
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90vw] max-w-xl">
            <ResearchForm
              onSubmit={handleSubmit}
              initialData={editResearch}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={() => {
                setShowForm(false);
                setEditResearch(null);
              }}
              onDelete={editResearch ? () => {
                deleteMutation.mutate(editResearch.id);
                setShowForm(false);
                setEditResearch(null);
              } : undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Name</TableHead>
                <TableHead className="w-[15%]">Team</TableHead>
                <TableHead className="w-[35%]">Description</TableHead>
                <TableHead className="w-[15%]">Start Date</TableHead>
                <TableHead className="w-[15%]">End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResearches.map((research) => (
                <TableRow
                  key={research.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => handleRowClick(research)}
                >
                  <TableCell className="font-medium">{research.name}</TableCell>
                  <TableCell>{research.team}</TableCell>
                  <TableCell className="truncate max-w-[400px]">{research.description}</TableCell>
                  <TableCell>{new Date(research.dateStart).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(research.dateEnd).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
