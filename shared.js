const DEFAULT_SETTINGS = {
  enabled: true, notificationsEnabled: true, rules: [], history: [], pinSalt: null, pinHash: null,
  schedule: {enabled: false, days: [1, 2, 3, 4, 5], start: "22:00", end: "08:00"}
};
async function getSettings() { const stored = await chrome.storage.local.get("settings"); const value = stored.settings || {}; return {...DEFAULT_SETTINGS, ...value, schedule: {...DEFAULT_SETTINGS.schedule, ...(value.schedule || {})}, rules: value.rules || [], history: value.history || []}; }
async function saveSettings(settings) { await chrome.storage.local.set({settings}); }
function normalizeRuleInput(value) { return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, ""); }
function escapeRegex(value) { return value.replace(/[.+?^${}()|[\]\\]/g, "\\$&"); }
function ruleToRegex(pattern) {
  if (pattern.startsWith("*.")) pattern = pattern.slice(2);
  const host = pattern.split("*").map(escapeRegex).join(".*");
  return `^https?:\\/\\/([^\\/]*\\.)?${host}(?:[\\/:?#]|$)`;
}
function ruleToDnr(rule, id) {
  const pattern = normalizeRuleInput(rule.pattern);
  const condition = {regexFilter: ruleToRegex(pattern), isUrlFilterCaseSensitive: false, resourceTypes: ["main_frame"]};
  return {id, priority: 1, action: {type: "block"}, condition};
}
function isScheduleActive(schedule, date = new Date()) { if (!schedule.enabled) return true; if (!schedule.days.includes(date.getDay())) return false; const minutes = date.getHours() * 60 + date.getMinutes(); const [sh, sm] = schedule.start.split(":").map(Number), [eh, em] = schedule.end.split(":").map(Number); const start = sh * 60 + sm, end = eh * 60 + em; if (start === end) return true; return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end; }
function createSalt() { return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join(""); }
async function hashPin(pin, salt) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}`)); return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join(""); }
async function verifyPin(settings, pin) { return Boolean(settings.pinHash && settings.pinSalt && (await hashPin(pin, settings.pinSalt)) === settings.pinHash); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#039;"}[c])); }
