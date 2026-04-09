// ─── NAV TABS ───────────────────────────────────────────────
export const NAV_TABS = [
  { id: "ppe", label: "PPE", mode: "PPE" },
  { id: "animal", label: "Animal", mode: "ANIMAL" },
  { id: "fire", label: "Fire", mode: "FIRE" },
  { id: "dock", label: "Dock", mode: "DOCK" },
  { id: "secure_area", label: "Secure Area", mode: "SAFETY" },
  { id: "head_count", label: "Head Flow", mode: "COUNTING" },
];

// ─── PPE KIT ITEMS ──────────────────────────────────────────
export const PPE_ITEMS = [
  { id: "helmet", label: "Helmet", icon: "helmet" },
  { id: "goggles", label: "Goggles", icon: "goggles" },
  { id: "arm_sleeves", label: "Arm Sleeves", icon: "arm_sleeves" },
  { id: "hand_gloves", label: "Hand Gloves", icon: "hand_gloves" },
  { id: "vest", label: "Vest", icon: "vest" },
  { id: "shoes", label: "Shoes", icon: "shoes" },
];

// ─── CAMERAS ────────────────────────────────────────────────
export const CAMERAS = [
  {
    id: "CAM-001",
    label: "CAM 1",
    location: "Warehouse Entrance",
    tab: "ppe",
    violations: ["goggles", "shoes"],
  },
  {
    id: "CAM-002",
    label: "CAM 2",
    location: "Assembly Line A",
    tab: "ppe",
    violations: ["helmet"],
  },
  {
    id: "CAM-003",
    label: "CAM 3",
    location: "Loading Dock",
    tab: "dock",
    violations: [],
  },
  {
    id: "CAM-004",
    label: "CAM 4",
    location: "Secure Zone B",
    tab: "secure_area",
    violations: ["vest", "hand_gloves"],
  },
  {
    id: "CAM-005",
    label: "CAM 5",
    location: "Exit Gate",
    tab: "ppe",
    violations: ["arm_sleeves"],
  },
];

export const MOCK_METRICS = {
  in: 22,
  out: 8,
  total: 30,
  inFrame: 11,
};
