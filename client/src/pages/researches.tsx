import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Research, ResearchStatus, ResearchTableItem, PaginatedResponse } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Filter } from "lucide-react";
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
import remarkGfm from 'remark-gfm';
import { useToast } from "@/hooks/use-toast";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ConfigurableTable, type ColumnConfig } from "@/components/configurable-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addWeeks } from "date-fns";
import ResearcherFilterManager from "@/components/researcher-filter-manager";
import { formatDateShort } from "@/lib/date-utils";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { InfiniteScrollTable } from "@/components/infinite-scroll-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SearchMultiselect } from "@/components/search-multiselect";

type ViewMode = "table" | "cards";

export default function Researches() {
  // Function to translate research type from English to Russian
  const translateResearchType = (researchType: string): string => {
    if (!researchType) return "";
    
    // Normalize the research type string to handle variations
    const normalizedType = researchType.toLowerCase().trim();
    
    // Check if type contains specific keywords to map to correct translation
    if (normalizedType.includes("cati") || normalizedType.includes("телефонный")) {
      return "CATI (Телефонный опрос)";
    }
    if (normalizedType.includes("cawi") || normalizedType.includes("онлайн") || normalizedType.includes("online")) {
      return "CAWI (Онлайн опрос)";
    }
    if (normalizedType.includes("moderated usability") || normalizedType.includes("модерируемое")) {
      return "Модерируемое тестирование юзабилити";
    }
    if (normalizedType.includes("unmoderated usability") || normalizedType.includes("немодерируемое")) {
      return "Немодерируемое тестирование юзабилити";
    }
    if (normalizedType.includes("co-creation") || normalizedType.includes("cocreation") || 
        normalizedType.includes("совместного создания")) {
      return "Сессия совместного создания";
    }
    if (normalizedType.includes("interview") || normalizedType.includes("интервью")) {
      return "Интервью";
    }
    if (normalizedType.includes("desk research") || normalizedType.includes("кабинетное")) {
      return "Кабинетное исследование";
    }
    
    // Fallback - return original if no match found
    return researchType;
  };
  const [search, setSearch] = useState("");
  const [researcherFilter, setResearcherFilter] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [researchTypeFilters, setResearchTypeFilters] = useState<string[]>([]);
  const [productFilters, setProductFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showStartsInNWeeks, setShowStartsInNWeeks] = useState(false);
  const [weeksNumber, setWeeksNumber] = useState<string>("1");
  
  // Applied filters state for "Apply Filters" button
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string>("ALL");
  const [appliedTeamFilter, setAppliedTeamFilter] = useState<string[]>([]);
  const [appliedResearcherFilter, setAppliedResearcherFilter] = useState<string[]>([]);
  const [appliedResearchTypeFilters, setAppliedResearchTypeFilters] = useState<string[]>([]);
  const [appliedProductFilters, setAppliedProductFilters] = useState<string[]>([]);
  
  // Debounced search value - only search is debounced, filters wait for apply button
  const debouncedSearch = useDebouncedValue(search, 500);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Apply filters function
  const applyFilters = () => {
    setAppliedSearch(debouncedSearch);
    setAppliedStatusFilter(statusFilter);
    setAppliedTeamFilter(teamFilter);
    setAppliedResearcherFilter(researcherFilter);
    setAppliedResearchTypeFilters(researchTypeFilters);
    setAppliedProductFilters(productFilters);
  };

  // Auto-apply search when debounced value changes
  useEffect(() => {
    setAppliedSearch(debouncedSearch);
  }, [debouncedSearch]);

  // Use infinite scroll for researches with server-side filtering using applied filters
  const {
    data: researches,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteScroll<ResearchTableItem>({
    queryKey: [
      "/api/researches", 
      "paginated", 
      sortBy, 
      sortDir, 
      appliedSearch, 
      appliedStatusFilter, 
      appliedTeamFilter, 
      appliedResearcherFilter, 
      appliedResearchTypeFilters, 
      appliedProductFilters
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
        sortBy: sortBy,
        sortDir: sortDir
      });
      
      // Add search parameter (using applied search)
      if (appliedSearch && appliedSearch.trim()) {
        params.append('search', appliedSearch.trim());
      }
      
      // Add filter parameters only if they have values and aren't "ALL" (using applied filters)
      if (appliedStatusFilter && appliedStatusFilter !== "ALL") {
        params.append('status', appliedStatusFilter);
      }
      
      if (appliedTeamFilter && appliedTeamFilter.length > 0) {
        appliedTeamFilter.forEach(team => params.append('teams', team));
      }
      
      if (appliedResearcherFilter && appliedResearcherFilter.length > 0) {
        appliedResearcherFilter.forEach(researcher => params.append('researchers', researcher));
      }
      
      if (appliedResearchTypeFilters && appliedResearchTypeFilters.length > 0) {
        appliedResearchTypeFilters.forEach(type => params.append('researchType', type));
      }
      
      if (appliedProductFilters && appliedProductFilters.length > 0) {
        appliedProductFilters.forEach(product => params.append('products', product));
      }
      
      const response = await fetch(`/api/researches?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch researches");
      }
      return response.json() as Promise<PaginatedResponse<ResearchTableItem>>;
    },
    enabled: true, // Server handles all filtering now
  });

  // Get unique researchers, teams, and research types for filters
  const researchersSet = new Set(researches.map(r => r.researcher).filter(Boolean));
  const researchers = Array.from(researchersSet).sort();
  
  const teamsSet = new Set(researches.map(r => r.team).filter(Boolean));
  const teams = Array.from(teamsSet).sort();

  const researchTypesSet = new Set(researches.map(r => r.researchType).filter(Boolean));
  const researchTypes = Array.from(researchTypesSet).sort();

  // Get unique products for filters
  const productsSet = new Set();
  researches.forEach(r => {
    if (r.products && Array.isArray(r.products)) {
      r.products.forEach(product => productsSet.add(product));
    }
  });
  const products = Array.from(productsSet).sort() as string[];

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem("researches-table-filters");
      if (savedFilters) {
        const { status, researcher, team, researchTypes, products, showStartsInNWeeks, weeksNumber } = JSON.parse(savedFilters);
        if (status) setStatusFilter(status);
        if (researcher) setResearcherFilter(researcher);
        if (team) setTeamFilter(team);
        if (researchTypes && Array.isArray(researchTypes)) setResearchTypeFilters(researchTypes);
        if (products && Array.isArray(products)) setProductFilters(products);
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
        products: productFilters,
        showStartsInNWeeks,
        weeksNumber
      }));
    } catch (error) {
      console.error("Error saving filters:", error);
    }
  }, [statusFilter, researcherFilter, teamFilter, researchTypeFilters, productFilters, showStartsInNWeeks, weeksNumber]);

  const getValueForSorting = (research: ResearchTableItem, field: string) => {
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
  
  // Server handles all main filtering - only client-side date range filtering remains for "starts in N weeks"
  const filteredResearches = showStartsInNWeeks 
    ? researches.filter(research => {
        const startDate = new Date(research.dateStart);
        return startDate >= currentDate && startDate <= futureDate;
      })
    : researches;

  const handleItemClick = (research: ResearchTableItem) => {
    setLocation(`/researches/${research.id}`);
  };

  // Prepare column definitions with useMemo to update on language change
  const tableColumns: ColumnConfig[] = useMemo(() => [
    {
      id: "name",
      name: "Название",
      visible: true,
      sortField: "name",
      render: (research: ResearchTableItem) => (
        <span className="font-medium">{research.name}</span>
      )
    },
    {
      id: "team",
      name: "Команда",
      visible: true,
      sortField: "team",
      render: (research: ResearchTableItem) => research.team
    },
    {
      id: "researchType",
      name: "Тип исследования",
      visible: true,
      sortField: "researchType",
      render: (research: ResearchTableItem) => {
        const researchTypeMap: Record<string, string> = {
          "CATI (Telephone Survey)": "CATI (Телефонный опрос)",
          "CAWI (Online Survey)": "CAWI (Онлайн опрос)",
          "Moderated usability testing": "Модерируемое тестирование юзабилити",
          "Unmoderated usability testing": "Немодерируемое тестирование юзабилити",
          "Co-creation session": "Сессия совместного создания",
          "Interviews": "Интервью",
          "Desk research": "Кабинетное исследование"
        };
        const translatedType = researchTypeMap[research.researchType || "Interviews"] || "Интервью";
        return <span className="text-sm text-gray-600">{translatedType}</span>;
      }
    },
    {
      id: "researcher",
      name: "Исследователь",
      visible: true,
      sortField: "researcher",
      render: (research: ResearchTableItem) => research.researcher
    },
    {
      id: "status",
      name: "Статус",
      visible: true,
      sortField: "status",
      render: (research: ResearchTableItem) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap min-w-max
          ${research.status === ResearchStatus.DONE ? 'bg-green-100 text-green-800' :
            research.status === ResearchStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'}`} title={research.status}>
          {research.status === ResearchStatus.DONE ? "Завершено" :
           research.status === ResearchStatus.IN_PROGRESS ? "В процессе" :
           "Запланировано"}
        </span>
      )
    },
    {
      id: "dateStart",
      name: "Дата начала",
      visible: true,
      sortField: "dateStart",
      render: (research: ResearchTableItem) => formatDateShort(research.dateStart)
    },
    {
      id: "dateEnd",
      name: "Дата окончания",
      visible: true,
      sortField: "dateEnd",
      render: (research: ResearchTableItem) => formatDateShort(research.dateEnd)
    },
    {
      id: "products",
      name: "Продукты",
      visible: true,
      render: (research: ResearchTableItem) => (
        <div className="flex flex-wrap gap-1">
          {research.products && research.products.length > 0 ? (
            research.products.slice(0, 3).map((product, index) => (
              <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {product}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs">Нет продуктов</span>
          )}
          {research.products && research.products.length > 3 && (
            <span className="text-xs text-gray-500">+{research.products.length - 3} more</span>
          )}
        </div>
      )
    },
    {
      id: "description",
      name: "Описание",
      visible: false,
      render: (research: ResearchTableItem) => (
        <div className="max-w-[300px]">
          <MarkdownRenderer 
            content={research.description} 
            className="line-clamp-2 text-sm"
            maxLength={200}
          />
        </div>
      )
    }
  ], []);

  // Prepare filter configurations
  const filterConfigs = useMemo(() => [
    {
      id: "status",
      name: "Статус",
      options: [
        { label: "Все", value: "ALL" },
        ...Object.values(ResearchStatus).map(status => ({ 
          label: status === ResearchStatus.DONE ? "Завершено" :
                 status === ResearchStatus.IN_PROGRESS ? "В процессе" :
                 "Запланировано", 
          value: status 
        }))
      ],
      value: statusFilter || "ALL",
      onChange: setStatusFilter
    },
    {
      id: "researcher",
      name: "Исследователь",
      component: "searchMultiselect" as const,
      apiEndpoint: "/api/filters/researchers",
      selectedValues: researcherFilter,
      onChange: setResearcherFilter,
      formatOption: (option: any) => ({ label: option.name, value: option.name })
    },
    {
      id: "team",
      name: "Команда",
      component: "searchMultiselect" as const,
      apiEndpoint: "/api/filters/teams",
      selectedValues: teamFilter,
      onChange: setTeamFilter,
      formatOption: (option: any) => ({ label: option.name, value: option.name })
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
                  ? "Все типы исследований"
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
    },
    {
      id: "product",
      name: "Product",
      customComponent: (
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Product</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-white"
              >
                {productFilters.length === 0
                  ? "Все продукты"
                  : `${productFilters.length} selected`}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="max-h-60 overflow-auto p-1">
                <div className="flex items-center px-3 py-2 border-b">
                  <Checkbox
                    checked={productFilters.length === 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setProductFilters([]);
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">All Products</span>
                </div>
                {products.map((product) => (
                  <div key={product} className="flex items-center px-3 py-2 hover:bg-gray-50">
                    <Checkbox
                      checked={productFilters.includes(product)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setProductFilters([...productFilters, product]);
                        } else {
                          setProductFilters(productFilters.filter(p => p !== product));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{product}</span>
                  </div>
                ))}
              </div>
              {productFilters.length > 0 && (
                <div className="border-t p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProductFilters([])}
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
      isActive: () => productFilters.length > 0
    }
  ], [statusFilter, researcherFilter, teamFilter, researchTypeFilters, productFilters, researchers, teams, researchTypes, products, setStatusFilter, setResearcherFilter, setTeamFilter, setResearchTypeFilters, setProductFilters]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  // Remove the full-page loading check to keep search and header visible

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
      <div className="container mx-auto max-w-[1400px] space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Исследования</h1>
            <ResearcherFilterManager
              pageType="researches"
              currentFilters={{
                search,
                researcherFilter,
                teamFilter,
                statusFilter,
                researchTypeFilters,
                productFilters,
                showStartsInNWeeks,
                weeksNumber,
              }}
              onApplyFilter={(filters) => {
                if (filters.search !== undefined) setSearch(filters.search);
                if (filters.researcherFilter !== undefined) setResearcherFilter(filters.researcherFilter);
                if (filters.teamFilter !== undefined) setTeamFilter(filters.teamFilter);
                if (filters.statusFilter !== undefined) setStatusFilter(filters.statusFilter);
                if (filters.researchTypeFilters !== undefined) setResearchTypeFilters(filters.researchTypeFilters);
                if (filters.productFilters !== undefined) setProductFilters(filters.productFilters);
                if (filters.showStartsInNWeeks !== undefined) setShowStartsInNWeeks(filters.showStartsInNWeeks);
                if (filters.weeksNumber !== undefined) setWeeksNumber(filters.weeksNumber);
              }}
            />
          </div>
          <div className="flex items-center gap-4">

            <Button 
              className="bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200"
              onClick={() => setLocation("/researches/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Новое исследование
            </Button>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList>
                <TabsTrigger value="table">Таблица</TabsTrigger>
                <TabsTrigger value="cards">Карточки</TabsTrigger>
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
              Показать исследования, которые начинаются через {weeksNumber} {weeksNumber === "1" ? "неделю" : "недель"}
            </label>
          </div>
          
          {showStartsInNWeeks && (
            <div className="flex items-center space-x-2">
              <Select value={weeksNumber} onValueChange={setWeeksNumber}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="Недели" />
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

        {viewMode === "table" ? (
          <InfiniteScrollTable
            data={filteredResearches}
            columns={tableColumns}
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            onRowClick={handleItemClick}
            rowClassName="cursor-pointer hover:bg-gray-50/80 transition-all duration-200"
            sortField={sortBy}
            sortDirection={sortDir}
            onSort={handleSort}
            filters={filterConfigs}
            searchValue={search}
            onSearchChange={setSearch}
            storeConfigKey="researches-table-columns"
            emptyStateMessage={"Исследования не найдены"}
            onApplyFilters={applyFilters}
            hasUnappliedFilters={
              statusFilter !== appliedStatusFilter ||
              teamFilter !== appliedTeamFilter ||
              researcherFilter !== appliedResearcherFilter ||
              JSON.stringify(researchTypeFilters) !== JSON.stringify(appliedResearchTypeFilters) ||
              JSON.stringify(productFilters) !== JSON.stringify(appliedProductFilters)
            }
          />
        ) : filteredResearches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No researches found matching your filters</p>
          </div>
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
                    <p className="text-sm font-medium text-gray-500">Команда</p>
                    <p className="text-sm text-gray-900">{research.team}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Исследователь</p>
                    <p className="text-sm text-gray-900">{research.researcher}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Тип исследования</p>
                    <p className="text-sm text-gray-900">{translateResearchType(research.researchType || "Interviews")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Описание</p>
                    <div className="text-sm text-gray-900 line-clamp-3 prose prose-sm max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        disallowedElements={['script', 'iframe', 'object', 'embed', 'form', 'input', 'button']}
                        unwrapDisallowed={true}
                      >
                        {research.description}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Дата начала</p>
                      <p className="text-sm text-gray-900">
                        {formatDateShort(research.dateStart)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Дата окончания</p>
                      <p className="text-sm text-gray-900">
                        {formatDateShort(research.dateEnd)}
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