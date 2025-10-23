import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { storage } from "./storage";

export class MCPServerManager {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: "research-management-mcp",
      version: "1.0.0",
    });

    this.registerTools();
  }

  getServer(): McpServer {
    return this.server;
  }

  private registerTools() {
    // Register get_teams tool
    this.server.registerTool(
      "get_teams",
      {
        title: "Get Teams",
        description: "Retrieve all teams from the system",
        inputSchema: {},
      },
      async () => {
        const teams = await storage.getTeams();
        return {
          content: [{ type: "text", text: JSON.stringify(teams, null, 2) }],
        };
      }
    );

    // Register get_positions tool
    this.server.registerTool(
      "get_positions",
      {
        title: "Get Positions",
        description: "Retrieve all positions from the system",
        inputSchema: {},
      },
      async () => {
        const positions = await storage.getPositions();
        return {
          content: [{ type: "text", text: JSON.stringify(positions, null, 2) }],
        };
      }
    );

    // Register get_researches tool
    this.server.registerTool(
      "get_researches",
      {
        title: "Get Researches",
        description: "Retrieve researches with optional filtering and pagination",
        inputSchema: {
          page: z.number().optional(),
          limit: z.number().optional(),
          search: z.string().optional(),
          status: z.string().optional(),
          teams: z.string().optional(),
          researchType: z.string().optional(),
        },
      },
      async (args) => {
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
          content: [{ type: "text", text: JSON.stringify(researches, null, 2) }],
        };
      }
    );

    // Register get_research tool
    this.server.registerTool(
      "get_research",
      {
        title: "Get Research",
        description: "Retrieve a specific research by ID",
        inputSchema: {
          id: z.number(),
        },
      },
      async ({ id }) => {
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
          content: [{ type: "text", text: JSON.stringify(research, null, 2) }],
        };
      }
    );

    // Register get_meetings tool
    this.server.registerTool(
      "get_meetings",
      {
        title: "Get Meetings",
        description: "Retrieve meetings with optional filtering and pagination",
        inputSchema: {
          page: z.number().optional(),
          limit: z.number().optional(),
          search: z.string().optional(),
          status: z.string().optional(),
          researchId: z.number().optional(),
        },
      },
      async (args) => {
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
          content: [{ type: "text", text: JSON.stringify(meetings, null, 2) }],
        };
      }
    );

    // Register get_meeting tool
    this.server.registerTool(
      "get_meeting",
      {
        title: "Get Meeting",
        description: "Retrieve a specific meeting by ID",
        inputSchema: {
          id: z.number(),
        },
      },
      async ({ id }) => {
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
          content: [{ type: "text", text: JSON.stringify(meeting, null, 2) }],
        };
      }
    );

    // Register get_jtbds tool
    this.server.registerTool(
      "get_jtbds",
      {
        title: "Get JTBDs",
        description: "Retrieve all Jobs to be Done (JTBDs) from the system",
        inputSchema: {},
      },
      async () => {
        const jtbds = await storage.getJtbds();
        return {
          content: [{ type: "text", text: JSON.stringify(jtbds, null, 2) }],
        };
      }
    );

    // Register get_jtbd tool
    this.server.registerTool(
      "get_jtbd",
      {
        title: "Get JTBD",
        description: "Retrieve a specific JTBD by ID",
        inputSchema: {
          id: z.number(),
        },
      },
      async ({ id }) => {
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
          content: [{ type: "text", text: JSON.stringify(jtbd, null, 2) }],
        };
      }
    );

    // Register get_dashboard_data tool
    this.server.registerTool(
      "get_dashboard_data",
      {
        title: "Get Dashboard Data",
        description: "Retrieve dashboard analytics data with optional filters",
        inputSchema: {
          year: z.number().optional(),
          researchFilter: z.number().optional(),
          teamFilter: z.string().optional(),
          managerFilter: z.string().optional(),
          researcherFilter: z.string().optional(),
        },
      },
      async (args) => {
        const { year, researchFilter, teamFilter, managerFilter, researcherFilter } = args;
        const dashboardData = await storage.getDashboardData({
          year: year || new Date().getFullYear(),
          researchFilter,
          teamFilter,
          managerFilter,
          researcherFilter,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(dashboardData, null, 2) }],
        };
      }
    );

    // Register get_roadmap_researches tool
    this.server.registerTool(
      "get_roadmap_researches",
      {
        title: "Get Roadmap Researches",
        description: "Retrieve researches for roadmap view",
        inputSchema: {
          year: z.number().optional(),
        },
      },
      async (args) => {
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
    );

    // Register get_calendar_meetings tool
    this.server.registerTool(
      "get_calendar_meetings",
      {
        title: "Get Calendar Meetings",
        description: "Retrieve meetings for calendar view within a date range",
        inputSchema: {
          startDate: z.string(),
          endDate: z.string(),
        },
      },
      async ({ startDate, endDate }) => {
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
    );

    // Register get_calendar_researches tool
    this.server.registerTool(
      "get_calendar_researches",
      {
        title: "Get Calendar Researches",
        description: "Retrieve researches for calendar view within a date range",
        inputSchema: {
          startDate: z.string(),
          endDate: z.string(),
        },
      },
      async ({ startDate, endDate }) => {
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
    );
  }
}

// Create singleton instance
export const mcpServerManager = new MCPServerManager();
