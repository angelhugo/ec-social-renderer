window.EC = window.EC || {};

window.EC.Project = {
  validateJob(job) {
    const errors = [];

    if (!job || typeof job !== "object") return ["JSON inválido."];
    if (job.schema_version !== "1.0") errors.push("schema_version debe ser 1.0.");

    const format = window.EC_FORMATS?.[job.format];
    if (!format) {
      errors.push(`Formato no reconocido: ${job.format || "—"}.`);
      return errors;
    }

    const template = window.EC_TEMPLATES?.[job.template];
    if (!template) {
      errors.push(`Plantilla no reconocida: ${job.template || "—"}.`);
      return errors;
    }

    if (template.format !== job.format) {
      errors.push(`La plantilla ${job.template} no corresponde al formato ${job.format}.`);
    }

    return errors.concat(format.validateJob(job));
  },

  create(job) {
    const format = window.EC_FORMATS[job.format];
    return {
      originalJob: structuredClone(job),
      job: structuredClone(job),
      formatId: job.format,
      templateId: job.template,
      items: format.normalize(job),
      assignments: new Map()
    };
  },

  createWorkingProject(job) {
    return this.create(job);
  },

  serialize(project) {
    const format = window.EC_FORMATS[project.formatId];
    const updatedJob = format.serialize(project.job, project.items);

    return {
      project_version: "1.0",
      renderer_version: "0.3.8",
      job: updatedJob,
      assignments: project.items.map((item) => {
        const assignment = project.assignments.get(item.id);
        return {
          item_id: item.id,
          filename: assignment?.filename || "",
          is_placeholder: Boolean(assignment?.is_placeholder),
          zoom: assignment?.zoom ?? 1,
          x: assignment?.x ?? 0,
          y: assignment?.y ?? 0
        };
      })
    };
  }
};
