import { db } from "./db";
import { meetings, researches } from "@shared/schema";
import { eq } from "drizzle-orm";

async function updateResearcherField() {
  console.log("Starting researcher field update...");
  
  try {
    // Get all meetings
    const allMeetings = await db.select().from(meetings);
    console.log(`Found ${allMeetings.length} meetings to update`);
    
    // Update each meeting with the researcher from its research
    for (const meeting of allMeetings) {
      if (meeting.researchId) {
        // Get the associated research
        const [research] = await db
          .select()
          .from(researches)
          .where(eq(researches.id, meeting.researchId));
        
        if (research) {
          console.log(`Updating meeting ${meeting.id} with researcher ${research.researcher}`);
          
          // Update the meeting
          await db
            .update(meetings)
            .set({ researcher: research.researcher })
            .where(eq(meetings.id, meeting.id));
        } else {
          console.log(`No research found for meeting ${meeting.id} with researchId ${meeting.researchId}`);
        }
      }
    }
    
    console.log("Researcher field update completed successfully");
  } catch (error) {
    console.error("Error updating researcher field:", error);
  }
}

// Execute the update
updateResearcherField().then(() => {
  console.log("Script execution completed");
  process.exit(0);
}).catch((error) => {
  console.error("Script execution failed:", error);
  process.exit(1);
});