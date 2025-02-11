import { meetings, type Meeting, type InsertMeeting } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getMeetings(): Promise<Meeting[]>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meeting: InsertMeeting): Promise<Meeting | undefined>;
  deleteMeeting(id: number): Promise<boolean>;
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
}

export const storage = new DatabaseStorage();