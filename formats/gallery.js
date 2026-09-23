window.EC_FORMATS = window.EC_FORMATS || {};

window.EC_FORMATS.fotogaleria = {
  id: "fotogaleria",
  label: "Fotogalería",

  validateJob(job) {
    const errors = [];
    if (!Array.isArray(job.slides) || !job.slides.length) return ["El JSON no contiene slides."];

    job.slides.forEach((slide, index) => {
      if (slide.id !== index + 1) errors.push(`Slide ${index + 1}: id inválido.`);
      if (index === 0 && slide.type !== "cover") errors.push("El primer slide debe ser cover.");
      if (index > 0 && slide.type !== "content") errors.push(`Slide ${index + 1} debe ser content.`);
      if (typeof slide.text !== "string" || !slide.text.trim()) errors.push(`Slide ${index + 1}: falta texto.`);
      if (slide.title !== undefined && typeof slide.title !== "string") {
        errors.push(`Slide ${index + 1}: title debe ser una cadena de texto.`);
      }
      if (index === 0 && slide.title !== undefined) {
        errors.push("La portada utiliza text; no admite title.");
      }
    });

    return errors;
  },

  normalize(job) {
    return job.slides.map((slide) => ({
      ...structuredClone(slide),
      title: slide.type === "content" ? (slide.title ?? "") : undefined,
      original_title: slide.type === "content" ? (slide.title ?? "") : undefined,
      original_text: slide.text
    }));
  },

  serialize(job, items) {
    return {
      ...structuredClone(job),
      slides: items.map((item) => ({
        id: item.id,
        type: item.type,
        ...(item.type === "content" && item.title?.trim()
          ? { title: item.title.trim() }
          : {}),
        text: item.text,
        image_hint: item.image_hint || ""
      }))
    };
  },

  getItemLabel(item) {
    return item.type === "cover" ? "PORTADA" : `SLIDE ${item.id}`;
  },

  getEditableFields(item) {
    return [
      ...(item.type === "content"
        ? [{ key: "title", label: "Título (opcional)", type: "input",
             placeholder: "Añade un título o déjalo en blanco",
             help: "Si lo dejas vacío, el texto ocupará toda la caja." }]
        : []),
      { key: "text", label: item.type === "cover" ? "Titular de portada" : "Texto",
        type: "textarea", help: "Los cambios actualizan la pieza al instante." }
    ];
  },

  usesImage() { return true; },
  getImageHint(item) { return item.image_hint || "Sin sugerencia"; },

  getExampleJob() {
    return {
      schema_version: "1.0",
      template: "EC_IG_GALERIA_01",
      source_url: "https://elcomercio.pe/prueba-renderer/",
      network: "instagram",
      format: "fotogaleria",
      approach: "Explicativo",
      objective: "Informar",
      slides: [
        { id: 1, type: "cover", text: "Cinco claves para entender cómo cambia la movilidad en Lima", image_hint: "Vista urbana de Lima con tránsito vehicular y transporte público" },
        { id: 2, type: "content", title: "Cambios en la movilidad", text: "La movilidad urbana está cambiando por nuevas rutas, mayor uso del transporte público y ajustes en la infraestructura vial. Estos cambios buscan reducir tiempos de viaje y ordenar mejor el tránsito en zonas congestionadas.", image_hint: "Bus de transporte público circulando por una avenida principal de Lima" },
        { id: 3, type: "content", text: "Uno de los principales retos sigue siendo conectar mejor los distintos sistemas de transporte. Cuando una persona combina buses y otros servicios, los tiempos de espera y los trasbordos pueden alargar el viaje.", image_hint: "Paradero con pasajeros esperando transporte público" },
        { id: 4, type: "content", title: "Prueba de overflow", text: "Este slide está hecho deliberadamente más largo para probar el sistema de overflow del renderer. Si supera ocho líneas, debe aparecer una advertencia y la exportación debe bloquearse hasta que el editor lo acorte.", image_hint: "Tráfico intenso en una avenida de Lima durante hora punta" },
        { id: 5, type: "content", text: "El objetivo final es que moverse por la ciudad sea más predecible. Para conseguirlo no basta con nuevas obras: también se necesita integrar servicios, mejorar la información y medir qué soluciones funcionan.", image_hint: "Personas utilizando distintos medios de transporte en una zona urbana" }
      ],
      caption: "La forma de movernos por Lima sigue cambiando. Estas son cinco claves para entender algunos de los principales desafíos de la movilidad urbana."
    };
  }
};
