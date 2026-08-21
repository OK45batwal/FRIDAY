import React, { useEffect, useRef } from 'react';
import type { AssistantState } from '../../types';

interface OrbVisualizerProps {
  state: AssistantState;
  size?: number;
}

export const OrbVisualizer: React.FC<OrbVisualizerProps> = ({ state, size = 260 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotation = 0;
    let pulse = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(cx, cy) * 0.44;

      rotation += 0.02;
      pulse += 0.045;

      let c1 = 'rgba(0, 240, 255, '; // Cyan
      let c2 = 'rgba(59, 130, 246, '; // Blue
      let multiplier = 1;

      if (state === 'LISTENING') {
        c1 = 'rgba(16, 185, 129, ';
        c2 = 'rgba(0, 240, 255, ';
        multiplier = 1.8;
      } else if (state === 'THINKING') {
        c1 = 'rgba(168, 85, 247, ';
        c2 = 'rgba(236, 72, 153, ';
        multiplier = 2.4;
      } else if (state === 'SPEAKING') {
        c1 = 'rgba(236, 72, 153, ';
        c2 = 'rgba(0, 240, 255, ';
        multiplier = 2.0;
      }

      // 1. Aura glow
      const aura = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * (1.4 + Math.sin(pulse) * 0.08 * multiplier));
      aura.addColorStop(0, c1 + '0.45)');
      aura.addColorStop(0.7, c2 + '0.15)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // 2. Rotating orbital rings
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation * (i % 2 === 0 ? 1 : -1) * (i + 1) * 0.6);
        ctx.beginPath();
        ctx.strokeStyle = (i === 0 ? c1 : c2) + '0.65)';
        ctx.lineWidth = 2;
        ctx.setLineDash([12 + i * 8, 8 + i * 4]);
        ctx.arc(0, 0, r * (0.8 + i * 0.18) + Math.sin(pulse * 1.6 + i) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Central Core
      const coreR = r * (0.55 + Math.sin(pulse) * 0.05 * multiplier);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.3, c1 + '0.95)');
      core.addColorStop(0.8, c2 + '0.5)');
      core.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // 4. Status Text
      ctx.font = '700 12px Orbitron, sans-serif';
      ctx.fillStyle = c1 + '0.9)';
      ctx.textAlign = 'center';
      let label = 'FRIDAY // STANDBY';
      if (state === 'LISTENING') label = '🎤 LISTENING...';
      if (state === 'THINKING') label = '🧠 NEURAL PROCESSING...';
      if (state === 'SPEAKING') label = '🔊 AUDIO SYNTHESIS';
      ctx.fillText(label, cx, cy + r * 1.4);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [state]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ filter: 'drop-shadow(0 0 20px rgba(0, 240, 255, 0.25))' }}
      />
    </div>
  );
};
