Create a high-fidelity, fully clickable prototype for an agentic AI assistant integrated into the Arizona Water Blueprint experience by the Kyl Center for Water Policy. The prototype should feel like a polished executive demo, not a rough concept. Build two main views: (1) a public webpage view and (2) an ArcGIS-style interactive map view. The prototype should use realistic synthetic data inspired by Arizona Water Blueprint public water datasets, but clearly label all demo data as synthetic and “not a legal or official water determination.”

I will provide the official Blue mascot Figma file. Use that mascot throughout the prototype. Until the mascot file is added, use a polished placeholder water-droplet character labeled “Blue mascot asset placeholder.” Blue should look friendly, smart, and helpful, but clearly presented as an AI assistant, not a human or official regulator.

PROJECT CONTEXT
The Arizona Water Blueprint is a public-facing water information platform that helps users understand Arizona water resources, groundwater, active management areas, water providers, infrastructure, drought, rivers and streams, water quality, flood hazards, and related policy topics. The new prototype should show how an agentic AI assistant can make these maps easier to search, understand, and act on.

PRIMARY PRODUCT IDEA
Create an AI assistant called “Blue” that works in two ways:

1. Smart Search Bar Agent
Blue is embedded directly inside the site search and map search experience. Users can type natural language questions into the search bar, similar to ChatGPT. The system should understand whether the user is asking for an address lookup, map layer, policy explanation, water provider, AMA status, groundwater condition, water quality layer, infrastructure question, or help using the map.

2. Embedded Chatbot Agent
Blue also appears as a floating mascot button on the webpage and the map. When clicked, it opens a small chatbot pop-up. Users can ask questions about the website, the map, Arizona water topics, how to use the layers, or what a specific map result means. The chatbot should answer in plain language, show source-style cards, and include buttons that control the map.

DESIGN SYSTEM AND VISUAL STYLE
Do not use an ASU-branded visual system. The prototype should feel connected to Arizona water, public trust, and environmental intelligence, but it should not look like an ASU website. Avoid maroon and gold as primary brand colors.

Use a custom “Blue Water Intelligence” design system built around the Blue mascot and the mood of water, clarity, trust, and desert resilience.

Color palette:
- Primary Blue: deep clean water blue, used for major buttons, active states, selected layers, and Blue’s interface.
- Cyan Glow: soft electric cyan, used for AI highlights, map search focus states, animated layer glows, and agent activity.
- Mist Blue: pale blue background sections, used for calm panels and chatbot surfaces.
- Desert Sand: warm neutral beige, used subtly for page backgrounds and context cards.
- River Teal: used for rivers, water systems, and positive confirmation states.
- Slate Navy: used for headers, map controls, and serious policy text.
- Cloud White: used for cards, modals, and content surfaces.
- Soft Gray: used for dividers, secondary labels, and inactive map layers.
- Alert Amber: used sparingly for caution, uncertainty, or “verify with official source” notices.
- Risk Coral: used only for high-risk water, drought, or warning indicators.

Overall mood:
The interface should feel calm, intelligent, trustworthy, and slightly futuristic. It should feel like a public water intelligence tool, not a university landing page. The mood should combine:
- Clean water
- Arizona desert landscapes
- Civic trust
- AI guidance
- Environmental clarity
- Map-based exploration

Visual treatment:
- Use soft blue gradients, subtle glassmorphism, translucent cards, and clean white space.
- Use water-like motion patterns: gentle ripples, soft pulses, flowing transitions, and animated blue highlights.
- Blue mascot interactions should feel alive but professional. Blue can pulse, blink, wave, or glow gently when assisting the user.
- Search bars should feel like intelligent AI input fields, with a cyan focus glow and Blue mascot icon embedded inside.
- Chatbot surfaces should use mist-blue and white cards with deep-blue headers.
- Map selected areas should glow in cyan or river teal.
- Policy explanation cards should be calm and readable, using slate navy text on white or mist-blue backgrounds.
- Warnings and disclaimers should use soft amber, not harsh red, unless showing a major risk state.

