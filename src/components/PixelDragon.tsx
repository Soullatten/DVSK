import React, { useEffect, useRef } from 'react';

// ─── Pixel Dragon Shape ─────────────────────────────────────────────────────
// Define the dragon silhouette as a pixel art grid (0=empty, 1=body, 2=wing, 3=head/accent)
const DRAGON_GRID = [
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 3, 3, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 3, 3, 3, 3, 3, 1, 2, 2, 0, 0, 2, 2, 0, 0, 0, 0],
  [0, 0, 0, 1, 3, 3, 0, 3, 3, 0, 1, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0],
  [0, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0],
  [0, 0, 1, 3, 3, 3, 0, 3, 0, 1, 1, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0],
  [0, 0, 0, 1, 3, 1, 3, 3, 1, 1, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 3, 3, 3, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 3, 3, 1, 3, 3, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 3, 3, 1, 0, 1, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 3, 3, 1, 0, 1, 3, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 3, 1, 0, 0, 1, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 1, 3, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
const GRID_W = DRAGON_GRID[0].length;
const GRID_H = DRAGON_GRID.length;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

export default function PixelDragon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // ── Build color arrays once ──────────────────────────────────────────────
    const BODY_COLORS = ['#9333ea', '#a21caf', '#7c3aed', '#6d28d9'];
    const WING_COLORS = ['#4c1d95', '#5b21b6', '#6d28d9'];
    const ACCENT_COLORS = ['#d8b4fe', '#c084fc', '#a855f7'];
    const FIRE_COLORS = ['#ff4d4d', '#ff8b3d', '#ffebab', '#ff6b6b', '#ffd700'];

    // Pre-build pixel list with consistent colors per pixel
    const pixels: { col: number, row: number, color: string }[] = [];
    for (let row = 0; row < GRID_H; row++) {
      for (let col = 0; col < GRID_W; col++) {
        const v = DRAGON_GRID[row][col];
        if (v === 0) continue;
        let colors = v === 1 ? BODY_COLORS : v === 2 ? WING_COLORS : ACCENT_COLORS;
        pixels.push({ col, row, color: colors[Math.floor(Math.random() * colors.length)] });
      }
    }

    const particles: Particle[] = [];
    let animId: number;
    let time = 0;
    const PIXEL_SIZE = Math.max(6, Math.floor(Math.min(width, height) / 100));

    const dragonW = GRID_W * PIXEL_SIZE;
    const dragonH = GRID_H * PIXEL_SIZE;

    // ── Animation state machine ──────────────────────────────────────────────
    // Total cycle = 480 "ticks" (at 60fps ≈ 8 seconds per loop)
    const CYCLE = 480;

    const getPosition = (t: number): { x: number; y: number; facing: number } => {
      const tN = t % CYCLE; // normalized tick

      // Phase 1 [0..80]: sweep in from left off-screen
      if (tN < 80) {
        const p = tN / 80;
        return {
          x: -dragonW + p * (width * 0.22 + dragonW),
          y: height * 0.5 + Math.sin(p * Math.PI) * -120,
          facing: 1  // -> right
        };
      }
      // Phase 2 [80..280]: circle the PixelBlast (left quarter of screen)
      if (tN < 280) {
        const p = (tN - 80) / 200;
        const cx = width * 0.22;
        const cy = height * 0.5;
        const rx = Math.min(width * 0.18, 180);
        const ry = Math.min(height * 0.25, 150);
        const angle = -Math.PI / 2 + p * Math.PI * 2; // full circle clockwise
        return {
          x: cx + Math.cos(angle) * rx - dragonW / 2,
          y: cy + Math.sin(angle) * ry - dragonH / 2,
          facing: Math.cos(angle) >= 0 ? 1 : -1  // flip mid-circle
        };
      }
      // Phase 3 [280..340]: swoop to center, gaining speed
      if (tN < 340) {
        const p = (tN - 280) / 60;
        const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        return {
          x: width * 0.22 + ease * (width * 0.5 - width * 0.22),
          y: height * 0.5 + Math.sin(ease * Math.PI) * -100 - dragonH / 2,
          facing: 1
        };
      }
      // Phase 4 [340..430]: hover at center, FIRE
      if (tN < 430) {
        const hover = Math.sin((tN - 340) * 0.14) * 18;
        return {
          x: width * 0.5 - dragonW * 0.5,
          y: height * 0.45 - dragonH * 0.5 + hover,
          facing: 1
        };
      }
      // Phase 5 [430..480]: fly off right + upward
      {
        const p = (tN - 430) / 50;
        return {
          x: width * 0.5 - dragonW * 0.5 + p * (width * 0.6 + dragonW),
          y: height * 0.45 - p * (height * 0.55),
          facing: 1
        };
      }
    };

    const isShooting = (t: number) => (t % CYCLE) >= 340 && (t % CYCLE) < 430;

    // ── Main render loop ─────────────────────────────────────────────────────
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time++;

      const { x: baseX, y: baseY, facing } = getPosition(time);
      const isFire = isShooting(time);

      // Glow effect behind dragon
      const centerX = baseX + dragonW / 2;
      const centerY = baseY + dragonH / 2;
      const grd = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dragonW * 0.8);
      grd.addColorStop(0, isFire ? 'rgba(255,80,0,0.25)' : 'rgba(139,43,226,0.18)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(centerX - dragonW, centerY - dragonH, dragonW * 2, dragonH * 2);

      // Draw pixels
      ctx.save();
      if (facing === -1) {
        // Mirror horizontally
        ctx.translate(baseX + dragonW, baseY);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(baseX, baseY);
      }

      for (const { col, row, color } of pixels) {
        // Subtle wing flap on row offset
        const wingWave = row <= 6 && col > GRID_W / 2
          ? Math.sin(time * 0.15 + row * 0.8) * 2
          : 0;

        const glowPulse = 0.7 + 0.3 * Math.sin(time * 0.08 + col * 0.3);
        ctx.globalAlpha = glowPulse;

        // Pixel body
        ctx.fillStyle = color;
        const px = col * PIXEL_SIZE;
        const py = row * PIXEL_SIZE + wingWave;
        ctx.fillRect(px, py, PIXEL_SIZE - 1, PIXEL_SIZE - 1);

        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(px, py, 2, 2);
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // ── Fire breath particles ────────────────────────────────────────────
      if (isFire) {
        // mouth is roughly top-right of the dragon (col 8-10, row 2-4)
        const mouthCol = facing === 1 ? GRID_W - 2 : 2;
        const mouthRow = 3;
        let mX = baseX + mouthCol * PIXEL_SIZE;
        let mY = baseY + mouthRow * PIXEL_SIZE;

        for (let i = 0; i < 6; i++) {
          particles.push({
            x: mX + (Math.random() - 0.5) * PIXEL_SIZE * 2,
            y: mY + (Math.random() - 0.5) * PIXEL_SIZE * 2,
            vx: (facing === 1 ? 1 : -1) * (14 + Math.random() * 18),
            vy: (Math.random() - 0.5) * 8,
            life: 0,
            maxLife: 40 + Math.random() * 35,
            color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)],
            size: PIXEL_SIZE * (1.5 + Math.random() * 2)
          });
        }
      }

      // Update / draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.size *= 0.94;
        p.vx *= 0.96;

        if (p.life >= p.maxLife || p.size < 0.8) { particles.splice(i, 1); continue; }

        const progress = p.life / p.maxLife;
        ctx.globalAlpha = (1 - progress) * 0.95;

        // Square pixels for fire (matches PixelBlast style)
        ctx.fillStyle = p.color;
        const s = Math.round(p.size);
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);

        // Inner highlight on fire
        ctx.fillStyle = 'rgba(255,255,200,0.5)';
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.ceil(s / 3), Math.ceil(s / 3));
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    render();

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}
