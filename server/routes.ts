import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMeetingSchema, 
  insertResearchSchema, 
  insertPositionSchema, 
  insertTeamSchema,
  insertJtbdSchema
} from "@shared/schema";
import { 
  meetings, 
  researches, 
  positions, 
  teams, 
  jtbds, 
  researchJtbds, 
  meetingJtbds 
} from "@shared/schema";
import { db, pool } from "./db";

// Initialize database
async function initializeDatabase() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(`
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
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        respondent_name TEXT NOT NULL,
        respondent_position TEXT REFERENCES positions(name),
        cnum TEXT NOT NULL,
        gcc TEXT,
        company_name TEXT,
        manager TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        research_id INTEGER NOT NULL REFERENCES researches(id),
        status TEXT NOT NULL DEFAULT 'In Progress'
      )
    `);
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
  
  app.get("/api/researches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid research ID" });
      }
      
      console.log(`Fetching research with ID: ${id}`);
      const research = await storage.getResearch(id);
      console.log("Research data:", research);
      
      if (!research) {
        console.log(`Research with ID ${id} not found`);
        return res.status(404).json({ message: "Research not found" });
      }
      
      res.json(research);
    } catch (error) {
      console.error("Error fetching research:", error);
      res.status(500).json({ message: "Failed to fetch research" });
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
    } catch (error: any) {
      console.error("Error deleting research:", error);
      res.status(error.message.includes("associated") ? 400 : 500)
        .json({ message: error.message || "Failed to delete research" });
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

  app.get("/api/meetings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }
      
      const meeting = await storage.getMeeting(id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching meeting:", error);
      res.status(500).json({ message: "Failed to fetch meeting" });
    }
  });

  app.post("/api/meetings", async (req, res) => {
    try {
      const result = insertMeetingSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid meeting data", errors: result.error.errors });
        return;
      }
      
      // If researchId is provided, get the researcher from the associated research
      let meetingData = result.data;
      if (meetingData.researchId) {
        const research = await storage.getResearch(meetingData.researchId);
        if (research) {
          // Set the researcher field to match the research's researcher
          meetingData = {
            ...meetingData,
            researcher: research.researcher
          };
        }
      }
      
      const meeting = await storage.createMeeting(meetingData);
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
      
      // If researchId is provided, get the researcher from the associated research
      let meetingData = result.data;
      if (meetingData.researchId) {
        const research = await storage.getResearch(meetingData.researchId);
        if (research) {
          // Set the researcher field to match the research's researcher
          meetingData = {
            ...meetingData,
            researcher: research.researcher
          };
        }
      }
      
      const meeting = await storage.updateMeeting(Number(req.params.id), meetingData);
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

  // JTBD (Jobs to be Done) routes
  app.get("/api/jtbds", async (_req, res) => {
    try {
      const jtbds = await storage.getJtbds();
      res.json(jtbds);
    } catch (error) {
      console.error("Error fetching JTBDs:", error);
      res.status(500).json({ message: "Failed to fetch JTBDs" });
    }
  });

  app.get("/api/jtbds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid JTBD ID" });
        return;
      }
      const jtbd = await storage.getJtbd(id);
      if (!jtbd) {
        res.status(404).json({ message: "JTBD not found" });
        return;
      }
      res.json(jtbd);
    } catch (error) {
      console.error("Error fetching JTBD:", error);
      res.status(500).json({ message: "Failed to fetch JTBD" });
    }
  });

  app.post("/api/jtbds", async (req, res) => {
    try {
      const result = insertJtbdSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid JTBD data", errors: result.error.errors });
        return;
      }
      const jtbd = await storage.createJtbd(result.data);
      res.status(201).json(jtbd);
    } catch (error) {
      console.error("Error creating JTBD:", error);
      res.status(500).json({ message: "Failed to create JTBD" });
    }
  });

  app.patch("/api/jtbds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid JTBD ID" });
        return;
      }
      const result = insertJtbdSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid JTBD data", errors: result.error.errors });
        return;
      }
      const jtbd = await storage.updateJtbd(id, result.data);
      if (!jtbd) {
        res.status(404).json({ message: "JTBD not found" });
        return;
      }
      res.json(jtbd);
    } catch (error) {
      console.error("Error updating JTBD:", error);
      res.status(500).json({ message: "Failed to update JTBD" });
    }
  });

  app.delete("/api/jtbds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid JTBD ID" });
        return;
      }
      const success = await storage.deleteJtbd(id);
      if (!success) {
        res.status(404).json({ message: "JTBD not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting JTBD:", error);
      res.status(500).json({ message: "Failed to delete JTBD" });
    }
  });

  // JTBD Relations with Research
  app.get("/api/researches/:id/jtbds", async (req, res) => {
    try {
      const researchId = parseInt(req.params.id);
      if (isNaN(researchId)) {
        res.status(400).json({ message: "Invalid Research ID" });
        return;
      }
      const jtbds = await storage.getJtbdsByResearch(researchId);
      res.json(jtbds);
    } catch (error) {
      console.error("Error fetching JTBDs for research:", error);
      res.status(500).json({ message: "Failed to fetch JTBDs for research" });
    }
  });

  app.post("/api/researches/:researchId/jtbds/:jtbdId", async (req, res) => {
    try {
      const researchId = parseInt(req.params.researchId);
      const jtbdId = parseInt(req.params.jtbdId);
      if (isNaN(researchId) || isNaN(jtbdId)) {
        res.status(400).json({ message: "Invalid IDs" });
        return;
      }
      await storage.addJtbdToResearch(researchId, jtbdId);
      res.status(204).send();
    } catch (error) {
      console.error("Error adding JTBD to research:", error);
      res.status(500).json({ message: "Failed to add JTBD to research" });
    }
  });

  app.delete("/api/researches/:researchId/jtbds/:jtbdId", async (req, res) => {
    try {
      const researchId = parseInt(req.params.researchId);
      const jtbdId = parseInt(req.params.jtbdId);
      if (isNaN(researchId) || isNaN(jtbdId)) {
        res.status(400).json({ message: "Invalid IDs" });
        return;
      }
      await storage.removeJtbdFromResearch(researchId, jtbdId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing JTBD from research:", error);
      res.status(500).json({ message: "Failed to remove JTBD from research" });
    }
  });

  // JTBD Relations with Meetings
  app.get("/api/meetings/:id/jtbds", async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      if (isNaN(meetingId)) {
        res.status(400).json({ message: "Invalid Meeting ID" });
        return;
      }
      const jtbds = await storage.getJtbdsByMeeting(meetingId);
      res.json(jtbds);
    } catch (error) {
      console.error("Error fetching JTBDs for meeting:", error);
      res.status(500).json({ message: "Failed to fetch JTBDs for meeting" });
    }
  });

  app.post("/api/meetings/:meetingId/jtbds/:jtbdId", async (req, res) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      const jtbdId = parseInt(req.params.jtbdId);
      if (isNaN(meetingId) || isNaN(jtbdId)) {
        res.status(400).json({ message: "Invalid IDs" });
        return;
      }
      await storage.addJtbdToMeeting(meetingId, jtbdId);
      res.status(204).send();
    } catch (error) {
      console.error("Error adding JTBD to meeting:", error);
      res.status(500).json({ message: "Failed to add JTBD to meeting" });
    }
  });

  app.delete("/api/meetings/:meetingId/jtbds/:jtbdId", async (req, res) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      const jtbdId = parseInt(req.params.jtbdId);
      if (isNaN(meetingId) || isNaN(jtbdId)) {
        res.status(400).json({ message: "Invalid IDs" });
        return;
      }
      await storage.removeJtbdFromMeeting(meetingId, jtbdId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing JTBD from meeting:", error);
      res.status(500).json({ message: "Failed to remove JTBD from meeting" });
    }
  });

  return createServer(app);
}