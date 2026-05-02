import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const W = 1100, H = 620;
const RAIL = 52;
const TABLE_X = RAIL, TABLE_Y = RAIL;
const TABLE_W = W - RAIL * 2, TABLE_H = H - RAIL * 2;
const BALL_R = 16;
const FRICTION = 0.987;
const SPIN_DECAY = 0.93;
const MIN_VEL = 0.12;
const POCKET_R = 26;

const POCKETS = [
  { x: TABLE_X + 5,              y: TABLE_Y + 5 },
  { x: TABLE_X + TABLE_W / 2,    y: TABLE_Y - 5 },
  { x: TABLE_X + TABLE_W - 5,    y: TABLE_Y + 5 },
  { x: TABLE_X + 5,              y: TABLE_Y + TABLE_H - 5 },
  { x: TABLE_X + TABLE_W / 2,    y: TABLE_Y + TABLE_H + 5 },
  { x: TABLE_X + TABLE_W - 5,    y: TABLE_Y + TABLE_H - 5 },
];

const BALL_COLORS = [
  "#F8F8F8", // 0 cue
  "#F5C518", // 1 yellow
  "#1565C0", // 2 blue
  "#C62828", // 3 red
  "#6A1B9A", // 4 purple
  "#E65100", // 5 orange
  "#2E7D32", // 6 green
  "#7B1C1C", // 7 maroon
  "#111111", // 8 black
  "#F5C518", // 9 yellow stripe
  "#1565C0", // 10 blue stripe
  "#C62828", // 11 red stripe
  "#6A1B9A", // 12 purple stripe
  "#E65100", // 13 orange stripe
  "#2E7D32", // 14 green stripe
  "#7B1C1C", // 15 maroon stripe
];

function makeBall(id, x, y) {
  return { id, x, y, vx: 0, vy: 0, spin: { x: 0, y: 0 }, pocketed: false, stripe: id >= 9, number: id };
}

function rackBalls() {
  const balls = [];
  balls.push(makeBall(0, TABLE_X + TABLE_W * 0.25, TABLE_Y + TABLE_H / 2));
  const rx = TABLE_X + TABLE_W * 0.66;
  const ry = TABLE_Y + TABLE_H / 2;
  const gap = BALL_R * 2.05;
  const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 14, 5, 13, 6, 15, 7];
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const bx = rx + row * gap * Math.cos(Math.PI / 6);
      const by = ry + (col - row / 2) * gap;
      balls.push(makeBall(order[idx++], bx, by));
    }
  }
  return balls;
}

// ─── PHYSICS ──────────────────────────────────────────────────────────────────
function stepPhysics(balls) {
  const next = balls.map(b => ({ ...b, spin: { ...b.spin } }));
  for (const b of next) {
    if (b.pocketed) continue;
    b.x += b.vx; b.y += b.vy;
    b.vx *= FRICTION; b.vy *= FRICTION;
    b.spin.x *= SPIN_DECAY; b.spin.y *= SPIN_DECAY;
    if (Math.abs(b.vx) < MIN_VEL) b.vx = 0;
    if (Math.abs(b.vy) < MIN_VEL) b.vy = 0;
    if (b.x - BALL_R < TABLE_X) { b.x = TABLE_X + BALL_R; b.vx = Math.abs(b.vx) * 0.78; }
    if (b.x + BALL_R > TABLE_X + TABLE_W) { b.x = TABLE_X + TABLE_W - BALL_R; b.vx = -Math.abs(b.vx) * 0.78; }
    if (b.y - BALL_R < TABLE_Y) { b.y = TABLE_Y + BALL_R; b.vy = Math.abs(b.vy) * 0.78; }
    if (b.y + BALL_R > TABLE_Y + TABLE_H) { b.y = TABLE_Y + TABLE_H - BALL_R; b.vy = -Math.abs(b.vy) * 0.78; }
  }
  for (let i = 0; i < next.length; i++) {
    for (let j = i + 1; j < next.length; j++) {
      const a = next[i], b = next[j];
      if (a.pocketed || b.pocketed) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BALL_R * 2 && dist > 0) {
        const nx = dx / dist, ny = dy / dist;
        const overlap = BALL_R * 2 - dist;
        a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2; b.y += ny * overlap / 2;
        const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
        const dot = dvx * nx + dvy * ny;
        if (dot > 0) {
          const imp = dot * 0.96;
          a.vx -= imp * nx; a.vy -= imp * ny;
          b.vx += imp * nx; b.vy += imp * ny;
        }
      }
    }
  }
  const pocketed = [];
  for (const b of next) {
    if (b.pocketed) continue;
    for (const p of POCKETS) {
      const dx = b.x - p.x, dy = b.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < POCKET_R) {
        b.pocketed = true; b.vx = 0; b.vy = 0;
        pocketed.push(b.id); break;
      }
    }
  }
  return { balls: next, pocketed };
}

