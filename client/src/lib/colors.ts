export const getResearchColor = (id: number) => {
  const colors = [
    "bg-blue-400/80",
    "bg-green-400/80",
    "bg-purple-400/80",
    "bg-amber-400/80",
    "bg-rose-400/80",
    "bg-indigo-400/80"
  ];
  return colors[id % colors.length];
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
