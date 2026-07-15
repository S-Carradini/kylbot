export type LayerKey =
  | "ama"
  | "basins"
  | "providers"
  | "cap"
  | "quality"
  | "rivers"
  | "drought"
  | "flood"
  | "infrastructure";

export const LAYERS: { key: LayerKey; label: string; color: string; group: string; desc: string }[] = [
  { key: "ama", label: "Active Management Areas", color: "#0a3d62", group: "Policy", desc: "Designated regions where groundwater is actively managed under the 1980 Groundwater Management Act." },
  { key: "basins", label: "Groundwater Basins", color: "#3ec1d3", group: "Hydrology", desc: "Sub-surface aquifer boundaries used for assessment and reporting." },
  { key: "providers", label: "Water Providers", color: "#1c7c8c", group: "Service", desc: "Service-area boundaries for municipal and private water utilities." },
  { key: "cap", label: "CAP Canal", color: "#0f4c75", group: "Infrastructure", desc: "The Central Arizona Project canal delivering Colorado River water across the state." },
  { key: "quality", label: "Water Quality", color: "#f4a83c", group: "Environment", desc: "Synthetic indicators for nitrate, arsenic, and TDS exceedances." },
  { key: "rivers", label: "Rivers & Streams", color: "#3ec1d3", group: "Hydrology", desc: "Perennial and ephemeral surface-water network." },
  { key: "drought", label: "Drought Status", color: "#e47e77", group: "Climate", desc: "U.S. Drought Monitor categories (synthetic snapshot)." },
  { key: "flood", label: "Flood Hazard", color: "#e8d6b3", group: "Climate", desc: "FEMA-style 100-yr and 500-yr flood zones." },
  { key: "infrastructure", label: "Infrastructure", color: "#122c3a", group: "Infrastructure", desc: "Treatment plants, recharge facilities, and major pipelines." },
];

export type Place = {
  id: string;
  name: string;
  x: number; // percentage
  y: number;
  ama?: string;
  basin: string;
  provider: string;
  drought: "D0" | "D1" | "D2" | "D3" | "D4";
  quality: "Good" | "Watch" | "Concern";
  notes: string;
};

export const PLACES: Place[] = [
  { id: "tempe",      name: "Tempe",         x: 47, y: 50, ama: "Phoenix AMA",  basin: "Salt River Valley",   provider: "City of Tempe Water",   drought: "D2", quality: "Good",    notes: "ASU campus area; served by SRP & CAP blended supplies." },
  { id: "buckeye",    name: "Buckeye",       x: 38, y: 52, ama: "Phoenix AMA",  basin: "Hassayampa Sub-basin",provider: "Buckeye Water Resources",drought: "D3", quality: "Watch",   notes: "Rapid growth area; groundwater levels declining." },
  { id: "tucson",     name: "Tucson",        x: 52, y: 78, ama: "Tucson AMA",   basin: "Tucson Basin",        provider: "Tucson Water",          drought: "D1", quality: "Good",    notes: "Conjunctive use of CAP recharge and groundwater." },
  { id: "prescott",   name: "Prescott",      x: 41, y: 33, ama: "Prescott AMA", basin: "Prescott AMA Basin",  provider: "City of Prescott",      drought: "D2", quality: "Good",    notes: "Designated AMA with mandatory conservation." },
  { id: "casagrande", name: "Casa Grande",   x: 50, y: 62, ama: "Pinal AMA",    basin: "Eloy Sub-basin",      provider: "Arizona Water Company", drought: "D3", quality: "Watch",   notes: "Agricultural transition zone; subsidence monitoring." },
  { id: "willcox",    name: "Willcox",       x: 70, y: 76, ama: undefined,      basin: "Willcox Basin",       provider: "Self-supplied / private",drought: "D3", quality: "Concern", notes: "Unregulated basin; declining water table." },
  { id: "douglas",    name: "Douglas",       x: 73, y: 88, ama: "Douglas AMA",  basin: "Douglas Basin",       provider: "City of Douglas",       drought: "D2", quality: "Watch",   notes: "Newest AMA (designated 2022)." },
  { id: "ranegras",   name: "Ranegras Plain",x: 22, y: 50, ama: undefined,      basin: "Ranegras Plain Basin",provider: "Self-supplied",         drought: "D2", quality: "Watch",   notes: "Rural basin with proposed transportation studies." },
];

export const EXAMPLE_QUESTIONS = [
  "How secure is my water supply?",
  "Is my address within an Active Management Area (AMA)?",
  "What's the groundwater like in my area?",
  "How are AZ's groundwater levels trending?",
  "Is my area part of a groundwater replenishment district?",
  "Which cities are leasing Colorado River water?",
  "How will the Colorado River shortage impact me?",
];

export type AgentResponse = {
  trail: string[];
  summary: string;
  bullets?: string[];
  layersOn?: LayerKey[];
  focusPlace?: string;
  topic?: string;
};

