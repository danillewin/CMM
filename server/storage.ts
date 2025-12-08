import {
  meetings,
  researches,
  positions,
  teams,
  jtbds,
  researchJtbds,
  meetingJtbds,
  meetingAttachments,
  customFilters,
  textAnnotations,
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
  type MeetingAttachment,
  type InsertMeetingAttachment,
  type UpdateMeetingAttachment,
  type CustomFilter,
  type InsertCustomFilter,
  type TextAnnotation,
  type InsertTextAnnotation,
  type PaginatedResponse,
  type PaginationParams,
  type MeetingTableItem,
  type ResearchTableItem,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, sql, or, isNotNull } from "drizzle-orm";
import { kafkaService } from "./kafka-service";

export interface IStorage {
  getMeetings(): Promise<Meeting[]>;
  getMeetingsByResearch(researchId: number): Promise<Meeting[]>;
  getMeetingsPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResponse<MeetingTableItem>>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(
    id: number,
    meeting: InsertMeeting,
  ): Promise<Meeting | undefined>;
  deleteMeeting(id: number): Promise<boolean>;

  getResearches(): Promise<Research[]>;
  getResearchesPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResponse<ResearchTableItem>>;
  getResearch(id: number): Promise<Research | undefined>;
  createResearch(research: InsertResearch): Promise<Research>;
  updateResearch(
    id: number,
    research: InsertResearch,
  ): Promise<Research | undefined>;
  updateResearchArtifact(
    id: number,
    artifact: {
      artifactFileName: string | null;
      artifactFilePath: string | null;
      artifactFileSize: number | null;
    },
  ): Promise<Research | undefined>;
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

  // Meeting attachments methods
  getMeetingAttachments(meetingId: number): Promise<MeetingAttachment[]>;
  getMeetingAttachment(id: number): Promise<MeetingAttachment | undefined>;
  createMeetingAttachment(
    attachment: InsertMeetingAttachment,
  ): Promise<MeetingAttachment>;
  updateMeetingAttachment(
    id: number,
    attachment: UpdateMeetingAttachment,
  ): Promise<MeetingAttachment | undefined>;
  deleteMeetingAttachment(id: number): Promise<boolean>;

  // Custom filters methods
  getCustomFilters(
    pageType?: string,
    createdBy?: string,
  ): Promise<CustomFilter[]>;
  getCustomFilter(id: number): Promise<CustomFilter | undefined>;
  createCustomFilter(filter: InsertCustomFilter): Promise<CustomFilter>;
  updateCustomFilter(
    id: number,
    filter: Partial<InsertCustomFilter>,
  ): Promise<CustomFilter | undefined>;
  deleteCustomFilter(id: number): Promise<boolean>;

  // Dashboard and analytics methods
  getDashboardData(filters: {
    year: number;
    researchFilter?: number;
    teamFilter?: string;
    managerFilter?: string;
    researcherFilter?: string;
  }): Promise<{
    year: number;
    filters: {
      teams: string[];
      managers: string[];
      researchers: string[];
      researches: { id: number; name: string }[];
    };
    analytics: {
      meetingsByStatus: { name: string; value: number }[];
      meetingsOverTime: Array<{
        name: string;
        SET: number;
        IN_PROGRESS: number;
        DONE: number;
        DECLINED: number;
      }>;
      topManagers: Array<{
        name: string;
        SET: number;
        IN_PROGRESS: number;
        DONE: number;
        DECLINED: number;
      }>;
      recentMeetings: Array<{
        id: number;
        respondentName: string;
        companyName: string;
        date: string;
        status: string;
      }>;
    };
  }>;

  // Roadmap specific methods
  getRoadmapResearches(year: number): Promise<Research[]>;

  // Calendar specific methods for optimized calendar queries
  getCalendarMeetings(startDate: Date, endDate: Date): Promise<any[]>;
  getCalendarResearches(startDate: Date, endDate: Date): Promise<any[]>;

