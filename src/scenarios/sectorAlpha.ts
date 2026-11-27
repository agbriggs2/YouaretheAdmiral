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
      government: "Monarchy: seven nations (Caldre, Imrath, Voss, Thale, Orvane, Merrow, Dunhal) under a single crown",
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
    // Rewritten as in-universe scenes with short answers (Andrew, 2026-11-26).
    // Same plot as the original; the hypothetical "Kestu arrived first" question
    // is replaced by three real developments (merchants, hotline, intelligence).
    {
      id: "q3",
      title: "Question Three: The Crown Falls",
      briefing:
        "0347 hours, starbase time. The Lysaran crown holds together seven proud nations: Caldre, Imrath, Voss, Thale, Orvane, Merrow and Dunhal. Queen Sereth IV has worn it for thirty years. Tonight that ends.",
      secrets: [
        {
          id: "kestu-timing",
          truth: "The scenario never establishes whether Kestu knew of the assassination in advance. The early departure could be foreknowledge or a routine exercise.",
        },
      ],
      events: [
        {
          id: "q3-alert",
          title: "Night alert",
          from: "Lt. Devan Torres, starbase duty officer",
          text: "\"Admiral, sorry to wake you. Priority signal from Ambassador Okafor on Lysara.\" Rhiannon Okafor's face is pale on the viewscreen behind him. Queen Sereth collapsed during the Festival of Lanterns in the capital, Aurenne, and the palace has confirmed she is dead. Her physicians are saying nothing. There is no named heir, and crowds are already gathering in the streets around the palace.",
          prompts: [{ id: "q3-alert-orders", kind: "free-text", short: true, text: "What are your first orders? What do you tell Ambassador Okafor, and does any ship move tonight?" }],
          defaultOutcomeId: "steady",
          gmNotes: "Do not say how the queen died or who was responsible. Okafor and Torres react in character.",
          outcomes: [
            { id: "steady", label: "Steady", criteria: "Calm, measured first orders: information gathering, embassy support, perhaps a ship moved quietly into range.", effects: [{ type: "set-flag", flag: "q3-first-response", value: "steady" }], reactions: "Okafor is visibly steadier for having clear guidance." },
            { id: "forceful", label: "Forceful", criteria: "A conspicuous show of force or a ship sent straight into Lysaran orbit.", effects: [{ type: "set-flag", flag: "q3-first-response", value: "forceful" }], reactions: "Okafor complies but warns that warships overhead may look like the Federation taking sides." },
            { id: "slow", label: "Wait and see", criteria: "No real orders; leaves the embassy without guidance.", effects: [{ type: "set-flag", flag: "q3-first-response", value: "slow" }], reactions: "Okafor is left improvising, and says so politely." },
          ],
        },
        {
          id: "q3-morning",
          title: "Morning after",
          from: "Ambassador Rhiannon Okafor",
          text: "By dawn the royal council has split along national lines. Voss and Thale have closed their borders; Orvane's delegation walked out of the palace. Merrow and Dunhal have declared for no one and are keeping their own counsel. About four hundred Federation citizens, mostly traders and university staff, are in Aurenne. Guild master Pell Corrin, speaking for the Federation traders, wants to know whether they should leave.",
          prompts: [{ id: "q3-morning-orders", kind: "free-text", short: true, text: "Do you evacuate Federation citizens, shelter them in place, or wait? How?" }],
          defaultOutcomeId: "sensible",
          outcomes: [
            { id: "sensible", label: "Sensible precaution", criteria: "A proportionate plan (voluntary departure, staged evacuation, or sheltering with a ship ready), communicated clearly.", effects: [{ type: "set-flag", flag: "q3-citizens", value: "handled" }], reactions: "Corrin is relieved; the citizens follow the plan." },
            { id: "alarming", label: "Alarming", criteria: "A loud, all-at-once evacuation that signals the Federation expects the worst.", effects: [{ type: "set-flag", flag: "q3-citizens", value: "evacuated" }], reactions: "The evacuation works, but Lysaran officials take it as a vote of no confidence." },
            { id: "neglected", label: "Left waiting", criteria: "No clear decision.", effects: [{ type: "set-flag", flag: "q3-citizens", value: "waiting" }], reactions: "Corrin's people grow anxious and some start making their own way out." },
          ],
        },
        {
          id: "q3-kestu-note",
          title: "Kestu speaks",
          from: "Kestu Directorate, then Minister Hadrin Toma of Tekanan III",
          text: "A curt communiqué arrives from the Kestu Directorate, signed by Envoy Kael Ruusk: Kestu \"stands ready to offer fraternal assistance to any Lysaran nation that requests it.\" Within the hour Tekanan's defense minister, Hadrin Toma, is on your screen. He wants to know what the Federation intends to do about it.",
          prompts: [{ id: "q3-kestu-note-orders", kind: "free-text", short: true, text: "How do you answer Envoy Ruusk, and what do you tell Minister Toma?" }],
          defaultOutcomeId: "balanced",
          gmNotes: "Write Ruusk's reaction (cool, formal) and Toma's (anxious) in the same reply if it fits.",
          outcomes: [
            { id: "balanced", label: "Balanced", criteria: "A firm but non-threatening message to Kestu and genuine reassurance for Tekanan.", reactions: "Ruusk acknowledges without committing; Toma is somewhat reassured." },
            { id: "threatening", label: "Threatening", criteria: "Warns Kestu off in hostile terms.", effects: [{ type: "adjust-standing", factionId: "kestu", delta: -1 }], reactions: "Ruusk replies that Kestu does not take instructions from the Federation." },
            { id: "dismissive", label: "Dismissive of Tekanan", criteria: "Brushes off Tekanan's fears.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: -1 }], reactions: "Toma thanks you stiffly and ends the call early." },
          ],
        },
        {
          id: "q3-orbit",
          title: "A week later",
          from: "The captain of your nearest patrol ship",
          text: "A week passes in uneasy quiet. Then a priority report: the Kestu fleet has entered Lysaran orbit. Transporter signatures show Kestu troops beaming down into Voss, whose governor asked Kestu to help guard Voss's borders. The Kestu ships have taken up a loose cordon over the capital.",
          prompts: [{ id: "q3-orbit-orders", kind: "free-text", short: true, text: "What are your orders to your ships now?" }],
          defaultOutcomeId: "measured",
          gmNotes: "The reply comes from the captain of one of the admiral's actual ships on patrol, escort or border duty: name the ship. Starfleet's standing guidance is to protect Federation interests without fighting Kestu.",
          outcomes: [
            { id: "measured", label: "Watchful", criteria: "Positions ships to observe and protect Federation interests while avoiding confrontation.", reactions: "The Kestu ships note the Starfleet presence and keep their distance." },
            { id: "confrontational", label: "Confrontational", criteria: "Moves to block, challenge or shadow the Kestu fleet aggressively.", effects: [{ type: "adjust-standing", factionId: "kestu", delta: -1 }], reactions: "A tense standoff in orbit; the Kestu commander protests." },
            { id: "absent", label: "Absent", criteria: "Leaves Lysaran space to Kestu entirely.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "Lysarans notice that Starfleet is nowhere to be seen." },
          ],
        },
        {
          id: "q3-envoys",
          title: "Envoys",
          from: "Captain Mara Lindqvist, your chief of staff",
          text: "\"Two visitors, Admiral.\" Thale and Orvane have followed Voss in inviting Kestu troops. Now envoys from the other two nations have arrived at your starbase: Lisette Arvane of Caldre and Teodor Maskel of Imrath. Both ask, in almost the same words, for the Federation's help.",
          prompts: [{ id: "q3-envoys-orders", kind: "free-text", short: true, text: "What do you promise Arvane and Maskel, and what do you hold back?" }],
          defaultOutcomeId: "careful",
          outcomes: [
            { id: "careful", label: "Careful support", criteria: "Offers real but bounded help (humanitarian, protective, diplomatic) and is honest about limits.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: 1 }], reactions: "Arvane and Maskel leave with something concrete and trust what they were told." },
            { id: "overpromise", label: "Overpromises", criteria: "Promises military backing or more than Starfleet can deliver.", effects: [{ type: "set-flag", flag: "q3-overpromised", value: true }], reactions: "The envoys are delighted; Lindqvist quietly asks how you plan to keep those promises." },
            { id: "refused", label: "Turned away", criteria: "Offers little or nothing.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "The envoys leave disappointed; Maskel remarks that Kestu answered faster." },
          ],
        },
        {
          id: "q3-merchants",
          title: "Stranded merchants",
          from: "Guild master Pell Corrin",
          text: "Corrin is back on your screen. Eleven Lysaran merchant ships, Caldrean and Imrathi registry, are stuck in orbit: the Kestu cordon has stopped clearing departures \"pending inspection.\" Their crews are running short on supplies. They ask for a Federation escort out past the cordon.",
          prompts: [{ id: "q3-merchants-orders", kind: "free-text", short: true, text: "Do you escort them? If so, how, without being drawn into the fighting?" }],
          defaultOutcomeId: "negotiated",
          gmNotes: "Starfleet's guidance is to aid those who ask for help and stay out of the fighting.",
          outcomes: [
            { id: "negotiated", label: "Negotiated passage", criteria: "Secures passage by talking to the Kestu commander, or escorts openly in a way that avoids confrontation.", effects: [{ type: "set-flag", flag: "q3-merchants", value: "freed" }], reactions: "The merchant ships leave orbit under escort; Corrin is effusive." },
            { id: "forced", label: "Forced through", criteria: "Runs the cordon or threatens the Kestu ships.", effects: [{ type: "set-flag", flag: "q3-merchants", value: "forced" }, { type: "adjust-standing", factionId: "kestu", delta: -1 }], reactions: "The ships get out, but a Kestu warship powers weapons before backing off. Ruusk lodges a protest." },
            { id: "declined", label: "Declined", criteria: "Leaves the merchants where they are.", effects: [{ type: "set-flag", flag: "q3-merchants", value: "stranded" }], reactions: "Corrin is bitter; the crews wait it out on half rations." },
          ],
        },
        {
          id: "q3-hotline",
          title: "A proposal from orbit",
          from: "Fleet Commander Drevak Sul, Kestu Defense Force",
          text: "An unexpected hail from the Kestu flagship. Fleet Commander Drevak Sul is blunt: with two fleets operating over one planet, an accident is only a matter of time. He proposes a direct channel between his flagship and your command, and agreed zones each side will keep clear of.",
          prompts: [{ id: "q3-hotline-orders", kind: "free-text", short: true, text: "Do you accept Sul's proposal? On what terms?" }],
          defaultOutcomeId: "accepted",
          gmNotes: "Sul is a professional officer, not a politician. Accepting does not mean endorsing Kestu's intervention.",
          outcomes: [
            { id: "accepted", label: "Accepted on sound terms", criteria: "Accepts a channel or deconfliction arrangement while protecting Federation freedom of action and the nations that asked for help.", effects: [{ type: "set-flag", flag: "q3-hotline", value: "accepted" }, { type: "adjust-standing", factionId: "kestu", delta: 1 }], reactions: "Sul is satisfied; the channel opens within the hour." },
            { id: "conceded", label: "Concedes too much", criteria: "Agrees to terms that effectively hand Kestu control of Lysaran space or abandon Caldre and Imrath.", effects: [{ type: "set-flag", flag: "q3-hotline", value: "conceded" }, { type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "Sul accepts readily. Word reaches Arvane and Maskel, who are not pleased." },
            { id: "refused", label: "Refused", criteria: "Turns the proposal down.", effects: [{ type: "set-flag", flag: "q3-hotline", value: "refused" }], reactions: "Sul says he will log the refusal and keep his distance regardless." },
          ],
        },
        {
          id: "q3-intel",
          title: "The timeline doesn't add up",
          from: "Commander Ysolde Hart, Starfleet Intelligence",
          text: "Commander Hart asks to see you privately. Long-range sensor logs, cross-checked against Lysaran traffic records, show the Kestu fleet left home roughly two days before Queen Sereth died. It might have been foreknowledge. It might have been an exercise that happened to be in the right place. \"I can't tell you which, Admiral. Nobody can, yet.\"",
          prompts: [{ id: "q3-intel-orders", kind: "free-text", short: true, text: "What do you do with this: share it, confront Kestu with it, or hold it? Who do you tell?" }],
          defaultOutcomeId: "held",
          gmNotes: "Never confirm or deny Kestu foreknowledge. If confronted, Kestu calls it a scheduled exercise; that claim is neither proven nor disproven.",
          outcomes: [
            { id: "held", label: "Held and investigated", criteria: "Keeps it close, reports to Starfleet, and pursues more evidence before acting.", effects: [{ type: "set-flag", flag: "q3-intel", value: "held" }], reactions: "Hart approves; the inquiry continues quietly." },
            { id: "shared", label: "Shared with Lysarans", criteria: "Shares it with Caldre, Imrath or the council.", effects: [{ type: "set-flag", flag: "q3-intel", value: "shared" }, { type: "adjust-standing", factionId: "kestu", delta: -1 }], reactions: "Within a day it is the talk of Aurenne. Kestu denounces it as slander." },
            { id: "confronted", label: "Confronted Kestu", criteria: "Puts it to Kestu directly.", effects: [{ type: "set-flag", flag: "q3-intel", value: "confronted" }], reactions: "Ruusk replies that the fleet was on a scheduled exercise, and asks pointedly how Starfleet came by its sensor logs." },
          ],
        },
        {
          id: "q3-report",
          title: "Report to Starfleet",
          from: "Vice Admiral Hal Brennan, Starfleet Command",
          text: "Vice Admiral Brennan wants your assessment for the Federation Council before it meets. \"Give it to me straight, Admiral. How stable is Lysara, what should the Federation do, or not do, and is there anything you need from us?\" He adds one more thing: Tekanan's membership petition is on the Council's agenda, and the councillors want to hear from the admiral on the ground.",
          prompts: [
            { id: "q3-report-orders", kind: "free-text", short: true, text: "Your assessment for Vice Admiral Brennan: how stable is the situation, what should the Federation do, and do you need anything?" },
            { id: "q3-report-council", kind: "free-text", short: true, text: "For the Council: do you have any reservations about Tekanan joining the Federation, or about a long-term Federation presence in the sector?" },
          ],
          defaultOutcomeId: "accurate",
          gmNotes: "Judge the report against WHERE THINGS STAND NOW and the earlier scenes, not against a checklist. A report that correctly concludes the situation is stable and asks for little is a good report. Brennan can say the Council will take it under advisement. Do not promise reinforcements; the scenario decides those later. The Council update on Tekanan is the admiral's own view: there is no right answer, and it should not move the grade unless it contradicts the situation assessment. Brennan simply takes it to the Council; do not say how the Council will decide.",
          outcomes: [
            { id: "accurate", label: "Accurate assessment", criteria: "The admiral's reading of the situation matches what has actually happened (standings and earlier results), and the recommendations and requests follow sensibly from it. This includes concluding that things are under control and little needs to change.", reactions: "Brennan agrees with the assessment and will put it to the Council largely as written. He may ask one specific follow-up question." },
            { id: "alarmist", label: "Overstated", criteria: "Paints a more dangerous picture than the facts support, or asks for far more than the situation warrants.", reactions: "Brennan notes that the facts don't quite bear out the alarm and asks the admiral to justify the requests." },
            { id: "complacent", label: "Understated", criteria: "Misses or plays down real problems that earlier scenes surfaced.", reactions: "Brennan points out what the report leaves out and asks for an update before the Council meets." },
            { id: "thin", label: "Thin", criteria: "Offers little real assessment.", reactions: "Brennan asks the admiral to tighten it before the Council sees it." },
          ],
        },
        {
          id: "q3-tekanan-fleet",
          title: "Tekanan builds a navy",
          from: "Minister Hadrin Toma, Tekanan III",
          text: "Minister Toma tours your starbase with a delegation of Tekanan engineers. Afterwards, over coffee in your office, he lays out the plans: Tekanan III will build warp-capable warships, up to Excelsior-equivalent, with five ready within a year. \"We will never again be defenseless. But we would rather build them alongside you.\"",
          prompts: [{ id: "q3-tekanan-orders", kind: "free-text", short: true, text: "What should Tekanan do with its new fleet, and how will your ships fit around it?" }],
          defaultOutcomeId: "coordinated",
          outcomes: [
            { id: "coordinated", label: "Coordinated", criteria: "Integrates Tekanan's ships into a shared defensive or patrol role.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: 1 }], reactions: "Toma welcomes being treated as a partner." },
            { id: "restrained", label: "Restraining", criteria: "Discourages or limits the buildup.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: -1 }, { type: "adjust-standing", factionId: "kestu", delta: 1 }], reactions: "Toma is offended; Kestu notices with approval." },
          ],
        },
      ],
    },

    // ── Question Four ────────────────────────────────────
    // Retold as in-universe scenes with short answers. Same plot as the original:
    // war, reinforcements, mutual destruction and a lost ship, refugees, the
    // strike on the Kestu junta, the buoy, Tekanan's accepted petition and the handover.
    {
      id: "q4",
      title: "Question Four: War and Aftermath",
      briefing:
        "The hotline to Fleet Commander Sul has carried little but routine traffic for a month. Relief convoys reach Caldre and Imrath on schedule. Then, in the space of a single night, the peace on Lysara breaks.",
      secrets: [
        {
          id: "strike-culprit",
          truth: "The scenario never establishes who planted the device that killed the Kestu junta, or where its salvaged photon-torpedo warhead came from. The GM must not reveal or imply a culprit.",
        },
      ],
      events: [
        {
          id: "q4-war",
          title: "Open war",
          from: "Ambassador Rhiannon Okafor",
          text: "Okafor's signal is broken up by interference. Merrow and Dunhal, unaligned since the Queen's death, have declared war on the Kestu-backed alliance of Voss, Thale and Orvane. Caldre and Imrath have stayed out of it so far, but the fighting is spreading along every border, and Lysaran sublight warships are already exchanging fire across the binary system. \"The embassy is safe for now, Admiral. I can't say the same for the city.\"",
          prompts: [{ id: "q4-war-orders", kind: "free-text", short: true, text: "What are your immediate orders?" }],
          defaultOutcomeId: "measured",
          gmNotes: "Starfleet's standing guidance is unchanged: aid only the nations that asked for help, and stay out of the fighting.",
          outcomes: [
            { id: "measured", label: "Measured", criteria: "Protects Federation people and relief operations, keeps ships clear of the fighting, and keeps channels open.", reactions: "Okafor acknowledges; the relief effort holds together." },
            { id: "drawn-in", label: "Drawn in", criteria: "Moves ships into the fighting or takes sides militarily.", effects: [{ type: "adjust-standing", factionId: "kestu", delta: -1 }], reactions: "Okafor warns that Federation ships near the fighting are being read as taking Merrow and Dunhal's side." },
            { id: "withdrawn", label: "Pulled back", criteria: "Withdraws relief and support entirely.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "Arvane and Maskel ask where their promised aid has gone." },
          ],
        },
        {
          id: "q4-reinforce",
          title: "Reinforcements",
          from: "Vice Admiral Hal Brennan, Starfleet Command",
          text: "Brennan is brief. \"The Council's position stands: aid the nations that asked for it, and stay out of the war. To help you do that, Starfleet is sending you one combat ship and two transports. Tell me what you want.\"",
          prompts: [
            {
              id: "q4-reinforce-request",
              kind: "reinforcement",
              text: "Request your reinforcements. Starfleet will send what it can spare.",
              slots: [
                { id: "combat", label: "One combat ship", categories: ["cruiser", "light-cruiser", "frigate"], count: 1 },
                { id: "transports", label: "Two transports", categories: ["transport"], count: 2 },
              ],
            },
          ],
          defaultOutcomeId: "dispatched",
          gmNotes: "Announce exactly the ships Starfleet has sent, with a one-sentence reason for any substitution.",
          outcomes: [{ id: "dispatched", label: "Dispatched", criteria: "Any request.", reactions: "Brennan confirms the ships are on their way." }],
        },
        {
          id: "q4-disaster",
          title: "Mutual destruction",
          from: "Captain Mara Lindqvist, your chief of staff",
          text: "Lindqvist doesn't sit down. \"Admiral, the Lysaran and Kestu fleets met near the inner star an hour ago. They destroyed each other.\" Fleet Commander Sul's flagship is among the wrecks; the hotline is silent. In the crossfire, {lost} was destroyed along with the Tekanan transport Haveth's Promise it was escorting. There were no survivors from either ship.",
          onEnter: [{ type: "remove-ships", selector: { assignment: "Patrol" }, count: 1, reason: "Destroyed in the crossfire while escorting the Tekanan transport Haveth's Promise" }],
          prompts: [{ id: "q4-disaster-orders", kind: "free-text", short: true, text: "What are your first orders?" }],
          defaultOutcomeId: "steady",
          gmNotes: "Treat the loss with weight. Do not suggest the loss could have been avoided or assign blame for the crossfire.",
          outcomes: [
            { id: "steady", label: "Steady", criteria: "Search and rescue, care for the fallen and their families, ships pulled clear of the battle area.", reactions: "The crews take their cue from the admiral's composure." },
            { id: "reactive", label: "Reactive", criteria: "Orders that risk widening the fighting, or retaliation.", effects: [{ type: "adjust-standing", factionId: "kestu", delta: -1 }], reactions: "Lindqvist carries out the orders but asks quietly whether this is wise." },
          ],
        },
        {
          id: "q4-accusation",
          title: "The accusation",
          from: "Envoy Kael Ruusk, Kestu Directorate",
          text: "Envoy Ruusk is on your screen within the hour, colder than you have ever seen him. Kestu holds the Federation responsible: its ships escorted Lysaran convoys through the war zone, and Kestu believes Starfleet sensors guided the Merrovian and Dunhali fire. \"Commander Sul trusted your channel, Admiral. Now he is dead.\"",
          prompts: [{ id: "q4-accusation-orders", kind: "free-text", short: true, text: "How do you answer Ruusk?" }],
          defaultOutcomeId: "firm",
          outcomes: [
            { id: "firm", label: "Firm and transparent", criteria: "Rejects the accusation with evidence and openness, honours the dead on both sides, and stays out of the war.", reactions: "Ruusk does not concede, but Kestu's accusation gains little traction with the other worlds." },
            { id: "retaliatory", label: "Retaliatory", criteria: "Answers with threats or counter-accusations.", effects: [{ type: "adjust-standing", factionId: "kestu", delta: -1 }], reactions: "Ruusk treats it as proof of his accusation and cuts the channel." },
            { id: "conciliatory", label: "Apologetic", criteria: "Apologises or accepts blame the Federation doesn't bear.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "Ruusk accepts coolly; Caldre and Imrath are alarmed by what sounds like an admission." },
          ],
        },
        {
          id: "q4-refugees",
          title: "Refugees",
          from: "Ambassador Okafor, then Minister Hadrin Toma",
          text: "Okafor reports thousands of refugees fleeing Lysara toward the Tekanan system. Minister Toma has refused to take them: he fears Kestu will treat it as Tekanan joining the war. Refugee ships have begun shuttling instead to the Class-L world across the border. No response from that world has been observed.",
          prompts: [{ id: "q4-refugees-orders", kind: "free-text", short: true, text: "What do you do about the refugees?" }],
          defaultOutcomeId: "humane",
          gmNotes: "Nothing is known about the Class-L world beyond its being unexplored and across the border. Do not invent inhabitants or dangers.",
          outcomes: [
            { id: "humane", label: "Humanitarian lead", criteria: "Organises relief and safe passage, works with Tekanan rather than overriding it, and takes care at the border.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: 1 }], reactions: "Refugee leaders thank Starfleet; Toma is relieved not to be pushed." },
            { id: "pressured", label: "Pressures Tekanan", criteria: "Leans hard on Tekanan to take the refugees.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: -1 }], reactions: "Toma gives ground, resentfully." },
            { id: "absent", label: "Hands off", criteria: "Leaves the refugees to their own devices.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "Reports of hardship among the refugees reach the Federation press." },
          ],
        },
        {
          id: "q4-strike",
          title: "Strike on the Directorate",
          from: "Commander Ysolde Hart, Starfleet Intelligence",
          text: "Hart's voice is flat. An explosive device has detonated inside the Directorate's council chamber on Kestu IX, killing the ruling junta in session. Damage outside the government compound is limited. Preliminary analysis of the debris says the device looked an awful lot like a warhead salvaged from a Federation photon torpedo. \"I don't know who did this, Admiral. I know how it's going to look.\"",
          onEnter: [{ type: "set-flag", flag: "kestu-regime", value: "fallen" }],
          prompts: [{ id: "q4-strike-orders", kind: "free-text", short: true, text: "What are your first orders?" }],
          defaultOutcomeId: "investigate",
          gmNotes: "This was a targeted strike on the junta, not a mass-casualty attack: keep the scale small. Never reveal or hint at who planted the device or how they got the warhead. Hart has no answer and should not speculate toward one.",
          outcomes: [
            { id: "investigate", label: "Investigate and aid", criteria: "Orders an investigation, informs Starfleet, and offers help to Kestu.", effects: [{ type: "set-flag", flag: "q4-strike", value: "investigated" }], reactions: "Hart begins at once; offers of help are readied." },
            { id: "silent", label: "Says nothing", criteria: "Keeps quiet and waits.", effects: [{ type: "set-flag", flag: "q4-strike", value: "silent" }], reactions: "Rumours that the Federation was behind it begin to spread." },
          ],
        },
        {
          id: "q4-new-kestu",
          title: "A new voice from Kestu",
          from: "First Speaker Imra Talov, Provisional Government of Kestu",
          text: "A woman you have never seen appears on your screen, in a borrowed office with the Directorate's emblem freshly painted over. Imra Talov speaks for a provisional democratic government formed in the days since the junta fell. Kestu is leaving the war. She thanks the Federation for freeing her people. Lysara is battered by the war, and not one Lysaran faction is happy with the Federation.",
          onEnter: [{ type: "set-flag", flag: "kestu-regime", value: "democratic" }],
          prompts: [{ id: "q4-new-kestu-orders", kind: "free-text", short: true, text: "How do you answer Talov's thanks?" }],
          defaultOutcomeId: "honest",
          gmNotes: "Never reveal or hint at who planted the device. Talov sincerely believes the Federation helped; she is grateful, not scheming.",
          outcomes: [
            { id: "honest", label: "Honest", criteria: "Refuses credit, says the Federation did not do this, offers aid and support to the new government.", effects: [{ type: "adjust-standing", factionId: "kestu", delta: 1 }], reactions: "Talov is surprised, then grateful for the honesty." },
            { id: "accepts", label: "Accepts the thanks", criteria: "Takes the credit, or lets the belief stand.", effects: [{ type: "adjust-standing", factionId: "lysara", delta: -1 }], reactions: "Talov is pleased. On Lysara, the rumours harden into certainty." },
          ],
        },
        {
          id: "q4-buoy",
          title: "The buoy's message",
          from: "Lt. Commander Ama Osei, starbase science officer",
          text: "Lt. Commander Osei has finished with the object from the nebula. It is not a weapon. It is an automated distress buoy. Its records tell of the Saalit, a resource-hungry empire that occupied Tekanan III until a plague struck them. They withdrew, collapsed into anarchy, and a last democratic government launched distress buoys before the Saalit died out. \"Admiral, the people who did that to Tekanan are gone.\"",
          onEnter: [{ type: "reveal", secretId: "probe-truth" }],
          prompts: [{ id: "q4-buoy-orders", kind: "free-text", short: true, text: "Who should be told, and in what order?" }],
          defaultOutcomeId: "careful",
          outcomes: [
            { id: "careful", label: "Careful disclosure", criteria: "Tells Tekanan sensitively and early, briefs Starfleet, and considers the plague risk.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: 1 }], reactions: "Toma receives the news with grief and relief." },
            { id: "careless", label: "Careless disclosure", criteria: "Overlooks Tekanan or ignores the plague risk.", effects: [{ type: "adjust-standing", factionId: "tekanan", delta: -1 }], reactions: "Tekanan learns the truth secondhand and is hurt." },
          ],
        },
        {
          id: "q4-explore",
          title: "Into Saalit space",
          from: "Vice Admiral Hal Brennan, Starfleet Command",
          text: "Brennan has read Osei's report. \"Saalit space is open, and someone has to go and look. I want an exploration programme covering at least twenty sectors, using the ships you have.\"",
          prompts: [{ id: "q4-explore-orders", kind: "free-text", short: true, text: "Outline your exploration programme: which ships, what first, and what precautions?" }],
          defaultOutcomeId: "sound",
          outcomes: [
            { id: "sound", label: "Sound programme", criteria: "Uses suitable ships realistically, prioritises sensibly, and takes plague and safety precautions.", reactions: "Brennan approves the programme." },
            { id: "overreach", label: "Overreaching", criteria: "Strips the sector of ships it still needs, or ignores the risks.", reactions: "Brennan approves it with reservations about what's left behind." },
          ],
        },
        {
          id: "q4-membership",
          recall: [{ promptId: "q3-report-council", label: "What the admiral told the Council about Tekanan and a long-term Federation presence (earlier, in the report to Brennan)" }],
          title: "Tekanan's petition accepted",
          from: "Minister Hadrin Toma, then Envoy Lisette Arvane",
          text: "The Federation Council has accepted Tekanan III's petition for membership. It is only the first step; years of review lie ahead before Tekanan is a member. Toma calls to thank you personally all the same. Then Lisette Arvane calls. A consortium of Federation-friendly Lysaran nations wants to buy your starbase and tow it to neutral space, where it would serve all of the sector's worlds.",
          prompts: [
            { id: "q4-sale", kind: "choice", text: "Do you advise selling the starbase?", options: [{ id: "sell", label: "Sell" }, { id: "keep", label: "Keep it" }] },
            { id: "q4-sale-why", kind: "free-text", short: true, text: "Why?" },
          ],
          defaultOutcomeId: "reasoned",
          gmNotes: "Toma may refer briefly to what the admiral told the Council earlier, warmly or ruefully as fits, but the Council's decision stands regardless. Tekanan is not yet a member.",
          outcomes: [
            { id: "reasoned", label: "Well reasoned", criteria: "A clear rationale tied to the sector's future, whichever way it goes.", reactions: "Arvane and Toma both accept the reasoning, whatever their preference." },
            { id: "thin", label: "Thinly reasoned", criteria: "Little rationale.", reactions: "Arvane asks you to put your reasoning in writing." },
          ],
        },
        {
          id: "q4-handover",
          title: "Handover",
          from: "Vice Admiral Hal Brennan, Starfleet Command",
          text: "\"Good work, Admiral. You're needed in Sector Beta.\" Your replacement, Rear Admiral Teresa Vance, arrives tomorrow and wants your briefing first thing.",
          prompts: [{ id: "q4-brief", kind: "free-text", short: true, text: "Your briefing for Rear Admiral Vance: Starfleet's priorities, where to focus, and which ships would complement the remaining fleet." }],
          defaultOutcomeId: "clear",
          outcomes: [
            { id: "clear", label: "Clear briefing", criteria: "Priorities that fit where things stand now, and sensible advice on ships.", reactions: "Vance thanks you; she has what she needs." },
            { id: "thin", label: "Thin briefing", criteria: "Little useful guidance.", reactions: "Vance thanks you and resolves to ask your chief of staff for the details." },
          ],
        },
        {
          id: "q4-departure",
          title: "Departure",
          from: "Captain Mara Lindqvist, your chief of staff",
          text: "Your bags are packed. One ship from your fleet will carry you to Sector Beta, where it will join your new command. Lindqvist is waiting at the airlock.",
          prompts: [
            { id: "q4-flagship", kind: "ship-choice", text: "Which ship carries you to Sector Beta?" },
            { id: "q4-farewell", kind: "free-text", short: true, text: "Any last words for your staff?" },
          ],
          defaultOutcomeId: "farewell",
          gmNotes: "A warm, brief farewell scene. The chosen ship's captain welcomes the admiral aboard.",
          outcomes: [{ id: "farewell", label: "Farewell", criteria: "Any answer.", reactions: "The staff see you off; your ship sets course for Sector Beta." }],
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
      "Kestu's motives for mobilizing, the assassin's identity and who planted the device that killed the Kestu junta are never established. Keep them unresolved.",
    ],
  },
};
