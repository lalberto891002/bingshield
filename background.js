importScripts("shared.js");
const RULE_ID_BASE = 1000;
let refreshQueue = Promise.resolve();
function refreshRules() {
  refreshQueue = refreshQueue.then(async () => {
    const settings = await getSettings();
    const active = settings.enabled && isScheduleActive(settings.schedule);
    const addRules = active ? settings.rules.map((rule, index) => ruleToDnr(rule, RULE_ID_BASE + index)) : [];
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds: existing.map(rule => rule.id), addRules});
    await chrome.action.setBadgeText({text: active ? "ON" : "OFF"});
    await chrome.action.setBadgeBackgroundColor({color: active ? "#16803c" : "#777777"});
  }).catch(error => { console.error("No se pudieron actualizar las reglas de bloqueo", error); });
  return refreshQueue;
}
async function recordBlocked() { const settings = await getSettings(); const event = {time: new Date().toISOString(), rule: t("blockedNotificationMessage")}; settings.history = [event, ...settings.history].slice(0, 200); await saveSettings(settings); if (settings.notificationsEnabled) await chrome.notifications.create(`blocked-${Date.now()}`, {type: "basic", iconUrl: "icon.svg", title: t("blockedNotificationTitle"), message: event.rule, priority: 0}); }
chrome.runtime.onInstalled.addListener(refreshRules); chrome.runtime.onStartup.addListener(refreshRules); chrome.storage.onChanged.addListener((changes, area) => { if (area === "local" && changes.settings) refreshRules(); }); chrome.alarms.create("schedule-refresh", {periodInMinutes: 1}); chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === "schedule-refresh") refreshRules(); });
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => { if (message.type === "blocked") recordBlocked(message.ruleId).then(() => sendResponse({ok: true})); if (message.type === "refresh") refreshRules().then(() => sendResponse({ok: true})).catch(() => sendResponse({ok: false})); return true; }); refreshRules();
