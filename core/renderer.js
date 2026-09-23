window.EC = window.EC || {};

window.EC.Renderer = {
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  },

  setFont(ctx, size, family = '"Noto Serif", Georgia, serif', weight = 700) {
    ctx.font = `${weight} ${size}px ${family}`;
  },

  wrapLines(ctx, text, maxWidth) {
    // Respect manual Enter: each paragraph starts on a new rendered line.
    // Empty interior paragraphs deliberately consume a line as well.
    const paragraphs = String(text ?? "")
      .replace(/\r\n?/g, "\n")
      .trim()
      .split("\n");
    const lines = [];

    for (const paragraph of paragraphs) {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push("");
        continue;
      }
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxWidth || !line) {
          line = candidate;
        } else {
          lines.push(line);
          line = word;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  },

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = this.wrapLines(ctx, text, maxWidth);
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    return { lines, height: lines.length * lineHeight };
  },

  drawCrop(ctx, image, x, y, width, height, assignment = {}) {
    const zoom = Math.max(1, Number(assignment.zoom || 1));
    const panX = Number(assignment.x || 0);
    const panY = Number(assignment.y || 0);
    const imageRatio = image.width / image.height;
    const boxRatio = width / height;

    let sw, sh;
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
};
