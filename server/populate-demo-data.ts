import { db } from "./db";
import { teams, positions, researches, meetings, jtbds, researchJtbds, meetingJtbds } from "@shared/schema";

async function populateRealisticData() {
  console.log("Populating database with realistic demo data...");

  // Insert teams
  const teamEntries = [
    { name: "Product Strategy" },
    { name: "Market Research" },
    { name: "Customer Experience" },
    { name: "Business Intelligence" },
    { name: "Innovation Lab" },
  ];
  
  for (const team of teamEntries) {
    await db.insert(teams).values(team);
  }

  // Insert positions
  const positionEntries = [
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
  
  for (const position of positionEntries) {
    await db.insert(positions).values(position);
  }

  // Insert JTBDs
  const jtbdEntries = [
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

  for (const jtbd of jtbdEntries) {
    await db.insert(jtbds).values(jtbd);
  }

  // Insert researches
  const researchEntries = [
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

  for (const research of researchEntries) {
    await db.insert(researches).values(research);
  }

  console.log("Demo data populated successfully!");
}

// Run the population function
populateRealisticData().then(() => {
  console.log("Database populated with realistic demo data!");
  process.exit(0);
}).catch(error => {
  console.error("Error populating database:", error);
  process.exit(1);
});