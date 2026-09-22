# EC Social Renderer

Renderer web del MediaLab de El Comercio para convertir un `job.json` editorial en piezas sociales listas para exportar.

Versión actual: **v0.3.4**
Estado: **prototipo funcional**

---

## 1. Qué es

EC Social Renderer es una aplicación web estática que recibe un archivo `job.json`, aplica una plantilla visual, permite ajustar textos e imágenes y exporta las piezas finales en PNG.

La herramienta forma parte del flujo de **EC Social Studio**:

**EC Social Studio**
- lee una nota;
- define enfoque y objetivo;
- estructura la historia;
- redacta los textos;
- genera sugerencias de imagen;
- produce `job.json`.

**EC Social Renderer**
- carga `job.json`;
- aplica una plantilla;
- muestra una vista previa;
- carga imágenes de ejemplo como placeholders;
- permite reemplazar cada imagen;
- permite editar textos;
- permite ajustar crop, zoom y posición;
- valida overflow;
- exporta PNG, ZIP y `project.json`.

Principio de arquitectura:

> ChatGPT decide **qué contar y cómo estructurarlo**.  
> El renderer decide **cómo se ve**.

---

## 2. Estado actual

La versión actual soporta:

- Red: **Instagram**
- Formato: **Fotogalería**
- Plantilla: **`EC_IG_GALERIA_01`**
- Canvas: **1080 × 1350 px**
- Tipografía: **Noto Serif**
- Edición de texto en vivo
- Carga de una imagen por pieza
- Zoom y desplazamiento horizontal/vertical
- Imágenes de ejemplo automáticas al cargar un JSON
- Validación de overflow
- Máximo de **8 líneas** en slides interiores
- Exportación a PNG
- Exportación de galería a ZIP
- Guardado de `project.json`

---

## 3. Flujo de uso

### 3.1. Generar el `job.json`

El archivo se genera desde EC Social Studio.

Ejemplo:

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
      "text": "Texto de portada",
      "image_hint": "Descripción de imagen sugerida"
    },
    {
      "id": 2,
      "type": "content",
      "text": "Texto del slide",
      "image_hint": "Descripción de imagen sugerida"
    }
  ],
  "caption": "Caption sugerido"
}
```

---

### 3.2. Cargar el JSON

Al cargar cualquier `job.json`, el renderer:

1. lee los textos;
2. crea todas las piezas;
3. aplica la plantilla;
4. carga automáticamente imágenes de ejemplo como placeholders;
5. muestra la galería ya compuesta.

Las imágenes de ejemplo sirven únicamente como referencia visual.

Mientras una pieza siga utilizando una imagen de ejemplo, el renderer muestra:

`IMAGEN DE EJEMPLO · REEMPLAZAR`

y bloquea la exportación final.

---

### 3.3. Cambiar imágenes

Cada pieza muestra la acción:

**Cambiar imagen**

Al seleccionar una imagen real:

- reemplaza el placeholder;
- la imagen se procesa localmente en el navegador;
- se habilitan los controles de:
  - zoom;
  - desplazamiento horizontal;
  - desplazamiento vertical.

Las fotografías no pasan por ChatGPT y no necesitan subirse a un servidor.

---

### 3.4. Editar textos

Cada pieza tiene un campo de texto editable.

Los cambios:

- se reflejan inmediatamente en la vista previa;
- vuelven a ejecutar la validación;
- permiten corregir overflow sin volver a generar el JSON.

El texto original puede restaurarse desde la misma tarjeta.

---

## 4. Validación de texto

La plantilla utiliza:

- tamaño de fuente fijo;
- márgenes fijos;
- ancho de texto fijo;
- área de texto fija.

El renderer **no reduce automáticamente la tipografía** para hacer entrar un texto.

### Portada

La portada se valida según el espacio disponible de su caja de texto.

### Slides interiores

Regla actual:

- hasta **8 líneas**: válido;
- **9 líneas o más**: overflow.

Cuando hay overflow:

- aparece una advertencia;
- la exportación de la galería queda bloqueada;
- el texto debe editarse o dividirse.

---

## 5. Imágenes de ejemplo

El renderer utiliza esta carpeta:

```text
examples/photos/
  photo_1.jpg
  photo_2.jpg
  photo_3.jpg
  photo_4.jpg
  photo_5.jpg
