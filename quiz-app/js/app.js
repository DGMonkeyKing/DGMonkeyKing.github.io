/* ==========================================================================
   LEGAJO — lógica de la aplicación
   Vanilla JS, sin dependencias. Un único #app con render manual por pantalla
   y delegación de eventos.
   ========================================================================= */

const EXAM_SIZE = 70;
const EXAM_PENALTY = 1 / 3;

const app = document.getElementById("app");

/** Estado global de la aplicación */
const state = {
  manifest: null,
  questionCache: new Map(), // temaId -> Promise<Question[]>
  screen: "home", // home | tema-pick | quiz | exam-summary | history
  session: null, // sesión activa (azar / tema / revisión / examen)
  examTimerId: null,
  selectedTemaIds: new Set(),
};

/* ------------------------------------------------------------------------
   Arranque
   ------------------------------------------------------------------------ */

async function init() {
  try {
    const res = await fetch("preguntas/manifest.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    state.manifest = await res.json();
  } catch (err) {
    renderFatalError(err);
    return;
  }
  renderHome();
}

function renderFatalError(err) {
  app.innerHTML = `
    <main>
      <div class="empty-state">
        <div class="glyph">&#9888;</div>
        <h2 style="font-family:var(--f-display)">No se pudo cargar el expediente</h2>
        <p>No ha sido posible leer <code>preguntas/manifest.json</code>.</p>
        <p>Si has abierto <code>index.html</code> directamente con doble clic, el navegador
        bloquea la lectura de archivos locales. Sirve la carpeta con un servidor local, por
        ejemplo <code>python3 -m http.server</code>, y abre <code>http://localhost:8000</code>.</p>
        <p style="font-family:var(--f-mono);font-size:12px;color:var(--garnet)">${escapeHtml(String(err))}</p>
      </div>
    </main>`;
}

/* ------------------------------------------------------------------------
   Carga y caché de preguntas
   ------------------------------------------------------------------------ */

function loadTema(tema) {
  if (state.questionCache.has(tema.id)) return state.questionCache.get(tema.id);
  const promise = Promise.all(
    tema.archivos.map((a) =>
      fetch(`preguntas/${tema.id}/${a.file}`)
        .then((r) => {
          if (!r.ok) throw new Error(`No se pudo leer ${a.file}`);
          return r.text();
        })
        .then((text) =>
          csvToQuestions(text, {
            temaId: tema.id,
            temaNombre: tema.nombre,
            file: a.file,
            archivoNombre: a.nombre,
          })
        )
    )
  ).then((arrays) => arrays.flat());
  state.questionCache.set(tema.id, promise);
  return promise;
}

async function loadAllQuestions() {
  const all = await Promise.all(state.manifest.temas.map(loadTema));
  return all.flat();
}

/* ------------------------------------------------------------------------
   Utilidades
   ------------------------------------------------------------------------ */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickNext(pool, avoidId) {
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  let q;
  do {
    q = pool[Math.floor(Math.random() * pool.length)];
  } while (q.id === avoidId);
  return q;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convierte URLs sueltas en texto en enlaces <a>, escapando el resto. */
function linkify(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:)\]])/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>'
  );
}

function letterFor(i) {
  return ["A", "B", "C", "D"][i];
}

function buildDisplayOptions(q) {
  return shuffle(
    q.opciones.map((texto, i) => ({
      texto,
      csvIndex: i + 1,
    }))
  ).map((option, i) => ({
    ...option,
    displayIndex: i + 1,
  }));
}

function displayOptionsForCurrentQuestion() {
  const s = state.session;
  const q = currentQuestion();
  if (!s.displayOptions || s.displayQuestionId !== q.id) {
    s.displayQuestionId = q.id;
    s.displayOptions = buildDisplayOptions(q);
  }
  return s.displayOptions;
}

