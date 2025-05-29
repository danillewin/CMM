import { db } from "./db";
import { teams, positions, researches, meetings, jtbds, researchJtbds, meetingJtbds } from "@shared/schema";

async function clearDatabase() {
  console.log("Clearing existing data...");
  await db.delete(meetingJtbds);
  await db.delete(researchJtbds);
  await db.delete(meetings);
  await db.delete(jtbds);
  await db.delete(researches);
  await db.delete(positions);
  await db.delete(teams);
}

async function seedDemoData() {
  console.log("Starting database seeding with demo data...");
  
  await clearDatabase();

  // Insert teams
  console.log("Seeding teams...");
  const teamData = [
    { name: "Product Strategy" },
    { name: "Market Research" },
    { name: "Customer Experience" },
    { name: "Business Intelligence" },
    { name: "Innovation Lab" },
  ];
  
  for (const team of teamData) {
    await db.insert(teams).values(team);
  }

  // Insert positions
  console.log("Seeding positions...");
  const positionData = [
    { name: "Chief Executive Officer" },
    { name: "Chief Technology Officer" },
    { name: "Chief Marketing Officer" },
    { name: "VP of Product" },
    { name: "VP of Engineering" },
    { name: "VP of Sales" },
    { name: "Director of Operations" },
    { name: "Director of Marketing" },
    { name: "Product Manager" },
    { name: "Senior Product Manager" },
    { name: "Engineering Manager" },
    { name: "Data Scientist" },
    { name: "UX Designer" },
    { name: "Business Analyst" },
    { name: "Solutions Architect" },
  ];
  
  for (const position of positionData) {
    await db.insert(positions).values(position);
  }

  // Insert JTBDs (Jobs to be Done)
  console.log("Seeding JTBDs...");
  const jtbdData = [
    {
      title: "Improve Customer Onboarding",
      description: "Streamline the initial user experience to reduce time-to-value and increase activation rates",
      category: "Customer Experience",
      priority: "High",
      parentId: 0,
    },
    {
      title: "Optimize Registration Flow",
      description: "Simplify account creation process to reduce drop-off rates",
      category: "Customer Experience", 
      priority: "Medium",
      parentId: 1,
    },
    {
      title: "Personalize Welcome Experience",
      description: "Create tailored onboarding paths based on user type and goals",
      category: "Customer Experience",
      priority: "Medium", 
      parentId: 1,
    },
    {
      title: "Enhance Product Analytics",
      description: "Implement comprehensive tracking to understand user behavior and product performance",
      category: "Product Intelligence",
      priority: "High",
      parentId: 0,
    },
    {
      title: "Build Real-time Dashboards",
      description: "Create executive dashboards for key business metrics monitoring",
      category: "Product Intelligence",
      priority: "High",
      parentId: 4,
    },
    {
      title: "Scale Platform Infrastructure", 
      description: "Ensure system can handle 10x growth in user base and data volume",
      category: "Technical",
      priority: "Critical",
      parentId: 0,
    },
    {
      title: "Implement Auto-scaling",
      description: "Deploy dynamic resource allocation based on traffic patterns",
      category: "Technical",
      priority: "High",
      parentId: 6,
    },
    {
      title: "Expand Market Reach",
      description: "Enter new geographic markets and customer segments",
      category: "Business Growth",
      priority: "High", 
      parentId: 0,
    },
    {
      title: "Develop Partner Ecosystem",
      description: "Build strategic partnerships to accelerate growth and feature development",
      category: "Business Growth",
      priority: "Medium",
      parentId: 8,
    },
    {
      title: "Optimize Mobile Experience",
      description: "Enhance mobile app performance and feature parity with web platform",
      category: "Product Development",
      priority: "High",
      parentId: 0,
    },
  ];

  for (const jtbd of jtbdData) {
    await db.insert(jtbds).values(jtbd);
  }

  // Insert researches
  console.log("Seeding researches...");
  const researchData = [
    {
      name: "Enterprise Customer Journey Mapping",
      team: "Customer Experience",
      researcher: "Sarah Chen",
      description: "Comprehensive analysis of enterprise customer touchpoints to identify optimization opportunities and pain points throughout the buyer journey.",
      dateStart: new Date('2024-03-01'),
      dateEnd: new Date('2024-05-15'),
      status: "In Progress",
      color: "#3b82f6",
    },
    {
      name: "AI-Powered Personalization Engine",
      team: "Product Strategy", 
      researcher: "Michael Rodriguez",
      description: "Research and development of machine learning algorithms to deliver personalized user experiences and increase engagement metrics.",
      dateStart: new Date('2024-02-15'),
      dateEnd: new Date('2024-06-30'),
      status: "In Progress",
      color: "#10b981",
    },
    {
      name: "Market Expansion Analysis - APAC",
      team: "Market Research",
      researcher: "Emily Zhang",
      description: "Strategic research into Asia-Pacific market opportunities, competitive landscape, and localization requirements for product expansion.",
      dateStart: new Date('2024-04-01'),
      dateEnd: new Date('2024-07-31'),
      status: "Planned",
      color: "#f59e0b",
    },
    {
      name: "Mobile App Performance Optimization",
      team: "Product Strategy",
      researcher: "David Kim",
      description: "Technical research into mobile application performance bottlenecks and user experience improvements across iOS and Android platforms.",
      dateStart: new Date('2024-01-15'),
      dateEnd: new Date('2024-04-30'),
      status: "Done",
      color: "#ef4444",
    },
    {
      name: "Customer Churn Prediction Model",
      team: "Business Intelligence",
      researcher: "Dr. Amanda Foster",
      description: "Development of predictive analytics model to identify at-risk customers and implement proactive retention strategies.",
      dateStart: new Date('2024-03-15'),
      dateEnd: new Date('2024-08-15'),
      status: "In Progress",
      color: "#8b5cf6",
    },
    {
      name: "Voice of Customer Analytics Platform",
      team: "Customer Experience",
      researcher: "James Wilson",
      description: "Building comprehensive feedback analysis system to extract insights from customer communications across all touchpoints.",
      dateStart: new Date('2024-05-01'),
      dateEnd: new Date('2024-09-30'),
      status: "Planned",
      color: "#06b6d4",
    },
  ];

  for (const research of researchData) {
    await db.insert(researches).values(research);
  }

  // Insert meetings
  console.log("Seeding meetings...");
  const meetingData = [
    {
      respondentName: "Alex Thompson",
      respondentPosition: "Chief Technology Officer",
      cnum: "ENT001",
      gcc: "NA-WEST-001",
      companyName: "TechCorp Solutions",
      email: "alex.thompson@techcorp.com",
      researcher: "Sarah Chen",
      relationshipManager: "Jennifer Walsh",
      salesPerson: "Mark Stevens",
      date: new Date('2024-03-15T14:00:00'),
      researchId: 1,
      status: "Done",
      notes: "Excellent discussion about enterprise integration challenges. Client showed strong interest in our API capabilities and scalability features. Key pain points identified: current solution lacks real-time analytics and requires extensive manual configuration. Follow-up scheduled for next week to demo our automation features.",
      hasGift: "yes",
    },
    {
      respondentName: "Maria Gonzalez",
      respondentPosition: "VP of Product",
      cnum: "ENT002",
      gcc: "NA-EAST-002",
      companyName: "InnovateTech Inc",
      email: "maria.gonzalez@innovatetech.com",
      researcher: "Michael Rodriguez",
      manager: "Robert Chen",
      relationshipManager: "Robert Chen",
      salesPerson: "Lisa Anderson",
      date: new Date('2024-03-20T10:30:00'),
      researchId: 2,
      status: "Done",
      notes: "Productive session discussing AI personalization requirements. Maria emphasized the importance of GDPR compliance and data privacy. Showed strong interest in our machine learning capabilities. Concerns raised about implementation timeline and training requirements for their team.",
      hasGift: "no",
    },
    {
      respondentName: "Dr. Rajesh Patel", 
      respondentPosition: "Director of Operations",
      cnum: "ENT003",
      gcc: "APAC-001",
      companyName: "Global Dynamics Ltd",
      email: "r.patel@globaldynamics.com",
      researcher: "Emily Zhang",
      manager: "Sarah Kim",
      relationshipManager: "Sarah Kim",
      salesPerson: "David Liu",
      date: new Date('2024-04-02T09:00:00'),
      researchId: 3,
      status: "Meeting Set",
      notes: "Initial discovery call to understand their expansion into Southeast Asian markets. Dr. Patel provided valuable insights into regulatory requirements and cultural considerations for the region.",
      hasGift: "no",
    },
    {
      respondentName: "Catherine Laurent",
      respondentPosition: "Chief Marketing Officer", 
      cnum: "ENT004",
      gcc: "EU-WEST-001",
      companyName: "EuroTech Systems",
      email: "c.laurent@eurotech.eu",
      researcher: "David Kim",
      manager: "Thomas Mueller",
      relationshipManager: "Thomas Mueller",
      salesPerson: "Anna Rossi",
      date: new Date('2024-03-25T15:30:00'),
      researchId: 4,
      status: "Done", 
      notes: "Comprehensive review of mobile app performance metrics. Catherine shared detailed analytics showing significant user drop-off on mobile devices. Discussed our optimization strategies and showed demos of improved load times and user interface enhancements.",
      hasGift: "yes",
    },
    {
      respondentName: "Kevin O'Brien",
      respondentPosition: "Data Scientist",
      cnum: "ENT005",
      gcc: "NA-CENTRAL-001", 
      companyName: "DataFlow Analytics",
      email: "kevin.obrien@dataflow.com",
      researcher: "Dr. Amanda Foster",
      manager: "Michelle Rodriguez",
      relationshipManager: "Michelle Rodriguez",
      salesPerson: "Brian Taylor",
      date: new Date('2024-04-10T11:00:00'),
      researchId: 5,
      status: "In Progress",
      notes: "Deep technical discussion about predictive modeling approaches. Kevin provided excellent feedback on our current churn prediction algorithms and suggested improvements based on their industry experience. Planning follow-up technical workshop.",
      hasGift: "no",
    },
    {
      respondentName: "Sandra Kim",
      respondentPosition: "VP of Engineering",
      cnum: "ENT006", 
      gcc: "APAC-002",
      companyName: "NextGen Software",
      email: "sandra.kim@nextgen.co.kr",
      researcher: "James Wilson",
      manager: "Alex Chen",
      relationshipManager: "Alex Chen",
      salesPerson: "Jennifer Park",
      date: new Date('2024-05-05T13:00:00'),
      researchId: 6,
      status: "Meeting Set",
      notes: "Scheduled to discuss voice of customer analytics implementation. Sandra's team is particularly interested in real-time sentiment analysis capabilities.",
      hasGift: "no",
    },
    {
      respondentName: "Marcus Weber",
      respondentPosition: "Senior Product Manager",
      cnum: "ENT007",
      gcc: "EU-CENTRAL-001",
      companyName: "Deutsche Innovation GmbH", 
      email: "marcus.weber@deutsche-innovation.de",
      researcher: "Sarah Chen",
      manager: "Klaus Hoffman",
      relationshipManager: "Klaus Hoffman",
      salesPerson: "Eva Schmidt",
      date: new Date('2024-03-28T16:00:00'),
      researchId: 1,
      status: "Done",
      notes: "Focused discussion on customer onboarding optimization. Marcus shared detailed user journey maps and conversion funnel data. Identified key opportunities for improvement in their current process. Strong alignment with our research objectives.",
      hasGift: "yes",
    },
    {
      respondentName: "Dr. Lisa Chen",
      respondentPosition: "Chief Executive Officer",
      cnum: "ENT008",
      gcc: "NA-WEST-002",
      companyName: "MedTech Innovations",
      email: "lisa.chen@medtech-innovations.com", 
      researcher: "Michael Rodriguez",
      manager: "Steven Walsh",
      relationshipManager: "Steven Walsh",
      salesPerson: "Rachel Martinez",
      date: new Date('2024-04-15T14:30:00'),
      researchId: 2,
      status: "Declined",
      notes: "Meeting was rescheduled due to urgent board commitments. Dr. Chen expressed continued interest and suggested alternative dates for next month.",
      hasGift: "no",
    },
  ];

  for (const meeting of meetingData) {
    await db.insert(meetings).values(meeting);
  }

  // Link researches to JTBDs
  console.log("Linking researches to JTBDs...");
  const researchJtbdLinks = [
    { researchId: 1, jtbdId: 1 }, // Enterprise Customer Journey -> Improve Customer Onboarding
    { researchId: 1, jtbdId: 2 }, // Enterprise Customer Journey -> Optimize Registration Flow
    { researchId: 2, jtbdId: 4 }, // AI-Powered Personalization -> Enhance Product Analytics
    { researchId: 2, jtbdId: 5 }, // AI-Powered Personalization -> Build Real-time Dashboards
    { researchId: 3, jtbdId: 8 }, // Market Expansion -> Expand Market Reach
    { researchId: 4, jtbdId: 10 }, // Mobile App Performance -> Optimize Mobile Experience
    { researchId: 5, jtbdId: 4 }, // Customer Churn -> Enhance Product Analytics
    { researchId: 6, jtbdId: 1 }, // Voice of Customer -> Improve Customer Onboarding
  ];

  for (const link of researchJtbdLinks) {
    await db.insert(researchJtbds).values(link);
  }

  // Link meetings to JTBDs
  console.log("Linking meetings to JTBDs...");
  const meetingJtbdLinks = [
    { meetingId: 1, jtbdId: 6 }, // Alex Thompson -> Scale Platform Infrastructure
    { meetingId: 2, jtbdId: 4 }, // Maria Gonzalez -> Enhance Product Analytics  
    { meetingId: 3, jtbdId: 8 }, // Dr. Rajesh Patel -> Expand Market Reach
    { meetingId: 4, jtbdId: 10 }, // Catherine Laurent -> Optimize Mobile Experience
    { meetingId: 5, jtbdId: 4 }, // Kevin O'Brien -> Enhance Product Analytics
    { meetingId: 6, jtbdId: 1 }, // Sandra Kim -> Improve Customer Onboarding
    { meetingId: 7, jtbdId: 2 }, // Marcus Weber -> Optimize Registration Flow
    { meetingId: 8, jtbdId: 5 }, // Dr. Lisa Chen -> Build Real-time Dashboards
  ];

  for (const link of meetingJtbdLinks) {
    await db.insert(meetingJtbds).values(link);
  }

  console.log("Demo data seeding completed successfully!");
}

// Run the seeding function
seedDemoData().then(() => {
  console.log("Database seeded with realistic demo data!");
  process.exit(0);
}).catch(error => {
  console.error("Error seeding database:", error);
  process.exit(1);
});