```

Estas imágenes se asignan automáticamente al cargar un `job.json`.

Si hay más de cinco piezas, se reutilizan de manera cíclica como placeholders.

Las imágenes de ejemplo se marcan internamente como:

```json
{
  "is_placeholder": true
}
```

Cuando el usuario reemplaza una imagen:

```json
{
  "is_placeholder": false
}
```

La exportación final solo se habilita cuando todas las imágenes requeridas han sido reemplazadas.

---

## 6. Arquitectura

La versión v0.3 separa el renderer en tres capas:

```text
CORE
FORMATOS
PLANTILLAS
```

### 6.1. Core

Responsable de funciones genéricas.

```text
core/
  renderer.js
  project.js
  export.js
```

#### `core/renderer.js`

Contiene utilidades genéricas de renderizado:

- carga de imágenes;
- medición de texto;
- wrapping;
- crop;
- zoom;
- posicionamiento de imagen.

#### `core/project.js`

Gestiona:

- validación del `job.json`;
- creación del proyecto interno;
- serialización de `project.json`.

#### `core/export.js`

Gestiona:

- descarga de PNG;
- descarga de JSON;
- generación de ZIP.

---

### 6.2. Formatos

Los formatos definen la estructura editorial.

```text
formats/
  gallery.js
```

El formato `fotogaleria` define:

- estructura de slides;
- tipos `cover` y `content`;
- campos editables;
- uso de imágenes;
- normalización del JSON;
- serialización;
- ejemplo integrado.

La lógica de formato no define posiciones, tipografía ni diseño.

---

### 6.3. Plantillas

Las plantillas definen la representación visual.

```text
templates/
  EC_IG_GALERIA_01/
    template.js