function formatScore(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/** Las preguntas validadas se identifican por una de las marcas en su enunciado. */
function isValidatedQuestion(question) {
  return question.pregunta.includes("⭐⭐⭐") || question.pregunta.includes("👑");
}

function validatedQuestions(questions) {
  return questions.filter(isValidatedQuestion);
}

function revisionQuestions(questions) {
  return questions.filter((question) => !isValidatedQuestion(question));
}

/* ------------------------------------------------------------------------
   Pantalla: inicio
   ------------------------------------------------------------------------ */

function renderHome() {
  clearInterval(state.examTimerId);
  state.screen = "home";
  state.session = null;
  app.innerHTML = `
    ${masthead()}
    <main>
      <p class="file-ref">Legajo N.º 1 — Sala de estudio</p>
      <div class="home-intro">
        <h2>¿Cómo quieres estudiar hoy?</h2>
        <p>Elige un modo de trabajo. Las preguntas proceden del banco verificado de los
        temas cargados en este expediente. Los modos de examen, azar y por tema usan solo preguntas validadas.</p>
      </div>
      <div class="mode-grid">
        <button class="mode-card" data-action="go-azar" data-tab="Modo 01">
          <h3>Al azar</h3>
          <p>Preguntas de todos los temas, en orden aleatorio, sin límite ni cronómetro.
          Ideal para repasar con calma.</p>
          <span class="go">Empezar &rarr;</span>
        </button>
        <button class="mode-card" data-action="go-revision" data-tab="Modo 02">
          <h3>Revisión</h3>
          <p>Preguntas aún sin validar, en orden aleatorio y sin límite. Recibe corrección inmediata mientras repasas.</p>
          <span class="go">Empezar revisión &rarr;</span>
        </button>
        <button class="mode-card" data-action="go-examen" data-tab="Modo 03">
          <h3>Examen</h3>
          <p>${EXAM_SIZE} preguntas validadas, navegación libre y cronómetro. Puedes responder, modificar o dejar en blanco cada pregunta antes de finalizar.</p>
          <span class="go">Convocar examen &rarr;</span>
        </button>
        <button class="mode-card" data-action="go-tema" data-tab="Modo 04">
          <h3>Por tema</h3>
          <p>Elige uno o varios temas del expediente y practica solo con sus preguntas validadas.</p>
          <span class="go">Elegir temas &rarr;</span>
        </button>
      </div>
    </main>
  `;
}

function masthead() {
  return `
    <header class="masthead">
      <button class="brand" data-action="go-home">
        <span class="brand__seal"><span>LG</span></span>
        <span class="brand__text">
          <h1>Legajo</h1>
          <p>Sala de estudio &middot; oposiciones</p>
        </span>
      </button>
      <nav class="masthead__nav">
        <button class="btn-quiet" data-action="go-history">Historial</button>
      </nav>
    </header>
  `;
}

/* ------------------------------------------------------------------------
   Pantalla: selección de tema
   ------------------------------------------------------------------------ */

async function renderTemaPicker() {
  state.screen = "tema-pick";
  app.innerHTML = `
    ${masthead()}
    <main>
      <button class="back-link" data-action="go-home">&larr; Volver</button>
      <div class="home-intro">
        <h2>Elige los temas</h2>
        <p>Selecciona uno o varios temas del expediente. Puedes activar o desactivar cada tema volviendo a hacer clic sobre él.</p>
      </div>
      <div class="tema-list" id="tema-list">
        ${state.manifest.temas
          .map((t) => renderTemaPickerRow(t))
          .join("")}
      </div>
      <div class="tema-picker-actions">
        <p class="tema-picker-actions__summary" id="tema-selection-summary">${selectedTemaSummary()}</p>
        <button class="btn-primary" data-action="start-selected-temas" id="start-selected-temas" ${
          state.selectedTemaIds.size === 0 ? "disabled" : ""
        }>Empezar test</button>
      </div>
    </main>
  `;

  // Carga los recuentos en paralelo sin bloquear el render
  state.manifest.temas.forEach((t) => {
    loadTema(t).then((qs) => {
      const el = app.querySelector(`[data-count="${t.id}"]`);
      if (el) el.textContent = `${validatedQuestions(qs).length} preguntas validadas`;
    });
  });
}

function renderTemaPickerRow(t) {
  const selected = state.selectedTemaIds.has(t.id);
  return `
    <button class="tema-row ${selected ? "is-selected" : ""}" data-action="toggle-tema" data-tema="${t.id}" aria-pressed="${selected}">
      <span class="tema-row__label">
        <span class="tag">${escapeHtml(t.titulo)}</span>
        <strong>${escapeHtml(t.nombre)}</strong>
      </span>
      <span class="tema-row__meta">
        <span class="tema-row__selected">${selected ? "Seleccionado" : "Seleccionar"}</span>
        <span class="tema-row__count" data-count="${t.id}">cargando&hellip;</span>
      </span>
    </button>
  `;
}

function selectedTemaSummary() {
  const n = state.selectedTemaIds.size;
  if (n === 0) return "Selecciona al menos un tema para empezar.";
  if (n === 1) return "1 tema seleccionado.";
  return `${n} temas seleccionados.`;
}

function toggleTemaSelection(temaId) {
  if (state.selectedTemaIds.has(temaId)) state.selectedTemaIds.delete(temaId);
  else state.selectedTemaIds.add(temaId);

  const row = app.querySelector(`[data-tema="${temaId}"]`);
  if (row) {
    const selected = state.selectedTemaIds.has(temaId);
    row.classList.toggle("is-selected", selected);
    row.setAttribute("aria-pressed", String(selected));
    const label = row.querySelector(".tema-row__selected");
    if (label) label.textContent = selected ? "Seleccionado" : "Seleccionar";
  }

  const summary = document.getElementById("tema-selection-summary");
  if (summary) summary.textContent = selectedTemaSummary();
  const startBtn = document.getElementById("start-selected-temas");
  if (startBtn) startBtn.disabled = state.selectedTemaIds.size === 0;
}

/* ------------------------------------------------------------------------
   Sesión: azar / tema / revisión
   ------------------------------------------------------------------------ */

async function startAzar() {
  const pool = validatedQuestions(await loadAllQuestions());
  state.session = {
    kind: "azar",
    pool,
    current: pickNext(pool, null),
    answered: false,
    answersRevealed: false,
    selected: null,
    stats: { correct: 0, wrong: 0, total: 0 },
  };
  renderQuiz();
}

async function startTemas(temaIds) {
  const temas = state.manifest.temas.filter((t) => temaIds.includes(t.id));
  if (temas.length === 0) return;
  const questionsByTema = await Promise.all(temas.map(loadTema));
  const pool = validatedQuestions(questionsByTema.flat());
  state.session = {
    kind: "tema",
    temaNombre: temas.length === 1 ? temas[0].nombre : `${temas.length} temas seleccionados`,
    pool,
    current: pickNext(pool, null),
    answered: false,
    answersRevealed: false,
    selected: null,
    stats: { correct: 0, wrong: 0, total: 0 },
  };
  renderQuiz();
}

async function startSelectedTemas() {
  await startTemas(Array.from(state.selectedTemaIds));
}

async function startRevision() {
  const pool = revisionQuestions(await loadAllQuestions());
  state.session = {
    kind: "revision",
    pool,
    current: pickNext(pool, null),
    answered: false,
    answersRevealed: false,
    selected: null,
    stats: { correct: 0, wrong: 0, total: 0 },
  };
  renderQuiz();
}

async function startExam() {
  const all = validatedQuestions(await loadAllQuestions());
  const size = Math.min(EXAM_SIZE, all.length);
  state.session = {
    kind: "exam",
    queue: shuffle(all).slice(0, size),
    index: 0,
    answers: Array(size).fill(null), // respuesta por posición: permite editarla
    optionOrders: Array(size).fill(null),
    startedAt: Date.now(),
  };
  renderQuiz();
}

/* ------------------------------------------------------------------------
   Pantalla: cuestionario (compartida por los modos)
   ------------------------------------------------------------------------ */

function currentQuestion() {
  const s = state.session;
  return s.kind === "exam" ? s.queue[s.index] : s.current;
}

function examDisplayOptions() {
  const s = state.session;
  if (!s.optionOrders[s.index]) s.optionOrders[s.index] = buildDisplayOptions(currentQuestion());
  return s.optionOrders[s.index];
}

function renderQuiz() {
  state.screen = "quiz";
  const s = state.session;
  const q = currentQuestion();
  if (!q) return renderHome();

  const isExam = s.kind === "exam";
  const answersRevealed = isExam || s.answersRevealed;
  const displayOptions = isExam ? examDisplayOptions() : answersRevealed ? displayOptionsForCurrentQuestion() : [];
  const selected = isExam ? s.answers[s.index] : s.selected;

  app.innerHTML = `
    ${masthead()}
    <main>
      <div class="quiz-shell">
        ${renderStatusPanel()}
        <section class="q-card" id="q-card">
          ${!isExam ? '<div class="stamp-slot" id="stamp-slot"></div>' : ""}
          <div class="q-card__meta"><span>${escapeHtml(q.temaNombre)}</span><span>${escapeHtml(q.archivoNombre)}</span></div>
          <p class="q-card__text">${escapeHtml(q.pregunta)}</p>
          ${answersRevealed ? `<div class="options" id="options" role="group" aria-label="Opciones de respuesta">${displayOptions.map(op => `
            <button class="option ${isExam && selected === op.csvIndex ? "is-selected" : ""}" data-action="answer" data-index="${op.csvIndex}" data-display-index="${op.displayIndex}" ${!isExam && s.answered ? "disabled" : ""}>
              <span class="option__letter">${letterFor(op.displayIndex - 1)}</span><span>${escapeHtml(op.texto)}</span>
            </button>`).join("")}</div>` : `<button class="show-answers-btn" data-action="show-answers" aria-expanded="false">Mostrar respuestas</button>`}
          ${isExam ? `<button class="blank-btn" data-action="answer-blank">Dejar en blanco</button>` : ""}
          ${isExam ? renderExamNavigation() : ""}
        </section>
      </div>
    </main>`;
  if (isExam) startExamTimer();
}

function renderExamNavigation() {
  const s = state.session;
  return `<div class="exam-navigation">
    <button class="btn-quiet" data-action="exam-prev" ${s.index === 0 ? "disabled" : ""}>&larr; Anterior</button>
    <button class="btn-quiet" data-action="open-question-menu">Preguntas</button>
    <button class="btn-quiet" data-action="exam-next" ${s.index === s.queue.length - 1 ? "disabled" : ""}>Siguiente &rarr;</button>
    <button class="btn-primary" data-action="finish-exam">Finalizar examen</button>
  </div>`;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function startExamTimer() {
  clearInterval(state.examTimerId);
  state.examTimerId = setInterval(() => {
    const timer = document.getElementById("exam-timer");
    if (timer && state.session?.kind === "exam") timer.textContent = formatDuration(Date.now() - state.session.startedAt);
  }, 1000);
}

function renderStatusPanel() {
  const s = state.session;
  if (s.kind === "exam") {
    const done = s.answers.filter((answer) => answer !== null).length;
    const pct = Math.round((done / s.queue.length) * 100);
    return `
      <aside class="quiz-status">
        <div class="quiz-status__block">
          <span class="quiz-status__label">Examen</span>
          <span class="quiz-status__value">Pregunta ${s.index + 1}</span>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="quiz-status__block"><span class="quiz-status__label">Respondidas</span><span class="quiz-status__value">${done} / ${s.queue.length}</span></div><div class="quiz-status__block"><span class="quiz-status__label">Tiempo</span><span class="quiz-status__value" id="exam-timer">${formatDuration(Date.now() - s.startedAt)}</span></div>
        <button class="end-session" data-action="abandon-exam">Abandonar examen</button>
      </aside>
    `;
  }
  const { correct, wrong, total } = s.stats;
  const label = s.kind === "tema" ? escapeHtml(s.temaNombre) : s.kind === "revision" ? "Preguntas sin validar" : "Todos los temas";
  return `
    <aside class="quiz-status">
      <div class="quiz-status__block">
        <span class="quiz-status__label">${s.kind === "tema" ? "Tema" : "Modo"}</span>
        <span class="quiz-status__value" style="font-size:14px;font-family:var(--f-body);font-weight:600">${label}</span>
      </div>
      <div class="quiz-status__block">
        <span class="quiz-status__label">Aciertos</span>
        <span class="quiz-status__value good">${correct}</span>
      </div>
      <div class="quiz-status__block">
        <span class="quiz-status__label">Fallos</span>
        <span class="quiz-status__value bad">${wrong}</span>
      </div>
      <div class="quiz-status__block">
        <span class="quiz-status__label">Respondidas</span>
        <span class="quiz-status__value">${total}</span>
      </div>
      <button class="end-session" data-action="go-home">Terminar sesión</button>
    </aside>
  `;
}

function examScore(answers) {
  let correct = 0,
    wrong = 0;
  answers.forEach((a) => {
    if (a.selected === null) return;
    if (a.correct) correct++;
    else wrong++;
  });
  return correct - wrong * EXAM_PENALTY;
}

/* --- responder --- */

function showAnswers() {
  const s = state.session;
  if (!s || s.answersRevealed) return;
  s.answersRevealed = true;
  renderQuiz();
}

function handleAnswer(selectedIndex) {
  const s = state.session;
  if (s.kind === "exam") {
    const firstAnswer = s.answers[s.index] === null;
    s.answers[s.index] = selectedIndex;
    renderQuiz();
    if (firstAnswer && s.index < s.queue.length - 1) goExamQuestion(s.index + 1);
    return;
  }
  if (s.answered || !s.answersRevealed) return;
  const q = currentQuestion();
  const isCorrect = selectedIndex === q.correcta;
  s.answered = true;
  s.selected = selectedIndex;

  s.stats.total++;
  if (isCorrect) s.stats.correct++;
  else s.stats.wrong++;

  paintAnswerState(q, selectedIndex);
}

function handleBlank() {
  const s = state.session;
  if (!s || s.kind !== "exam") return;
  s.answers[s.index] = null;
  if (s.index < s.queue.length - 1) goExamQuestion(s.index + 1);
  else renderQuiz();
}

function paintAnswerState(q, selectedIndex) {
  const s = state.session;
  const optionsEl = document.getElementById("options");
  const buttons = optionsEl.querySelectorAll(".option");
  buttons.forEach((btn) => {
    const idx = parseInt(btn.dataset.index, 10);
    btn.disabled = true;
    if (idx === q.correcta) btn.classList.add("is-correct");
    else if (idx === selectedIndex) btn.classList.add("is-wrong");
    else btn.classList.add("is-muted");
  });

  const blankBtn = document.querySelector(".blank-btn");
  if (blankBtn) blankBtn.remove();

  const card = document.getElementById("q-card");

  // sello (vive en flujo normal dentro de #stamp-slot, nunca se solapa con el texto)
  const stamp = document.createElement("div");
  const gotItRight = selectedIndex === q.correcta;
  stamp.className = `stamp ${gotItRight ? "ok" : "no"}`;
  stamp.textContent = selectedIndex === null ? "En blanco" : gotItRight ? "Correcto" : "Incorrecto";
  const slot = document.getElementById("stamp-slot");
  slot.style.minHeight = "66px";
  slot.style.marginBottom = "6px";
  slot.appendChild(stamp);

  // explicación
  const explanation = document.createElement("div");
  explanation.className = "explanation";
  explanation.innerHTML = `
    <p class="explanation__label">Explicación</p>
    <p class="explanation__text">${linkify(q.explicacion)}</p>
    <div class="q-card__footer">
      <button class="btn-primary" data-action="next">Siguiente pregunta</button>
    </div>
  `;
  card.appendChild(explanation);

  // actualiza el panel lateral en vivo
  const shell = document.querySelector(".quiz-shell");
  if (shell) shell.firstElementChild.outerHTML = renderStatusPanel();
}

function goNext() {
  const s = state.session;
  if (!s.answered) return;

  // azar / tema / revisión: siguiente pregunta aleatoria del conjunto aplicable
  const prevId = s.current.id;
  s.current = pickNext(s.pool, prevId);
  s.answered = false;
  s.answersRevealed = false;
  s.selected = null;
  s.displayOptions = null;
  s.displayQuestionId = null;
  renderQuiz();
}


function goExamQuestion(index) {
  const s = state.session;
  if (!s || s.kind !== "exam" || index < 0 || index >= s.queue.length) return;
  s.index = index;
  renderQuiz();
}

function openQuestionMenu() {
  const s = state.session;
  if (!s || s.kind !== "exam") return;
  const dialog = document.createElement("div");
  dialog.className = "question-menu-backdrop";
  dialog.innerHTML = `<section class="question-menu" role="dialog" aria-modal="true" aria-labelledby="question-menu-title">
    <div class="question-menu__header"><h2 id="question-menu-title">Ir a una pregunta</h2><button class="btn-quiet" data-action="close-question-menu">Cerrar</button></div>
    <p>Selecciona una pregunta. Las que ya tienen respuesta aparecen marcadas.</p>
    <div class="question-menu__grid">${s.queue.map((_, i) => `<button class="question-menu__number ${s.answers[i] !== null ? "is-answered" : ""} ${i === s.index ? "is-current" : ""}" data-action="go-question" data-question-index="${i}" aria-label="Pregunta ${i + 1}${s.answers[i] !== null ? ", respondida" : ""}">${i + 1}</button>`).join("")}</div>
  </section>`;
  app.appendChild(dialog);
  dialog.querySelector("button").focus();
}

function closeQuestionMenu() { document.querySelector(".question-menu-backdrop")?.remove(); }

/* ------------------------------------------------------------------------
   Examen: fin y resumen
   ------------------------------------------------------------------------ */

function finishExam() {
  const s = state.session;
  if (!s || s.kind !== "exam") return;
  clearInterval(state.examTimerId);
  const answers = s.queue.map((question, index) => {
        const selected = s.answers[index];
        const displayOptions = s.optionOrders[index] || buildDisplayOptions(question);
        const selectedOption = displayOptions.find((option) => option.csvIndex === selected);
        return { question, selected, selectedDisplayIndex: selectedOption ? selectedOption.displayIndex : null, displayOptions, correct: selected === question.correcta };
      });
  const correct = answers.filter((a) => a.selected !== null && a.correct).length;
  const wrong = answers.filter((a) => a.selected !== null && !a.correct).length;
  const blank = answers.filter((a) => a.selected === null).length;
  const score = examScore(answers);

  const entry = {
    fecha: new Date().toISOString(),
    total: s.queue.length,
    correct,
    wrong,
    blank,
    score,
    duracionMs: Date.now() - s.startedAt,
    detalle: answers.map(historyDetailFromAnswer),
  };
  saveExamResult(entry);
  state.session.finished = entry;
  renderExamSummary(entry);
}

/** Crea una instantánea autocontenida para que el historial no dependa del banco de preguntas. */
function historyDetailFromAnswer(answer) {
  const { question, selected, selectedDisplayIndex, displayOptions } = answer;
  const correctOption = displayOptions.find((option) => option.csvIndex === question.correcta);
  const selectedOption = displayOptions.find((option) => option.csvIndex === selected);
  return {
    pregunta: question.pregunta,
    respuestaDada: selected === null
      ? "Dejada en blanco"
      : `${letterFor((selectedOption?.displayIndex || selectedDisplayIndex || selected) - 1)}. ${selectedOption?.texto || question.opciones[selected - 1]}`,
    respuestaCorrecta: `${letterFor((correctOption?.displayIndex || question.correcta) - 1)}. ${correctOption?.texto || question.opciones[question.correcta - 1]}`,
    explicacion: question.explicacion,
    estado: selected === null ? "blank" : selected === question.correcta ? "ok" : "no",
  };
}

function renderReviewItem(detail) {
  // Las entradas antiguas se siguen mostrando si existían antes de las instantáneas de texto.
  const legacy = !detail.respuestaDada;
  const status = detail.estado || (detail.seleccionada === null ? "blank" : detail.seleccionada === detail.correcta ? "ok" : "no");
  const correctOption = legacy && (detail.opcionesMuestreadas || []).find((option) => option.csvIndex === detail.correcta);
  const givenAnswer = legacy
    ? detail.seleccionada === null
      ? "Dejada en blanco"
      : `${letterFor((detail.seleccionadaMuestreo || detail.seleccionada) - 1)}. ${detail.opciones?.[detail.seleccionada - 1] || ""}`
    : detail.respuestaDada;
  const correctAnswer = legacy
    ? `${letterFor((correctOption?.displayIndex || detail.correcta) - 1)}. ${detail.opciones?.[detail.correcta - 1] || ""}`
    : detail.respuestaCorrecta;
  return `
    <article class="review-item ${status}">
      <p class="review-item__q">${escapeHtml(detail.pregunta)}</p>
      <p class="review-item__a"><strong>Tu respuesta:</strong> ${escapeHtml(givenAnswer)}</p>
      <p class="review-item__a"><strong>Respuesta correcta:</strong> ${escapeHtml(correctAnswer)}</p>
      <p class="review-item__a"><strong>Explicación:</strong> ${linkify(detail.explicacion)}</p>
    </article>
  `;
}

function renderExamSummary(entry) {
  state.screen = "exam-summary";
  app.innerHTML = `
    ${masthead()}
    <main>
      <p class="file-ref">Acta de calificación</p>
      <div class="summary-card">
        <p class="summary-card__eyebrow">Puntuación final</p>
        <p class="summary-card__score">${formatScore(entry.score)}<span> / ${entry.total}</span></p>
        <div class="summary-breakdown">
          <div class="good"><div class="n">${entry.correct}</div><div class="l">Aciertos</div></div>
          <div class="bad"><div class="n">${entry.wrong}</div><div class="l">Fallos</div></div>
          <div><div class="n">${entry.blank}</div><div class="l">En blanco</div></div>
          <div><div class="n">${formatDuration(entry.duracionMs)}</div><div class="l">Tiempo empleado</div></div>
        </div>
        <div class="summary-actions">
          <button class="btn-primary" data-action="go-examen">Repetir examen</button>
          <button class="btn-quiet" data-action="go-home">Volver al inicio</button>
          <button class="btn-quiet" data-action="toggle-review">Revisar preguntas</button>
        </div>
      </div>
      <div class="review-list" id="review-list" style="display:none">
        ${entry.detalle.map(renderReviewItem).join("")}
      </div>
    </main>
  `;
}

function toggleReview() {
  const el = document.getElementById("review-list");
  if (!el) return;
  el.style.display = el.style.display === "none" ? "flex" : "none";
}

function toggleHistoryReview(index, button) {
  const review = document.getElementById(`history-review-${index}`);
  if (!review) return;
  const willShow = review.hidden;
  review.hidden = !willShow;
  button.setAttribute("aria-expanded", String(willShow));
  button.textContent = willShow ? "Ocultar preguntas" : "Ver preguntas";
}

/* ------------------------------------------------------------------------
   Pantalla: historial
   ------------------------------------------------------------------------ */

function renderHistory() {
  state.screen = "history";
  const history = loadHistory();
  app.innerHTML = `
    ${masthead()}
    <main>
      <button class="back-link" data-action="go-home">&larr; Volver</button>
      <div class="home-intro">
        <h2>Historial de exámenes</h2>
        <p>Registro de convocatorias realizadas en este dispositivo.</p>
      </div>
      ${
        history.length === 0
          ? `<div class="empty-state"><div class="glyph">&#128196;</div><p>Todavía no hay ningún examen registrado.</p></div>`
          : `<div class="history-list">
              ${history
                .map(
                  (h, i) => `
                <div class="history-row">
                  <span class="history-row__date">${new Date(h.fecha).toLocaleString("es-ES")}</span>
                  <span>${h.correct} aciertos &middot; ${h.wrong} fallos &middot; ${h.blank} en blanco &middot; ${formatDuration(h.duracionMs || 0)}</span>
                  <span class="history-row__score">${formatScore(h.score)} / ${h.total}</span>
                  <button class="btn-quiet" data-action="toggle-history-review" data-history-index="${i}" aria-expanded="false">Ver preguntas</button>
                </div>
                <div class="review-list history-review-list" id="history-review-${i}" hidden>
                  ${(h.detalle || []).map(renderReviewItem).join("") || '<p class="history-review-empty">Este examen se guardó antes de que se registrara el detalle de sus preguntas.</p>'}
                </div>
              `
                )
                .join("")}
            </div>
            <div class="summary-actions">
              <button class="btn-quiet" data-action="clear-history">Borrar historial</button>
            </div>`
      }
    </main>
  `;
}

/* ------------------------------------------------------------------------
   Delegación de eventos
   ------------------------------------------------------------------------ */

app.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;

  switch (action) {
    case "go-home":
      renderHome();
      break;
    case "go-history":
      renderHistory();
      break;
    case "clear-history":
      if (confirm("¿Borrar todo el historial de exámenes? Esta acción no se puede deshacer.")) {
        clearHistory();
        renderHistory();
      }
      break;
    case "go-azar":
      startAzar();
      break;
    case "go-revision":
      startRevision();
      break;
    case "go-examen":
      startExam();
      break;
    case "go-tema":
      renderTemaPicker();
      break;
    case "toggle-tema":
      toggleTemaSelection(el.dataset.tema);
      break;
    case "start-selected-temas":
      startSelectedTemas();
      break;
    case "answer":
      handleAnswer(parseInt(el.dataset.index, 10));
      break;
    case "show-answers":
      showAnswers();
      break;
    case "answer-blank":
      handleBlank();
      break;
    case "next":
      goNext();
      break;
    case "toggle-review":
      toggleReview();
      break;
    case "toggle-history-review":
      toggleHistoryReview(el.dataset.historyIndex, el);
      break;
    case "exam-prev":
      goExamQuestion(state.session.index - 1);
      break;
    case "exam-next":
      goExamQuestion(state.session.index + 1);
      break;
    case "open-question-menu":
      openQuestionMenu();
      break;
    case "close-question-menu":
      closeQuestionMenu();
      break;
    case "go-question":
      closeQuestionMenu();
      goExamQuestion(parseInt(el.dataset.questionIndex, 10));
      break;
    case "finish-exam":
      finishExam();
      break;
    case "abandon-exam":
      if (confirm("¿Abandonar la sesión? Se perderá el progreso y no se guardará puntuación.")) {
        clearInterval(state.examTimerId);
        renderHome();
      }
      break;
  }
});

init();
