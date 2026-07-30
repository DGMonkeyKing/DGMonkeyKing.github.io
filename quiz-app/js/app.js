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
  session: null, // sesión activa (azar / tema / examen)
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

/* ------------------------------------------------------------------------
   Pantalla: inicio
   ------------------------------------------------------------------------ */

function renderHome() {
  state.screen = "home";
  state.session = null;
  app.innerHTML = `
    ${masthead()}
    <main>
      <p class="file-ref">Legajo N.º 1 — Sala de estudio</p>
      <div class="home-intro">
        <h2>¿Cómo quieres estudiar hoy?</h2>
        <p>Elige un modo de trabajo. Las preguntas proceden del banco verificado de los
        temas cargados en este expediente.</p>
      </div>
      <div class="mode-grid">
        <button class="mode-card" data-action="go-azar" data-tab="Modo 01">
          <h3>Al azar</h3>
          <p>Preguntas de todos los temas, en orden aleatorio, sin límite ni cronómetro.
          Ideal para repasar con calma.</p>
          <span class="go">Empezar &rarr;</span>
        </button>
        <button class="mode-card" data-action="go-examen" data-tab="Modo 02">
          <h3>Examen</h3>
          <p>${EXAM_SIZE} preguntas repartidas entre todos los temas. Acierto = +1,
          fallo = &minus;1/3. Queda registro de la nota sobre ${EXAM_SIZE}.</p>
          <span class="go">Convocar examen &rarr;</span>
        </button>
        <button class="mode-card" data-action="go-tema" data-tab="Modo 03">
          <h3>Por tema</h3>
          <p>Elige un tema concreto del expediente y practica solo con sus preguntas.</p>
          <span class="go">Elegir tema &rarr;</span>
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
        <h2>Elige un tema</h2>
        <p>Se te preguntará únicamente sobre el contenido de ese tema.</p>
      </div>
      <div class="tema-list" id="tema-list">
        ${state.manifest.temas
          .map(
            (t) => `
          <button class="tema-row" data-action="start-tema" data-tema="${t.id}">
            <span class="tema-row__label">
              <span class="tag">${escapeHtml(t.titulo)}</span>
              <strong>${escapeHtml(t.nombre)}</strong>
            </span>
            <span class="tema-row__count" data-count="${t.id}">cargando&hellip;</span>
          </button>
        `
          )
          .join("")}
      </div>
    </main>
  `;

  // Carga los recuentos en paralelo sin bloquear el render
  state.manifest.temas.forEach((t) => {
    loadTema(t).then((qs) => {
      const el = app.querySelector(`[data-count="${t.id}"]`);
      if (el) el.textContent = `${qs.length} preguntas`;
    });
  });
}

/* ------------------------------------------------------------------------
   Sesión: azar / tema
   ------------------------------------------------------------------------ */

async function startAzar() {
  const pool = await loadAllQuestions();
  state.session = {
    kind: "azar",
    pool,
    current: pickNext(pool, null),
    answered: false,
    selected: null,
    stats: { correct: 0, wrong: 0, total: 0 },
  };
  renderQuiz();
}

async function startTema(temaId) {
  const tema = state.manifest.temas.find((t) => t.id === temaId);
  const pool = await loadTema(tema);
  state.session = {
    kind: "tema",
    temaNombre: tema.nombre,
    pool,
    current: pickNext(pool, null),
    answered: false,
    selected: null,
    stats: { correct: 0, wrong: 0, total: 0 },
  };
  renderQuiz();
}

async function startExam() {
  const all = await loadAllQuestions();
  const size = Math.min(EXAM_SIZE, all.length);
  const queue = shuffle(all).slice(0, size);
  state.session = {
    kind: "exam",
    queue,
    index: 0,
    answers: [], // { question, selected (índice CSV 1-4|null), selectedDisplayIndex, correct }
    answered: false,
    selected: null,
    startedAt: Date.now(),
  };
  renderQuiz();
}

