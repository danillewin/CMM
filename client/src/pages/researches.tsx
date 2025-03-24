import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Research, ResearchStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinkifiedText } from "@/components/linkified-text";

export default function Researches() {
  const [search, setSearch] = useState("");
  const [researcherFilter, setResearcherFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
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

  // Get unique researchers and teams for filters
  const researchers = [...new Set(researches.map(r => r.researcher))].sort();
  const teams = [...new Set(researches.map(r => r.team))].sort();

  const filteredResearches = researches.filter(
    (research) =>
      (research.name.toLowerCase().includes(search.toLowerCase()) ||
        research.team.toLowerCase().includes(search.toLowerCase()) ||
        research.description.toLowerCase().includes(search.toLowerCase())) &&
      (researcherFilter === "ALL" || research.researcher === researcherFilter) &&
      (teamFilter === "ALL" || research.team === teamFilter) &&
      (statusFilter === "ALL" || research.status === statusFilter)
  );

  const handleRowClick = (research: Research) => {
    setEditResearch(research);
    setShowForm(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
      <div className="container mx-auto max-w-[1400px] space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Researches</h1>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200">
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search researches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          <Select 
            value={researcherFilter} 
            onValueChange={setResearcherFilter}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by researcher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Researchers</SelectItem>
              {researchers.map((researcher) => (
                <SelectItem key={researcher} value={researcher}>
                  {researcher}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={teamFilter} 
            onValueChange={setTeamFilter}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.values(ResearchStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/80 transition-colors duration-200">
                    <TableHead className="w-[20%]">Name</TableHead>
                    <TableHead className="w-[15%]">Team</TableHead>
                    <TableHead className="w-[15%]">Researcher</TableHead>
                    <TableHead className="w-[20%]">Description</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[10%]">Start Date</TableHead>
                    <TableHead className="w-[10%]">End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResearches.map((research) => (
                    <TableRow
                      key={research.id}
                      className="cursor-pointer hover:bg-gray-50/80 transition-all duration-200"
                      onClick={() => handleRowClick(research)}
                    >
                      <TableCell className="font-medium text-gray-900">{research.name}</TableCell>
                      <TableCell className="text-gray-700">{research.team}</TableCell>
                      <TableCell className="text-gray-700">{research.researcher}</TableCell>
                      <TableCell className="truncate max-w-[400px] text-gray-600">
                        <LinkifiedText text={research.description} />
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${research.status === ResearchStatus.DONE ? 'bg-green-100 text-green-800' :
                            research.status === ResearchStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {research.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">{new Date(research.dateStart).toLocaleDateString()}</TableCell>
                      <TableCell className="text-gray-600">{new Date(research.dateEnd).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}