/**
 * Tiny Pixel Dungeon - Core Engine
 * 60 FPS deterministic game loop, responsive input manager, physics, combat, enemy AI & VFX.
 */

import {
  GameState,
  Facing,
  Player,
  Enemy,
  EnemyType,
  Projectile,
  Pickup,
  BreakableProp,
  Particle,
  FloatingText,
  UpgradeOption,
  Torch,
  HudState,
  BossInfo,
  HeroClass,
  DungeonBiomeId,
  DungeonThemeInfo
} from './types';
import { audio } from './audio';
import { spriteRenderer } from './sprites';

export const ARENA_WIDTH = 760;
export const ARENA_HEIGHT = 540;
export const WALL_THICKNESS = 32;

export interface DungeonThemeConfig {
  id: DungeonBiomeId;
  name: string;
  nameTr: string;
  subtitle: string;
  subtitleTr: string;
  bannerColor: string;
  wallTop: string;
  wallFace: string;
  wallBevel: string;
  wallAccent: string;
  torchFlame: string;
  torchInner: string;
  torchGlow: string;
  pillarColor: string;
  pillarHighlight: string;
  bannerFabric: string;
  bannerTrim: string;
  ambientParticleColor: string;
  ambientParticleType: 'ember' | 'water_mote' | 'violet_spark' | 'dust' | 'gold_fleck';
}

export const DUNGEON_THEMES: Record<DungeonBiomeId, DungeonThemeConfig> = {
  catacombs: {
    id: 'catacombs',
    name: 'Ancient Catacombs',
    nameTr: 'Antik Taş Mahzen',
    subtitle: 'Mossy crypts of the fallen paladins',
    subtitleTr: 'Düşmüş şövalyelerin yosunlu mahzenleri',
    bannerColor: '#34d399',
    wallTop: '#090d16',
    wallFace: '#1e293b',
    wallBevel: '#334155',
    wallAccent: '#059669',
    torchFlame: '#f59e0b',
    torchInner: '#fef08a',
    torchGlow: 'rgba(245, 158, 11, 0.18)',
    pillarColor: '#334155',
    pillarHighlight: '#64748b',
    bannerFabric: '#047857',
    bannerTrim: '#fbbf24',
    ambientParticleColor: '#6ee7b7',
    ambientParticleType: 'dust',
  },
  magma: {
    id: 'magma',
    name: 'Magma Forge',
    nameTr: 'Magma Ocağı',
    subtitle: 'Infernal crucible where cursed weapons are forged',
    subtitleTr: 'Lanetli silahların dövüldüğü cehennem ocağı',
    bannerColor: '#f97316',
    wallTop: '#0c0704',
    wallFace: '#1c1917',
    wallBevel: '#44403c',
    wallAccent: '#ea580c',
    torchFlame: '#ea580c',
    torchInner: '#fde047',
    torchGlow: 'rgba(234, 88, 12, 0.22)',
    pillarColor: '#292524',
    pillarHighlight: '#9a3412',
    bannerFabric: '#b91c1c',
    bannerTrim: '#f97316',
    ambientParticleColor: '#fb923c',
    ambientParticleType: 'ember',
  },
  sunken: {
    id: 'sunken',
    name: 'Sunken Crypt',
    nameTr: 'Batık Tapınak',
    subtitle: 'Submerged halls resonant with ancient tides',
    subtitleTr: 'Kadim gelgitlerin yankılandığı sular altındaki tapınak',
    bannerColor: '#06b6d4',
    wallTop: '#021817',
    wallFace: '#0f2e2e',
    wallBevel: '#134e4a',
    wallAccent: '#0d9488',
    torchFlame: '#06b6d4',
    torchInner: '#e0f2fe',
    torchGlow: 'rgba(6, 182, 212, 0.2)',
    pillarColor: '#115e59',
    pillarHighlight: '#2dd4bf',
    bannerFabric: '#0e7490',
    bannerTrim: '#67e8f9',
    ambientParticleColor: '#22d3ee',
    ambientParticleType: 'water_mote',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Sanctum',
    nameTr: 'Obsidyen Mabedi',
    subtitle: 'Sacred halls of the shadow archmages',
    subtitleTr: 'Gölge başbüyücülerinin gizemli mabedi',
    bannerColor: '#c084fc',
    wallTop: '#06020c',
    wallFace: '#1e1b4b',
    wallBevel: '#312e81',
    wallAccent: '#7e22ce',
    torchFlame: '#c084fc',
    torchInner: '#fae8ff',
    torchGlow: 'rgba(192, 132, 252, 0.22)',
    pillarColor: '#2e1065',
    pillarHighlight: '#a855f7',
    bannerFabric: '#4c1d95',
    bannerTrim: '#eab308',
    ambientParticleColor: '#c084fc',
    ambientParticleType: 'violet_spark',
  },
  citadel: {
    id: 'citadel',
    name: 'Royal Citadel',
    nameTr: 'Kraliyet Kalesi',
    subtitle: 'Imperial seat guarded by the Titan Golem',
    subtitleTr: 'Taş Titan Golem tarafından korunan imparatorluk kalesi',
    bannerColor: '#fbbf24',
    wallTop: '#090807',
    wallFace: '#292524',
    wallBevel: '#44403c',
    wallAccent: '#991b1b',
    torchFlame: '#fbbf24',
    torchInner: '#ffffff',
    torchGlow: 'rgba(251, 191, 36, 0.22)',
    pillarColor: '#1c1917',
    pillarHighlight: '#d97706',
    bannerFabric: '#7f1d1d',
    bannerTrim: '#facc15',
    ambientParticleColor: '#fde047',
    ambientParticleType: 'gold_fleck',
  },
};

const ALL_UPGRADES: UpgradeOption[] = [
  {
    id: 'flame_blade',
    title: 'Flame Blade',
    titleTr: 'Alev Kılıcı',
    description: '+35% damage and ignites enemies with fiery embers.',
    descriptionTr: '+%35 hasar ve düşmanları ateşe veren alev kıvılcımları.',
    iconName: 'flame',
    rarity: 'rare',
  },
  {
    id: 'swift_boots',
    title: 'Windrunner Boots',
    titleTr: 'Rüzgar Çizmeleri',
    description: '+25% movement speed and faster dash cooldown.',
    descriptionTr: '+%25 hareket hızı ve daha hızlı atılma bekleme süresi.',
    iconName: 'wind',
    rarity: 'common',
  },
  {
    id: 'max_heart',
    title: 'Heart Container',
    titleTr: 'Zırhlı Kalp',
    description: '+2 Max Hearts and instantly restores 3 Hearts.',
    descriptionTr: '+2 Maksimum Can ve anında 3 Can yeniler.',
    iconName: 'heart',
    rarity: 'common',
  },
  {
    id: 'chain_lightning',
    title: 'Chain Spark',
    titleTr: 'Zincir Yıldırım',
    description: 'Strikes arc electric sparks to nearby enemies.',
    descriptionTr: 'Vuruşlar yakındaki düşmanlara elektrik kıvılcımı saçar.',
    iconName: 'zap',
    rarity: 'epic',
  },
  {
    id: 'vampire',
    title: 'Vampire Edge',
    titleTr: 'Vampir Ruhu',
    description: 'Restores 1 Heart every 7 consecutive combo hits.',
    descriptionTr: 'Her 7 kombo vuruşta 1 Can yeniler.',
    iconName: 'skull',
    rarity: 'epic',
  },
  {
    id: 'dash_stun',
    title: 'Shadow Dash',
    titleTr: 'Gölge Atılımı',
    description: 'Dashing phases through enemies, damaging and staggering them.',
    descriptionTr: 'Atılma düşmanların içinden geçer, hasar verir ve sersemletir.',
    iconName: 'shield',
    rarity: 'rare',
  },
  {
    id: 'gem_magnet',
    title: 'Gold Magnet',
    titleTr: 'Mıknatıs Tılsımı',
    description: 'Pulls all dropped coins, gems and hearts toward you.',
    descriptionTr: 'Düşen tüm altın, mücevher ve canları sana doğru çeker.',
    iconName: 'magnet',
    rarity: 'common',
  },
  {
    id: 'whirlwind_aura',
    title: 'Blade Cyclone',
    titleTr: 'Kılıç Kasırgası',
    description: 'Special ability covers the entire room in a devastating blade vortex.',
    descriptionTr: 'Özel yetenek tüm odayı kaplayan ölümcül bir kılıç girdabı yaratır.',
    iconName: 'sword',
    rarity: 'legendary',
  },
];

