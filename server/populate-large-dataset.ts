import { db } from './db.js';
import { researches, meetings, teams, positions, ResearchStatus, MeetingStatus } from '../shared/schema.js';

// Sample data arrays for realistic content
const researchNames = [
  "User Experience Research for Mobile App",
  "Market Analysis for New Product Line",
  "Customer Satisfaction Survey Q1",
  "Competitive Analysis Dashboard",
  "Voice of Customer Research",
  "Product Feature Validation Study",
  "Brand Perception Research",
  "User Journey Mapping Project",
  "Customer Segmentation Analysis",
  "Product-Market Fit Assessment",
  "Content Strategy Research",
  "Accessibility Testing Initiative",
  "Pricing Strategy Research",
  "Customer Retention Analysis",
  "New Market Entry Research",
  "User Interface Design Study",
  "Customer Support Experience",
  "Social Media Sentiment Analysis",
  "Digital Transformation Impact",
  "E-commerce User Behavior Study"
];

const teamNames = ["Product", "Marketing", "Design", "Engineering", "Sales", "Customer Success", "Research", "Strategy"];
const researchers = ["Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson", "Emma Brown", "Frank Miller", "Grace Lee", "Henry Taylor"];
const researchTypes = ["Interviews", "Surveys", "Usability Testing", "Focus Groups", "Analytics Review", "Competitive Analysis"];
const products = ["Web App", "Mobile App", "API", "Dashboard", "Analytics Platform", "CRM", "E-commerce", "SaaS Tool"];
const colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const meetingTypes = ["Interview", "Follow-up", "Focus Group", "Survey Review", "Planning Session"];
const respondentNames = [
  "Sarah Chen", "Michael Rodriguez", "Jennifer Williams", "Robert Johnson", "Lisa Anderson",
  "David Kim", "Maria Garcia", "James Wilson", "Ashley Martinez", "Christopher Lee",
  "Amanda Thompson", "Daniel Brown", "Jessica Davis", "Ryan Miller", "Nicole White",
  "Kevin Jones", "Stephanie Taylor", "Brandon Clark", "Michelle Lewis", "Jason Walker"
];

const respondentPositions = ["Product Manager", "UX Designer", "Software Engineer", "Marketing Manager", "Sales Director", "Customer Success Manager", "Data Analyst", "Business Analyst"];
const relationshipManagers = ["John Smith", "Sarah Wilson", "Mike Johnson", "Lisa Davis", "Tom Brown"];
const salesPersons = ["Alex Thompson", "Jessica White", "David Garcia", "Emily Rodriguez", "Chris Martinez"];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateDescription(name: string, type: string): string {
  const purposes = [
    "understand user pain points and improve overall experience",
    "validate new feature concepts before development",
    "gather insights on market opportunities and challenges",
    "assess customer satisfaction and identify improvement areas",
    "analyze competitive landscape and positioning",
    "evaluate user interface design and usability"
  ];
  
  const methods = [
    "conducting in-depth interviews with target users",
    "running comprehensive surveys across user segments",
    "performing usability testing sessions",
    "analyzing existing data and user feedback",
    "organizing focus groups with key stakeholders",
    "reviewing competitive analysis and market trends"
  ];

  return `This ${type.toLowerCase()} research aims to ${getRandomElement(purposes)} by ${getRandomElement(methods)}. The findings will inform strategic decisions and help prioritize development efforts.`;
}

