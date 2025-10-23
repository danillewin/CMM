import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { storage } from "./storage";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPToolCallResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export class MCPServerManager {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "research-management-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupTools();
  }

  // Public method to get list of tools
  async listTools(): Promise<MCPTool[]> {
    return [
      {
        name: "get_teams",
        description: "Retrieve all teams from the system",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_positions",
        description: "Retrieve all positions from the system",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_researches",
        description: "Retrieve researches with optional filtering and pagination",
        inputSchema: {
          type: "object",
          properties: {
            page: {
              type: "number",
              description: "Page number for pagination",
            },
            limit: {
              type: "number",
              description: "Number of items per page",
            },
            search: {
              type: "string",
              description: "Search query",
            },
            status: {
              type: "string",
              description: "Filter by status (Planned, In Progress, Done)",
            },
            teams: {
              type: "string",
              description: "Comma-separated team names to filter by",
            },
            researchType: {
              type: "string",
              description: "Filter by research type",
            },
          },
        },
      },
      {
        name: "get_research",
        description: "Retrieve a specific research by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Research ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "get_meetings",
        description: "Retrieve meetings with optional filtering and pagination",
        inputSchema: {
          type: "object",
          properties: {
            page: {
              type: "number",
              description: "Page number for pagination",
            },
            limit: {
              type: "number",
              description: "Number of items per page",
            },
            search: {
              type: "string",
              description: "Search query",
            },
            status: {
              type: "string",
              description: "Filter by meeting status",
            },
            researchId: {
              type: "number",
              description: "Filter by research ID",
            },
          },
        },
      },
      {
        name: "get_meeting",
        description: "Retrieve a specific meeting by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Meeting ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "get_jtbds",
        description: "Retrieve all Jobs to be Done (JTBDs) from the system",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_jtbd",
        description: "Retrieve a specific JTBD by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "JTBD ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "get_dashboard_data",
        description: "Retrieve dashboard analytics data with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            year: {
              type: "number",
              description: "Year to filter data",
            },
            researchFilter: {
              type: "number",
              description: "Research ID filter",
            },
            teamFilter: {
              type: "string",
              description: "Team name filter",
            },
            managerFilter: {
              type: "string",
              description: "Manager name filter",
            },
            researcherFilter: {
              type: "string",
              description: "Researcher name filter",
            },
          },
        },
      },
      {
        name: "get_roadmap_researches",
        description: "Retrieve researches for roadmap view",
        inputSchema: {
          type: "object",
          properties: {
            year: {
              type: "number",
              description: "Year to filter researches",
            },
          },
        },
      },
      {
        name: "get_calendar_meetings",
        description: "Retrieve meetings for calendar view within a date range",
        inputSchema: {
          type: "object",
          properties: {
            startDate: {
              type: "string",
              description: "Start date (ISO format)",
            },
            endDate: {
              type: "string",
              description: "End date (ISO format)",
            },
          },
          required: ["startDate", "endDate"],
        },
      },
      {
        name: "get_calendar_researches",
        description: "Retrieve researches for calendar view within a date range",
        inputSchema: {
          type: "object",
          properties: {
            startDate: {
              type: "string",
              description: "Start date (ISO format)",
            },
            endDate: {
              type: "string",
              description: "End date (ISO format)",
            },
          },
          required: ["startDate", "endDate"],
        },
      },
    ];
  }

  // Public method to call a tool
  async callTool(name: string, args: any = {}): Promise<MCPToolCallResult> {
    try {
      switch (name) {
        case "get_teams": {
          const teams = await storage.getTeams();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(teams, null, 2),
              },
            ],
          };
        }

        case "get_positions": {
          const positions = await storage.getPositions();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(positions, null, 2),
              },
            ],
          };
        }

        case "get_researches": {
          const { page, limit, search, status, teams, researchType } = args;
          const researches = await storage.getResearchesPaginated({
            page: page || 1,
            limit: limit || 20,
            search: search || "",
            status: status || "",
            teams: teams || "",
            researchResearchers: "",
            researchType: researchType || "",
            products: undefined,
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(researches, null, 2),
              },
            ],
          };
        }

        case "get_research": {
          const { id } = args;
          const research = await storage.getResearch(id);
          if (!research) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ error: "Research not found" }),
                },
              ],
              isError: true,
            };
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(research, null, 2),
              },
            ],
          };
        }

        case "get_meetings": {
          const { page, limit, search, status, researchId } = args;
          const meetings = await storage.getMeetingsPaginated({
            page: page || 1,
            limit: limit || 20,
            search: search || "",
            status: status || "",
            researchId: researchId,
            researchIds: "",
            managers: "",
            recruiters: "",
            researchers: "",
            positions: "",
            gift: "",
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(meetings, null, 2),
              },
            ],
          };
        }

        case "get_meeting": {
          const { id } = args;
          const meeting = await storage.getMeeting(id);
          if (!meeting) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ error: "Meeting not found" }),
                },
              ],
              isError: true,
            };
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(meeting, null, 2),
              },
            ],
          };
        }

        case "get_jtbds": {
          const jtbds = await storage.getJtbds();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(jtbds, null, 2),
              },
            ],
          };
        }

        case "get_jtbd": {
          const { id } = args;
          const jtbd = await storage.getJtbd(id);
          if (!jtbd) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ error: "JTBD not found" }),
                },
              ],
              isError: true,
            };
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(jtbd, null, 2),
              },
            ],
          };
        }

        case "get_dashboard_data": {
          const { year, researchFilter, teamFilter, managerFilter, researcherFilter } = args;
          const dashboardData = await storage.getDashboardData({
            year: year || new Date().getFullYear(),
            researchFilter,
            teamFilter,
            managerFilter,
            researcherFilter,
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(dashboardData, null, 2),
              },
            ],
          };
        }

        case "get_roadmap_researches": {
          const { year } = args;
          const researches = await storage.getRoadmapResearches(year || new Date().getFullYear());
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ data: researches, total: researches.length, year }, null, 2),
              },
            ],
          };
        }

        case "get_calendar_meetings": {
          const { startDate, endDate } = args;
          const start = new Date(startDate);
          const end = new Date(endDate);
          const meetings = await storage.getCalendarMeetings(start, end);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ data: meetings, total: meetings.length }, null, 2),
              },
            ],
          };
        }

        case "get_calendar_researches": {
          const { startDate, endDate } = args;
          const start = new Date(startDate);
          const end = new Date(endDate);
          const researches = await storage.getCalendarResearches(start, end);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ data: researches, total: researches.length }, null, 2),
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: `Unknown tool: ${name}` }),
              },
            ],
            isError: true,
          };
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: error.message || "Internal server error" }),
          },
        ],
        isError: true,
      };
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_teams",
          description: "Retrieve all teams from the system",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_positions",
          description: "Retrieve all positions from the system",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_researches",
          description: "Retrieve researches with optional filtering and pagination",
          inputSchema: {
            type: "object",
            properties: {
              page: {
                type: "number",
                description: "Page number for pagination",
              },
              limit: {
                type: "number",
                description: "Number of items per page",
              },
              search: {
                type: "string",
                description: "Search query",
              },
              status: {
                type: "string",
                description: "Filter by status (Planned, In Progress, Done)",
              },
              teams: {
                type: "string",
                description: "Comma-separated team names to filter by",
              },
              researchType: {
                type: "string",
                description: "Filter by research type",
              },
            },
          },
        },
        {
          name: "get_research",
          description: "Retrieve a specific research by ID",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "number",
                description: "Research ID",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "get_meetings",
          description: "Retrieve meetings with optional filtering and pagination",
          inputSchema: {
            type: "object",
            properties: {
              page: {
                type: "number",
                description: "Page number for pagination",
              },
              limit: {
                type: "number",
                description: "Number of items per page",
              },
              search: {
                type: "string",
                description: "Search query",
              },
              status: {
                type: "string",
                description: "Filter by meeting status",
              },
              researchId: {
                type: "number",
                description: "Filter by research ID",
              },
            },
          },
        },
        {
          name: "get_meeting",
          description: "Retrieve a specific meeting by ID",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "number",
                description: "Meeting ID",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "get_jtbds",
          description: "Retrieve all Jobs to be Done (JTBDs) from the system",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_jtbd",
          description: "Retrieve a specific JTBD by ID",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "number",
                description: "JTBD ID",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "get_dashboard_data",
          description: "Retrieve dashboard analytics data with optional filters",
          inputSchema: {
            type: "object",
            properties: {
              year: {
                type: "number",
                description: "Year to filter data",
              },
              researchFilter: {
                type: "number",
                description: "Research ID filter",
              },
              teamFilter: {
                type: "string",
                description: "Team name filter",
              },
              managerFilter: {
                type: "string",
                description: "Manager name filter",
              },
              researcherFilter: {
                type: "string",
                description: "Researcher name filter",
              },
            },
          },
        },
        {
          name: "get_roadmap_researches",
          description: "Retrieve researches for roadmap view",
          inputSchema: {
            type: "object",
            properties: {
              year: {
                type: "number",
                description: "Year to filter researches",
              },
            },
          },
        },
        {
          name: "get_calendar_meetings",
          description: "Retrieve meetings for calendar view within a date range",
          inputSchema: {
            type: "object",
            properties: {
              startDate: {
                type: "string",
                description: "Start date (ISO format)",
              },
              endDate: {
                type: "string",
                description: "End date (ISO format)",
              },
            },
            required: ["startDate", "endDate"],
          },
        },
        {
          name: "get_calendar_researches",
          description: "Retrieve researches for calendar view within a date range",
          inputSchema: {
            type: "object",
            properties: {
              startDate: {
                type: "string",
                description: "Start date (ISO format)",
              },
              endDate: {
                type: "string",
                description: "End date (ISO format)",
              },
            },
            required: ["startDate", "endDate"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_teams": {
            const teams = await storage.getTeams();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(teams, null, 2),
                },
              ],
            };
          }

          case "get_positions": {
            const positions = await storage.getPositions();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(positions, null, 2),
                },
              ],
            };
          }

          case "get_researches": {
            const { page, limit, search, status, teams, researchType } = args as any;
            const researches = await storage.getResearchesPaginated({
              page: page || 1,
              limit: limit || 20,
              search: search || "",
              status: status || "",
              teams: teams || "",
              researchResearchers: "",
              researchType: researchType || "",
              products: undefined,
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(researches, null, 2),
                },
              ],
            };
          }

          case "get_research": {
            const { id } = args as { id: number };
            const research = await storage.getResearch(id);
            if (!research) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({ error: "Research not found" }),
                  },
                ],
                isError: true,
              };
            }
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(research, null, 2),
                },
              ],
            };
          }

          case "get_meetings": {
            const { page, limit, search, status, researchId } = args as any;
            const meetings = await storage.getMeetingsPaginated({
              page: page || 1,
              limit: limit || 20,
              search: search || "",
              status: status || "",
              researchId: researchId,
              researchIds: "",
              managers: "",
              recruiters: "",
              researchers: "",
              positions: "",
              gift: "",
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(meetings, null, 2),
                },
              ],
            };
          }

          case "get_meeting": {
            const { id } = args as { id: number };
            const meeting = await storage.getMeeting(id);
            if (!meeting) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({ error: "Meeting not found" }),
                  },
                ],
                isError: true,
              };
            }
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(meeting, null, 2),
                },
              ],
            };
          }

          case "get_jtbds": {
            const jtbds = await storage.getJtbds();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(jtbds, null, 2),
                },
              ],
            };
          }

          case "get_jtbd": {
            const { id } = args as { id: number };
            const jtbd = await storage.getJtbd(id);
            if (!jtbd) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({ error: "JTBD not found" }),
                  },
                ],
                isError: true,
              };
            }
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(jtbd, null, 2),
                },
              ],
            };
          }

          case "get_dashboard_data": {
            const { year, researchFilter, teamFilter, managerFilter, researcherFilter } = args as any;
            const dashboardData = await storage.getDashboardData({
              year: year || new Date().getFullYear(),
              researchFilter,
              teamFilter,
              managerFilter,
              researcherFilter,
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(dashboardData, null, 2),
                },
              ],
            };
          }

          case "get_roadmap_researches": {
            const { year } = args as any;
            const researches = await storage.getRoadmapResearches(year || new Date().getFullYear());
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ data: researches, total: researches.length, year }, null, 2),
                },
              ],
            };
          }

          case "get_calendar_meetings": {
            const { startDate, endDate } = args as { startDate: string; endDate: string };
            const start = new Date(startDate);
            const end = new Date(endDate);
            const meetings = await storage.getCalendarMeetings(start, end);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ data: meetings, total: meetings.length }, null, 2),
                },
              ],
            };
          }

          case "get_calendar_researches": {
            const { startDate, endDate } = args as { startDate: string; endDate: string };
            const start = new Date(startDate);
            const end = new Date(endDate);
            const researches = await storage.getCalendarResearches(start, end);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ data: researches, total: researches.length }, null, 2),
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ error: `Unknown tool: ${name}` }),
                },
              ],
              isError: true,
            };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: error.message || "Internal server error" }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupTools() {
    // Tools are registered via the request handlers above
  }

  getServer(): Server {
    return this.server;
  }
}

// Create singleton instance
export const mcpServerManager = new MCPServerManager();
