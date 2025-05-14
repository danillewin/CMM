import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Research, ResearchStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkifiedText } from "@/components/linkified-text";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "table" | "cards";

export default function Researches() {
  const [search, setSearch] = useState("");
  const [researcherFilter, setResearcherFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: researches = [], isLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  // Get unique researchers and teams for filters
  const researchersSet = new Set(researches.map(r => r.researcher));
  const researchers = Array.from(researchersSet).sort();
  
  const teamsSet = new Set(researches.map(r => r.team));
  const teams = Array.from(teamsSet).sort();

  const filteredResearches = researches.filter(
    (research) =>
      (research.name.toLowerCase().includes(search.toLowerCase()) ||
        research.team.toLowerCase().includes(search.toLowerCase()) ||
        research.description.toLowerCase().includes(search.toLowerCase())) &&
      (researcherFilter === "ALL" || research.researcher === researcherFilter) &&
      (teamFilter === "ALL" || research.team === teamFilter) &&
      (statusFilter === "ALL" || research.status === statusFilter)
  );

  const handleItemClick = (research: Research) => {
    setLocation(`/researches/${research.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
        <div className="container mx-auto max-w-[1400px] space-y-8">
          <SectionLoader text="Loading researches..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
      <div className="container mx-auto max-w-[1400px] space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Researches</h1>
          <div className="flex items-center gap-4">
            <Button 
              className="bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200"
              onClick={() => setLocation("/researches/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Research
            </Button>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="cards">Card View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search researches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={researcherFilter} onValueChange={setResearcherFilter}>
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
          <Select value={teamFilter} onValueChange={setTeamFilter}>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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

        {filteredResearches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No researches found matching your filters</p>
          </div>
        ) : viewMode === "table" ? (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/80 transition-colors duration-200">
                      <TableHead className="w-[3%]"></TableHead>
                      <TableHead className="w-[20%]">Name</TableHead>
                      <TableHead className="w-[15%]">Team</TableHead>
                      <TableHead className="w-[15%]">Researcher</TableHead>
                      <TableHead className="w-[10%]">Status</TableHead>
                      <TableHead className="w-[10%]">Start Date</TableHead>
                      <TableHead className="w-[10%]">End Date</TableHead>
                      <TableHead className="w-[17%]">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResearches.map((research) => (
                      <TableRow
                        key={research.id}
                        className="cursor-pointer hover:bg-gray-50/80 transition-all duration-200"
                        onClick={() => handleItemClick(research)}
                      >
                        <TableCell className="align-top py-3">
                          <div
                            className="w-3 h-3 rounded-full mt-1"
                            style={{ backgroundColor: research.color }}
                          ></div>
                        </TableCell>
                        <TableCell className="font-medium align-top py-3">{research.name}</TableCell>
                        <TableCell className="align-top py-3">{research.team}</TableCell>
                        <TableCell className="align-top py-3">{research.researcher}</TableCell>
                        <TableCell className="align-top py-3 w-[100px]">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]
                            ${research.status === ResearchStatus.DONE ? 'bg-green-100 text-green-800' :
                              research.status === ResearchStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'}`} title={research.status}>
                            {research.status}
                          </span>
                        </TableCell>
                        <TableCell className="align-top py-3">{new Date(research.dateStart).toLocaleDateString()}</TableCell>
                        <TableCell className="align-top py-3">{new Date(research.dateEnd).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[300px] truncate align-top py-3">
                          <LinkifiedText text={research.description} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResearches.map((research) => (
              <Card
                key={research.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden border-0 bg-white/80 backdrop-blur-sm"
                onClick={() => handleItemClick(research)}
              >
                <div className="h-2" style={{ backgroundColor: research.color }} />
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {research.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]
                      ${research.status === ResearchStatus.DONE ? 'bg-green-100 text-green-800' :
                        research.status === ResearchStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}`} title={research.status}>
                      {research.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Team</p>
                    <p className="text-sm text-gray-900">{research.team}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Researcher</p>
                    <p className="text-sm text-gray-900">{research.researcher}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <div className="text-sm text-gray-900 line-clamp-3">
                      <LinkifiedText text={research.description} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Start Date</p>
                      <p className="text-sm text-gray-900">
                        {new Date(research.dateStart).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">End Date</p>
                      <p className="text-sm text-gray-900">
                        {new Date(research.dateEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}