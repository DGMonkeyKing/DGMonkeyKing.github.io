/**
 * Parser CSV mínimo pero robusto (RFC4180):
 * soporta campos entrecomillados, comas y saltos de línea dentro de comillas,
 * y comillas dobles escapadas ("").
 * Devuelve un array de filas, cada fila un array de strings.
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  // Normaliza saltos de línea
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += c;
  }
  // última celda / fila pendiente
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // descarta filas totalmente vacías (p.ej. línea final en blanco)
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * Convierte el texto crudo de un CSV de preguntas (formato Pregunta,R1..R4,Correcta,Explicación)
 * en un array de objetos pregunta.
 */
function csvToQuestions(text, meta) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  // primera fila = cabecera, se descarta
  const body = rows.slice(1);
  const out = [];
  body.forEach((r, idx) => {
    if (r.length < 7) return; // fila corrupta, se ignora
    const [pregunta, r1, r2, r3, r4, correctaRaw, explicacion] = r;
    const correcta = parseInt(correctaRaw, 10);
    if (![1, 2, 3, 4].includes(correcta)) return;
    out.push({
      id: `${meta.temaId}__${meta.file}__${idx}`,
      temaId: meta.temaId,
      temaNombre: meta.temaNombre,
      archivo: meta.file,
      archivoNombre: meta.archivoNombre || meta.file,
      pregunta: pregunta.trim(),
      opciones: [r1.trim(), r2.trim(), r3.trim(), r4.trim()],
      correcta,
      explicacion: explicacion.trim(),
    });
  });
  return out;
}
