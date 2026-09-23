# EC Social Renderer

**Versión:** v0.3.8 · **Estado:** prototipo en pruebas editoriales · **Formato activo:** Instagram / Fotogalería

Aplicación web estática del MediaLab de El Comercio que convierte el JSON editorial de EC Social Studio en piezas visuales editables y exportables. La herramienta no llama a la API de OpenAI ni envía las fotografías a un backend: las procesa en el navegador.

## Flujo de trabajo

1. Genera una propuesta en EC Social Studio, revísala y solicita **Generar JSON**.
2. Copia el JSON y pégalo en el cuadro inicial de EC Social Renderer; el botón **Generar piezas** se habilita al validarlo. También puedes cargar un archivo `.json` o pulsar **Cargar ejemplo**.
3. El renderer presenta todas las piezas con imágenes de prueba que deben reemplazarse. **Cambiar imagen** permite seleccionar una fotografía local; el zoom y el desplazamiento aparecen inmediatamente debajo de la vista previa.
4. Edita el **Título (opcional)** cuando el JSON incluya uno. Si no existe, el editor muestra un discreto botón **+ Añadir título**; el campo y el divisor no aparecen en la pieza hasta que escribas uno. También puedes usar **Quitar título**. El **Texto** siempre se edita en su propio campo y, al quitar el título, empieza arriba sin dejar hueco. La portada mantiene un único campo de titular.
5. Corrige cualquier overflow, sustituye todas las imágenes de ejemplo y exporta los PNG o la galería en ZIP. Puedes guardar también `project.json`.

Las fotos de ejemplo no se consideran definitivas. El ZIP queda bloqueado mientras exista cualquier imagen de ejemplo o overflow. El PNG individual se habilita por slide cuando su propia imagen ha sido reemplazada y el texto es válido.

## Contrato editorial JSON

El formato `fotogaleria` sigue usando `schema_version: "1.0"` y `template: "EC_IG_GALERIA_01"` para preservar los JSON existentes. El campo nuevo `title` es **opcional y exclusivo de los slides interiores**. Si falta o está vacío, la plantilla muestra solo el cuerpo.

```json
{
  "schema_version": "1.0",
  "template": "EC_IG_GALERIA_01",
  "source_url": "https://elcomercio.pe/...",
  "network": "instagram",
  "format": "fotogaleria",
  "approach": "Explicativo",
  "objective": "Informar",
  "slides": [
    {
      "id": 1,
      "type": "cover",
      "text": "Titular de portada",
      "image_hint": "Fotografía principal"
    },
    {
      "id": 2,
      "type": "content",
      "title": "Un eje de la noticia",
      "text": "Explicación breve de ese eje.",
      "image_hint": "Fotografía relacionada"
    },
    {
      "id": 3,
      "type": "content",
      "text": "Párrafo independiente sin título.",
      "image_hint": "Fotografía de contexto"
    }
  ],
  "caption": "Texto del caption"
}
```

No incluyas fotos, tipografías, coordenadas, crop, colores o tamaños en el JSON: son decisiones visuales de la plantilla. Los saltos de línea manuales dentro del campo `text` se respetan (deben ir codificados como `\n` en el JSON).

El archivo `examples/job-titulo-opcional.json` permite probar ambas variantes.

## Plantilla `EC_IG_GALERIA_01`

El lienzo es **1080 × 1350 px (4:5)**. Mantiene la foto superior en interiores (807 px), los logos oficiales y el filete dorado inferior. La portada conserva su caja amarilla con titular centrado verticalmente.

En interiores los textos **siempre empiezan en la misma posición superior** del bloque blanco (`y = 858`, `x = 108`):

| Modalidad | Título | Cuerpo | Validación |
|---|---|---|---|
| Sin título | No aparece título ni divisor | Noto Serif Regular 52 px | Máximo 8 líneas y altura disponible |
| Con título | Noto Serif Bold 56 px, máximo 2 líneas | Noto Serif Regular 40 px, máximo 5 líneas | Validación de altura total de título + divisor + cuerpo |

Con título se muestra un divisor dorado de 4 px, separado 14 px del título y 23 px del cuerpo. Los márgenes laterales son 108 px en ambos casos. La tipografía y los espacios son constantes: **nunca se achica la letra para hacer entrar más texto**. Un texto largo genera overflow y debe editarse o dividirse. El renderer respeta los saltos de línea manuales introducidos por el editor y los cuenta para validar.

Las medidas anteriores son parámetros de `templates/EC_IG_GALERIA_01/template.js`, no del motor general. El diseño se puede ajustar sin cambiar la estructura del formato.

## Arquitectura

