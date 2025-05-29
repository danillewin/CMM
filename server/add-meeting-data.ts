import { db } from "./db";
import { meetings, meetingJtbds } from "@shared/schema";

async function addMeetingData() {
  console.log("Adding realistic meeting data...");

  const meetingEntries = [
    {
      respondentName: "Alex Thompson",
      respondentPosition: "Chief Technology Officer",
      cnum: "ENT001",
      gcc: "NA-WEST-001",
      companyName: "TechCorp Solutions",
      email: "alex.thompson@techcorp.com",
      researcher: "Sarah Chen",
      manager: "Jennifer Walsh",
      relationshipManager: "Jennifer Walsh",
      salesPerson: "Mark Stevens",
      date: new Date('2024-03-15T14:00:00'),
      researchId: 32, // Enterprise Customer Journey Mapping
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
      researchId: 33, // AI-Powered Personalization Engine
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
      recruiter: "David Liu",
      date: new Date('2024-04-02T09:00:00'),
      researchId: 34, // Market Expansion Analysis - APAC
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
      recruiter: "Anna Rossi",
      date: new Date('2024-03-25T15:30:00'),
      researchId: 35, // Mobile App Performance Optimization
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
      recruiter: "Brian Taylor",
      date: new Date('2024-04-10T11:00:00'),
      researchId: 36, // Customer Churn Prediction Model
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
      recruiter: "Jennifer Park",
      date: new Date('2024-05-05T13:00:00'),
      researchId: 37, // Voice of Customer Analytics Platform
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
      recruiter: "Eva Schmidt",
      date: new Date('2024-03-28T16:00:00'),
      researchId: 32, // Enterprise Customer Journey Mapping
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
      recruiter: "Rachel Martinez",
      date: new Date('2024-04-15T14:30:00'),
      researchId: 33, // AI-Powered Personalization Engine
      status: "Declined",
      notes: "Meeting was rescheduled due to urgent board commitments. Dr. Chen expressed continued interest and suggested alternative dates for next month.",
      hasGift: "no",
    },
  ];

  for (const meeting of meetingEntries) {
    await db.insert(meetings).values(meeting);
  }

  // Link meetings to JTBDs
  const meetingJtbdLinks = [
    { meetingId: 1, jtbdId: 42 }, // Alex Thompson -> Scale Platform Infrastructure
    { meetingId: 2, jtbdId: 40 }, // Maria Gonzalez -> Enhance Product Analytics  
    { meetingId: 3, jtbdId: 44 }, // Dr. Rajesh Patel -> Expand Market Reach
    { meetingId: 4, jtbdId: 46 }, // Catherine Laurent -> Optimize Mobile Experience
    { meetingId: 5, jtbdId: 40 }, // Kevin O'Brien -> Enhance Product Analytics
    { meetingId: 6, jtbdId: 37 }, // Sandra Kim -> Improve Customer Onboarding
    { meetingId: 7, jtbdId: 38 }, // Marcus Weber -> Optimize Registration Flow
    { meetingId: 8, jtbdId: 41 }, // Dr. Lisa Chen -> Build Real-time Dashboards
  ];

  for (const link of meetingJtbdLinks) {
    await db.insert(meetingJtbds).values(link);
  }

  console.log("Meeting data added successfully!");
}

// Run the function
addMeetingData().then(() => {
  console.log("Realistic meeting data populated!");
  process.exit(0);
}).catch(error => {
  console.error("Error adding meeting data:", error);
  process.exit(1);
});