Avoid:
- ASU maroon or gold branding as a dominant theme
- Heavy academic styling
- Dense government-dashboard visuals
- Flat generic SaaS styling
- Overly playful cartoon UI
- Dark cyberpunk AI visuals
- Cluttered ArcGIS default panels

Design inspiration:
The product should feel like a premium civic-tech water intelligence platform. It should have the clarity of a modern public-data dashboard, the friendliness of a chatbot assistant, and the polish of a high-end environmental analytics product.

GLOBAL NAVIGATION
Top navigation in webpage view:
- Arizona Water Blueprint logo area
- Navigation: Explore Topics, Main Map, Resources, About the Data, Ask Blue
- Right side: “Open Map” button and “Sign up for updates” link

VIEW 1: WEBPAGE VIEW
Build a homepage-style webpage inspired by the Arizona Water Blueprint.

Hero section:
- Large headline: “Explore Arizona’s water with an AI-guided map assistant”
- Subheadline: “Blue helps residents, planners, researchers, and decision-makers search water data, understand map layers, and see what matters near a place.”
- Large smart search bar in the hero:
  Placeholder: “Ask about an address, water provider, AMA, groundwater, drought, or map layer…”
- Blue mascot should sit near the search bar with a small speech bubble: “Try asking: Am I in an Active Management Area?”

Below the search bar, include clickable example chips:
- “Is 1151 S Forest Ave, Tempe in an AMA?”
- “Show groundwater conditions near Buckeye”
- “Which water provider serves downtown Tucson?”
- “Turn on CAP Canal and groundwater basin layers”
- “Explain what an Active Management Area means”
- “Find water quality layers near the Salt River”

When a user clicks or types a supported query, the page should show an AI result card directly below the search bar.

Example smart search behavior:
Query: “Is 1151 S Forest Ave, Tempe in an AMA?”

Result card:
- Title: “Yes. This demo location is inside the Phoenix Active Management Area.”
- Summary: “Blue found the address, checked the AMA boundary layer, and matched the location to the Phoenix AMA. This means groundwater use in this area is managed under Arizona’s groundwater management framework.”
- Location badge: “Tempe, Maricopa County”
- Data badges: “Active Management Areas,” “Groundwater Basins,” “Community Water Systems”
- Buttons:
  - “Open this result in Map”
  - “Show related layers”
  - “Explain AMA rules”
  - “Save summary”
- Small note: “Synthetic prototype result. Not a legal determination.”

Add a “What Blue can do” section with four cards:

1. “Find places”
Text: “Search an address, city, water provider, basin, AMA, or map feature.”

2. “Control the map”
Text: “Blue can turn layers on, zoom to locations, highlight boundaries, and open legends.”

3. “Explain policy”
Text: “Get plain-language explanations of AMAs, INAs, assured water supply, CAP, groundwater recharge, and drought.”

4. “Create traceable answers”
Text: “Every answer shows the data layers used, confidence level, and source-style references.”

Add a “Popular water questions” section:
- “Am I in an Active Management Area?”
- “What is my likely water provider?”
- “What does groundwater decline mean near me?”
- “Which layers should I turn on to understand water supply?”
- “How do I compare two places?”
- “What is the difference between AMAs and INAs?”

Add resource/topic cards:
- Active Management Areas
- Groundwater
- Colorado River Drought and Shortage
- Municipal Water
- Rural Water
- Rights, Policies, and Regulations
- Water Quality
- Infrastructure

Each card should have an “Ask Blue about this” button. Clicking it opens the chat widget with a pre-filled question.

FLOATING CHATBOT WIDGET ON WEBPAGE
Bottom-right floating Blue mascot button:
- Circular button with Blue mascot
- Tooltip: “Ask Blue”
- Small notification bubble: “I can guide the map.”

When clicked, open a chatbot pop-up:
Size: about 420px wide by 620px tall.

Header:
- Blue mascot icon
- Title: “Ask Blue”
- Subtitle: “AI guide for Arizona Water Blueprint”
- Status pill: “Demo mode”
- Minimize and expand buttons