export class GameEngine {
  public state: GameState = 'TITLE';
  public player: Player;
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public pickups: Pickup[] = [];
  public props: BreakableProp[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public torches: Torch[] = [];

  // Upgrades
  public availableUpgrades: UpgradeOption[] = [];

  // High score
  public highScore: number = 0;

  // Camera & Game Feel
  public cameraX: number = 0; // screenshake x
  public cameraY: number = 0; // screenshake y
  public cameraTrauma: number = 0;
  public cameraFocusX: number = ARENA_WIDTH / 2;
  public cameraFocusY: number = ARENA_HEIGHT / 2;
  public cameraZoom: number = 1.38; // 1.38x zoom for mobile
  public targetZoom: number = 1.38;
  public hitstopTimer: number = 0;
  public slowmoFactor: number = 1.0;

  // Juicy Animations: Dash Ghost Trails & Footstep Emitter
  public playerGhostTrails: Array<{
    x: number;
    y: number;
    facing: Facing;
    frame: number;
    alpha: number;
    heroClass: HeroClass;
  }> = [];
  public ghostSpawnTimer: number = 0;
  public footstepTimer: number = 0;

  // Offscreen Pre-baked Canvas Buffers (High-Performance 60 FPS)
  private floorCanvas: HTMLCanvasElement | null = null;
  private wallsCanvas: HTMLCanvasElement | null = null;

  // Wave Manager
  public waveTimer: number = 0;
  public waveSpawning: boolean = false;
  public enemiesToSpawn: EnemyType[] = [];
  public spawnTimer: number = 0;

  // Input states
  public keysHeld: Set<string> = new Set();
  public keysJustPressed: Set<string> = new Set();
  public bufferedAction: 'attack' | 'dash' | 'special' | null = null;
  public bufferTimer: number = 0;

  // Virtual Joystick / Touch
  public touchMoveVector = { x: 0, y: 0 };
  public isTouchActive: boolean = false;

  // Callbacks for React state sync (without causing heavy re-renders)
  public onStateChange?: (state: GameState) => void;
  public onPlayerHpChange?: (hp: number, maxHp: number) => void;
  public onScoreChange?: (score: number, coins: number, combo: number, wave: number) => void;
  public onUpgradesReady?: (upgrades: UpgradeOption[]) => void;
  public onHudUpdate?: (hud: HudState) => void;

  private lastTime: number = 0;
  private animId: number | null = null;
  private hudUpdateTimer: number = 0;

  public triggerHaptic(durationMs: number = 20) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch {
        // ignore on unsupported devices
      }
    }
  }

  public getHudState(): HudState {
    const p = this.player;
    const boss = this.enemies.find((e) => e.isBoss);
    const dashProgress =
      p.dashCooldownTimer <= 0
        ? 1
        : Math.max(0, 1 - p.dashCooldownTimer / p.dashCooldown);
    const specialProgress =
      p.specialTimer <= 0
        ? 1
        : Math.max(0, 1 - p.specialTimer / p.specialCooldown);

    let activeBoss: BossInfo | null = null;
    if (boss) {
      const isEnraged = boss.hp <= boss.maxHp * 0.5;
      activeBoss = {
        name: isEnraged ? 'ENRAGED TITAN GOLEM' : 'Necro Golem Titan',
        nameTr: isEnraged ? 'ÖFKELİ TAŞ GOLEM' : 'Taş Golem Titanı',
        hp: Math.max(0, boss.hp),
        maxHp: boss.maxHp,
        phase: isEnraged ? 2 : 1,
        isEnraged,
      };
    }

    return {
      hp: p.hp,
      maxHp: p.maxHp,
      stamina: Math.round(p.stamina),
      maxStamina: p.maxStamina,
      score: p.score,
      coins: p.coins,
      combo: p.combo,
      comboTimer: p.comboTimer,
      wave: p.wave,
      highScore: this.highScore,
      dashReady: p.dashCooldownTimer <= 0 && p.stamina >= 25,
      dashCooldownProgress: dashProgress,
      specialReady: p.specialTimer <= 0,
      specialCooldownProgress: specialProgress,
      enemiesRemaining: this.enemies.length + this.enemiesToSpawn.length,
      activeBoss,
      upgrades: [...p.upgrades],
      heroClass: p.heroClass,
      dungeonTheme: {
        id: this.currentTheme.id,
        name: this.currentTheme.name,
        nameTr: this.currentTheme.nameTr,
        subtitle: this.currentTheme.subtitle,
        subtitleTr: this.currentTheme.subtitleTr,
        bannerColor: this.currentTheme.bannerColor,
      },
    };
  }

  // Dungeon Themes & Biome
  public currentBiome: DungeonBiomeId = 'catacombs';
  public currentTheme: DungeonThemeConfig = DUNGEON_THEMES.catacombs;
  private ambientParticleTimer: number = 0;
  private themeAnimTimer: number = 0;

  public selectedHeroClass: HeroClass = 'knight';

  constructor() {
    this.highScore = parseInt(localStorage.getItem('tiny_pixel_dungeon_highscore') || '0', 10);
    this.player = this.createDefaultPlayer('knight');
    this.setupArenaProps();
    this.setupTorches();
    this.bakeArenaBackground();
  }

  private bakeArenaBackground() {
    if (typeof document === 'undefined') return;
    if (!this.floorCanvas) {
      this.floorCanvas = document.createElement('canvas');
      this.floorCanvas.width = ARENA_WIDTH;
      this.floorCanvas.height = ARENA_HEIGHT;
    }
    const fCtx = this.floorCanvas.getContext('2d')!;
    fCtx.imageSmoothingEnabled = false;
    fCtx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    spriteRenderer.drawFloor(fCtx, 0, 0, ARENA_WIDTH, ARENA_HEIGHT, this.currentBiome);
    this.renderDungeonArchitecture(fCtx);

    if (!this.wallsCanvas) {
      this.wallsCanvas = document.createElement('canvas');
      this.wallsCanvas.width = ARENA_WIDTH;
      this.wallsCanvas.height = ARENA_HEIGHT;
    }
    const wCtx = this.wallsCanvas.getContext('2d')!;
    wCtx.imageSmoothingEnabled = false;
    wCtx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.renderWalls(wCtx);
  }

  public setHeroClass(heroClass: HeroClass) {
    this.selectedHeroClass = heroClass;
    this.player = this.createDefaultPlayer(heroClass);
    this.onHudUpdate?.(this.getHudState());
  }

  private createDefaultPlayer(heroClass: HeroClass = this.selectedHeroClass): Player {
    let hp = 6;
    let speed = 160;
    let attackDamage = 26;
    let attackRange = 48;
    let attackCooldown = 0.28;
    let dashCooldown = 0.65;

    if (heroClass === 'rogue') {
      hp = 4;
      speed = 185;
      attackDamage = 20;
      attackRange = 42;
      attackCooldown = 0.18;
      dashCooldown = 0.45;
    } else if (heroClass === 'mage') {
      hp = 4;
      speed = 145;
      attackDamage = 24;
      attackRange = 130;
      attackCooldown = 0.35;
      dashCooldown = 0.85;
    }

    return {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2 + 20,
      vx: 0,
      vy: 0,
      width: 20,
      height: 24,
      hp,
      maxHp: hp,
      stamina: 100,
      maxStamina: 100,
      speed,
      facing: 'right',
      heroClass,
      
      isAttacking: false,
      attackTimer: 0,
      attackCooldown: 0,
      attackAngle: 0,
      attackDamage,
      attackRange,

      isDashing: false,
      dashTimer: 0,
      dashDuration: 0.18,
      dashCooldown,
      dashCooldownTimer: 0,
      dashVx: 0,
      dashVy: 0,

      specialCooldown: 12,
      specialTimer: 0,
      isSpecialActive: false,

      invulnerableTimer: 0,
      flashTimer: 0,
      walkFrame: 0,
      walkTimer: 0,

      score: 0,
      coins: 0,
      combo: 0,
      comboTimer: 0,
      killCount: 0,
      wave: 1,

      upgrades: [],
      hasFireBlade: false,
      hasMagnet: false,
      hasChainLightning: false,
      hasThorns: false,
      hasVampire: false,
      dashStuns: false,
      hasWhirlwindAura: false,
    };
  }

  public setDungeonBiome(biome: DungeonBiomeId) {
    this.currentBiome = biome;
    this.currentTheme = DUNGEON_THEMES[biome] || DUNGEON_THEMES.catacombs;
    this.setupArenaProps();
    this.setupTorches();
    this.bakeArenaBackground();
    this.onHudUpdate?.(this.getHudState());

    // Dramatic biome entry particles bursting from room center
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2;
      const spd = 70 + Math.random() * 100;
      this.particles.push({
        x: ARENA_WIDTH / 2,
        y: ARENA_HEIGHT / 2,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 2,
        color: this.currentTheme.bannerColor,
        alpha: 0.9,
        life: 0,
        maxLife: 0.65,
      });
    }
  }

  private setupArenaProps() {
    const theme = this.currentBiome;
    if (theme === 'catacombs') {
      this.props = [
        { id: 'prop_1', x: 80, y: 80, width: 16, height: 16, hp: 1, type: 'pot' },
        { id: 'prop_2', x: 105, y: 80, width: 16, height: 18, hp: 1, type: 'urn' },
        { id: 'prop_3', x: ARENA_WIDTH - 80, y: 80, width: 16, height: 18, hp: 1, type: 'urn' },
        { id: 'prop_4', x: ARENA_WIDTH - 105, y: 80, width: 16, height: 16, hp: 1, type: 'pot' },
        { id: 'prop_5', x: 85, y: ARENA_HEIGHT - 85, width: 16, height: 16, hp: 1, type: 'skull_pile' },
        { id: 'prop_6', x: ARENA_WIDTH - 85, y: ARENA_HEIGHT - 85, width: 16, height: 16, hp: 1, type: 'skull_pile' },
        { id: 'chest_1', x: ARENA_WIDTH / 2, y: 72, width: 20, height: 18, hp: 1, type: 'chest', opened: false },
      ];
    } else if (theme === 'magma') {
      this.props = [
        { id: 'prop_1', x: 85, y: 85, width: 20, height: 16, hp: 1, type: 'anvil' },
        { id: 'prop_2', x: 115, y: 85, width: 18, height: 18, hp: 1, type: 'crate' },
        { id: 'prop_3', x: ARENA_WIDTH - 85, y: 85, width: 20, height: 16, hp: 1, type: 'anvil' },
        { id: 'prop_4', x: ARENA_WIDTH - 115, y: 85, width: 18, height: 18, hp: 1, type: 'crate' },
        { id: 'prop_5', x: 90, y: ARENA_HEIGHT - 85, width: 16, height: 16, hp: 1, type: 'skull_pile' },
        { id: 'prop_6', x: ARENA_WIDTH - 90, y: ARENA_HEIGHT - 85, width: 18, height: 18, hp: 1, type: 'crate' },
        { id: 'chest_1', x: ARENA_WIDTH / 2, y: 72, width: 20, height: 18, hp: 1, type: 'chest', opened: false },
      ];
    } else if (theme === 'sunken') {
      this.props = [
        { id: 'prop_1', x: 80, y: 80, width: 18, height: 18, hp: 1, type: 'crystal' },
        { id: 'prop_2', x: 110, y: 80, width: 16, height: 18, hp: 1, type: 'urn' },
        { id: 'prop_3', x: ARENA_WIDTH - 80, y: 80, width: 18, height: 18, hp: 1, type: 'crystal' },
        { id: 'prop_4', x: ARENA_WIDTH - 110, y: 80, width: 18, height: 18, hp: 1, type: 'crystal' },
        { id: 'prop_5', x: 85, y: ARENA_HEIGHT - 85, width: 18, height: 18, hp: 1, type: 'crystal' },
        { id: 'prop_6', x: ARENA_WIDTH - 85, y: ARENA_HEIGHT - 85, width: 16, height: 18, hp: 1, type: 'urn' },
        { id: 'chest_1', x: ARENA_WIDTH / 2, y: 72, width: 20, height: 18, hp: 1, type: 'chest', opened: false },
      ];
    } else if (theme === 'obsidian') {
      this.props = [
        { id: 'prop_1', x: 85, y: 85, width: 16, height: 18, hp: 1, type: 'urn' },
        { id: 'prop_2', x: 115, y: 85, width: 18, height: 18, hp: 1, type: 'crystal' },
        { id: 'prop_3', x: ARENA_WIDTH - 85, y: 85, width: 16, height: 18, hp: 1, type: 'urn' },
        { id: 'prop_4', x: ARENA_WIDTH - 115, y: 85, width: 18, height: 18, hp: 1, type: 'crystal' },
        { id: 'prop_5', x: 90, y: ARENA_HEIGHT - 85, width: 18, height: 18, hp: 1, type: 'crate' },
        { id: 'prop_6', x: ARENA_WIDTH - 90, y: ARENA_HEIGHT - 85, width: 16, height: 18, hp: 1, type: 'urn' },
        { id: 'chest_1', x: ARENA_WIDTH / 2, y: 72, width: 20, height: 18, hp: 1, type: 'chest', opened: false },
      ];
    } else {
      // citadel
      this.props = [
        { id: 'prop_1', x: 85, y: 85, width: 18, height: 18, hp: 1, type: 'crate' },
        { id: 'prop_2', x: 115, y: 85, width: 16, height: 18, hp: 1, type: 'urn' },
        { id: 'prop_3', x: ARENA_WIDTH - 85, y: 85, width: 18, height: 18, hp: 1, type: 'crate' },
        { id: 'prop_4', x: ARENA_WIDTH - 115, y: 85, width: 16, height: 18, hp: 1, type: 'urn' },
        { id: 'prop_5', x: 90, y: ARENA_HEIGHT - 85, width: 16, height: 16, hp: 1, type: 'skull_pile' },
        { id: 'prop_6', x: ARENA_WIDTH - 90, y: ARENA_HEIGHT - 85, width: 16, height: 16, hp: 1, type: 'skull_pile' },
        { id: 'chest_1', x: ARENA_WIDTH / 2, y: 72, width: 20, height: 18, hp: 1, type: 'chest', opened: false },
      ];
    }
  }

  private setupTorches() {
    const flame = this.currentTheme?.torchFlame || '#f59e0b';
    this.torches = [
      { x: 180, y: WALL_THICKNESS + 8, flicker: 0, color: flame },
      { x: ARENA_WIDTH - 180, y: WALL_THICKNESS + 8, flicker: 0, color: flame },
      { x: WALL_THICKNESS + 8, y: ARENA_HEIGHT / 2, flicker: 0, color: flame },
      { x: ARENA_WIDTH - WALL_THICKNESS - 8, y: ARENA_HEIGHT / 2, flicker: 0, color: flame },
      { x: 240, y: ARENA_HEIGHT - WALL_THICKNESS - 8, flicker: 0, color: flame },
      { x: ARENA_WIDTH - 240, y: ARENA_HEIGHT - WALL_THICKNESS - 8, flicker: 0, color: flame },
    ];
  }

  public startGame(heroClass: HeroClass = 'knight') {
    audio.unlockAudio();
    this.selectedHeroClass = 'knight';
    this.player = this.createDefaultPlayer('knight');
    this.cameraFocusX = this.player.x;
    this.cameraFocusY = this.player.y;
    this.cameraZoom = 1.38;
    this.targetZoom = 1.38;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.state = 'PLAYING';
    this.onStateChange?.(this.state);
    this.onPlayerHpChange?.(this.player.hp, this.player.maxHp);
    this.onScoreChange?.(this.player.score, this.player.coins, this.player.combo, this.player.wave);
    this.startWave(1);
  }

  public restartGame() {
    this.startGame();
  }

  public goToTitle() {
    this.state = 'TITLE';
    this.targetZoom = 1.05;
    this.touchMoveVector = { x: 0, y: 0 };
    this.player = this.createDefaultPlayer(this.selectedHeroClass);
    this.enemies = [];
    this.enemiesToSpawn = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.pickups = [];
    this.setDungeonBiome('catacombs');
    this.onStateChange?.(this.state);
    this.onHudUpdate?.(this.getHudState());
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.onStateChange?.(this.state);
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.onStateChange?.(this.state);
    }
  }

  public pauseOnBackground() {
    if (this.state === 'PLAYING') {
      this.touchMoveVector = { x: 0, y: 0 };
      this.keysHeld.clear();
      this.state = 'PAUSED';
      this.onStateChange?.(this.state);
    }
  }

  public resetHighScore() {
    this.highScore = 0;
    try {
      localStorage.removeItem('tiny_pixel_dungeon_highscore');
    } catch {
      // ignore storage errors
    }
    this.onHudUpdate?.(this.getHudState());
  }

  // --- WAVE MANAGER ---
  private startWave(waveNum: number) {
    this.player.wave = waveNum;
    this.onScoreChange?.(this.player.score, this.player.coins, this.player.combo, this.player.wave);

    // Switch and adapt dungeon theme dynamically based on wave progression!
    const biomes: DungeonBiomeId[] = ['catacombs', 'magma', 'sunken', 'obsidian', 'citadel'];
    const biomeIndex = (waveNum - 1) % biomes.length;
    this.setDungeonBiome(biomes[biomeIndex]);

    this.enemiesToSpawn = [];
    this.waveSpawning = true;
    this.spawnTimer = 0;
    audio.setBossMode(waveNum % 5 === 0);

    // Every 5 waves: Dungeon Boss!
    if (waveNum % 5 === 0) {
      this.enemiesToSpawn.push('BOSS_GOLEM');
      if (waveNum >= 10) {
        // Wave 10+ spawns a second Boss Golem or elite escort!
        this.enemiesToSpawn.push('BOSS_GOLEM');
      }
      const minionCount = Math.min(10, 3 + Math.floor(waveNum * 0.8));
      for (let i = 0; i < minionCount; i++) {
        if (i % 3 === 0 && waveNum >= 5) {
          this.enemiesToSpawn.push('BERSERKER');
        } else if (i % 2 === 0) {
          this.enemiesToSpawn.push('SKELETON');
        } else {
          this.enemiesToSpawn.push('SLIME');
        }
      }
      this.addFloatingText(
        ARENA_WIDTH / 2,
        140,
        `BOSS DALGASI!`,
        '#ef4444',
        2.4,
        true
      );
      audio.playBossRoar();
      this.cameraTrauma = 0.8;
      return;
    }

    // Progressive wave scaling - gets significantly harder each wave!
    const slimeCount = 3 + Math.floor(waveNum * 2.3);
    const skeletonCount = Math.max(0, Math.floor((waveNum - 1) * 1.8));
    const berserkerCount = Math.max(0, Math.floor((waveNum - 2) * 1.5));
    const mageCount = Math.max(0, Math.floor((waveNum - 3) * 1.2));

    for (let i = 0; i < slimeCount; i++) this.enemiesToSpawn.push('SLIME');
    for (let i = 0; i < skeletonCount; i++) this.enemiesToSpawn.push('SKELETON');
    for (let i = 0; i < berserkerCount; i++) this.enemiesToSpawn.push('BERSERKER');
    for (let i = 0; i < mageCount; i++) this.enemiesToSpawn.push('MAGE');

    // Shuffle spawn queue
    this.enemiesToSpawn.sort(() => Math.random() - 0.5);

    this.addFloatingText(
      ARENA_WIDTH / 2,
      130,
      `DALGA ${waveNum}`,
      this.currentTheme.bannerColor,
      2.0,
      true
    );
    audio.playLevelUp();
  }

  private spawnNextEnemy() {
    if (this.enemiesToSpawn.length === 0) {
      this.waveSpawning = false;
      return;
    }

    const type = this.enemiesToSpawn.pop()!;
    // Random perimeter spawn away from player
    let sx = 0;
    let sy = 0;
    let attempts = 0;
    do {
      sx = WALL_THICKNESS + 40 + Math.random() * (ARENA_WIDTH - WALL_THICKNESS * 2 - 80);
      sy = WALL_THICKNESS + 40 + Math.random() * (ARENA_HEIGHT - WALL_THICKNESS * 2 - 80);
      attempts++;
    } while (attempts < 10 && Math.hypot(sx - this.player.x, sy - this.player.y) < 140);

    const enemy = this.createEnemy(type, sx, sy);
    this.enemies.push(enemy);

    // Spawn puff particles
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        size: 3,
        color: '#94a3b8',
        alpha: 0.8,
        life: 0,
        maxLife: 0.35,
      });
    }
  }

  private createEnemy(type: EnemyType, x: number, y: number): Enemy {
    const id = 'enemy_' + Math.random().toString(36).substring(2, 9);
    const w = Math.max(1, this.player.wave);
    // Progressive stat multipliers so higher waves get seriously challenging
    const hpScale = 1 + (w - 1) * 0.22 + Math.max(0, w - 5) * 0.16;
    const spdScale = 1 + Math.min(0.65, (w - 1) * 0.055);
    const cdScale = Math.max(0.55, 1 - (w - 1) * 0.045);
    const dmgBonus = w >= 7 ? 1 : 0;

    switch (type) {
      case 'SLIME': {
        const hp = Math.round(40 * hpScale);
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 22,
          height: 18,
          hp,
          maxHp: hp,
          speed: Math.round(65 * spdScale),
          damage: 1 + dmgBonus,
          facing: 'left',
          state: 'chase',
          stateTimer: 0,
          telegraphTimer: 0,
          telegraphMax: 0.4,
          targetX: 0,
          targetY: 0,
          attackCooldown: 1.2 * cdScale,
          flashTimer: 0,
          scaleX: 1,
          scaleY: 1,
          animFrame: 0,
          animTimer: 0,
        };
      }
      case 'MINI_SLIME': {
        const hp = Math.round(15 * hpScale);
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 14,
          height: 12,
          hp,
          maxHp: hp,
          speed: Math.round(95 * spdScale),
          damage: 1,
          facing: 'left',
          state: 'chase',
          stateTimer: 0,
          telegraphTimer: 0,
          telegraphMax: 0.3,
          targetX: 0,
          targetY: 0,
          attackCooldown: 0.8 * cdScale,
          flashTimer: 0,
          scaleX: 1,
          scaleY: 1,
          animFrame: 0,
          animTimer: 0,
        };
      }
      case 'SKELETON': {
        const hp = Math.round(52 * hpScale);
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 20,
          height: 26,
          hp,
          maxHp: hp,
          speed: Math.round(76 * spdScale),
          damage: 1 + dmgBonus,
          facing: 'left',
          state: 'chase',
          stateTimer: 0,
          telegraphTimer: 0,
          telegraphMax: Math.max(0.42, 0.65 * cdScale),
          targetX: 0,
          targetY: 0,
          attackCooldown: 2.1 * cdScale,
          flashTimer: 0,
          scaleX: 1,
          scaleY: 1,
          animFrame: 0,
          animTimer: 0,
        };
      }
      case 'BERSERKER': {
        const hp = Math.round(88 * hpScale);
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 24,
          height: 28,
          hp,
          maxHp: hp,
          speed: Math.round(92 * spdScale),
          damage: 2 + dmgBonus,
          facing: 'left',
          state: 'chase',
          stateTimer: 0,
          telegraphTimer: 0,
          telegraphMax: Math.max(0.38, 0.55 * cdScale),
          targetX: 0,
          targetY: 0,
          attackCooldown: 1.7 * cdScale,
          flashTimer: 0,
          scaleX: 1,
          scaleY: 1,
          animFrame: 0,
          animTimer: 0,
        };
      }
      case 'MAGE': {
        const hp = Math.round(64 * hpScale);
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 22,
          height: 28,
          hp,
          maxHp: hp,
          speed: Math.round(58 * spdScale),
          damage: 1 + dmgBonus,
          facing: 'left',
          state: 'chase',
          stateTimer: 0,
          telegraphTimer: 0,
          telegraphMax: Math.max(0.5, 0.8 * cdScale),
          targetX: 0,
          targetY: 0,
          attackCooldown: 2.8 * cdScale,
          teleportCooldown: 3.5,
          flashTimer: 0,
          scaleX: 1,
          scaleY: 1,
          animFrame: 0,
          animTimer: 0,
        };
      }
      case 'BOSS_GOLEM': {
        const bossHp = Math.round(450 + w * 95 + Math.max(0, w - 5) * 60);
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 48,
          height: 52,
          hp: bossHp,
          maxHp: bossHp,
          speed: Math.min(85, 56 + w * 2),
          damage: 2 + dmgBonus,
          facing: 'left',
          state: 'chase',
          stateTimer: 0,
          telegraphTimer: 0,
          telegraphMax: 0.75,
          targetX: 0,
          targetY: 0,
          attackCooldown: 1.2,
          flashTimer: 0,
          scaleX: 1,
          scaleY: 1,
          animFrame: 0,
          animTimer: 0,
          isBoss: true,
          bossPhase: 1,
        };
      }
      default: {
        const hp = Math.round(40 * hpScale);
        return {
          id,
          type: 'SLIME',
          x,
          y,
          vx: 0,
          vy: 0,
          width: 22,
          height: 18,
          hp,
          maxHp: hp,
          speed: Math.round(65 * spdScale),
          damage: 1 + dmgBonus,
          facing: 'left',
          state: 'chase',
          stateTimer: 0,
          telegraphTimer: 0,
          telegraphMax: 0.4,
          targetX: 0,
          targetY: 0,
          attackCooldown: 1.2 * cdScale,
          flashTimer: 0,
          scaleX: 1,
          scaleY: 1,
          animFrame: 0,
          animTimer: 0,
        };
      }
    }
  }

  // --- INPUT HANDLING ---
  public onKeyDown(key: string) {
    audio.unlockAudio();
    const k = key.toLowerCase();
    this.keysHeld.add(k);
    this.keysJustPressed.add(k);

    if (k === ' ' || k === 'j') {
      this.bufferAction('attack');
    } else if (k === 'shift' || k === 'k') {
      this.bufferAction('dash');
    } else if (k === 'q' || k === 'e' || k === 'l') {
      this.bufferAction('special');
    } else if (k === 'escape' || k === 'p') {
      this.pauseGame();
    } else if (k === 'enter' && (this.state === 'TITLE' || this.state === 'GAMEOVER')) {
      this.startGame();
    }
  }

  public onKeyUp(key: string) {
    const k = key.toLowerCase();
    this.keysHeld.delete(k);
  }

  public onBlur() {
    this.keysHeld.clear();
    this.keysJustPressed.clear();
    this.touchMoveVector = { x: 0, y: 0 };
  }

  public setTouchDirection(dx: number, dy: number) {
    this.touchMoveVector = { x: dx, y: dy };
  }

  public bufferAction(action: 'attack' | 'dash' | 'special') {
    this.bufferedAction = action;
    this.bufferTimer = 0.22; // 220ms input buffer
  }

  // --- UPGRADE CHOICE ---
  private triggerUpgradeSelection() {
    // Cap upgrades to the first 5 waves (max 5 unique upgrades) and never repeat max_heart endlessly
    const MAX_UPGRADES = 5;
    const pool = ALL_UPGRADES.filter(u => !this.player.upgrades.includes(u.id));

    if (this.player.wave > MAX_UPGRADES || this.player.upgrades.length >= MAX_UPGRADES || pool.length === 0) {
      this.startWave(this.player.wave + 1);
      return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    this.availableUpgrades = shuffled.slice(0, 3);
    this.state = 'UPGRADE';
    this.onStateChange?.(this.state);
    this.onUpgradesReady?.(this.availableUpgrades);
    audio.playLevelUp();
  }

  public selectUpgrade(upgradeId: string) {
    const up = ALL_UPGRADES.find(u => u.id === upgradeId);
    if (!up) return;

    this.player.upgrades.push(up.id);

    switch (up.id) {
      case 'flame_blade':
        this.player.hasFireBlade = true;
        this.player.attackDamage = Math.round(this.player.attackDamage * 1.35);
        break;
      case 'swift_boots':
        this.player.speed = Math.round(this.player.speed * 1.25);
        this.player.dashCooldown = 0.45;
        break;
      case 'max_heart':
        this.player.maxHp += 2;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 3);
        this.onPlayerHpChange?.(this.player.hp, this.player.maxHp);
        break;
      case 'chain_lightning':
        this.player.hasChainLightning = true;
        break;
      case 'vampire':
        this.player.hasVampire = true;
        break;
      case 'dash_stun':
        this.player.dashStuns = true;
        break;
      case 'gem_magnet':
        this.player.hasMagnet = true;
        break;
      case 'whirlwind_aura':
        this.player.hasWhirlwindAura = true;
        break;
    }

    this.state = 'PLAYING';
    this.onStateChange?.(this.state);
    this.startWave(this.player.wave + 1);
  }

  // --- MAIN LOOP ---
  public startLoop() {
    this.lastTime = performance.now();
    const frame = (currentTime: number) => {
      const rawDt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05); // clamp delta time for stability

      this.update(dt);
      this.animId = requestAnimationFrame(frame);
    };
    this.animId = requestAnimationFrame(frame);
  }

  public stopLoop() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private update(dt: number) {
    // Camera decay
    if (this.cameraTrauma > 0) {
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 1.5);
      const shakeAmt = this.cameraTrauma * this.cameraTrauma * 14;
      this.cameraX = (Math.random() - 0.5) * shakeAmt;
      this.cameraY = (Math.random() - 0.5) * shakeAmt;
    } else {
      this.cameraX = 0;
      this.cameraY = 0;
    }

    // Dynamic Mobile Camera (Smooth player tracking + arena boundary clamping)
    let targetCamX = ARENA_WIDTH / 2;
    let targetCamY = ARENA_HEIGHT / 2;
    let targetZ = 1.38;

    if (this.state === 'PLAYING' || this.state === 'UPGRADE') {
      const leadX = this.player.facing === 'right' ? 24 : -24;
      targetCamX = this.player.x + leadX;
      targetCamY = this.player.y;

      if (this.player.isDashing) {
        targetZ = 1.30;
      } else if (this.enemies.some(e => e.isBoss)) {
        targetZ = 1.25;
      } else {
        targetZ = 1.38;
      }
    } else if (this.state === 'TITLE') {
      targetCamX = ARENA_WIDTH / 2;
      targetCamY = ARENA_HEIGHT / 2;
      targetZ = 1.05;
    } else if (this.state === 'GAMEOVER' || this.state === 'VICTORY') {
      targetCamX = this.player.x;
      targetCamY = this.player.y;
      targetZ = 1.45;
    }

    this.targetZoom = targetZ;
    this.cameraZoom += (this.targetZoom - this.cameraZoom) * Math.min(1.0, dt * 5.0);

    const halfViewW = (ARENA_WIDTH / 2) / this.cameraZoom;
    const halfViewH = (ARENA_HEIGHT / 2) / this.cameraZoom;

    const minX = halfViewW;
    const maxX = ARENA_WIDTH - halfViewW;
    const minY = halfViewH;
    const maxY = ARENA_HEIGHT - halfViewH;

    const clampedX = minX < maxX ? Math.max(minX, Math.min(maxX, targetCamX)) : ARENA_WIDTH / 2;
    const clampedY = minY < maxY ? Math.max(minY, Math.min(maxY, targetCamY)) : ARENA_HEIGHT / 2;

    const followSpeed = this.state === 'PLAYING' ? 7.0 : 3.0;
    this.cameraFocusX += (clampedX - this.cameraFocusX) * Math.min(1.0, dt * followSpeed);
    this.cameraFocusY += (clampedY - this.cameraFocusY) * Math.min(1.0, dt * followSpeed);

    // Torches flicker & ambient embers
    for (const torch of this.torches) {
      torch.flicker = Math.sin(performance.now() * 0.008 + torch.x) * 0.2 + (Math.random() - 0.5) * 0.1;
      if (Math.random() < 0.04) {
        this.particles.push({
          x: torch.x + (Math.random() - 0.5) * 4,
          y: torch.y - 6,
          vx: (Math.random() - 0.5) * 14,
          vy: -18 - Math.random() * 22,
          size: Math.random() < 0.6 ? 2 : 1.5,
          color: Math.random() < 0.65 ? '#f59e0b' : '#fef08a',
          alpha: 0.85,
          life: 0,
          maxLife: 0.55 + Math.random() * 0.35,
        });
      }
    }

    if (this.state === 'TITLE') {
      // Subtle title background action (wandering knight, flickering fire)
      this.player.walkTimer += dt;
      if (this.player.walkTimer > 0.15) {
        this.player.walkFrame = (this.player.walkFrame + 1) % 4;
        this.player.walkTimer = 0;
      }
      return;
    }

    if (this.state !== 'PLAYING') {
      return;
    }

    // Hitstop freeze frame handling
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Buffer timer
    if (this.bufferTimer > 0) {
      this.bufferTimer -= dt;
      if (this.bufferTimer <= 0) {
        this.bufferedAction = null;
      }
    }

    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.themeAnimTimer += dt;
    this.updateAmbientThemeVfx(dt);
    this.checkWaveProgress(dt);

    // Sync HUD state (~10 FPS to preserve mobile CPU/GPU budget)
    this.hudUpdateTimer += dt;
    if (this.hudUpdateTimer >= 0.1) {
      this.hudUpdateTimer = 0;
      this.onHudUpdate?.(this.getHudState());
    }

    // Clear edge-triggered keys at end of tick
    this.keysJustPressed.clear();
  }

  // --- PLAYER UPDATE & COMBAT ---
  private updatePlayer(dt: number) {
    const p = this.player;

    // Flash & Invulnerability
    if (p.flashTimer > 0) p.flashTimer -= dt;
    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;

    // Combo timer
    if (p.combo > 0) {
      p.comboTimer -= dt;
      if (p.comboTimer <= 0) {
        p.combo = 0;
        this.onScoreChange?.(p.score, p.coins, p.combo, p.wave);
      }
    }

    // Stamina regeneration
    if (p.stamina < p.maxStamina) {
      p.stamina = Math.min(p.maxStamina, p.stamina + dt * 38);
    }

    // Cooldowns
    if (p.dashCooldownTimer > 0) p.dashCooldownTimer -= dt;
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.specialTimer > 0) p.specialTimer -= dt;

    // Process buffered inputs
    if (this.bufferedAction === 'attack' && p.attackCooldown <= 0 && !p.isDashing) {
      this.executeAttack();
      this.bufferedAction = null;
    } else if (this.bufferedAction === 'dash' && p.dashCooldownTimer <= 0 && p.stamina >= 25) {
      this.executeDash();
      this.bufferedAction = null;
    } else if (this.bufferedAction === 'special' && p.specialTimer <= 0) {
      this.executeSpecial();
      this.bufferedAction = null;
    }

    // Dashing State
    if (p.isDashing) {
      p.dashTimer -= dt;
      p.x += p.dashVx * dt;
      p.y += p.dashVy * dt;

      // Spawn juicy spectral afterimage ghost silhouettes
      this.ghostSpawnTimer += dt;
      if (this.ghostSpawnTimer >= 0.038) {
        this.ghostSpawnTimer = 0;
        this.playerGhostTrails.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          frame: p.walkFrame,
          alpha: 0.65,
          heroClass: p.heroClass,
        });
      }

      // Spawn dash spark particles
      this.particles.push({
        x: p.x + (Math.random() - 0.5) * 8,
        y: p.y + (Math.random() - 0.5) * 8,
        vx: 0,
        vy: 0,
        size: 3.5,
        color: '#38bdf8',
        alpha: 0.6,
        life: 0,
        maxLife: 0.22,
      });

      // Shadow Dash perk: damage and stagger enemies dashed through
      if (p.dashStuns) {
        for (const enemy of this.enemies) {
          if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < 32) {
            this.damageEnemy(enemy, 20, true, 0.4);
          }
        }
      }

      if (p.dashTimer <= 0) {
        p.isDashing = false;
      }
    } else {
      // Normal Movement via Keyboard or Touch
      let mx = 0;
      let my = 0;

      if (this.keysHeld.has('w') || this.keysHeld.has('arrowup')) my -= 1;
      if (this.keysHeld.has('s') || this.keysHeld.has('arrowdown')) my += 1;
      if (this.keysHeld.has('a') || this.keysHeld.has('arrowleft')) mx -= 1;
      if (this.keysHeld.has('d') || this.keysHeld.has('arrowright')) mx += 1;

      // Merge touch joystick
      if (this.touchMoveVector.x !== 0 || this.touchMoveVector.y !== 0) {
        mx = this.touchMoveVector.x;
        my = this.touchMoveVector.y;
      }

      const len = Math.hypot(mx, my);
      if (len > 0.05) {
        const normX = mx / (len > 1 ? len : 1);
        const normY = my / (len > 1 ? len : 1);
        p.vx = normX * p.speed;
        p.vy = normY * p.speed;
        p.facing = normX >= 0 ? 'right' : 'left';

        // Walk animation
        p.walkTimer += dt;
        if (p.walkTimer > 0.12) {
          p.walkFrame = (p.walkFrame + 1) % 4;
          p.walkTimer = 0;
        }

        // Footstep dust particles on stone floor
        this.footstepTimer += dt;
        if (this.footstepTimer >= 0.16) {
          this.footstepTimer = 0;
          this.particles.push({
            x: p.x + (Math.random() - 0.5) * 6,
            y: p.y + p.height / 2 - 2,
            vx: -p.vx * 0.16 + (Math.random() - 0.5) * 6,
            vy: -6 - Math.random() * 8,
            size: Math.random() < 0.5 ? 2.5 : 2,
            color: '#64748b',
            alpha: 0.55,
            life: 0,
            maxLife: 0.22,
          });
        }
      } else {
        p.vx = 0;
        p.vy = 0;
        p.walkFrame = 0;
        this.footstepTimer = 0;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Update ghost trail fading
    for (let i = this.playerGhostTrails.length - 1; i >= 0; i--) {
      this.playerGhostTrails[i].alpha -= dt * 3.6;
      if (this.playerGhostTrails[i].alpha <= 0) {
        this.playerGhostTrails.splice(i, 1);
      }
    }

    // Clamp Player inside Arena walls
    const minX = WALL_THICKNESS + p.width / 2;
    const maxX = ARENA_WIDTH - WALL_THICKNESS - p.width / 2;
    const minY = WALL_THICKNESS + p.height / 2 + 10;
    const maxY = ARENA_HEIGHT - WALL_THICKNESS - p.height / 2;

    p.x = Math.max(minX, Math.min(maxX, p.x));
    p.y = Math.max(minY, Math.min(maxY, p.y));

    // Attack Slash animation
    if (p.isAttacking) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) {
        p.isAttacking = false;
      }
    }
  }

  private executeAttack() {
    const p = this.player;
    p.isAttacking = true;
    p.attackTimer = 0.18;
    p.attackCooldown = 0.28;

    // Calculate attack angle toward nearest enemy or facing direction
    let targetAngle = p.facing === 'right' ? 0 : Math.PI;
    let closestEnemy: Enemy | null = null;
    let closestDist = 95;

    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy) {
      targetAngle = Math.atan2(closestEnemy.y - p.y, closestEnemy.x - p.x);
      p.facing = Math.cos(targetAngle) >= 0 ? 'right' : 'left';
    }

    p.attackAngle = targetAngle;
    audio.playSlash(p.heroClass);

    // Visual Slash Arc Particles (Blade Trail Sparkles)
    const arcSparks = p.hasFireBlade ? 12 : 8;
    for (let i = 0; i < arcSparks; i++) {
      const spread = (i / (arcSparks - 1) - 0.5) * Math.PI * 0.75;
      const sparkAng = targetAngle + spread;
      const sparkDist = p.attackRange * (0.65 + Math.random() * 0.35);
      const sparkSpd = 40 + Math.random() * 60;
      this.particles.push({
        x: p.x + Math.cos(sparkAng) * sparkDist,
        y: p.y + Math.sin(sparkAng) * sparkDist,
        vx: Math.cos(sparkAng) * sparkSpd + (Math.random() - 0.5) * 25,
        vy: Math.sin(sparkAng) * sparkSpd + (Math.random() - 0.5) * 25,
        size: Math.random() < 0.5 ? 2.5 : 3.5,
        color: p.hasFireBlade ? (i % 2 === 0 ? '#f97316' : '#fef08a') : (i % 2 === 0 ? '#bae6fd' : '#38bdf8'),
        alpha: 0.95,
        life: 0,
        maxLife: 0.18 + Math.random() * 0.12,
      });
    }

    // Damage enemies in attack arc
    const slashRange = p.attackRange;
    const slashArc = Math.PI * 0.75;
    let hitCount = 0;

    for (const enemy of this.enemies) {
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= slashRange + enemy.width / 2) {
        const enemyAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(enemyAngle - targetAngle);
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        angleDiff = Math.abs(angleDiff);

        if (angleDiff <= slashArc / 2) {
          const critChance = p.heroClass === 'rogue' ? 0.45 : 0.20;
          const isCrit = Math.random() < critChance;
          const damage = isCrit ? Math.round(p.attackDamage * 1.7) : p.attackDamage;
          this.damageEnemy(enemy, damage, isCrit);
          hitCount++;

          // Pushback: Heavy Boss has 90% knockback resistance!
          const pushForce = enemy.isBoss ? 18 : 160;
          const pushAngle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
          enemy.vx += Math.cos(pushAngle) * pushForce;
          enemy.vy += Math.sin(pushAngle) * pushForce;
        }
      }
    }

    // Mage class casts magical piercing energy bolts
    if (p.heroClass === 'mage') {
      this.projectiles.push({
        id: 'player_magic_' + Math.random(),
        x: p.x,
        y: p.y,
        vx: Math.cos(targetAngle) * 350,
        vy: Math.sin(targetAngle) * 350,
        radius: 5,
        damage: Math.round(p.attackDamage * 1.2),
        color: p.hasFireBlade ? '#f97316' : '#38bdf8',
        life: 0,
        maxLife: 1.2,
        fromPlayer: true,
        isPiercing: true,
        type: 'magic_orb',
      });
    }

    // Break pots in range
    for (const prop of this.props) {
      if (prop.hp > 0 && Math.hypot(prop.x - p.x, prop.y - p.y) < slashRange + 12) {
        this.breakProp(prop);
      }
    }

    if (hitCount > 0) {
      audio.playHit(false);
      this.triggerHaptic(hitCount > 1 ? 35 : 20);
      this.cameraTrauma = Math.min(1.0, this.cameraTrauma + 0.28);
      this.hitstopTimer = 0.045; // 45ms crisp impact stop

      // Combo handling
      p.combo++;
      p.comboTimer = 2.4;
      p.score += hitCount * 40 * Math.min(p.combo, 5);

      // Rewarding Arcade Combo Milestones
      if (p.combo === 5) {
        this.addFloatingText(p.x, p.y - 32, '5x COMBO!', '#fbbf24', 1.35, true);
        p.score += 250;
      } else if (p.combo === 10) {
        this.addFloatingText(p.x, p.y - 34, '10x SUPER COMBO!', '#f97316', 1.55, true);
        p.score += 750;
        this.cameraTrauma = Math.min(1.0, this.cameraTrauma + 0.35);
      } else if (p.combo === 20) {
        this.addFloatingText(p.x, p.y - 36, '20x UNSTOPPABLE!', '#a855f7', 1.85, true);
        p.score += 2000;
        this.cameraTrauma = Math.min(1.0, this.cameraTrauma + 0.5);
      }

      // Vampire upgrade perk: Heal 1 HP every 7 combo hits
      if (p.hasVampire && p.combo % 7 === 0 && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + 1);
        this.addFloatingText(p.x, p.y - 20, '+1 HP', '#10b981', 1.2, true);
        this.onPlayerHpChange?.(p.hp, p.maxHp);
      }

      // Chain lightning upgrade perk
      if (p.hasChainLightning && closestEnemy) {
        this.triggerChainLightning(closestEnemy);
      }

      this.onScoreChange?.(p.score, p.coins, p.combo, p.wave);
    }
  }

  private executeDash() {
    const p = this.player;
    p.stamina -= 30;
    p.isDashing = true;
    p.dashTimer = p.dashDuration;
    p.dashCooldownTimer = p.dashCooldown;
    p.invulnerableTimer = p.dashDuration + 0.08; // i-frames!

    let dx = p.vx;
    let dy = p.vy;
    if (Math.hypot(dx, dy) === 0) {
      dx = p.facing === 'right' ? 1 : -1;
      dy = 0;
    }
    const len = Math.hypot(dx, dy);
    p.dashVx = (dx / len) * 440;
    p.dashVy = (dy / len) * 440;

    audio.playDash(p.heroClass);
    this.triggerHaptic(15);
  }

  private executeSpecial() {
    const p = this.player;
    p.specialTimer = p.specialCooldown;
    audio.playSpecial(p.heroClass);
    this.triggerHaptic(50);
    this.cameraTrauma = 0.7;

    this.addFloatingText(p.x, p.y - 24, 'WHIRLWIND!', '#38bdf8', 1.5, true);

    // 360 degree blade storm or fire vortex
    const radius = p.hasWhirlwindAura ? 160 : 110;
    const damage = Math.round(p.attackDamage * 2.2);

    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist <= radius) {
        this.damageEnemy(enemy, damage, true, 0.5);
      }
    }

    // Break all pots in area
    for (const prop of this.props) {
      if (prop.hp > 0 && Math.hypot(prop.x - p.x, prop.y - p.y) <= radius) {
        this.breakProp(prop);
      }
    }

    // Dual-ring vortex particle burst
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2;
      const spd = 140 + (i % 2 === 0 ? 90 : 40) + Math.random() * 40;
      this.particles.push({
        x: p.x + Math.cos(ang) * 12,
        y: p.y + Math.sin(ang) * 12,
        vx: Math.cos(ang + 0.3) * spd,
        vy: Math.sin(ang + 0.3) * spd,
        size: i % 3 === 0 ? 4 : 2.5,
        color: p.hasFireBlade
          ? (i % 2 === 0 ? '#f97316' : '#fef08a')
          : (i % 2 === 0 ? '#67e8f9' : '#e0f2fe'),
        alpha: 1,
        life: 0,
        maxLife: 0.42 + Math.random() * 0.15,
      });
    }
  }

  private triggerChainLightning(startEnemy: Enemy) {
    const targets = this.enemies
      .filter(e => e.id !== startEnemy.id && Math.hypot(e.x - startEnemy.x, e.y - startEnemy.y) < 140)
      .slice(0, 3);

    for (const t of targets) {
      this.damageEnemy(t, 22, false);
      // Lightning line particles
      for (let i = 0; i < 5; i++) {
        const lx = startEnemy.x + (t.x - startEnemy.x) * (i / 5);
        const ly = startEnemy.y + (t.y - startEnemy.y) * (i / 5);
        this.particles.push({
          x: lx + (Math.random() - 0.5) * 8,
          y: ly + (Math.random() - 0.5) * 8,
          vx: 0,
          vy: 0,
          size: 3,
          color: '#fef08a',
          alpha: 1,
          life: 0,
          maxLife: 0.18,
        });
      }
    }
  }

  // --- ENEMY LOGIC & TELEGRAPHS ---
  private updateEnemies(dt: number) {
    const p = this.player;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Flash & knockback friction
      if (e.flashTimer > 0) e.flashTimer -= dt;
      e.vx *= 0.88;
      e.vy *= 0.88;
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Squash and stretch return to 1
      e.scaleX += (1 - e.scaleX) * 0.15;
      e.scaleY += (1 - e.scaleY) * 0.15;

      // Facing
      e.facing = p.x >= e.x ? 'right' : 'left';

      // Cooldown timer
      if (e.attackCooldown > 0) e.attackCooldown -= dt;

      // Recover from temporary stun ('hurt') state for non-boss enemies
      if (e.state === 'hurt') {
        if (e.isBoss) {
          e.state = 'chase';
        } else {
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'chase';
          }
        }
      }

      // AI State Machine by Enemy Type
      if (e.state !== 'hurt') {
        switch (e.type) {
          case 'SLIME':
          case 'MINI_SLIME':
            this.updateSlimeAI(e, dt);
            break;
          case 'SKELETON':
            this.updateSkeletonAI(e, dt);
            break;
          case 'BERSERKER':
            this.updateBerserkerAI(e, dt);
            break;
          case 'MAGE':
            this.updateMageAI(e, dt);
            break;
          case 'BOSS_GOLEM':
            this.updateBossAI(e, dt);
            break;
        }
      }

      // Check collision with Player
      if (p.invulnerableTimer <= 0 && !p.isDashing) {
        const hitDist = (p.width + e.width) / 2;
        if (Math.hypot(p.x - e.x, p.y - e.y) < hitDist) {
          this.hurtPlayer(e.damage);
        }
      }

      // Keep enemy inside arena
      const minX = WALL_THICKNESS + e.width / 2;
      const maxX = ARENA_WIDTH - WALL_THICKNESS - e.width / 2;
      const minY = WALL_THICKNESS + e.height / 2 + 10;
      const maxY = ARENA_HEIGHT - WALL_THICKNESS - e.height / 2;
      e.x = Math.max(minX, Math.min(maxX, e.x));
      e.y = Math.max(minY, Math.min(maxY, e.y));
    }
  }

  private updateSlimeAI(e: Enemy, dt: number) {
    const p = this.player;
    e.stateTimer += dt;

    // Slime rhythmic hops: Idle squash -> Jump stretch -> Land
    const hopInterval = e.type === 'MINI_SLIME' ? 0.7 : 1.1;
    const progress = (e.stateTimer % hopInterval) / hopInterval;

    if (progress < 0.25) {
      // Anticipation squash
      e.scaleX = 1.35;
      e.scaleY = 0.65;
    } else if (progress < 0.75) {
      // Airborne leap stretch
      e.scaleX = 0.75;
      e.scaleY = 1.35;
      const angle = Math.atan2(p.y - e.y, p.x - e.x);
      e.x += Math.cos(angle) * e.speed * dt * 1.6;
      e.y += Math.sin(angle) * e.speed * dt * 1.6;
    } else {
      // Landing squash
      e.scaleX = 1.25;
      e.scaleY = 0.8;
    }
  }

  private updateSkeletonAI(e: Enemy, dt: number) {
    const p = this.player;
    const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);

    if (e.state === 'chase') {
      // Move to comfortable shooting distance (~180px)
      if (distToPlayer > 220) {
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;
      } else if (distToPlayer < 110) {
        // Back away if player gets too close
        const angle = Math.atan2(e.y - p.y, e.x - p.x);
        e.x += Math.cos(angle) * e.speed * dt * 0.9;
        e.y += Math.sin(angle) * e.speed * dt * 0.9;
      }

      if (e.attackCooldown <= 0 && distToPlayer <= 260) {
        // Enter windup with red telegraph aim line
        e.state = 'windup';
        e.telegraphTimer = 0;
        e.targetX = p.x;
        e.targetY = p.y;
        audio.playTelegraph();
      }
    } else if (e.state === 'windup') {
      e.telegraphTimer += dt;
      // Track player slightly during early aim, locks in last 0.2s
      if (e.telegraphTimer < e.telegraphMax - 0.2) {
        e.targetX = p.x;
        e.targetY = p.y;
      }

      if (e.telegraphTimer >= e.telegraphMax) {
        // Fire Bone Arrow projectile
        const aimAngle = Math.atan2(e.targetY - e.y, e.targetX - e.x);
        const arrowSpd = 260;
        this.projectiles.push({
          id: 'arrow_' + Math.random(),
          x: e.x,
          y: e.y,
          vx: Math.cos(aimAngle) * arrowSpd,
          vy: Math.sin(aimAngle) * arrowSpd,
          radius: 4,
          damage: 1,
          color: '#e2e8f0',
          life: 0,
          maxLife: 2.5,
          fromPlayer: false,
          type: 'arrow',
        });
        e.state = 'chase';
        e.attackCooldown = 2.4;
      }
    }
  }

  private updateBerserkerAI(e: Enemy, dt: number) {
    const p = this.player;
    const dist = Math.hypot(p.x - e.x, p.y - e.y);

    if (e.state === 'chase') {
      const angle = Math.atan2(p.y - e.y, p.x - e.x);
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;

      if (e.attackCooldown <= 0 && dist < 170) {
        // Windup telegraph: exclamation mark & roar
        e.state = 'windup';
        e.telegraphTimer = 0;
        e.targetX = p.x;
        e.targetY = p.y;
        audio.playTelegraph();
      }
    } else if (e.state === 'windup') {
      e.telegraphTimer += dt;
      // Vibrate shake
      e.scaleX = 1 + (Math.random() - 0.5) * 0.3;
      e.scaleY = 1 + (Math.random() - 0.5) * 0.3;

      if (e.telegraphTimer >= e.telegraphMax) {
        // Charge attack!
        e.state = 'attack';
        e.stateTimer = 0.45;
        const chargeAngle = Math.atan2(e.targetY - e.y, e.targetX - e.x);
        e.vx = Math.cos(chargeAngle) * 310;
        e.vy = Math.sin(chargeAngle) * 310;
      }
    } else if (e.state === 'attack') {
      e.stateTimer -= dt;
      // Spawn dust trail
      this.particles.push({
        x: e.x,
        y: e.y + 10,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        size: 3,
        color: '#dc2626',
        alpha: 0.6,
        life: 0,
        maxLife: 0.25,
      });

      if (e.stateTimer <= 0) {
        e.state = 'chase';
        e.attackCooldown = 1.8;
      }
    }
  }

  private updateMageAI(e: Enemy, dt: number) {
    const p = this.player;
    const dist = Math.hypot(p.x - e.x, p.y - e.y);

    if (e.teleportCooldown !== undefined && e.teleportCooldown > 0) {
      e.teleportCooldown -= dt;
    }

    if (e.state === 'cooldown') {
      // Dazed / recovery window after teleporting: completely vulnerable!
      e.stateTimer -= dt;
      // Dazed purple sparkle effect
      if (Math.random() < 0.3) {
        this.particles.push({
          x: e.x + (Math.random() - 0.5) * 16,
          y: e.y - 12 + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 20,
          vy: -20 - Math.random() * 20,
          size: 2.5,
          color: '#e879f9',
          alpha: 0.9,
          life: 0,
          maxLife: 0.3,
        });
      }
      if (e.stateTimer <= 0) {
        e.state = 'chase';
      }
      return;
    }

    if (e.state === 'chase') {
      // Smooth hovering drift: keep comfortable tactical casting distance (150-230px)
      if (dist > 230) {
        // Slowly float closer towards player
        const ang = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(ang) * e.speed * dt * 0.75;
        e.y += Math.sin(ang) * e.speed * dt * 0.75;
      } else if (dist < 100 && (e.teleportCooldown || 0) > 0) {
        // Slowly float backwards away if teleport is on cooldown (player can catch up with dash/sprint!)
        const ang = Math.atan2(e.y - p.y, e.x - p.x);
        e.x += Math.cos(ang) * e.speed * dt * 0.8;
        e.y += Math.sin(ang) * e.speed * dt * 0.8;
      }

      // Tactical Blink: ONLY if player gets within point-blank melee strike range (dist < 58) AND cooldown is ready!
      if (dist < 58 && (!e.teleportCooldown || e.teleportCooldown <= 0)) {
        // Spawn puff at departure location
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 30 + Math.random() * 80;
          this.particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: 3.5,
            color: '#c084fc',
            alpha: 1,
            life: 0,
            maxLife: 0.35,
          });
        }

        // Tactical blink 150-180px away from player (not across entire universe!)
        const escapeAngle = Math.atan2(e.y - p.y, e.x - p.x) + (Math.random() - 0.5) * 0.8;
        const blinkDist = 150 + Math.random() * 35;
        const targetX = p.x + Math.cos(escapeAngle) * blinkDist;
        const targetY = p.y + Math.sin(escapeAngle) * blinkDist;

        // Keep inside arena boundaries
        e.x = Math.max(WALL_THICKNESS + 40, Math.min(ARENA_WIDTH - WALL_THICKNESS - 40, targetX));
        e.y = Math.max(WALL_THICKNESS + 40, Math.min(ARENA_HEIGHT - WALL_THICKNESS - 40, targetY));

        // Spawn puff at arrival location
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 20 + Math.random() * 60;
          this.particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: 3,
            color: '#a855f7',
            alpha: 1,
            life: 0,
            maxLife: 0.35,
          });
        }

        audio.playDash('mage');

        // Set cooldown and recovery window: 4.8s teleport cooldown, 0.65s dazed recovery!
        e.teleportCooldown = 4.8;
        e.state = 'cooldown';
        e.stateTimer = 0.65;
        return;
      }

      if (e.attackCooldown <= 0) {
        // Cast ground rune on player's current location!
        e.state = 'windup';
        e.telegraphTimer = 0;
        e.targetX = p.x;
        e.targetY = p.y;
        audio.playTelegraph();
      }
    } else if (e.state === 'windup') {
      // DURING CASTING: The mage is channel-focused and CANNOT TELEPORT!
      // If player rushes in and strikes, it deals big damage and interrupts!
      e.telegraphTimer += dt;
      if (e.telegraphTimer >= e.telegraphMax) {
        audio.playHit(true);
        this.cameraTrauma = 0.45;
        const blastDist = Math.hypot(p.x - e.targetX, p.y - e.targetY);
        if (blastDist < 48 && p.invulnerableTimer <= 0 && !p.isDashing) {
          this.hurtPlayer(1);
        }

        for (let i = 0; i < 20; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 60 + Math.random() * 80;
          this.particles.push({
            x: e.targetX,
            y: e.targetY,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: 4,
            color: '#c084fc',
            alpha: 1,
            life: 0,
            maxLife: 0.4,
          });
        }

        e.state = 'chase';
        e.attackCooldown = 3.2;
      }
    }
  }

  private updateBossAI(e: Enemy, dt: number) {
    const p = this.player;
    e.stateTimer += dt;
    const isEnraged = e.hp <= e.maxHp * 0.5;
    const waveSpeedBonus = Math.min(25, Math.max(0, (this.player.wave - 5) * 2.5));
    e.speed = (isEnraged ? 78 : 60) + waveSpeedBonus;

    // Ensure Boss never gets stuck in an invalid state
    if (e.state !== 'chase' && e.state !== 'windup' && e.state !== 'leap') {
      e.state = 'chase';
    }

    const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);

    if (e.state === 'chase') {
      // Direct march toward player
      const angle = Math.atan2(p.y - e.y, p.x - e.x);
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;

      if (e.attackCooldown <= 0) {
        if (distToPlayer <= 115) {
          // Attack 1: Titan Cleave Smash (close range devastation)
          e.state = 'windup';
          e.telegraphTimer = 0;
          e.telegraphMax = isEnraged ? 0.45 : 0.65;
          e.targetX = 1; // 1 = Titan Cleave
          e.targetY = Math.atan2(p.y - e.y, p.x - e.x); // store direction
          audio.playTelegraph();
        } else if (distToPlayer > 180 && Math.random() < 0.55) {
          // Attack 2: Meteor Leap Slam (long range jump attack)
          e.state = 'leap';
          e.telegraphTimer = 0;
          e.telegraphMax = isEnraged ? 0.6 : 0.85;
          e.targetX = p.x;
          e.targetY = p.y;
          audio.playTelegraph();
        } else {
          // Attack 3: Boulder Toss (throws 3 heavy rolling rocks)
          e.state = 'windup';
          e.telegraphTimer = 0;
          e.telegraphMax = isEnraged ? 0.5 : 0.75;
          e.targetX = 2; // 2 = Boulder Toss
          audio.playTelegraph();
        }
      }
    } else if (e.state === 'windup') {
      e.telegraphTimer += dt;
      e.scaleY = 1.35;
      e.scaleX = 0.8;

      if (e.targetX === 1) {
        // Track player slightly during windup
        const aimAngle = Math.atan2(p.y - e.y, p.x - e.x);
        e.targetY = aimAngle;
      }

      if (e.telegraphTimer >= e.telegraphMax) {
        e.scaleY = 0.65;
        e.scaleX = 1.45;
        audio.playHit(true);
        this.cameraTrauma = 0.75;

        if (e.targetX === 1) {
          // Titan Cleave hit check
          const cleaveAngle = e.targetY;
          const cleaveRange = 115;
          const pAngle = Math.atan2(p.y - e.y, p.x - e.x);
          let diff = Math.abs(pAngle - cleaveAngle);
          while (diff > Math.PI) diff -= Math.PI * 2;
          diff = Math.abs(diff);

          if (distToPlayer <= cleaveRange && diff <= Math.PI * 0.45 && p.invulnerableTimer <= 0 && !p.isDashing) {
            this.hurtPlayer(2); // 2 full hearts of damage!
            // Knockback player away hard
            p.vx += Math.cos(cleaveAngle) * 320;
            p.vy += Math.sin(cleaveAngle) * 320;
          }

          // Ground dust & crack particles
          for (let i = 0; i < 16; i++) {
            const ang = cleaveAngle + (Math.random() - 0.5) * 1.2;
            const dist = 30 + Math.random() * 70;
            this.particles.push({
              x: e.x + Math.cos(ang) * dist,
              y: e.y + Math.sin(ang) * dist,
              vx: (Math.random() - 0.5) * 80,
              vy: (Math.random() - 0.5) * 80,
              size: 4,
              color: isEnraged ? '#ea580c' : '#64748b',
              alpha: 0.9,
              life: 0,
              maxLife: 0.4,
            });
          }

          // Also shoot a 5-way shockwave cone forward
          for (let i = -2; i <= 2; i++) {
            const ang = cleaveAngle + (i * Math.PI) / 10;
            this.projectiles.push({
              id: 'boss_cleave_' + Math.random(),
              x: e.x,
              y: e.y,
              vx: Math.cos(ang) * (isEnraged ? 240 : 190),
              vy: Math.sin(ang) * (isEnraged ? 240 : 190),
              radius: 6,
              damage: 1,
              color: isEnraged ? '#f97316' : '#06b6d4',
              life: 0,
              maxLife: 1.8,
              fromPlayer: false,
              type: 'shockwave',
            });
          }
        } else if (e.targetX === 2) {
          // Boulder Toss: 3 heavy rolling boulders
          const baseAngle = Math.atan2(p.y - e.y, p.x - e.x);
          for (let i = -1; i <= 1; i++) {
            const ang = baseAngle + (i * Math.PI) / 7;
            this.projectiles.push({
              id: 'boulder_' + Math.random(),
              x: e.x,
              y: e.y,
              vx: Math.cos(ang) * 170,
              vy: Math.sin(ang) * 170,
              radius: 10,
              damage: 1,
              color: '#64748b',
              life: 0,
              maxLife: 3.0,
              fromPlayer: false,
              type: 'boulder',
            });
          }
        }

        e.state = 'chase';
        e.attackCooldown = isEnraged ? 0.75 : 1.15;
      }
    } else if (e.state === 'leap') {
      e.telegraphTimer += dt;
      // Boss leaps high into the air!
      const progress = e.telegraphTimer / e.telegraphMax;
      e.scaleX = 1 + Math.sin(progress * Math.PI) * 0.7;
      e.scaleY = 1 + Math.sin(progress * Math.PI) * 0.7;

      if (e.telegraphTimer >= e.telegraphMax) {
        // Crash down at target position!
        e.x = e.targetX;
        e.y = e.targetY;
        e.scaleX = 1.6;
        e.scaleY = 0.6;
        this.cameraTrauma = 1.0;
        audio.playHit(true);

        const slamRadius = 85;
        const currentDist = Math.hypot(p.x - e.x, p.y - e.y);
        if (currentDist <= slamRadius && p.invulnerableTimer <= 0 && !p.isDashing) {
          this.hurtPlayer(2);
        }

        // Radial shockwaves spreading outwards
        const wavesCount = isEnraged ? 12 : 8;
        for (let i = 0; i < wavesCount; i++) {
          const ang = (i / wavesCount) * Math.PI * 2;
          this.projectiles.push({
            id: 'leap_shock_' + Math.random(),
            x: e.x,
            y: e.y,
            vx: Math.cos(ang) * 180,
            vy: Math.sin(ang) * 180,
            radius: 6,
            damage: 1,
            color: isEnraged ? '#ef4444' : '#06b6d4',
            life: 0,
            maxLife: 2.0,
            fromPlayer: false,
            type: 'shockwave',
          });
        }

        e.state = 'chase';
        e.attackCooldown = isEnraged ? 0.9 : 1.35;
      }
    }
  }

  // --- DAMAGE & COMBAT RESOLUTION ---
  public damageEnemy(enemy: Enemy, damage: number, isCrit: boolean = false, stunTime: number = 0) {
    enemy.hp -= damage;
    enemy.flashTimer = 0.12;

    this.addFloatingText(
      enemy.x + (Math.random() - 0.5) * 16,
      enemy.y - 14,
      isCrit ? `${damage}!` : `${damage}`,
      isCrit ? '#f59e0b' : '#ffffff',
      isCrit ? 1.4 : 1.0,
      isCrit
    );

    // Directional hit sparks spraying outward from attack angle
    const hitAngle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
    const sparkCount = isCrit ? 10 : 5;
    for (let i = 0; i < sparkCount; i++) {
      const spd = (isCrit ? 130 : 80) + Math.random() * 100;
      const ang = hitAngle + (Math.random() - 0.5) * (Math.PI * 0.6);
      this.particles.push({
        x: enemy.x + (Math.random() - 0.5) * 6,
        y: enemy.y + (Math.random() - 0.5) * 6,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: isCrit ? (i % 2 === 0 ? 3.5 : 2.5) : 2.5,
        color: isCrit ? '#fde047' : this.player.hasFireBlade ? '#ea580c' : '#38bdf8',
        alpha: 1,
        life: 0,
        maxLife: isCrit ? 0.28 : 0.2,
      });
    }

    this.hitstopTimer = Math.max(this.hitstopTimer, isCrit ? 0.045 : 0.025);

    // Mage Spell Interruption: Striking a casting mage interrupts the rune!
    if (enemy.type === 'MAGE' && enemy.state === 'windup') {
      enemy.state = 'hurt';
      enemy.stateTimer = 0.45;
      this.addFloatingText(enemy.x, enemy.y - 26, 'BÜYÜ BOZULDU!', '#e879f9', 1.3, true);
      audio.playHit(true);
    }

    if (stunTime > 0 && !enemy.isBoss) {
      enemy.state = 'hurt';
      enemy.stateTimer = stunTime;
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: Enemy) {
    const p = this.player;
    p.killCount++;
    p.score += (enemy.isBoss ? 1500 : 150) * Math.min(p.combo + 1, 5);

    audio.playHit(true);
    this.cameraTrauma = enemy.isBoss ? 0.9 : 0.35;

    // Slime splitting perk: Large slime splits into 2 mini slimes!
    if (enemy.type === 'SLIME') {
      this.enemies.push(this.createEnemy('MINI_SLIME', enemy.x - 12, enemy.y));
      this.enemies.push(this.createEnemy('MINI_SLIME', enemy.x + 12, enemy.y));
    }

    // Drop loot: Coins, Hearts, Gems
    const coinRoll = Math.random();
    if (enemy.isBoss || coinRoll < 0.65) {
      this.pickups.push({
        id: 'coin_' + Math.random(),
        type: 'coin',
        x: enemy.x + (Math.random() - 0.5) * 16,
        y: enemy.y + (Math.random() - 0.5) * 16,
        value: 10,
        bobTimer: Math.random() * 6,
      });
    }

    // Occasional Heart drop when low on health
    const heartChance = p.hp <= 2 ? 0.45 : 0.15;
    if (enemy.isBoss || Math.random() < heartChance) {
      this.pickups.push({
        id: 'heart_' + Math.random(),
        type: 'heart',
        x: enemy.x,
        y: enemy.y,
        value: 1, // 1 half heart
        bobTimer: Math.random() * 6,
      });
    }

    // Gem drop
    if (enemy.isBoss || Math.random() < 0.35) {
      this.pickups.push({
        id: 'gem_' + Math.random(),
        type: 'gem',
        x: enemy.x + (Math.random() - 0.5) * 10,
        y: enemy.y + (Math.random() - 0.5) * 10,
        value: 50,
        bobTimer: Math.random() * 6,
      });
    }

    // Tailored death burst particles by enemy type
    let burstColors = ['#cbd5e1', '#94a3b8'];
    let particleCount = 14;
    let maxSpeed = 240;

    if (enemy.type === 'SLIME' || enemy.type === 'MINI_SLIME') {
      burstColors = ['#22c55e', '#4ade80', '#15803d'];
      particleCount = enemy.type === 'MINI_SLIME' ? 10 : 16;
    } else if (enemy.type === 'SKELETON') {
      burstColors = ['#f8fafc', '#cbd5e1', '#64748b'];
      particleCount = 18;
    } else if (enemy.type === 'BERSERKER') {
      burstColors = ['#ef4444', '#f97316', '#7f1d1d'];
      particleCount = 22;
      maxSpeed = 280;
    } else if (enemy.type === 'MAGE') {
      burstColors = ['#c084fc', '#a855f7', '#67e8f9'];
      particleCount = 20;
    } else if (enemy.isBoss) {
      burstColors = ['#94a3b8', '#f59e0b', '#0284c7', '#f8fafc'];
      particleCount = 45;
      maxSpeed = 340;
    }

    for (let i = 0; i < particleCount; i++) {
      const ang = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const spd = (maxSpeed * 0.35) + Math.random() * (maxSpeed * 0.65);
      this.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: enemy.isBoss ? (i % 2 === 0 ? 5 : 3) : (i % 2 === 0 ? 3.5 : 2),
        color: burstColors[i % burstColors.length],
        alpha: 1,
        life: 0,
        maxLife: enemy.isBoss ? 0.6 : 0.35 + Math.random() * 0.2,
      });
    }

    // Remove from array
    this.enemies = this.enemies.filter(e => e.id !== enemy.id);
    this.onScoreChange?.(p.score, p.coins, p.combo, p.wave);
  }

  public breakProp(prop: BreakableProp) {
    if (prop.hp <= 0) return;
    prop.hp = 0;
    audio.playHit(false);

    if (prop.type === 'chest') {
      prop.opened = true;
      // Massive reward!
      for (let i = 0; i < 4; i++) {
        this.pickups.push({
          id: 'chest_coin_' + Math.random(),
          type: 'coin',
          x: prop.x + (Math.random() - 0.5) * 24,
          y: prop.y + (Math.random() - 0.5) * 24,
          value: 25,
          bobTimer: Math.random() * 6,
        });
      }
      this.pickups.push({
        id: 'chest_heart_' + Math.random(),
        type: 'heart',
        x: prop.x,
        y: prop.y - 12,
        value: 2,
        bobTimer: 0,
      });
    } else {
      // Pot broken shards
      if (Math.random() < 0.5) {
        this.pickups.push({
          id: 'pot_coin_' + Math.random(),
          type: 'coin',
          x: prop.x,
          y: prop.y,
          value: 10,
          bobTimer: Math.random() * 6,
        });
      }
    }

    // Shard particles
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: prop.x,
        y: prop.y,
        vx: (Math.random() - 0.5) * 140,
        vy: (Math.random() - 0.5) * 140,
        size: 3,
        color: '#ea580c',
        alpha: 1,
        life: 0,
        maxLife: 0.35,
      });
    }
  }

  public hurtPlayer(damage: number) {
    const p = this.player;
    if (p.invulnerableTimer > 0) return;

    p.hp -= damage;
    p.flashTimer = 0.2;
    p.invulnerableTimer = 0.85; // i-frames
    p.combo = 0; // combo break

    audio.playHurt();
    this.triggerHaptic(65);
    this.cameraTrauma = 0.6;
    this.onPlayerHpChange?.(p.hp, p.maxHp);
    this.onScoreChange?.(p.score, p.coins, p.combo, p.wave);

    this.addFloatingText(p.x, p.y - 16, `-${damage} HP`, '#ef4444', 1.2, true);

    if (p.hp <= 0) {
      this.gameOver();
    }
  }

  private gameOver() {
    this.state = 'GAMEOVER';
    if (this.player.score > this.highScore) {
      this.highScore = this.player.score;
      localStorage.setItem('tiny_pixel_dungeon_highscore', this.highScore.toString());
    }
    this.onStateChange?.(this.state);
  }

  // --- PROJECTILES & PICKUPS ---
  private updateProjectiles(dt: number) {
    const p = this.player;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life += dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // Projectile vs Player
      if (!proj.fromPlayer && p.invulnerableTimer <= 0 && !p.isDashing) {
        if (Math.hypot(p.x - proj.x, p.y - proj.y) < p.width / 2 + proj.radius) {
          this.hurtPlayer(proj.damage);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Projectile vs Enemies (from Mage or player perks)
      if (proj.fromPlayer) {
        let hit = false;
        for (const enemy of this.enemies) {
          if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) < enemy.width / 2 + proj.radius) {
            this.damageEnemy(enemy, proj.damage, Math.random() < 0.25);
            audio.playHit(false);
            hit = true;
            if (!proj.isPiercing) {
              break;
            }
          }
        }
        if (hit && !proj.isPiercing) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Projectile vs Walls
      if (
        proj.x < WALL_THICKNESS ||
        proj.x > ARENA_WIDTH - WALL_THICKNESS ||
        proj.y < WALL_THICKNESS ||
        proj.y > ARENA_HEIGHT - WALL_THICKNESS ||
        proj.life >= proj.maxLife
      ) {
        this.projectiles.splice(i, 1);
        continue;
      }
    }
  }

  private updatePickups(dt: number) {
    const p = this.player;
    const magnetDist = p.hasMagnet ? 240 : 45;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      pickup.bobTimer += dt * 4;

      const dist = Math.hypot(p.x - pickup.x, p.y - pickup.y);

      // Magnet pull
      if (dist < magnetDist) {
        const pullSpeed = p.hasMagnet ? 280 : 160;
        const ang = Math.atan2(p.y - pickup.y, p.x - pickup.x);
        pickup.x += Math.cos(ang) * pullSpeed * dt;
        pickup.y += Math.sin(ang) * pullSpeed * dt;
      }

      // Collect item
      if (dist < 22) {
        if (pickup.type === 'coin') {
          p.coins += pickup.value;
          p.score += pickup.value * 10;
          audio.playCoin();
          this.addFloatingText(pickup.x, pickup.y, `+${pickup.value}`, '#fbbf24', 0.8);
        } else if (pickup.type === 'heart') {
          if (p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + pickup.value);
            audio.playCoin();
            this.onPlayerHpChange?.(p.hp, p.maxHp);
            this.addFloatingText(pickup.x, pickup.y, '+1 HP', '#ef4444', 0.9);
          } else {
            // Already full health: bonus points
            p.score += 200;
            audio.playCoin();
            this.addFloatingText(pickup.x, pickup.y, '+200', '#f59e0b', 0.9);
          }
        } else if (pickup.type === 'gem') {
          p.score += pickup.value * 20;
          audio.playCoin();
          this.addFloatingText(pickup.x, pickup.y, `+${pickup.value * 20}`, '#38bdf8', 1.0);
        }

        this.onScoreChange?.(p.score, p.coins, p.combo, p.wave);
        this.pickups.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.life += dt;
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.alpha = Math.max(0, 1 - part.life / part.maxLife);

      if (part.life >= part.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.y -= dt * 32;

      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string, duration: number = 0.9, isCrit: boolean = false) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: duration,
      scale: isCrit ? 1.4 : 1.0,
      isCrit,
    });
  }

  private checkWaveProgress(dt: number) {
    if (this.waveSpawning) {
      this.spawnTimer += dt;
      const spawnInterval = Math.max(0.32, 0.78 - (this.player.wave - 1) * 0.045);
      if (this.spawnTimer >= spawnInterval) {
        this.spawnTimer = 0;
        this.spawnNextEnemy();
      }
    } else if (this.enemies.length === 0 && this.enemiesToSpawn.length === 0) {
      // Wave Cleared! Trigger upgrade selection (or auto-advance after wave 5 cap)
      this.triggerUpgradeSelection();
    }
  }

  // --- RENDER PIPELINE ---
  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Center viewport, scale by cameraZoom, and focus on player target with trauma screenshake
    ctx.translate(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-this.cameraFocusX + this.cameraX, -this.cameraFocusY + this.cameraY);

    // 1. Draw Pre-baked Floor & Centerpiece Architecture (High-Performance GPU Blit)
    if (!this.floorCanvas) {
      this.bakeArenaBackground();
    }
    if (this.floorCanvas) {
      ctx.drawImage(this.floorCanvas, 0, 0);
    } else {
      spriteRenderer.drawFloor(ctx, 0, 0, ARENA_WIDTH, ARENA_HEIGHT, this.currentBiome);
      this.renderDungeonArchitecture(ctx);
    }

    // 2. Draw Breakable Props & Torches
    for (const prop of this.props) {
      if (prop.hp > 0 || (prop.type === 'chest' && prop.opened)) {
        spriteRenderer.drawProp(ctx, prop.type, prop.x, prop.y, prop.opened);
      }
    }

    // 3. Draw Enemy Telegraphs on floor (e.g. Red aim lines, magic explosion circles)
    this.renderTelegraphs(ctx);

    // 4. Draw Pickups
    for (const pickup of this.pickups) {
      spriteRenderer.drawPickup(ctx, pickup.type, pickup.x, pickup.y, pickup.bobTimer);
    }

    // 5. Draw Enemies
    for (const enemy of this.enemies) {
      spriteRenderer.drawEnemy(ctx, enemy);

      // Mini Health Bar for Boss or damaged enemies
      if (enemy.hp < enemy.maxHp) {
        const barW = enemy.isBoss ? 48 : 22;
        const barH = enemy.isBoss ? 5 : 3;
        const barX = enemy.x - barW / 2;
        const barY = enemy.y - enemy.height / 2 - 8;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = '#ef4444';
        const fillW = Math.max(0, (enemy.hp / enemy.maxHp) * barW);
        ctx.fillRect(barX, barY, fillW, barH);
      }

      // Windup Exclamation mark bubble for Berserker
      if (enemy.state === 'windup' && enemy.type === 'BERSERKER') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 24, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', enemy.x, enemy.y - 20);
      }

      // Dazed / Exhausted indicator for Mage after teleporting
      if (enemy.state === 'cooldown' && enemy.type === 'MAGE') {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 24, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Zz', enemy.x, enemy.y - 20);
      }
    }

    // 5b. Draw Player Ghost Trails (Spectral Dash Shadows)
    for (const trail of this.playerGhostTrails) {
      spriteRenderer.drawGhostTrail(
        ctx,
        trail.x,
        trail.y,
        trail.facing,
        trail.frame,
        trail.alpha * 0.75,
        trail.heroClass
      );
    }

    // 6. Draw Player (With Attack Lunge, Idle Breathing & Hurt Recoil)
    const p = this.player;
    const isAttacking = p.isAttacking;
    const attackProgress = isAttacking ? Math.max(0, Math.min(1, 1 - p.attackTimer / 0.18)) : 0;
    const isIdle = (p.vx === 0 && p.vy === 0 && !p.isDashing);

    spriteRenderer.drawPlayer(
      ctx,
      p.x,
      p.y,
      p.facing,
      p.walkFrame,
      p.flashTimer > 0,
      p.isDashing,
      p.heroClass,
      isAttacking,
      attackProgress,
      p.attackAngle,
      isIdle
    );

    // 7. Draw Sword / Dagger / Magic Slash Arc
    if (p.isAttacking) {
      const progress = 1 - p.attackTimer / 0.18;
      spriteRenderer.drawSwordSlash(ctx, p.x, p.y, p.attackAngle, progress, p.hasFireBlade, p.heroClass);
    }

    // 8. Draw Projectiles
    for (const proj of this.projectiles) {
      if (proj.type === 'boulder') {
        spriteRenderer.drawBoulder(ctx, proj.x, proj.y, proj.radius, proj.life * 7);
      } else {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 9. Draw Particles
    for (const part of this.particles) {
      ctx.fillStyle = part.color;
      ctx.globalAlpha = part.alpha;
      ctx.fillRect(part.x - part.size / 2, part.y - part.size / 2, part.size, part.size);
    }
    ctx.globalAlpha = 1.0;

    // 10. Draw Pre-baked Dungeon Walls & Perimeter (High-Performance GPU Blit)
    if (this.wallsCanvas) {
      ctx.drawImage(this.wallsCanvas, 0, 0);
    } else {
      this.renderWalls(ctx);
    }

    // 11. Draw Dynamic Torch Lighting / Vignette
    this.renderLighting(ctx);

    // 12. Draw Floating Numbers
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, 1 - ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0f172a'; // outline shadow
      ctx.font = `${ft.isCrit ? 'bold 11px' : '9px'} "Press Start 2P", monospace`;
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }

  private renderTelegraphs(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.enemies) {
      if (enemy.state === 'windup' || enemy.state === 'leap') {
        if (enemy.type === 'SKELETON') {
          // Red laser sightline
          ctx.beginPath();
          ctx.moveTo(enemy.x, enemy.y);
          ctx.lineTo(enemy.targetX, enemy.targetY);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (enemy.type === 'MAGE') {
          // Expanding magic rune circle on floor
          const radius = 42;
          const progress = enemy.telegraphTimer / enemy.telegraphMax;
          ctx.beginPath();
          ctx.arc(enemy.targetX, enemy.targetY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Filling inner warning disc
          ctx.fillStyle = `rgba(168, 85, 247, ${0.15 + progress * 0.35})`;
          ctx.beginPath();
          ctx.arc(enemy.targetX, enemy.targetY, radius * progress, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.type === 'BOSS_GOLEM') {
          const isEnraged = enemy.hp <= enemy.maxHp * 0.5;
          const progress = Math.min(1, enemy.telegraphTimer / enemy.telegraphMax);

          if (enemy.state === 'leap') {
            // Leap Slam target drop crosshair and warning zone
            const radius = 85;
            ctx.beginPath();
            ctx.arc(enemy.targetX, enemy.targetY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = isEnraged ? 'rgba(239, 68, 68, 0.9)' : 'rgba(6, 182, 212, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = isEnraged ? `rgba(239, 68, 68, ${progress * 0.4})` : `rgba(6, 182, 212, ${progress * 0.35})`;
            ctx.beginPath();
            ctx.arc(enemy.targetX, enemy.targetY, radius * progress, 0, Math.PI * 2);
            ctx.fill();
          } else if (enemy.targetX === 1) {
            // Titan Cleave Front Smash Arc
            const cleaveAngle = enemy.targetY;
            const radius = 115;
            const sweep = Math.PI * 0.45;
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y);
            ctx.arc(enemy.x, enemy.y, radius, cleaveAngle - sweep, cleaveAngle + sweep);
            ctx.closePath();
            ctx.strokeStyle = isEnraged ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = isEnraged ? `rgba(239, 68, 68, ${progress * 0.35})` : `rgba(245, 158, 11, ${progress * 0.25})`;
            ctx.fill();
          } else if (enemy.targetX === 2) {
            // Boulder Toss 3 aiming laser paths
            const p = this.player;
            const baseAngle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
            for (let i = -1; i <= 1; i++) {
              const ang = baseAngle + (i * Math.PI) / 7;
              ctx.beginPath();
              ctx.moveTo(enemy.x, enemy.y);
              ctx.lineTo(enemy.x + Math.cos(ang) * 260, enemy.y + Math.sin(ang) * 260);
              ctx.strokeStyle = 'rgba(234, 88, 12, 0.7)';
              ctx.lineWidth = 2;
              ctx.setLineDash([6, 4]);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
      }
    }
  }

  private updateAmbientThemeVfx(dt: number) {
    this.ambientParticleTimer += dt;
    if (this.ambientParticleTimer < 0.2) return;
    this.ambientParticleTimer = 0;

    const theme = this.currentTheme;
    if (theme.ambientParticleType === 'ember') {
      const sx = WALL_THICKNESS + 30 + Math.random() * (ARENA_WIDTH - WALL_THICKNESS * 2 - 60);
      const sy = ARENA_HEIGHT - WALL_THICKNESS - 20 - Math.random() * 80;
      this.particles.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 20,
        vy: -30 - Math.random() * 40,
        size: 2 + Math.random() * 2,
        color: Math.random() > 0.4 ? '#f97316' : '#fde047',
        alpha: 0.85,
        life: 0,
        maxLife: 1.2,
      });
    } else if (theme.ambientParticleType === 'water_mote') {
      const sx = WALL_THICKNESS + 40 + Math.random() * (ARENA_WIDTH - WALL_THICKNESS * 2 - 80);
      const sy = WALL_THICKNESS + 40 + Math.random() * (ARENA_HEIGHT - WALL_THICKNESS * 2 - 80);
      this.particles.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 15,
        vy: -15 - Math.random() * 20,
        size: 2,
        color: '#67e8f9',
        alpha: 0.65,
        life: 0,
        maxLife: 1.4,
      });
    } else if (theme.ambientParticleType === 'violet_spark') {
      const sx = WALL_THICKNESS + 40 + Math.random() * (ARENA_WIDTH - WALL_THICKNESS * 2 - 80);
      const sy = WALL_THICKNESS + 40 + Math.random() * (ARENA_HEIGHT - WALL_THICKNESS * 2 - 80);
      this.particles.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 25,
        vy: (Math.random() - 0.5) * 25,
        size: 2,
        color: '#c084fc',
        alpha: 0.75,
        life: 0,
        maxLife: 0.9,
      });
    } else if (theme.ambientParticleType === 'gold_fleck') {
      const sx = WALL_THICKNESS + 40 + Math.random() * (ARENA_WIDTH - WALL_THICKNESS * 2 - 80);
      const sy = WALL_THICKNESS + 40 + Math.random() * (ARENA_HEIGHT - WALL_THICKNESS * 2 - 80);
      this.particles.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 15,
        vy: -10 - Math.random() * 15,
        size: 2,
        color: '#fbbf24',
        alpha: 0.8,
        life: 0,
        maxLife: 1.1,
      });
    } else {
      // Dust in torchlight
      const sx = WALL_THICKNESS + 40 + Math.random() * (ARENA_WIDTH - WALL_THICKNESS * 2 - 80);
      const sy = WALL_THICKNESS + 40 + Math.random() * (ARENA_HEIGHT - WALL_THICKNESS * 2 - 80);
      this.particles.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: 1.5,
        color: '#94a3b8',
        alpha: 0.5,
        life: 0,
        maxLife: 1.5,
      });
    }
  }

  private renderDungeonArchitecture(ctx: CanvasRenderingContext2D) {
    const theme = this.currentTheme;
    const cx = ARENA_WIDTH / 2;
    const cy = ARENA_HEIGHT / 2;

    // 1. Centerpiece Architecture based on active theme
    if (theme.id === 'catacombs') {
      // Ancient Stone Ritual Circle
      ctx.save();
      // Outer ring
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 64, 0, Math.PI * 2);
      ctx.stroke();

      // Middle dashed ring with ancient rune notches
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner ring
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.stroke();

      // 8-pointed engraved star
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * 46, cy + Math.sin(ang) * 46);
        ctx.stroke();
      }

      // Glowing central emerald rune gem
      ctx.fillStyle = '#059669';
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
      ctx.fillStyle = '#a7f3d0';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
      ctx.restore();

      // Corner Sewer Grates
      const grates = [
        { x: 100, y: ARENA_HEIGHT - 65 },
        { x: ARENA_WIDTH - 120, y: ARENA_HEIGHT - 65 },
      ];
      for (const g of grates) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(g.x, g.y, 20, 14);
        ctx.fillStyle = '#475569';
        for (let i = 2; i < 18; i += 4) {
          ctx.fillRect(g.x + i, g.y + 1, 2, 12);
        }
      }
    } else if (theme.id === 'magma') {
      // Molten Lava Fissure in center floor
      ctx.save();
      // Scorched basalt crust border
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 65, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lava pool
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 54, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hot inner molten core
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 42, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing magma yellow center
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 26, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Radiating fissure cracks
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      const crackAngles = [0.2, 1.1, 2.3, 3.4, 4.2, 5.5];
      for (const ang of crackAngles) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * 50, cy + Math.sin(ang) * 26);
        ctx.lineTo(cx + Math.cos(ang) * 90, cy + Math.sin(ang) * 46);
        ctx.stroke();
      }
      ctx.restore();
    } else if (theme.id === 'sunken') {
      // Sacred Lotus Pool
      ctx.save();
      // Carved jade rim
      ctx.fillStyle = '#042f2e';
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();

      // Water basin
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fill();

      // Iridescent turquoise water
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fill();

      // Concentric rippling ring
      const wavePulse = (Math.sin(this.themeAnimTimer * 2) + 1) * 0.5;
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 20 + wavePulse * 18, 0, Math.PI * 2);
      ctx.stroke();

      // Central sacred lotus glyph
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, cy - 2, 4, 4);

      // 4 floating green lily pads
      const pads = [
        { x: cx - 24, y: cy - 14 },
        { x: cx + 22, y: cy - 16 },
        { x: cx - 18, y: cy + 18 },
        { x: cx + 20, y: cy + 16 },
      ];
      for (const p of pads) {
        ctx.fillStyle = '#059669';
        ctx.fillRect(p.x, p.y, 8, 6);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(p.x + 1, p.y + 1, 6, 4);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(p.x + 3, p.y + 2, 2, 2);
      }
      ctx.restore();
    } else if (theme.id === 'obsidian') {
      // Royal Crimson Carpet Runner with Arcane Pentagram
      ctx.save();
      const carpetW = 76;
      const carpetX = cx - carpetW / 2;
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(carpetX - 2, WALL_THICKNESS, carpetW + 4, ARENA_HEIGHT - WALL_THICKNESS * 2);
      ctx.fillStyle = '#881337';
      ctx.fillRect(carpetX, WALL_THICKNESS, carpetW, ARENA_HEIGHT - WALL_THICKNESS * 2);
      ctx.fillStyle = '#9f1239';
      ctx.fillRect(carpetX + 6, WALL_THICKNESS, carpetW - 12, ARENA_HEIGHT - WALL_THICKNESS * 2);

      // Gold fringe borders
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(carpetX + 2, WALL_THICKNESS, 2, ARENA_HEIGHT - WALL_THICKNESS * 2);
      ctx.fillRect(carpetX + carpetW - 4, WALL_THICKNESS, 2, ARENA_HEIGHT - WALL_THICKNESS * 2);

      // Arcane Violet Pentagram in center
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 48, 0, Math.PI * 2);
      ctx.stroke();

      // Pentagram 5 star lines
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const starIdx = (i * 2) % 5;
        const ang = (starIdx / 5) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(ang) * 44;
        const py = cy + Math.sin(ang) * 44;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Glowing violet core
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      ctx.fillStyle = '#f5d0fe';
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
      ctx.restore();
    } else {
      // Citadel: Imperial Red & Gold Throne Carpet with Double-Headed Sword Crest
      ctx.save();
      const carpetW = 90;
      const carpetX = cx - carpetW / 2;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(carpetX - 3, WALL_THICKNESS, carpetW + 6, ARENA_HEIGHT - WALL_THICKNESS * 2);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(carpetX, WALL_THICKNESS, carpetW, ARENA_HEIGHT - WALL_THICKNESS * 2);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(carpetX + 8, WALL_THICKNESS, carpetW - 16, ARENA_HEIGHT - WALL_THICKNESS * 2);

      // Gold embroidery borders
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(carpetX + 3, WALL_THICKNESS, 3, ARENA_HEIGHT - WALL_THICKNESS * 2);
      ctx.fillRect(carpetX + carpetW - 6, WALL_THICKNESS, 3, ARENA_HEIGHT - WALL_THICKNESS * 2);

      // Grand Golden Citadel Center Medallion
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 54, 0, Math.PI * 2);
      ctx.stroke();

      // Sunburst golden rays
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * 44, cy + Math.sin(ang) * 44);
        ctx.lineTo(cx + Math.cos(ang) * 52, cy + Math.sin(ang) * 52);
        ctx.stroke();
      }

      // Royal double sword crest in center
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - 2, cy - 26, 4, 52);
      ctx.fillRect(cx - 14, cy - 12, 28, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
      ctx.restore();
    }

    // 2. 4 Grand Architectural Corner Columns
    const pillars = [
      { x: 170, y: 150 },
      { x: ARENA_WIDTH - 170, y: 150 },
      { x: 170, y: ARENA_HEIGHT - 150 },
      { x: ARENA_WIDTH - 170, y: ARENA_HEIGHT - 150 },
    ];
    for (const col of pillars) {
      ctx.save();
      // Drop Shadow on floor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(col.x, col.y + 12, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Base Pedestal
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(col.x - 14, col.y + 4, 28, 12);
      ctx.fillStyle = theme.pillarColor;
      ctx.fillRect(col.x - 12, col.y + 5, 24, 10);
      ctx.fillStyle = theme.pillarHighlight;
      ctx.fillRect(col.x - 12, col.y + 5, 24, 2);

      // Fluted Shaft
      ctx.fillStyle = '#090d16';
      ctx.fillRect(col.x - 10, col.y - 18, 20, 24);
      ctx.fillStyle = theme.pillarColor;
      ctx.fillRect(col.x - 9, col.y - 17, 18, 22);
      ctx.fillStyle = theme.pillarHighlight;
      ctx.fillRect(col.x - 6, col.y - 17, 2, 22);
      ctx.fillRect(col.x + 4, col.y - 17, 2, 22);

      // Ornate Capital Crown
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(col.x - 13, col.y - 24, 26, 8);
      ctx.fillStyle = theme.pillarHighlight;
      ctx.fillRect(col.x - 11, col.y - 23, 22, 6);
      ctx.fillStyle = theme.bannerColor;
      ctx.fillRect(col.x - 2, col.y - 21, 4, 3);
      ctx.restore();
    }
  }

  private renderWalls(ctx: CanvasRenderingContext2D) {
    const theme = this.currentTheme;

    // Outer wall base
    ctx.fillStyle = theme.wallTop;
    ctx.fillRect(0, 0, ARENA_WIDTH, WALL_THICKNESS);
    ctx.fillRect(0, ARENA_HEIGHT - WALL_THICKNESS, ARENA_WIDTH, WALL_THICKNESS);
    ctx.fillRect(0, 0, WALL_THICKNESS, ARENA_HEIGHT);
    ctx.fillRect(ARENA_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ARENA_HEIGHT);

    // Wall face stone texture
    ctx.fillStyle = theme.wallFace;
    ctx.fillRect(0, WALL_THICKNESS - 12, ARENA_WIDTH, 12);
    ctx.fillRect(0, ARENA_HEIGHT - WALL_THICKNESS, ARENA_WIDTH, 12);
    ctx.fillRect(WALL_THICKNESS - 12, 0, 12, ARENA_HEIGHT);
    ctx.fillRect(ARENA_WIDTH - WALL_THICKNESS, 0, 12, ARENA_HEIGHT);

    // Stone relief bevels
    ctx.fillStyle = theme.wallBevel;
    ctx.fillRect(WALL_THICKNESS - 3, 0, 3, ARENA_HEIGHT);
    ctx.fillRect(ARENA_WIDTH - WALL_THICKNESS, 0, 3, ARENA_HEIGHT);
    ctx.fillRect(0, WALL_THICKNESS - 3, ARENA_WIDTH, 3);
    ctx.fillRect(0, ARENA_HEIGHT - WALL_THICKNESS, ARENA_WIDTH, 3);

    // Accent line along bottom edge of top wall
    ctx.fillStyle = theme.wallAccent;
    ctx.fillRect(WALL_THICKNESS, WALL_THICKNESS - 2, ARENA_WIDTH - WALL_THICKNESS * 2, 2);

    // Hanging Heraldic Wall Banners on Top Wall
    const bannerPositions = [110, 250, ARENA_WIDTH - 250, ARENA_WIDTH - 110];
    for (const bx of bannerPositions) {
      // Wood/Iron hanging rod
      ctx.fillStyle = '#64748b';
      ctx.fillRect(bx - 12, 4, 24, 3);

      // Banner fabric
      ctx.fillStyle = theme.bannerFabric;
      ctx.fillRect(bx - 10, 7, 20, 20);
      // Swallowtail V-cut at bottom
      ctx.beginPath();
      ctx.moveTo(bx - 10, 27);
      ctx.lineTo(bx, 33);
      ctx.lineTo(bx + 10, 27);
      ctx.lineTo(bx + 10, 7);
      ctx.lineTo(bx - 10, 7);
      ctx.fill();

      // Gold fringe trim
      ctx.fillStyle = theme.bannerTrim;
      ctx.fillRect(bx - 8, 9, 16, 2);
      ctx.fillRect(bx - 2, 13, 4, 7);
      ctx.fillRect(bx - 5, 15, 10, 3);
    }

    // Torches
    for (const torch of this.torches) {
      // Bracket
      ctx.fillStyle = '#475569';
      ctx.fillRect(torch.x - 2, torch.y - 2, 4, 8);
      // Flame pixels
      ctx.fillStyle = torch.color;
      ctx.fillRect(torch.x - 3, torch.y - 6 + torch.flicker * 3, 6, 6);
      ctx.fillStyle = theme.torchInner;
      ctx.fillRect(torch.x - 1, torch.y - 5 + torch.flicker * 2, 2, 3);
    }
  }

  private renderLighting(ctx: CanvasRenderingContext2D) {
    const theme = this.currentTheme;

    // Atmospheric torch glow circles
    for (const torch of this.torches) {
      const grad = ctx.createRadialGradient(
        torch.x,
        torch.y,
        5,
        torch.x,
        torch.y,
        75 + torch.flicker * 20
      );
      grad.addColorStop(0, theme.torchGlow);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(torch.x, torch.y, 85, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player torchlight circle
    const pGrad = ctx.createRadialGradient(
      this.player.x,
      this.player.y,
      15,
      this.player.x,
      this.player.y,
      130
    );
    pGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    pGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, 130, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const gameEngine = new GameEngine();
