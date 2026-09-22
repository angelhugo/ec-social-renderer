# EC Social Renderer

Renderer web del MediaLab de El Comercio para convertir un `job.json` editorial en piezas sociales listas para revisión y exportación.

**Versión actual:** `v0.3.6`  
**Estado:** Prototipo funcional

---

## 1. Qué es

EC Social Renderer es una aplicación web estática que recibe el contenido editorial generado por **EC Social Studio**, aplica una plantilla visual, permite ajustar textos e imágenes y exporta las piezas finales.

Forma parte de este flujo:

### EC Social Studio

Se encarga de:

- leer una nota;
- definir enfoque y objetivo;
- estructurar la historia;
- redactar los textos;
- generar sugerencias de imagen;
- producir un `job.json`.

### EC Social Renderer

Se encarga de:

- recibir el JSON;
- validar su estructura;
- aplicar una plantilla;
- mostrar una vista previa;
- cargar imágenes de ejemplo como placeholders;
- permitir reemplazar cada imagen;
- permitir editar textos;
- permitir ajustar crop, zoom y posición;
- validar overflow;
- exportar PNG, ZIP y `project.json`.

Principio de arquitectura:

> EC Social Studio decide **qué contar y cómo estructurarlo**.  
> EC Social Renderer decide **cómo se ve**.

---

## 2. Estado actual

La versión actual soporta:

- Red: **Instagram**
- Formato: **Fotogalería**
- Plantilla: **`EC_IG_GALERIA_01`**
- Canvas: **1080 × 1350 px**
- Tipografía: **Noto Serif**
- Pegado directo de JSON como flujo principal
- Carga de archivo `.json` como alternativa
- Ejemplo integrado
- Validación de JSON antes de generar piezas
- Edición de texto en vivo
- Imágenes de ejemplo automáticas
- Reemplazo de una imagen por pieza
- Zoom
- Desplazamiento horizontal
- Desplazamiento vertical
- Validación de overflow
- Máximo de **8 líneas** en slides interiores
- Exportación individual a PNG
- Exportación de galería a ZIP
- Guardado de `project.json`

---

## 3. Flujo principal de uso

El flujo recomendado es:

```text
EC Social Studio
→ Generar JSON
→ Copiar JSON
→ EC Social Renderer
→ Pegar JSON
→ Generar piezas
→ Reemplazar imágenes
→ Ajustar texto e imagen
→ Validar
→ Exportar
```

---

## 4. Entrada de JSON

### 4.1. Pegar JSON

El flujo principal consiste en copiar el JSON generado por EC Social Studio y pegarlo directamente en el renderer.

La pantalla inicial contiene un campo:

**Pega aquí el JSON generado por EC Social Studio**

El renderer valida automáticamente el contenido.

Si el JSON es válido:

```text
✓ JSON válido. Ya puedes generar las piezas.
```

y se habilita:

**Generar piezas**

Si el JSON es inválido, se muestra un mensaje y no se permite generar las piezas.

---

### 4.2. Bloques Markdown

El renderer intenta tolerar JSON copiado desde un bloque Markdown.

Por ejemplo:

```text
```json
{
  "schema_version": "1.0"
}
```
```

Las marcas de apertura y cierre se eliminan antes de interpretar el contenido.

---

### 4.3. Cargar archivo `.json`

Se conserva como opción secundaria.

Al cargar un archivo:

- se valida;
- su contenido aparece también en el campo de texto;
- se generan las piezas.

---

### 4.4. Cargar ejemplo

El botón **Cargar ejemplo** permite probar el renderer sin preparar un JSON externo.

El ejemplo:

- carga un JSON integrado;
- genera las piezas;
- asigna imágenes de prueba;
- permite probar texto, crop, zoom, validación y exportación.

---

## 5. Estructura de `job.json`

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

El JSON contiene decisiones editoriales.

No debe contener:

- coordenadas;
- crop;
- zoom;
- tamaños;
- tipografías;
- colores;
- posiciones;
- logos;
- instrucciones de renderizado.

---

## 6. Imágenes de ejemplo