/* ------------------------------------------------------------------------
   Pantalla: cuestionario (compartida por los tres modos)
   ------------------------------------------------------------------------ */

function currentQuestion() {
  const s = state.session;
  return s.kind === "exam" ? s.queue[s.index] : s.current;
}

function renderQuiz() {
  state.screen = "quiz";
  const s = state.session;
  const q = currentQuestion();

  if (!q) {
    renderHome();
    return;
  }

  const displayOptions = displayOptionsForCurrentQuestion();

  app.innerHTML = `
    ${masthead()}
    <main>
      <div class="quiz-shell">
        ${renderStatusPanel()}
        <section class="q-card" id="q-card">
          <div class="stamp-slot" id="stamp-slot"></div>
          <div class="q-card__meta">
            <span>${escapeHtml(q.temaNombre)}</span>
            <span>${escapeHtml(q.archivoNombre)}</span>
          </div>
          <p class="q-card__text">${escapeHtml(q.pregunta)}</p>
          <div class="options" id="options" role="group" aria-label="Opciones de respuesta">
            ${displayOptions
              .map(
                (op) => `
              <button class="option" data-action="answer" data-index="${op.csvIndex}" data-display-index="${op.displayIndex}">
                <span class="option__letter">${letterFor(op.displayIndex - 1)}</span>
                <span>${escapeHtml(op.texto)}</span>
              </button>
            `
              )
              .join("")}
          </div>
          ${
            s.kind === "exam"
              ? `<button class="blank-btn" data-action="answer-blank">Dejar en blanco</button>`
              : ""
          }
        </section>
      </div>
    </main>
  `;
}

