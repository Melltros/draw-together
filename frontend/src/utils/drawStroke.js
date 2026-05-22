const STROKE_TOOLS = new Set(['pen', 'eraser', 'highlighter', 'glow']);

export function drawStroke(ctx, stroke) {
  if (!stroke) return;

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  if (STROKE_TOOLS.has(stroke.tool)) {
    if (stroke.tool === 'highlighter') {
      ctx.globalAlpha = 0.38;
      ctx.lineWidth = stroke.size * 1.8;
    } else if (stroke.tool === 'glow') {
      ctx.lineWidth = Math.max(stroke.size, 3);
      ctx.shadowBlur = stroke.size * 2.5;
      ctx.shadowColor = stroke.color;
      ctx.strokeStyle = stroke.color;
    }
    if (stroke.points?.length > 0) {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      if (stroke.tool === 'glow') {
        ctx.shadowBlur = stroke.size * 1.2;
        ctx.globalAlpha = 0.85;
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  } else if (stroke.tool === 'line') {
    if (stroke.startPoint && stroke.endPoint) {
      ctx.moveTo(stroke.startPoint.x, stroke.startPoint.y);
      ctx.lineTo(stroke.endPoint.x, stroke.endPoint.y);
      ctx.stroke();
    }
  } else if (stroke.tool === 'rect') {
    if (stroke.startPoint && stroke.endPoint) {
      const x = stroke.startPoint.x;
      const y = stroke.startPoint.y;
      ctx.strokeRect(x, y, stroke.endPoint.x - x, stroke.endPoint.y - y);
    }
  } else if (stroke.tool === 'filledRect') {
    if (stroke.startPoint && stroke.endPoint) {
      ctx.fillStyle = stroke.color;
      const x = stroke.startPoint.x;
      const y = stroke.startPoint.y;
      ctx.fillRect(x, y, stroke.endPoint.x - x, stroke.endPoint.y - y);
    }
  } else if (stroke.tool === 'circle') {
    if (stroke.startPoint && stroke.endPoint) {
      const x = stroke.startPoint.x;
      const y = stroke.startPoint.y;
      const rx = stroke.endPoint.x - x;
      const ry = stroke.endPoint.y - y;
      const radius = Math.sqrt(rx * rx + ry * ry);
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (stroke.tool === 'filledCircle') {
    if (stroke.startPoint && stroke.endPoint) {
      ctx.fillStyle = stroke.color;
      const x = stroke.startPoint.x;
      const y = stroke.startPoint.y;
      const rx = stroke.endPoint.x - x;
      const ry = stroke.endPoint.y - y;
      const radius = Math.sqrt(rx * rx + ry * ry);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (stroke.tool === 'text' || stroke.tool === 'sticker') {
    if (stroke.startPoint && stroke.text) {
      ctx.font = `${stroke.size}px Outfit, sans-serif`;
      if (stroke.tool === 'sticker') {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
      } else {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = stroke.color;
      }
      ctx.fillText(stroke.text, stroke.startPoint.x, stroke.startPoint.y);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }

  ctx.restore();
}

export { STROKE_TOOLS };
