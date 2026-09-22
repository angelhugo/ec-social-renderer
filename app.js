(() => {
  const state = {
    job: null,
    workingSlides: [],
    assignments: new Map(),
    logoYellow: null,
    logoWhite: null
  };

  const $ = (id) => document.getElementById(id);

  const els = {
    jobInput: $("jobInput"),
    slides: $("slidesSection"),
    summary: $("summary"),
    caption: $("caption"),
    downloadZip: $("downloadZip"),
    downloadProject: $("downloadProject"),
    globalStatus: $("globalStatus"),
    loadExample: $("loadExample")
  };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });
  }

  async function initBrandAssets() {
    [state.logoYellow, state.logoWhite] = await Promise.all([
      loadImage("assets/logo-ec-yellow.png"),
      loadImage("assets/logo-ec-white.png")
    ]);
  }

  function validateJob(job) {
    const errors = [];

    if (!job || typeof job !== "object") {
      errors.push("JSON inválido.");
      return errors;
    }

    if (job.schema_version !== "1.0") {
      errors.push("schema_version debe ser 1.0.");
    }

    if (!window.EC_TEMPLATES?.[job.template]) {
      errors.push("Plantilla no reconocida.");
    }

    if (!Array.isArray(job.slides) || !job.slides.length) {
      errors.push("El JSON no contiene slides.");
      return errors;
    }

    job.slides.forEach((slide, index) => {
      if (slide.id !== index + 1) {
        errors.push(`Slide ${index + 1}: id inválido.`);
      }

      if (index === 0 && slide.type !== "cover") {
        errors.push("El primer slide debe ser cover.");
      }

      if (index > 0 && slide.type !== "content") {
        errors.push(`Slide ${index + 1} debe ser content.`);
      }

      if (typeof slide.text !== "string" || !slide.text.trim()) {
        errors.push(`Slide ${index + 1}: falta texto.`);
      }
    });

    return errors;
  }

  async function readJsonFile(file) {
    return JSON.parse(await file.text());
  }

  function setJob(job) {
    const errors = validateJob(job);

    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }

    state.job = structuredClone(job);

    state.workingSlides = job.slides.map((slide) => ({
      ...slide,
      original_text: slide.text
    }));

    state.assignments.clear();

    renderApp();
  }

  els.jobInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setJob(await readJsonFile(file));
    } catch (err) {
      alert("No se pudo leer el JSON: " + err.message);
    }
  });

  function renderApp() {
    renderSummary();
    renderSlides();

    els.caption.textContent = state.job?.caption || "—";
    els.downloadProject.disabled = !state.job;

    updateGlobalStatus();
  }

  function renderSummary() {
    if (!state.job) {
      els.summary.innerHTML = "<span>Carga un job.json para empezar.</span>";
      return;
    }

    els.summary.innerHTML = `
      <span><strong>Plantilla:</strong>${esc(state.job.template)}</span>
      <span><strong>Slides:</strong>${state.workingSlides.length}</span>
      <span><strong>Enfoque:</strong>${esc(state.job.approach || "—")}</span>
      <span><strong>Objetivo:</strong>${esc(state.job.objective || "—")}</span>
    `;
  }

  function renderSlides() {
    els.slides.innerHTML = "";

    if (!state.job) return;

    for (const slide of state.workingSlides) {
      const assignment = state.assignments.get(slide.id);

      const card = document.createElement("article");
      card.className = "slide-card";
      card.dataset.slide = String(slide.id);

      card.innerHTML = `
        <div class="slide-head">
          <strong>${slide.type === "cover" ? "PORTADA" : `SLIDE ${slide.id}`}</strong>
          <span data-role="head-count">${slide.text.length} caracteres</span>
        </div>

        <div class="preview-wrap">
          <canvas width="1080" height="1350" data-role="canvas"></canvas>
        </div>

        <div class="slide-body">

          <label>Texto</label>

          <textarea
            class="text-editor"
            data-role="text"
            spellcheck="true"
          >${esc(slide.text)}</textarea>

          <div class="char-row">
            <span>Editable: los cambios actualizan la pieza al instante.</span>
            <span data-role="char-count">${slide.text.length}</span>
          </div>

          <div class="image-block">

            <p class="hint">
              <strong>Imagen sugerida:</strong>
              ${esc(slide.image_hint || "Sin sugerencia")}
            </p>

            <div
              class="photo-placeholder ${assignment?.image ? "hidden" : ""}"
              data-role="placeholder"
            >
              <strong>Falta fotografía</strong>
              Selecciona la imagen para este slide.
            </div>

            <label>
              ${assignment?.image ? "Cambiar fotografía" : "Subir fotografía"}
            </label>

            <input
              data-role="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            >

            <div
              class="photo-name ${assignment?.image ? "" : "hidden"}"
              data-role="photo-name"
            >
              ${esc(assignment?.filename || "")}
            </div>

            <div
              class="photo-controls ${assignment?.image ? "" : "hidden"}"
              data-role="photo-controls"
            >

              <div class="range-row">
                <span>Zoom</span>
                <input
                  data-role="zoom"
                  type="range"
                  min="1"
                  max="3"
                  step=".01"
                  value="${assignment?.zoom ?? 1}"
                >
                <span data-value="zoom">
                  ${(assignment?.zoom ?? 1).toFixed(2)}×
                </span>
              </div>

              <div class="range-row">
                <span>Horizontal</span>
                <input
                  data-role="x"
                  type="range"
                  min="-1"
                  max="1"
                  step=".01"
                  value="${assignment?.x ?? 0}"
                >
                <span data-value="x">
                  ${(assignment?.x ?? 0).toFixed(2)}
                </span>
              </div>

              <div class="range-row">
                <span>Vertical</span>
                <input
                  data-role="y"
                  type="range"
                  min="-1"
                  max="1"
                  step=".01"
                  value="${assignment?.y ?? 0}"
                >
                <span data-value="y">
                  ${(assignment?.y ?? 0).toFixed(2)}
                </span>
              </div>

            </div>

          </div>

          <p class="status" data-role="status"></p>

          <div class="card-actions">
            <button
              class="secondary"
              data-role="reset-text"
              type="button"
            >
              Restaurar texto
            </button>

            <button
              class="secondary"
              data-role="download"
              type="button"
            >
              Descargar PNG
            </button>
          </div>

        </div>
      `;

      els.slides.appendChild(card);

      bindCard(card, slide);
      renderSlide(slide.id);
    }
  }

  function bindCard(card, slide) {
    const textArea = card.querySelector('[data-role="text"]');
    const photoInput = card.querySelector('[data-role="photo"]');

    textArea.addEventListener("input", () => {
      slide.text = textArea.value;

      card.querySelector('[data-role="char-count"]').textContent =
        slide.text.length;

      card.querySelector('[data-role="head-count"]').textContent =
        `${slide.text.length} caracteres`;

      renderSlide(slide.id);
      updateGlobalStatus();
    });

    card.querySelector('[data-role="reset-text"]').addEventListener(
      "click",
      () => {
        slide.text = slide.original_text;
        textArea.value = slide.original_text;

        card.querySelector('[data-role="char-count"]').textContent =
          slide.text.length;

        card.querySelector('[data-role="head-count"]').textContent =
          `${slide.text.length} caracteres`;

        renderSlide(slide.id);
        updateGlobalStatus();
      }
    );

    photoInput.addEventListener("change", async () => {
      const file = photoInput.files?.[0];
      if (!file) return;

      const previous = state.assignments.get(slide.id);

      if (previous?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(previous.url);
      }

      const url = URL.createObjectURL(file);
      const image = await loadImage(url);

      state.assignments.set(slide.id, {
        filename: file.name,
        file,
        url,
        image,
        zoom: 1,
        x: 0,
        y: 0
      });

      renderSlides();
      updateGlobalStatus();
    });

    for (const key of ["zoom", "x", "y"]) {
      const input = card.querySelector(`[data-role="${key}"]`);

      input?.addEventListener("input", () => {
        const assignment = state.assignments.get(slide.id);

        if (!assignment) return;

        assignment[key] = Number(input.value);

        const value = card.querySelector(`[data-value="${key}"]`);

        value.textContent =
          key === "zoom"
            ? `${assignment[key].toFixed(2)}×`
            : assignment[key].toFixed(2);

        renderSlide(slide.id);
      });
    }

    card.querySelector('[data-role="download"]').addEventListener(
      "click",
      async () => {
        const canvas = card.querySelector('[data-role="canvas"]');

        await downloadCanvas(
          canvas,
          `slide_${String(slide.id).padStart(2, "0")}.png`
        );
      }
    );
  }

  function getCard(slideId) {
    return document.querySelector(
      `.slide-card[data-slide="${slideId}"]`
    );
  }

  function getSlide(slideId) {
    return state.workingSlides.find(
      (slide) => slide.id === slideId
    );
  }

  function setFont(ctx, size) {
    ctx.font = `700 ${size}px "Noto Serif", Georgia, serif`;
  }

  function wrapLines(ctx, text, maxWidth) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;

      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }

    if (line) lines.push(line);

    return lines;
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = wrapLines(ctx, text, maxWidth);

    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });

    return {
      lines,
      height: lines.length * lineHeight
    };
  }

  function renderSlide(slideId) {
    if (!state.job) return;

    const slide = getSlide(slideId);
    const card = getCard(slideId);

    if (!slide || !card) return;

    const canvas = card.querySelector('[data-role="canvas"]');
    const status = card.querySelector('[data-role="status"]');
    const ctx = canvas.getContext("2d");
    const template = window.EC_TEMPLATES[state.job.template];
    const assignment = state.assignments.get(slideId);

    ctx.clearRect(0, 0, template.width, template.height);

    if (slide.type === "cover") {
      drawCover(ctx, template, slide, assignment);
    } else {
      drawContent(ctx, template, slide, assignment);
    }

    const validation = validateText(ctx, template, slide);
    const hasImage = !!assignment?.image;

    if (!validation.ok) {
      status.textContent = `⚠ OVERFLOW: ${validation.message}`;
      status.className = "status warn";
      card.classList.add("has-overflow");
    } else if (!hasImage) {
      status.textContent = "Falta asignar fotografía";
      status.className = "status warn";
      card.classList.remove("has-overflow");
    } else {
      status.textContent = "✓ Diseño válido";
      status.className = "status ok";
      card.classList.remove("has-overflow");
    }
  }

  function drawCover(ctx, template, slide, assignment) {
    ctx.fillStyle = "#dddddd";
    ctx.fillRect(0, 0, template.width, template.height);

    if (assignment?.image) {
      drawCrop(ctx, assignment.image, 0, 0, template.width, template.height, assignment);
    }

    if (state.logoWhite) {
      ctx.drawImage(
        state.logoWhite,
        template.logo.x,
        template.logo.y,
        template.logo.size,
        template.logo.size
      );
    }

    const arrow = template.cover.arrow;
    ctx.fillStyle = template.colors.black;
    ctx.fillRect(arrow.x, arrow.y, arrow.w, arrow.h);
    ctx.strokeStyle = template.colors.yellow;
    ctx.lineWidth = 7;

    const cy = arrow.y + arrow.h / 2;

    ctx.beginPath();
    ctx.moveTo(arrow.x + 60, cy);
    ctx.lineTo(arrow.x + 165, cy);
    ctx.moveTo(arrow.x + 135, cy - 30);
    ctx.lineTo(arrow.x + 165, cy);
    ctx.lineTo(arrow.x + 135, cy + 30);
    ctx.stroke();

    const box = template.cover.titleBox;
    ctx.fillStyle = template.colors.yellow;
    ctx.fillRect(box.x, box.y, box.w, box.h);

    const cfg = template.cover.text;
    setFont(ctx, cfg.fontSize);
    ctx.fillStyle = template.colors.black;
    ctx.textBaseline = "top";

    drawWrappedText(
      ctx,
      slide.text,
      cfg.x,
      cfg.y,
      cfg.width,
      cfg.fontSize * cfg.lineHeight
    );
  }

  function drawContent(ctx, template, slide, assignment) {
    ctx.fillStyle = template.colors.white;
    ctx.fillRect(0, 0, template.width, template.height);

    if (assignment?.image) {
      drawCrop(
        ctx,
        assignment.image,
        0,
        0,
        template.width,
        template.photoHeight,
        assignment
      );
    } else {
      ctx.fillStyle = "#dddddd";
      ctx.fillRect(0, 0, template.width, template.photoHeight);
    }

    if (state.logoYellow) {
      ctx.drawImage(
        state.logoYellow,
        template.logo.x,
        template.logo.y,
        template.logo.size,
        template.logo.size
      );
    }

    const cfg = template.content.text;

    setFont(ctx, cfg.fontSize);
    ctx.fillStyle = template.colors.black;
    ctx.textBaseline = "top";

    drawWrappedText(
      ctx,
      slide.text,
      cfg.x,
      cfg.y,
      template.width - cfg.x - cfg.right,
      cfg.fontSize * cfg.lineHeight
    );

    const rule = template.content.bottomRule;
    ctx.fillStyle = template.colors.gold;
    ctx.fillRect(rule.x, rule.y, rule.w, rule.h);
  }

  function drawCrop(ctx, image, x, y, width, height, assignment) {
    const zoom = Math.max(1, Number(assignment?.zoom || 1));
    const panX = Number(assignment?.x || 0);
    const panY = Number(assignment?.y || 0);

    const imageRatio = image.width / image.height;
    const boxRatio = width / height;

    let sw;
    let sh;

    if (imageRatio > boxRatio) {
      sh = image.height / zoom;
      sw = sh * boxRatio;
    } else {
      sw = image.width / zoom;
      sh = sw / boxRatio;
    }

    const maxX = Math.max(0, image.width - sw);
    const maxY = Math.max(0, image.height - sh);

    const sx = ((panX + 1) / 2) * maxX;
    const sy = ((panY + 1) / 2) * maxY;

    ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
  }

  function validateText(ctx, template, slide) {
    if (!slide.text.trim()) {
      return {
        ok: false,
        message: "el texto está vacío."
      };
    }

    if (slide.type === "cover") {
      const cfg = template.cover.text;
      setFont(ctx, cfg.fontSize);

      const lines = wrapLines(ctx, slide.text, cfg.width);
      const height = lines.length * cfg.fontSize * cfg.lineHeight;

      return height <= cfg.maxHeight
        ? {
            ok: true,
            lines: lines.length,
            height
          }
        : {
            ok: false,
            lines: lines.length,
            height,
            message: `el titular excede el espacio disponible.`
          };
    }

    const cfg = template.content.text;
    setFont(ctx, cfg.fontSize);

    const width = template.width - cfg.x - cfg.right;
    const lines = wrapLines(ctx, slide.text, width);
    const height = lines.length * cfg.fontSize * cfg.lineHeight;
    const maxLines = 8;

    return lines.length <= maxLines
      ? {
          ok: true,
          lines: lines.length,
          height
        }
      : {
          ok: false,
          lines: lines.length,
          height,
          message: `el texto usa ${lines.length} líneas y el máximo permitido es 8.`
        };
  }

  function allSlidesHavePhoto() {
    return (
      state.job &&
      state.workingSlides.every(
        (slide) => state.assignments.get(slide.id)?.image
      )
    );
  }

  function allTextsFit() {
    if (!state.job) return false;

    for (const slide of state.workingSlides) {
      const card = getCard(slide.id);
      const canvas = card?.querySelector('[data-role="canvas"]');

      if (!canvas) return false;

      const ctx = canvas.getContext("2d");
      const template = window.EC_TEMPLATES[state.job.template];

      if (!validateText(ctx, template, slide).ok) {
        return false;
      }
    }

    return true;
  }

  function updateGlobalStatus() {
    if (!state.job) {
      els.globalStatus.textContent = "";
      els.downloadZip.disabled = true;
      return;
    }

    const missingPhotos = state.workingSlides.filter(
      (slide) => !state.assignments.get(slide.id)?.image
    ).length;

    const overflowing = state.workingSlides.filter(
      (slide) => getCard(slide.id)?.classList.contains("has-overflow")
    ).length;

    if (overflowing) {
      els.globalStatus.textContent =
        `Hay ${overflowing} slide(s) con overflow. En los slides interiores el máximo permitido es 8 líneas.`;

      els.globalStatus.className = "status warn";
    } else if (missingPhotos) {
      els.globalStatus.textContent =
        `Faltan ${missingPhotos} fotografía(s) por asignar.`;

      els.globalStatus.className = "status warn";
    } else {
      els.globalStatus.textContent = "✓ Proyecto listo para exportar.";
      els.globalStatus.className = "status ok";
    }

    els.downloadZip.disabled = !(allSlidesHavePhoto() && allTextsFit());
  }

  async function downloadCanvas(canvas, filename) {
    const blob = await new Promise(
      (resolve) => canvas.toBlob(resolve, "image/png")
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  els.downloadZip.addEventListener("click", async () => {
    if (!window.JSZip) {
      alert("No se pudo cargar JSZip. Puedes descargar los PNG de forma individual.");
      return;
    }

    if (!allSlidesHavePhoto() || !allTextsFit()) {
      alert("Antes de exportar, todos los slides deben tener fotografía y no debe haber overflow.");
      return;
    }

    const zip = new JSZip();

    for (const slide of state.workingSlides) {
      const canvas = getCard(slide.id).querySelector('[data-role="canvas"]');

      const blob = await new Promise(
        (resolve) => canvas.toBlob(resolve, "image/png")
      );

      zip.file(
        `slide_${String(slide.id).padStart(2, "0")}.png`,
        blob
      );
    }

    zip.file(
      "project.json",
      JSON.stringify(buildProject(), null, 2)
    );

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "ec-social-galeria.zip";
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  function buildProject() {
    return {
      project_version: "1.0",
      job: {
        ...state.job,
        slides: state.workingSlides.map((slide) => ({
          id: slide.id,
          type: slide.type,
          text: slide.text,
          image_hint: slide.image_hint || ""
        }))
      },
      assignments: state.workingSlides.map((slide) => {
        const assignment = state.assignments.get(slide.id);

        return {
          slide_id: slide.id,
          filename: assignment?.filename || "",
          zoom: assignment?.zoom ?? 1,
          x: assignment?.x ?? 0,
          y: assignment?.y ?? 0
        };
      })
    };
  }

  els.downloadProject.addEventListener("click", () => {
    if (!state.job) return;

    const project = buildProject();
    const blob = new Blob(
      [JSON.stringify(project, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "project.json";
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const EXAMPLE_JOB = {
    schema_version: "1.0",
    template: "EC_IG_GALERIA_01",
    source_url: "https://elcomercio.pe/prueba-renderer/",
    network: "instagram",
    format: "fotogaleria",
    approach: "Explicativo",
    objective: "Informar",
    slides: [
      {
        id: 1,
        type: "cover",
        text: "Cinco claves para entender cómo cambia la movilidad en Lima",
        image_hint: "Vista urbana de Lima con tránsito vehicular y transporte público"
      },
      {
        id: 2,
        type: "content",
        text: "La movilidad urbana está cambiando por nuevas rutas, mayor uso del transporte público y ajustes en la infraestructura vial. Estos cambios buscan reducir tiempos de viaje y ordenar mejor el tránsito en zonas congestionadas.",
        image_hint: "Bus de transporte público circulando por una avenida principal de Lima"
      },
      {
        id: 3,
        type: "content",
        text: "Uno de los principales retos sigue siendo conectar mejor los distintos sistemas de transporte. Cuando una persona combina buses y otros servicios, los tiempos de espera y los trasbordos pueden alargar el viaje.",
        image_hint: "Paradero con pasajeros esperando transporte público"
      },
      {
        id: 4,
        type: "content",
        text: "Este slide está hecho deliberadamente más largo para probar el sistema de overflow del renderer. Si supera ocho líneas, debe aparecer una advertencia y la exportación debe bloquearse hasta que el editor lo acorte.",
        image_hint: "Tráfico intenso en una avenida de Lima durante hora punta"
      },
      {
        id: 5,
        type: "content",
        text: "El objetivo final es que moverse por la ciudad sea más predecible. Para conseguirlo no basta con nuevas obras: también se necesita integrar servicios, mejorar la información y medir qué soluciones funcionan.",
        image_hint: "Personas utilizando distintos medios de transporte en una zona urbana"
      }
    ],
    caption: "La forma de movernos por Lima sigue cambiando. Estas son cinco claves para entender algunos de los principales desafíos de la movilidad urbana."
  };

  els.loadExample.addEventListener("click", () => {
    setJob(structuredClone(EXAMPLE_JOB));
  });

  function esc(value) {
    return String(value ?? "")
      .replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));
  }

  document.fonts?.ready.then(() => {
    initBrandAssets().then(renderApp);
  });
})();
