(() => {
  const state = {
    job: null,
    images: new Map(),
    assignments: new Map(),
    logoYellow: null,
    logoWhite: null
  };

  const $ = (id) => document.getElementById(id);

  const els = {
    jobInput: $("jobInput"),
    imageInput: $("imageInput"),
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

    if (!job || typeof job !== "object") errors.push("JSON inválido.");
    if (job?.schema_version !== "1.0") errors.push("schema_version debe ser 1.0.");
    if (!window.EC_TEMPLATES?.[job?.template]) errors.push("Plantilla no reconocida.");
    if (!Array.isArray(job?.slides) || !job.slides.length) errors.push("El JSON no contiene slides.");

    if (Array.isArray(job?.slides)) {
      job.slides.forEach((s, i) => {
        if (s.id !== i + 1) errors.push(`Slide ${i + 1}: id inválido.`);
        if (i === 0 && s.type !== "cover") errors.push("El primer slide debe ser cover.");
        if (i > 0 && s.type !== "content") errors.push(`Slide ${i + 1} debe ser content.`);
        if (typeof s.text !== "string" || !s.text.trim()) errors.push(`Slide ${i + 1}: falta texto.`);
      });
    }

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

    state.job = job;
    state.assignments.clear();
    renderApp();
  }

  els.jobInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setJob(await readJsonFile(file));
    } catch (err) {
      alert("No se pudo leer el JSON: " + err.message);
    }
  });

  els.imageInput.addEventListener("change", async (e) => {
    state.images.clear();

    for (const file of [...e.target.files]) {
      const url = URL.createObjectURL(file);
      const image = await loadImage(url);
      state.images.set(file.name, { file, url, image });
    }

    if (state.job && state.assignments.size === 0) {
      const names = [...state.images.keys()];

      state.job.slides.forEach((slide, i) => {
        if (names[i]) {
          state.assignments.set(slide.id, {
            filename: names[i],
            zoom: 1,
            x: 0,
            y: 0
          });
        }
      });
    }

    renderApp();
  });

  function renderApp() {
    renderSummary();
    renderSlides();
    els.caption.textContent = state.job?.caption || "—";

    const ready =
      !!state.job &&
      state.job.slides.every((s) => state.assignments.get(s.id)?.filename);

    els.downloadZip.disabled = !ready;
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
      <span><strong>Slides:</strong>${state.job.slides.length}</span>
      <span><strong>Enfoque:</strong>${esc(state.job.approach || "—")}</span>
      <span><strong>Objetivo:</strong>${esc(state.job.objective || "—")}</span>
      <span><strong>Fotos cargadas:</strong>${state.images.size}</span>
    `;
  }

  function renderSlides() {
    els.slides.innerHTML = "";
    if (!state.job) return;

    for (const slide of state.job.slides) {
      const card = document.createElement("article");
      card.className = "slide-card";

      card.innerHTML = `
        <div class="slide-head">
          <strong>${slide.type === "cover" ? "PORTADA" : `SLIDE ${slide.id}`}</strong>
          <span>${slide.text.length} caracteres</span>
        </div>

        <div class="preview-wrap">
          <canvas width="1080" height="1350" data-slide="${slide.id}"></canvas>
        </div>

        <div class="slide-body">
          <label>Fotografía</label>

          <select data-role="image" data-slide="${slide.id}">
            <option value="">Seleccionar fotografía…</option>
            ${[...state.images.keys()]
              .map((name) => `<option value="${attr(name)}">${esc(name)}</option>`)
              .join("")}
          </select>

          <div class="hint">
            <strong>Sugerencia:</strong> ${esc(slide.image_hint || "—")}
          </div>

          <div class="range-row">
            <span>Zoom</span>
            <input data-role="zoom" data-slide="${slide.id}" type="range" min="1" max="3" step=".01" value="1">
            <span data-value="zoom">1.00×</span>
          </div>

          <div class="range-row">
            <span>Horizontal</span>
            <input data-role="x" data-slide="${slide.id}" type="range" min="-1" max="1" step=".01" value="0">
            <span data-value="x">0</span>
          </div>

          <div class="range-row">
            <span>Vertical</span>
            <input data-role="y" data-slide="${slide.id}" type="range" min="-1" max="1" step=".01" value="0">
            <span data-value="y">0</span>
          </div>

          <p class="status" data-role="status" data-slide="${slide.id}"></p>

          <button class="secondary" data-role="download" data-slide="${slide.id}">
            Descargar PNG
          </button>
        </div>
      `;

      els.slides.appendChild(card);

      const assignment = state.assignments.get(slide.id);

      if (assignment) {
        card.querySelector('[data-role="image"]').value = assignment.filename || "";

        for (const k of ["zoom", "x", "y"]) {
          const input = card.querySelector(`[data-role="${k}"]`);
          input.value = assignment[k] ?? (k === "zoom" ? 1 : 0);
          updateRangeLabel(input, k);
        }
      }

      bindCard(card, slide);
      renderSlide(slide.id);
    }
  }

  function bindCard(card, slide) {
    const select = card.querySelector('[data-role="image"]');

    select.addEventListener("change", () => {
      const prev = state.assignments.get(slide.id) || {
        zoom: 1,
        x: 0,
        y: 0
      };

      state.assignments.set(slide.id, {
        ...prev,
        filename: select.value
      });

      renderSlide(slide.id);
      renderSummary();
      updateGlobalStatus();

      els.downloadZip.disabled = !state.job.slides.every(
        (s) => state.assignments.get(s.id)?.filename
      );
    });

    for (const key of ["zoom", "x", "y"]) {
      const input = card.querySelector(`[data-role="${key}"]`);

      input.addEventListener("input", () => {
        const assignment = state.assignments.get(slide.id) || {
          filename: select.value,
          zoom: 1,
          x: 0,
          y: 0
        };

        assignment[key] = Number(input.value);
        state.assignments.set(slide.id, assignment);

        updateRangeLabel(input, key);
        renderSlide(slide.id);
      });
    }

    card.querySelector('[data-role="download"]').addEventListener("click", async () => {
      await downloadCanvas(
        card.querySelector("canvas"),
        `slide_${String(slide.id).padStart(2, "0")}.png`
      );
    });
  }

  function updateRangeLabel(input, key) {
    const span = input.parentElement.querySelector(`[data-value="${key}"]`);
    if (!span) return;

    const n = Number(input.value);
    span.textContent = key === "zoom" ? `${n.toFixed(2)}×` : n.toFixed(2);
  }

  function setFont(ctx, size) {
    ctx.font = `700 ${size}px "Noto Serif", Georgia, serif`;
  }

  function wrapLines(ctx, text, maxWidth) {
    const words = text.trim().split(/\s+/);
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

    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i * lineHeight);
    });

    return {
      lines,
      height: lines.length * lineHeight
    };
  }

  function renderSlide(id) {
    if (!state.job) return;

    const slide = state.job.slides.find((s) => s.id === id);
    const canvas = document.querySelector(`canvas[data-slide="${id}"]`);
    const status = document.querySelector(`[data-role="status"][data-slide="${id}"]`);

    if (!canvas || !slide) return;

    const ctx = canvas.getContext("2d");
    const t = window.EC_TEMPLATES[state.job.template];

    ctx.clearRect(0, 0, t.width, t.height);

    const assignment = state.assignments.get(id);
    const imageRecord = assignment?.filename
      ? state.images.get(assignment.filename)
      : null;

    if (slide.type === "cover") {
      drawCover(ctx, t, slide, imageRecord?.image, assignment);
    } else {
      drawContent(ctx, t, slide, imageRecord?.image, assignment);
    }

    const validation = validateText(ctx, t, slide);

    status.textContent = validation.ok
      ? (imageRecord ? "✓ Diseño válido" : "Falta asignar fotografía")
      : `⚠ ${validation.message}`;

    status.className =
      "status " + (validation.ok && imageRecord ? "ok" : "warn");
  }

  function drawCover(ctx, t, slide, img, assignment = {}) {
    ctx.fillStyle = "#dddddd";
    ctx.fillRect(0, 0, t.width, t.height);

    if (img) {
      drawCrop(ctx, img, 0, 0, t.width, t.height, assignment);
    }

    if (state.logoWhite) {
      ctx.drawImage(
        state.logoWhite,
        t.logo.x,
        t.logo.y,
        t.logo.size,
        t.logo.size
      );
    }

    const arrow = t.cover.arrow;

    ctx.fillStyle = t.colors.black;
    ctx.fillRect(arrow.x, arrow.y, arrow.w, arrow.h);

    ctx.strokeStyle = t.colors.yellow;
    ctx.lineWidth = 7;

    const cy = arrow.y + arrow.h / 2;

    ctx.beginPath();
    ctx.moveTo(arrow.x + 60, cy);
    ctx.lineTo(arrow.x + 165, cy);

    ctx.moveTo(arrow.x + 135, cy - 30);
    ctx.lineTo(arrow.x + 165, cy);
    ctx.lineTo(arrow.x + 135, cy + 30);
    ctx.stroke();

    const box = t.cover.titleBox;

    ctx.fillStyle = t.colors.yellow;
    ctx.fillRect(box.x, box.y, box.w, box.h);

    const cfg = t.cover.text;

    setFont(ctx, cfg.fontSize);
    ctx.fillStyle = t.colors.black;
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

  function drawContent(ctx, t, slide, img, assignment = {}) {
    ctx.fillStyle = t.colors.white;
    ctx.fillRect(0, 0, t.width, t.height);

    if (img) {
      drawCrop(
        ctx,
        img,
        0,
        0,
        t.width,
        t.photoHeight,
        assignment
      );
    } else {
      ctx.fillStyle = "#dddddd";
      ctx.fillRect(0, 0, t.width, t.photoHeight);
    }

    if (state.logoYellow) {
      ctx.drawImage(
        state.logoYellow,
        t.logo.x,
        t.logo.y,
        t.logo.size,
        t.logo.size
      );
    }

    const cfg = t.content.text;

    setFont(ctx, cfg.fontSize);
    ctx.fillStyle = t.colors.black;
    ctx.textBaseline = "top";

    drawWrappedText(
      ctx,
      slide.text,
      cfg.x,
      cfg.y,
      t.width - cfg.x - cfg.right,
      cfg.fontSize * cfg.lineHeight
    );

    const rule = t.content.bottomRule;

    ctx.fillStyle = t.colors.gold;
    ctx.fillRect(rule.x, rule.y, rule.w, rule.h);
  }

  function drawCrop(ctx, img, x, y, w, h, assignment = {}) {
    const zoom = Math.max(1, Number(assignment?.zoom || 1));
    const panX = Number(assignment?.x || 0);
    const panY = Number(assignment?.y || 0);

    const imgRatio = img.width / img.height;
    const boxRatio = w / h;

    let sw;
    let sh;

    if (imgRatio > boxRatio) {
      sh = img.height / zoom;
      sw = sh * boxRatio;
    } else {
      sw = img.width / zoom;
      sh = sw / boxRatio;
    }

    const maxX = Math.max(0, img.width - sw);
    const maxY = Math.max(0, img.height - sh);

    const sx = ((panX + 1) / 2) * maxX;
    const sy = ((panY + 1) / 2) * maxY;

    ctx.drawImage(
      img,
      sx,
      sy,
      sw,
      sh,
      x,
      y,
      w,
      h
    );
  }

  function validateText(ctx, t, slide) {
    if (slide.type === "cover") {
      const cfg = t.cover.text;

      setFont(ctx, cfg.fontSize);

      const height =
        wrapLines(ctx, slide.text, cfg.width).length *
        cfg.fontSize *
        cfg.lineHeight;

      return height <= cfg.maxHeight
        ? { ok: true }
        : {
            ok: false,
            message: `el titular excede el alto disponible (${Math.ceil(height)} px / ${cfg.maxHeight} px)`
          };
    }

    const cfg = t.content.text;

    setFont(ctx, cfg.fontSize);

    const width = t.width - cfg.x - cfg.right;

    const height =
      wrapLines(ctx, slide.text, width).length *
      cfg.fontSize *
      cfg.lineHeight;

    return height <= cfg.maxHeight
      ? { ok: true }
      : {
          ok: false,
          message: `el texto excede el alto disponible (${Math.ceil(height)} px / ${cfg.maxHeight} px)`
        };
  }

  function updateGlobalStatus() {
    if (!state.job) {
      els.globalStatus.textContent = "";
      return;
    }

    const unassigned =
      state.job.slides.filter(
        (s) => !state.assignments.get(s.id)?.filename
      ).length;

    const warnings =
      [...document.querySelectorAll('[data-role="status"]')]
        .filter((el) => el.textContent.startsWith("⚠")).length;

    if (unassigned) {
      els.globalStatus.textContent =
        `Faltan ${unassigned} fotografía(s) por asignar.`;

      els.globalStatus.className = "status warn";
    } else if (warnings) {
      els.globalStatus.textContent =
        `Hay ${warnings} slide(s) con advertencias de texto.`;

      els.globalStatus.className = "status warn";
    } else {
      els.globalStatus.textContent =
        "✓ Proyecto listo para exportar.";

      els.globalStatus.className = "status ok";
    }
  }

  async function downloadCanvas(canvas, filename) {
    const blob =
      await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  els.downloadZip.addEventListener("click", async () => {
    if (!window.JSZip) {
      alert(
        "No se pudo cargar JSZip. Descarga cada PNG de forma individual."
      );
      return;
    }

    const zip = new JSZip();

    for (const slide of state.job.slides) {
      const canvas =
        document.querySelector(`canvas[data-slide="${slide.id}"]`);

      const blob =
        await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

      zip.file(
        `slide_${String(slide.id).padStart(2, "0")}.png`,
        blob
      );
    }

    zip.file(
      "job.json",
      JSON.stringify(state.job, null, 2)
    );

    const blob =
      await zip.generateAsync({ type: "blob" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "ec-social-galeria.zip";
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  els.downloadProject.addEventListener("click", () => {
    if (!state.job) return;

    const project = {
      project_version: "1.0",
      job: state.job,
      assignments:
        [...state.assignments.entries()].map(
          ([slide_id, assignment]) => ({
            slide_id,
            filename: assignment.filename || "",
            zoom: assignment.zoom ?? 1,
            x: assignment.x ?? 0,
            y: assignment.y ?? 0
          })
        )
    };

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

  els.loadExample.addEventListener("click", async () => {
    try {
      const res = await fetch("examples/job-ejemplo.json");
      setJob(await res.json());

      state.images.clear();

      for (let i = 1; i <= 5; i++) {
        const url = `examples/photos/photo_${i}.jpg`;
        const image = await loadImage(url);

        state.images.set(
          `photo_${i}.jpg`,
          { file: null, url, image }
        );
      }

      state.assignments.clear();

      state.job.slides.forEach((slide, i) => {
        state.assignments.set(slide.id, {
          filename: `photo_${i + 1}.jpg`,
          zoom: 1,
          x: 0,
          y: 0
        });
      });

      renderApp();
    } catch (err) {
      alert(
        "El ejemplo necesita servirse por HTTP (GitHub Pages o python3 -m http.server)."
      );
    }
  });

  function esc(s) {
    return String(s ?? "").replace(
      /[&<>"']/g,
      (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[ch])
    );
  }

  function attr(s) {
    return esc(s);
  }

  document.fonts?.ready.then(() => {
    initBrandAssets().then(renderApp);
  });
})();
