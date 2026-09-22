window.EC_TEMPLATES = window.EC_TEMPLATES || {};

window.EC_TEMPLATES.EC_IG_GALERIA_01 = {
  id: "EC_IG_GALERIA_01",
  label: "Instagram · Fotogalería 01",
  format: "fotogaleria",

  canvas: { width: 1080, height: 1350 },

  assets: {
    logoYellow: "assets/logo-ec-yellow.png",
    logoWhite: "assets/logo-ec-white.png"
  },

  geometry: {
    photoHeight: 807,
    logo: { x: 928, y: 64, size: 88 },
    cover: {
      arrow: { x: 65, y: 703, w: 230, h: 118 },
      titleBox: { x: 0, y: 822, w: 757, h: 350 },
      text: { x: 47, y: 850, width: 660, maxHeight: 285, fontSize: 56, lineHeight: 1.05 }
    },
    content: {
      text: { x: 108, y: 858, right: 108, fontSize: 52, lineHeight: 1.05, maxLines: 8 },
      bottomRule: { x: 108, y: 1336, w: 493, h: 14 }
    }
  },

  colors: {
    yellow: "#FCC716",
    gold: "#AD9130",
    black: "#000000",
    white: "#FFFFFF",
    placeholder: "#DDDDDD"
  },

  async loadAssets() {
    const R = window.EC.Renderer;
    const [logoYellow, logoWhite] = await Promise.all([
      R.loadImage(this.assets.logoYellow),
      R.loadImage(this.assets.logoWhite)
    ]);
    return { logoYellow, logoWhite };
  },

  render({ ctx, item, assignment, assets }) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (item.type === "cover") this.renderCover({ ctx, item, assignment, assets });
    else this.renderContent({ ctx, item, assignment, assets });
  },

  renderCover({ ctx, item, assignment, assets }) {
    const R = window.EC.Renderer;
    const g = this.geometry;

    ctx.fillStyle = this.colors.placeholder;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (assignment?.image) {
      R.drawCrop(ctx, assignment.image, 0, 0, this.canvas.width, this.canvas.height, assignment);
    }

    if (assets?.logoWhite) ctx.drawImage(assets.logoWhite, g.logo.x, g.logo.y, g.logo.size, g.logo.size);

    const arrow = g.cover.arrow;
    ctx.fillStyle = this.colors.black;
    ctx.fillRect(arrow.x, arrow.y, arrow.w, arrow.h);
    ctx.strokeStyle = this.colors.yellow;
    ctx.lineWidth = 7;
    const cy = arrow.y + arrow.h / 2;
    ctx.beginPath();
    ctx.moveTo(arrow.x + 60, cy);
    ctx.lineTo(arrow.x + 165, cy);
    ctx.moveTo(arrow.x + 135, cy - 30);
    ctx.lineTo(arrow.x + 165, cy);
    ctx.lineTo(arrow.x + 135, cy + 30);
    ctx.stroke();

    const box = g.cover.titleBox;
    ctx.fillStyle = this.colors.yellow;
    ctx.fillRect(box.x, box.y, box.w, box.h);

    const cfg = g.cover.text;
    R.setFont(ctx, cfg.fontSize);
    ctx.fillStyle = this.colors.black;
    ctx.textBaseline = "top";
    R.drawWrappedText(ctx, item.text, cfg.x, cfg.y, cfg.width, cfg.fontSize * cfg.lineHeight);
  },

  renderContent({ ctx, item, assignment, assets }) {
    const R = window.EC.Renderer;
    const g = this.geometry;

    ctx.fillStyle = this.colors.white;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (assignment?.image) {
      R.drawCrop(ctx, assignment.image, 0, 0, this.canvas.width, g.photoHeight, assignment);
    } else {
      ctx.fillStyle = this.colors.placeholder;
      ctx.fillRect(0, 0, this.canvas.width, g.photoHeight);
    }

    if (assets?.logoYellow) ctx.drawImage(assets.logoYellow, g.logo.x, g.logo.y, g.logo.size, g.logo.size);

    const cfg = g.content.text;
    R.setFont(ctx, cfg.fontSize);
    ctx.fillStyle = this.colors.black;
    ctx.textBaseline = "top";
    R.drawWrappedText(ctx, item.text, cfg.x, cfg.y, this.canvas.width - cfg.x - cfg.right, cfg.fontSize * cfg.lineHeight);

    const rule = g.content.bottomRule;
    ctx.fillStyle = this.colors.gold;
    ctx.fillRect(rule.x, rule.y, rule.w, rule.h);
  },

  validate({ ctx, item }) {
    const R = window.EC.Renderer;
    if (!item.text?.trim()) return { ok: false, code: "empty_text", message: "el texto está vacío." };

    if (item.type === "cover") {
      const cfg = this.geometry.cover.text;
      R.setFont(ctx, cfg.fontSize);
      const lines = R.wrapLines(ctx, item.text, cfg.width);
      const height = lines.length * cfg.fontSize * cfg.lineHeight;
      return height <= cfg.maxHeight
        ? { ok: true, lines: lines.length, height }
        : { ok: false, code: "overflow", lines: lines.length, height, message: "el titular excede el espacio disponible." };
    }

    const cfg = this.geometry.content.text;
    R.setFont(ctx, cfg.fontSize);
    const width = this.canvas.width - cfg.x - cfg.right;
    const lines = R.wrapLines(ctx, item.text, width);

    return lines.length <= cfg.maxLines
      ? { ok: true, lines: lines.length }
      : { ok: false, code: "overflow", lines: lines.length, message: `el texto usa ${lines.length} líneas y el máximo permitido es ${cfg.maxLines}.` };
  },

  exportFilename(item) {
    return `slide_${String(item.id).padStart(2, "0")}.png`;
  }
};
