(() => {
  const state = { project: null, format: null, template: null, templateAssets: null };
  const $ = (id) => document.getElementById(id);
  const els = {
    jobInput: $("jobInput"),
    items: $("slidesSection"),
    summary: $("summary"),
    caption: $("caption"),
    downloadZip: $("downloadZip"),
    downloadProject: $("downloadProject"),
    globalStatus: $("globalStatus"),
    loadExample: $("loadExample")
  };

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  async function readJsonFile(file) { return JSON.parse(await file.text()); }

  async function setJob(job) {
    const errors = window.EC.Project.validateJob(job);
    if (errors.length) return alert(errors.join("\n"));

    state.project = window.EC.Project.create(job);
    state.format = window.EC_FORMATS[state.project.formatId];
    state.template = window.EC_TEMPLATES[state.project.templateId];
    state.templateAssets = await state.template.loadAssets();
    renderApp();
  }

  els.jobInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await setJob(await readJsonFile(file)); }
    catch (error) { alert("No se pudo leer el JSON: " + error.message); }
  });

  function renderApp() {
    renderSummary();
    renderItems();
    els.caption.textContent = state.project?.job?.caption || "—";
    els.downloadProject.disabled = !state.project;
    updateGlobalStatus();
  }

  function renderSummary() {
    if (!state.project) {
      els.summary.innerHTML = "<span>Carga un job.json para empezar.</span>";
      return;
    }
    const job = state.project.job;
    els.summary.innerHTML = `
      <span><strong>Formato:</strong>${esc(state.format.label)}</span>
      <span><strong>Plantilla:</strong>${esc(state.template.label)}</span>
      <span><strong>Piezas:</strong>${state.project.items.length}</span>
      <span><strong>Enfoque:</strong>${esc(job.approach || "—")}</span>
      <span><strong>Objetivo:</strong>${esc(job.objective || "—")}</span>`;
  }

  function renderItems() {
    els.items.innerHTML = "";
    if (!state.project) return;
    for (const item of state.project.items) els.items.appendChild(buildItemCard(item));
    for (const item of state.project.items) renderItem(item.id);
  }

  function buildItemCard(item) {
    const assignment = state.project.assignments.get(item.id);
    const card = document.createElement("article");
    card.className = "slide-card";
    card.dataset.item = String(item.id);

    const field = state.format.getEditableFields(item)[0];
    const imageHint = state.format.getImageHint(item);

    card.innerHTML = `
      <div class="slide-head">
        <strong>${esc(state.format.getItemLabel(item))}</strong>
        <span data-role="head-count">${String(item.text || "").length} caracteres</span>
      </div>
      <div class="preview-wrap">
        <canvas width="${state.template.canvas.width}" height="${state.template.canvas.height}" data-role="canvas"></canvas>
      </div>
      <div class="slide-body">
        <label>${esc(field.label)}</label>
        <textarea class="text-editor" data-field="${esc(field.key)}" spellcheck="true">${esc(item[field.key] || "")}</textarea>
        <div class="char-row">
          <span>${esc(field.help || "")}</span>
          <span data-role="char-count">${String(item.text || "").length}</span>
        </div>
        <div class="image-block">
          <p class="hint"><strong>Imagen sugerida:</strong> ${esc(imageHint)}</p>
          <div class="photo-placeholder ${assignment?.image ? "hidden" : ""}" data-role="placeholder">
            <strong>Falta fotografía</strong>Selecciona la imagen para esta pieza.
          </div>
          <label>${assignment?.image ? "Cambiar fotografía" : "Subir fotografía"}</label>
          <input data-role="photo" type="file" accept="image/jpeg,image/png,image/webp">
          <div class="photo-name ${assignment?.image ? "" : "hidden"}" data-role="photo-name">${esc(assignment?.filename || "")}</div>
          <div class="photo-controls ${assignment?.image ? "" : "hidden"}" data-role="photo-controls">
            ${range("zoom", "Zoom", assignment?.zoom ?? 1, 1, 3, .01, true)}
            ${range("x", "Horizontal", assignment?.x ?? 0, -1, 1, .01)}
            ${range("y", "Vertical", assignment?.y ?? 0, -1, 1, .01)}
          </div>
        </div>
        <p class="status" data-role="status"></p>
        <div class="card-actions">
          <button class="secondary" data-role="reset-text" type="button">Restaurar texto</button>
          <button class="secondary" data-role="download" type="button">Descargar PNG</button>
        </div>
      </div>`;

    bindCard(card, item);
    return card;
  }

  function range(key, label, value, min, max, step, zoom = false) {
    return `<div class="range-row">
      <span>${label}</span>
      <input data-role="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">
      <span data-value="${key}">${Number(value).toFixed(2)}${zoom ? "×" : ""}</span>
    </div>`;
  }

  function bindCard(card, item) {
    const text = card.querySelector('[data-field="text"]');
    text.addEventListener("input", () => {
      item.text = text.value;
      card.querySelector('[data-role="char-count"]').textContent = item.text.length;
      card.querySelector('[data-role="head-count"]').textContent = `${item.text.length} caracteres`;
      renderItem(item.id);
      updateGlobalStatus();
    });

    const photo = card.querySelector('[data-role="photo"]');
    photo.addEventListener("change", async () => {
      const file = photo.files?.[0];
      if (!file) return;

      const previous = state.project.assignments.get(item.id);
      if (previous?.url?.startsWith("blob:")) URL.revokeObjectURL(previous.url);

      const url = URL.createObjectURL(file);
      const image = await window.EC.Renderer.loadImage(url);
      state.project.assignments.set(item.id, { filename: file.name, file, url, image, zoom: 1, x: 0, y: 0 });
      renderItems();
      updateGlobalStatus();
    });

    for (const key of ["zoom", "x", "y"]) {
      const input = card.querySelector(`[data-role="${key}"]`);
      input?.addEventListener("input", () => {
        const assignment = state.project.assignments.get(item.id);
        if (!assignment) return;
        assignment[key] = Number(input.value);
        card.querySelector(`[data-value="${key}"]`).textContent = `${assignment[key].toFixed(2)}${key === "zoom" ? "×" : ""}`;
        renderItem(item.id);
      });
    }

    card.querySelector('[data-role="reset-text"]').addEventListener("click", () => {
      item.text = item.original_text;
      text.value = item.original_text;
      card.querySelector('[data-role="char-count"]').textContent = item.text.length;
      card.querySelector('[data-role="head-count"]').textContent = `${item.text.length} caracteres`;
      renderItem(item.id);
      updateGlobalStatus();
    });

    card.querySelector('[data-role="download"]').addEventListener("click", async () => {
      await window.EC.Export.downloadCanvas(card.querySelector('[data-role="canvas"]'), state.template.exportFilename(item));
    });
  }

  function getCard(id) { return document.querySelector(`.slide-card[data-item="${id}"]`); }
  function getItem(id) { return state.project.items.find((item) => item.id === id); }

  function renderItem(id) {
    const item = getItem(id);
    const card = getCard(id);
    if (!item || !card) return;

    const canvas = card.querySelector('[data-role="canvas"]');
    const ctx = canvas.getContext("2d");
    const assignment = state.project.assignments.get(id);

    state.template.render({ ctx, item, assignment, assets: state.templateAssets });
    const validation = state.template.validate({ ctx, item });
    const hasImage = !state.format.usesImage(item) || !!assignment?.image;
    const status = card.querySelector('[data-role="status"]');

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

  function allImagesPresent() {
    return state.project && state.project.items.every((item) => !state.format.usesImage(item) || !!state.project.assignments.get(item.id)?.image);
  }

  function allValid() {
    return state.project && state.project.items.every((item) => {
      const canvas = getCard(item.id)?.querySelector('[data-role="canvas"]');
      return canvas && state.template.validate({ ctx: canvas.getContext("2d"), item }).ok;
    });
  }

  function updateGlobalStatus() {
    if (!state.project) {
      els.globalStatus.textContent = "";
      els.downloadZip.disabled = true;
      return;
    }

    const invalid = state.project.items.filter((item) => {
      const canvas = getCard(item.id)?.querySelector('[data-role="canvas"]');
      return !canvas || !state.template.validate({ ctx: canvas.getContext("2d"), item }).ok;
    }).length;

    const missing = state.project.items.filter((item) => state.format.usesImage(item) && !state.project.assignments.get(item.id)?.image).length;

    if (invalid) {
      els.globalStatus.textContent = `Hay ${invalid} pieza(s) con errores de validación. Corrige el texto antes de exportar.`;
      els.globalStatus.className = "status warn";
    } else if (missing) {
      els.globalStatus.textContent = `Faltan ${missing} fotografía(s) por asignar.`;
      els.globalStatus.className = "status warn";
    } else {
      els.globalStatus.textContent = "✓ Proyecto listo para exportar.";
      els.globalStatus.className = "status ok";
    }

    els.downloadZip.disabled = !(allImagesPresent() && allValid());
  }

  els.downloadProject.addEventListener("click", () => {
    if (state.project) window.EC.Export.downloadJson(window.EC.Project.serialize(state.project), "project.json");
  });

  els.downloadZip.addEventListener("click", async () => {
    if (!(allImagesPresent() && allValid())) return alert("Antes de exportar, todas las piezas deben estar completas y pasar la validación.");
    const entries = state.project.items.map((item) => ({ canvas: getCard(item.id).querySelector('[data-role="canvas"]'), filename: state.template.exportFilename(item) }));
    try {
      await window.EC.Export.downloadZip(entries, window.EC.Project.serialize(state.project), "ec-social-galeria.zip");
    } catch (error) { alert(error.message); }
  });

  els.loadExample.addEventListener("click", async () => setJob(window.EC_FORMATS.fotogaleria.getExampleJob()));
  document.fonts?.ready.then(renderApp);
})();