Chat welcome message:
“Hi, I’m Blue. I can help you search Arizona water maps, explain layers, and open map views. Ask about an address, water provider, groundwater basin, AMA, CAP canal, drought, or water quality.”

Quick action buttons:
- “Check an address”
- “Explain AMAs”
- “Show useful layers”
- “Open map assistant”
- “Compare two places”

Chat answer layout:
- Plain-language answer
- “Map actions” card
- “Layers used” chips
- “Confidence” indicator
- “Open in Map” button
- “View source-style notes” expandable section
- Clear disclaimer: “Blue explains public map data. It does not provide legal, engineering, or regulatory determinations.”

VIEW 2: ARCGIS MAP VIEW
Create a full-screen ArcGIS-style map interface. It should feel like the Arizona Water Blueprint main map, but redesigned with an AI layer.

Layout:
Top bar:
- Left: Arizona Water Blueprint logo
- Center: large AI-powered map search bar
- Right: buttons for Layers, Legend, Share, Help, Ask Blue

Search bar placeholder:
“Ask Blue to search, explain, or control the map…”

Place Blue mascot as a small icon inside the search bar on the left. When the user types, show autocomplete suggestions and agentic actions.

Left sidebar:
Title: “Map Layers”

Use collapsible groups:
1. Suggested by Blue
2. Active Management Areas and INAs
3. Groundwater
4. Water Providers
5. Infrastructure
6. Rivers and Streams
7. Drought and Climate
8. Water Quality
9. Flood Hazards
10. Habitat and Land Context

Each layer should have:
- Toggle switch
- Info icon
- Opacity slider
- “Ask Blue” mini icon

Default active layers:
- Arizona counties
- Active Management Areas
- Groundwater basins
- Community water system service areas
- CAP canal
- Rivers and streams

Map canvas:
Use a stylized Arizona map. Include county outlines, colored AMA polygons, blue river lines, CAP canal line, groundwater basin boundaries, and clickable pins. It does not need real GIS geometry, but it should look convincingly like an interactive GIS map.

Map controls:
- Zoom in
- Zoom out
- Home
- Locate me
- Measure
- Reset layers
- Basemap switcher
- Screenshot/export

Right drawer:
Title changes based on action. Default: “Blue Map Assistant”

Sections:
- Current answer
- Agent action trail
- Layers used
- Map actions
- Related questions
- Save/export summary

Bottom status bar:
- Current zoom: “Arizona statewide”
- Active layers count
- Last updated: “Synthetic demo data”
- Data note: “Prototype only”

AGENTIC AI MODEL BEHAVIOR
Build a visible “Agent action trail” that appears in the right drawer after each query. Do not expose hidden chain of thought. Show only short user-facing steps such as:
1. “Understood the request”
2. “Found the location”
3. “Checked AMA boundary layer”
4. “Checked water provider layer”
5. “Turned on related layers”
6. “Prepared plain-language summary”

Create the agent as a multi-step system in the UI:
- Query Interpreter Agent: understands user intent.
- Geospatial Lookup Agent: handles address, place, boundary, and layer matching.
- Layer Action Agent: turns map layers on or off, zooms, highlights, and opens legends.
- Water Policy Explainer Agent: explains AMAs, INAs, groundwater, CAP, drought, and water quality in plain language.
- Evidence Agent: shows which synthetic data layers were used.
- Safety and Scope Agent: adds disclaimer when the answer could be legal, regulatory, health, or engineering related.

SUPPORTED QUERY TYPES
Make the prototype support at least these hardcoded queries and variations:

1. “Is 1151 S Forest Ave, Tempe in an AMA?”
Action:
- Zoom to Tempe.
- Drop animated pin.
- Turn on Active Management Areas, Groundwater Basins, and Community Water Systems.
- Highlight Phoenix AMA.
- Open right drawer.

Answer:
“Yes. This demo address is inside the Phoenix Active Management Area. Blue matched the address to the AMA boundary layer and the East Salt River Valley groundwater context. This means groundwater use is managed under Arizona’s groundwater management framework. This is a prototype result and not a legal determination.”