  // Filter data methods for search multiselect
  getResearchesForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ id: number; name: string }>;
    hasMore: boolean;
    total: number;
  }>;
  getManagersForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ name: string }>;
    hasMore: boolean;
    total: number;
  }>;
  getRecruitersForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ name: string }>;
    hasMore: boolean;
    total: number;
  }>;
  getResearchersForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ name: string }>;
    hasMore: boolean;
    total: number;
  }>;
  getPositionsForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ name: string }>;
    hasMore: boolean;
    total: number;
  }>;
  getTeamsForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ name: string }>;
    hasMore: boolean;
    total: number;
  }>;

  // Text annotation methods
  getTextAnnotations(meetingId: number): Promise<TextAnnotation[]>;
  getTextAnnotationsByAttachment(attachmentId: number): Promise<TextAnnotation[]>;
  getTextAnnotationsByErrorType(meetingId: number, errorType: string): Promise<TextAnnotation[]>;
  createTextAnnotation(annotation: InsertTextAnnotation): Promise<TextAnnotation>;
  deleteTextAnnotation(id: number): Promise<boolean>;
  deleteTextAnnotationsByMeeting(meetingId: number): Promise<boolean>;
  deleteTextAnnotationsByAttachment(attachmentId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getMeetings(): Promise<Meeting[]> {
    return db.select().from(meetings);
  }

  async getMeetingsByResearch(researchId: number): Promise<Meeting[]> {
    return db
      .select()
      .from(meetings)
      .where(eq(meetings.researchId, researchId));
  }

  async getMeetingsPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResponse<MeetingTableItem>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "date",
      sortDir = "desc",
      researchId,
      search,
      status,
      manager,
      recruiter,
      researcher,
      position,
      gift,
      researchIds,
      managers,
      recruiters,
      researchers,
      positions,
    } = params;
    const offset = (page - 1) * limit;

    // Map frontend field names to database column names
    const fieldMapping: { [key: string]: string } = {
      date: "date",
      respondentName: "respondent_name",
      respondentPosition: "respondent_position",
      companyName: "company_name",
      researcher: "researcher",
      relationshipManager: "relationship_manager",
      salesPerson: "recruiter",
      status: "status",
      cnum: "cnum",
    };

    const dbColumn = fieldMapping[sortBy] || "date";
    const direction = sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Build WHERE clause and parameters dynamically
    const whereConditions: string[] = [];
    let paramIndex = 1;
    const queryParams: any[] = [];
    const countParams: any[] = [];

    // Add search filter - match multiple fields like client-side logic
    if (search && search.trim()) {
      const searchPattern = `%${search.trim().toLowerCase()}%`;
      whereConditions.push(`(
        LOWER(m.respondent_name) LIKE $${paramIndex} OR 
        LOWER(m.cnum) LIKE $${paramIndex} OR
        LOWER(m.company_name) LIKE $${paramIndex} OR
        LOWER(m.respondent_position) LIKE $${paramIndex} OR
        LOWER(m.relationship_manager) LIKE $${paramIndex} OR
        LOWER(m.recruiter) LIKE $${paramIndex} OR
        LOWER(m.researcher) LIKE $${paramIndex} OR
        LOWER(m.status) LIKE $${paramIndex} OR
        LOWER(r.name) LIKE $${paramIndex} OR
        TO_CHAR(m.date, 'YYYY-MM-DD') LIKE $${paramIndex}
      )`);
      queryParams.push(searchPattern);
      countParams.push(searchPattern);
      paramIndex++;
    }

    // Add individual filters
    if (status && status !== "ALL") {
      whereConditions.push(`m.status = $${paramIndex}`);
      queryParams.push(status);
      countParams.push(status);
      paramIndex++;
    }

    if (researchId) {
      whereConditions.push(`m.research_id = $${paramIndex}`);
      queryParams.push(researchId);
      countParams.push(researchId);
      paramIndex++;
    }

    // Handle array-based filters (for multiselect components)
    if (researchIds && researchIds.trim()) {
      const ids = researchIds
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (ids.length > 0) {
        const placeholders = ids.map(() => `$${paramIndex++}`).join(",");
        whereConditions.push(`m.research_id IN (${placeholders})`);
        queryParams.push(...ids);
        countParams.push(...ids);
      }
    }

    if (managers && managers.trim()) {
      const managerList = managers
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m);
      if (managerList.length > 0) {
        const placeholders = managerList
          .map(() => `$${paramIndex++}`)
          .join(",");
        whereConditions.push(`m.relationship_manager IN (${placeholders})`);
        queryParams.push(...managerList);
        countParams.push(...managerList);
      }
    }

    if (recruiters && recruiters.trim()) {
      const recruiterList = recruiters
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r);
      if (recruiterList.length > 0) {
        const placeholders = recruiterList
          .map(() => `$${paramIndex++}`)
          .join(",");
        whereConditions.push(`m.recruiter IN (${placeholders})`);
        queryParams.push(...recruiterList);
        countParams.push(...recruiterList);
      }
    }

    if (researchers && researchers.trim()) {
      const researcherList = researchers
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r);
      if (researcherList.length > 0) {
        const placeholders = researcherList
          .map(() => `$${paramIndex++}`)
          .join(",");
        whereConditions.push(`m.researcher IN (${placeholders})`);
        queryParams.push(...researcherList);
        countParams.push(...researcherList);
      }
    }

    if (positions && positions.trim()) {
      const positionList = positions
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
      if (positionList.length > 0) {
        const placeholders = positionList
          .map(() => `$${paramIndex++}`)
          .join(",");
        whereConditions.push(`m.respondent_position IN (${placeholders})`);
        queryParams.push(...positionList);
        countParams.push(...positionList);
      }
    }

    // Keep single-value filters for backward compatibility
    if (manager && manager !== "ALL") {
      whereConditions.push(`m.relationship_manager = $${paramIndex}`);
      queryParams.push(manager);
      countParams.push(manager);
      paramIndex++;
    }

    if (recruiter && recruiter !== "ALL") {
      whereConditions.push(`m.recruiter = $${paramIndex}`);
      queryParams.push(recruiter);
      countParams.push(recruiter);
      paramIndex++;
    }

    if (researcher && researcher !== "ALL") {
      whereConditions.push(`m.researcher = $${paramIndex}`);
      queryParams.push(researcher);
      countParams.push(researcher);
      paramIndex++;
    }

    if (position && position !== "ALL") {
      whereConditions.push(`m.respondent_position = $${paramIndex}`);
      queryParams.push(position);
      countParams.push(position);
      paramIndex++;
    }

    if (gift && gift !== "ALL") {
      whereConditions.push(`m.has_gift = $${paramIndex}`);
      queryParams.push(gift);
      countParams.push(gift);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Add LIMIT and OFFSET parameters
    queryParams.push(limit + 1, offset);

    // Query for only essential fields for table display with research info via JOIN
    const query = `
      SELECT 
        m.id, m.respondent_name, m.respondent_position, m.company_name, m.researcher,
        m.relationship_manager, m.recruiter as sales_person, m.date, m.status, m.research_id,
        m.cnum, r.name as research_name
      FROM meetings m
      LEFT JOIN researches r ON m.research_id = r.id
      ${whereClause}
      ORDER BY m.${dbColumn} ${direction}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Count total for hasMore calculation with same filtering
    const countQuery = `SELECT COUNT(*) as total FROM meetings m LEFT JOIN researches r ON m.research_id = r.id ${whereClause}`;

    const [dataResult, countResult] = await Promise.all([
      pool.query(query, queryParams), // Fetch one extra to check if more exists
      pool.query(countQuery, countParams),
    ]);

    const meetings = dataResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const hasMore = meetings.length > limit;

    // Remove the extra item if it exists
    if (hasMore) {
      meetings.pop();
    }

    // Map database fields to match MeetingTableItem type (including research name from JOIN)
    const mappedMeetings: MeetingTableItem[] = meetings.map((row) => ({
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
      cnum: row.cnum,
      researchName: row.research_name,
    }));

    return {
      data: mappedMeetings,
      hasMore,
      total,
    };
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    // Get meeting with research information via JOIN
    const query = `
      SELECT 
        m.*, r.name as research_name
      FROM meetings m
      LEFT JOIN researches r ON m.research_id = r.id
      WHERE m.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return undefined;

    const row = result.rows[0];

    // Map database fields to Meeting type
    return {
      id: row.id,
      respondentName: row.respondent_name,
      respondentPosition: row.respondent_position,
      cnum: row.cnum,
      gcc: row.gcc,
      companyName: row.company_name,
      email: row.email,
      phone: row.phone,
      researcher: row.researcher,
      relationshipManager: row.relationship_manager,
      salesPerson: row.recruiter,
      date: row.date,
      time: row.time,
      meetingLink: row.meeting_link,
      researchId: row.research_id,
      status: row.status,
      notes: row.notes,
      fullText: row.full_text,
      hasGift: row.has_gift,
      summarizationStatus: row.summarization_status,
      summarizationResult: row.summarization_result,
      // Include research name from JOIN
      researchName: row.research_name,
    };
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    try {
      // The DB requires a 'manager' field - we need to add it directly with SQL
      const { relationshipManager } = meeting;

      // Use SQL directly to insert meeting
      const query = `
        INSERT INTO meetings (
          respondent_name, respondent_position, cnum, 
          gcc, company_name, email, phone, researcher, 
          relationship_manager, recruiter, date, time, meeting_link,
          research_id, status, notes, full_text, has_gift
        ) VALUES (
          $1, $2, $3, 
          $4, $5, $6, $7, $8, 
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18
        ) RETURNING *
      `;

      const values = [
        meeting.respondentName,
        meeting.respondentPosition,
        meeting.cnum,
        meeting.gcc || null,
        meeting.companyName || null,
        meeting.email || null,
        meeting.phone || null,
        meeting.researcher || null,
        meeting.relationshipManager,
        meeting.salesPerson,
        meeting.date,
        meeting.time || null,
        meeting.meetingLink || null,
        meeting.researchId,
        meeting.status,
        meeting.notes || null,
        meeting.fullText || null,
        meeting.hasGift || "no", // Gift indicator field
      ];

      const result = await pool.query(query, values);
      const row = result.rows[0];

      // Map database fields to Meeting type
      return {
        id: row.id,
        respondentName: row.respondent_name,
        respondentPosition: row.respondent_position,
        cnum: row.cnum,
        gcc: row.gcc,
        companyName: row.company_name,
        email: row.email,
        phone: row.phone,
        researcher: row.researcher,
        relationshipManager: row.relationship_manager,
        salesPerson: row.recruiter,
        date: row.date,
        time: row.time,
        meetingLink: row.meeting_link,
        researchId: row.research_id,
        status: row.status,
        notes: row.notes,
        fullText: row.full_text,
        hasGift: row.has_gift,
        summarizationStatus: row.summarization_status,
        summarizationResult: row.summarization_result,
      };
    } catch (error) {
      console.error("Error in createMeeting:", error);
      throw error;
    }
  }

  async updateMeeting(
    id: number,
    meeting: InsertMeeting,
  ): Promise<Meeting | undefined> {
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
          phone = $7,
          researcher = $8,
          relationship_manager = $9,
          recruiter = $10,
          date = $11,
          time = $12,
          meeting_link = $13,
          research_id = $14,
          status = $15,
          notes = $16,
          full_text = $17,
          has_gift = $18,
          summarization_status = $19,
          summarization_result = $20
        WHERE id = $21
        RETURNING *
      `;

      const values = [
        meeting.respondentName,
        meeting.respondentPosition,
        meeting.cnum,
        meeting.gcc || null,
        meeting.companyName || null,
        meeting.email || null,
        meeting.phone || null,
        meeting.researcher || null,
        meeting.relationshipManager,
        meeting.salesPerson,
        meeting.date,
        meeting.time || null,
        meeting.meetingLink || null,
        meeting.researchId,
        meeting.status,
        meeting.notes || null,
        meeting.fullText || null,
        meeting.hasGift || "no", // Gift indicator field
        // Preserve existing summarization fields if not provided (Kafka service updates these explicitly)
        (meeting as any).summarizationStatus ?? originalMeeting?.summarizationStatus ?? null,
        (meeting as any).summarizationResult ?? originalMeeting?.summarizationResult ?? null,
        id,
      ];

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return undefined;
      }

      const row = result.rows[0];

      // Map database fields to Meeting type
      const updatedMeeting = {
        id: row.id,
        respondentName: row.respondent_name,
        respondentPosition: row.respondent_position,
        cnum: row.cnum,
        gcc: row.gcc,
        companyName: row.company_name,
        email: row.email,
        phone: row.phone,
        researcher: row.researcher,
        relationshipManager: row.relationship_manager,
        salesPerson: row.recruiter,
        date: row.date,
        time: row.time,
        meetingLink: row.meeting_link,
        researchId: row.research_id,
        status: row.status,
        notes: row.notes,
        fullText: row.full_text,
        hasGift: row.has_gift,
        summarizationStatus: row.summarization_status,
        summarizationResult: row.summarization_result,
      };

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

  async getResearchesPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResponse<ResearchTableItem>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "dateStart",
      sortDir = "desc",
      search,
      status,
      teams,
      researchResearchers,
      researchType,
      products,
    } = params;
    const offset = (page - 1) * limit;

    // Map frontend field names to database column names
    const fieldMapping: { [key: string]: string } = {
      name: "name",
      team: "team",
      researcher: "researcher",
      dateStart: "date_start",
      dateEnd: "date_end",
      status: "status",
      researchType: "research_type",
    };

    const dbColumn = fieldMapping[sortBy] || "date_start";
    const direction = sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Build WHERE clause and parameters dynamically
    const whereConditions: string[] = [];
    let paramIndex = 1;
    const queryParams: any[] = [];
    const countParams: any[] = [];

    // Add search filter - match multiple fields
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      whereConditions.push(
        `(name ILIKE $${paramIndex} OR team ILIKE $${paramIndex} OR researcher ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`,
      );
      queryParams.push(searchPattern);
      countParams.push(searchPattern);
      paramIndex++;
    }

    // Add status filter - support multiple statuses separated by comma
    if (status && status !== "ALL") {
      const statusList = status
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s);
      if (statusList.length > 0) {
        if (statusList.length === 1) {
          // Single status filter
          whereConditions.push(`status = $${paramIndex}`);
          queryParams.push(statusList[0]);
          countParams.push(statusList[0]);
          paramIndex++;
        } else {
          // Multiple status filter
          const placeholders = statusList
            .map(() => `$${paramIndex++}`)
            .join(",");
          whereConditions.push(`status IN (${placeholders})`);
          queryParams.push(...statusList);
          countParams.push(...statusList);
        }
      }
    }

    // Handle array filter for teams
    if (teams && teams.trim()) {
      const teamList = teams
        .split(",")
        .map((t: string) => t.trim())
        .filter((t: string) => t);
      if (teamList.length > 0) {
        const placeholders = teamList.map(() => `$${paramIndex++}`).join(",");
        whereConditions.push(`team IN (${placeholders})`);
        queryParams.push(...teamList);
        countParams.push(...teamList);
      }
    }

    // Handle array filter for researchers
    if (researchResearchers && researchResearchers.trim()) {
      const researcherList = researchResearchers
        .split(",")
        .map((r: string) => r.trim())
        .filter((r: string) => r);
      if (researcherList.length > 0) {
        const placeholders = researcherList
          .map(() => `$${paramIndex++}`)
          .join(",");
        whereConditions.push(`researcher IN (${placeholders})`);
        queryParams.push(...researcherList);
        countParams.push(...researcherList);
      }
    }

    if (researchType && researchType !== "ALL") {
      whereConditions.push(`research_type = $${paramIndex}`);
      queryParams.push(researchType);
      countParams.push(researchType);
      paramIndex++;
    }

    // Handle array filter for products
    if (products && products.length > 0) {
      whereConditions.push(`products && $${paramIndex}`);
      queryParams.push(products);
      countParams.push(products);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Add LIMIT and OFFSET parameters
    queryParams.push(limit + 1, offset);

    // Query for lightweight table data only
    const query = `
      SELECT 
        id, name, team, researcher, date_start, date_end, status,
        color, research_type, products, description
      FROM researches 
      ${whereClause}
      ORDER BY ${dbColumn} ${direction}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Count total for hasMore calculation
    const countQuery = `SELECT COUNT(*) as total FROM researches ${whereClause}`;

    const [dataResult, countResult] = await Promise.all([
      pool.query(query, queryParams), // Fetch one extra to check if more exists
      pool.query(countQuery, countParams),
    ]);

    const researches = dataResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const hasMore = researches.length > limit;

    // Remove the extra item if it exists
    if (hasMore) {
      researches.pop();
    }

    // Map database fields to match ResearchTableItem type
    const mappedResearches: ResearchTableItem[] = researches.map((row) => ({
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
      description: row.description,
    }));

    return {
      data: mappedResearches,
      hasMore,
      total,
    };
  }

  async getResearch(id: number): Promise<Research | undefined> {
    const [research] = await db
      .select()
      .from(researches)
      .where(eq(researches.id, id));
    return research;
  }

  async createResearch(research: InsertResearch): Promise<Research> {
    const [newResearch] = await db
      .insert(researches)
      .values(research)
      .returning();
    return newResearch;
  }

  async updateResearch(
    id: number,
    research: InsertResearch,
  ): Promise<Research | undefined> {
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

  async updateResearchArtifact(
    id: number,
    artifact: {
      artifactFileName: string | null;
      artifactFilePath: string | null;
      artifactFileSize: number | null;
    },
  ): Promise<Research | undefined> {
    const [updatedResearch] = await db
      .update(researches)
      .set({
        artifactFileName: artifact.artifactFileName,
        artifactFilePath: artifact.artifactFilePath,
        artifactFileSize: artifact.artifactFileSize,
      })
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
    const [newPosition] = await db
      .insert(positions)
      .values(position)
      .returning();
    return newPosition;
  }

  async deletePosition(id: number): Promise<boolean> {
    // First check if this position is used by any meetings
    const position = (await this.getPositions()).find((p) => p.id === id);
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
    const team = (await this.getTeams()).find((t) => t.id === id);
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
    const [jtbd] = await db.select().from(jtbds).where(eq(jtbds.id, id));
    return jtbd;
  }

  async createJtbd(jtbd: InsertJtbd): Promise<Jtbd> {
    const [newJtbd] = await db.insert(jtbds).values(jtbd).returning();
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
        jtbd: jtbds,
      })
      .from(researchJtbds)
      .innerJoin(jtbds, eq(researchJtbds.jtbdId, jtbds.id))
      .where(eq(researchJtbds.researchId, researchId));

    return result.map((r) => r.jtbd);
  }

  async getJtbdsByMeeting(meetingId: number): Promise<Jtbd[]> {
    const result = await db
      .select({
        jtbd: jtbds,
      })
      .from(meetingJtbds)
      .innerJoin(jtbds, eq(meetingJtbds.jtbdId, jtbds.id))
      .where(eq(meetingJtbds.meetingId, meetingId));

    return result.map((r) => r.jtbd);
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

  async removeJtbdFromResearch(
    researchId: number,
    jtbdId: number,
  ): Promise<void> {
    try {
      await db
        .delete(researchJtbds)
        .where(
          and(
            eq(researchJtbds.researchId, researchId),
            eq(researchJtbds.jtbdId, jtbdId),
          ),
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

  async removeJtbdFromMeeting(
    meetingId: number,
    jtbdId: number,
  ): Promise<void> {
    try {
      await db
        .delete(meetingJtbds)
        .where(
          and(
            eq(meetingJtbds.meetingId, meetingId),
            eq(meetingJtbds.jtbdId, jtbdId),
          ),
        );
    } catch (error) {
      console.error("Error removing JTBD from meeting:", error);
      throw error;
    }
  }

  // Custom filters implementation
  async getCustomFilters(
    pageType?: string,
    createdBy?: string,
  ): Promise<CustomFilter[]> {
    let query = db.select().from(customFilters);

    if (pageType && createdBy) {
      return query.where(
        and(
          eq(customFilters.pageType, pageType),
          eq(customFilters.createdBy, createdBy),
        ),
      );
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

  // Filter data methods for search multiselect
  async getResearchesForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ id: number; name: string }>;
    hasMore: boolean;
    total: number;
  }> {
    try {
      const searchPattern = `%${search.toLowerCase()}%`;

      // Get total count
      const countResult = await pool.query(
        `
        SELECT COUNT(DISTINCT r.id)::int as count
        FROM researches r 
        WHERE LOWER(r.name) LIKE $1
      `,
        [searchPattern],
      );
      const total = countResult.rows[0].count;

      // Get paginated data
      const result = await pool.query(
        `
        SELECT DISTINCT r.id, r.name
        FROM researches r 
        WHERE LOWER(r.name) LIKE $1
        ORDER BY r.name ASC
        LIMIT $2 OFFSET $3
      `,
        [searchPattern, limit, offset],
      );

      return {
        data: result.rows,
        hasMore: offset + limit < total,
        total,
      };
    } catch (error) {
      console.error("Error getting researches for filter:", error);
      throw error;
    }
  }

  async getManagersForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ name: string }>;
    hasMore: boolean;
    total: number;
  }> {
    try {
      const searchPattern = `%${search.toLowerCase()}%`;

      // Get total count
      const countResult = await pool.query(
        `
        SELECT COUNT(DISTINCT relationship_manager)::int as count
        FROM meetings 
        WHERE relationship_manager IS NOT NULL 
        AND relationship_manager != ''
        AND LOWER(relationship_manager) LIKE $1
      `,
        [searchPattern],
      );
      const total = countResult.rows[0].count;

      // Get paginated data
      const result = await pool.query(
        `
        SELECT DISTINCT relationship_manager as name
        FROM meetings 
        WHERE relationship_manager IS NOT NULL 
        AND relationship_manager != ''
        AND LOWER(relationship_manager) LIKE $1
        ORDER BY relationship_manager ASC
        LIMIT $2 OFFSET $3
      `,
        [searchPattern, limit, offset],
      );

      return {
        data: result.rows,
        hasMore: offset + limit < total,
        total,
      };
    } catch (error) {
      console.error("Error getting managers for filter:", error);
      throw error;
    }
  }

  async getRecruitersForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ name: string }>;
    hasMore: boolean;
    total: number;
  }> {
    try {
      const searchPattern = `%${search.toLowerCase()}%`;

      // Get total count
      const countResult = await pool.query(
        `
        SELECT COUNT(DISTINCT recruiter)::int as count
        FROM meetings 
        WHERE recruiter IS NOT NULL 
        AND recruiter != ''
        AND LOWER(recruiter) LIKE $1
      `,
        [searchPattern],
      );
      const total = countResult.rows[0].count;

      // Get paginated data
      const result = await pool.query(
        `
        SELECT DISTINCT recruiter as name
        FROM meetings 
        WHERE recruiter IS NOT NULL 
        AND recruiter != ''
        AND LOWER(recruiter) LIKE $1
        ORDER BY recruiter ASC
        LIMIT $2 OFFSET $3
      `,
        [searchPattern, limit, offset],
      );

      return {
        data: result.rows,
        hasMore: offset + limit < total,
        total,
      };
    } catch (error) {
      console.error("Error getting recruiters for filter:", error);
      throw error;
    }
  }

  async getResearchersForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ name: string }>;
    hasMore: boolean;
    total: number;
  }> {
    try {
      const searchPattern = `%${search.toLowerCase()}%`;

      // Get total count from both meetings and researches tables
      const countResult = await pool.query(
        `
        SELECT COUNT(DISTINCT researcher)::int as count
        FROM (
          SELECT researcher FROM meetings 
          WHERE researcher IS NOT NULL AND researcher != ''
          UNION
          SELECT researcher FROM researches 
          WHERE researcher IS NOT NULL AND researcher != ''
        ) AS combined_researchers
        WHERE LOWER(researcher) LIKE $1
      `,
        [searchPattern],
      );
      const total = countResult.rows[0].count;

      // Get paginated data from both meetings and researches tables
      const result = await pool.query(
        `
        SELECT DISTINCT researcher as name
        FROM (
          SELECT researcher FROM meetings 
          WHERE researcher IS NOT NULL AND researcher != ''
          UNION
          SELECT researcher FROM researches 
          WHERE researcher IS NOT NULL AND researcher != ''
        ) AS combined_researchers
        WHERE LOWER(researcher) LIKE $1
        ORDER BY researcher ASC
        LIMIT $2 OFFSET $3
      `,
        [searchPattern, limit, offset],
      );

      return {
        data: result.rows,
        hasMore: offset + limit < total,
        total,
      };
    } catch (error) {
      console.error("Error getting researchers for filter:", error);
      throw error;
    }
  }

  async getPositionsForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ name: string }>;
    hasMore: boolean;
    total: number;
  }> {
    try {
      const searchPattern = `%${search.toLowerCase()}%`;

      // Get total count
      const countResult = await pool.query(
        `
        SELECT COUNT(DISTINCT respondent_position)::int as count
        FROM meetings 
        WHERE respondent_position IS NOT NULL 
        AND respondent_position != ''
        AND LOWER(respondent_position) LIKE $1
      `,
        [searchPattern],
      );
      const total = countResult.rows[0].count;

      // Get paginated data
      const result = await pool.query(
        `
        SELECT DISTINCT respondent_position as name
        FROM meetings 
        WHERE respondent_position IS NOT NULL 
        AND respondent_position != ''
        AND LOWER(respondent_position) LIKE $1
        ORDER BY respondent_position ASC
        LIMIT $2 OFFSET $3
      `,
        [searchPattern, limit, offset],
      );

      return {
        data: result.rows,
        hasMore: offset + limit < total,
        total,
      };
    } catch (error) {
      console.error("Error getting positions for filter:", error);
      throw error;
    }
  }

  async getTeamsForFilter(
    search: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Array<{ name: string }>;
    hasMore: boolean;
    total: number;
  }> {
    try {
      const searchPattern = `%${search.toLowerCase()}%`;

      // Get total count from researches table
      const countResult = await pool.query(
        `
        SELECT COUNT(DISTINCT team)::int as count
        FROM researches 
        WHERE team IS NOT NULL 
        AND team != ''
        AND LOWER(team) LIKE $1
      `,
        [searchPattern],
      );
      const total = countResult.rows[0].count;

      // Get paginated data
      const result = await pool.query(
        `
        SELECT DISTINCT team as name
        FROM researches 
        WHERE team IS NOT NULL 
        AND team != ''
        AND LOWER(team) LIKE $1
        ORDER BY team ASC
        LIMIT $2 OFFSET $3
      `,
        [searchPattern, limit, offset],
      );

      return {
        data: result.rows,
        hasMore: offset + limit < total,
        total,
      };
    } catch (error) {
      console.error("Error getting teams for filter:", error);
      throw error;
    }
  }

  async createCustomFilter(filter: InsertCustomFilter): Promise<CustomFilter> {
    const [newFilter] = await db
      .insert(customFilters)
      .values(filter)
      .returning();
    return newFilter;
  }

  async updateCustomFilter(
    id: number,
    filter: Partial<InsertCustomFilter>,
  ): Promise<CustomFilter | undefined> {
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

  async getDashboardData(filters: {
    year: number;
    researchFilter?: number;
    teamFilter?: string;
    managerFilter?: string;
    researcherFilter?: string;
  }) {
    const {
      year,
      researchFilter,
      teamFilter,
      managerFilter,
      researcherFilter,
    } = filters;

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // SQL and operators are already imported at the top

    // Apply filters
    const conditions = [
      sql`${meetings.date} >= ${startOfYear.toISOString()} AND ${meetings.date} <= ${endOfYear.toISOString()}`,
    ];
    if (researchFilter) {
      conditions.push(eq(meetings.researchId, researchFilter));
    }
    if (teamFilter && teamFilter !== "ALL") {
      conditions.push(eq(researches.team, teamFilter));
    }
    if (managerFilter && managerFilter !== "ALL") {
      conditions.push(
        or(
          eq(meetings.relationshipManager, managerFilter),
          eq(meetings.salesPerson, managerFilter),
        )!,
      );
    }
    if (researcherFilter && researcherFilter !== "ALL") {
      conditions.push(eq(researches.researcher, researcherFilter));
    }

    // Base query for meetings with research joins
    const meetingsQuery = db
      .select({
        meeting_id: meetings.id,
        respondentName: meetings.respondentName,
        companyName: meetings.companyName,
        date: meetings.date,
        status: meetings.status,
        relationshipManager: meetings.relationshipManager,
        salesPerson: meetings.salesPerson,
        researchId: meetings.researchId,
        research_team: researches.team,
        research_researcher: researches.researcher,
        research_name: researches.name,
      })
      .from(meetings)
      .leftJoin(researches, eq(meetings.researchId, researches.id))
      .where(and(...conditions));
    const meetingsData = await meetingsQuery;

    // Get filter options
    const teamsData = await db
      .selectDistinct({ team: researches.team })
      .from(researches)
      .where(isNotNull(researches.team));
    const managersData = await db
      .selectDistinct({ manager: meetings.relationshipManager })
      .from(meetings)
      .where(isNotNull(meetings.relationshipManager))
      .union(
        db
          .selectDistinct({ manager: meetings.salesPerson })
          .from(meetings)
          .where(isNotNull(meetings.salesPerson)),
      );
    const researchersData = await db
      .selectDistinct({ researcher: researches.researcher })
      .from(researches)
      .where(isNotNull(researches.researcher));
    const researchesData = await db
      .select({ id: researches.id, name: researches.name })
      .from(researches)
      .where(
        sql`(date_start <= ${endOfYear.toISOString()} AND date_end >= ${startOfYear.toISOString()})`,
      );

    // Calculate aggregated data
    const meetingsByStatus: { [key: string]: number } = {};
    Object.values(["SET", "IN_PROGRESS", "DONE", "DECLINED"]).forEach(
      (status) => {
        meetingsByStatus[status] = meetingsData.filter(
          (m) => m.status === status,
        ).length;
      },
    );

    // Calculate meetings over time (last 30 days)
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayData = {
        name: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        SET: meetingsData.filter(
          (m) =>
            new Date(m.date) >= dayStart &&
            new Date(m.date) <= dayEnd &&
            m.status === "SET",
        ).length,
        IN_PROGRESS: meetingsData.filter(
          (m) =>
            new Date(m.date) >= dayStart &&
            new Date(m.date) <= dayEnd &&
            m.status === "IN_PROGRESS",
        ).length,
        DONE: meetingsData.filter(
          (m) =>
            new Date(m.date) >= dayStart &&
            new Date(m.date) <= dayEnd &&
            m.status === "DONE",
        ).length,
        DECLINED: meetingsData.filter(
          (m) =>
            new Date(m.date) >= dayStart &&
            new Date(m.date) <= dayEnd &&
            m.status === "DECLINED",
        ).length,
      };
      last30Days.push(dayData);
    }

    // Calculate top managers
    const managerMeetings: {
      [key: string]: {
        SET: number;
        IN_PROGRESS: number;
        DONE: number;
        DECLINED: number;
      };
    } = {};
    meetingsData.forEach((meeting) => {
      [meeting.relationshipManager, meeting.salesPerson].forEach((manager) => {
        if (manager) {
          if (!managerMeetings[manager]) {
            managerMeetings[manager] = {
              SET: 0,
              IN_PROGRESS: 0,
              DONE: 0,
              DECLINED: 0,
            };
          }
          const status =
            meeting.status as keyof (typeof managerMeetings)[string];
          if (status in managerMeetings[manager]) {
            managerMeetings[manager][status]++;
          }
        }
      });
    });

    const topManagers = Object.entries(managerMeetings)
      .sort(
        ([, a], [, b]) =>
          Object.values(b).reduce((sum, val) => sum + val, 0) -
          Object.values(a).reduce((sum, val) => sum + val, 0),
      )
      .slice(0, 5)
      .map(([name, statusCounts]) => ({ name, ...statusCounts }));

    // Get recent meetings
    const recentMeetings = meetingsData
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((m) => ({
        id: m.meeting_id,
        respondentName: m.respondentName,
        companyName: m.companyName || "",
        date: m.date.toISOString(),
        status: m.status,
      }));

    return {
      year,
      filters: {
        teams: teamsData
          .map((t) => t.team)
          .filter(Boolean)
          .sort(),
        managers: managersData
          .map((m) => m.manager)
          .filter(Boolean)
          .sort(),
        researchers: researchersData
          .map((r) => r.researcher)
          .filter(Boolean)
          .sort(),
        researches: researchesData,
      },
      analytics: {
        meetingsByStatus: Object.entries(meetingsByStatus).map(
          ([name, value]) => ({ name, value }),
        ),
        meetingsOverTime: last30Days,
        topManagers,
        recentMeetings,
      },
    };
  }

  async getRoadmapResearches(year: number): Promise<Research[]> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // Only fetch researches that overlap with the specified year
    const researchData = await db
      .select({
        id: researches.id,
        name: researches.name,
        dateStart: researches.dateStart,
        dateEnd: researches.dateEnd,
        team: researches.team,
        researcher: researches.researcher,
        status: researches.status,
        researchType: researches.researchType,
        color: researches.color,
      })
      .from(researches)
      .where(
        // Research overlaps with the year if:
        // - research starts before year ends AND research ends after year starts
        sql`(date_start <= ${endOfYear.toISOString()} AND date_end >= ${startOfYear.toISOString()})`,
      );

    return researchData as Research[];
  }

  // Calendar-specific methods for optimized calendar queries
  async getCalendarMeetings(startDate: Date, endDate: Date): Promise<any[]> {
    return db
      .select({
        id: meetings.id,
        respondentName: meetings.respondentName,
        date: meetings.date,
        researchId: meetings.researchId,
        status: meetings.status,
      })
      .from(meetings)
      .where(
        sql`(date >= ${startDate.toISOString()} AND date <= ${endDate.toISOString()})`,
      );
  }

  async getCalendarResearches(startDate: Date, endDate: Date): Promise<any[]> {
    return db
      .select({
        id: researches.id,
        name: researches.name,
        dateStart: researches.dateStart,
        dateEnd: researches.dateEnd,
        status: researches.status,
        color: researches.color,
      })
      .from(researches)
      .where(
        sql`(date_start <= ${endDate.toISOString()} AND date_end >= ${startDate.toISOString()})`,
      );
  }

  // Meeting attachments methods
  async getMeetingAttachments(meetingId: number): Promise<MeetingAttachment[]> {
    return db
      .select()
      .from(meetingAttachments)
      .where(eq(meetingAttachments.meetingId, meetingId));
  }

  async getMeetingAttachment(
    id: number,
  ): Promise<MeetingAttachment | undefined> {
    const [attachment] = await db
      .select()
      .from(meetingAttachments)
      .where(eq(meetingAttachments.id, id));
    return attachment;
  }

  async createMeetingAttachment(
    attachment: InsertMeetingAttachment,
  ): Promise<MeetingAttachment> {
    const [newAttachment] = await db
      .insert(meetingAttachments)
      .values(attachment)
      .returning();
    return newAttachment;
  }

  async updateMeetingAttachment(
    id: number,
    attachment: UpdateMeetingAttachment,
  ): Promise<MeetingAttachment | undefined> {
    const [updatedAttachment] = await db
      .update(meetingAttachments)
      .set(attachment)
      .where(eq(meetingAttachments.id, id))
      .returning();
    return updatedAttachment;
  }

  async deleteMeetingAttachment(id: number): Promise<boolean> {
    const [deletedAttachment] = await db
      .delete(meetingAttachments)
      .where(eq(meetingAttachments.id, id))
      .returning();
    return !!deletedAttachment;
  }

  // Text annotation methods
  async getTextAnnotations(meetingId: number): Promise<TextAnnotation[]> {
    return db
      .select()
      .from(textAnnotations)
      .where(eq(textAnnotations.meetingId, meetingId));
  }

  async getTextAnnotationsByErrorType(meetingId: number, errorType: string): Promise<TextAnnotation[]> {
    return db
      .select()
      .from(textAnnotations)
      .where(and(
        eq(textAnnotations.meetingId, meetingId),
        eq(textAnnotations.errorType, errorType)
      ));
  }

  async createTextAnnotation(annotation: InsertTextAnnotation): Promise<TextAnnotation> {
    const [newAnnotation] = await db
      .insert(textAnnotations)
      .values(annotation)
      .returning();
    return newAnnotation;
  }

  async deleteTextAnnotation(id: number): Promise<boolean> {
    const [deletedAnnotation] = await db
      .delete(textAnnotations)
      .where(eq(textAnnotations.id, id))
      .returning();
    return !!deletedAnnotation;
  }

  async deleteTextAnnotationsByMeeting(meetingId: number): Promise<boolean> {
    const result = await db
      .delete(textAnnotations)
      .where(eq(textAnnotations.meetingId, meetingId))
      .returning();
    return result.length > 0;
  }

  async getTextAnnotationsByAttachment(attachmentId: number): Promise<TextAnnotation[]> {
    return db
      .select()
      .from(textAnnotations)
      .where(eq(textAnnotations.attachmentId, attachmentId));
  }

  async deleteTextAnnotationsByAttachment(attachmentId: number): Promise<boolean> {
    const result = await db
      .delete(textAnnotations)
      .where(eq(textAnnotations.attachmentId, attachmentId))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
