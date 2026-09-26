const DEFAULT_SETTINGS = {
  enabled: true, notificationsEnabled: true, rules: [], history: [], pinSalt: null, pinHash: null,
  schedule: {enabled: false, days: [1, 2, 3, 4, 5], start: "22:00", end: "08:00"}
};
const I18N = {
  es: {
    appTitle: "BingeBlock", protectedChanges: "Los cambios protegidos requieren el PIN.", popupSettings: "Configuración", blockingActive: "Bloqueo activo", blockingPaused: "Bloqueo pausado o fuera de horario", pause: "Pausar bloqueo", activate: "Activar bloqueo", enterPin: "Introduce el PIN", wrongPin: "PIN incorrecto", blockedTitle: "Página bloqueada", blockedText: "BingeBlock ha impedido esta navegación.", goBack: "Volver atrás", rulesTitle: "Reglas de bloqueo", add: "Añadir", rulePlaceholder: "ejemplo.com o *social*", noRules: "No hay reglas todavía.", remove: "Eliminar", scheduleTitle: "Horario global", enableSchedule: "Activar horario", days: "Días", monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles", thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo", parentalTitle: "Control parental", pinConfigured: "PIN configurado.", noPin: "No hay PIN configurado todavía.", pinPlaceholder: "PIN de 4 o más caracteres", changePin: "Establecer o cambiar PIN", notifyEach: "Notificar cada bloqueo", historyTitle: "Historial", clearHistory: "Borrar historial", noHistory: "No hay intentos registrados.", backupsTitle: "Copias", export: "Exportar configuración", import: "Importar configuración", saved: "Guardado", invalidRule: "Introduce un dominio o patrón válido", duplicateRule: "Esa regla ya existe", invalidConfig: "Archivo de configuración no válido", blockedNotificationTitle: "BingeBlock ha bloqueado una página", blockedNotificationMessage: "Navegación bloqueada"
  },
  en: {
    appTitle: "BingeBlock", protectedChanges: "Protected changes require the PIN.", popupSettings: "Settings", blockingActive: "Blocking active", blockingPaused: "Blocking paused or outside schedule", pause: "Pause blocking", activate: "Enable blocking", enterPin: "Enter the PIN", wrongPin: "Incorrect PIN", blockedTitle: "Page blocked", blockedText: "BingeBlock prevented this navigation.", goBack: "Go back", rulesTitle: "Blocking rules", add: "Add", rulePlaceholder: "example.com or *social*", noRules: "No rules yet.", remove: "Remove", scheduleTitle: "Global schedule", enableSchedule: "Enable schedule", days: "Days", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday", parentalTitle: "Parental control", pinConfigured: "PIN configured.", noPin: "No PIN configured yet.", pinPlaceholder: "PIN with 4 or more characters", changePin: "Set or change PIN", notifyEach: "Notify on every block", historyTitle: "History", clearHistory: "Clear history", noHistory: "No blocked attempts.", backupsTitle: "Backups", export: "Export configuration", import: "Import configuration", saved: "Saved", invalidRule: "Enter a valid domain or pattern", duplicateRule: "That rule already exists", invalidConfig: "Invalid configuration file", blockedNotificationTitle: "BingeBlock blocked a page", blockedNotificationMessage: "Navigation blocked"
  }
};
function currentLanguage() { const locale = (globalThis.chrome?.i18n?.getUILanguage?.() || globalThis.navigator?.language || "en").toLowerCase(); return locale.startsWith("es") ? "es" : "en"; }
function t(key) { return I18N[currentLanguage()][key] || I18N.en[key] || key; }
function applyTranslations() { document.documentElement.lang = currentLanguage() === "es" ? "es" : "en"; document.querySelectorAll("[data-i18n]").forEach(element => { element.textContent = t(element.dataset.i18n); }); document.querySelectorAll("[data-i18n-placeholder]").forEach(element => { element.placeholder = t(element.dataset.i18nPlaceholder); }); }
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
