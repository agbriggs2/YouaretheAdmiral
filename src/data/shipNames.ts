/*
 * Default ship names. Each category has a theme; canon names are locked to their
 * class and carry their canon registry. Hero ships, famous plot ships and class
 * names are never used. Players can still rename any ship.
 */

/** Roughly one pick in five comes from a class's canon names, when it has any. */
export const CANON_SHARE = 0.2;

export const CATEGORY_NAMES: Record<string, string[]> = {
  // Legacy and ideals: great voyages and aspirations.
  capital: ["Ascendant", "Concordia", "Endurance", "Resolution", "Argonaut", "Ulysses", "Providence", "Zenith", "Unity", "Harmony", "Aurora", "Atlantis", "Paragon", "Triumph"],
  // Historic warships and great battles.
  cruiser: ["Agincourt", "Trafalgar", "Marathon", "Salamis", "Warspite", "Ark Royal", "Indomitable", "Courageous", "Formidable", "Kearsarge", "Valmy", "Implacable"],
  // Mountain ranges (after canon's Appalachia) and mythological figures.
  "light-cruiser": ["Andes", "Atlas", "Cascadia", "Caucasus", "Pyrenees", "Carpathia", "Olympus", "Ural", "Himalaya", "Kunlun", "Drakensberg", "Tatra",
    "Perseus", "Athena", "Achilles", "Theseus", "Atalanta", "Hyperion", "Orpheus", "Freya", "Anansi", "Gilgamesh", "Artemis", "Odin"],
  // Pioneers and reformers, steady virtues, and Shakespearean characters.
  frigate: ["Earhart", "Gagarin", "Tereshkova", "Shackleton", "Amundsen", "Coleman", "Tubman", "Douglass", "Garibaldi", "Bolivar", "Ride", "Jemison",
    "Steadfast", "Vigilant", "Tenacious", "Diligent", "Stalwart", "Ardent",
    "Prospero", "Ariel", "Portia", "Cordelia", "Rosalind", "Viola", "Beatrice", "Benedick", "Mercutio", "Titania", "Puck", "Hotspur"],
  // Wild places (after canon's Ahwahnee) and words for swiftness.
  scout: ["Denali", "Serengeti", "Banff", "Kakadu", "Patagonia", "Zion", "Shenandoah", "Okavango", "Fiordland", "Jasper", "Tongariro",
    "Swift", "Arrow", "Comet", "Falcon", "Peregrine", "Kestrel", "Gazelle", "Courser", "Quicksilver", "Dart", "Swallow", "Merlin"],
  // Scientists, astronomers and thinkers.
  science: ["Copernicus", "Kepler", "Curie", "Meitner", "Hypatia", "Herschel", "Sagan", "Chandrasekhar", "Leavitt", "Rubin", "Noether", "Tycho", "Feynman", "Darwin", "Hawking", "Franklin"],
  // Port cities and harbours (the class names are cities).
  transport: ["Lisbon", "Valparaiso", "Mombasa", "Rotterdam", "Marseille", "Halifax", "Singapore", "Antwerp", "Alexandria", "Durban", "Kobe", "Bergen", "Montevideo", "Zanzibar"],
};

