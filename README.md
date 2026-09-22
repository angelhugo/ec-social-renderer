# Patch v0.3.1

Corrige el flujo del ejemplo después de la refactorización v0.3.

## Cambio

Al pulsar **Cargar ejemplo**:

- se carga el JSON de ejemplo;
- se cargan automáticamente:
  - `examples/photos/photo_1.jpg`
  - `examples/photos/photo_2.jpg`
  - `examples/photos/photo_3.jpg`
  - `examples/photos/photo_4.jpg`
  - `examples/photos/photo_5.jpg`
- cada slide aparece ya compuesto;
- el selector muestra **Cambiar imagen**.

Al cargar un `job.json` real desde el equipo:

- las piezas siguen apareciendo sin fotografía;
- el usuario selecciona la foto correspondiente.

## Requisito

La carpeta existente:

`examples/photos/`

debe conservar los cinco archivos de prueba.

## GitHub

Reemplaza únicamente:

`app.js`

## Commit

**Commit message**

`Restore example images after renderer refactor v0.3.1`

**Description**

`Restores automatic sample-photo loading for the built-in gallery example and changes the per-slide action to Change image when an image is already assigned.`
