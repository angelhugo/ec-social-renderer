# EC Social Renderer v0.2.1 — patch

Reemplaza estos cuatro archivos en la raíz del repositorio:

- index.html
- styles.css
- app.js
- template-ec-ig-galeria-01.js

No reemplaces `assets/`.

Cambios:
- El ejemplo está embebido en app.js y ya no depende de `examples/job-ejemplo.json`.
- Cada slide muestra una caja de texto editable de forma explícita.
- Cada slide muestra un botón visible `Subir fotografía` / `Cambiar fotografía`.
- Se agregan query strings v0.2.1 para evitar que GitHub Pages o el navegador reutilicen JS/CSS antiguos en caché.

Commit sugerido:
`Fix inline editor and per-slide photo upload v0.2.1`

Descripción sugerida:
`Embeds the example job, makes text editing and per-slide photo upload explicit, and adds cache busting so GitHub Pages loads the latest renderer files.`
