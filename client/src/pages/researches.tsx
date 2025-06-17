import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Research, ResearchStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
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
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { ConfigurableTable, type ColumnConfig } from "@/components/configurable-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addWeeks } from "date-fns";

type ViewMode = "table" | "cards";

export default function Researches() {
  const [search, setSearch] = useState("");
  const [researcherFilter, setResearcherFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [researchTypeFilters, setResearchTypeFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showStartsInNWeeks, setShowStartsInNWeeks] = useState(false);
  const [weeksNumber, setWeeksNumber] = useState<string>("1");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: researches = [], isLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  // Get unique researchers, teams, and research types for filters
  const researchersSet = new Set(researches.map(r => r.researcher).filter(Boolean));
  const researchers = Array.from(researchersSet).sort();
  
  const teamsSet = new Set(researches.map(r => r.team).filter(Boolean));
  const teams = Array.from(teamsSet).sort();

  const researchTypesSet = new Set(researches.map(r => r.researchType).filter(Boolean));
  const researchTypes = Array.from(researchTypesSet).sort();

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem("researches-table-filters");
      if (savedFilters) {
        const { status, researcher, team, researchTypes, showStartsInNWeeks, weeksNumber } = JSON.parse(savedFilters);
        if (status) setStatusFilter(status);
        if (researcher) setResearcherFilter(researcher);
        if (team) setTeamFilter(team);
        if (researchTypes && Array.isArray(researchTypes)) setResearchTypeFilters(researchTypes);
        if (showStartsInNWeeks !== undefined) setShowStartsInNWeeks(showStartsInNWeeks);
        if (weeksNumber) setWeeksNumber(weeksNumber);
      }
    } catch (error) {
      console.error("Error loading saved filters:", error);
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("researches-table-filters", JSON.stringify({
        status: statusFilter,
        researcher: researcherFilter,
        team: teamFilter,
        researchTypes: researchTypeFilters,
        showStartsInNWeeks,
        weeksNumber
      }));
    } catch (error) {
      console.error("Error saving filters:", error);
    }
  }, [statusFilter, researcherFilter, teamFilter, researchTypeFilters, showStartsInNWeeks, weeksNumber]);

  const getValueForSorting = (research: Research, field: string) => {
    switch (field) {
      case "name": return research.name;
      case "team": return research.team;
      case "researcher": return research.researcher;
      case "researchType": return research.researchType || "Interviews";
      case "status": return research.status;
      case "dateStart": return new Date(research.dateStart).getTime();
      case "dateEnd": return new Date(research.dateEnd).getTime();
      default: return research.name;
    }
  };

  // Calculate date range for "starts in N weeks" filter
  const currentDate = new Date();
  const futureDate = addWeeks(currentDate, parseInt(weeksNumber));
  
  const filteredResearches = researches
    .filter(
      (research) => {
        const startDate = new Date(research.dateStart);
        
        // Check if research starts within the specified weeks range
        const startsInRange = !showStartsInNWeeks || 
          (startDate >= currentDate && startDate <= futureDate);
        
        return (
          (research.name.toLowerCase().includes(search.toLowerCase()) ||
            research.team.toLowerCase().includes(search.toLowerCase()) ||
            (research.researcher?.toLowerCase() || "").includes(search.toLowerCase()) ||
            research.description.toLowerCase().includes(search.toLowerCase())) &&
          (researcherFilter === "ALL" || research.researcher === researcherFilter) &&
          (teamFilter === "ALL" || research.team === teamFilter) &&
          (statusFilter === "ALL" || research.status === statusFilter) &&
          (researchTypeFilters.length === 0 || researchTypeFilters.includes(research.researchType)) &&
          startsInRange
        );
      }
    )
    .sort((a, b) => {
      const aVal = getValueForSorting(a, sortBy);
      const bVal = getValueForSorting(b, sortBy);
      
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const handleItemClick = (research: Research) => {
    setLocation(`/researches/${research.id}`);
  };

  // Prepare column definitions
  const tableColumns: ColumnConfig[] = [
    {
      id: "color",
      name: "",
      visible: true,
      render: (research: Research) => (
        <div
          className="w-3 h-3 rounded-full mt-1"
          style={{ backgroundColor: research.color }}
        ></div>
      )
    },
    {
      id: "name",
      name: "Name",
      visible: true,
      sortField: "name",
      render: (research: Research) => (
        <span className="font-medium">{research.name}</span>
      )
    },
    {
      id: "team",
      name: "Team",
      visible: true,
      sortField: "team",
      render: (research: Research) => research.team
    },
    {
      id: "researchType",
      name: "Research Type",
      visible: true,
      sortField: "researchType",
      render: (research: Research) => (
        <span className="text-sm text-gray-600">{research.researchType || "Interviews"}</span>
      )
    },
    {
      id: "researcher",
      name: "Researcher",
      visible: true,
      sortField: "researcher",
      render: (research: Research) => research.researcher
    },
    {
      id: "status",
      name: "Status",
      visible: true,
      sortField: "status",
      render: (research: Research) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]
          ${research.status === ResearchStatus.DONE ? 'bg-green-100 text-green-800' :
            research.status === ResearchStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'}`} title={research.status}>
          {research.status}
        </span>
      )
    },
    {
      id: "dateStart",
      name: "Start Date",
      visible: true,
      sortField: "dateStart",
      render: (research: Research) => new Date(research.dateStart).toLocaleDateString()
    },
    {
      id: "dateEnd",
      name: "End Date",
      visible: true,
      sortField: "dateEnd",
      render: (research: Research) => new Date(research.dateEnd).toLocaleDateString()
    },
    {
      id: "products",
      name: "Products",
      visible: true,
      render: (research: Research) => (
        <div className="flex flex-wrap gap-1">
          {research.products && research.products.length > 0 ? (
            research.products.slice(0, 3).map((product, index) => (
              <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {product}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs">No products</span>
          )}
          {research.products && research.products.length > 3 && (
            <span className="text-xs text-gray-500">+{research.products.length - 3} more</span>
          )}
        </div>
      )
    },
    {
      id: "description",
      name: "Description",
      visible: false,
      render: (research: Research) => (
        <div className="line-clamp-2 prose prose-sm max-w-none">
          <ReactMarkdown>{research.description}</ReactMarkdown>
        </div>
      )
    }
  ];

  // Prepare filter configurations
  const filterConfigs = [
    {
      id: "status",
      name: "Status",
      options: [
        { label: "All Statuses", value: "ALL" },
        ...Object.values(ResearchStatus).map(status => ({ 
          label: status, 
          value: status 
        }))
      ],
      value: statusFilter || "ALL",
      onChange: setStatusFilter
    },
    {
      id: "researcher",
      name: "Researcher",
      options: [
        { label: "All Researchers", value: "ALL" },
        ...researchers.map(researcher => ({ 
          label: researcher, 
          value: researcher 
        }))
      ],
      value: researcherFilter || "ALL",
      onChange: setResearcherFilter
    },
    {
      id: "team",
      name: "Team",
      options: [
        { label: "All Teams", value: "ALL" },
        ...teams.map(team => ({ 
          label: team, 
          value: team 
        }))
      ],
      value: teamFilter || "ALL",
      onChange: setTeamFilter
    },
    {
      id: "research-type",
      name: "Research Type",
      customComponent: (
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Research Type</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-white"
              >
                {researchTypeFilters.length === 0
                  ? "All Research Types"
                  : `${researchTypeFilters.length} selected`}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="max-h-60 overflow-auto p-1">
                <div className="flex items-center px-3 py-2 border-b">
                  <Checkbox
                    checked={researchTypeFilters.length === 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setResearchTypeFilters([]);
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">All Research Types</span>
                </div>
                {researchTypes.map((type) => (
                  <div key={type} className="flex items-center px-3 py-2 hover:bg-gray-50">
                    <Checkbox
                      checked={researchTypeFilters.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setResearchTypeFilters([...researchTypeFilters, type]);
                        } else {
                          setResearchTypeFilters(researchTypeFilters.filter(t => t !== type));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{type}</span>
                  </div>
                ))}
              </div>
              {researchTypeFilters.length > 0 && (
                <div className="border-t p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResearchTypeFilters([])}
                    className="w-full text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      ),
      options: [],
      value: "",
      onChange: () => {},
      isActive: () => researchTypeFilters.length > 0
    }
  ];

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
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
        
        {/* Start in weeks filter */}
        <div className="bg-white shadow-sm rounded-lg p-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-starts-in-weeks" 
              checked={showStartsInNWeeks}
              onCheckedChange={(checked) => setShowStartsInNWeeks(checked === true)}
            />
            <label 
              htmlFor="show-starts-in-weeks" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Researches that start in {weeksNumber} {weeksNumber === "1" ? "week" : "weeks"}
            </label>
          </div>
          
          {showStartsInNWeeks && (
            <div className="flex items-center space-x-2">
              <Select value={weeksNumber} onValueChange={setWeeksNumber}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="Weeks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {filteredResearches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No researches found matching your filters</p>
          </div>
        ) : viewMode === "table" ? (
          <ConfigurableTable
            data={filteredResearches}
            columns={tableColumns}
            onRowClick={handleItemClick}
            rowClassName="cursor-pointer hover:bg-gray-50/80 transition-all duration-200"
            sortField={sortBy}
            sortDirection={sortDir}
            onSort={handleSort}
            filters={filterConfigs}
            searchValue={search}
            onSearchChange={setSearch}
            storeConfigKey="researches-table-columns"
          />
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
                    <p className="text-sm font-medium text-gray-500">Research Type</p>
                    <p className="text-sm text-gray-900">{research.researchType || "Interviews"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <div className="text-sm text-gray-900 line-clamp-3 prose prose-sm max-w-none">
                      <ReactMarkdown>{research.description}</ReactMarkdown>
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