# Arquitectura EC Social Renderer

## Principio

El core no sabe cómo se ve una pieza.

El **formato** define la estructura editorial.

La **plantilla** define la representación visual.

## Contrato de formato

Cada formato se registra en `window.EC_FORMATS` e implementa:

- `validateJob(job)`
- `normalize(job)`
- `serialize(job, items)`
- `getItemLabel(item)`
- `getEditableFields(item)`
- `usesImage(item)`
- `getImageHint(item)`

## Contrato de plantilla

Cada plantilla se registra en `window.EC_TEMPLATES` e implementa:

- `id`
- `format`
- `canvas`
- `loadAssets()`
- `render({ ctx, item, assignment, assets })`
- `validate({ ctx, item })`
- `exportFilename(item)`

La regla de máximo 8 líneas pertenece a `EC_IG_GALERIA_01`, no al core.

## Próximos formatos

Esta arquitectura permitirá añadir sin modificar el core:

- `single_post`
- `story`
- `story_sequence`
- `quote`
- `data_card`
