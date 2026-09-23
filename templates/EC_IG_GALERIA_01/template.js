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
      text: { x: 47, width: 660, maxHeight: 285, fontSize: 56, lineHeight: 1.05, verticalAlign: "center" }
    },
    content: {
      top: 858,
      left: 108,
      right: 108,
      bottomClearance: 30,
      // No title: one large paragraph; same top-left as the titled variant.
      plain: { fontSize: 52, fontWeight: 400, lineHeight: 1.05, maxLines: 8 },
      // Optional title: editorial hierarchy from the approved mock-up.
      title: { fontSize: 56, fontWeight: 700, lineHeight: 1.05, maxLines: 2 },
      separator: { marginTop: 14, width: 440, height: 4, marginBottom: 23 },
      body: { fontSize: 40, fontWeight: 400, lineHeight: 1.12, maxLines: 5 },
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

    const lineHeightPx = cfg.fontSize * cfg.lineHeight;
    const lines = R.wrapLines(ctx, item.text, cfg.width);
    const textHeight = lines.length * lineHeightPx;

    const textY =
      cfg.verticalAlign === "center"
        ? box.y + Math.max(0, (box.h - textHeight) / 2)
        : (cfg.y ?? box.y);

    R.drawWrappedText(
      ctx,
      item.text,
      cfg.x,
      textY,
      cfg.width,
      lineHeightPx
    );
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

    const cfg = g.content;
    const availableWidth = this.canvas.width - cfg.left - cfg.right;
    const hasTitle = Boolean(item.title?.trim());
    const layout = this.measureContent({ ctx, item });

    // Clip overflowing draft text so it cannot paint over the gold bottom rule.
    ctx.save();
    ctx.beginPath();
    ctx.rect(cfg.left, cfg.top, availableWidth, layout.safeBottom - cfg.top);
    ctx.clip();
    ctx.textBaseline = "top";
    ctx.fillStyle = this.colors.black;

    if (hasTitle) {
      const heading = cfg.title;
      R.setFont(ctx, heading.fontSize, undefined, heading.fontWeight);
      R.drawWrappedText(ctx, item.title.trim(), cfg.left, cfg.top,
        availableWidth, layout.titleLineHeight);

      // Gold divider appears only when a title is present.
      ctx.fillStyle = this.colors.gold;
      ctx.fillRect(cfg.left, layout.dividerY, cfg.separator.width, cfg.separator.height);
      ctx.fillStyle = this.colors.black;
      R.setFont(ctx, cfg.body.fontSize, undefined, cfg.body.fontWeight);
      R.drawWrappedText(ctx, item.text, cfg.left, layout.bodyY,
        availableWidth, layout.bodyLineHeight);
    } else {
      const plain = cfg.plain;
      R.setFont(ctx, plain.fontSize, undefined, plain.fontWeight);
      R.drawWrappedText(ctx, item.text, cfg.left, cfg.top,
        availableWidth, layout.bodyLineHeight);
    }
    ctx.restore();

    const rule = g.content.bottomRule;
    ctx.fillStyle = this.colors.gold;
    ctx.fillRect(rule.x, rule.y, rule.w, rule.h);
  },

  measureContent({ ctx, item }) {
    const R = window.EC.Renderer;
    const cfg = this.geometry.content;
    const width = this.canvas.width - cfg.left - cfg.right;
    const safeBottom = cfg.bottomRule.y - cfg.bottomClearance;
    const hasTitle = Boolean(item.title?.trim());

    if (!hasTitle) {
      R.setFont(ctx, cfg.plain.fontSize, undefined, cfg.plain.fontWeight);
      const bodyLines = R.wrapLines(ctx, item.text, width);
      const bodyLineHeight = cfg.plain.fontSize * cfg.plain.lineHeight;
      return { hasTitle, bodyLines, bodyLineHeight,
        bodyY: cfg.top, safeBottom, width,
        endY: cfg.top + bodyLines.length * bodyLineHeight };
    }

    R.setFont(ctx, cfg.title.fontSize, undefined, cfg.title.fontWeight);
    const titleLines = R.wrapLines(ctx, item.title.trim(), width);
    const titleLineHeight = cfg.title.fontSize * cfg.title.lineHeight;
    const dividerY = cfg.top + titleLines.length * titleLineHeight
      + cfg.separator.marginTop;
    const bodyY = dividerY + cfg.separator.height + cfg.separator.marginBottom;
    R.setFont(ctx, cfg.body.fontSize, undefined, cfg.body.fontWeight);
    const bodyLines = R.wrapLines(ctx, item.text, width);
    const bodyLineHeight = cfg.body.fontSize * cfg.body.lineHeight;
    return { hasTitle, titleLines, titleLineHeight, dividerY,
      bodyLines, bodyY, bodyLineHeight, safeBottom, width,
      endY: bodyY + bodyLines.length * bodyLineHeight };
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

    const cfg = this.geometry.content;
    const layout = this.measureContent({ ctx, item });

    if (layout.hasTitle) {
      if (layout.titleLines.length > cfg.title.maxLines) {
        return { ok: false, code: "title_overflow",
          message: `el título ocupa ${layout.titleLines.length} líneas; el máximo es ${cfg.title.maxLines}.` };
      }
      R.setFont(ctx, cfg.title.fontSize, undefined, cfg.title.fontWeight);
      if (layout.titleLines.some(line => ctx.measureText(line).width > layout.width)) {
        return { ok: false, code: "title_overflow", message: "el título supera el ancho disponible." };
      }
      if (layout.bodyLines.length > cfg.body.maxLines) {
        return { ok: false, code: "overflow",
          message: `el cuerpo ocupa ${layout.bodyLines.length} líneas; con título admite ${cfg.body.maxLines}.` };
      }
      R.setFont(ctx, cfg.body.fontSize, undefined, cfg.body.fontWeight);
    } else {
      if (layout.bodyLines.length > cfg.plain.maxLines) {
        return { ok: false, code: "overflow",
          message: `el texto ocupa ${layout.bodyLines.length} líneas; sin título admite ${cfg.plain.maxLines}.` };
      }
      R.setFont(ctx, cfg.plain.fontSize, undefined, cfg.plain.fontWeight);
    }

    if (layout.bodyLines.some(line => ctx.measureText(line).width > layout.width)) {
      return { ok: false, code: "overflow", message: "una palabra supera el ancho disponible." };
    }
    if (layout.endY > layout.safeBottom) {
      return { ok: false, code: "overflow", message: "el conjunto excede la altura de la caja de texto." };
    }
    return { ok: true };
  },

  exportFilename(item) {
    return `slide_${String(item.id).padStart(2, "0")}.png`;
  }
};