export function answerQuery(q: string): AgentResponse {
  const lower = q.toLowerCase();
  const trail = [
    "Parsed question",
    "Searched water data layers",
    "Cross-referenced ADWR records",
    "Compiled answer",
    "Ready",
  ];

  // How secure is my water supply?
  if (lower.includes("secure") && lower.includes("water supply") || lower.includes("water supply")) {
    return {
      trail,
      summary: "Water security in Arizona varies by provider. Some providers are designated as 'adequately assured,' meaning your supply is reliable long-term.",
      bullets: [
        "Providers in AMAs must demonstrate a 100-year assured water supply",
        "Phoenix AMA: most municipal providers are adequately assured",
        "Tucson Water: CAP recharge + groundwater conjunctive use",
        "Rural & unregulated areas: may rely on declining groundwater",
        "Find your provider on the Arizona Water Blueprint map",
      ],
      layersOn: ["ama", "providers"],
      topic: "Security",
    };
  }

  // Is my address within an AMA?
  if (lower.includes("address") && lower.includes("ama") || lower.includes("active management area") || lower.includes("ama") || lower.includes("forest")) {
    return {
      trail,
      summary: "Arizona has 6 Active Management Areas (AMAs) covering the most heavily populated and water-stressed regions of the state.",
      bullets: [
        "Phoenix AMA — Greater Phoenix metro area",
        "Tucson AMA — Tucson Basin and surrounding area",
        "Pinal AMA — Casa Grande and Eloy region",
        "Prescott AMA — Prescott and Chino Valley",
        "Santa Cruz AMA — Nogales area",
        "Douglas AMA — Added 2022, southeastern Arizona",
      ],
      layersOn: ["ama"],
      topic: "AMA",
    };
  }

  // Any question mentioning groundwater/aquifers — kept broad (not requiring
  // "area" to co-occur) so the map-routing logic reliably recognizes it as a
  // groundwater topic and opens the groundwater map/dashboard, not the
  // default main map.
  if (lower.includes("groundwater") || lower.includes("aquifer")) {
    return {
      trail,
      summary: "Groundwater conditions vary significantly across Arizona. Aquifer health depends on recharge rates, pumping, and CAP deliveries.",
      bullets: [
        "Salt River Valley: relatively stable due to CAP recharge",
        "Willcox Basin: unregulated, water table declining ~3–5 ft/year",
        "Tucson Basin: conjunctive use keeps levels stable",
        "Hassayampa (Buckeye): rapid growth driving declines",
        "Use the Groundwater Dashboard for your area",
      ],
      layersOn: ["basins", "quality"],
      topic: "Groundwater",
    };
  }

  // How are AZ's groundwater levels trending?
  if (lower.includes("trending") || lower.includes("groundwater level") || lower.includes("levels trend")) {
    return {
      trail,
      summary: "Statewide groundwater trends show a mixed picture — regulated AMAs are stabilizing while unregulated basins continue to decline.",
      bullets: [
        "Phoenix AMA: levels stable to slightly rising in CAP-served areas",
        "Tucson AMA: stable due to underground storage programs",
        "Willcox & Douglas basins: declining 3–7 ft/year (unregulated)",
        "Pinal AMA: agricultural transition reducing pumping",
        "Colorado River shortage reducing CAP deliveries — watch closely",
      ],
      layersOn: ["basins", "drought"],
      topic: "Trends",
    };
  }

  // Groundwater replenishment district
  if (lower.includes("replenishment") || lower.includes("replenishment district")) {
    return {
      trail,
      summary: "Groundwater replenishment districts store surface water underground to offset pumping and sustain long-term supply.",
      bullets: [
        "CAGRD (Central Arizona Groundwater Replenishment District) is the largest",
        "Members include cities, water districts, and subdivisions",
        "CAGRD replenishes water on behalf of members using CAP water",
        "Membership ensures compliance with assured water supply rules",
        "Critical for new developments in Phoenix and Pinal AMAs",
      ],
      layersOn: ["ama", "infrastructure"],
      topic: "Replenishment",
    };
  }

  // Which cities are leasing Colorado River water?
  if (lower.includes("leasing") || lower.includes("colorado river water") || lower.includes("cap") || lower.includes("colorado river")) {
    return {
      trail,
      summary: "Several Arizona cities hold or lease Colorado River water rights delivered via the Central Arizona Project (CAP) canal.",
      bullets: [
        "Phoenix, Tucson, Mesa, Scottsdale — major CAP contractors",
        "CAP is a 336-mile aqueduct from Lake Havasu to Tucson",
        "Arizona's CAP allocation: ~2.8M acre-feet/year (full entitlement)",
        "Shortage: Tier 1 cuts began 2022, reducing Arizona's CAP supply",
        "Some cities lease unused entitlements to others or CAGRD",
      ],
      layersOn: ["cap", "providers"],
      topic: "CAP",
    };
  }

  // Colorado River shortage
  if (lower.includes("shortage") || lower.includes("shortage impact") || lower.includes("colorado river shortage")) {
    return {
      trail,
      summary: "The Colorado River shortage affects Arizona's CAP water supply, agriculture, and long-term water planning.",
      bullets: [
        "Lake Mead Tier 1 shortage: Arizona loses ~512,000 acre-feet/year",
        "Agricultural users (Pinal AMA) bear first shortage cuts",
        "Municipal CAP deliveries protected at higher priority levels",
        "Arizona investing in water augmentation and conservation",
        "Long-term: 7-state negotiations ongoing for sustainable basin use",
      ],
      layersOn: ["cap", "drought", "ama"],
      topic: "Colorado River",
    };
  }

  // Location lookup
  const match = PLACES.find((p) => lower.includes(p.name.toLowerCase()));
  if (match) {
    return {
      trail,
      summary: `${match.name} — ${match.ama ? `within the ${match.ama}` : "outside any AMA"}, ${match.basin}.`,
      bullets: [
        `Water provider: ${match.provider}`,
        `Drought status: ${match.drought}`,
        `Water quality flag: ${match.quality}`,
        match.notes,
      ],
      layersOn: ["ama", "basins", "providers"],
      focusPlace: match.id,
    };
  }

  return {
    trail,
    summary: "I can answer questions about Arizona water security, AMAs, groundwater trends, Colorado River impacts, and more.",
    bullets: [
      "Try: \"How secure is my water supply?\"",
      "Try: \"Is my address within an AMA?\"",
      "Try: \"How will the Colorado River shortage impact me?\"",
    ],
  };
}