function isMoving(balls) {
  return balls.some(b => !b.pocketed && (Math.abs(b.vx) > MIN_VEL || Math.abs(b.vy) > MIN_VEL));
}

// ─── COLOR UTILS ──────────────────────────────────────────────────────────────
function lighten(hex, amount) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${Math.min(255, (n >> 16) + amount)},${Math.min(255, ((n >> 8) & 0xff) + amount)},${Math.min(255, (n & 0xff) + amount)})`;
}
function darken(hex, amount) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${Math.max(0, (n >> 16) - amount)},${Math.max(0, ((n >> 8) & 0xff) - amount)},${Math.max(0, (n & 0xff) - amount)})`;
}

// ─── DRAW ─────────────────────────────────────────────────────────────────────
function drawScene(ctx, balls, aimAngle, power, showAim, phase, cueBallGhost) {
  // ── Outer background
  ctx.fillStyle = "#0a0e0a";
  ctx.fillRect(0, 0, W, H);

  // ── Table outer frame (dark wood + gold trim)
  const frameGrad = ctx.createLinearGradient(0, 0, W, H);
  frameGrad.addColorStop(0, "#3E2006");
  frameGrad.addColorStop(0.3, "#5C3317");
  frameGrad.addColorStop(0.7, "#6B3A1F");
  frameGrad.addColorStop(1, "#3E2006");
  ctx.fillStyle = frameGrad;
  ctx.beginPath();
  ctx.roundRect(4, 4, W - 8, H - 8, 22);
  ctx.fill();

  // Gold border trim
  ctx.strokeStyle = "#C8962A";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(5, 5, W - 10, H - 10, 21); ctx.stroke();
  ctx.strokeStyle = "rgba(255,215,0,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(8, 8, W - 16, H - 16, 19); ctx.stroke();

  // Wood grain lines
  ctx.save();
  ctx.beginPath(); ctx.roundRect(4, 4, W - 8, H - 8, 22); ctx.clip();
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 18) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 30, H); ctx.stroke();
  }
  ctx.restore();

  // ── Cushion rubber (slightly raised inner rim)
  const cushionInset = 8;
  ctx.fillStyle = "#145214";
  ctx.beginPath();
  ctx.roundRect(
    TABLE_X - cushionInset, TABLE_Y - cushionInset,
    TABLE_W + cushionInset * 2, TABLE_H + cushionInset * 2, 6
  );
  ctx.fill();

  // Cushion highlight
  ctx.strokeStyle = "rgba(60,180,60,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(TABLE_X - cushionInset + 1, TABLE_Y - cushionInset + 1, TABLE_W + cushionInset * 2 - 2, TABLE_H + cushionInset * 2 - 2, 5);
  ctx.stroke();

  // ── Felt surface with premium texture
  const feltGrad = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.65);
  feltGrad.addColorStop(0, "#1A7A2A");
  feltGrad.addColorStop(0.5, "#166620");
  feltGrad.addColorStop(1, "#0E4A16");
  ctx.fillStyle = feltGrad;
  ctx.fillRect(TABLE_X, TABLE_Y, TABLE_W, TABLE_H);

  // Felt micro-texture (horizontal lines)
  ctx.save();
  ctx.beginPath(); ctx.rect(TABLE_X, TABLE_Y, TABLE_W, TABLE_H); ctx.clip();
  for (let y = TABLE_Y; y < TABLE_Y + TABLE_H; y += 4) {
    ctx.strokeStyle = y % 8 === 0 ? "rgba(255,255,255,0.018)" : "rgba(0,0,0,0.03)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(TABLE_X, y); ctx.lineTo(TABLE_X + TABLE_W, y); ctx.stroke();
  }
  // Diamond pattern felt
  for (let x = TABLE_X; x < TABLE_X + TABLE_W; x += 40) {
    for (let y = TABLE_Y; y < TABLE_Y + TABLE_H; y += 40) {
      ctx.strokeStyle = "rgba(255,255,255,0.012)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y + 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 20, y); ctx.lineTo(x, y + 20); ctx.stroke();
    }
  }
  ctx.restore();

  // ── Felt inner shadow
  const innerShadow = ctx.createLinearGradient(TABLE_X, TABLE_Y, TABLE_X, TABLE_Y + TABLE_H);
  innerShadow.addColorStop(0, "rgba(0,0,0,0.25)");
  innerShadow.addColorStop(0.1, "rgba(0,0,0,0)");
  innerShadow.addColorStop(0.9, "rgba(0,0,0,0)");
  innerShadow.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = innerShadow;
  ctx.fillRect(TABLE_X, TABLE_Y, TABLE_W, TABLE_H);

  // ── Baulk line
  const baulkX = TABLE_X + TABLE_W * 0.25;
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath(); ctx.moveTo(baulkX, TABLE_Y + 4); ctx.lineTo(baulkX, TABLE_Y + TABLE_H - 4); ctx.stroke();
  ctx.setLineDash([]);

  // ── D semicircle
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(baulkX, TABLE_Y + TABLE_H / 2, TABLE_H * 0.2, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // ── Spot dot
  const spotX = TABLE_X + TABLE_W * 0.75;
  const spotDot = ctx.createRadialGradient(spotX, TABLE_Y + TABLE_H / 2, 0, spotX, TABLE_Y + TABLE_H / 2, 5);
  spotDot.addColorStop(0, "rgba(255,255,255,0.5)");
  spotDot.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spotDot;
  ctx.beginPath(); ctx.arc(spotX, TABLE_Y + TABLE_H / 2, 5, 0, Math.PI * 2); ctx.fill();

  // Center spot
  const centerDot = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 5);
  centerDot.addColorStop(0, "rgba(255,255,255,0.35)");
  centerDot.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = centerDot;
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 5, 0, Math.PI * 2); ctx.fill();

  // ── Premium diamond markers on rails
  const diamondPositions = [0.25, 0.5, 0.75];
  for (const t of diamondPositions) {
    const dmx = TABLE_X + TABLE_W * t;
    const dmy1 = TABLE_Y - 20, dmy2 = TABLE_Y + TABLE_H + 20;
    for (const dmy of [dmy1, dmy2]) {
      ctx.save();
      ctx.translate(dmx, dmy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#C8962A";
      ctx.fillRect(-4, -4, 8, 8);
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, -4, 8, 8);
      ctx.restore();
    }
    // Side diamonds
    const dmx1 = TABLE_X - 20, dmx2 = TABLE_X + TABLE_W + 20;
    const dmy3 = TABLE_Y + TABLE_H * t;
    for (const dx of [dmx1, dmx2]) {
      ctx.save();
      ctx.translate(dx, dmy3);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#C8962A";
      ctx.fillRect(-4, -4, 8, 8);
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, -4, 8, 8);
      ctx.restore();
    }
  }

  // ── Pockets
  for (const p of POCKETS) {
    // Outer glow
    const outerGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, POCKET_R + 12);
    outerGlow.addColorStop(0, "rgba(0,0,0,0.9)");
    outerGlow.addColorStop(0.5, "rgba(0,0,0,0.6)");
    outerGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = outerGlow;
    ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R + 12, 0, Math.PI * 2); ctx.fill();

    // Pocket leather ring
    ctx.fillStyle = "#3E2006";
    ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R + 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R + 3, 0, Math.PI * 2); ctx.stroke();

    // Pocket hole
    const pocketGrad = ctx.createRadialGradient(p.x - 3, p.y - 3, 1, p.x, p.y, POCKET_R);
    pocketGrad.addColorStop(0, "#1a1a1a");
    pocketGrad.addColorStop(1, "#000000");
    ctx.fillStyle = pocketGrad;
    ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2); ctx.fill();

    // Inner rim shine
    ctx.strokeStyle = "rgba(100,60,10,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2); ctx.stroke();
  }

  // ── Aim line + cue stick
  const cue = balls.find(b => b.id === 0);
  if (cue && !cue.pocketed && showAim) {
    const cos = Math.cos(aimAngle), sin = Math.sin(aimAngle);

    // Ghost ball indicator at target
    const ghostDist = 280;
    const ghostX = cue.x + cos * ghostDist;
    const ghostY = cue.y + sin * ghostDist;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(ghostX, ghostY, BALL_R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // Aim guide line
    const lineGrad = ctx.createLinearGradient(
      cue.x, cue.y,
      cue.x + cos * 450, cue.y + sin * 450
    );
    lineGrad.addColorStop(0, "rgba(255,255,255,0.45)");
    lineGrad.addColorStop(0.5, "rgba(255,255,255,0.18)");
    lineGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.moveTo(cue.x, cue.y); ctx.lineTo(cue.x + cos * 450, cue.y + sin * 450);
    ctx.stroke(); ctx.setLineDash([]);

    // ── Premium black & white cue stick
    const cueLen = 160 + power * 0.5;
    const cueBack = 20 + power * 0.7;
    const tipX = cue.x - cos * (BALL_R + 5 + cueBack);
    const tipY = cue.y - sin * (BALL_R + 5 + cueBack);
    const buttX = tipX - cos * cueLen;
    const buttY = tipY - sin * cueLen;

    // Cue body segments
    const cueBodyGrad = ctx.createLinearGradient(tipX, tipY, buttX, buttY);
    cueBodyGrad.addColorStop(0, "#E0E0E0");    // tip - white/silver
    cueBodyGrad.addColorStop(0.08, "#BDBDBD");
    cueBodyGrad.addColorStop(0.15, "#212121"); // shaft starts black
    cueBodyGrad.addColorStop(0.35, "#1a1a1a");
    cueBodyGrad.addColorStop(0.55, "#F5F5F5"); // white wrap section
    cueBodyGrad.addColorStop(0.65, "#E8E8E8");
    cueBodyGrad.addColorStop(0.75, "#111111"); // butt black
    cueBodyGrad.addColorStop(0.9, "#0a0a0a");
    cueBodyGrad.addColorStop(1, "#333333");

    ctx.save();
    ctx.strokeStyle = cueBodyGrad;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(buttX, buttY); ctx.stroke();

    // Cue edge highlight
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(buttX, buttY); ctx.stroke();
    ctx.restore();

    // Silver rings on cue
    const ringPositions = [0.18, 0.52, 0.78];
    for (const t of ringPositions) {
      const rx = tipX + (buttX - tipX) * t;
      const ry = tipY + (buttY - tipY) * t;
      ctx.save();
      ctx.strokeStyle = "#C0C0C0";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(rx - sin * 5, ry + cos * 5); ctx.lineTo(rx + sin * 5, ry - cos * 5);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(rx - sin * 4, ry + cos * 4); ctx.lineTo(rx + sin * 4, ry - cos * 4);
      ctx.stroke();
      ctx.restore();
    }

    // Blue chalk tip
    const tipGrad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 5);
    tipGrad.addColorStop(0, "#64B5F6");
    tipGrad.addColorStop(1, "#1565C0");
    ctx.fillStyle = tipGrad;
    ctx.beginPath(); ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2); ctx.stroke();
  }

  // ── Balls
  for (const b of balls) {
    if (b.pocketed) continue;

    // Drop shadow
    const sg = ctx.createRadialGradient(b.x + 5, b.y + 6, 0, b.x + 4, b.y + 5, BALL_R * 1.6);
    sg.addColorStop(0, "rgba(0,0,0,0.55)");
    sg.addColorStop(0.5, "rgba(0,0,0,0.25)");
    sg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(b.x + 4, b.y + 5, BALL_R * 1.6, 0, Math.PI * 2); ctx.fill();

    // Ball base gradient (sphere shading)
    const bg = ctx.createRadialGradient(
      b.x - BALL_R * 0.3, b.y - BALL_R * 0.3, BALL_R * 0.05,
      b.x + BALL_R * 0.1, b.y + BALL_R * 0.1, BALL_R * 1.1
    );
    bg.addColorStop(0, lighten(BALL_COLORS[b.number], 70));
    bg.addColorStop(0.35, BALL_COLORS[b.number]);
    bg.addColorStop(0.75, darken(BALL_COLORS[b.number], 35));
    bg.addColorStop(1, darken(BALL_COLORS[b.number], 60));
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();

    // Stripe band
    if (b.stripe) {
      ctx.save();
      ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(b.x - BALL_R, b.y - BALL_R * 0.48, BALL_R * 2, BALL_R * 0.96);
      // Re-draw stripe with original color tint for realism
      const stripeG = ctx.createLinearGradient(b.x - BALL_R, b.y, b.x + BALL_R, b.y);
      stripeG.addColorStop(0, "rgba(255,255,255,0.6)");
      stripeG.addColorStop(0.5, "rgba(255,255,255,0.95)");
      stripeG.addColorStop(1, "rgba(255,255,255,0.6)");
      ctx.fillStyle = stripeG;
      ctx.fillRect(b.x - BALL_R, b.y - BALL_R * 0.48, BALL_R * 2, BALL_R * 0.96);
      ctx.restore();
    }

    // Number label circle
    if (b.number > 0) {
      const labelColor = b.stripe ? BALL_COLORS[b.number] : "rgba(255,255,255,0.95)";
      ctx.fillStyle = labelColor;
      ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R * 0.44, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R * 0.44, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = b.stripe ? "#fff" : "#111";
      ctx.font = `bold ${b.number >= 10 ? 9 : 10}px 'Arial', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.number, b.x, b.y + 0.5);
    }

    // Main specular highlight
    const hl = ctx.createRadialGradient(
      b.x - BALL_R * 0.38, b.y - BALL_R * 0.4, 0,
      b.x - BALL_R * 0.2, b.y - BALL_R * 0.2, BALL_R * 0.75
    );
    hl.addColorStop(0, "rgba(255,255,255,0.72)");
    hl.addColorStop(0.4, "rgba(255,255,255,0.25)");
    hl.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hl;
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();

    // Small secondary sparkle
    const sparkle = ctx.createRadialGradient(
      b.x - BALL_R * 0.6, b.y - BALL_R * 0.55, 0,
      b.x - BALL_R * 0.5, b.y - BALL_R * 0.45, BALL_R * 0.2
    );
    sparkle.addColorStop(0, "rgba(255,255,255,0.85)");
    sparkle.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sparkle;
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();

    // Ball edge
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.stroke();
  }

  // ── Cue ball ghost placement
  if (phase === "placing" && cueBallGhost) {
    const ghostGrad = ctx.createRadialGradient(cueBallGhost.x, cueBallGhost.y, 0, cueBallGhost.x, cueBallGhost.y, BALL_R);
    ghostGrad.addColorStop(0, "rgba(255,255,255,0.25)");
    ghostGrad.addColorStop(1, "rgba(255,255,255,0.05)");
    ctx.fillStyle = ghostGrad;
    ctx.beginPath(); ctx.arc(cueBallGhost.x, cueBallGhost.y, BALL_R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(cueBallGhost.x, cueBallGhost.y, BALL_R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Jogo() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const [ui, setUi] = useState({
    turn: 1, score: [0, 0],
    message: "Clique para iniciar a tacada",
    phase: "aiming", muted: false,
    gameOver: false, winner: null,
    foul: false, power: 0,
  });

  const initGame = useCallback(() => {
    stateRef.current = {
      balls: rackBalls(), aimAngle: 0, power: 0,
      charging: false, mouseX: 0, mouseY: 0,
      turn: 1, score: [0, 0], phase: "aiming",
      gameOver: false, winner: null,
      lastPocketed: [], breakShot: true,
    };
    setUi(u => ({ ...u, turn: 1, score: [0, 0], message: "Clique para iniciar a tacada", phase: "aiming", gameOver: false, foul: false, power: 0 }));
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  // Canvas DPR setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const loop = () => {
      const s = stateRef.current;
      if (!s) { animRef.current = requestAnimationFrame(loop); return; }

      if (s.phase === "rolling") {
        const { balls, pocketed } = stepPhysics(s.balls);
        s.balls = balls;
        s.lastPocketed.push(...pocketed);
        if (!isMoving(balls)) {
          const cuePocketed = s.lastPocketed.includes(0);
          const ballsPocketed = s.lastPocketed.filter(id => id !== 0);
          const eightPocketed = s.lastPocketed.includes(8);
          let msg = "", nextPhase = "aiming";
          if (eightPocketed) {
            s.gameOver = true; s.winner = s.turn;
            setUi(u => ({ ...u, gameOver: true, winner: s.turn, message: `🎱 Jogador ${s.turn} venceu!` }));
          } else if (cuePocketed) {
            const other = s.turn === 1 ? 2 : 1;
            msg = `⚠️ Falta! Bola branca encaçapada. Jogador ${other} coloca a bola.`;
            nextPhase = "placing";
            const sc = [...s.score]; sc[other - 1] += ballsPocketed.length;
            s.score = sc; s.turn = other;
            setUi(u => ({ ...u, turn: other, score: sc, message: msg, phase: "placing", foul: true }));
          } else {
            const sc = [...s.score];
            if (ballsPocketed.length > 0) {
              sc[s.turn - 1] += ballsPocketed.length;
              msg = `✅ Encaçapou ${ballsPocketed.length} bola(s)!`;
            } else {
              msg = `Vez do Jogador ${s.turn === 1 ? 2 : 1}`;
              s.turn = s.turn === 1 ? 2 : 1;
            }
            s.score = sc; s.lastPocketed = [];
            setUi(u => ({ ...u, turn: s.turn, score: s.score, message: msg, phase: "aiming", foul: false }));
          }
          if (!s.gameOver) s.phase = nextPhase;
        }
      }

      const cue = s.balls.find(b => b.id === 0);
      const showAim = (s.phase === "aiming" || s.phase === "charging") && cue && !cue.pocketed;
      drawScene(ctx, s.balls, s.aimAngle, s.power, showAim, s.phase, s.cueBallGhost);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (W / rect.width),
      y: (touch.clientY - rect.top) * (H / rect.height),
    };
  };

  const onMouseMove = useCallback((e) => {
    const s = stateRef.current;
    if (!s || s.phase === "rolling") return;
    const pos = getPos(e, canvasRef.current);
    s.mouseX = pos.x; s.mouseY = pos.y;
    const cue = s.balls.find(b => b.id === 0);
    if (cue && !cue.pocketed && s.phase === "aiming")
      s.aimAngle = Math.atan2(pos.y - cue.y, pos.x - cue.x);
    if (s.phase === "placing") {
      s.cueBallGhost = {
        x: Math.max(TABLE_X + BALL_R + 2, Math.min(TABLE_X + TABLE_W / 2, pos.x)),
        y: Math.max(TABLE_Y + BALL_R + 2, Math.min(TABLE_Y + TABLE_H - BALL_R - 2, pos.y)),
      };
    }
  }, []);

  const onMouseDown = useCallback((e) => {
    const s = stateRef.current;
    if (!s || s.gameOver) return;
    const pos = getPos(e, canvasRef.current);
    if (s.phase === "placing") {
      const px = Math.max(TABLE_X + BALL_R + 2, Math.min(TABLE_X + TABLE_W / 2, pos.x));
      const py = Math.max(TABLE_Y + BALL_R + 2, Math.min(TABLE_Y + TABLE_H - BALL_R - 2, pos.y));
      s.balls = s.balls.map(b => b.id === 0 ? { ...b, x: px, y: py, pocketed: false, vx: 0, vy: 0 } : b);
      s.cueBallGhost = null; s.lastPocketed = []; s.phase = "aiming";
      setUi(u => ({ ...u, phase: "aiming", message: `Vez do Jogador ${s.turn}`, foul: false }));
      return;
    }
    if (s.phase === "aiming") {
      s.charging = true; s.chargeStart = Date.now(); s.phase = "charging";
    }
  }, []);

  const onMouseUp = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "charging") return;
    s.charging = false;
    const cue = s.balls.find(b => b.id === 0);
    if (!cue || cue.pocketed) { s.phase = "aiming"; return; }
    const held = Math.min(Date.now() - s.chargeStart, 1200);
    const speed = 4 + (held / 1200) * 22;
    s.balls = s.balls.map(b =>
      b.id === 0 ? { ...b, vx: Math.cos(s.aimAngle) * speed, vy: Math.sin(s.aimAngle) * speed } : b
    );
    s.lastPocketed = []; s.phase = "rolling";
    setUi(u => ({ ...u, phase: "rolling", message: "...", power: 0 }));
  }, []);

  // Power meter update
  useEffect(() => {
    let raf;
    const tick = () => {
      const s = stateRef.current;
      if (s && s.phase === "charging" && s.chargeStart) {
        const held = Math.min(Date.now() - s.chargeStart, 1200);
        s.power = Math.round((held / 1200) * 100);
        setUi(u => ({ ...u, power: s.power }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const down = (e) => {
      const s = stateRef.current;
      if (!s || s.phase === "rolling") return;
      if (e.code === "Space") { e.preventDefault(); if (s.phase === "aiming") { s.charging = true; s.chargeStart = Date.now(); s.phase = "charging"; } }
      if (e.code === "ArrowLeft") { e.preventDefault(); s.aimAngle -= 0.04; }
      if (e.code === "ArrowRight") { e.preventDefault(); s.aimAngle += 0.04; }
      if (e.code === "KeyR") initGame();
    };
    const up = (e) => { if (e.code === "Space") onMouseUp(); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [onMouseUp, initGame]);

  const powerPct = ui.power || 0;
  const powerColor = powerPct < 40 ? "#22c55e" : powerPct < 70 ? "#eab308" : "#ef4444";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "radial-gradient(ellipse at 50% 30%, #0d1a0d 0%, #060c06 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(200,150,42,0.25)", background: "rgba(10,14,10,0.95)", backdropFilter: "blur(10px)" }}>
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle at 35% 35%, #4CAF50, #1B5E20)", boxShadow: "0 0 12px rgba(76,175,80,0.4)" }}>
            <span className="text-white font-bebas text-lg">8</span>
          </div>
          <span className="font-bebas text-xl tracking-widest" style={{ color: "#C8962A", textShadow: "0 0 20px rgba(200,150,42,0.3)" }}>SINUCA BRASILEIRA</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setUi(u => ({ ...u, muted: !u.muted }))}>
            {ui.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={initGame} title="Novo jogo">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="flex items-center justify-center gap-5 py-3 px-4">
        <div className={`flex items-center gap-3 px-5 py-2 rounded-xl transition-all duration-300 ${ui.turn === 1 && !ui.gameOver ? "shadow-lg" : "opacity-60"}`}
          style={{ background: ui.turn === 1 && !ui.gameOver ? "rgba(200,150,42,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${ui.turn === 1 && !ui.gameOver ? "rgba(200,150,42,0.5)" : "rgba(255,255,255,0.1)"}` }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ background: "linear-gradient(135deg, #FFD700, #FFA000)" }}>P1</div>
          <div>
            <div className="text-xs text-muted-foreground">Jogador 1</div>
            <div className="text-2xl font-bebas text-foreground leading-none">{ui.score[0]}</div>
          </div>
        </div>

        <div className="text-center px-3">
          <div className="text-xs text-muted-foreground mb-1 tracking-widest">VS</div>
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle at 35% 35%, #444, #111)", border: "2px solid #555", boxShadow: "0 0 15px rgba(0,0,0,0.8), inset 0 1px 3px rgba(255,255,255,0.1)" }}>
            <span className="text-white font-bold text-sm">8</span>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-5 py-2 rounded-xl transition-all duration-300 ${ui.turn === 2 && !ui.gameOver ? "shadow-lg" : "opacity-60"}`}
          style={{ background: ui.turn === 2 && !ui.gameOver ? "rgba(200,150,42,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${ui.turn === 2 && !ui.gameOver ? "rgba(200,150,42,0.5)" : "rgba(255,255,255,0.1)"}` }}>
          <div>
            <div className="text-xs text-muted-foreground text-right">Jogador 2</div>
            <div className="text-2xl font-bebas text-foreground leading-none text-right">{ui.score[1]}</div>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #42A5F5, #1565C0)" }}>P2</div>
        </div>
      </div>

      {/* Status message */}
      <div className="text-center pb-2">
        <span className={`text-sm font-medium px-5 py-1.5 rounded-full inline-block transition-all ${
          ui.foul ? "text-red-400" : ui.gameOver ? "text-yellow-400 font-bold text-base" : "text-muted-foreground"
        }`} style={{
          background: ui.foul ? "rgba(180,0,0,0.2)" : ui.gameOver ? "rgba(200,150,42,0.15)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${ui.foul ? "rgba(180,0,0,0.4)" : ui.gameOver ? "rgba(200,150,42,0.35)" : "rgba(255,255,255,0.1)"}`,
        }}>
          {ui.message}
        </span>
      </div>

      {/* Canvas */}
      <div className="flex justify-center px-2 pb-3 overflow-x-auto">
        <div className="relative" style={{ borderRadius: 26, overflow: "hidden", boxShadow: "0 0 80px rgba(0,150,0,0.12), 0 0 40px rgba(200,150,42,0.1), 0 30px 80px rgba(0,0,0,0.9)" }}>
          <canvas
            ref={canvasRef}
            style={{ display: "block", cursor: ui.phase === "placing" ? "crosshair" : ui.phase === "aiming" ? "none" : "default", maxWidth: "100%", touchAction: "none" }}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchMove={e => { e.preventDefault(); onMouseMove(e); }}
            onTouchStart={e => { e.preventDefault(); onMouseDown(e); }}
            onTouchEnd={e => { e.preventDefault(); onMouseUp(e); }}
          />
          {ui.gameOver && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)" }}>
              <div className="text-center p-10 rounded-3xl" style={{ background: "rgba(10,14,10,0.95)", border: "1px solid rgba(200,150,42,0.4)", boxShadow: "0 0 60px rgba(200,150,42,0.15)" }}>
                <div className="text-6xl mb-4">🎱</div>
                <div className="font-bebas text-5xl mb-2" style={{ color: "#C8962A" }}>{ui.message}</div>
                <div className="text-muted-foreground mb-8">Placar final: {ui.score[0]} × {ui.score[1]}</div>
                <Button onClick={initGame} className="font-bold px-10 py-3 rounded-xl text-base" style={{ background: "linear-gradient(135deg, #C8962A, #A07020)", color: "#fff" }}>
                  JOGAR NOVAMENTE
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Power bar + controls */}
      <div className="flex flex-col items-center gap-3 pb-5 px-4">
        <div className="flex items-center gap-3 w-full max-w-md">
          <span className="text-xs font-medium w-14 text-right" style={{ color: "rgba(200,150,42,0.8)" }}>FORÇA</span>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full"
              style={{
                width: `${powerPct}%`,
                background: `linear-gradient(90deg, ${powerColor}88, ${powerColor})`,
                boxShadow: powerPct > 0 ? `0 0 8px ${powerColor}60` : "none",
                transition: ui.phase !== "charging" ? "width 0.25s ease" : "none",
              }}
            />
          </div>
          <span className="text-xs font-bold w-10" style={{ color: powerColor }}>{powerPct}%</span>
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground flex-wrap justify-center">
          {["🖱️ Mover = Mirar", "🖱️ Segure = Força", "← → Mira", "⎵ Tacar", "R = Reiniciar"].map(t => (
            <span key={t} className="px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
