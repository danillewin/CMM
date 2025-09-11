import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import { storage } from "./storage";
import { 
  insertMeetingSchema, 
  insertResearchSchema, 
  insertPositionSchema, 
  insertTeamSchema,
  insertJtbdSchema,
  insertCustomFilterSchema,
  insertMeetingAttachmentSchema,
  updateMeetingAttachmentSchema
} from "@shared/schema";

import { kafkaService } from "./kafka-service";
import { transcriptionService } from "./transcription-service";
import { ObjectStorageService } from "./objectStorage";

// Database initialization is handled by the storage layer

export function registerRoutes(app: Express): Server {
  // Database initialization is handled by storage layer

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

  // Dashboard data endpoint with server-side aggregation
  app.get("/api/dashboard", async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const researchFilter = req.query.researchFilter ? parseInt(req.query.researchFilter as string) : undefined;
      const teamFilter = req.query.teamFilter as string;
      const managerFilter = req.query.managerFilter as string;
      const researcherFilter = req.query.researcherFilter as string;
      
      const dashboardData = await storage.getDashboardData({
        year,
        researchFilter,
        teamFilter,
        managerFilter,
        researcherFilter
      });
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Roadmap-specific research endpoint
  app.get("/api/roadmap/researches", async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      const researchData = await storage.getRoadmapResearches(year);
      
      res.json({ data: researchData, total: researchData.length, year });
    } catch (error) {
      console.error("Error fetching roadmap researches:", error);
      res.status(500).json({ message: "Failed to fetch roadmap researches" });
    }
  });

  // Research routes
  app.get("/api/researches", async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sortBy = req.query.sortBy as string;
      const sortDir = req.query.sortDir as 'asc' | 'desc';
      const search = req.query.search as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      // If date range is provided, use a year calculation and filter via storage
      if (startDate && endDate) {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          // For date range queries, we'll still get all researches and filter them
          // This could be optimized further by adding a date range method to storage
          const allResearches = await storage.getResearches();
          const filteredResearches = allResearches.filter(research => {
            const resStart = new Date(research.dateStart);
            const resEnd = new Date(research.dateEnd);
            return resStart <= end && resEnd >= start;
          });
          
          res.json({ data: filteredResearches, total: filteredResearches.length });
        } catch (dateError) {
          console.error("Error parsing dates:", dateError);
          res.status(400).json({ message: "Invalid date format" });
        }
        return;
      }
      
      // Server-side filtering parameters for researches
      const status = req.query.status as string;
      const teams = req.query.teams as string | string[];
      const researchers = req.query.researchers as string | string[];
      const researchType = req.query.researchType as string;
      const products = req.query.products as string[];
      
      // Use paginated endpoint with all filter parameters for server-side filtering
      const paginatedResearches = await storage.getResearchesPaginated({ 
        page: page || 1, 
        limit: limit || 20,
        sortBy,
        sortDir,
        search,
        status,
        teams: Array.isArray(teams) ? teams.join(',') : teams || '',
        researchResearchers: Array.isArray(researchers) ? researchers.join(',') : researchers || '',
        researchType,
        products
      });
      res.json(paginatedResearches);
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
      // Log the questionBlocks data to debug JSON issues
      if (req.body.guideIntroQuestions) {
        console.log("guideIntroQuestions data:", req.body.guideIntroQuestions);
        console.log("guideIntroQuestions sample:", req.body.guideIntroQuestions[0]);
      }
      if (req.body.guideMainQuestions) {
        console.log("guideMainQuestions data:", req.body.guideMainQuestions);
        console.log("guideMainQuestions sample:", req.body.guideMainQuestions[0]);
      }
      if (req.body.guideConcludingQuestions) {
        console.log("guideConcludingQuestions data:", req.body.guideConcludingQuestions);
        console.log("guideConcludingQuestions sample:", req.body.guideConcludingQuestions[0]);
      }
      
      console.log("Request body for research update:", JSON.stringify(req.body, null, 2));
      const result = insertResearchSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Validation errors:", result.error.errors);
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

  // Calendar optimized endpoints - return minimal data for calendar view
  app.get("/api/calendar/meetings", async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const meetingsData = await storage.getCalendarMeetings(start, end);
        
        res.json({ data: meetingsData, total: meetingsData.length });
      } catch (dateError) {
        console.error("Error parsing dates:", dateError);
        res.status(400).json({ message: "Invalid date format" });
      }
    } catch (error) {
      console.error("Error fetching calendar meetings:", error);
      res.status(500).json({ message: "Failed to fetch calendar meetings" });
    }
  });

  app.get("/api/calendar/researches", async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const researchData = await storage.getCalendarResearches(start, end);
        
        res.json({ data: researchData, total: researchData.length });
      } catch (dateError) {
        console.error("Error parsing dates:", dateError);
        res.status(400).json({ message: "Invalid date format" });
      }
    } catch (error) {
      console.error("Error fetching calendar researches:", error);
      res.status(500).json({ message: "Failed to fetch calendar researches" });
    }
  });

  // Meeting routes
  app.get("/api/meetings", async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sortBy = req.query.sortBy as string;
      const sortDir = req.query.sortDir as 'asc' | 'desc';
      const researchId = req.query.researchId ? parseInt(req.query.researchId as string) : undefined;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      // Server-side filtering parameters
      const search = req.query.search as string;
      const status = req.query.status as string;
      const researchIds = req.query.research_ids as string;
      const managers = req.query.managers as string;
      const recruiters = req.query.recruiters as string;
      const researchers = req.query.researchers as string;
      const positions = req.query.positions as string;
      const gift = req.query.gift as string;
      
      // If date range is provided, filter by date range (use calendar meetings method)
      if (startDate && endDate) {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          const meetingsData = await storage.getCalendarMeetings(start, end);
          
          res.json({ data: meetingsData, total: meetingsData.length });
        } catch (dateError) {
          console.error("Error parsing dates:", dateError);
          res.status(400).json({ message: "Invalid date format" });
        }
        return;
      }
      
      // Use paginated endpoint with all filter parameters for server-side filtering
      const paginatedMeetings = await storage.getMeetingsPaginated({ 
        page: page || 1, 
        limit: limit || 20,
        sortBy,
        sortDir,
        researchId,
        search,
        status,
        researchIds,
        managers,
        recruiters,
        researchers,
        positions,
        gift
      });
      res.json(paginatedMeetings);
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

  // Configure multer for transcription uploads (memory storage - audio/video only)
  const transcriptionUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
      files: 5, // Maximum 5 files
      fieldSize: 1024, // 1KB field value limit
      fieldNameSize: 100, // 100 bytes field name limit
    },
    fileFilter: (req, file, cb) => {
      // Accept audio and video files only for transcription
      const allowedTypes = [
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac',
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/mkv'
      ];
      
      const isValidType = allowedTypes.includes(file.mimetype) || 
                         /\.(mp3|wav|ogg|m4a|aac|flac|mp4|avi|mov|wmv|webm|mkv)$/i.test(file.originalname);
      
      if (isValidType) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only audio and video files are allowed for transcription.'));
      }
    }
  });

  // Configure multer for meeting file attachments (broader file type support with security)
  const meetingFileUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit per file
      files: 10, // Maximum 10 files per request
      fieldSize: 1024, // 1KB field value limit
      fieldNameSize: 100, // 100 bytes field name limit
      parts: 20, // Maximum 20 parts (fields + files)
    },
    fileFilter: (req, file, cb) => {
      // Sanitize filename
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Block dangerous file extensions
      const dangerousExtensions = /\.(exe|bat|cmd|scr|pif|vbs|js|jar|com|app|dmg|pkg|deb|rpm)$/i;
      if (dangerousExtensions.test(file.originalname)) {
        cb(new Error('File type not allowed for security reasons.'));
        return;
      }
      
      // Allow common document, image, audio, and video files
      const allowedTypes = [
        // Documents
        'application/pdf', 'text/plain', 'text/csv',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Audio
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac',
        // Video
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/mkv'
      ];
      
      const allowedExtensions = /\.(pdf|txt|csv|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|webp|svg|mp3|wav|ogg|m4a|aac|flac|mp4|avi|mov|wmv|webm|mkv)$/i;
      
      const isValidType = allowedTypes.includes(file.mimetype) && allowedExtensions.test(file.originalname);
      
      if (isValidType) {
        cb(null, true);
      } else {
        cb(new Error(`File type '${file.mimetype}' or extension not supported. Allowed: documents, images, audio, and video files.`));
      }
    }
  });

  // Transcription endpoint
  app.post("/api/transcribe", transcriptionUpload.array('files'), async (req, res) => {
    try {
      console.log("Request received:", {
        files: req.files ? req.files.length : 0,
        body: req.body,
        contentType: req.headers['content-type']
      });
      
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        console.log("No files in request, req.files:", req.files);
        res.status(400).json({ message: "No files provided" });
        return;
      }

      console.log(`Transcription request: ${files.length} files, total size: ${files.reduce((sum, f) => sum + f.size, 0)} bytes`);

      const result = await transcriptionService.transcribeFiles({ files });
      
      res.json(result);
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ 
        message: "Transcription failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Health check endpoint for transcription service
  app.get("/api/transcribe/health", async (req, res) => {
    try {
      const health = await transcriptionService.healthCheck();
      res.json(health);
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ message: "Health check failed" });
    }
  });

  // Initialize object storage service
  const objectStorageService = new ObjectStorageService();

  // Meeting file attachment API routes
  
  // Upload files for a meeting
  app.post("/api/meetings/:meetingId/files", meetingFileUpload.array('files'), async (req, res) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      if (isNaN(meetingId)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }

      // Verify meeting exists
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      console.log(`File upload request for meeting ${meetingId}: ${files.length} files, total size: ${files.reduce((sum, f) => sum + f.size, 0)} bytes`);

      const uploadedAttachments = [];

      // Process each file
      for (const file of files) {
        try {
          // Get upload URL from object storage
          const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
          
          // Upload file to storage
          const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: file.buffer,
            headers: {
              'Content-Type': file.mimetype,
            },
          });

          if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
          }

          // Get the object path from the upload URL
          const objectPath = objectStorageService.normalizeObjectEntityPath(uploadUrl);

          // Save metadata to database
          const attachmentData = {
            meetingId,
            fileName: file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'), // Sanitize filename
            originalName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            objectPath,
            transcriptionStatus: 'pending' as const,
          };

          const attachment = await storage.createMeetingAttachment(attachmentData);
          uploadedAttachments.push(attachment);

          console.log(`Successfully uploaded file: ${file.originalname} for meeting ${meetingId}`);
        } catch (fileError) {
          console.error(`Error uploading file ${file.originalname}:`, fileError);
          // Continue with other files, but log the error
        }
      }

      if (uploadedAttachments.length === 0) {
        return res.status(500).json({ message: "Failed to upload any files" });
      }

      res.status(201).json({
        message: `Successfully uploaded ${uploadedAttachments.length} file(s)`,
        files: uploadedAttachments
      });

    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ 
        message: "File upload failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get files for a meeting
  app.get("/api/meetings/:meetingId/files", async (req, res) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      if (isNaN(meetingId)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }

      const attachments = await storage.getMeetingAttachments(meetingId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching meeting files:", error);
      res.status(500).json({ message: "Failed to fetch meeting files" });
    }
  });

  // Download a specific file
  app.get("/api/files/:fileId/download", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }

      const attachment = await storage.getMeetingAttachment(fileId);
      if (!attachment) {
        return res.status(404).json({ message: "File not found" });
      }

      // Get the file from object storage
      const objectFile = await objectStorageService.getObjectEntityFile(attachment.objectPath);
      
      // Set filename header
      res.set('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
      
      // Stream the file
      await objectStorageService.downloadObject(objectFile, res);
      
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Delete a specific file
  app.delete("/api/files/:fileId", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }

      const success = await storage.deleteMeetingAttachment(fileId);
      if (!success) {
        return res.status(404).json({ message: "File not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Start transcription for a specific file
  app.post("/api/files/:fileId/transcribe", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }

      const attachment = await storage.getMeetingAttachment(fileId);
      if (!attachment) {
        return res.status(404).json({ message: "File not found" });
      }

      // Update status to in_progress
      await storage.updateMeetingAttachment(fileId, {
        transcriptionStatus: 'in_progress'
      });

      // TODO: Implement async transcription processing
      // For now, return a response indicating transcription has started
      res.json({
        message: "Transcription started",
        fileId,
        status: "in_progress"
      });

    } catch (error) {
      console.error("Error starting transcription:", error);
      res.status(500).json({ message: "Failed to start transcription" });
    }
  });

  // Get transcription status for a specific file
  app.get("/api/files/:fileId/transcription", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }

      const attachment = await storage.getMeetingAttachment(fileId);
      if (!attachment) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json({
        fileId,
        status: attachment.transcriptionStatus,
        text: attachment.transcriptionText,
        retryCount: attachment.transcriptionRetryCount,
        lastAttempt: attachment.lastTranscriptionAttempt,
        error: attachment.errorMessage
      });

    } catch (error) {
      console.error("Error fetching transcription status:", error);
      res.status(500).json({ message: "Failed to fetch transcription status" });
    }
  });

  // Custom filters API routes
  app.get("/api/custom-filters", async (req, res) => {
    try {
      const { pageType, createdBy } = req.query;
      const filters = await storage.getCustomFilters(
        pageType as string,
        createdBy as string
      );
      res.json(filters);
    } catch (error) {
      console.error("Error fetching custom filters:", error);
      res.status(500).json({ message: "Failed to fetch custom filters" });
    }
  });

  app.get("/api/custom-filters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid filter ID" });
        return;
      }
      const filter = await storage.getCustomFilter(id);
      if (!filter) {
        res.status(404).json({ message: "Custom filter not found" });
        return;
      }
      res.json(filter);
    } catch (error) {
      console.error("Error fetching custom filter:", error);
      res.status(500).json({ message: "Failed to fetch custom filter" });
    }
  });

  app.post("/api/custom-filters", async (req, res) => {
    try {
      const validation = insertCustomFilterSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          message: "Invalid custom filter data",
          errors: validation.error.issues
        });
        return;
      }
      const newFilter = await storage.createCustomFilter(validation.data);
      res.status(201).json(newFilter);
    } catch (error) {
      console.error("Error creating custom filter:", error);
      res.status(500).json({ message: "Failed to create custom filter" });
    }
  });

  app.patch("/api/custom-filters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid filter ID" });
        return;
      }
      const updatedFilter = await storage.updateCustomFilter(id, req.body);
      if (!updatedFilter) {
        res.status(404).json({ message: "Custom filter not found" });
        return;
      }
      res.json(updatedFilter);
    } catch (error) {
      console.error("Error updating custom filter:", error);
      res.status(500).json({ message: "Failed to update custom filter" });
    }
  });

  app.delete("/api/custom-filters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid filter ID" });
        return;
      }
      const success = await storage.deleteCustomFilter(id);
      if (!success) {
        res.status(404).json({ message: "Custom filter not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom filter:", error);
      res.status(500).json({ message: "Failed to delete custom filter" });
    }
  });

  // Filter data endpoints for search multiselect
  app.get("/api/filters/researches", async (req, res) => {
    try {
      const { search = "", page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await storage.getResearchesForFilter(search as string, limitNum, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching researches for filter:", error);
      res.status(500).json({ message: "Failed to fetch researches" });
    }
  });

  app.get("/api/filters/managers", async (req, res) => {
    try {
      const { search = "", page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await storage.getManagersForFilter(search as string, limitNum, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching managers for filter:", error);
      res.status(500).json({ message: "Failed to fetch managers" });
    }
  });

  app.get("/api/filters/recruiters", async (req, res) => {
    try {
      const { search = "", page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await storage.getRecruitersForFilter(search as string, limitNum, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching recruiters for filter:", error);
      res.status(500).json({ message: "Failed to fetch recruiters" });
    }
  });

  app.get("/api/filters/researchers", async (req, res) => {
    try {
      const { search = "", page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await storage.getResearchersForFilter(search as string, limitNum, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching researchers for filter:", error);
      res.status(500).json({ message: "Failed to fetch researchers" });
    }
  });

  app.get("/api/filters/positions", async (req, res) => {
    try {
      const { search = "", page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await storage.getPositionsForFilter(search as string, limitNum, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching positions for filter:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  app.get("/api/filters/teams", async (req, res) => {
    try {
      const { search = "", page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await storage.getTeamsForFilter(search as string, limitNum, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching teams for filter:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  return createServer(app);
}