```

La plantilla actual contiene:

- tamaño del canvas;
- geometría;
- posición de fotografía;
- márgenes;
- tipografía;
- tamaños de fuente;
- logos;
- colores;
- elementos gráficos;
- render de portada;
- render de interiores;
- validación visual;
- máximo de líneas;
- nombres de archivos exportados.

El core no debe conocer estos detalles.

---

## 7. Contrato de formato

Cada formato se registra en:

```javascript
window.EC_FORMATS
```

Debe implementar, como mínimo:

```javascript
validateJob(job)
normalize(job)
serialize(job, items)
getItemLabel(item)
getEditableFields(item)
usesImage(item)
getImageHint(item)
```

Opcionalmente:

```javascript
getExampleJob()
```

---

## 8. Contrato de plantilla

Cada plantilla se registra en:

```javascript
window.EC_TEMPLATES
```

Debe declarar:

```javascript
id
label
format
canvas
assets
```

y debe implementar:

```javascript
loadAssets()
render({ ctx, item, assignment, assets })
validate({ ctx, item })
exportFilename(item)
```

Esto permite agregar nuevos diseños sin modificar el core.

---

## 9. Estructura del proyecto

```text
/
├── index.html
├── styles.css
├── app.js
│
├── core/
│   ├── renderer.js
│   ├── project.js
│   └── export.js
│
├── formats/
│   └── gallery.js
│
├── templates/
│   └── EC_IG_GALERIA_01/
│       └── template.js
│
├── assets/
│   ├── logo-ec-white.png
│   └── logo-ec-yellow.png
│
├── examples/
│   └── photos/
│       ├── photo_1.jpg
│       ├── photo_2.jpg
│       ├── photo_3.jpg
│       ├── photo_4.jpg
│       └── photo_5.jpg
│
└── README.md
```

---

## 10. Assets

Los logos oficiales se encuentran en:

```text
assets/logo-ec-white.png
assets/logo-ec-yellow.png
```

Ambos son PNG con fondo transparente.

La plantilla actual utiliza:

- logo blanco en portada;
- logo amarillo/negro en slides interiores.

Los assets no deben codificarse dentro de `app.js`.

---

## 11. Plantilla actual: `EC_IG_GALERIA_01`

### Canvas

```text
1080 × 1350 px
```

### Interiores

La composición actual utiliza:

- fotografía en la parte superior;
- bloque de texto inferior;
- logo en la parte superior derecha;
- filete inferior;
- Noto Serif;
- máximo de 8 líneas.

### Portada

La portada utiliza:

- fotografía full bleed;
- logo;
- elemento gráfico negro/amarillo;
- caja amarilla de titular.

Todos estos valores pertenecen a la plantilla y no al motor general.

---

## 12. `project.json`

El renderer puede guardar el estado editable del proyecto.

`project.json` conserva:

- el `job.json`;
- textos editados;
- archivo asignado a cada pieza;
- zoom;
- posición horizontal;
- posición vertical.

Ejemplo conceptual:

```json
{
  "project_version": "1.0",
  "renderer_version": "0.3.0",
  "job": {},
  "assignments": [
    {
      "item_id": 1,
      "filename": "foto-portada.jpg",
      "zoom": 1.25,
      "x": 0.1,
      "y": -0.2
    }
  ]
}
```

Las imágenes no se incrustan dentro del JSON.

---

## 13. Exportación

El renderer permite:

### PNG individual

Cada pieza puede descargarse por separado.

Ejemplo:

```text
slide_01.png
slide_02.png
slide_03.png
```

### ZIP

La galería completa se descarga como ZIP e incluye:

- todos los PNG;
- `project.json`.

La exportación se bloquea si:

- hay overflow;
- falta una imagen;
- queda alguna imagen de ejemplo sin reemplazar.

---

## 14. Cargar ejemplo

El botón **Cargar ejemplo**:

- carga un `job.json` de prueba incorporado;
- asigna las imágenes de ejemplo;
- permite probar la aplicación sin preparar archivos externos.

En v0.3.3 el ejemplo está incorporado directamente en `app.js` para evitar dependencias innecesarias.

---

## 15. Publicación en GitHub Pages

El proyecto es completamente estático.

No necesita:

- backend;
- base de datos;
- servidor propio;
- OpenAI API.

Puede publicarse gratuitamente con GitHub Pages.

Configuración:

```text
Settings
→ Pages
→ Deploy from a branch
→ main
→ /(root)
```

Después de cada actualización, GitHub Pages vuelve a publicar el sitio.

Para evitar versiones antiguas en caché, `index.html` utiliza parámetros de versión en los archivos JS y CSS.

Ejemplo:

```html
<script src="app.js?v=0.3.3"></script>
```

---

## 16. Dependencias externas

### Noto Serif

La tipografía se carga desde Google Fonts.

### JSZip

Se utiliza para generar el ZIP de exportación desde el navegador.

No existen dependencias de servidor.

---

## 17. Privacidad y procesamiento

Las imágenes seleccionadas por el usuario:

- se cargan desde su computadora;
- se procesan en el navegador;
- no se envían a ChatGPT;
- no se almacenan en un backend del proyecto.

El renderer trabaja como una aplicación web cliente.

---

## 18. Principios de desarrollo

### Separación de responsabilidades

El core no debe saber cómo se ve una pieza.

El formato no debe controlar posiciones o tipografía.

La plantilla no debe decidir la estructura editorial de la historia.

### No reducir fuente automáticamente

Si un texto no cabe:

- se edita;
- se condensa;
- se divide.

La tipografía no se deforma para resolver overflow.

### Mantener compatibilidad

Una nueva plantilla debe poder agregarse sin modificar el core.

Un nuevo formato debe poder agregarse sin convertir `app.js` en una cadena de condiciones específicas.

---

## 19. Próximos formatos previstos

La arquitectura queda preparada para incorporar formatos como:

```text
single_post
story
story_sequence
quote
data_card
```

Ejemplos de futuras plantillas:

```text
EC_IG_SINGLE_01
EC_IG_STORY_01
```

Cada formato puede tener una o varias plantillas.

---

## 20. Flujo futuro multi-formato

La arquitectura objetivo es:

```text
EC Social Studio
      ↓
   job.json
      ↓
EC Social Renderer
      ↓
   FORMATO
      ↓
   PLANTILLA
      ↓
edición + imágenes
      ↓
validación
      ↓
