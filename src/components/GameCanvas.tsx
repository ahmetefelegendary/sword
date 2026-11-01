import React, { useEffect, useRef } from 'react';
import { gameEngine, ARENA_WIDTH, ARENA_HEIGHT } from '../game/engine';

interface GameCanvasProps {
  crtShader: boolean;
  screenMode?: 'fit' | 'fill';
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ crtShader, screenMode = 'fit' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Start 60fps loop
    gameEngine.startLoop();

    // Canvas render frame
    let animId: number;
    const renderTick = () => {
      ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      gameEngine.render(ctx);
      animId = requestAnimationFrame(renderTick);
    };
    animId = requestAnimationFrame(renderTick);

    // Keyboard listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      gameEngine.onKeyDown(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameEngine.onKeyUp(e.key);
    };

    const handleBlur = () => {
      gameEngine.onBlur();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Mouse click on canvas triggers attack / dash
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        gameEngine.bufferAction('attack');
      } else if (e.button === 2) {
        e.preventDefault();
        gameEngine.bufferAction('dash');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      cancelAnimationFrame(animId);
      gameEngine.stopLoop();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden select-none">
      {/* 2D Pixel Canvas */}
      <canvas
        ref={canvasRef}
        width={ARENA_WIDTH}
        height={ARENA_HEIGHT}
        className={`pixelated ${
          screenMode === 'fill'
            ? 'w-full h-full object-cover'
            : 'max-w-full max-h-full object-contain shadow-2xl'
        } transition-all duration-200`}
        style={
          screenMode === 'fill'
            ? { width: '100%', height: '100%' }
            : { aspectRatio: `${ARENA_WIDTH}/${ARENA_HEIGHT}` }
        }
      />

      {/* CRT Scanline Shader Overlay */}
      {crtShader && <div className="absolute inset-0 crt-overlay pointer-events-none" />}
    </div>
  );
};
