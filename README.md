# Patch v0.3.2 — versión definitiva del flujo de imágenes

## Cambio principal

Ahora, al cargar **cualquier `job.json`**, el renderer:

1. crea todas las piezas con sus textos;
2. asigna automáticamente imágenes de ejemplo como placeholders;
3. muestra desde el inicio el botón **Cambiar imagen**;
4. marca internamente esas imágenes como `is_placeholder: true`;
5. bloquea la exportación hasta que todas sean reemplazadas por imágenes reales.

## Qué ve el usuario

- Galería inmediatamente compuesta.
- Nombre del archivo de ejemplo + mensaje:
  `IMAGEN DE EJEMPLO · REEMPLAZAR`
- Estado por pieza:
  `Usando imagen de ejemplo. Debes reemplazarla.`
- Estado global:
  `Debes reemplazar X imagen(es) de ejemplo antes de exportar.`

## Requisito

Debe seguir existiendo esta carpeta en el repo:

examples/photos/
- photo_1.jpg
- photo_2.jpg
- photo_3.jpg
- photo_4.jpg
- photo_5.jpg

## Archivos a reemplazar

Solo:
- `app.js`

## Commit sugerido

Commit message:
`Make placeholder images the default JSON loading flow v0.3.2`

Description:
`Automatically assigns sample placeholder images when any job JSON is loaded, shows Change image as the default action, and blocks export until all placeholder images are replaced.`
