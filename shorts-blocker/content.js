(() => {
  const host = location.hostname;
  const SITE = host.includes("youtube.com") ? "youtube" : host.includes("instagram.com") ? "instagram" : null;
  if (!SITE) return;

  const DEFAULTS = {
    youtube: { mode: "block", limitMin: 15 },   // mode: block | limit | off
    instagram: { mode: "block", limitMin: 15 },
  };
  const today = () => new Date().toLocaleDateString("sv"); // YYYY-MM-DD (로컬 날짜)

  const isShortPage = () => {
    const p = location.pathname;
    return SITE === "youtube"
      ? p.startsWith("/shorts")
      : p.startsWith("/reels") || p.startsWith("/reel/") || /^\/[^/]+\/reel\//.test(p);
  };

  let cfg = { ...DEFAULTS[SITE] };
  let usedSec = 0;      // 오늘 누적 (초)
  let pending = 0;      // 아직 저장하지 않은 초
  let loaded = false;

  const loadAll = () =>
    chrome.storage.local.get(["settings", "usage"], ({ settings, usage }) => {
      cfg = { ...DEFAULTS[SITE], ...(settings && settings[SITE]) };
      usedSec = usage && usage.date === today() ? usage[SITE] || 0 : 0;
      loaded = true;
      applyClass();
    });

  const applyClass = () => {
    document.documentElement.classList.toggle(`sb-${SITE}-block`, cfg.mode === "block");
  };

  // 여러 탭이 동시에 쓰므로 저장 시점에 최신값을 읽어 더함
  const flush = () => {
    if (!pending) return;
    const add = pending;
    pending = 0;
    chrome.storage.local.get("usage", ({ usage }) => {
      const u = usage && usage.date === today() ? usage : { date: today(), youtube: 0, instagram: 0 };
      u[SITE] = (u[SITE] || 0) + add;
      usedSec = u[SITE];
      chrome.storage.local.set({ usage: u });
    });
  };

  const toast = (msg) => {
    const show = () => {
      const el = document.createElement("div");
      el.id = "sb-toast";
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    };
    document.body ? show() : addEventListener("DOMContentLoaded", show, { once: true });
  };

  const leave = (msg) => {
    try { sessionStorage.setItem("sb-msg", msg); } catch (_) {}
    location.replace("/");
  };

  const tick = () => {
    if (!loaded || cfg.mode === "off" || !isShortPage()) return;

    if (cfg.mode === "block") return leave("숏폼 차단 중입니다 🚫");

    // limit 모드: 화면이 보이는 동안만 시간 누적
    if (usedSec + pending >= cfg.limitMin * 60) {
      flush();
      return leave(`오늘 ${cfg.limitMin}분 제한에 도달했어요 ⏱️`);
    }
    if (document.visibilityState === "visible") {
      pending += 1;
      if (pending >= 5) flush();
    }
  };

  loadAll();
  chrome.storage.onChanged.addListener(loadAll);
  setInterval(tick, 1000);
  addEventListener("pagehide", flush);

  try {
    const m = sessionStorage.getItem("sb-msg");
    if (m) { sessionStorage.removeItem("sb-msg"); toast(m); }
  } catch (_) {}
})();
