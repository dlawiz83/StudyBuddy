document.addEventListener("DOMContentLoaded", () => {

  const XP_RUN = 10;

  const XP_ENTER_SITE = 10;

  const XP_ACTIVE_INTERVAL = 900;   // every 15 min
  const XP_ACTIVE_REWARD = 5;

  const FOCUS_INTERVAL = 1200;      // every 20 min
  const XP_FOCUS = 25;              // bigger bonus

  let siteEntered = false;
  let totalActiveSeconds = 0;


  function injectFloatingBuddy() {
    if (document.getElementById("starshare-floating-buddy")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "starshare-floating-buddy";

    Object.assign(wrapper.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "80px",
      height: "80px",
      padding: "8px",
      background: "rgba(255,255,255,0.9)",
      backdropFilter: "blur(8px)",
      borderRadius: "20px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      border: "1px solid rgba(0,0,0,0.1)",
      zIndex: 999999,
      cursor: "grab",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });

    wrapper.innerHTML = `
      <svg width="60" height="60" viewBox="0 0 100 100">
        <ellipse cx="50" cy="90" rx="25" ry="5" fill="black" opacity="0.1" />
        <circle cx="50" cy="50" r="35" fill="#EC4899"></circle>
        <ellipse cx="50" cy="58" rx="20" ry="18" fill="#F472B6" opacity="0.5" />
        <circle cx="40" cy="42" r="5" fill="#9F1239"></circle>
        <circle cx="60" cy="42" r="5" fill="#9F1239"></circle>
        <circle cx="41" cy="41" r="2" fill="white"></circle>
        <circle cx="61" cy="41" r="2" fill="white"></circle>
        <path d="M 40 55 Q 50 62 60 55"
          stroke="#9F1239" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="30" cy="52" r="6" fill="#FF6B9D" opacity="0.3"></circle>
        <circle cx="70" cy="52" r="6" fill="#FF6B9D" opacity="0.3"></circle>
        <line x1="50" y1="15" x2="50" y2="25" stroke="#EC4899" stroke-width="3" stroke-linecap="round"/>
        <circle cx="50" cy="12" r="5" fill="#F472B6"></circle>
      </svg>
    `;

    document.body.appendChild(wrapper);

    // Draggable
    let isDragging = false, offsetX = 0, offsetY = 0;

    wrapper.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - wrapper.getBoundingClientRect().left;
      offsetY = e.clientY - wrapper.getBoundingClientRect().top;
      wrapper.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      wrapper.style.left = e.clientX - offsetX + "px";
      wrapper.style.top = e.clientY - offsetY + "px";
      wrapper.style.bottom = "auto";
      wrapper.style.right = "auto";
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      wrapper.style.cursor = "grab";
    });

    // Tooltip
    function showBuddyTooltip(msg) {
      let t = document.createElement("div");
      t.textContent = msg;

      Object.assign(t.style, {
        position: "fixed",
        bottom: "110px",
        right: "20px",
        background: "white",
        color: "black",
        padding: "6px 12px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        fontSize: "14px",
        zIndex: 999999,
        transition: "0.4s",
      });

      document.body.appendChild(t);

      setTimeout(() => {
        t.style.opacity = "0";
        t.style.transform = "translateY(-20px)";
      }, 1500);

      setTimeout(() => t.remove(), 2500);
    }

    window.starshareBuddyToast = showBuddyTooltip;
  }

  injectFloatingBuddy();

  function showToast(text) {
    const t = document.createElement("div");
    t.textContent = text;

    Object.assign(t.style, {
      position: "fixed",
      right: "20px",
      bottom: "120px",
      padding: "8px 12px",
      background: "rgba(0,0,0,0.75)",
      color: "white",
      borderRadius: "8px",
      zIndex: 999999,
      transition: "0.8s",
    });

    document.body.appendChild(t);

    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(-20px)";
    }, 200);

    setTimeout(() => t.remove(), 1500);
  }

 
    // XP SYSTEM
  function addXP(amount) {
    chrome.storage.sync.get({ xp: 0 }, (res) => {
      const newXP = res.xp + amount;
      chrome.storage.sync.set({ xp: newXP });

      window.starshareBuddyToast?.(`+${amount} XP`);

      try {
        chrome.runtime.sendMessage({ type: "xp_update", xp: newXP });
      } catch {}
    });
  }

 
    // RUN BUTTON DETECTION

  function bindRunButtons() {
    const selectors = [
      "button",
      "input[type='button']",
      "[role='button']",
      "[aria-label='Run']",
      "[data-cy='run-code-btn']",
      "[data-cy='submit-btn']",
    ];

    const candidates = document.querySelectorAll(selectors.join(","));

    const buttons = [...candidates].filter((btn) => {
      const t = (btn.innerText || btn.value || "").toLowerCase().trim();
      return ["run", "submit", "execute", "play"].some((word) =>
        t.includes(word)
      );
    });

    buttons.forEach((btn) => {
      if (btn.dataset.starshareBound) return;
      btn.dataset.starshareBound = "1";
      btn.addEventListener("click", () => addXP(XP_RUN));
    });
  }

  bindRunButtons();
  new MutationObserver(bindRunButtons)
    .observe(document.body, { childList: true, subtree: true });


  let activeSeconds = 0;

  setInterval(() => {
    if (document.visibilityState === "visible") activeSeconds++;

    if (activeSeconds > 0 && activeSeconds % FOCUS_INTERVAL === 0) {
      addXP(XP_FOCUS);
    }
  }, 1000);


    //  COMPLETION XP
 
  function detectProblemCompletion() {
    const successWords = ["accepted", "all tests passed", "congratulations"];
    const text = document.body.innerText.toLowerCase();

    if (
      !document.body.dataset.starshareCompleted &&
      successWords.some((s) => text.includes(s))
    ) {
      document.body.dataset.starshareCompleted = "1";
      addXP(25);
    }
  }

  setInterval(detectProblemCompletion, 2000);


  if (!siteEntered) {
    siteEntered = true;
    addXP(XP_ENTER_SITE);
  }


     //XP EVERY 15 MIN OF ACTIVITY

  let intervalCounter = 0;

  setInterval(() => {
    if (document.visibilityState === "visible") {
      intervalCounter++;
      totalActiveSeconds++;

      if (intervalCounter % XP_ACTIVE_INTERVAL === 0) {
        addXP(XP_ACTIVE_REWARD);
      }
    }
  }, 1000);
});
