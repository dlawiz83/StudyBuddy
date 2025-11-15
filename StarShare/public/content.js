
(function () {
  const XP_RUN = 10;
  const XP_FOCUS = 15; 
  const FOCUS_INTERVAL = 300; 

  function addXP(amount) {
    chrome.storage.sync.get({ xp: 0 }, (res) => {
      const newXP = (res.xp || 0) + amount;
      chrome.storage.sync.set({ xp: newXP });
      showToast(`+${amount} XP`);
      // broadcast a message if popup open
      try { chrome.runtime.sendMessage({ type: "xp_update", xp: newXP }); } catch(e) {}
    });
  }

  function showToast(text) {
    try {
      const t = document.createElement("div");
      t.textContent = text;
      Object.assign(t.style, {
        position: "fixed",
        right: "20px",
        bottom: "120px",
        zIndex: 999999,
        padding: "8px 12px",
        borderRadius: "8px",
        background: "rgba(0,0,0,0.75)",
        color: "white",
        fontSize: "13px",
      });
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 1400);
    } catch (e) {}
  }

  // Try binding 'Run' buttons heuristically
  function bindRunButtons() {
    const buttons = Array.from(document.querySelectorAll("button,input[type='button']"))
      .filter(b => {
        const t = (b.innerText || b.value || "").toLowerCase();
        return /\brun\b|\bexecute\b|\brun\s*code\b|\brun\s*program\b|\brun\s*cell\b|\bplay\b/.test(t);
      });
    buttons.forEach(btn => {
      if (btn.dataset.starshareBound) return;
      btn.dataset.starshareBound = "1";
      btn.addEventListener("click", () => addXP(XP_RUN));
    });
  }

  // gives XP every 5 minutes active
  let activeSeconds = 0;
  setInterval(() => {
    if (document.visibilityState === "visible") activeSeconds++;
    if (activeSeconds > 0 && activeSeconds % FOCUS_INTERVAL === 0) {
      addXP(XP_FOCUS);
    }
    bindRunButtons(); // keep rebinding for dynamic sites
  }, 1000);

  // Try to detect problem completions
  function detectProblemCompletion() {
    // Example: LeetCode changes DOM after success; this is a placeholder
   
    const successTexts = ["accepted", "congratulations", "all tests passed"];
    const bodyText = document.body.innerText.toLowerCase();
    successTexts.forEach(s => {
      if (bodyText.includes(s) && !document.body.dataset.starshareCompleted) {
        document.body.dataset.starshareCompleted = "1";
        addXP(25); // reward for completion
      }
    });
  }
  setInterval(detectProblemCompletion, 3000);

  // initial bind
  bindRunButtons();
})();
