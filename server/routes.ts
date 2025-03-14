import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMeetingSchema } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { meetings } from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Initialize database
async function initializeDatabase() {
  try {
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
        research TEXT NOT NULL,
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