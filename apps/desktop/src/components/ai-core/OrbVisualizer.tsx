import React, { useEffect, useRef } from 'react';
import type { AssistantState } from '../../types';

interface OrbVisualizerProps {
  state: AssistantState;
  size?: number;
}

export const OrbVisualizer: React.FC<OrbVisualizerProps> = ({ state, size = 280 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const colors = {
      white: '#ffffff',
      brightRed: '#ff2a5f',
      crimson: '#ef4444',
      ruby: '#dc2626'
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(cx, cy) * 0.42;

      time += 0.05;

      // 1. Central Ambient Red & White Aura
      let auraSize = r * (1.3 + Math.sin(time * 1.5) * 0.08);
      if (state === 'LISTENING') auraSize = r * (1.5 + Math.sin(time * 3) * 0.15);
      if (state === 'THINKING') auraSize = r * (1.4 + Math.cos(time * 4) * 0.1);
      if (state === 'SPEAKING') auraSize = r * (1.6 + Math.sin(time * 5) * 0.2);

      const aura = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, auraSize);
      aura.addColorStop(0, 'rgba(255, 42, 95, 0.4)');
      aura.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
      aura.addColorStop(0.8, 'rgba(255, 255, 255, 0.05)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, auraSize, 0, Math.PI * 2);
      ctx.fill();

      // 2. Futuristic Orbital HUD Rings (Pure White & Crimson)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.3);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([16, 12]);
      ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(-time * 0.6);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([24, 18]);
      ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. Google Assistant 4-Dot Signature Interaction Waveform
      const dotColors = [colors.white, colors.brightRed, colors.crimson, colors.ruby];
      const dotCount = 4;
      const dotSpacing = 28;
      const startX = cx - ((dotCount - 1) * dotSpacing) / 2;

      for (let i = 0; i < dotCount; i++) {
        let dotY = cy;
        let dotRadius = 7;

        if (state === 'IDLE') {
          dotY += Math.sin(time * 2 + i * 0.8) * 6;
        } else if (state === 'LISTENING') {
          // Bouncing Google Assistant sound waves
          dotY += Math.sin(time * 6 + i * 1.2) * 22;
          dotRadius = 9 + Math.sin(time * 4 + i) * 2;
        } else if (state === 'THINKING') {
          // Revolving orbital dots
          const angle = time * 3 + (i * Math.PI) / 2;
          const orbitR = 24;
          const ox = cx + Math.cos(angle) * orbitR;
          const oy = cy + Math.sin(angle) * orbitR;
          ctx.beginPath();
          ctx.fillStyle = dotColors[i];
          ctx.shadowColor = dotColors[i];
          ctx.shadowBlur = 14;
          ctx.arc(ox, oy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          continue;
        } else if (state === 'SPEAKING') {
          // Energetic voice wave bars
          dotY += Math.sin(time * 8 + i * 1.5) * 16;
          dotRadius = 8 + Math.abs(Math.sin(time * 6 + i)) * 4;
        }

        const dotX = startX + i * dotSpacing;

        ctx.beginPath();
        ctx.fillStyle = dotColors[i];
        ctx.shadowColor = dotColors[i];
        ctx.shadowBlur = 16;
        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. Status Indicator Tag
      ctx.font = '700 11px Orbitron, sans-serif';
      ctx.textAlign = 'center';

      if (state === 'LISTENING') {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillText('🎤 LISTENING...', cx, cy + r * 1.5);
      } else if (state === 'THINKING') {
        ctx.fillStyle = '#ff2a5f';
        ctx.fillText('🧠 THINKING...', cx, cy + r * 1.5);
      } else if (state === 'SPEAKING') {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🔊 SPEAKING...', cx, cy + r * 1.5);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('● HI, HOW CAN I HELP?', cx, cy + r * 1.5);
      }
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [state]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ filter: 'drop-shadow(0 0 24px rgba(239, 68, 68, 0.35))' }}
      />
    </div>
  );
};
