import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMeetingSchema, insertResearchSchema } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { meetings, researches } from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Initialize database
async function initializeDatabase() {
  try {
    // Create researches table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS researches (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        team TEXT NOT NULL,
        description TEXT NOT NULL,
        date_start TIMESTAMP NOT NULL,
        date_end TIMESTAMP NOT NULL
      )
    `;

    // Create meetings table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        respondent_name TEXT NOT NULL,
        respondent_position TEXT,
        cnum TEXT NOT NULL,
        company_name TEXT,
        manager TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        research_id INTEGER REFERENCES researches(id),
        status TEXT NOT NULL DEFAULT 'Negotiation'
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