Al cargar cualquier JSON, el renderer asigna automáticamente imágenes de ejemplo como placeholders.

Esto permite que el usuario vea inmediatamente una galería compuesta.

La carpeta utilizada es:

```text
examples/photos/
  photo_1.jpg
  photo_2.jpg
  photo_3.jpg
  photo_4.jpg
  photo_5.jpg
```

Si existen más de cinco piezas, las imágenes pueden reutilizarse de manera cíclica como placeholders.

---

## 7. Reemplazo de imágenes

Mientras una pieza utiliza una imagen de prueba, el renderer muestra:

```text
IMAGEN DE EJEMPLO · REEMPLAZAR
```

y la acción principal es:

**Cambiar imagen**

Cuando el usuario selecciona una imagen real:

- reemplaza el placeholder;
- se procesa localmente en el navegador;
- se habilitan los controles de encuadre;
- deja de considerarse imagen de ejemplo.

Las imágenes se clasifican internamente con:

```json
{
  "is_placeholder": true
}
```

o:

```json
{
  "is_placeholder": false
}
```

---

## 8. Controles de imagen

Cada pieza permite:

### Zoom

Aumentar el acercamiento de la fotografía.

### Horizontal

Mover el encuadre hacia izquierda o derecha.

### Vertical

Mover el encuadre hacia arriba o abajo.

Estos ajustes afectan únicamente al proyecto actual.

---

## 9. Edición de texto

Cada pieza tiene un campo editable.

Los cambios:

- se reflejan inmediatamente en el preview;
- vuelven a ejecutar la validación;
- permiten corregir overflow sin regresar a EC Social Studio.

También existe la opción:

**Restaurar texto**

que recupera el texto original recibido en el JSON.

---

## 10. Validación de texto

La plantilla utiliza:

- tamaño de fuente fijo;
- márgenes fijos;
- ancho de texto fijo;
- área de texto fija.

El renderer **no reduce automáticamente la tipografía** para hacer entrar un texto.

---

### 10.1. Portada

La portada se valida según el espacio disponible en la caja de titular.

---

### 10.2. Slides interiores

Regla actual:

- hasta **8 líneas**: válido;
- **9 líneas o más**: overflow.

Cuando hay overflow:

- aparece una advertencia;
- la exportación final queda bloqueada;
- el texto debe editarse, condensarse o dividirse.

---

## 11. Reglas de exportación

La exportación final se habilita únicamente cuando:

- no existe overflow;
- todas las piezas tienen imagen;
- todas las imágenes de ejemplo han sido reemplazadas.

Mientras exista un placeholder, el sistema informa cuántas imágenes faltan reemplazar.

---

## 12. Exportación

### PNG individual

Cada pieza puede descargarse por separado.

Ejemplo:

```text
slide_01.png
slide_02.png
slide_03.png
```

### ZIP

La galería completa puede descargarse como ZIP.

Incluye:

- todos los PNG;
- `project.json`.

---

## 13. `project.json`

El renderer puede guardar el estado editable del proyecto.

Conserva:

- el `job.json`;
- textos editados;
- nombre de archivo asignado a cada pieza;
- zoom;
- posición horizontal;
- posición vertical.

Ejemplo conceptual:

```json
{
  "project_version": "1.0",
  "renderer_version": "0.3.6",
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

## 14. Arquitectura

Desde la versión v0.3, el renderer se divide en tres capas:

```text
CORE
FORMATOS
PLANTILLAS
```

---

## 15. Core

```text
core/
  renderer.js
  project.js
  export.js
```

### `core/renderer.js`

Responsable de utilidades genéricas:

- carga de imágenes;
- medición de texto;
- wrapping;
- crop;
- zoom;
- posicionamiento.

### `core/project.js`

Responsable de:

- validación del proyecto;
- creación del estado interno;
- serialización de `project.json`.

### `core/export.js`

Responsable de:

- PNG;
- JSON;
- ZIP.

El core no debe saber cómo se ve una fotogalería específica.

---

## 16. Formatos

```text
formats/
  gallery.js
