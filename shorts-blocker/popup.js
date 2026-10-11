const SITES = ["youtube", "instagram"];
const DEFAULTS = { mode: "block", limitMin: 15 };
const today = () => new Date().toLocaleDateString("sv");

async function render() {
  const { settings = {}, usage } = await chrome.storage.local.get(["settings", "usage"]);
  for (const site of SITES) {
    const card = document.querySelector(`[data-site=${site}]`);
    const cfg = { ...DEFAULTS, ...settings[site] };
    const used = usage && usage.date === today() ? usage[site] || 0 : 0;
    card.querySelector(".mode").value = cfg.mode;
    card.querySelector(".min").value = cfg.limitMin;
    card.querySelector(".limit").style.display = cfg.mode === "limit" ? "flex" : "none";
    const pct = cfg.mode === "limit" ? Math.min(100, (used / (cfg.limitMin * 60)) * 100) : 0;
    card.querySelector(".bar > div").style.width = pct + "%";
    card.querySelector(".used").textContent = `오늘 시청 ${Math.floor(used / 60)}분 ${used % 60}초`;
  }
}

async function save() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  for (const site of SITES) {
    const card = document.querySelector(`[data-site=${site}]`);
    settings[site] = {
      mode: card.querySelector(".mode").value,
      limitMin: Math.max(1, parseInt(card.querySelector(".min").value, 10) || DEFAULTS.limitMin),
    };
  }
  await chrome.storage.local.set({ settings });
  render();
}

document.querySelectorAll("select, input").forEach((el) => el.addEventListener("change", save));
document.getElementById("reset").addEventListener("click", async () => {
  await chrome.storage.local.set({ usage: { date: today(), youtube: 0, instagram: 0 } });
  render();
});
render();
