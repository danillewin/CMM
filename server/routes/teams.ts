import { Router } from "express";
import { db } from "../db";
import { teams, insertTeamSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all teams
router.get("/api/teams", async (req, res) => {
  try {
    const allTeams = await db.select().from(teams);
    res.json(allTeams);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// Add a new team
router.post("/api/teams", async (req, res) => {
  try {
    const data = insertTeamSchema.parse(req.body);
    const existingTeam = await db.select().from(teams).where(eq(teams.name, data.name));
    
    if (existingTeam.length > 0) {
      return res.json(existingTeam[0]);
    }

    const [newTeam] = await db.insert(teams).values(data).returning();
    res.status(201).json(newTeam);
  } catch (error) {
    res.status(400).json({ error: "Invalid team data" });
  }
});

export default router;
