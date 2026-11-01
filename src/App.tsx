/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { gameEngine } from './game/engine';
import { GameState, UpgradeOption, HudState } from './game/types';
import { initNativeStoreLifecycle } from './utils/platform';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(gameEngine.state);
  const [hud, setHud] = useState<HudState>(gameEngine.getHudState());
  const [upgrades, setUpgrades] = useState<UpgradeOption[]>([]);
  const [crtShader, setCrtShader] = useState<boolean>(false);
  const [lang, setLang] = useState<'tr' | 'en'>('en');
  const [screenMode, setScreenMode] = useState<'fit' | 'fill'>('fit');
  
  // Mobile controls are enabled by default so buttons are always accessible on both mobile & desktop
  const [showMobileControls, setShowMobileControls] = useState<boolean>(true);

  // Responsive orientation detection
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    // Engine event callbacks to keep state in sync
    gameEngine.onStateChange = (newState) => {
      setGameState(newState);
      setHud(gameEngine.getHudState());
    };

    gameEngine.onHudUpdate = (newHud) => {
      setHud(newHud);
    };

    gameEngine.onUpgradesReady = (readyUpgrades) => {
      setUpgrades(readyUpgrades);
    };

    // Native Store Lifecycle (App Store / Google Play auto-pause & Android hardware back button)
    const cleanupLifecycle = initNativeStoreLifecycle({
      onBackgroundPause: () => {
        gameEngine.pauseOnBackground();
      },
      onHardwareBackButton: () => {
        if (gameEngine.state === 'PLAYING') {
          gameEngine.pauseGame();
          return true;
        }
        if (gameEngine.state === 'PAUSED') {
          gameEngine.goToTitle();
          return true;
        }
        return false;
      },
    });

    return () => {
      gameEngine.onStateChange = undefined;
      gameEngine.onHudUpdate = undefined;
      gameEngine.onUpgradesReady = undefined;
      cleanupLifecycle();
    };
  }, []);

  const isPortraitPlaying = isPortrait && showMobileControls && gameState === 'PLAYING';

  return (
    <main
      className={`relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#090d16] select-none touch-none ${
        isPortraitPlaying ? 'flex flex-col' : 'flex items-center justify-center'
      }`}
    >
      {/* 2D Pixel Canvas Area */}
      <div
        className={`relative flex items-center justify-center overflow-hidden ${
          isPortraitPlaying ? 'flex-1 min-h-0 w-full' : 'w-full h-full'
        }`}
      >
        <GameCanvas crtShader={crtShader} screenMode={screenMode} />
      </div>

      {/* World-Matched Low-Occlusion UI Shell & Controls */}
      <GameUI
        gameState={gameState}
        hud={hud}
        upgrades={upgrades}
        crtShader={crtShader}
        onToggleCrt={() => setCrtShader((prev) => !prev)}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'tr' ? 'en' : 'tr'))}
        isPortrait={isPortrait}
        showMobileControls={showMobileControls}
        onToggleGamepad={() => setShowMobileControls((prev) => !prev)}
        screenMode={screenMode}
        onToggleScreenMode={() => setScreenMode((prev) => (prev === 'fit' ? 'fill' : 'fit'))}
      />
    </main>
  );
}
