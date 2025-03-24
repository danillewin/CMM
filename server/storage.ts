import { meetings, researches, positions, teams, type Meeting, type InsertMeeting, type Research, type InsertResearch, type Position, type InsertPosition, type Team, type InsertTeam } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getMeetings(): Promise<Meeting[]>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meeting: InsertMeeting): Promise<Meeting | undefined>;
  deleteMeeting(id: number): Promise<boolean>;

  getResearches(): Promise<Research[]>;
  getResearch(id: number): Promise<Research | undefined>;
  createResearch(research: InsertResearch): Promise<Research>;
  updateResearch(id: number, research: InsertResearch): Promise<Research | undefined>;
  deleteResearch(id: number): Promise<boolean>;

  getPositions(): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;

  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
}

export class DatabaseStorage implements IStorage {
  async getMeetings(): Promise<Meeting[]> {
    return db.select().from(meetings);
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }

  async updateMeeting(id: number, meeting: InsertMeeting): Promise<Meeting | undefined> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set(meeting)
      .where(eq(meetings.id, id))
      .returning();
    return updatedMeeting;
  }

  async deleteMeeting(id: number): Promise<boolean> {
    const [deletedMeeting] = await db
      .delete(meetings)
      .where(eq(meetings.id, id))
      .returning();
    return !!deletedMeeting;
  }

  async getResearches(): Promise<Research[]> {
    return db.select().from(researches);
  }

  async getResearch(id: number): Promise<Research | undefined> {
    const [research] = await db.select().from(researches).where(eq(researches.id, id));
    return research;
  }

  async createResearch(research: InsertResearch): Promise<Research> {
    const [newResearch] = await db.insert(researches).values(research).returning();
    return newResearch;
  }

  async updateResearch(id: number, research: InsertResearch): Promise<Research | undefined> {
    const [updatedResearch] = await db
      .update(researches)
      .set(research)
      .where(eq(researches.id, id))
      .returning();
    return updatedResearch;
  }

  async deleteResearch(id: number): Promise<boolean> {
    const [deletedResearch] = await db
      .delete(researches)
      .where(eq(researches.id, id))
      .returning();
    return !!deletedResearch;
  }

  async getPositions(): Promise<Position[]> {
    return db.select().from(positions);
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const [newPosition] = await db.insert(positions).values(position).returning();
    return newPosition;
  }

  async getTeams(): Promise<Team[]> {
    return db.select().from(teams);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }
}

export const storage = new DatabaseStorage();