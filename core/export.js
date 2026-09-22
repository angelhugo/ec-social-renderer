window.EC = window.EC || {};

window.EC.Export = {
  canvasBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  },

  async downloadCanvas(canvas, filename) {
    const blob = await this.canvasBlob(canvas);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  async downloadZip(entries, projectData, filename) {
    if (!window.JSZip) throw new Error("JSZip no está disponible.");

    const zip = new JSZip();
    for (const entry of entries) {
      zip.file(entry.filename, await this.canvasBlob(entry.canvas));
    }
    zip.file("project.json", JSON.stringify(projectData, null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