export async function populateLargeDataset() {
  console.log('Starting to populate database with large dataset...');
  
  try {
    // Clear existing data
    await db.delete(meetings);
    await db.delete(researches);
    await db.delete(teams);
    await db.delete(positions);
    console.log('Cleared existing data');

    // Create teams
    const teamData = teamNames.map(team => ({ name: team }));
    await db.insert(teams).values(teamData);
    console.log('Created teams');

    // Create positions
    const positionData = respondentPositions.map(position => ({ name: position }));
    await db.insert(positions).values(positionData);
    console.log('Created positions');

    // Generate 100 researches
    const researchData = [];
    for (let i = 1; i <= 100; i++) {
      const name = i <= researchNames.length 
        ? researchNames[i - 1] 
        : `${getRandomElement(researchNames)} ${i}`;
      
      const team = getRandomElement(teamNames);
      const researcher = getRandomElement(researchers);
      const researchType = getRandomElement(researchTypes);
      const selectedProducts = getRandomElements(products, Math.floor(Math.random() * 3) + 1);
      const color = getRandomElement(colors);
      
      const startDate = getRandomDate(new Date('2024-01-01'), new Date('2024-12-31'));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 90) + 7); // 1-13 weeks duration
      
      const status = getRandomElement(Object.values(ResearchStatus));
      
      researchData.push({
        name,
        team,
        researcher,
        researchType,
        products: selectedProducts,
        color,
        dateStart: startDate,
        dateEnd: endDate,
        status,
        description: generateDescription(name, researchType),
        customerFullName: "Sample Customer",
        customerSegmentDescription: "Target demographic for this research",
        additionalStakeholders: ["Product Manager", "UX Designer"],
        resultFormat: "Research Report",
        screeningQuestions: [],
        researchQuestions: [],
        incentive: "$50 gift card",
        recruiting: "Internal recruitment",
        respondentsNeeded: Math.floor(Math.random() * 20) + 5,
        sessionDuration: Math.floor(Math.random() * 60) + 30,
        location: "Remote",
        equipment: "Video conferencing",
        consent: true,
        recordingConsent: true,
        dataHandling: "Secure storage and analysis",
        timeline: "2-3 weeks",
        budget: Math.floor(Math.random() * 5000) + 1000,
        internalNotes: "Generated test data",
        inviteTemplate: "Standard research invitation"
      });
    }

    // Insert researches in batches
    const batchSize = 10;
    const insertedResearches = [];
    
    for (let i = 0; i < researchData.length; i += batchSize) {
      const batch = researchData.slice(i, i + batchSize);
      const inserted = await db.insert(researches).values(batch).returning();
      insertedResearches.push(...inserted);
      console.log(`Inserted research batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(researchData.length / batchSize)}`);
    }

    // Generate 5 meetings per research
    const meetingData = [];
    for (const research of insertedResearches) {
      for (let j = 1; j <= 5; j++) {
        const meetingDate = getRandomDate(research.dateStart, research.dateEnd);
        const respondentName = getRandomElement(respondentNames);
        const meetingType = getRandomElement(meetingTypes);
        const status = getRandomElement(Object.values(MeetingStatus));
        
        meetingData.push({
          researchId: research.id,
          respondentName,
          respondentPosition: getRandomElement(respondentPositions),
          cnum: `CNUM${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          gcc: `GCC${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          companyName: `${respondentName.split(' ')[1]} Corp`,
          email: `${respondentName.toLowerCase().replace(' ', '.')}@company.com`,
          researcher: research.researcher,
          relationshipManager: getRandomElement(relationshipManagers),
          salesPerson: getRandomElement(salesPersons),
          date: meetingDate,
          status,
          notes: `${meetingType} session with ${respondentName}. Generated test data for research: ${research.name}`,
          fullText: `Detailed notes from ${meetingType.toLowerCase()} session with ${respondentName}`,
          hasGift: Math.random() > 0.7 ? "yes" : "no"
        });
      }
    }

    // Insert meetings in batches
    const insertedMeetings = [];
    for (let i = 0; i < meetingData.length; i += batchSize) {
      const batch = meetingData.slice(i, i + batchSize);
      const inserted = await db.insert(meetings).values(batch).returning();
      insertedMeetings.push(...inserted);
      console.log(`Inserted meeting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(meetingData.length / batchSize)}`);
    }

    console.log(`Successfully populated database with:`);
    console.log(`- ${insertedResearches.length} researches`);
    console.log(`- ${insertedMeetings.length} meetings`);
    
    return {
      researchesCount: insertedResearches.length,
      meetingsCount: insertedMeetings.length
    };
    
  } catch (error) {
    console.error('Error populating database:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateLargeDataset()
    .then(result => {
      console.log('Database population completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Database population failed:', error);
      process.exit(1);
    });
}