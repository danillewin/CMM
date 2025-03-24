import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMeetingSchema, insertResearchSchema, insertPositionSchema, insertTeamSchema } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { meetings, researches, positions, teams } from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Initialize database
async function initializeDatabase() {
  try {
    // Create teams table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create positions table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create researches table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS researches (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        team TEXT NOT NULL REFERENCES teams(name),
        researcher TEXT NOT NULL,
        description TEXT NOT NULL,
        date_start TIMESTAMP NOT NULL,
        date_end TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'Planned'
      )
    `;

    // Create meetings table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        respondent_name TEXT NOT NULL,
        respondent_position TEXT REFERENCES positions(name),
        cnum TEXT NOT NULL,
        gcc TEXT,
        company_name TEXT,
        manager TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        research_id INTEGER REFERENCES researches(id),
        status TEXT NOT NULL DEFAULT 'In Progress'
      )
    `;
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

export function registerRoutes(app: Express): Server {
  // Initialize database before setting up routes
  initializeDatabase().catch(error => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });

  // Team routes
  app.get("/api/teams", async (_req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const result = insertTeamSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid team data", errors: result.error.errors });
        return;
      }
      const team = await storage.createTeam(result.data);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const success = await storage.deleteTeam(Number(req.params.id));
      if (!success) {
        res.status(404).json({ message: "Team not found" });
        return;
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting team:", error);
      res.status(error.message.includes("associated") ? 400 : 500)
        .json({ message: error.message || "Failed to delete team" });
    }
  });

  // Position routes
  app.get("/api/positions", async (_req, res) => {
    try {
      const positions = await storage.getPositions();
      res.json(positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  app.post("/api/positions", async (req, res) => {
    try {
      const result = insertPositionSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid position data", errors: result.error.errors });
        return;
      }
      const position = await storage.createPosition(result.data);
      res.status(201).json(position);
    } catch (error) {
      console.error("Error creating position:", error);
      res.status(500).json({ message: "Failed to create position" });
    }
  });

  app.delete("/api/positions/:id", async (req, res) => {
    try {
      const success = await storage.deletePosition(Number(req.params.id));
      if (!success) {
        res.status(404).json({ message: "Position not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting position:", error);
      res.status(500).json({ message: "Failed to delete position" });
    }
  });

  // Research routes
  app.get("/api/researches", async (_req, res) => {
    try {
      const researches = await storage.getResearches();
      res.json(researches);
    } catch (error) {
      console.error("Error fetching researches:", error);
      res.status(500).json({ message: "Failed to fetch researches" });
    }
  });

  app.post("/api/researches", async (req, res) => {
    try {
      const result = insertResearchSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid research data", errors: result.error.errors });
        return;
      }
      const research = await storage.createResearch(result.data);
      res.status(201).json(research);
    } catch (error) {
      console.error("Error creating research:", error);
      res.status(500).json({ message: "Failed to create research" });
    }
  });

  app.patch("/api/researches/:id", async (req, res) => {
    try {
      const result = insertResearchSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid research data", errors: result.error.errors });
        return;
      }
      const research = await storage.updateResearch(Number(req.params.id), result.data);
      if (!research) {
        res.status(404).json({ message: "Research not found" });
        return;
      }
      res.json(research);
    } catch (error) {
      console.error("Error updating research:", error);
      res.status(500).json({ message: "Failed to update research" });
    }
  });

  app.delete("/api/researches/:id", async (req, res) => {
    try {
      const success = await storage.deleteResearch(Number(req.params.id));
      if (!success) {
        res.status(404).json({ message: "Research not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting research:", error);
      res.status(500).json({ message: "Failed to delete research" });
    }
  });

  // Meeting routes
  app.get("/api/meetings", async (_req, res) => {
    try {
      const meetings = await storage.getMeetings();
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", async (req, res) => {
    try {
      const result = insertMeetingSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid meeting data", errors: result.error.errors });
        return;
      }
      const meeting = await storage.createMeeting(result.data);
      res.status(201).json(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  app.patch("/api/meetings/:id", async (req, res) => {
    try {
      const result = insertMeetingSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid meeting data", errors: result.error.errors });
        return;
      }
      const meeting = await storage.updateMeeting(Number(req.params.id), result.data);
      if (!meeting) {
        res.status(404).json({ message: "Meeting not found" });
        return;
      }
      res.json(meeting);
    } catch (error) {
      console.error("Error updating meeting:", error);
      res.status(500).json({ message: "Failed to update meeting" });
    }
  });

  app.delete("/api/meetings/:id", async (req, res) => {
    try {
      const success = await storage.deleteMeeting(Number(req.params.id));
      if (!success) {
        res.status(404).json({ message: "Meeting not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({ message: "Failed to delete meeting" });
    }
  });

  return createServer(app);
}