PNG / ZIP
```

Esto permite que una misma plataforma produzca diferentes piezas sociales sin reconstruir el renderer para cada una.

---

## 21. Control de versiones

### v0.1

Primera prueba funcional del renderer.

### v0.2

- carga de imagen por slide;
- edición de texto en línea;
- validación de overflow.

### v0.2.2

- máximo de 8 líneas en slides interiores.

### v0.3

Refactorización modular:

- core;
- formatos;
- plantillas.

### v0.3.2

- imágenes de ejemplo automáticas al cargar cualquier JSON;
- placeholders obligatorios de reemplazar antes de exportar.

### v0.3.3

- corrección de `Cargar ejemplo`;
- ejemplo incorporado directamente en `app.js`;
- actualización de parámetros de versión para evitar caché antigua.

---

## 22. Criterio de funcionamiento correcto

Para considerar estable una versión del renderer debe poder completarse este flujo:

1. abrir la aplicación;
2. pulsar **Cargar ejemplo**;
3. visualizar todas las piezas con imágenes;
4. cargar un `job.json`;
5. visualizar sus textos con placeholders;
6. editar un texto;
7. provocar y corregir un overflow;
8. reemplazar cada imagen;
9. ajustar crop y zoom;
10. comprobar que la exportación se habilita únicamente cuando el proyecto es válido;
11. descargar un PNG;
12. descargar el ZIP;
13. guardar `project.json`.

---

## 23. Estado del proyecto

EC Social Renderer se encuentra actualmente en etapa de prototipo funcional.

La prioridad inmediata es estabilizar completamente la fotogalería antes de incorporar nuevos formatos visuales.

Una vez validado el renderer modular, el siguiente formato previsto es un **post simple de una sola imagen**, seguido por formatos de **historias de Instagram**.


---

## Historial de versiones

### v0.1 — Primer renderer funcional

Primera versión operativa de EC Social Renderer.

- carga de `job.json`;
- renderizado de fotogalerías;
- aplicación de la plantilla `EC_IG_GALERIA_01`;
- carga de fotografías;
- controles de crop, zoom y desplazamiento;
- exportación de PNG y ZIP.

---

### v0.2 — Edición dentro del renderer

Se mejora el flujo de trabajo editorial.

- carga de fotografías por slide;
- edición de texto directamente dentro de cada pieza;
- actualización del preview en tiempo real;
- detección de overflow;
- tamaño de fuente y márgenes fijos;
- exportación bloqueada cuando existen errores.

---

### v0.2.1 — Correcciones de interfaz

- corrección de `Cargar ejemplo`;
- visibilidad explícita del editor de texto;
- visibilidad explícita del control para subir imágenes;
- mejoras para evitar carga de versiones antiguas desde caché.

---

### v0.2.2 — Regla de ocho líneas

Se establece la primera regla visual dura de la plantilla.

- máximo de 8 líneas para slides interiores;
- 9 líneas o más generan overflow;
- el renderer nunca reduce automáticamente la tipografía;
- actualización del prompt editorial para producir textos más breves.

---

### v0.3 — Refactorización modular

El renderer deja de estar acoplado a una única fotogalería.

Se separa en:

- `core/`
- `formats/`
- `templates/`

Responsabilidades:

**Core**
- renderizado genérico;
- proyectos;
- exportación.

**Formats**
- estructura editorial de cada formato.

**Templates**
- diseño;
- geometría;
- tipografía;
- assets;
- reglas de validación visual.

Esta versión prepara el sistema para incorporar futuros formatos como:

- post simple;
- stories;
- citas;
- placas de datos.

---

### v0.3.1 — Recuperación de imágenes de ejemplo

- `Cargar ejemplo` vuelve a cargar automáticamente las cinco fotografías de prueba;
- cuando una imagen ya está asignada, la interfaz muestra `Cambiar imagen`.

---

### v0.3.2 — Placeholders por defecto

Se modifica el flujo normal de carga.

Al cargar cualquier `job.json`:

- aparecen inmediatamente los textos;
- se asignan imágenes de ejemplo automáticamente;
- las imágenes funcionan como placeholders;
- la interfaz indica que deben reemplazarse;
- la exportación queda bloqueada mientras exista alguna imagen de ejemplo.

Esto permite que el usuario vea inmediatamente una composición completa y solo tenga que sustituir las fotografías.

---

### v0.3.3 — Corrección de Cargar ejemplo y caché

- el JSON de ejemplo pasa a estar integrado directamente en `app.js`;
- `Cargar ejemplo` deja de depender del archivo de formato;
- se agrega manejo visible de errores;
- se actualizan los parámetros de versión de los scripts para evitar que GitHub Pages utilice archivos antiguos almacenados en caché.

---

### v0.3.4 — Compatibilidad del core de proyectos

Hotfix para la arquitectura modular.

Se corrige la incompatibilidad entre:

`EC.Project.create()`

y:

`EC.Project.createWorkingProject()`

Se añade compatibilidad entre ambos métodos y se actualizan nuevamente las versiones de caché.

**Versión actual: v0.3.4**