```

El formato define la estructura editorial.

`fotogaleria` define:

- slides;
- tipos `cover` y `content`;
- campos editables;
- uso de imágenes;
- normalización del JSON;
- serialización.

El formato no debe controlar:

- posiciones;
- tipografía;
- colores;
- geometría.

---

## 17. Plantillas

```text
templates/
  EC_IG_GALERIA_01/
    template.js
```

La plantilla define:

- tamaño del canvas;
- geometría;
- tipografía;
- tamaños de fuente;
- márgenes;
- logos;
- colores;
- elementos gráficos;
- render;
- reglas de validación;
- límites de líneas;
- nombre de archivos exportados.

---

## 18. Contrato de formato

Cada formato se registra en:

```javascript
window.EC_FORMATS
```

Debe implementar:

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

## 19. Contrato de plantilla

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

---

## 20. Estructura del proyecto

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

## 21. Assets

Los logos oficiales están en:

```text
assets/logo-ec-white.png
assets/logo-ec-yellow.png
```

Son PNG con fondo transparente.

La plantilla actual utiliza:

- logo blanco en portada;
- logo amarillo/negro en slides interiores.

Los assets no deben codificarse dentro de `app.js`.

---

## 22. Plantilla actual: `EC_IG_GALERIA_01`

### Canvas

```text
1080 × 1350 px
```

### Portada

Incluye:

- fotografía full bleed;
- logo;
- elemento gráfico negro/amarillo;
- caja amarilla de titular.

### Interiores

Incluyen:

- fotografía superior;
- bloque de texto inferior;
- logo superior derecho;
- filete inferior;
- Noto Serif;
- máximo de 8 líneas.

Todos estos valores pertenecen a la plantilla, no al motor general.

---

## 23. Dependencias externas

### Google Fonts

Se utiliza para cargar Noto Serif.

### JSZip

Se utiliza para generar el ZIP directamente en el navegador.

No se requiere backend.

---

## 24. Privacidad y procesamiento

Las imágenes:

- se cargan desde la computadora del usuario;
- se procesan en el navegador;
- no pasan por ChatGPT;
- no se almacenan en un backend propio del proyecto.

El renderer funciona como aplicación cliente.

---

## 25. Publicación en GitHub Pages

El proyecto puede publicarse como sitio estático.

Configuración:

```text
Settings
→ Pages
→ Deploy from a branch
→ main
→ /(root)
```

No necesita:

- backend;
- base de datos;
- servidor propio;
- OpenAI API.

---

## 26. Caché y versiones

Para evitar que GitHub Pages o el navegador sirvan archivos antiguos, `index.html` utiliza parámetros de versión.

Ejemplo:

```html
<script src="app.js?v=0.3.6"></script>
```

Cada versión debe actualizar estos parámetros.

Después de publicar una versión nueva, conviene esperar a que GitHub Pages termine el deploy antes de probar.

---

## 27. Principios de desarrollo

### Separación de responsabilidades

- El core no sabe cómo se ve la pieza.
- El formato define la estructura editorial.
- La plantilla define la representación visual.

### No reducir tipografía

Si un texto no cabe:

- se edita;
- se condensa;
- se divide.

Nunca se reduce automáticamente el tamaño de letra.

### Compatibilidad

Una nueva plantilla debe poder agregarse sin modificar el core.

Un nuevo formato debe poder agregarse sin convertir `app.js` en una colección de condiciones específicas.

---

## 28. Próximos formatos previstos

La arquitectura está preparada para incorporar:

```text
single_post
story
story_sequence
quote
data_card
```

Posibles plantillas:

```text
EC_IG_SINGLE_01
EC_IG_STORY_01
```

---

## 29. Flujo futuro multi-formato

Arquitectura objetivo:

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

---

# 30. Historial de versiones

## v0.1 — Primer renderer funcional

Primera versión operativa.

Incluyó:

- carga de `job.json`;
- renderizado de fotogalerías;
- plantilla `EC_IG_GALERIA_01`;
- carga de fotografías;
- crop;
- zoom;
- desplazamiento;
- exportación PNG y ZIP.

---

## v0.2 — Edición dentro del renderer

Mejoras del flujo editorial:

- carga de fotografía por slide;
- edición de texto dentro de cada pieza;
- preview en tiempo real;
- detección de overflow;
- tipografía y márgenes fijos;
- bloqueo de exportación con errores.

---

## v0.2.1 — Correcciones de interfaz

- corrección del flujo de ejemplo;
- editor de texto visible;
- carga de imagen visible;
- mejoras contra versiones antiguas almacenadas en caché.

---

## v0.2.2 — Regla de ocho líneas

- máximo de 8 líneas en slides interiores;
- 9 o más generan overflow;
- el renderer no reduce tipografía;
- ajuste del prompt editorial para producir textos más breves.

---

## v0.3 — Refactorización modular

Se separa el renderer en:

```text
core/
formats/
templates/
```

El diseño de la fotogalería deja de estar acoplado a `app.js`.

Esta versión prepara la incorporación de nuevos formatos.

---

## v0.3.1 — Recuperación de imágenes de ejemplo

- `Cargar ejemplo` vuelve a cargar automáticamente las imágenes de prueba;
- una pieza con imagen asignada muestra `Cambiar imagen`.

---

## v0.3.2 — Placeholders automáticos

Se cambia el flujo normal de carga.

Al cargar cualquier `job.json`:

- aparecen los textos;
- se asignan imágenes de ejemplo;
- las imágenes quedan marcadas como placeholders;
- el usuario debe reemplazarlas;
- la exportación queda bloqueada mientras exista alguna imagen de ejemplo.

---

## v0.3.3 — Corrección de ejemplo y caché

- el JSON de ejemplo se integra directamente en `app.js`;
- `Cargar ejemplo` deja de depender del formato;
- se agrega manejo visible de errores;
- se actualizan parámetros de versión para evitar caché antigua.

---

## v0.3.4 — Compatibilidad del core de proyectos

Hotfix para resolver una incompatibilidad entre:

```javascript
EC.Project.create()
```

y:

```javascript
EC.Project.createWorkingProject()
```

Se añade compatibilidad entre ambos métodos.

---

## v0.3.5 — Compatibilidad defensiva desde `app.js`

Se refuerza la creación del proyecto.

`app.js` acepta tanto:

```javascript
createWorkingProject()
```

como:

```javascript
create()
```

Esto evita fallas cuando GitHub Pages o el navegador cargan temporalmente archivos de distintas versiones.

---

## v0.3.6 — Pegado directo de JSON

Se cambia el flujo principal de entrada.

Ahora el usuario puede:

1. copiar el JSON generado por EC Social Studio;
2. pegarlo directamente en el renderer;
3. validarlo automáticamente;
4. pulsar **Generar piezas**.

Se mantienen como alternativas:

- carga de archivo `.json`;
- carga de ejemplo.

También se incorpora tolerancia a bloques Markdown copiados desde ChatGPT.

**Versión actual: `v0.3.6`**

---

## 31. Criterio de funcionamiento correcto

Para considerar estable una versión debe poder completarse este flujo:

1. abrir la aplicación;
2. verificar la versión mostrada;
3. pulsar **Cargar ejemplo**;
4. visualizar las piezas;
5. pegar un JSON real;
6. verificar que el JSON sea validado;
7. generar las piezas;
8. editar un texto;
9. provocar y corregir un overflow;
10. reemplazar cada imagen de ejemplo;
11. ajustar zoom y encuadre;
12. comprobar que la exportación permanece bloqueada mientras exista un placeholder;
13. comprobar que la exportación se habilita al completar el proyecto;
14. descargar un PNG;
15. descargar el ZIP;
16. guardar `project.json`.

---

## 32. Estado del proyecto

EC Social Renderer está actualmente en fase de **prototipo funcional**.

La prioridad inmediata es estabilizar por completo el flujo de fotogalerías antes de incorporar nuevos formatos.

Una vez validada esta base modular, los siguientes formatos previstos son:

1. **Post simple de una sola imagen**
2. **Historias de Instagram**
