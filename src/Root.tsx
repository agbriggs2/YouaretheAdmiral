import { useState } from "react";
import App from "./App";
import { Menu } from "./Menu";
import { SCENARIOS } from "./scenarios";

/** The menu, or the chosen scenario. */
export default function Root() {
  const [playing, setPlaying] = useState<string | null>(null);
  const entry = SCENARIOS.find((e) => e.id === playing && e.scenario);
  if (entry?.scenario) {
    return <App key={entry.id} scenario={entry.scenario} onExit={() => { setPlaying(null); window.scrollTo({ top: 0 }); }} />;
  }
  return <Menu onPlay={(id) => { setPlaying(id); window.scrollTo({ top: 0 }); }} />;
}
