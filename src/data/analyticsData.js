export const peopleData = [
  { date: "18 Apr", value: 320 },
  { date: "19 Apr", value: 450 },
  { date: "19 Apr", value: 380 },
  { date: "20 Apr", value: 520 },
  { date: "20 Apr", value: 420 },
  { date: "21 Apr", value: 600 },
  { date: "21 Apr", value: 480 },
  { date: "22 Apr", value: 650 },
  { date: "22 Apr", value: 520 },
  { date: "23 Apr", value: 580 },
  { date: "23 Apr", value: 460 },
  { date: "24 Apr", value: 720 },
];

export const vehicleData = [
  { date: "18 Apr", value: 210 },
  { date: "19 Apr", value: 380 },
  { date: "19 Apr", value: 280 },
  { date: "20 Apr", value: 460 },
  { date: "20 Apr", value: 350 },
  { date: "21 Apr", value: 520 },
  { date: "21 Apr", value: 400 },
  { date: "22 Apr", value: 580 },
  { date: "22 Apr", value: 460 },
  { date: "23 Apr", value: 530 },
  { date: "23 Apr", value: 420 },
  { date: "24 Apr", value: 590 },
];

export const alertData = [
  { date: "18 Apr", value: 100 },
  { date: "19 Apr", value: 480 },
  { date: "19 Apr", value: 380 },
  { date: "20 Apr", value: 560 },
  { date: "20 Apr", value: 440 },
  { date: "21 Apr", value: 600 },
  { date: "21 Apr", value: 460 },
  { date: "22 Apr", value: 650 },
  { date: "22 Apr", value: 500 },
  { date: "23 Apr", value: 620 },
  { date: "23 Apr", value: 480 },
  { date: "24 Apr", value: 660 },
];

export const eventsData = [
  { name: "PPE Detection", value: 124, color: "#F84F4F" },
  { name: "Vehicle Detection", value: 398, color: "#4FAFF8" },
  { name: "Crowd Detection", value: 174, color: "#6B4FF8" },
  { name: "Introgen Detection", value: 162, color: "#BA4FF8" },
  { name: "Head Count Detection", value: 423, color: "#F8C94F" },
  { name: "Blocked Person Detection", value: 112, color: "#D9F84F" },
];

export const miniCrowdBarData = [
  { v: 30 },
  { v: 55 },
  { v: 40 },
  { v: 80 },
  { v: 60 },
  { v: 180 }, // ← peak (10Am–11Am)
  { v: 90 },
  { v: 70 },
  { v: 50 },
  { v: 35 },
];

export const miniVehicleBarData = [
  { v: 30 },
  { v: 90 },
  { v: 50 },
  { v: 130 },
  { v: 70 },
  { v: 160 },
  { v: 100 },
  { v: 140 },
  { v: 80 },
  { v: 170 },
];

export const statCards = [
  {
    id: "crowd",
    title: "Crowd Detection",
    subtitle: "Peak Hr: 10Am to 11Am",
    iconKey: "crowd",
    miniDataKey: "crowd",
    miniChartType: "bar", // ← bar chart, blue gradient
  },
  {
    id: "introgen",
    title: "Introgen Detection",
    count: 14,
    highlight: "Most Insecure Zones",
    iconKey: "introgen",
    miniDataKey: null,
    miniChartType: null,
  },
  {
    id: "vehicle",
    title: "Vehicle Detection",
    subtitle: "Peak Hr: 10Am to 11Am",
    iconKey: "vehicle",
    miniDataKey: "vehicle",
    miniChartType: "bar", // ← bar chart, purple gradient
  },
];