2. “Show groundwater conditions near Buckeye”
Action:
- Zoom to Buckeye.
- Turn on Groundwater Basins, Groundwater Level Change, Land Subsidence, and Buckeye Waterlogged Area.
- Highlight synthetic groundwater concern cards.

Answer:
“Blue found Buckeye in the Phoenix AMA region and turned on groundwater-related layers. The demo view shows groundwater basin context, nearby subsidence areas, and a waterlogged-area layer. Use this as a starting point for exploration, not as an official assessment.”

3. “Which water provider serves downtown Tucson?”
Action:
- Zoom to Tucson.
- Turn on Community Water System Service Areas and AMA boundary.
- Highlight Tucson Water synthetic service polygon.

Answer:
“This demo location is matched to Tucson Water as the likely community water provider and is inside the Tucson Active Management Area. Blue recommends viewing the water provider, AMA, and CAP infrastructure layers for more context.”

4. “Turn on CAP Canal and groundwater basins”
Action:
- Activate CAP Canal and Groundwater Basins layers.
- Highlight canal in bright blue.
- Show legend.

Answer:
“I turned on the CAP Canal and Groundwater Basins layers. These help show how major imported water infrastructure relates to Arizona’s groundwater management geography.”

5. “Explain what an Active Management Area means”
Action:
- Open explainer card.
- Turn on AMA layer.
- Show all eight current AMAs in a side list.

Answer:
“An Active Management Area, or AMA, is a groundwater basin where groundwater use is managed under Arizona law. In this demo, the AMA layer includes Prescott, Phoenix, Pinal, Tucson, Santa Cruz, Douglas, Willcox, and Ranegras Plain. AMAs are important because they guide groundwater conservation, reporting, and management goals.”

6. “Compare Tempe and Prescott”
Action:
- Split right drawer into comparison mode.
- Place two pins.
- Show comparison table.

Answer:
“Blue compared the two demo locations. Tempe is shown inside the Phoenix AMA, while Prescott is shown inside the Prescott AMA. Both are managed groundwater areas, but their local management goals and water contexts differ.”

7. “What layers should I use to understand water risk near a home?”
Action:
- Turn on recommended bundle.

Recommended layers:
- Active Management Areas
- Community Water Systems
- Groundwater Basins
- Groundwater Level Change
- Drought Monitor
- Flood Hazard Zones
- Water Quality layers

Answer:
“For a first-pass homebuyer view, Blue recommends starting with water provider, AMA, groundwater basin, drought, water quality, and flood hazard layers. This does not replace due diligence or official records, but it helps users know what to investigate.”

8. “Find water quality layers near the Salt River”
Action:
- Zoom to Salt River.
- Turn on Rivers and Streams, Impaired Streams, Fish Consumption Advisory, Lakes, and Outstanding Arizona Waters.

Answer:
“Blue turned on water quality and river layers around the Salt River. The demo highlights stream segments, advisory points, and related water quality context.”

9. “How do I use this map?”
Action:
- Open guided tour overlay.

Steps:
1. Search a place.
2. Choose a topic.
3. Turn on suggested layers.
4. Read the legend.
5. Click map features.
6. Ask Blue to explain results.

Answer:
“Start with a place or question. Blue can search, turn on layers, and explain what you are seeing.”

10. “Create a summary for this location”
Action:
- Generate export card.
- Include location, layers used, key findings, disclaimer, and timestamp.
- Buttons: Copy, Download PDF, Email summary.

Answer:
“Blue created a short synthetic summary for this map view.”

SYNTHETIC DATA TO INCLUDE
Create a hardcoded dataset inside the prototype. Use it to power all demo interactions.

Locations:

1. Tempe demo address
- Address: 1151 S Forest Ave, Tempe, AZ
- County: Maricopa
- AMA: Phoenix AMA
- Groundwater basin: East Salt River Valley
- Likely provider: City of Tempe
- Suggested layers: Active Management Areas, Community Water Systems, Groundwater Basins, CAP Canal

