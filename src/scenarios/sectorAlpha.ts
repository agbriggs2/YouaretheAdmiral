import type { Scenario } from "../engine/scenarioTypes";

/**
 * Sector Alpha — adapted from "You're the Admiral!" (Star Trek Minutiae /
 * Flare SciFi Forums). Low complexity: every event happens in a fixed order;
 * outcomes change standings and how characters react, not the script.
 * Forum-only parts (critiquing other answers, writing scenarios for others)
 * are omitted.
 */
export const sectorAlpha: Scenario = {
  id: "sector-alpha",
  title: "Sector Alpha",
  version: "0.1",
  complexity: "low",
  source: {
    name: "You're the Admiral! — Sector Alpha (Star Trek Minutiae)",
    url: "https://www.st-minutiae.com/articles/admiral/sector_alpha.html",
    author: "Mark Nguyen",
  },
  era: "TNG",
  year: 2372,
  playerRole: {
    rank: "Rear Admiral",
    title: "Commander, Sector Alpha",
    briefing:
      "Starfleet has given you command of Sector Alpha, a frontier sector where the Federation has only just been invited in. Three inhabited worlds have agreed to a Starfleet presence, one of them wants to join the Federation, and on the far side of the border sits a power nobody has heard from in decades. You will build the sector's starbase, assemble its fleet, and answer for what happens next.",
  },
  setting: {
    overview:
      "A frontier sector bordering an isolated alien power. A vast, mostly harmless nebula dominates the map. Three inhabited systems share a rudimentary trade network; a fourth world, Class-L, lies unexplored across the border.",
    assumptions: [
      "The Really Big Nebula is enormous and largely harmless, but it is an excellent place to hide.",
      "Across the border lies an alien power that has kept to itself for several decades. Its military strength is unknown.",
      "Tekanan III is still recovering from an alien invasion that devastated a population once numbering in the billions. The invaders withdrew before the Federation reached the region.",
      "Tekanan III is the only world in the sector that has petitioned to join the Federation.",
      "The three inhabited worlds trade with one another on a small scale, and all three have agreed to a Federation presence to help that trade grow.",
      "None of the three worlds has explored the Class-L planet.",
    ],
  },
  factions: [
    {
      id: "tekanan",
      name: "Tekanan III",
      status: "applicant",
      population: "340 million",
      government: "Democracy",
      technology: "23rd-century equivalent",
      military: [{ count: 30, description: "sublight fighters (roughly runabout-class)" }],
      resources: "Abundant raw materials and a large industrial base. No orbital defenses or shields.",
      traits: [
        "Scarred by the invasion; anxious about anything that resembles the invaders.",
        "Eager to join the Federation and to be seen as a reliable partner.",
      ],
      startingStanding: 2,
    },
    {
      id: "lysara",
      name: "Lysara",
      status: "aligned",
      population: "5.2 billion",
      government: "Monarchy (several nations under a single crown)",
      technology: "24th-century equivalent",
      military: [
        { count: 3, description: "Miranda-class equivalent warships", equivalentTo: "miranda" },
        { description: "a large commercial fleet" },
      ],
      resources: "Few natural resources; the economy depends on commerce. Minimal orbital defenses.",
      traits: [
        "Wealthy, commercial and politically fractious beneath the monarchy.",
        "Lies in a binary star system.",
      ],
      startingStanding: 1,
    },
    {
      id: "kestu",
      name: "Kestu IX",
      status: "neutral",
      population: "780 million",
      government: "Totalitarian",
      technology: "23rd-century equivalent",
      military: [
        { count: 10, description: "Nebula-class equivalent warships", equivalentTo: "nebula" },
        { count: 20, description: "warp-capable fighters (shuttle-class)" },
        { description: "heavy orbital defenses" },
      ],
      resources: "Poor in natural resources. Strained relations with both neighbours.",
      traits: [
        "Has never sent more than three warships out at once.",
        "Suspicious of the Federation and quick to read its moves as hostile.",
      ],
      startingStanding: 0,
    },
    {
      id: "saalit",
      name: "The border power",
      status: "unknown",
      traits: ["No contact for decades. Nothing is known about its fleet."],
      startingStanding: 0,
    },
  ],
  locations: [
    { id: "nebula", name: "The Really Big Nebula", kind: "nebula", description: "Vast, mostly harmless, ideal for hiding.", starbaseOptions: ["open-space"] },
    { id: "tekanan-iii", name: "Tekanan III", kind: "planet", factionId: "tekanan", starbaseOptions: ["planet-orbit", "star-orbit"] },
    { id: "lysara", name: "Lysara (binary system)", kind: "planet", factionId: "lysara", starbaseOptions: ["planet-orbit", "star-orbit"] },
    { id: "kestu-ix", name: "Kestu IX", kind: "planet", factionId: "kestu", starbaseOptions: ["planet-orbit", "star-orbit"] },
    { id: "class-l", name: "The Class-L world", kind: "planet", description: "Unexplored, across the border." },
    { id: "border", name: "The border", kind: "border", description: "Frontier with the isolated alien power.", starbaseOptions: ["open-space"] },
    { id: "open-space", name: "Open space between the systems", kind: "open-space", starbaseOptions: ["open-space"] },
  ],
  resources: {
    fleet: {
      maxShips: 10,
      tagLimits: [{ tag: "capital", max: 1, label: "No more than one Galaxy, Sovereign or Ambassador class ship" }],
      roleMinimums: [{ combatRole: "none", min: 2, label: "At least two non-combat ships (science, transport, etc.)" }],
      justificationRequired: ["capital", "non-combat"],
      assignments: ["Patrol", "Escort", "Border watch", "Science and survey", "Diplomacy", "Transport and logistics", "Starbase defense", "Reserve"],
      categories: [
        { id: "capital", label: "Capital ship", description: "Galaxy, Sovereign or Ambassador class. At most one, and hard to get: if Starfleet can't spare one, it sends a cruiser.", capital: true, fallbackCategory: "cruiser", fallbackStatusFactor: { Frontline: 3 } },
        { id: "cruiser", label: "Cruiser", description: "Large multi-role ships: light explorers, cruisers, heavy cruisers." },
        { id: "light-cruiser", label: "Light cruiser", description: "Medium-sized ships between cruisers and frigates." },
        { id: "frigate", label: "Frigate", description: "Smaller combat ships for patrol and escort." },
        { id: "scout", label: "Scout", description: "Long-range reconnaissance and survey." },
        { id: "science", label: "Science vessel", description: "Dedicated research and survey ships.", nonCombat: true },
        { id: "transport", label: "Transport", description: "Personnel, cargo and evacuation.", nonCombat: true },
      ],
      allocation: {
        statusFactor: { Frontline: 0.6, "Second-line": 1, Obsolescent: 1.25, Reserve: 1 },
        roleFactor: { primary: 0.8, secondary: 1, none: 1.1 },
        gradeTierShift: { commended: 1, approved: 0, "approved-with-concerns": -1 },
        note: "Sector Alpha is a quiet frontier. Starfleet is reluctant to spare frontline ships or dedicated warships here, and a well-argued plan improves your odds.",
      },
      posture: {
        maxPrimaryCombat: 4,
        flag: "fleet-posture",
        effects: [
          { type: "adjust-standing", factionId: "tekanan", delta: -1 },
          { type: "adjust-standing", factionId: "kestu", delta: -1 },
        ],
        gmNote: "The assigned fleet carries more front-line warships than the locals expected. Tekanan, still scarred by invasion, is unsettled by so many warships; Kestu reads it as a threat. Command should note this concern.",
        hint: "The worlds here remember invasion. A fleet heavy with warships may look like an occupation force.",
      },
    },
    starbase: {
      description: "A space-based starbase that can defend itself against most threats and is highly visible to every power in the sector.",
      model: "Starbase 375",
    },
  },
  stages: [
    // ── Question One ─────────────────────────────────────
    {
      id: "q1",
      title: "Question One: Taking Command",
      briefing:
        "Before your fleet is assigned, Starfleet Command wants your plan for the sector: what matters most, where the starbase goes, and which ships you need.",
      prompts: [
        {
          id: "q1-priorities",
          kind: "free-text",
          text: "Set out Starfleet's priorities in Sector Alpha.",
          guidance: "Consider the unknown power across the border, the political situation on each world, and what you don't know yet and how you'll find out.",
        },
        {
          id: "q1-starbase",
          kind: "starbase-placement",
          text: "Where will you build the starbase, and why?",
        },
        {
          id: "q1-fleet",
          kind: "fleet-request",
          text: "Tell Starfleet what your fleet needs to do and what kinds of ships you want, up to ten. Starfleet assigns ships based on what's available: rare classes are hard to get, and you may receive a substitute.",
        },
      ],
      review: {
        from: "Starfleet Command",
        defaultOutcomeId: "approved",
        gmNotes:
          "Starfleet approves the plan in every outcome; the outcome only changes the tone of the reply and any concerns raised. The ships actually assigned have already been decided by availability and are listed for you: announce them exactly, and explain any substitution in a sentence (e.g. no ships of that class could be spared). Do not change, add or remove ships. Do not mention that two ships will later be reassigned.",
        outcomes: [
          {
            id: "commended",
            label: "Commended",
            criteria: "Priorities address the border power, the three governments and intelligence gaps; starbase location is well argued; ship requests fit their stated purposes and the fleet is not so heavy with warships that it would alarm worlds that remember invasion.",
            effects: [{ type: "set-flag", flag: "q1-assessment", value: "commended" }],
            reactions: "Command approves warmly, singling out one or two specific strengths.",
          },
          {
            id: "approved",
            label: "Approved",
            criteria: "A workable plan with some gaps or thin reasoning.",
            effects: [{ type: "set-flag", flag: "q1-assessment", value: "approved" }],
            reactions: "Command approves and raises one or two pointed questions about the weakest parts.",
          },
          {
            id: "approved-with-concerns",
            label: "Approved with concerns",
            criteria: "Priorities ignore a major factor, the starbase choice is poorly reasoned, or the ship requests don't match their purposes, or the request is so warship-heavy it would look like an occupation force.",
            effects: [{ type: "set-flag", flag: "q1-assessment", value: "concerns" }],
            reactions: "Command approves reluctantly and states its concerns plainly, as a senior admiral would.",
          },
        ],
      },
    },

    // ── Question Two ─────────────────────────────────────
    {
      id: "q2",
      title: "Question Two: First Tests",
      briefing:
        "Starfleet approved your fleet, but at the last minute your two largest or best-equipped ships were reassigned elsewhere, and no replacements will be available for the foreseeable future. Your fleet is now fixed.",
      onEnter: [{ type: "remove-ships", selector: "strongest", count: 2, reason: "Reassigned by Starfleet Command at the last minute" }],
      prompts: [
        {
          id: "q2-redeploy",
          kind: "free-text",
          text: "How do you redeploy the ships you have left, and does this change your diplomatic approach?",
        },
      ],
      review: {
        from: "Your chief of staff",
        defaultOutcomeId: "sound",
        outcomes: [
          { id: "sound", label: "Sound redeployment", criteria: "Gaps left by the lost ships are covered or consciously accepted.", reactions: "The staff gets to work; captains acknowledge new orders." },
          { id: "gaps", label: "Gaps remain", criteria: "Important duties are left uncovered without acknowledgement.", reactions: "The chief of staff tactfully points out what is now uncovered." },
        ],
      },
      secrets: [
        {
          id: "probe-truth",
          truth: "The object in the nebula is an automated distress buoy, not a warship or weapon. It was launched by the last government of the Saalit, a resource-hungry empire that occupied Tekanan III until a biological plague struck them. They withdrew, collapsed into anarchy, and a final democratic government sent out distress buoys before the Saalit died out.",
          coverStory: "An unidentified probe with the warp signature of the ships that attacked Tekanan III, and possible weapons signatures.",
        },
      ],
      events: [
        {
          id: "q2-piracy",
          title: "Piracy surge",
          from: "Lysaran Ministry of Commerce",
          text: "Attacks on shipping have risen sharply. The raiders fly small Maquis-style ships in larger numbers than before. Lysara wants the threat ended but lacks the means to do it alone.",
          prompts: [{ id: "q2-piracy-orders", kind: "free-text", text: "Which ship responds, what do you do, and what diplomatic steps do you take?" }],
          defaultOutcomeId: "effective",
          outcomes: [
            { id: "joint", label: "Joint operation", criteria: "Works with Lysara (and possibly others) on patrols, intelligence or convoys.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: 1 }], reactions: "Lysara is grateful and visibly reassured." },
            { id: "effective", label: "Effective Starfleet response", criteria: "Starfleet handles it competently but largely alone.", reactions: "Attacks fall off; Lysara is satisfied but notes it was not consulted." },
            { id: "neglected", label: "Neglected", criteria: "Too little force or attention; the threat persists.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "Raids continue and Lysaran merchants complain loudly." },
          ],
        },
        {
          id: "q2-kestu",
          title: "Kestu mobilization",
          from: "Starfleet Intelligence",
          text: "Half the Kestu fleet — five warships and their support vessels — has massed at the northern border with no explanation. Kestu has never sent more than three warships out at once. Tekanan III has closed its trade route to Kestu, and Lysara is sending two warships to the border to investigate.",
          prompts: [{ id: "q2-kestu-orders", kind: "free-text", text: "Which ship responds, what do you do, and what diplomatic steps do you take?" }],
          defaultOutcomeId: "measured",
          gmNotes: "The scenario never says why Kestu mobilized. Don't invent a reason; let Kestu stay evasive.",
          outcomes: [
            { id: "measured", label: "Measured", criteria: "Monitors, opens channels with Kestu, and restrains Lysara and Tekanan from escalating.", reactions: "Tension eases a little; Kestu remains guarded but not provoked." },
            { id: "show-of-force", label: "Show of force", criteria: "Confronts or shadows the Kestu fleet aggressively.", effects: [{ type: "adjust-standing", factionId: "kestu", delta: -1 }, { type: "adjust-standing", factionId: "tekanan", delta: 1 }], reactions: "Tekanan approves; Kestu protests Federation intimidation." },
            { id: "passive", label: "Passive", criteria: "Does little; leaves Lysara's warships to handle it.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }, { type: "adjust-standing", factionId: "tekanan", delta: -1 }], reactions: "Lysara and Tekanan wonder aloud what Starfleet is for." },
          ],
        },
        {
          id: "q2-probe",
          title: "Probe in the nebula",
          from: "Tekanan Defense Ministry",
          text: "An object has entered the Really Big Nebula. Its warp signature matches the alien ships that attacked Tekanan III, and sensors show what may be weapons signatures. All three worlds have confirmed the readings and stepped up patrols. Tekanan III demands a Starfleet response.",
          prompts: [{ id: "q2-probe-orders", kind: "free-text", text: "Which ship responds, what do you do, and what diplomatic steps do you take?" }],
          defaultOutcomeId: "cautious",
          gmNotes: "Do not reveal the probe-truth secret. Readings stay ambiguous. If the player destroys the object, its wreckage is still recovered for analysis later.",
          outcomes: [
            { id: "cautious", label: "Careful investigation", criteria: "Investigates with care, reassures Tekanan, avoids firing first.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: 1 }, { type: "set-flag", flag: "probe-handling", value: "investigated" }], reactions: "Tekanan is reassured that Starfleet takes the threat seriously." },
            { id: "destroyed", label: "Destroyed", criteria: "Destroys or disables the object on sight.", effects: [{ type: "set-flag", flag: "probe-handling", value: "destroyed" }], reactions: "Tekanan is relieved; Starfleet science staff grumble about lost data." },
            { id: "ignored", label: "Dismissed", criteria: "Treats it as a non-issue.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: -1 }, { type: "set-flag", flag: "probe-handling", value: "ignored" }], reactions: "Tekanan feels abandoned at the moment it most needed reassurance." },
          ],
        },
      ],
    },

    // ── Question Three ───────────────────────────────────
    {
      id: "q3",
      title: "Question Three: The Crown Falls",
      briefing: "Events on Lysara move fast.",
      events: [
        {
          id: "q3-lysara",
          title: "Assassination and intervention",
          from: "Federation Embassy, Lysara",
          text: "The Lysaran monarch has been assassinated with no clear heir, and unrest is spreading across the planet. A week later the Kestu fleet enters Lysaran orbit and beams troops down to one Lysaran nation that asked for help guarding its borders. Two more nations make the same request of Kestu; two others ask the Federation for help.",
          prompts: [
            { id: "q3-deploy", kind: "free-text", text: "How do you deploy the fleet when the assassination is reported, and how does that change once the Kestu fleet arrives?" },
            { id: "q3-report", kind: "free-text", text: "What do you report to Starfleet: your recommendations, what should be investigated first, and what help you need?" },
            { id: "q3-reversed", kind: "free-text", text: "How would your deployment differ if the Kestu fleet had arrived first and the assassination followed?" },
          ],
          defaultOutcomeId: "balanced",
          gmNotes: "The scenario does not say who killed the monarch. Do not name a culprit.",
          outcomes: [
            { id: "balanced", label: "Balanced", criteria: "Protects Federation interests and the requesting nations without fighting Kestu; pushes for investigation and diplomacy.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: 1 }], reactions: "The pro-Federation nations take heart; Kestu stays wary but avoids a clash." },
            { id: "confrontational", label: "Confrontational", criteria: "Moves to block or confront Kestu forces directly.", effects: [{ type: "adjust-standing", factionId: "kestu", delta: -2 }], reactions: "Kestu accuses the Federation of meddling; tensions spike." },
            { id: "hands-off", label: "Hands off", criteria: "Stays out beyond protecting Federation citizens.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "The nations that asked for help feel abandoned." },
          ],
        },
        {
          id: "q3-tekanan-fleet",
          title: "Tekanan builds a navy",
          from: "Tekanan Defense Ministry",
          text: "Tekanan III has begun building warp-capable warships — up to Excelsior-equivalent — with five ready within a year.",
          prompts: [{ id: "q3-tekanan-orders", kind: "free-text", text: "What should Tekanan do with its new fleet, and how will you redeploy to match, avoid or complement it?" }],
          defaultOutcomeId: "coordinated",
          outcomes: [
            { id: "coordinated", label: "Coordinated", criteria: "Integrates Tekanan's ships into a shared defensive or patrol role.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: 1 }], reactions: "Tekanan welcomes being treated as a partner." },
            { id: "restrained", label: "Restraining", criteria: "Discourages or limits the buildup.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: -1 }, { type: "adjust-standing", factionId: "kestu", delta: 1 }], reactions: "Tekanan is offended; Kestu notices with approval." },
          ],
        },
      ],
    },

    // ── Question Four ────────────────────────────────────
    {
      id: "q4",
      title: "Question Four: War and Aftermath",
      briefing: "The situation on Lysara turns into open war.",
      secrets: [
        {
          id: "antimatter-culprit",
          truth: "The scenario never establishes who planted the antimatter devices. The GM must not reveal or imply a culprit.",
        },
      ],
      events: [
        {
          id: "q4-war",
          title: "War on Lysara",
          from: "Starfleet Command",
          text: "The unaligned Lysaran nations have declared war on the Kestu-backed alliance. Ground fighting has spilled into space across the binary system, mostly between sublight ships. Starfleet orders you to aid only the nations that asked for help and to stay out of the fighting. You are sent one combat ship and two transports of your choosing.",
          prompts: [
            {
              id: "q4-reinforce",
              kind: "fleet-builder",
              mode: "add",
              text: "Choose the three ships and how you deploy them.",
              addRules: { ships: [{ count: 1, combatRole: "primary", label: "One combat ship" }, { count: 2, tag: "transport", label: "Two transports" }] },
            },
          ],
          defaultOutcomeId: "deployed",
          outcomes: [{ id: "deployed", label: "Deployed", criteria: "Any deployment.", reactions: "The ships arrive and report in." }],
        },
        {
          id: "q4-disaster",
          title: "Mutual destruction",
          from: "Starfleet Command",
          text: "The Lysaran and Kestu fleets have destroyed each other. In the crossfire, one of your patrol ships was lost along with the Tekanan transport it was escorting. Kestu accuses you of aiding the Lysarans.",
          onEnter: [{ type: "remove-ships", selector: { assignment: "Patrol" }, count: 1, reason: "Destroyed in the crossfire while escorting a Tekanan transport" }],
          prompts: [{ id: "q4-disaster-orders", kind: "free-text", text: "How do you respond?" }],
          defaultOutcomeId: "firm",
          outcomes: [
            { id: "firm", label: "Firm and transparent", criteria: "Rejects the accusation with evidence and openness, honours the dead, stays out of the war.", reactions: "Kestu's accusation loses traction with the other worlds." },
            { id: "retaliatory", label: "Retaliatory", criteria: "Strikes back or threatens Kestu.", effects: [{ type: "adjust-standing", factionId: "kestu", delta: -2 }], reactions: "Kestu treats this as proof of its accusation." },
          ],
        },
        {
          id: "q4-refugees",
          title: "Refugees",
          from: "Federation Embassy, Lysara",
          text: "Refugees are fleeing toward the Tekanan system. Tekanan refuses to take them for fear of provoking Kestu, so refugee ships have begun shuttling to the Class-L world across the border. No response from that world has been observed.",
          prompts: [{ id: "q4-refugee-orders", kind: "free-text", text: "How do you respond?" }],
          defaultOutcomeId: "humane",
          outcomes: [
            { id: "humane", label: "Humanitarian lead", criteria: "Organises relief and safe passage, works with Tekanan, takes care with the border.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: 1 }], reactions: "Refugee leaders thank Starfleet." },
            { id: "absent", label: "Hands off", criteria: "Leaves the refugees to their own devices.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "Reports of hardship among the refugees reach the Federation press." },
          ],
        },
        {
          id: "q4-antimatter",
          title: "The antimatter strike",
          from: "Starfleet Intelligence",
          text: "Antimatter devices bearing Federation signatures have destroyed the three largest cities on Kestu IX, and with them the regime. Kestu's new democratic government has thanked the Federation and left the war. Both planets are in ruins, and no Lysaran faction is happy with the Federation.",
          onEnter: [{ type: "set-flag", flag: "kestu-regime", value: "democratic" }],
          prompts: [{ id: "q4-antimatter-orders", kind: "free-text", text: "How do you respond?" }],
          defaultOutcomeId: "investigate",
          gmNotes: "Never reveal or hint at who planted the devices.",
          outcomes: [
            { id: "investigate", label: "Investigate and aid", criteria: "Demands an investigation, refuses credit, organises aid to both worlds.", effects: [{ type: "adjust-standing", factionId: "kestu", delta: 1 }], reactions: "The new Kestu government is cautiously cooperative." },
            { id: "exploit", label: "Accepts the outcome", criteria: "Treats the regime's fall as a win and moves on.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "Rumours spread that the Federation was behind it." },
          ],
        },
        {
          id: "q4-buoy",
          title: "The buoy's message",
          from: "Starbase science staff",
          text: "The object from the nebula has been recovered and analysed at your starbase. It is not a weapon: it is an automated distress buoy. Its records tell of the Saalit, a resource-hungry empire that occupied Tekanan III until a biological plague struck them. They withdrew, collapsed into anarchy, and a final democratic government sent out distress buoys before the Saalit died out.",
          onEnter: [{ type: "reveal", secretId: "probe-truth" }],
          prompts: [
            { id: "q4-buoy-inform", kind: "free-text", text: "Who should be told, and in what order?" },
            { id: "q4-buoy-explore", kind: "free-text", text: "With the resources you have left, design an exploration programme for Saalit territory, covering at least 20 sectors." },
          ],
          defaultOutcomeId: "careful",
          outcomes: [
            { id: "careful", label: "Careful disclosure", criteria: "Tells Tekanan sensitively and early, briefs Starfleet, plans exploration with plague precautions.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: 1 }], reactions: "Tekanan receives the news with grief and relief." },
            { id: "careless", label: "Careless disclosure", criteria: "Overlooks Tekanan or ignores the plague risk.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: -1 }], reactions: "Tekanan learns the truth secondhand and is hurt." },
          ],
        },
        {
          id: "q4-handover",
          title: "Tekanan joins the Federation",
          from: "Starfleet Command",
          text: "Tekanan III has joined the Federation. Its military has been absorbed into Starfleet, its infrastructure upgraded, and a ground starbase is replacing its orbital shipyards. Trade is growing, and other powers may want to use the sector as a base. A consortium of Federation-friendly Lysaran nations — which has already bought the Tekanan fleet you recommended — offers to buy your starbase and tow it to neutral space. Meanwhile, you have been reassigned to Sector Beta.",
          prompts: [
            { id: "q4-sale", kind: "choice", text: "Do you advise selling the starbase?", options: [{ id: "sell", label: "Sell" }, { id: "keep", label: "Keep it" }] },
            { id: "q4-sale-why", kind: "free-text", text: "Why?" },
            { id: "q4-brief", kind: "free-text", text: "Brief your replacement: Starfleet's priorities, where to focus, and which ships would complement the remaining fleet." },
            { id: "q4-flagship", kind: "free-text", text: "Which ship from your fleet carries you to Sector Beta, where it will join your new command?" },
          ],
          defaultOutcomeId: "orderly",
          outcomes: [{ id: "orderly", label: "Orderly handover", criteria: "Any handover.", reactions: "Your successor thanks you; your flagship sets course for Sector Beta." }],
        },
      ],
    },
  ],
  gm: {
    tone: "Professional Starfleet voice. Each reply comes from a named role (Starfleet Command, an ambassador, a captain, a planetary minister) and stays in character. Concise: a few short paragraphs.",
    improvisation: "You may invent flavor: names of minor officers and officials, dialogue, the texture of a report. You may not invent plot facts: no new threats, culprits, ship losses or revelations beyond what the scenario states.",
    sampleAnswer: {
      url: "https://www.st-minutiae.com/articles/admiral/sector_alpha_sample.html",
      note: "One reasonable answer among many, not an answer key. Judge the player's reasoning on its own merits.",
    },
    notes: [
      "This is a low-complexity scenario: every event happens in order regardless of outcome.",
      "Kestu's motives for mobilizing, the assassin's identity and the antimatter culprit are never established. Keep them unresolved.",
    ],
  },
};
