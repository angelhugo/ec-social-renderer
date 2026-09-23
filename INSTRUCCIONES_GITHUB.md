# Instalación v0.3.8

Este ZIP es un **patch** sobre v0.3.7, no un repositorio vacío. Conserva `assets/` con los logos oficiales y `examples/photos/` con las cinco fotos de ejemplo.

Reemplaza en GitHub Web exactamente estas rutas:

- `index.html`
- `styles.css`
- `app.js`
- `core/renderer.js`
- `core/project.js`
- `formats/gallery.js`
- `templates/EC_IG_GALERIA_01/template.js`
- `README.md`

Agrega estos archivos nuevos para documentación y pruebas:

- `PROMPT_EC_SOCIAL_STUDIO_v038.md`
- `examples/job-titulo-opcional.json`

**Commit message:** `Add optional interior titles and layout variants v0.3.8`

**Description:** `Adds an optional title field to gallery content slides, implements titled and untitled Noto Serif layouts with fixed spacing and overflow validation, preserves manual line breaks, and updates the example, master prompt, and full README.`

Después del deploy, confirma que el encabezado diga **v0.3.8**, pulsa **Cargar ejemplo** y comprueba los dos layouts: con título y sin título. Borra el título de un slide; el divisor debe desaparecer y el cuerpo subir al margen superior. Cambia una foto de prueba, corrige overflow y verifica la exportación.
