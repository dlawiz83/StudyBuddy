import { useEffect, useState } from "react";

function levelFromXP(xp) {
  return Math.floor(xp / 100);
}
function progressPercent(xp) {
  return xp % 100;
}

export default function App() {
  const [xp, setXp] = useState(0);
  const [cosmetics, setCosmetics] = useState([
    { id: "default", name: "Default", level: 0 },
    { id: "hat", name: "Hat", level: 2 },
    { id: "glow", name: "Glow", level: 4 },
  ]);
  const [selected, setSelected] = useState("default");

  useEffect(() => {
    chrome.storage.sync.get({ xp: 0 }, (res) => setXp(res.xp || 0));
    const listener = (changes) => {
      if (changes.xp) setXp(changes.xp.newValue || 0);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const lvl = levelFromXP(xp);
  const prog = progressPercent(xp);

  return (
    <div className="w-80 p-4 font-sans">
      <h2 className="text-lg font-semibold">StarShare</h2>

      <div className="mt-3">
        <div className="text-sm text-gray-600">Level {lvl}</div>
        <div className="h-3 bg-gray-200 rounded mt-2 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${prog}%`,
              background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
            }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {xp} XP • {prog}/100
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium">Cosmetics</div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {cosmetics.map((c) => {
            const locked = lvl < c.level;
            return (
              <button
                key={c.id}
                onClick={() => !locked && setSelected(c.id)}
                className={`p-2 border rounded ${
                  selected === c.id ? "ring-2 ring-indigo-400" : ""
                } ${locked ? "opacity-50" : ""}`}
              >
                {c.name}
                {locked && (
                  <div className="text-xs text-red-500">Lvl {c.level}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="flex-1 py-2 rounded border"
          onClick={() => chrome.storage.sync.set({ xp: 0 })}
        >
          Reset XP
        </button>
      </div>
    </div>
  );
}
