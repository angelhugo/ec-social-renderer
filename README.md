# EC Social Renderer v0.3

Refactorización interna para convertir el renderer en un motor multi-formato y multi-plantilla.

## Objetivo

Esta versión **no agrega funciones nuevas**. La fotogalería debe seguir funcionando igual que en v0.2.2.

La diferencia es interna: `app.js` ya no sabe cómo se dibuja una fotogalería.

## Estructura

- `core/renderer.js`: utilidades genéricas de canvas, crop y texto.
- `core/project.js`: contrato del job y project.json.
- `core/export.js`: PNG, JSON y ZIP.
- `formats/gallery.js`: estructura editorial de una fotogalería.
- `templates/EC_IG_GALERIA_01/template.js`: diseño, geometría y validación visual.
- `app.js`: interfaz y orquestación.

## Assets

No reemplaces la carpeta `assets`. La plantilla sigue usando tus archivos existentes:

- `assets/logo-ec-white.png`
- `assets/logo-ec-yellow.png`

## Qué subir a GitHub

Reemplaza/sube:

- `index.html`
- `styles.css`
- `app.js`
- `core/`
- `formats/`
- `templates/`

No borres `assets/`.

## Commit sugerido

**Commit message**

`Refactor renderer into modular architecture v0.3`

**Description**

`Separates core rendering, project/export logic, social formats, and visual templates without changing the current Instagram gallery workflow. Prepares the renderer for additional formats such as single posts and stories.`

## Prueba de regresión

1. Cargar ejemplo.
2. Confirmar que aparecen 5 slides.
3. Editar texto.
4. Subir foto por slide.
5. Probar zoom, horizontal y vertical.
6. Llevar un interior a 9 líneas y comprobar overflow.
7. Volver a 8 o menos.
8. Descargar PNG.
9. Descargar ZIP.
10. Guardar `project.json`.
