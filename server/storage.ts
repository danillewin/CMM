import { 
  meetings, 
  researches, 
  positions, 
  teams, 
  jtbds,
  researchJtbds,
  meetingJtbds,
  type Meeting, 
  type InsertMeeting, 
  type Research, 
  type InsertResearch, 
  type Position, 
  type InsertPosition, 
  type Team, 
  type InsertTeam,
  type Jtbd,
  type InsertJtbd,
  type ResearchJtbd,
  type MeetingJtbd
} from "@shared/schema";
import { db, pool } from "./db";
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
  deletePosition(id: number): Promise<boolean>;

  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  deleteTeam(id: number): Promise<boolean>;
  
  // JTBD methods
  getJtbds(): Promise<Jtbd[]>;
  getJtbd(id: number): Promise<Jtbd | undefined>;
  createJtbd(jtbd: InsertJtbd): Promise<Jtbd>;
  updateJtbd(id: number, jtbd: InsertJtbd): Promise<Jtbd | undefined>;
  deleteJtbd(id: number): Promise<boolean>;
  
  // Relations for JTBD
  getJtbdsByResearch(researchId: number): Promise<Jtbd[]>;
  getJtbdsByMeeting(meetingId: number): Promise<Jtbd[]>;
  
  // Add/remove JTBD connections
  addJtbdToResearch(researchId: number, jtbdId: number): Promise<void>;
  removeJtbdFromResearch(researchId: number, jtbdId: number): Promise<void>;
  addJtbdToMeeting(meetingId: number, jtbdId: number): Promise<void>;
  removeJtbdFromMeeting(meetingId: number, jtbdId: number): Promise<void>;
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
    try {
      // The DB requires a 'manager' field - we need to add it directly with SQL
      const { relationshipManager } = meeting;
      
      // Use SQL directly to insert meeting
      const query = `
        INSERT INTO meetings (
          respondent_name, respondent_position, cnum, 
          gcc, company_name, email, researcher, 
          relationship_manager, recruiter, date, 
          research_id, status, notes, has_gift, manager
        ) VALUES (
          $1, $2, $3, 
          $4, $5, $6, $7, 
          $8, $9, $10, 
          $11, $12, $13, $14, $15
        ) RETURNING *
      `;
      
      const values = [
        meeting.respondentName,
        meeting.respondentPosition,
        meeting.cnum,
        meeting.gcc || null,
        meeting.companyName || null,
        meeting.email || null,
        meeting.researcher || null,
        meeting.relationshipManager,
        meeting.salesPerson,
        meeting.date,
        meeting.researchId,
        meeting.status,
        meeting.notes || null,
        meeting.hasGift || "no", // Gift indicator field
        relationshipManager // Use the same value for the manager field
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error in createMeeting:", error);
      throw error;
    }
  }

  async updateMeeting(id: number, meeting: InsertMeeting): Promise<Meeting | undefined> {
    try {
      // The DB requires a 'manager' field - we need to update it directly with SQL
      const { relationshipManager } = meeting;
      
      // Use SQL directly to update meeting
      const query = `
        UPDATE meetings SET
          respondent_name = $1,
          respondent_position = $2,
          cnum = $3,
          gcc = $4,
          company_name = $5,
          email = $6,
          researcher = $7,
          relationship_manager = $8,
          recruiter = $9,
          date = $10,
          research_id = $11,
          status = $12,
          notes = $13,
          has_gift = $14,
          manager = $15
        WHERE id = $16
        RETURNING *
      `;
      
      const values = [
        meeting.respondentName,
        meeting.respondentPosition,
        meeting.cnum,
        meeting.gcc || null,
        meeting.companyName || null,
        meeting.email || null,
        meeting.researcher || null,
        meeting.relationshipManager,
        meeting.salesPerson,
        meeting.date,
        meeting.researchId,
        meeting.status,
        meeting.notes || null,
        meeting.hasGift || "no", // Gift indicator field
        relationshipManager, // Use the same value for the manager field
        id
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      return result.rows[0];
    } catch (error) {
      console.error("Error in updateMeeting:", error);
      throw error;
    }
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
    // First check if there are any meetings associated with this research
    const associatedMeetings = await db
      .select()
      .from(meetings)
      .where(eq(meetings.researchId, id));

    if (associatedMeetings.length > 0) {
      throw new Error("Cannot delete research that has associated meetings");
    }

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

  async deletePosition(id: number): Promise<boolean> {
    // First check if this position is used by any meetings
    const position = (await this.getPositions()).find(p => p.id === id);
    if (!position) return false;
    
    const positionName = position.name;
    const meetingsUsingPosition = await db
      .select()
      .from(meetings)
      .where(eq(meetings.respondentPosition, positionName));
      
    if (meetingsUsingPosition.length > 0) {
      throw new Error("Cannot delete position that is used by meetings");
    }

    // Then delete the position
    const [deletedPosition] = await db
      .delete(positions)
      .where(eq(positions.id, id))
      .returning();
    return !!deletedPosition;
  }

  async getTeams(): Promise<Team[]> {
    return db.select().from(teams);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const team = (await this.getTeams()).find(t => t.id === id);
    if (!team) return false;

    // Check if team has any associated researches
    const teamResearches = await db
      .select()
      .from(researches)
      .where(eq(researches.team, team.name));

    if (teamResearches.length > 0) {
      throw new Error("Cannot delete team that has associated researches");
    }

    const [deletedTeam] = await db
      .delete(teams)
      .where(eq(teams.id, id))
      .returning();
    return !!deletedTeam;
  }
}

export const storage = new DatabaseStorage();