/** Canon ships, locked to their class, with canon registries. Famous plot ships are left out. */
export const CANON_NAMES: Record<string, { name: string; registry: string }[]> = {
  galaxy: [{ name: "Venture", registry: "NCC-71854" }],
  ambassador: [
    { name: "Excalibur", registry: "NCC-26517" }, { name: "Zhukov", registry: "NCC-26136" },
    { name: "Yamaguchi", registry: "NCC-26510" }, { name: "Adelphi", registry: "NCC-26849" },
  ],
  nebula: [
    { name: "Endeavour", registry: "NCC-71805" }, { name: "Lexington", registry: "NCC-61832" }, { name: "Merrimac", registry: "NCC-61827" },
    { name: "Phoenix", registry: "NCC-65420" }, { name: "Sutherland", registry: "NCC-72015" }, { name: "Bellerophon", registry: "NCC-62048" },
  ],
  excelsior: [
    { name: "Hood", registry: "NCC-42296" }, { name: "Lakota", registry: "NCC-42768" }, { name: "Fearless", registry: "NCC-14598" }, { name: "Repulse", registry: "NCC-2544" },
    { name: "Charleston", registry: "NCC-42285" }, { name: "Crazy Horse", registry: "NCC-50446" }, { name: "Cairo", registry: "NCC-42136" },
    { name: "Okinawa", registry: "NCC-13958" },
  ],
  akira: [{ name: "Thunderchild", registry: "NCC-63549" }, { name: "Geronimo", registry: "NCC-62497" }],
  miranda: [{ name: "Majestic", registry: "NCC-31060" }, { name: "Trial", registry: "NCC-1948" }, { name: "Tian An Men", registry: "NCC-21382" }, { name: "ShirKahr", registry: "NCC-31905" }],
  "new-orleans": [{ name: "Thomas Paine", registry: "NCC-65530" }, { name: "Renegade", registry: "NCC-63102" }, { name: "Rutledge", registry: "NCC-57295" }],
  steamrunner: [{ name: "Appalachia", registry: "NCC-52136" }],
  saber: [{ name: "Yeager", registry: "NCC-61947" }],
  cheyenne: [{ name: "Ahwahnee", registry: "NCC-71620" }],
  constellation: [{ name: "Victory", registry: "NCC-9754" }, { name: "Gettysburg", registry: "NCC-3890" }, { name: "Magellan", registry: "NCC-3069" }],
  challenger: [{ name: "Armstrong", registry: "NCC-57537" }, { name: "Kearsarge", registry: "NCC-57566" }],
  norway: [{ name: "Budapest", registry: "NCC-64923" }],
  nova: [{ name: "Rhode Island", registry: "NCC-72701" }],
  korolev: [{ name: "Goddard", registry: "NCC-59621" }],
  renaissance: [{ name: "Aries", registry: "NCC-45167" }],
  oberth: [{ name: "Cochrane", registry: "NCC-59318" }, { name: "Biko", registry: "NCC-50331" }],
};

/** Never used as a default name: hero ships, famous plot ships, and class names. */
export const BANNED_NAMES = new Set([
  "Enterprise", "Defiant", "Voyager", "Discovery", "Titan", "Cerritos", "Stargazer", "Protostar", "Equinox",
  "Reliant", "Saratoga", "Grissom", "Pegasus", "Yamato", "Odyssey", "Lantree", "Brattain", "Tsiolkovsky",
  "Horatio", "Kyushu", "Honshu", "Jenolan", "Valiant", "Sao Paulo", "São Paulo", "Pasteur", "Hathaway", "Lalo", "Buran", "Chekov", "Trieste",
  "Galaxy", "Nebula", "Excelsior", "Akira", "Miranda", "New Orleans", "Cheyenne", "Ambassador", "Steamrunner", "Saber",
  "Istanbul", "Oberth", "Sydney", "Constitution", "Sovereign", "Intrepid", "Prometheus", "Nova", "Norway", "Springfield",
  "Andromeda", "Centaur", "Challenger", "Constellation", "Deneva", "Hokule'a", "Korolev", "Mediterranean", "Merced", "Olympic",
  "Renaissance", "Sequoia", "Yorkshire",
]);

/** A default name (and canon registry, if it's a canon name) for a new ship of this class. */
export function pickShipName(classId: string, category: string, taken: Set<string>, rand: () => number = Math.random): { name: string; registry?: string } {
  const free = (n: string) => !taken.has(n) && !BANNED_NAMES.has(n);
  const canon = (CANON_NAMES[classId] ?? []).filter((c) => free(c.name));
  const lockedElsewhere = new Set(Object.entries(CANON_NAMES).filter(([id]) => id !== classId).flatMap(([, list]) => list.map((c) => c.name)));
  const pool = (CATEGORY_NAMES[category] ?? []).filter((n) => free(n) && !lockedElsewhere.has(n));
  if (canon.length && (rand() < CANON_SHARE || !pool.length)) return canon[Math.floor(rand() * canon.length)];
  if (pool.length) return { name: pool[Math.floor(rand() * pool.length)] };
  // Every themed name is used: fall back to any free name from the other categories.
  const any = Object.values(CATEGORY_NAMES).flat().filter((n) => free(n) && !lockedElsewhere.has(n));
  return { name: any.length ? any[Math.floor(rand() * any.length)] : `Vessel ${taken.size + 1}` };
}
