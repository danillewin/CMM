// JTBD implementation for storage.ts
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { jtbds, researchJtbds, meetingJtbds } from "@shared/schema";
import type { Jtbd, InsertJtbd } from "@shared/schema";

// Add these methods to the DatabaseStorage class in storage.ts
export const jtbdStorageMethods = {
  // JTBD Implementation
  async getJtbds(): Promise<Jtbd[]> {
    return db.select().from(jtbds);
  },

  async getJtbd(id: number): Promise<Jtbd | undefined> {
    const [jtbd] = await db
      .select()
      .from(jtbds)
      .where(eq(jtbds.id, id));
    return jtbd;
  },

  async createJtbd(jtbd: InsertJtbd): Promise<Jtbd> {
    const [newJtbd] = await db
      .insert(jtbds)
      .values(jtbd)
      .returning();
    return newJtbd;
  },

  async updateJtbd(id: number, jtbd: InsertJtbd): Promise<Jtbd | undefined> {
    const [updatedJtbd] = await db
      .update(jtbds)
      .set(jtbd)
      .where(eq(jtbds.id, id))
      .returning();
    return updatedJtbd;
  },

  async deleteJtbd(id: number): Promise<boolean> {
    try {
      // First remove any associations
      await db.delete(researchJtbds).where(eq(researchJtbds.jtbdId, id));
      await db.delete(meetingJtbds).where(eq(meetingJtbds.jtbdId, id));
      
      // Then delete the JTBD itself
      const [deletedJtbd] = await db
        .delete(jtbds)
        .where(eq(jtbds.id, id))
        .returning();
      return !!deletedJtbd;
    } catch (error) {
      console.error("Error deleting JTBD:", error);
      throw error;
    }
  },

  // JTBD Relations
  async getJtbdsByResearch(researchId: number): Promise<Jtbd[]> {
    const result = await db
      .select({
        jtbd: jtbds
      })
      .from(researchJtbds)
      .innerJoin(jtbds, eq(researchJtbds.jtbdId, jtbds.id))
      .where(eq(researchJtbds.researchId, researchId));
    
    return result.map(r => r.jtbd);
  },

  async getJtbdsByMeeting(meetingId: number): Promise<Jtbd[]> {
    const result = await db
      .select({
        jtbd: jtbds
      })
      .from(meetingJtbds)
      .innerJoin(jtbds, eq(meetingJtbds.jtbdId, jtbds.id))
      .where(eq(meetingJtbds.meetingId, meetingId));
    
    return result.map(r => r.jtbd);
  },

  // Add/Remove JTBD connections
  async addJtbdToResearch(researchId: number, jtbdId: number): Promise<void> {
    try {
      await db
        .insert(researchJtbds)
        .values({ researchId, jtbdId })
        .onConflictDoNothing();
    } catch (error) {
      console.error("Error adding JTBD to research:", error);
      throw error;
    }
  },

  async removeJtbdFromResearch(researchId: number, jtbdId: number): Promise<void> {
    try {
      await db
        .delete(researchJtbds)
        .where(
          and(
            eq(researchJtbds.researchId, researchId),
            eq(researchJtbds.jtbdId, jtbdId)
          )
        );
    } catch (error) {
      console.error("Error removing JTBD from research:", error);
      throw error;
    }
  },

  async addJtbdToMeeting(meetingId: number, jtbdId: number): Promise<void> {
    try {
      await db
        .insert(meetingJtbds)
        .values({ meetingId, jtbdId })
        .onConflictDoNothing();
    } catch (error) {
      console.error("Error adding JTBD to meeting:", error);
      throw error;
    }
  },

  async removeJtbdFromMeeting(meetingId: number, jtbdId: number): Promise<void> {
    try {
      await db
        .delete(meetingJtbds)
        .where(
          and(
            eq(meetingJtbds.meetingId, meetingId),
            eq(meetingJtbds.jtbdId, jtbdId)
          )
        );
    } catch (error) {
      console.error("Error removing JTBD from meeting:", error);
      throw error;
    }
  }
};