function renderStatusPanel() {
  const s = state.session;
  if (s.kind === "exam") {
    const done = s.index;
    const pct = Math.round((done / s.queue.length) * 100);
    return `
      <aside class="quiz-status">
        <div class="quiz-status__block">
          <span class="quiz-status__label">Examen</span>
          <span class="quiz-status__value">${done + 1} / ${s.queue.length}</span>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="quiz-status__block">
          <span class="quiz-status__label">Puntuación provisional</span>
          <span class="quiz-status__value">${formatScore(examScore(s.answers))}</span>
        </div>
        <button class="end-session" data-action="abandon-exam">Abandonar examen</button>
      </aside>
    `;
  }
  const { correct, wrong, total } = s.stats;
  const label = s.kind === "tema" ? escapeHtml(s.temaNombre) : "Todos los temas";
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

function handleAnswer(selectedIndex) {
  const s = state.session;
  if (s.answered) return;
  const q = currentQuestion();
  const isCorrect = selectedIndex === q.correcta;
  const selectedOption = displayOptionsForCurrentQuestion().find((op) => op.csvIndex === selectedIndex);

  s.answered = true;
  s.selected = selectedIndex;

  if (s.kind === "exam") {
    s.answers.push({
      question: q,
      selected: selectedIndex,
      selectedDisplayIndex: selectedOption ? selectedOption.displayIndex : null,
      displayOptions: displayOptionsForCurrentQuestion(),
      correct: isCorrect,
    });
  } else {
    s.stats.total++;
    if (isCorrect) s.stats.correct++;
    else s.stats.wrong++;
  }

  paintAnswerState(q, selectedIndex);
}

function handleBlank() {
  const s = state.session;
  if (s.answered || s.kind !== "exam") return;
  const q = currentQuestion();
  s.answered = true;
  s.selected = null;
  s.answers.push({
    question: q,
    selected: null,
    selectedDisplayIndex: null,
    displayOptions: displayOptionsForCurrentQuestion(),
    correct: false,
  });
  paintAnswerState(q, null);
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
      <button class="btn-primary" data-action="next">${
        s.kind === "exam" && s.index >= s.queue.length - 1 ? "Ver resultados" : "Siguiente pregunta"
      }</button>
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

  if (s.kind === "exam") {
    s.index++;
    s.answered = false;
    s.selected = null;
    s.displayOptions = null;
    s.displayQuestionId = null;
    if (s.index >= s.queue.length) {
      finishExam();
      return;
    }
    renderQuiz();
    return;
  }

  // azar / tema: siguiente pregunta aleatoria del pool
  const prevId = s.current.id;
  s.current = pickNext(s.pool, prevId);
  s.answered = false;
  s.selected = null;
  s.displayOptions = null;
  s.displayQuestionId = null;
  renderQuiz();
}

/* ------------------------------------------------------------------------
   Examen: fin y resumen
   ------------------------------------------------------------------------ */

function finishExam() {
  const s = state.session;
  const correct = s.answers.filter((a) => a.selected !== null && a.correct).length;
  const wrong = s.answers.filter((a) => a.selected !== null && !a.correct).length;
  const blank = s.answers.filter((a) => a.selected === null).length;
  const score = examScore(s.answers);

  const entry = {
    fecha: new Date().toISOString(),
    total: s.queue.length,
    correct,
    wrong,
    blank,
    score,
    duracionMs: Date.now() - s.startedAt,
    detalle: s.answers.map((a) => ({
      pregunta: a.question.pregunta,
      temaNombre: a.question.temaNombre,
      opciones: a.question.opciones,
      opcionesMuestreadas: a.displayOptions,
      correcta: a.question.correcta,
      seleccionada: a.selected,
      seleccionadaMuestreo: a.selectedDisplayIndex,
      explicacion: a.question.explicacion,
    })),
  };
  saveExamResult(entry);
  state.session.finished = entry;
  renderExamSummary(entry);
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
        </div>
        <div class="summary-actions">
          <button class="btn-primary" data-action="go-examen">Repetir examen</button>
          <button class="btn-quiet" data-action="go-home">Volver al inicio</button>
          <button class="btn-quiet" data-action="toggle-review">Revisar preguntas</button>
        </div>
      </div>
      <div class="review-list" id="review-list" style="display:none">
        ${entry.detalle
          .map((d) => {
            const cls = d.seleccionada === null ? "blank" : d.seleccionada === d.correcta ? "ok" : "no";
            const correctaMuestreo = (d.opcionesMuestreadas || []).find((op) => op.csvIndex === d.correcta);
            const tuTexto =
              d.seleccionada === null
                ? "Dejada en blanco"
                : `Tu respuesta: ${letterFor((d.seleccionadaMuestreo || d.seleccionada) - 1)} (CSV ${d.seleccionada}). ${escapeHtml(d.opciones[d.seleccionada - 1])}`;
            const correctaTexto = `Correcta: ${letterFor(((correctaMuestreo && correctaMuestreo.displayIndex) || d.correcta) - 1)} (CSV ${d.correcta}). ${escapeHtml(d.opciones[d.correcta - 1])}`;
            return `
            <div class="review-item ${cls}">
              <p class="review-item__q">${escapeHtml(d.pregunta)}</p>
              <p class="review-item__a">${tuTexto}</p>
              <p class="review-item__a">${correctaTexto}</p>
              <p class="review-item__a">${linkify(d.explicacion)}</p>
            </div>
          `;
          })
          .join("")}
      </div>
    </main>
  `;
}

function toggleReview() {
  const el = document.getElementById("review-list");
  if (!el) return;
  el.style.display = el.style.display === "none" ? "flex" : "none";
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
                  <span>${h.correct} aciertos &middot; ${h.wrong} fallos &middot; ${h.blank} en blanco</span>
                  <span class="history-row__score">${formatScore(h.score)} / ${h.total}</span>
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
    case "go-examen":
      startExam();
      break;
    case "go-tema":
      renderTemaPicker();
      break;
    case "start-tema":
      startTema(el.dataset.tema);
      break;
    case "answer":
      handleAnswer(parseInt(el.dataset.index, 10));
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
    case "abandon-exam":
      if (confirm("¿Abandonar el examen? Se perderá el progreso y no se guardará puntuación.")) {
        renderHome();
      }
      break;
  }
});

init();
