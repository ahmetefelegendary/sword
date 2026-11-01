import React, { useState } from 'react';
import { GameState, UpgradeOption, HudState, HeroClass } from '../game/types';
import { gameEngine } from '../game/engine';
import { audio } from '../game/audio';
import {
  Volume2,
  VolumeX,
  Music,
  Tv,
  Flame,
  Zap,
  Heart,
  Wind,
  Shield,
  Magnet,
  Skull,
  Sword,
  Play,
  RotateCcw,
  Pause,
  Gamepad2,
  Maximize2,
  HelpCircle,
  X,
  Trophy,
  Home,
  Download,
  Smartphone,
  ShieldCheck,
  Trash2,
  Package,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { usePWAInstall } from '../utils/pwaPush';
import { getRuntimePlatform } from '../utils/platform';
import { APP_METADATA, MOBILE_DOWNLOAD_PLATFORMS, DownloadPlatformItem } from '../config/storeConfig';

interface GameUIProps {
  gameState: GameState;
  hud: HudState;
  upgrades: UpgradeOption[];
  crtShader: boolean;
  onToggleCrt: () => void;
  lang: 'tr' | 'en';
  onToggleLang: () => void;
  isPortrait: boolean;
  showMobileControls: boolean;
  onToggleGamepad: () => void;
  screenMode: 'fit' | 'fill';
  onToggleScreenMode: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({
  gameState,
  hud,
  upgrades,
  crtShader,
  onToggleCrt,
  lang,
  onToggleLang,
  isPortrait,
  showMobileControls,
  onToggleGamepad,
  screenMode,
  onToggleScreenMode,
}) => {
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showIOSInstallModal, setShowIOSInstallModal] = useState(false);
  const [showPlatformsModal, setShowPlatformsModal] = useState(false);
  const [platformsTab, setPlatformsTab] = useState<'stores' | 'build'>('stores');
  const [selectedPlatformNotice, setSelectedPlatformNotice] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const runtimeInfo = getRuntimePlatform();

  // 360° Rotating Analog Joystick State
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);
  const [joystickAngle, setJoystickAngle] = useState<number | null>(null);
  const joystickBaseRef = React.useRef<HTMLDivElement | null>(null);

  const tr = lang === 'tr';

  const toggleSound = () => {
    const val = audio.toggleSound();
    setSoundOn(val);
  };

  const toggleMusic = () => {
    const val = audio.toggleMusic();
    setMusicOn(val);
  };

  const getUpgradeIcon = (iconName: string, sizeClass: string = "w-5 h-5") => {
    switch (iconName) {
      case 'flame': return <Flame className={`${sizeClass} text-amber-400`} />;
      case 'zap': return <Zap className={`${sizeClass} text-yellow-300`} />;
      case 'heart': return <Heart className={`${sizeClass} text-red-400`} />;
      case 'wind': return <Wind className={`${sizeClass} text-emerald-400`} />;
      case 'shield': return <Shield className={`${sizeClass} text-sky-400`} />;
      case 'magnet': return <Magnet className={`${sizeClass} text-indigo-400`} />;
      case 'skull': return <Skull className={`${sizeClass} text-purple-400`} />;
      case 'sword':
      default: return <Sword className={`${sizeClass} text-cyan-400`} />;
    }
  };

  // 360° Analog Joystick Touch / Pointer Handlers
  const JOYSTICK_MAX_RADIUS = 36; // px
  const JOYSTICK_DEADZONE = 5; // px

  const updateJoystickFromPointer = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist < JOYSTICK_DEADZONE) {
      setKnobPos({ x: 0, y: 0 });
      setJoystickAngle(null);
      gameEngine.setTouchDirection(0, 0);
      return;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, JOYSTICK_MAX_RADIUS);
    const power = Math.min(1, dist / JOYSTICK_MAX_RADIUS);
    const moveX = Math.cos(angle) * power;
    const moveY = Math.sin(angle) * power;

    setKnobPos({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });
    setJoystickAngle(angle);
    gameEngine.setTouchDirection(moveX, moveY);
  };

  const handleJoystickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingJoystick(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    gameEngine.triggerHaptic(12);
    updateJoystickFromPointer(e.clientX, e.clientY);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingJoystick) return;
    e.preventDefault();
    updateJoystickFromPointer(e.clientX, e.clientY);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingJoystick(false);
    setKnobPos({ x: 0, y: 0 });
    setJoystickAngle(null);
    gameEngine.setTouchDirection(0, 0);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
  };

  const isLowHp = hud.hp <= 2 && hud.hp > 0;

  return (
    <>
      {/* Low Health Crimson Warning Flash */}
      {isLowHp && gameState === 'PLAYING' && (
        <div className="fixed inset-0 border-4 border-red-600/50 pointer-events-none animate-pulse z-20" />
      )}

      {/* ================= IN-GAME RETRO HUD ================= */}
      {gameState === 'PLAYING' && (
        <header className="absolute top-0 left-0 right-0 p-2 md:p-3 pt-safe pl-safe pr-safe flex flex-col gap-1.5 w-full pointer-events-none z-30">
          <div className="flex items-start justify-between w-full">
            {/* Top-Left: Health, Stamina & Class Badge */}
            <div className="pixel-panel px-2.5 py-1.5 flex flex-col gap-1 pointer-events-auto shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] font-pixel text-amber-400 uppercase">
                  ⚔️ {tr ? 'ŞÖVALYE' : 'KNIGHT'}
                </span>
                <span className="text-[8px] font-pixel tabular-nums text-slate-200">
                  {hud.hp}/{hud.maxHp} HP
                </span>
              </div>

              {/* Heart Containers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(hud.maxHp / 2) }).map((_, i) => {
                  const heartHp = hud.hp - i * 2;
                  const isFull = heartHp >= 2;
                  const isHalf = heartHp === 1;

                  return (
                    <div
                      key={i}
                      className={`relative w-4 h-4 sm:w-5 sm:h-5 ${
                        isLowHp && isFull ? 'animate-bounce' : ''
                      }`}
                    >
                      <svg viewBox="0 0 16 16" className="w-full h-full fill-current filter drop-shadow-[1px_1px_0_#000]">
                        {isFull ? (
                          <path
                            d="M2 4h4v2H2zM10 4h4v2h-4zM1 6h14v4H1zM3 10h10v2H3zM5 12h6v2H5zM7 14h2v1H7z"
                            fill="#dc2626"
                          />
                        ) : isHalf ? (
                          <>
                            <path
                              d="M2 4h4v2H2zM1 6h7v4H1zM3 10h5v2H3zM5 12h3v2H5zM7 14h1v1H7z"
                              fill="#dc2626"
                            />
                            <path
                              d="M10 4h4v2h-4zM8 6h7v4H8zM8 10h5v2H8zM8 12h3v2H8zM8 14h1v1H8z"
                              fill="#1e293b"
                            />
                          </>
                        ) : (
                          <path
                            d="M2 4h4v2H2zM10 4h4v2h-4zM1 6h14v4H1zM3 10h10v2H3zM5 12h6v2H5zM7 14h2v1H7z"
                            fill="#1e293b"
                          />
                        )}
                      </svg>
                    </div>
                  );
                })}
              </div>

              {/* Stamina bar */}
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] font-pixel text-slate-400">STM</span>
                <div className="w-18 sm:w-24 h-1.5 bg-black border border-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, hud.stamina))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Top-Center: Boss Health Bar (if active) */}
            {hud.activeBoss && (
              <div className={`px-3 py-1.5 flex flex-col items-center min-w-[200px] sm:min-w-[280px] pointer-events-auto ${
                hud.activeBoss.isEnraged ? 'pixel-panel-red border-red-500 animate-pulse' : 'pixel-panel-red'
              }`}>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className={`text-[8px] sm:text-[9px] font-pixel ${
                    hud.activeBoss.isEnraged ? 'text-red-400 font-bold' : 'text-rose-300'
                  }`}>
                    💀 {tr ? hud.activeBoss.nameTr : hud.activeBoss.name} {hud.activeBoss.isEnraged && '🔥'}
                  </span>
                </div>
                <div className="w-full h-2.5 sm:h-3 bg-black border border-rose-950 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${
                      hud.activeBoss.isEnraged ? 'bg-gradient-to-r from-orange-600 via-red-600 to-yellow-500' : 'bg-rose-600'
                    }`}
                    style={{ width: `${Math.max(0, (hud.activeBoss.hp / hud.activeBoss.maxHp) * 100)}%` }}
                  />
                </div>
                <span className="text-[7px] sm:text-[8px] font-pixel tabular-nums text-rose-200 mt-0.5">
                  {hud.activeBoss.hp} / {hud.activeBoss.maxHp} HP {hud.activeBoss.isEnraged ? (tr ? '[FAZ 2: ÖFKELİ]' : '[PHASE 2: ENRAGED]') : ''}
                </span>
              </div>
            )}

            {/* Top-Right: Stats, Wave & Quick Utility Toggles */}
            <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto">
              {/* Wave & Score Frame */}
              <div className="pixel-panel px-2 py-1 flex items-center gap-2 text-[8px] font-pixel">
                <div className="flex flex-col">
                  <span className="text-amber-400 font-bold">
                    {tr ? 'DALGA' : 'WAVE'} {hud.wave}
                  </span>
                  <span className="text-slate-200 tabular-nums">
                    {hud.score.toLocaleString()}
                  </span>
                </div>

                {hud.combo > 1 && (
                  <div className="border-l border-slate-700 pl-1.5 text-rose-400">
                    {hud.combo}x
                  </div>
                )}
              </div>

              {/* Quick Toggles */}
              <div className="pixel-panel p-1 flex items-center gap-0.5">
                <button
                  onClick={() => gameEngine.pauseGame()}
                  className="p-1 hover:bg-slate-800 text-amber-300 cursor-pointer"
                  title="Pause (Esc)"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={toggleSound}
                  className="p-1 hover:bg-slate-800 text-slate-300 cursor-pointer"
                  title={soundOn ? 'SFX On' : 'SFX Off'}
                >
                  {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
                </button>

                <button
                  onClick={toggleMusic}
                  className="p-1 hover:bg-slate-800 cursor-pointer"
                  title={musicOn ? 'Music On' : 'Music Off'}
                >
                  <Music className={`w-3.5 h-3.5 ${musicOn ? 'text-cyan-400' : 'text-slate-600'}`} />
                </button>

                <button
                  onClick={onToggleCrt}
                  className={`p-1 hover:bg-slate-800 cursor-pointer ${
                    crtShader ? 'text-amber-400' : 'text-slate-600'
                  }`}
                  title="CRT Scanlines"
                >
                  <Tv className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onToggleScreenMode}
                  className={`p-1 hover:bg-slate-800 cursor-pointer ${
                    screenMode === 'fill' ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                  title={screenMode === 'fill' ? (tr ? 'Ekran: Tam Büyütme' : 'Screen: Fill') : (tr ? 'Ekran: Orantılı' : 'Screen: Fit')}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onToggleGamepad}
                  className={`p-1 hover:bg-slate-800 cursor-pointer ${
                    showMobileControls ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                  title={tr ? 'Kumandayı Göster/Gizle' : 'Toggle Gamepad'}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onToggleLang}
                  className="px-1 text-[8px] font-pixel text-slate-300 hover:bg-slate-800 cursor-pointer"
                  title="Language"
                >
                  {lang.toUpperCase()}
                </button>
              </div>
            </div>
          </div>

          {/* Active Perks Strip & Special Indicator */}
          <div className="flex items-center justify-between w-full px-1 text-[8px] font-pixel pointer-events-none">
            {/* Active Upgrades */}
            <div className="flex items-center gap-1 pointer-events-auto">
              {hud.upgrades.map((upId) => {
                const iconMap: Record<string, string> = {
                  flame_blade: 'flame',
                  swift_boots: 'wind',
                  max_heart: 'heart',
                  chain_lightning: 'zap',
                  vampire: 'skull',
                  dash_stun: 'shield',
                  gem_magnet: 'magnet',
                  whirlwind_aura: 'sword',
                };
                return (
                  <div key={upId} className="pixel-panel p-0.5" title={upId}>
                    {getUpgradeIcon(iconMap[upId] || 'sword', 'w-3 h-3')}
                  </div>
                );
              })}
            </div>

            {/* Special Ready Badge */}
            {hud.specialReady ? (
              <div className="pixel-panel-gold px-2 py-0.5 text-amber-300 font-pixel text-[8px] animate-pulse pointer-events-auto">
                ★ {tr ? 'ÖZEL GÜÇ HAZIR [Q]' : 'SPECIAL READY [Q]'} ★
              </div>
            ) : (
              <div className="pixel-panel px-2 py-0.5 text-slate-400 text-[8px] flex items-center gap-1 pointer-events-auto">
                <span>{tr ? 'ÖZEL' : 'SPECIAL'}</span>
                <div className="w-12 h-1 bg-black overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${hud.specialCooldownProgress * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* ================= COMPACT RETRO TITLE SCREEN ================= */}
      {gameState === 'TITLE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 pointer-events-auto">
          <div className="pixel-panel p-4 sm:p-5 max-w-xs sm:max-w-sm w-full flex flex-col items-center text-center my-auto shadow-2xl relative">
            {/* Title & Subtitle */}
            <h1 className="font-pixel text-base sm:text-lg text-amber-400 mb-1 tracking-wider drop-shadow-[2px_2px_0_#000]">
              DUNGEON KNIGHT
            </h1>
            <div className="inline-block px-2 py-0.5 mb-3 bg-amber-500/20 border border-amber-500/40 rounded text-[8px] font-pixel text-amber-300 tracking-widest">
              PIXEL RPG
            </div>



            {/* High Score Badge */}
            {hud.highScore > 0 && (
              <div className="mb-2 text-[7px] font-pixel text-slate-300 tabular-nums flex items-center justify-center gap-1.5">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>{tr ? 'EN YÜKSEK SKOR:' : 'HI-SCORE:'}</span>
                <span className="text-amber-300 font-bold">{hud.highScore.toLocaleString()}</span>
              </div>
            )}

            {/* Arcade Start Button */}
            <button
              onClick={() => gameEngine.startGame(hud.heroClass)}
              className="arcade-btn w-full py-2.5 sm:py-3 mb-2 bg-amber-500 active:bg-amber-400 text-slate-950 font-pixel text-[10px] sm:text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:brightness-105"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {tr ? 'OYUNA BAŞLA (ENTER)' : 'START GAME (ENTER)'}
            </button>

            {/* Secondary Buttons: Controls & Stats */}
            <div className="grid grid-cols-2 gap-1.5 w-full mb-2">
              <button
                onClick={() => setShowControlsModal(true)}
                className="arcade-btn py-1.5 bg-slate-800 text-slate-200 font-pixel text-[7px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3 text-cyan-400" />
                {tr ? 'KONTROLLER' : 'CONTROLS'}
              </button>

              <button
                onClick={() => {
                  setConfirmReset(false);
                  setShowStatsModal(true);
                }}
                className="arcade-btn py-1.5 bg-slate-800 text-slate-200 font-pixel text-[7px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trophy className="w-3 h-3 text-amber-400" />
                {tr ? 'İSTATİSTİK' : 'STATS'}
              </button>
            </div>

            {/* Web-Only: Mobile Store & Downloadable Platforms Hub (Automatically hidden inside Native iOS/Android Store builds) */}
            {!runtimeInfo.isNativeStoreBuild && (
              <div className="w-full mb-2">
                <button
                  onClick={() => {
                    setSelectedPlatformNotice(null);
                    setShowPlatformsModal(true);
                  }}
                  className="arcade-btn w-full py-2 bg-[#131d2e] border border-cyan-500/50 hover:border-cyan-400 text-[7px] sm:text-[8px] font-pixel text-cyan-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  {tr ? 'MOBİL PLATFORMLAR & İNDİR' : 'MOBILE PLATFORMS & DOWNLOAD'}
                </button>
              </div>
            )}

            {/* Settings & Viewport advice */}
            <div className="flex items-center justify-between w-full text-[8px] font-pixel text-slate-400 border-t border-slate-800 pt-2.5">
              <button onClick={onToggleLang} className="hover:text-white cursor-pointer">
                {lang === 'tr' ? 'TÜRKÇE' : 'ENGLISH'}
              </button>

              <button onClick={onToggleCrt} className="hover:text-white cursor-pointer">
                CRT: {crtShader ? (tr ? 'AÇIK' : 'ON') : (tr ? 'KAPALI' : 'OFF')}
              </button>

              <button onClick={onToggleGamepad} className="hover:text-white cursor-pointer">
                🎮 {showMobileControls ? (tr ? 'KUMANDA AÇIK' : 'PAD ON') : (tr ? 'KUMANDA KAPALI' : 'PAD OFF')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONTROLS MODAL ================= */}
      {showControlsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="pixel-panel p-5 max-w-sm w-full relative text-left">
            <button
              onClick={() => setShowControlsModal(false)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-pixel text-xs text-amber-400 mb-3 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4" />
              {tr ? 'NASIL OYNANIR?' : 'HOW TO PLAY'}
            </h3>

            <div className="space-y-2.5 text-[8px] font-pixel text-slate-300 leading-relaxed mb-4">
              <div className="bg-black/60 p-2 border border-slate-800">
                <span className="text-amber-300 block mb-1">🎮 {tr ? 'MOBİL DOKUNMATİK:' : 'MOBILE TOUCH:'}</span>
                <p>• {tr ? '🕹️ Sol Alan: 360° Dönen Sanal Analog Joystick ile akıcı hareket' : '🕹️ Left: 360° Smooth Rotating Analog Virtual Joystick'}</p>
                <p>• {tr ? '⚔️ ATK [A]: Kılıç savurma saldırısı' : '⚔️ ATK [A]: Broadsword slash attack'}</p>
                <p>• {tr ? '💨 DASH [B]: Joystick yönünde hızlı atılma & sıyrılma' : '💨 DASH [B]: Quick dash & dodge in joystick direction'}</p>
                <p>• {tr ? '🌪️ SP [X]: Özel 360° Kasırga Savurması' : '🌪️ SP [X]: 360° Whirlwind blade storm'}</p>
              </div>

              <div className="bg-black/60 p-2 border border-slate-800">
                <span className="text-cyan-300 block mb-1">⌨️ {tr ? 'KLAVYE & FARE:' : 'KEYBOARD & MOUSE:'}</span>
                <p>• WASD / Yön Tuşları: Hareket</p>
                <p>• Boşluk (Space) / Sol Tık: Vuruş</p>
                <p>• Shift / Sağ Tık: Atılma (Dash)</p>
                <p>• Q: Özel Yetenek</p>
                <p>• Esc: Duraklat</p>
              </div>

              <div className="bg-amber-950/40 p-2 border border-amber-600/40 text-amber-200">
                💡 {tr ? 'Telefonunuzu yatay çevirerek tam ekran deneyim yaşayabilirsiniz!' : 'Rotate your phone landscape for maximum full-screen gameplay!'}
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="arcade-btn w-full py-2 bg-amber-500 text-slate-950 font-pixel text-[8px] cursor-pointer"
            >
              {tr ? 'ANLADIM' : 'GOT IT'}
            </button>
          </div>
        </div>
      )}

      {/* ================= STATS & DATA COMPLIANCE MODAL ================= */}
      {showStatsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs pointer-events-auto">
          <div className="pixel-panel p-5 max-w-sm w-full relative text-left">
            <button
              onClick={() => setShowStatsModal(false)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-pixel text-xs text-amber-400 mb-3 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              {tr ? 'KAHRAMAN İSTATİSTİKLERİ' : 'HERO STATS'}
            </h3>

            <div className="bg-black/60 p-3 border border-slate-800 flex flex-col gap-2 text-[8px] font-pixel mb-3">
              <div className="flex justify-between text-slate-400">
                <span>{tr ? 'EN YÜKSEK SKOR:' : 'HIGH SCORE:'}</span>
                <span className="text-amber-300 font-bold">{hud.highScore.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{tr ? 'SON OYNANAN DALGA:' : 'LAST WAVE:'}</span>
                <span className="text-white">{hud.wave}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{tr ? 'SÜRÜM / PLATFORM:' : 'VERSION / PLATFORM:'}</span>
                <span className="text-cyan-400 uppercase">
                  v{APP_METADATA.version} ({runtimeInfo.isNativeStoreBuild ? 'NATIVE' : 'WEB'})
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{tr ? 'DURUM:' : 'STATUS:'}</span>
                <span className="text-emerald-400">{tr ? 'ZİNDAN HAZIR' : 'READY TO CRAWL'}</span>
              </div>
            </div>

            {/* App Store & Play Store Required Controls: Data Reset & Privacy Policy */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="arcade-btn py-1.5 px-2 bg-rose-950/60 border border-rose-700/50 text-rose-300 font-pixel text-[7px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  {tr ? 'REKORU SIFIRLA' : 'RESET DATA'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    gameEngine.resetHighScore();
                    setConfirmReset(false);
                  }}
                  className="arcade-btn py-1.5 px-2 bg-rose-600 text-white font-pixel text-[7px] flex items-center justify-center gap-1 cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-3 h-3" />
                  {tr ? 'EMİN MİSİN? (SİL)' : 'CONFIRM RESET'}
                </button>
              )}

              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setShowPrivacyModal(true);
                }}
                className="arcade-btn py-1.5 px-2 bg-slate-800 text-slate-200 font-pixel text-[7px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {tr ? 'GİZLİLİK POLİTİKASI' : 'PRIVACY POLICY'}
              </button>
            </div>

            <button
              onClick={() => setShowStatsModal(false)}
              className="arcade-btn w-full py-2 bg-amber-500 text-slate-950 font-pixel text-[8px] cursor-pointer"
            >
              {tr ? 'KAPAT' : 'CLOSE'}
            </button>
          </div>
        </div>
      )}

      {/* ================= IN-APP PRIVACY POLICY MODAL (App Store & Play Store Compliance) ================= */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs pointer-events-auto">
          <div className="pixel-panel p-5 max-w-md w-full max-h-[88dvh] flex flex-col relative text-left">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-pixel text-[10px] sm:text-xs text-amber-400 mb-3 flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {tr ? 'GİZLİLİK POLİTİKASI & VERİ GÜVENLİĞİ' : 'PRIVACY POLICY & DATA SAFETY'}
            </h3>

            <div className="bg-black/60 p-3 border border-slate-800 space-y-2.5 text-[10px] text-slate-300 leading-relaxed mb-4 overflow-y-auto">
              <p className="text-emerald-400 font-pixel text-[7px]">
                ✓ {tr ? 'SIFIR KİŞİSEL VERİ TOPLAMA (APP STORE & GOOGLE PLAY UYUMLU)' : 'ZERO PERSONAL DATA COLLECTION'}
              </p>
              <p>
                {tr
                  ? 'Zindan Şövalyesi (Dungeon Knight); isim, e-posta, konum, rehber, kamera, mikrofon veya cihaz kimliği gibi hiçbir kişisel verinizi toplamaz ve üçüncü taraflarla paylaşmaz.'
                  : 'Dungeon Knight does not collect, track, or share any personal data, location, camera, microphone, or device identifiers.'}
              </p>
              <p>
                {tr
                  ? 'Elde ettiğiniz En Yüksek Skor (High Score) yalnızca cihazınızın kendi yerel hafızasında saklanır. İstatistikler menüsünden istediğiniz an sıfırlayabilirsiniz.'
                  : 'Your High Score is stored strictly locally on your device and can be reset anytime from the Stats menu.'}
              </p>
              <p>
                {tr
                  ? 'Uygulama hiçbir bildirim (push) izni istemez ve tamamen çevrimdışı (offline) çalışabilir.'
                  : 'The game requests zero push notification permissions and works 100% offline.'}
              </p>
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                <span>Bundle ID: {APP_METADATA.appId}</span>
                <a
                  href={APP_METADATA.privacyPolicyPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>/privacy-policy.html</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="arcade-btn w-full py-2 bg-amber-500 text-slate-950 font-pixel text-[8px] cursor-pointer shrink-0"
            >
              {tr ? 'ANLADIM' : 'CLOSE'}
            </button>
          </div>
        </div>
      )}

      {/* ================= MOBILE PLATFORMS & STORE DISTRIBUTION HUB (WEB ONLY) ================= */}
      {showPlatformsModal && !runtimeInfo.isNativeStoreBuild && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xs pointer-events-auto">
          <div className="pixel-panel p-4 sm:p-5 max-w-lg w-full max-h-[92dvh] flex flex-col relative text-left">
            <button
              onClick={() => setShowPlatformsModal(false)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-pixel text-[10px] sm:text-xs text-amber-400 mb-1 flex items-center gap-1.5 shrink-0">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              {tr ? 'MOBİL MAĞAZALAR & İNDİRİLEBİLİR PLATFORMLAR' : 'MOBILE STORES & DOWNLOAD PLATFORMS'}
            </h3>
            <p className="text-[10px] text-slate-400 mb-3 shrink-0">
              {tr
                ? 'Web sürümü ile Native mağaza sürümleri (iOS App Store, Google Play ve APK platformları) birbirinden bağımsız çalışır.'
                : 'Web version and Native mobile store builds (iOS App Store, Google Play & APK stores) are separated.'}
            </p>

            {/* Tabs: Downloadable Platforms vs Store Package Readiness */}
            <div className="grid grid-cols-2 gap-1.5 mb-3 shrink-0">
              <button
                onClick={() => setPlatformsTab('stores')}
                className={`arcade-btn py-1.5 font-pixel text-[7px] flex items-center justify-center gap-1 cursor-pointer ${
                  platformsTab === 'stores'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                <Download className="w-3 h-3" />
                {tr ? 'İNDİRME PLATFORMLARI (6)' : 'DOWNLOAD PLATFORMS (6)'}
              </button>
              <button
                onClick={() => setPlatformsTab('build')}
                className={`arcade-btn py-1.5 font-pixel text-[7px] flex items-center justify-center gap-1 cursor-pointer ${
                  platformsTab === 'build'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                <Package className="w-3 h-3" />
                {tr ? 'APP STORE & PLAY PAKETİ' : 'STORE BUILD CONFIG'}
              </button>
            </div>

            {platformsTab === 'stores' ? (
              <div className="flex flex-col gap-2 overflow-y-auto pr-0.5 mb-3">
                {/* 6 Mobile Store & Downloadable Platform Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MOBILE_DOWNLOAD_PLATFORMS.map((plat: DownloadPlatformItem) => (
                    <div
                      key={plat.id}
                      className={`p-2.5 border flex flex-col justify-between gap-2 ${plat.accentColor}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-pixel text-[8px] text-white">
                            {tr ? plat.nameTr : plat.name}
                          </span>
                          <span className="text-[7px] font-pixel px-1 py-0.5 bg-black/60 text-slate-300">
                            {plat.version}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-snug">
                          {tr ? plat.subtitleTr : plat.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <span className="text-[9px] text-slate-400 font-mono">{plat.size}</span>
                        <button
                          onClick={() => {
                            setSelectedPlatformNotice(
                              tr
                                ? `${plat.nameTr} (${plat.version}) paketi mağaza yayınına hazır! Mağaza linklerinizi src/config/storeConfig.ts dosyasından tanımlayabilirsiniz.`
                                : `${plat.name} (${plat.version}) is ready! Set your live store URL in src/config/storeConfig.ts.`
                            );
                          }}
                          className="arcade-btn px-2 py-1 bg-black/80 hover:bg-black text-amber-300 font-pixel text-[7px] flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-2.5 h-2.5" />
                          {tr ? plat.badgeTextTr : plat.badgeText}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instant Phone Install via Browser (Web App / Home Screen) */}
                {!isInstalled && (
                  <div className="p-2.5 bg-slate-900/90 border border-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-pixel text-[8px] text-cyan-300 block mb-0.5">
                        {tr ? 'TARAYICIDAN ANINDA TELEFONA KUR' : 'INSTANT PHONE INSTALL (WEB APP)'}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {tr
                          ? 'Mağaza beklemeden telefonunuzun ana ekranına tam ekran oyun olarak ekleyin.'
                          : 'Add directly to your phone home screen in full-screen mode.'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (isInstallable) {
                          install();
                        } else {
                          setShowPlatformsModal(false);
                          setShowIOSInstallModal(true);
                        }
                      }}
                      className="arcade-btn px-2.5 py-1.5 bg-cyan-500 text-slate-950 font-pixel text-[7px] shrink-0 cursor-pointer"
                    >
                      {tr ? 'HEMEN KUR' : 'INSTALL NOW'}
                    </button>
                  </div>
                )}

                {selectedPlatformNotice && (
                  <div className="p-2.5 bg-amber-950/60 border border-amber-500/60 text-amber-200 text-[10px] leading-snug">
                    ✓ {selectedPlatformNotice}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-black/70 p-3 border border-slate-800 space-y-2.5 text-[10px] text-slate-300 overflow-y-auto mb-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-pixel text-[8px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{tr ? 'WEB VE NATIVE MAĞAZA SÜRÜMLERİ AYRILDI' : 'WEB & NATIVE STORE BUILDS SEPARATED'}</span>
                </div>

                <div className="space-y-1 bg-slate-900/80 p-2 border border-slate-800 font-mono text-[10px]">
                  <div><span className="text-slate-400">Bundle / App ID:</span> <span className="text-amber-300">{APP_METADATA.appId}</span></div>
                  <div><span className="text-slate-400">App Store 1024px RGB İkon:</span> <a href={APP_METADATA.appStoreIconPath} target="_blank" rel="noreferrer" className="text-cyan-400 underline">{APP_METADATA.appStoreIconPath}</a></div>
                  <div><span className="text-slate-400">Google Play 512px İkon:</span> <a href={APP_METADATA.playStoreIconPath} target="_blank" rel="noreferrer" className="text-cyan-400 underline">{APP_METADATA.playStoreIconPath}</a></div>
                  <div><span className="text-slate-400">Gizlilik Politikası URL:</span> <a href={APP_METADATA.privacyPolicyPath} target="_blank" rel="noreferrer" className="text-cyan-400 underline">{APP_METADATA.privacyPolicyPath}</a></div>
                </div>

                <div className="space-y-1.5">
                  <p className="font-pixel text-[7px] text-amber-400">
                    {tr ? 'DERLEME KOMUTLARI (PACKAGE.JSON):' : 'BUILD COMMANDS:'}
                  </p>
                  <div className="bg-black p-2 border border-slate-800 font-mono text-[10px] space-y-1 text-slate-200">
                    <div><span className="text-emerald-400">npm run build:web</span> &rarr; {tr ? 'Web Sürümü (İndirme Merkezi Aktif)' : 'Web Build'}</div>
                    <div><span className="text-sky-400">npm run build:ios</span> &rarr; {tr ? 'Apple App Store (Xcode / IPA)' : 'iOS App Store Build'}</div>
                    <div><span className="text-amber-400">npm run build:android</span> &rarr; {tr ? 'Google Play (AAB) & Doğrudan APK' : 'Android Play Store & APK Build'}</div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {tr
                    ? 'Not: Native (iOS/Android) derlemesinde dış mağaza indirme butonları Apple App Store (Kural 3.1/4.2) ve Google Play politikalarına tam uyum için otomatik gizlenir; arka plana alındığında oyun otomatik duraklatılır.'
                    : 'Note: In Native builds, external store links are automatically hidden for App Store / Play Store review compliance, and gameplay auto-pauses when backgrounded.'}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowPlatformsModal(false)}
              className="arcade-btn w-full py-2 bg-amber-500 text-slate-950 font-pixel text-[8px] cursor-pointer shrink-0"
            >
              {tr ? 'KAPAT' : 'CLOSE'}
            </button>
          </div>
        </div>
      )}

      {/* ================= iOS SAFARI INSTALL GUIDE MODAL ================= */}
      {showIOSInstallModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs pointer-events-auto">
          <div className="pixel-panel p-5 max-w-xs w-full relative text-left">
            <button
              onClick={() => setShowIOSInstallModal(false)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-pixel text-[10px] text-amber-400 mb-3 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              {tr ? 'iOS ANA EKRANA EKLE' : 'INSTALL ON iOS'}
            </h3>

            <div className="bg-black/60 p-3 border border-slate-800 space-y-2 text-[8px] font-pixel text-slate-300 leading-relaxed mb-4">
              <p>
                1. {tr ? 'Safari alt çubuğundaki ' : 'Tap the '}
                <span className="text-cyan-400">{tr ? 'Paylaş' : 'Share'}</span>
                {tr ? ' simgesine dokunun.' : ' button in Safari.'}
              </p>
              <p>
                2. {tr ? 'Menüden ' : 'Select '}
                <span className="text-amber-300">{tr ? 'Ana Ekrana Ekle' : 'Add to Home Screen'}</span>
                {tr ? ' seçeneğine basın.' : ' from the list.'}
              </p>
              <p>
                3. {tr ? 'Tam ekran uygulama olarak oynayın!' : 'Launch full-screen from your home screen!'}
              </p>
            </div>

            <button
              onClick={() => setShowIOSInstallModal(false)}
              className="arcade-btn w-full py-2 bg-amber-500 text-slate-950 font-pixel text-[8px] cursor-pointer"
            >
              {tr ? 'TAMAM' : 'GOT IT'}
            </button>
          </div>
        </div>
      )}

      {/* ================= UPGRADE SELECTION MODAL ================= */}
      {gameState === 'UPGRADE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto pointer-events-auto">
          <div className="pixel-panel p-4 sm:p-6 max-w-lg md:max-w-xl w-full max-h-[92dvh] flex flex-col my-auto overflow-y-auto">
            {/* Modal Header */}
            <div className="text-center mb-3 sm:mb-4 shrink-0">
              <span className="font-pixel text-[8px] sm:text-[9px] text-amber-400 uppercase tracking-wider">
                {tr ? 'DALGA TAMAMLANDI!' : 'WAVE CLEARED!'}
              </span>
              <h2 className="font-pixel text-xs sm:text-sm text-white mt-1">
                {tr ? 'BİR GÜÇLENDİRME SEÇ' : 'CHOOSE AN UPGRADE'}
              </h2>
            </div>

            {/* 3 Responsive Cards: Horizontal rows on mobile, 3 columns on tablet/desktop */}
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-2.5 w-full overflow-y-auto">
              {upgrades.map((up) => {
                const borderClass =
                  up.rarity === 'legendary'
                    ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                    : up.rarity === 'epic'
                    ? 'border-purple-400 bg-purple-950/40 text-purple-300'
                    : up.rarity === 'rare'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300';

                return (
                  <button
                    key={up.id}
                    onClick={() => gameEngine.selectUpgrade(up.id)}
                    className={`arcade-btn flex items-center sm:flex-col p-2.5 sm:p-3 gap-2.5 text-left sm:text-center w-full cursor-pointer transition-transform active:scale-98 ${borderClass}`}
                  >
                    <div className="p-2 bg-black border border-slate-800 shrink-0 flex items-center justify-center">
                      {getUpgradeIcon(up.iconName, "w-5 h-5")}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[7px] font-pixel uppercase tracking-wider text-slate-400 mb-0.5">
                        {up.rarity}
                      </span>

                      <h3 className="font-pixel text-[9px] text-white mb-1 truncate">
                        {tr ? up.titleTr : up.title}
                      </h3>

                      <p className="text-[10px] sm:text-[11px] text-slate-300 leading-tight">
                        {tr ? up.descriptionTr : up.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= PAUSE MODAL ================= */}
      {gameState === 'PAUSED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 overflow-y-auto pointer-events-auto">
          <div className="pixel-panel p-5 max-w-xs w-full flex flex-col items-center text-center my-auto">
            <h2 className="font-pixel text-sm sm:text-base text-amber-400 mb-4">
              {tr ? 'DURAKLATILDI' : 'PAUSED'}
            </h2>

            <button
              onClick={() => gameEngine.pauseGame()}
              className="arcade-btn w-full py-2.5 mb-2 bg-amber-500 text-slate-950 font-pixel text-[9px] cursor-pointer"
            >
              {tr ? 'DEVAM ET (ESC)' : 'RESUME (ESC)'}
            </button>

            <button
              onClick={() => gameEngine.restartGame()}
              className="arcade-btn w-full py-2 mb-2 bg-slate-800 text-slate-200 font-pixel text-[8px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {tr ? 'YENİDEN BAŞLA' : 'RESTART'}
            </button>

            {/* ANA MENÜ BUTTON (ESC MENÜSÜNDE ANA MENÜ) */}
            <button
              onClick={() => gameEngine.goToTitle()}
              className="arcade-btn w-full py-2 mb-2 bg-[#1b2234] border border-amber-500/40 text-amber-300 font-pixel text-[8px] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#242d45]"
            >
              <Home className="w-3.5 h-3.5" />
              {tr ? 'ANA MENÜ' : 'MAIN MENU'}
            </button>

            <button
              onClick={onToggleGamepad}
              className="arcade-btn w-full py-2 bg-[#232736] text-slate-300 font-pixel text-[8px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              {showMobileControls ? (tr ? 'KUMANDAYI GİZLE' : 'HIDE GAMEPAD') : (tr ? 'KUMANDAYI GÖSTER' : 'SHOW GAMEPAD')}
            </button>
          </div>
        </div>
      )}

      {/* ================= GAME OVER MODAL ================= */}
      {gameState === 'GAMEOVER' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 overflow-y-auto pointer-events-auto">
          <div className="pixel-panel-red p-5 sm:p-6 max-w-xs w-full flex flex-col items-center text-center my-auto">
            <span className="font-pixel text-[8px] text-rose-500 mb-1">
              {tr ? 'ŞÖVALYE DÜŞTÜ' : 'KNIGHT HAS FALLEN'}
            </span>
            <h2 className="font-pixel text-lg sm:text-xl text-white mb-3">
              {tr ? 'OYUN BİTTİ' : 'GAME OVER'}
            </h2>

            <div className="w-full bg-black border border-rose-950 p-2.5 mb-4 flex flex-col gap-1 text-[8px] font-pixel">
              <div className="flex justify-between text-slate-400">
                <span>{tr ? 'SKOR:' : 'SCORE:'}</span>
                <span className="text-white tabular-nums">{hud.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{tr ? 'DALGA:' : 'WAVE:'}</span>
                <span className="text-amber-400 tabular-nums">{hud.wave}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{tr ? 'REKOR:' : 'BEST:'}</span>
                <span className="text-cyan-400 tabular-nums">
                  {Math.max(hud.score, hud.highScore).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => gameEngine.startGame(hud.heroClass)}
              className="arcade-btn w-full py-2.5 mb-2 bg-amber-500 text-slate-950 font-pixel text-[9px] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {tr ? 'TEKRAR OYNA' : 'PLAY AGAIN'}
            </button>

            <button
              onClick={() => gameEngine.goToTitle()}
              className="arcade-btn w-full py-2 bg-slate-800 text-slate-300 font-pixel text-[8px] flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-700"
            >
              <Home className="w-3.5 h-3.5" />
              {tr ? 'ANA MENÜ' : 'MAIN MENU'}
            </button>
          </div>
        </div>
      )}

      {/* ================= GUARANTEED MOBILE CONTROLS (PORTRAIT DECK OR FLOATING CORNERS) ================= */}
      {showMobileControls && gameState === 'PLAYING' && (
        <div
          className={`${
            isPortrait
              ? 'w-full bg-[#12141e] border-t-2 border-black p-2.5 sm:p-3 pb-safe pl-safe pr-safe flex items-center justify-between shrink-0 pointer-events-auto z-40 shadow-2xl'
              : 'fixed inset-x-0 bottom-0 p-3 sm:p-5 pb-safe pl-safe pr-safe pointer-events-none z-40 flex items-end justify-between'
          }`}
        >
          {/* Left: 360° Rotating Virtual Analog Joystick (Dönen Sanal Joystick) */}
          <div className="flex flex-col items-center pointer-events-auto shrink-0 select-none touch-none">
            <div
              ref={joystickBaseRef}
              onPointerDown={handleJoystickPointerDown}
              onPointerMove={handleJoystickPointerMove}
              onPointerUp={handleJoystickPointerUp}
              onPointerCancel={handleJoystickPointerUp}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-[#1b1f2d] via-[#141724] to-[#0c0e16] border-2 border-[#384259] shadow-[inset_0_4px_8px_rgba(0,0,0,0.9),0_6px_12px_rgba(0,0,0,0.6)] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
              style={{ touchAction: 'none' }}
            >
              {/* Subtle 8-directional guide ticks */}
              <div className="absolute inset-2 rounded-full border border-slate-700/30 pointer-events-none" />
              <span className="absolute top-1 text-[7px] font-pixel text-slate-500 pointer-events-none">▲</span>
              <span className="absolute bottom-1 text-[7px] font-pixel text-slate-500 pointer-events-none">▼</span>
              <span className="absolute left-1.5 text-[7px] font-pixel text-slate-500 pointer-events-none">◀</span>
              <span className="absolute right-1.5 text-[7px] font-pixel text-slate-500 pointer-events-none">▶</span>

              {/* Center Indented Socket */}
              <div className="w-10 h-10 rounded-full bg-[#0a0c12] border border-slate-800/80 pointer-events-none" />

              {/* Directional Laser / Glow Ray when tilted */}
              {isDraggingJoystick && joystickAngle !== null && (
                <div
                  className="absolute w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-amber-300 pointer-events-none origin-left"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${joystickAngle}rad)`,
                    opacity: Math.min(1, Math.hypot(knobPos.x, knobPos.y) / 16),
                  }}
                />
              )}

              {/* Smooth Movable Knob (Thumbstick) */}
              <div
                className={`absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-[#3a4358] via-[#242b3b] to-[#151923] border-2 border-[#54627d] shadow-[0_4px_10px_rgba(0,0,0,0.8),inset_0_2px_2px_rgba(255,255,255,0.2)] flex items-center justify-center pointer-events-none ${
                  isDraggingJoystick ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : ''
                }`}
                style={{
                  transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                  transition: isDraggingJoystick ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                {/* Thumb grip center */}
                <div className="w-6 h-6 rounded-full border border-slate-600/70 bg-[#161a25] flex items-center justify-center">
                  <div className={`w-2 h-2 rounded-full ${isDraggingJoystick ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-400'}`} />
                </div>

                {/* Rotating Directional Pip on Knob Rim */}
                {isDraggingJoystick && joystickAngle !== null && (
                  <div
                    className="absolute w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_#fde047] pointer-events-none"
                    style={{
                      transform: `rotate(${joystickAngle}rad) translate(18px)`,
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Center: Handheld Branding & Pause (if portrait) */}
          {isPortrait && (
            <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
              <button
                onClick={() => gameEngine.pauseGame()}
                className="arcade-btn px-2.5 py-1 bg-[#232736] text-[7px] font-pixel text-amber-300 cursor-pointer"
              >
                PAUSE
              </button>
              <span className="text-[6px] font-pixel text-slate-500 tracking-wider">RETRO PAD</span>
            </div>
          )}

          {/* Right: Arcade Action Buttons (A, B, X) */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto shrink-0 select-none">
            {/* Special [X] */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                gameEngine.triggerHaptic(30);
                gameEngine.bufferAction('special');
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                gameEngine.triggerHaptic(30);
                gameEngine.bufferAction('special');
              }}
              className={`arcade-btn w-11 h-11 sm:w-12 sm:h-12 rounded-full flex flex-col items-center justify-center font-pixel text-[7px] sm:text-[8px] text-white cursor-pointer ${
                hud.specialReady
                  ? 'bg-amber-600 active:bg-amber-500 border-yellow-300 animate-pulse'
                  : 'bg-stone-800 text-slate-500'
              }`}
            >
              <Zap className="w-3.5 h-3.5 mb-0.5" />
              SP
            </button>

            {/* Dash [B] */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                gameEngine.triggerHaptic(15);
                gameEngine.bufferAction('dash');
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                gameEngine.triggerHaptic(15);
                gameEngine.bufferAction('dash');
              }}
              className={`arcade-btn w-11 h-11 sm:w-13 sm:h-13 rounded-full flex flex-col items-center justify-center font-pixel text-[7px] sm:text-[8px] text-white cursor-pointer ${
                hud.dashReady
                  ? 'bg-emerald-700 active:bg-emerald-600 text-emerald-100'
                  : 'bg-stone-800 text-slate-500'
              }`}
            >
              <Wind className="w-3.5 h-3.5 mb-0.5" />
              DASH
            </button>

            {/* Primary Attack [A] */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                gameEngine.triggerHaptic(20);
                gameEngine.bufferAction('attack');
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                gameEngine.triggerHaptic(20);
                gameEngine.bufferAction('attack');
              }}
              className="arcade-btn w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-600 active:bg-rose-500 text-white flex flex-col items-center justify-center font-pixel text-[8px] sm:text-[9px] font-bold cursor-pointer"
            >
              <Sword className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
              ATK
            </button>
          </div>
        </div>
      )}
    </>
  );
};
