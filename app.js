(() => {
  window.EC_RENDERER_VERSION = "0.3.6";
  const state = {
    project: null,
    template: null,
    format: null,
    templateAssets: null,
    placeholderPool: [
      "examples/photos/photo_1.jpg",
      "examples/photos/photo_2.jpg",
      "examples/photos/photo_3.jpg",
      "examples/photos/photo_4.jpg",
      "examples/photos/photo_5.jpg"
    ]
  };

  const $ = (id) => document.getElementById(id);

  const els = {
    jsonPaste: $("jsonPaste"),
    loadPastedJson: $("loadPastedJson"),
    jsonInputStatus: $("jsonInputStatus"),
    jobInput: $("jobInput"),
    items: $("slidesSection"),
    summary: $("summary"),
    caption: $("caption"),
    downloadZip: $("downloadZip"),
    downloadProject: $("downloadProject"),
    globalStatus: $("globalStatus"),
    loadExample: $("loadExample")
  };

  async function readJsonFile(file) {
    return JSON.parse(await file.text());
  }

  async function setJob(job, options = {}) {
    const errors = window.EC.Project.validateJob(job);

    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }

    const projectFactory =
      window.EC.Project.createWorkingProject ||
      window.EC.Project.create;

    if (typeof projectFactory !== "function") {
      throw new Error(
        "El módulo core/project.js no expone createWorkingProject() ni create()."
      );
    }

    state.project = projectFactory.call(window.EC.Project, job);
    state.format = window.EC_FORMATS[state.project.formatId];
    state.template = window.EC_TEMPLATES[state.project.templateId];
    state.templateAssets = await state.template.loadAssets();

    if (options.withPlaceholders !== false) {
      await preloadPlaceholderImages();
    }

    renderApp();
  }

  async function preloadPlaceholderImages() {
    const cache = new Map();

    for (const item of state.project.items) {
      if (!state.format.usesImage(item)) continue;
      if (state.project.assignments.get(item.id)?.image) continue;

      const path = state.placeholderPool[(item.id - 1) % state.placeholderPool.length];

      if (!cache.has(path)) {
        try {
          cache.set(path, await window.EC.Renderer.loadImage(path));
        } catch (error) {
          cache.set(path, null);
        }
      }

      const image = cache.get(path);
      if (!image) continue;

      state.project.assignments.set(item.id, {
        filename: path.split("/").pop(),
        file: null,
        url: path,
        image,
        zoom: 1,
        x: 0,
        y: 0,
        is_placeholder: true
      });
    }
  }

  function normalizeJsonText(raw) {
    let text = String(raw || "").trim();

    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\s*/i, "");
      text = text.replace(/\s*```$/, "");
    }

    return text.trim();
  }

  function parseJsonText(raw) {
    const normalized = normalizeJsonText(raw);

    if (!normalized) {
      throw new Error("Pega un JSON antes de continuar.");
    }

    return JSON.parse(normalized);
  }

  function setJsonStatus(message, type = "") {
    if (!els.jsonInputStatus) return;

    els.jsonInputStatus.textContent = message;
    els.jsonInputStatus.className =
      type ? `json-input-status ${type}` : "json-input-status";
  }

  function validatePastedJson() {
    const raw = els.jsonPaste?.value || "";

    if (!raw.trim()) {
      setJsonStatus("");
      if (els.loadPastedJson) els.loadPastedJson.disabled = true;
      return;
    }

    try {
      const job = parseJsonText(raw);
      const errors = window.EC.Project.validateJob(job);

      if (errors.length) {
        setJsonStatus(
          "JSON válido, pero no cumple el formato esperado: " + errors[0],
          "warn"
        );
        if (els.loadPastedJson) els.loadPastedJson.disabled = true;
        return;
      }

      setJsonStatus("✓ JSON válido. Ya puedes generar las piezas.", "ok");
      if (els.loadPastedJson) els.loadPastedJson.disabled = false;
    } catch (error) {
      setJsonStatus("JSON inválido: " + error.message, "warn");
      if (els.loadPastedJson) els.loadPastedJson.disabled = true;
    }
  }

  els.jsonPaste?.addEventListener("input", validatePastedJson);

  els.loadPastedJson?.addEventListener("click", async () => {
    try {
      const job = parseJsonText(els.jsonPaste.value);
      await setJob(job, { withPlaceholders: true });
    } catch (error) {
      setJsonStatus("No se pudo cargar: " + error.message, "warn");
    }
  });

  els.jobInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const raw = await file.text();
      const job = parseJsonText(raw);

      if (els.jsonPaste) {
        els.jsonPaste.value = JSON.stringify(job, null, 2);
      }

      validatePastedJson();
      await setJob(job, { withPlaceholders: true });
    } catch (error) {
      setJsonStatus("No se pudo leer el archivo: " + error.message, "warn");
    }
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
      <span><strong>Objetivo:</strong>${esc(job.objective || "—")}</span>
    `;
  }

  function renderItems() {
    els.items.innerHTML = "";

    if (!state.project) return;

    for (const item of state.project.items) {
      els.items.appendChild(buildItemCard(item));
    }

    for (const item of state.project.items) {
      renderItem(item.id);
    }
  }

  function buildItemCard(item) {
    const assignment = state.project.assignments.get(item.id);
    const card = document.createElement("article");

    card.className = "slide-card";
    card.dataset.item = String(item.id);

    const fieldsHtml = state.format.getEditableFields(item)
      .map((field) => renderField(field, item))
      .join("");

    const imageHtml = state.format.usesImage(item)
      ? renderImageControls(item, assignment)
      : "";

    card.innerHTML = `
      <div class="slide-head">
        <strong>${esc(state.format.getItemLabel(item))}</strong>
        <span data-role="head-count">${String(item.text || "").length} caracteres</span>
      </div>

      <div class="preview-wrap">
        <canvas
          width="${state.template.canvas.width}"
          height="${state.template.canvas.height}"
          data-role="canvas"
        ></canvas>
      </div>

      <div class="slide-body">
        ${fieldsHtml}
        ${imageHtml}

        <p class="status" data-role="status"></p>

        <div class="card-actions">
          <button class="secondary" data-role="reset-text" type="button">
            Restaurar texto
          </button>

          <button class="secondary" data-role="download" type="button">
            Descargar PNG
          </button>
        </div>
      </div>
    `;

    bindCard(card, item);
    return card;
  }

  function renderField(field, item) {
    if (field.type !== "textarea") return "";

    const value = item[field.key] || "";

    return `
      <label>${esc(field.label)}</label>

      <textarea
        class="text-editor"
        data-field="${esc(field.key)}"
        spellcheck="true"
      >${esc(value)}</textarea>

      <div class="char-row">
        <span>${esc(field.help || "")}</span>
        <span data-role="char-count">${String(value).length}</span>
      </div>
    `;
  }

  function imageLabelText(assignment) {
    if (!assignment?.image) return "Subir imagen";
    return "Cambiar imagen";
  }

  function imageFileText(assignment) {
    if (!assignment?.image) return "";
    if (assignment.is_placeholder) {
      return `${assignment.filename} · IMAGEN DE EJEMPLO · REEMPLAZAR`;
    }
    return assignment.filename || "";
  }

  function renderImageControls(item, assignment) {
    return `
      <div class="image-block">
        <p class="hint">
          <strong>Imagen sugerida:</strong>
          ${esc(state.format.getImageHint(item))}
        </p>

        <div
          class="photo-placeholder ${assignment?.image ? "hidden" : ""}"
          data-role="placeholder"
        >
          <strong>Falta fotografía</strong>
          Selecciona la imagen para esta pieza.
        </div>

        <label>${imageLabelText(assignment)}</label>

        <input
          data-role="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
        >

        <div
          class="photo-name ${assignment?.image ? "" : "hidden"}"
          data-role="photo-name"
        >
          ${esc(imageFileText(assignment))}
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
            <span data-value="zoom">${(assignment?.zoom ?? 1).toFixed(2)}×</span>
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
            <span data-value="x">${(assignment?.x ?? 0).toFixed(2)}</span>
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
            <span data-value="y">${(assignment?.y ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function bindCard(card, item) {
    for (const field of state.format.getEditableFields(item)) {
      const input = card.querySelector(`[data-field="${field.key}"]`);

      input?.addEventListener("input", () => {
        item[field.key] = input.value;

        if (field.key === "text") {
          card.querySelector('[data-role="char-count"]').textContent =
            item.text.length;

          card.querySelector('[data-role="head-count"]').textContent =
            `${item.text.length} caracteres`;
        }

        renderItem(item.id);
        updateGlobalStatus();
      });
    }

    const photoInput = card.querySelector('[data-role="photo"]');

    photoInput?.addEventListener("change", async () => {
      const file = photoInput.files?.[0];
      if (!file) return;

      const previous = state.project.assignments.get(item.id);

      if (previous?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(previous.url);
      }

      const url = URL.createObjectURL(file);
      const image = await window.EC.Renderer.loadImage(url);

      state.project.assignments.set(item.id, {
        filename: file.name,
        file,
        url,
        image,
        zoom: 1,
        x: 0,
        y: 0,
        is_placeholder: false
      });

      renderItems();
      updateGlobalStatus();
    });

    for (const key of ["zoom", "x", "y"]) {
      const input = card.querySelector(`[data-role="${key}"]`);

      input?.addEventListener("input", () => {
        const assignment = state.project.assignments.get(item.id);
        if (!assignment) return;

        assignment[key] = Number(input.value);

        const value = card.querySelector(`[data-value="${key}"]`);
        value.textContent =
          key === "zoom"
            ? `${assignment[key].toFixed(2)}×`
            : assignment[key].toFixed(2);

        renderItem(item.id);
      });
    }

    card.querySelector('[data-role="reset-text"]')?.addEventListener(
      "click",
      () => {
        if ("original_text" in item) {
          item.text = item.original_text;

          const input = card.querySelector('[data-field="text"]');
          if (input) input.value = item.original_text;

          card.querySelector('[data-role="char-count"]').textContent =
            item.text.length;

          card.querySelector('[data-role="head-count"]').textContent =
            `${item.text.length} caracteres`;

          renderItem(item.id);
          updateGlobalStatus();
        }
      }
    );

    card.querySelector('[data-role="download"]')?.addEventListener(
      "click",
      async () => {
        const canvas = card.querySelector('[data-role="canvas"]');

        await window.EC.Export.downloadCanvas(
          canvas,
          state.template.exportFilename(item)
        );
      }
    );
  }

  function getCard(itemId) {
    return document.querySelector(
      `.slide-card[data-item="${itemId}"]`
    );
  }

  function getItem(itemId) {
    return state.project.items.find((item) => item.id === itemId);
  }

  function renderItem(itemId) {
    if (!state.project) return;

    const item = getItem(itemId);
    const card = getCard(itemId);

    if (!item || !card) return;

    const canvas = card.querySelector('[data-role="canvas"]');
    const ctx = canvas.getContext("2d");
    const assignment = state.project.assignments.get(itemId);

    state.template.render({
      ctx,
      item,
      assignment,
      assets: state.templateAssets
    });

    const validation = state.template.validate({ ctx, item });
    const hasImage =
      !state.format.usesImage(item) || !!assignment?.image;

    const status = card.querySelector('[data-role="status"]');

    if (!validation.ok) {
      status.textContent = `⚠ OVERFLOW: ${validation.message}`;
      status.className = "status warn";
      card.classList.add("has-overflow");
    } else if (!hasImage) {
      status.textContent = "Falta asignar fotografía";
      status.className = "status warn";
      card.classList.remove("has-overflow");
    } else if (assignment?.is_placeholder) {
      status.textContent = "Usando imagen de ejemplo. Debes reemplazarla.";
      status.className = "status warn";
      card.classList.remove("has-overflow");
    } else {
      status.textContent = "✓ Diseño válido";
      status.className = "status ok";
      card.classList.remove("has-overflow");
    }
  }

  function allRequiredImagesPresent() {
    if (!state.project) return false;

    return state.project.items.every((item) => {
      if (!state.format.usesImage(item)) return true;
      const assignment = state.project.assignments.get(item.id);
      return !!assignment?.image && !assignment?.is_placeholder;
    });
  }

  function allItemsValid() {
    if (!state.project) return false;

    return state.project.items.every((item) => {
      const card = getCard(item.id);
      const canvas = card?.querySelector('[data-role="canvas"]');

      if (!canvas) return false;

      const ctx = canvas.getContext("2d");
      return state.template.validate({ ctx, item }).ok;
    });
  }

  function updateGlobalStatus() {
    if (!state.project) {
      els.globalStatus.textContent = "";
      els.downloadZip.disabled = true;
      return;
    }

    const invalid = state.project.items.filter((item) => {
      const card = getCard(item.id);
      const canvas = card?.querySelector('[data-role="canvas"]');
      if (!canvas) return true;

      return !state.template.validate({
        ctx: canvas.getContext("2d"),
        item
      }).ok;
    }).length;

    const placeholderCount = state.project.items.filter((item) => {
      const assignment = state.project.assignments.get(item.id);
      return state.format.usesImage(item) && assignment?.is_placeholder;
    }).length;

    const missingImages = state.project.items.filter((item) => {
      return (
        state.format.usesImage(item) &&
        !state.project.assignments.get(item.id)?.image
      );
    }).length;

    if (invalid) {
      els.globalStatus.textContent =
        `Hay ${invalid} pieza(s) con errores de validación. Corrige el texto antes de exportar.`;
      els.globalStatus.className = "status warn";
    } else if (missingImages) {
      els.globalStatus.textContent =
        `Faltan ${missingImages} imagen(es) por asignar.`;
      els.globalStatus.className = "status warn";
    } else if (placeholderCount) {
      els.globalStatus.textContent =
        `Debes reemplazar ${placeholderCount} imagen(es) de ejemplo antes de exportar.`;
      els.globalStatus.className = "status warn";
    } else {
      els.globalStatus.textContent = "✓ Proyecto listo para exportar.";
      els.globalStatus.className = "status ok";
    }

    els.downloadZip.disabled =
      !(allRequiredImagesPresent() && allItemsValid());
  }

  els.downloadProject.addEventListener("click", () => {
    if (!state.project) return;

    window.EC.Export.downloadJson(
      window.EC.Project.serialize(state.project),
      "project.json"
    );
  });

  els.downloadZip.addEventListener("click", async () => {
    if (!state.project) return;

    if (!(allRequiredImagesPresent() && allItemsValid())) {
      alert(
        "Antes de exportar, todas las piezas deben tener imágenes reales y pasar la validación."
      );
      return;
    }

    const entries = state.project.items.map((item) => ({
      canvas: getCard(item.id).querySelector('[data-role="canvas"]'),
      filename: state.template.exportFilename(item)
    }));

    try {
      await window.EC.Export.downloadZip(
        entries,
        window.EC.Project.serialize(state.project),
        "ec-social-galeria.zip"
      );
    } catch (error) {
      alert(error.message);
    }
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

  els.loadExample.addEventListener("click", async () => {
    try {
      if (els.jsonPaste) {
        els.jsonPaste.value = JSON.stringify(EXAMPLE_JOB, null, 2);
      }

      validatePastedJson();
      await setJob(structuredClone(EXAMPLE_JOB), { withPlaceholders: true });
    } catch (error) {
      console.error(error);
      setJsonStatus("No se pudo cargar el ejemplo: " + error.message, "warn");
    }
  });

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  document.fonts?.ready.then(() => {
    renderApp();
  });
})();