2. Buckeye demo address
- Address: 530 E Monroe Ave, Buckeye, AZ
- County: Maricopa
- AMA: Phoenix AMA
- Groundwater basin: West Salt River Valley
- Likely provider: City of Buckeye
- Suggested layers: Groundwater Basins, Groundwater Level Change, Buckeye Waterlogged Area, Land Subsidence

3. Tucson demo address
- Address: 255 W Alameda St, Tucson, AZ
- County: Pima
- AMA: Tucson AMA
- Groundwater basin: Tucson Basin
- Likely provider: Tucson Water
- Suggested layers: Community Water Systems, Tucson AMA, CAP Canal, Groundwater Recharge

4. Prescott demo address
- Address: 120 S Cortez St, Prescott, AZ
- County: Yavapai
- AMA: Prescott AMA
- Groundwater basin: Prescott AMA basin
- Likely provider: City of Prescott
- Suggested layers: AMA, Groundwater Basins, Drought Monitor

5. Casa Grande demo address
- Address: 510 E Florence Blvd, Casa Grande, AZ
- County: Pinal
- AMA: Pinal AMA
- Groundwater basin: Pinal AMA basin
- Likely provider: Arizona Water Company
- Suggested layers: Pinal AMA, Agriculture, Groundwater Basins, CAP Canal

6. Willcox demo address
- Address: 101 S Railroad Ave, Willcox, AZ
- County: Cochise
- AMA: Willcox AMA
- Groundwater basin: Willcox Basin
- Suggested layers: Willcox AMA, Groundwater Level Change, Land Subsidence

7. Douglas demo address
- Address: 425 E 10th St, Douglas, AZ
- County: Cochise
- AMA: Douglas AMA
- Groundwater basin: Douglas Basin
- Suggested layers: Douglas AMA, Groundwater Basins, Agriculture

8. Ranegras Plain demo point
- Address: Ranegras Plain demo point, La Paz County, AZ
- County: La Paz
- AMA: Ranegras Plain AMA
- Groundwater basin: Ranegras Plain Basin
- Suggested layers: Ranegras Plain AMA, Groundwater Level Change, Land Subsidence

Layer categories:
- Active Management Areas
- Irrigation Non-Expansion Areas
- Groundwater Basins
- Groundwater Sub-basins
- Community Water System Service Areas
- Assured and Adequate Water Supply
- CAP Canal
- SRP Canals
- Groundwater Savings Facilities
- Underground Storage Facilities
- Drought Monitor
- Rivers and Streams
- Lakes
- Impaired Streams
- Impaired Lakes
- Fish Consumption Advisory
- Flood Hazard Zones
- Land Subsidence
- Critical Habitat
- Tribal Water Settlements
- Superfund Sites
- Counties
- Municipal Boundaries

Each layer should have:
- Short description
- Color
- Icon
- Source-style label such as “ADWR,” “ADEQ,” “SRP,” “CAP,” “FEMA,” “USGS,” “USFWS,” or “Kyl Center synthetic demo.”

INTERACTION REQUIREMENTS
Every visible button must work. Do not leave dead buttons.

Required clickable interactions:
- Webpage search chips populate the search bar and generate result cards.
- “Open this result in Map” switches to the ArcGIS map view and applies the correct map state.
- “Show related layers” turns on matching layers.
- “Explain AMA rules” opens an explainer card.
- Floating Blue mascot opens and closes chatbot.
- Chat quick actions send prewritten messages.
- “Open in Map” inside chat switches to the map view.
- Map layer toggles turn layers on and off visually.
- Map feature clicks open popups.
- Legend button opens a legend panel.
- Help button opens guided tour.
- Share button opens a mock share modal.
- Export summary button opens a mock export modal.
- Compare mode creates a side-by-side comparison table.
- Reset layers restores default map state.

MAP POPUP DESIGN
When a user clicks a map feature, show a popup card:
- Feature name
- Layer
- Short description
- Data source-style label
- Last updated or “synthetic demo”
- Button: “Ask Blue about this”
- Button: “Add to summary”

