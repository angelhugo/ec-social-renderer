# EC Social Renderer

Renderer web estático para fotogalerías de Instagram de El Comercio.

## Qué hace

- Carga un `job.json` producido por ChatGPT.
- Carga fotografías desde la computadora del usuario.
- Permite asignar una foto a cada slide.
- Permite ajustar zoom y encuadre.
- Valida que el texto quepa sin cambiar el tamaño tipográfico.
- Renderiza `EC_IG_GALERIA_01` a 1080 × 1350.
- Exporta PNG individuales y ZIP.
- No usa OpenAI API.
- Las fotografías se procesan en el navegador.

## Probar localmente

Desde la carpeta del proyecto:

```bash
python3 -m http.server 8080
```

Luego abre:

```text
http://localhost:8080
```

Pulsa **Cargar ejemplo** para probar el renderer sin preparar archivos.

## Publicar gratis en GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube estos archivos a la rama `main`.
3. En `Settings → Pages`, usa `GitHub Actions` como Source.
4. El workflow incluido en `.github/workflows/pages.yml` publicará el sitio.

## Flujo

ChatGPT → `job.json` → Renderer → fotos → encuadre → validación → PNG / ZIP.

## Dependencias

- Google Fonts para Noto Serif.
- JSZip desde jsDelivr para generar ZIP.

Si JSZip no carga, los PNG individuales siguen funcionando.
