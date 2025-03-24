export const RESEARCH_COLORS = [
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#8b5cf6", // purple-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#6366f1", // indigo-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
  "#06b6d4", // cyan-500
  "#d946ef", // fuchsia-500
] as const;

export const getResearchColor = (id: number) => {
  return RESEARCH_COLORS[id % RESEARCH_COLORS.length];
};

export const getResearchColorClasses = (color: string) => {
  return `bg-[${color}]/80 hover:bg-[${color}]`;
};

export const getResearchColorWithoutOpacity = (id: number) => {
  const colors = [
    "bg-blue-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-amber-400",
    "bg-rose-400",
    "bg-indigo-400"
  ];
  return colors[id % colors.length];
};