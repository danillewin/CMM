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
  updateMeetingAttachmentSchema,
  insertResearchMeetingDtoSchema,
  updateResearchMeetingDtoSchema,
  ResearchMeetingDto,
  InsertResearchMeetingDto,
  Meeting,
  MeetingStatus
} from "@shared/schema";

import { kafkaService } from "./kafka-service";
import { transcriptionService } from "./transcription-service";
import { ObjectStorageService } from "./objectStorage";
import { asyncTranscriptionProcessor } from "./async-transcription-processor";

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
    } catch (error: any) {
      console.error("Error creating position:", error);
      if (error.code === '23505' && error.constraint === 'positions_name_unique') {
        res.status(409).json({ message: "Position with this name already exists" });
      } else {
        res.status(500).json({ message: "Failed to create position" });
      }
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

  // Configure multer for transcription uploads (K8s-compatible streaming)
  const transcriptionUpload = multer({ 
    storage: multer.memoryStorage(), // Memory storage with immediate processing
    limits: {
      fileSize: 500 * 1024 * 1024, // Increased to 500MB limit
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

  // Configure multer for meeting file attachments (K8s-compatible streaming)
  const meetingFileUpload = multer({ 
    storage: multer.memoryStorage(), // Use memory storage but with streaming to object storage
    limits: {
      fileSize: 500 * 1024 * 1024, // Increased to 500MB limit per file
      files: 10, // Maximum 10 files per request
      fieldSize: 1024, // 1KB field value limit
      fieldNameSize: 100, // 100 bytes field name limit
      parts: 20, // Maximum 20 parts (fields + files)
    },
    fileFilter: (req, file, cb) => {
      // Combined file filter for K8s compatibility and security
      
      // Check file size for K8s memory considerations
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
        cb(new Error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`));
        return;
      }
      
      // Block dangerous file extensions for security
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
      
      // No cleanup needed for memory storage
      
      res.json(result);
    } catch (error) {
      console.error("Transcription error:", error);
      
      // No cleanup needed for memory storage
      
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
          
          // Upload file to storage using memory buffer (K8s compatible)
          const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: file.buffer,
            headers: {
              'Content-Type': file.mimetype,
              'Content-Length': file.size.toString(),
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
          
          // No cleanup needed - memory buffer automatically freed
        } catch (fileError) {
          console.error(`Error uploading file ${file.originalname}:`, fileError);
        }
      }

      if (uploadedAttachments.length === 0) {
        return res.status(500).json({ message: "Failed to upload any files" });
      }

      res.status(201).json({
        message: `Successfully uploaded ${uploadedAttachments.length} file(s)`,
        files: uploadedAttachments
      });

      // Start async transcription processing for uploaded files
      if (uploadedAttachments.length > 0) {
        asyncTranscriptionProcessor.startAsyncTranscriptionForMeeting(meetingId);
        console.log(`Started async transcription processing for meeting ${meetingId}`);
      }

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

      // Start async transcription processing
      asyncTranscriptionProcessor.processFileTranscription(fileId);

      res.json({
        message: "Transcription started",
        fileId,
        status: "processing"
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

  // Retry failed transcription for a specific file
  app.post("/api/files/:fileId/transcription/retry", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }

      const success = await asyncTranscriptionProcessor.retryFailedTranscription(fileId);
      
      if (success) {
        res.json({
          message: "Transcription retry started",
          fileId,
          status: "retrying"
        });
      } else {
        res.status(400).json({
          message: "Cannot retry transcription for this file",
          reason: "File is not in failed or pending state"
        });
      }

    } catch (error) {
      console.error("Error retrying transcription:", error);
      res.status(500).json({ message: "Failed to retry transcription" });
    }
  });

  // Get transcription summary for all files in a meeting
  app.get("/api/meetings/:meetingId/transcription-summary", async (req, res) => {
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

      const summary = await asyncTranscriptionProcessor.getTranscriptionSummary(meetingId);
      res.json(summary);

    } catch (error) {
      console.error("Error fetching transcription summary:", error);
      res.status(500).json({ message: "Failed to fetch transcription summary" });
    }
  });

  // Start/restart transcription for all files in a meeting
  app.post("/api/meetings/:meetingId/transcription/start", async (req, res) => {
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

      // Start async processing for all pending files
      asyncTranscriptionProcessor.startAsyncTranscriptionForMeeting(meetingId);

      res.json({
        message: "Transcription processing started for all pending files",
        meetingId
      });

    } catch (error) {
      console.error("Error starting meeting transcription:", error);
      res.status(500).json({ message: "Failed to start meeting transcription" });
    }
  });

  // Authentication middleware to extract user info from token
  const extractUser = (req: any, res: any, next: any) => {
    // Check for explicit development mode flag
    if (process.env.SERVER_DEV_AUTH === 'true') {
      req.user = {
        sub: 'dev-user-id',
        preferred_username: 'dev-user',
        email: 'dev@example.com',
        name: 'Development User'
      };
      return next();
    }

    // Extract user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null; // Anonymous user
      return next();
    }

    // Extract token
    const token = authHeader.substring(7);
    
    // TODO: Add actual JWT token validation when Keycloak is configured
    // For development, parse token without validation (INSECURE - for dev only)
    if (process.env.NODE_ENV === 'development') {
      // Handle specific mock token from frontend development mode
      if (token === 'mock-token-dev-user') {
        req.user = {
          sub: 'dev-user-id',
          preferred_username: 'dev-user',
          email: 'dev@example.com',
          name: 'Development User'
        };
      } else {
        try {
          // Simple base64 decode for development (DO NOT USE IN PRODUCTION)
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          req.user = {
            sub: payload.sub || 'anonymous',
            preferred_username: payload.preferred_username,
            email: payload.email,
            name: payload.name
          };
        } catch (error) {
          req.user = null;
        }
      }
    } else {
      // In production, we need proper JWT validation
      // TODO: Implement proper JWT verification with Keycloak JWKS
      req.user = null;
    }
    
    next();
  };

  // Custom filters API routes
  app.get("/api/custom-filters", extractUser, async (req: any, res) => {
    try {
      const { pageType } = req.query;
      const currentUserSub = req.user?.sub;
      
      // Get filters for current user (if authenticated) and shared filters
      const filters = await storage.getCustomFilters(
        pageType as string,
        currentUserSub
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

  app.post("/api/custom-filters", extractUser, async (req: any, res) => {
    try {
      const currentUserSub = req.user?.sub;
      if (!currentUserSub) {
        res.status(401).json({ message: "Authentication required to create filters" });
        return;
      }

      const validation = insertCustomFilterSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          message: "Invalid custom filter data",
          errors: validation.error.issues
        });
        return;
      }

      // Set createdBy from authenticated user, not from request body
      const filterData = {
        ...validation.data,
        createdBy: currentUserSub
      };

      const newFilter = await storage.createCustomFilter(filterData);
      res.status(201).json(newFilter);
    } catch (error) {
      console.error("Error creating custom filter:", error);
      res.status(500).json({ message: "Failed to create custom filter" });
    }
  });

  app.patch("/api/custom-filters/:id", extractUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid filter ID" });
        return;
      }

      const currentUserSub = req.user?.sub;
      if (!currentUserSub) {
        res.status(401).json({ message: "Authentication required to update filters" });
        return;
      }

      // Check if filter exists and user owns it
      const existingFilter = await storage.getCustomFilter(id);
      if (!existingFilter) {
        res.status(404).json({ message: "Custom filter not found" });
        return;
      }

      if (existingFilter.createdBy !== currentUserSub) {
        res.status(403).json({ message: "You can only update your own filters" });
        return;
      }

      // Only allow updating specific fields, prevent changing createdBy
      const allowedUpdateFields = {
        name: req.body.name,
        description: req.body.description,
        filters: req.body.filters,
        shared: req.body.shared
      };

      // Remove undefined fields
      const updateData = Object.fromEntries(
        Object.entries(allowedUpdateFields).filter(([_, value]) => value !== undefined)
      );

      const updatedFilter = await storage.updateCustomFilter(id, updateData);
      res.json(updatedFilter);
    } catch (error) {
      console.error("Error updating custom filter:", error);
      res.status(500).json({ message: "Failed to update custom filter" });
    }
  });

  app.delete("/api/custom-filters/:id", extractUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid filter ID" });
        return;
      }

      const currentUserSub = req.user?.sub;
      if (!currentUserSub) {
        res.status(401).json({ message: "Authentication required to delete filters" });
        return;
      }

      // Check if filter exists and user owns it
      const existingFilter = await storage.getCustomFilter(id);
      if (!existingFilter) {
        res.status(404).json({ message: "Custom filter not found" });
        return;
      }

      if (existingFilter.createdBy !== currentUserSub) {
        res.status(403).json({ message: "You can only delete your own filters" });
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

  // Kafka resend API endpoints
  // Resend completed meetings by ID list
  app.post("/api/kafka/resend-meetings", async (req, res) => {
    try {
      const { meetingIds } = req.body;
      
      if (!Array.isArray(meetingIds) || meetingIds.length === 0) {
        return res.status(400).json({ 
          message: "Invalid request: meetingIds must be a non-empty array" 
        });
      }
      
      const results: {
        success: number[];
        failed: { id: any; error: string }[];
        notFound: number[];
      } = {
        success: [],
        failed: [],
        notFound: []
      };
      
      for (const meetingId of meetingIds) {
        try {
          const id = parseInt(meetingId);
          if (isNaN(id)) {
            results.failed.push({ id: meetingId, error: "Invalid ID format" });
            continue;
          }
          
          const meeting = await storage.getMeeting(id);
          if (!meeting) {
            results.notFound.push(id);
            continue;
          }
          
          // Use the enhanced sendCompletedMeeting method
          await kafkaService.sendCompletedMeeting(meeting, true);
          results.success.push(id);
          
        } catch (error) {
          console.error(`Error resending meeting ${meetingId}:`, error);
          results.failed.push({ 
            id: meetingId, 
            error: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }
      
      const status = results.failed.length > 0 ? 207 : 200; // Multi-status if any failures
      res.status(status).json({
        message: `Processed ${meetingIds.length} meeting(s)`,
        results
      });
      
    } catch (error) {
      console.error("Error in resend meetings endpoint:", error);
      res.status(500).json({ message: "Failed to resend meetings" });
    }
  });
  
  // Resend completed researches by ID list
  app.post("/api/kafka/resend-researches", async (req, res) => {
    try {
      const { researchIds } = req.body;
      
      if (!Array.isArray(researchIds) || researchIds.length === 0) {
        return res.status(400).json({ 
          message: "Invalid request: researchIds must be a non-empty array" 
        });
      }
      
      const results: {
        success: number[];
        failed: { id: any; error: string }[];
        notFound: number[];
      } = {
        success: [],
        failed: [],
        notFound: []
      };
      
      for (const researchId of researchIds) {
        try {
          const id = parseInt(researchId);
          if (isNaN(id)) {
            results.failed.push({ id: researchId, error: "Invalid ID format" });
            continue;
          }
          
          const research = await storage.getResearch(id);
          if (!research) {
            results.notFound.push(id);
            continue;
          }
          
          // Use the enhanced sendCompletedResearch method
          await kafkaService.sendCompletedResearch(research, true);
          results.success.push(id);
          
        } catch (error) {
          console.error(`Error resending research ${researchId}:`, error);
          results.failed.push({ 
            id: researchId, 
            error: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }
      
      const status = results.failed.length > 0 ? 207 : 200; // Multi-status if any failures
      res.status(status).json({
        message: `Processed ${researchIds.length} research(es)`,
        results
      });
      
    } catch (error) {
      console.error("Error in resend researches endpoint:", error);
      res.status(500).json({ message: "Failed to resend researches" });
    }
  });
  
  // Get Kafka service status
  app.get("/api/kafka/status", async (req, res) => {
    try {
      const status = kafkaService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting Kafka status:", error);
      res.status(500).json({ message: "Failed to get Kafka status" });
    }
  });

  // =========================================
  // OpenAPI-compatible Meeting Endpoints
  // =========================================

  // Helper function to map OpenAPI DTO to internal meeting format
  function mapDtoToMeeting(dto: InsertResearchMeetingDto, researchId: number): any {
    // Combine startTime and endTime with date to create time and meeting duration
    const timeRange = `${dto.startTime}-${dto.endTime}`;
    
    return {
      // Map OpenAPI fields to internal meeting fields
      cnum: dto.clientNumber.toUpperCase(),
      gcc: dto.gccNumber || null,
      companyName: dto.clientName.nameRu || dto.clientName.nameEn || "",
      respondentName: dto.contacts.length > 0 ? 
        `${dto.contacts[0].firstName} ${dto.contacts[0].lastName}` : 
        "External Contact",
      respondentPosition: dto.contacts.length > 0 ? 
        (dto.contacts[0].position || "Not specified") : 
        "Not specified",
      email: dto.contacts.length > 0 && dto.contacts[0].emails.length > 0 ? 
        dto.contacts[0].emails[0] : null,
      relationshipManager: dto.clientManager || dto.createdBy,
      salesPerson: dto.employees.length > 0 ? dto.employees[0] : dto.createdBy,
      researcher: dto.employees.length > 1 ? dto.employees[1] : dto.employees[0],
      date: new Date(dto.date + "T00:00:00.000Z"),
      notes: dto.comment,
      researchId: researchId,
      status: MeetingStatus.SET, // Default status for external meetings
      fullText: `CRM ID: ${dto.crmId}\nEmployees: ${dto.employees.join(", ")}\nContacts: ${dto.contacts.map(c => `${c.firstName} ${c.lastName} (${c.position || "N/A"})`).join(", ")}`
    };
  }

  // Helper function to map internal meeting to OpenAPI DTO format
  function mapMeetingToDto(meeting: Meeting, crmId?: string): ResearchMeetingDto {
    // Default time values since time field doesn't exist in database
    const startTime = "09:00";
    const endTime = "10:00";
    
    // Parse contact information from respondent data
    const names = meeting.respondentName.split(" ");
    const firstName = names[0] || "Unknown";
    const lastName = names.slice(1).join(" ") || "Contact";
    
    return {
      id: meeting.id,
      crmId: crmId || `meeting-${meeting.id}`, // Generate CRM ID if not provided
      clientId: undefined, // Not stored in internal format
      clientNumber: meeting.cnum,
      gccNumber: meeting.gcc,
      clientManager: meeting.relationshipManager,
      clientName: {
        nameRu: meeting.companyName || null,
        nameEn: null,
        fullNameRu: meeting.companyName || null,
        fullNameEn: null,
      },
      createdBy: meeting.salesPerson,
      date: meeting.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      startTime,
      endTime,
      employees: [meeting.salesPerson, meeting.researcher].filter((emp): emp is string => Boolean(emp)).filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      comment: meeting.notes || "",
      contacts: [{
        firstName,
        lastName,
        middleName: null,
        emails: meeting.email ? [meeting.email] : [],
        phones: [],
        categories: ["Primary Contact"],
        position: meeting.respondentPosition,
      }],
    };
  }

  // Helper function to validate position exists
  // Throws an error if storage fails, returns boolean for validation result
  async function validatePosition(position: string): Promise<boolean> {
    const positions = await storage.getPositions();
    return positions.some(p => p.name === position);
  }

  // Helper function to handle database errors
  function handleDatabaseError(error: any, operation: string) {
    console.error(`Error in ${operation}:`, error);
    
    // Handle foreign key constraint violations
    if (error.code === '23503') {
      if (error.constraint === 'meetings_respondent_position_positions_name_fk') {
        return {
          status: 400,
          message: "Invalid respondent position. Position must exist in the system.",
          details: `Position '${error.detail?.match(/Key \(respondent_position\)=\(([^)]+)\)/)?.[1] || 'unknown'}' is not available.`
        };
      }
      // Handle other foreign key violations
      return {
        status: 400,
        message: "Invalid reference data provided",
        details: error.detail || "Referenced data does not exist"
      };
    }
    
    // Handle other known database errors
    if (error.code === '23505') {
      return {
        status: 409,
        message: "Duplicate data conflict",
        details: error.detail || "Data already exists"
      };
    }
    
    // Default to 500 for unknown errors
    return {
      status: 500,
      message: `Failed to ${operation.replace(/([A-Z])/g, ' $1').toLowerCase()}`
    };
  }

  // POST /researches/{researchId}/meetings - Create meeting
  app.post("/researches/:researchId/meetings", async (req, res) => {
    try {
      const researchId = parseInt(req.params.researchId);
      if (isNaN(researchId)) {
        return res.status(400).json({ message: "Invalid research ID" });
      }

      // Validate request body
      const result = insertResearchMeetingDtoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid meeting data", 
          errors: result.error.errors 
        });
      }

      // Check if research exists
      const research = await storage.getResearch(researchId);
      if (!research) {
        return res.status(404).json({ message: "Research not found" });
      }

      // Validate that the respondent position exists
      const firstContact = result.data.contacts?.[0];
      if (firstContact?.position) {
        const positionExists = await validatePosition(firstContact.position);
        if (!positionExists) {
          return res.status(400).json({ 
            message: "Invalid respondent position", 
            details: `Position '${firstContact.position}' does not exist in the system. Please use an existing position or create it first.`
          });
        }
      }

      // Map DTO to internal format and create meeting
      const meetingData = mapDtoToMeeting(result.data, researchId);
      const meeting = await storage.createMeeting(meetingData);

      // Return the meeting in OpenAPI format
      const responseDto = mapMeetingToDto(meeting, result.data.crmId);
      res.status(201).json(responseDto);
    } catch (error: any) {
      const errorResponse = handleDatabaseError(error, "createMeeting");
      res.status(errorResponse.status).json({
        message: errorResponse.message,
        ...(errorResponse.details && { details: errorResponse.details })
      });
    }
  });

  // PUT /researches/{researchId}/meetings/{meetingId} - Update meeting
  app.put("/researches/:researchId/meetings/:meetingId", async (req, res) => {
    try {
      const researchId = parseInt(req.params.researchId);
      const meetingId = parseInt(req.params.meetingId);
      
      if (isNaN(researchId) || isNaN(meetingId)) {
        return res.status(400).json({ message: "Invalid research ID or meeting ID" });
      }

      // Validate request body with full DTO schema for updates
      const result = updateResearchMeetingDtoSchema.safeParse({
        ...req.body,
        id: meetingId
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid meeting data", 
          errors: result.error.errors 
        });
      }

      // Check if research exists
      const research = await storage.getResearch(researchId);
      if (!research) {
        return res.status(404).json({ message: "Research not found" });
      }

      // Check if meeting exists and belongs to the research
      const existingMeeting = await storage.getMeeting(meetingId);
      if (!existingMeeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      if (existingMeeting.researchId !== researchId) {
        return res.status(400).json({ message: "Meeting does not belong to the specified research" });
      }

      // Validate that the respondent position exists (if being updated)
      const firstContact = result.data.contacts?.[0];
      if (firstContact?.position) {
        const positionExists = await validatePosition(firstContact.position);
        if (!positionExists) {
          return res.status(400).json({ 
            message: "Invalid respondent position", 
            details: `Position '${firstContact.position}' does not exist in the system. Please use an existing position or create it first.`
          });
        }
      }

      // Map DTO to internal format and update meeting
      const updateData = mapDtoToMeeting(result.data as any, researchId);
      const updatedMeeting = await storage.updateMeeting(meetingId, updateData);

      if (!updatedMeeting) {
        return res.status(404).json({ message: "Meeting not found after update" });
      }

      // Return the updated meeting in OpenAPI format
      const responseDto = mapMeetingToDto(updatedMeeting, result.data.crmId);
      res.json(responseDto);
    } catch (error: any) {
      const errorResponse = handleDatabaseError(error, "updateMeeting");
      res.status(errorResponse.status).json({
        message: errorResponse.message,
        ...(errorResponse.details && { details: errorResponse.details })
      });
    }
  });

  // DELETE /researches/{researchId}/meetings/{meetingId} - Cancel/delete meeting
  app.delete("/researches/:researchId/meetings/:meetingId", async (req, res) => {
    try {
      const researchId = parseInt(req.params.researchId);
      const meetingId = parseInt(req.params.meetingId);
      
      if (isNaN(researchId) || isNaN(meetingId)) {
        return res.status(400).json({ message: "Invalid research ID or meeting ID" });
      }

      // Check if research exists
      const research = await storage.getResearch(researchId);
      if (!research) {
        return res.status(404).json({ message: "Research not found" });
      }

      // Check if meeting exists and belongs to the research
      const existingMeeting = await storage.getMeeting(meetingId);
      if (!existingMeeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      if (existingMeeting.researchId !== researchId) {
        return res.status(400).json({ message: "Meeting does not belong to the specified research" });
      }

      // Update meeting status to DECLINED instead of hard delete for data integrity
      const updatedMeeting = await storage.updateMeeting(meetingId, {
        ...existingMeeting,
        status: MeetingStatus.DECLINED,
        notes: (existingMeeting.notes || "") + " [CANCELLED via API]", // Override notes with cancellation message
        hasGift: (existingMeeting.hasGift === "yes" ? "yes" : "no") as "yes" | "no", // Ensure hasGift is valid
        summarizationStatus: (existingMeeting.summarizationStatus === "in_progress" || 
                            existingMeeting.summarizationStatus === "completed" || 
                            existingMeeting.summarizationStatus === "failed" ? 
                            existingMeeting.summarizationStatus : "not_started") as "not_started" | "in_progress" | "completed" | "failed",
        gcc: existingMeeting.gcc || undefined, // Convert null to undefined
        companyName: existingMeeting.companyName || undefined, // Convert null to undefined
        email: existingMeeting.email || undefined, // Convert null to undefined
        // Note: time and meetingLink fields don't exist in database schema
        fullText: existingMeeting.fullText || undefined, // Convert null to undefined
        researcher: existingMeeting.researcher || undefined // Convert null to undefined
      });

      res.status(200).json({ message: "Meeting cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling meeting via OpenAPI:", error);
      res.status(500).json({ message: "Failed to cancel meeting" });
    }
  });

  return createServer(app);
}