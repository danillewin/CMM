import { 
  meetings, 
  researches, 
  positions, 
  teams, 
  jtbds,
  researchJtbds,
  meetingJtbds,
  customFilters,
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
  type MeetingJtbd,
  type CustomFilter,
  type InsertCustomFilter,
  type PaginatedResponse,
  type PaginationParams,
  type MeetingTableItem,
  type ResearchTableItem
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";
import { kafkaService } from "./kafka-service";

export interface IStorage {
  getMeetings(): Promise<Meeting[]>;
  getMeetingsPaginated(params: PaginationParams): Promise<PaginatedResponse<MeetingTableItem>>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meeting: InsertMeeting): Promise<Meeting | undefined>;
  deleteMeeting(id: number): Promise<boolean>;

  getResearches(): Promise<Research[]>;
  getResearchesPaginated(params: PaginationParams): Promise<PaginatedResponse<ResearchTableItem>>;
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
  
  // Custom filters methods
  getCustomFilters(pageType?: string, createdBy?: string): Promise<CustomFilter[]>;
  getCustomFilter(id: number): Promise<CustomFilter | undefined>;
  createCustomFilter(filter: InsertCustomFilter): Promise<CustomFilter>;
  updateCustomFilter(id: number, filter: Partial<InsertCustomFilter>): Promise<CustomFilter | undefined>;
  deleteCustomFilter(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getMeetings(): Promise<Meeting[]> {
    return db.select().from(meetings);
  }

  async getMeetingsPaginated(params: PaginationParams): Promise<PaginatedResponse<MeetingTableItem>> {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    
    // Query for only essential fields for table display (no full_text, notes etc.)
    const query = `
      SELECT 
        id, respondent_name, respondent_position, company_name, researcher,
        relationship_manager, recruiter as sales_person, date, status, research_id,
        cnum
      FROM meetings 
      ORDER BY date DESC 
      LIMIT $1 OFFSET $2
    `;
    
    // Count total for hasMore calculation
    const countQuery = 'SELECT COUNT(*) as total FROM meetings';
    
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, [limit + 1, offset]), // Fetch one extra to check if more exists
      pool.query(countQuery)
    ]);
    
    const meetings = dataResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const hasMore = meetings.length > limit;
    
    // Remove the extra item if it exists
    if (hasMore) {
      meetings.pop();
    }
    
    // Map database fields to match MeetingTableItem type (only essential fields)
    const mappedMeetings: MeetingTableItem[] = meetings.map(row => ({
      id: row.id,
      respondentName: row.respondent_name,
      respondentPosition: row.respondent_position,
      companyName: row.company_name,
      researcher: row.researcher,
      relationshipManager: row.relationship_manager,
      salesPerson: row.sales_person,
      date: row.date,
      status: row.status,
      researchId: row.research_id,
      cnum: row.cnum
    }));
    
    return {
      data: mappedMeetings,
      hasMore,
      total
    };
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
          research_id, status, notes, full_text, has_gift, manager
        ) VALUES (
          $1, $2, $3, 
          $4, $5, $6, $7, 
          $8, $9, $10, 
          $11, $12, $13, $14, $15, $16
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
        meeting.fullText || null,
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
      // Get the original meeting to check if status is changing to "Done"
      const originalMeeting = await this.getMeeting(id);
      
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
          full_text = $14,
          has_gift = $15,
          manager = $16
        WHERE id = $17
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
        meeting.fullText || null,
        meeting.hasGift || "no", // Gift indicator field
        relationshipManager, // Use the same value for the manager field
        id
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const updatedMeeting = result.rows[0];
      
      // Check if meeting reached "Done" status and send to Kafka
      const isNowDone = updatedMeeting.status === "Done";
      const wasAlreadyDone = originalMeeting?.status === "Done";
      
      if (isNowDone) {
        const isUpdate = wasAlreadyDone; // If it was already done, this is an update
        await kafkaService.sendCompletedMeeting(updatedMeeting, isUpdate);
      }
      
      return updatedMeeting;
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

  async getResearchesPaginated(params: PaginationParams): Promise<PaginatedResponse<ResearchTableItem>> {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    
    // Query for lightweight table data only
    const query = `
      SELECT 
        id, name, team, researcher, date_start, date_end, status,
        color, research_type, products, description
      FROM researches 
      ORDER BY date_start DESC 
      LIMIT $1 OFFSET $2
    `;
    
    // Count total for hasMore calculation
    const countQuery = 'SELECT COUNT(*) as total FROM researches';
    
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, [limit + 1, offset]), // Fetch one extra to check if more exists
      pool.query(countQuery)
    ]);
    
    const researches = dataResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const hasMore = researches.length > limit;
    
    // Remove the extra item if it exists
    if (hasMore) {
      researches.pop();
    }
    
    // Map database fields to match ResearchTableItem type
    const mappedResearches: ResearchTableItem[] = researches.map(row => ({
      id: row.id,
      name: row.name,
      team: row.team,
      researcher: row.researcher,
      dateStart: row.date_start,
      dateEnd: row.date_end,
      status: row.status,
      color: row.color,
      researchType: row.research_type,
      products: row.products,
      description: row.description
    }));
    
    return {
      data: mappedResearches,
      hasMore,
      total
    };
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
    // Get the original research to check if status is changing to "Done"
    const originalResearch = await this.getResearch(id);
    
    const [updatedResearch] = await db
      .update(researches)
      .set(research)
      .where(eq(researches.id, id))
      .returning();
    
    if (updatedResearch) {
      // Check if research reached "Done" status and send to Kafka
      const isNowDone = updatedResearch.status === "Done";
      const wasAlreadyDone = originalResearch?.status === "Done";
      
      if (isNowDone) {
        const isUpdate = wasAlreadyDone; // If it was already done, this is an update
        await kafkaService.sendCompletedResearch(updatedResearch, isUpdate);
      }
    }
    
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

  // JTBD Implementation
  async getJtbds(): Promise<Jtbd[]> {
    return db.select().from(jtbds);
  }

  async getJtbd(id: number): Promise<Jtbd | undefined> {
    const [jtbd] = await db
      .select()
      .from(jtbds)
      .where(eq(jtbds.id, id));
    return jtbd;
  }

  async createJtbd(jtbd: InsertJtbd): Promise<Jtbd> {
    const [newJtbd] = await db
      .insert(jtbds)
      .values(jtbd)
      .returning();
    return newJtbd;
  }

  async updateJtbd(id: number, jtbd: InsertJtbd): Promise<Jtbd | undefined> {
    const [updatedJtbd] = await db
      .update(jtbds)
      .set(jtbd)
      .where(eq(jtbds.id, id))
      .returning();
    return updatedJtbd;
  }

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
  }

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
  }

  async getJtbdsByMeeting(meetingId: number): Promise<Jtbd[]> {
    const result = await db
      .select({
        jtbd: jtbds
      })
      .from(meetingJtbds)
      .innerJoin(jtbds, eq(meetingJtbds.jtbdId, jtbds.id))
      .where(eq(meetingJtbds.meetingId, meetingId));
    
    return result.map(r => r.jtbd);
  }

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
  }

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
  }

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
  }

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

  // Custom filters implementation
  async getCustomFilters(pageType?: string, createdBy?: string): Promise<CustomFilter[]> {
    let query = db.select().from(customFilters);
    
    if (pageType && createdBy) {
      return query.where(and(
        eq(customFilters.pageType, pageType),
        eq(customFilters.createdBy, createdBy)
      ));
    } else if (pageType) {
      return query.where(eq(customFilters.pageType, pageType));
    } else if (createdBy) {
      return query.where(eq(customFilters.createdBy, createdBy));
    }
    
    return query;
  }

  async getCustomFilter(id: number): Promise<CustomFilter | undefined> {
    const [filter] = await db
      .select()
      .from(customFilters)
      .where(eq(customFilters.id, id));
    return filter;
  }

  async createCustomFilter(filter: InsertCustomFilter): Promise<CustomFilter> {
    const [newFilter] = await db
      .insert(customFilters)
      .values(filter)
      .returning();
    return newFilter;
  }

  async updateCustomFilter(id: number, filter: Partial<InsertCustomFilter>): Promise<CustomFilter | undefined> {
    const [updatedFilter] = await db
      .update(customFilters)
      .set({ ...filter, updatedAt: new Date() })
      .where(eq(customFilters.id, id))
      .returning();
    return updatedFilter;
  }

  async deleteCustomFilter(id: number): Promise<boolean> {
    const [deletedFilter] = await db
      .delete(customFilters)
      .where(eq(customFilters.id, id))
      .returning();
    return !!deletedFilter;
  }
}

export const storage = new DatabaseStorage();