```text
index.html                    # interfaz y carga de scripts
styles.css                    # estilos de la aplicación
app.js                        # orquestación del editor
core/
  renderer.js                 # imágenes, crop y medición de texto
  project.js                  # validación y serialización
  export.js                   # PNG / JSON / ZIP
formats/
  gallery.js                  # contrato de fotogalería y campos editables
templates/
  EC_IG_GALERIA_01/
    template.js               # composición y validación visual
assets/
  logo-ec-white.png           # logo oficial de portada
  logo-ec-yellow.png          # logo oficial de interiores
examples/
  job-titulo-opcional.json
  photos/photo_1.jpg ... photo_5.jpg
README.md
PROMPT_EC_SOCIAL_STUDIO_v038.md
```

**Core:** no debe codificar la apariencia particular de una plantilla. Contiene funciones generales para dibujar fotografías, envolver texto, gestionar proyectos y exportar.

**Formato:** `window.EC_FORMATS.fotogaleria` valida y normaliza el JSON, define los campos editables y serializa `slides`. El campo `title` opcional se conserva en `project.json` cuando existe y se omite cuando está vacío.

**Plantilla:** `window.EC_TEMPLATES.EC_IG_GALERIA_01` declara sus assets y canvas e implementa `loadAssets()`, `render()`, `validate()` y `exportFilename()`. La validación y el dibujo utilizan el mismo cálculo de líneas y alturas para evitar diferencias entre el preview y el exportado.

**Aplicación:** presenta los campos que declare el formato, asigna fotos de ejemplo de manera cíclica y utiliza la plantilla seleccionada para renderizar y validar cada pieza.

## `project.json` y exportación

`project.json` conserva el JSON editorial con textos y títulos editados, nombre y estado de placeholder de cada imagen asignada, así como los valores de zoom/desplazamiento. **No incrusta los bytes de las fotos:** guardarlo no permite recuperar las imágenes si se cierra la pestaña. Por ahora, los archivos de imagen deben conservarse por separado.

La galería se descarga en ZIP con un PNG por pieza y `project.json`. También existe descarga individual una vez superadas las validaciones. Las fotografías reales se leen localmente mediante el navegador; Google Fonts suministra Noto Serif y JSZip se carga desde un CDN.

## Publicación gratuita

GitHub Pages: `Settings → Pages → Deploy from a branch → main → /(root)`. Al actualizar, espera a que termine el despliegue. Los JS y CSS del `index.html` llevan `?v=0.3.8` para evitar mezclar versiones en caché. **No reemplaces tus logos oficiales en `assets/`** al instalar un patch.

## Criterios de aceptación de v0.3.8

- Un JSON antiguo sin `title` debe funcionar y usar la variante sin título.
- Un slide con título muestra los dos campos y el divisor dorado; al borrar el título, desaparece el divisor y el cuerpo sube al mismo origen que los demás slides.
- `title` no se muestra ni se admite en portada.
- El texto editado se actualiza de inmediato; Enter provoca un salto de línea visible.
- Se detectan títulos de más de dos líneas, cuerpos de más de cinco líneas con título, y textos de más de ocho líneas sin título, así como desbordamientos por altura.
- El ejemplo, la carga de JSON, los placeholders, los controles de encuadre y la exportación siguen funcionando.
- El archivo de proyecto conserva los títulos editados sin romper los JSON anteriores.

## Historial de versiones

| Versión | Cambio principal |
|---|---|
| v0.1 | Primer renderer de fotogalerías, imágenes y PNG/ZIP. |
| v0.2 | Edición del texto en cada slide y carga de fotos por pieza. |
| v0.2.1 | Correcciones de interfaz y controles visibles. |
| v0.2.2 | Límite de ocho líneas en interiores. |
| v0.3 | Refactorización en core, formatos y plantillas. |
| v0.3.1 | Recuperación de fotos al cargar el ejemplo. |
| v0.3.2 | Fotos de ejemplo automáticas para cualquier JSON. |
| v0.3.3 | Ejemplo incorporado en `app.js` y versionado de caché. |
| v0.3.4 | Compatibilidad de nombres en el core de proyectos. |
| v0.3.5 | Compatibilidad defensiva en `app.js`. |
| v0.3.6 | Pegado directo de JSON como flujo principal. |
| v0.3.7 | Titular de portada centrado y controles de encuadre debajo del preview. |
| **v0.3.8** | **Título interior opcional, jerarquía tipográfica y validación de ambas variantes; se respetan los saltos manuales.** |

## Próximos formatos

La arquitectura prevé incorporar `single_post`, `story`, `story_sequence`, `quote` y `data_card`, cada uno con sus propias plantillas. Este patch no añade formatos nuevos: estabiliza el contrato editorial y visual de la fotogalería existente.
