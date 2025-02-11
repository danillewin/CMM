import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMeetingSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  app.get("/api/meetings", async (_req, res) => {
    const meetings = await storage.getMeetings();
    res.json(meetings);
  });

  app.post("/api/meetings", async (req, res) => {
    const result = insertMeetingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid meeting data" });
      return;
    }
    const meeting = await storage.createMeeting(result.data);
    res.status(201).json(meeting);
  });

  app.patch("/api/meetings/:id", async (req, res) => {
    const result = insertMeetingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid meeting data" });
      return;
    }
    const meeting = await storage.updateMeeting(Number(req.params.id), result.data);
    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }
    res.json(meeting);
  });

  app.delete("/api/meetings/:id", async (req, res) => {
    const success = await storage.deleteMeeting(Number(req.params.id));
    if (!success) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }
    res.status(204).send();
  });

  return createServer(app);
}
