/**
 * Almacenamiento del historial de exámenes en localStorage.
 * Cada entrada guarda la puntuación y el detalle completo para poder
 * repasar el examen más tarde.
 */
const STORAGE_KEY = "legajo_historial_examenes_v1";

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("No se pudo leer el historial:", e);
    return [];
  }
}

function saveExamResult(entry) {
  const history = loadHistory();
  history.unshift(entry); // más reciente primero
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("No se pudo guardar el examen en el historial:", e);
  }
  return history;
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
