# Legajo — sala de estudio para oposiciones

Aplicación web estática (sin frameworks, sin build) para practicar con el banco de
preguntas tipo test. Tres modos: **al azar**, **examen** (70 preguntas puntuadas) y
**por tema**.

## Cómo ejecutarla

Los navegadores bloquean la lectura de archivos locales (`fetch`) cuando abres
`index.html` con doble clic (protocolo `file://`). Hay que servir la carpeta con un
servidor HTTP mínimo:

```bash
cd legajo-app
python3 -m http.server 8000
# abre http://localhost:8000 en el navegador
```

También funciona con cualquier otro servidor estático (`npx serve`, la extensión
"Live Server" de VS Code, Netlify, GitHub Pages, etc.). No requiere backend: todo
corre en el navegador y el historial de exámenes se guarda en `localStorage`.

## Estructura del proyecto

```
index.html
css/
  styles.css
js/
  app.js          -> lógica de la aplicación (modos, puntuación, pantallas)
  csv-parser.js   -> parser CSV (RFC4180) y conversión a objetos pregunta
  storage.js      -> historial de exámenes en localStorage
preguntas/
  manifest.json   -> índice de temas y sus archivos CSV
  tema_1_constitucion/*.csv
  tema_2_lpac_i/*.csv
  tema_3_lpac_ii/*.csv
```

## Añadir un tema o archivo de preguntas nuevo

1. Crea la carpeta `preguntas/tema_X_nombre/` y coloca dentro los CSV con el mismo
   formato de siempre (7 columnas: `Pregunta, Respuesta 1..4, Respuesta correcta, Explicación`,
   con la respuesta correcta como número 1-4).
2. Añade la entrada correspondiente en `preguntas/manifest.json`:

```json
{
  "id": "tema_X_nombre",
  "titulo": "Tema X",
  "nombre": "Nombre completo del tema",
  "archivos": [
    { "file": "archivo.csv", "nombre": "Nombre descriptivo de esta parte" }
  ]
}
```

No hace falta tocar el código: la app lee el manifiesto en tiempo de ejecución.

## Modos de juego

- **Al azar**: combina las preguntas de todos los temas cargados y las presenta en
  orden aleatorio, sin fin. Lleva un contador de aciertos/fallos de la sesión.
- **Examen**: selecciona 70 preguntas aleatorias del conjunto de todos los temas
  (proporcional al tamaño de cada uno, al salir del mismo fondo común). Acierto = +1
  punto, fallo = −1/3 de punto (equivalente a restar 1 punto cada 3 fallos), y dejar
  en blanco no penaliza. Al terminar se guarda un registro permanente en el
  **Historial** (fecha, nota sobre 70, aciertos/fallos/blancos y el detalle completo
  para repasar cada pregunta).
- **Por tema**: eliges un tema del listado y solo salen preguntas de ese tema.

Una vez respondida una pregunta la respuesta queda bloqueada (no se puede cambiar) y
se muestra siempre la explicación de la respuesta correcta antes de continuar.

## Notas técnicas

- Sin dependencias externas salvo las tipografías (Google Fonts, vía CDN).
- Diseño responsive "mobile first": el panel lateral de estado se convierte en una
  barra superior en pantallas estrechas.
- El historial de exámenes vive en `localStorage` del navegador (clave
  `legajo_historial_examenes_v1`); es local a cada dispositivo/navegador y se puede
  borrar desde la propia pantalla de Historial.