Example popup:
Title: “Phoenix Active Management Area”
Layer: Active Management Areas
Description: “A groundwater management area covering much of the Phoenix region.”
Source-style label: “ADWR, synthetic demo representation”
Buttons: “Ask Blue” and “Add to summary”

RIGHT DRAWER ANSWER CARD DESIGN
Use this structure:
- Question asked
- Direct answer in one or two sentences
- “What Blue did” action trail
- “Map layers used”
- “Why this matters”
- “Suggested next steps”
- Disclaimer
- Buttons: Copy answer, Save summary, Export, Ask follow-up

For “Why this matters,” keep it plain:
“This helps users connect a place to water management geography without manually searching through many layers.”

CHATBOT PERSONALITY
Blue should speak in a clear, warm, plain-language tone:
- Helpful
- Concise
- Transparent
- Civic-minded
- Not overly cute
- Does not claim to be a regulator or human expert
- Always says when a result is synthetic demo data

Example Blue messages:
“Good question. I’ll check the location against the map layers.”
“I found the place and turned on the layers that matter.”
“This is a public-data explanation, not a legal determination.”
“I can show this on the map if you want.”
“Here are the layers I used.”

EXECUTIVE DEMO MODE
Add a small “Executive Demo” button in the top-right corner. When clicked, open a guided scenario panel.

Title:
“Executive Demo Flow”

Steps:
1. “Start with a resident question”
2. “Blue identifies the intent”
3. “Blue searches the location”
4. “Blue turns on relevant map layers”
5. “Blue explains the result in plain language”
6. “Blue creates a shareable summary”

Include a short value proposition card:
“Blue reduces the gap between complex GIS layers and public understanding. It helps users move from a question to a map-based answer with traceable data layers and clear next steps.”

SAFETY, TRUST, AND TRANSPARENCY FEATURES
Include a trust panel in both views:
- “Uses public map data”
- “Shows layers used”
- “Labels confidence”
- “Explains uncertainty”
- “Does not replace official records”
- “No personal data stored in this prototype”

Add confidence indicators:
- High: address and boundary matched
- Medium: likely provider match
- Low: broad regional explanation only

When confidence is medium or low, Blue should say:
“I can give a starting point, but you should verify with the official agency or provider.”

ACCESSIBILITY
Make the prototype accessible:
- Clear contrast
- Keyboard-friendly controls
- Large click targets
- ARIA-style labels where relevant
- Plain-language labels
- No tiny text
- Include a “Plain language mode” toggle
- Include a “High contrast map” toggle

RESPONSIVE DESIGN
Desktop is the priority, but make the layout responsive.

On smaller screens:
- Map drawer becomes a bottom sheet.
- Chatbot becomes full-screen.
- Layer panel becomes a slide-in menu.
- Search remains sticky at the top.

TECHNICAL BUILD REQUIREMENTS FOR FIGMA MAKE
Build this as a working frontend prototype with hardcoded synthetic data. Do not require real APIs, logins, external map services, or backend calls. Simulate the ArcGIS map using styled components, SVG shapes, cards, pins, colored polygons, and state changes.

Use componentized structure:
- App
- WebpageView
- MapView
- SmartSearchBar
- BlueChatWidget
- LayerPanel
- MapCanvas
- RightDrawer
- ResultCard
- AgentActionTrail
- TrustPanel
- ExportModal
- GuidedTourModal
- ExecutiveDemoPanel

State should track:
- currentView
- currentQuery
- selectedLocation
- activeLayers
- chatOpen
- chatMessages
- rightDrawerContent
- selectedFeature
- demoMode
- comparisonMode
- exportModalOpen
- guidedTourOpen

FINAL EXPECTATION
The finished prototype should let an executive committee experience the product idea end-to-end:

A user asks a natural-language water question, Blue understands it, searches synthetic map data, turns on the right layers, highlights the map, explains the answer, shows the data trail, and offers next steps.

The prototype should feel advanced, beautiful, trustworthy, and credible enough to communicate how an agentic AI assistant could transform the Arizona Water Blueprint from a data-rich map into a guided public water intelligence interface.