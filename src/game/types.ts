export type GameState = 'TITLE' | 'PLAYING' | 'UPGRADE' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export type Facing = 'left' | 'right';

export type HeroClass = 'knight' | 'rogue' | 'mage';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  speed: number;
  facing: Facing;
  heroClass: HeroClass;
  
  // Combat
  isAttacking: boolean;
  attackTimer: number;
  attackCooldown: number;
  attackAngle: number;
  attackDamage: number;
  attackRange: number;
  
  // Dash
  isDashing: boolean;
  dashTimer: number;
  dashDuration: number;
  dashCooldown: number;
  dashCooldownTimer: number;
  dashVx: number;
  dashVy: number;
  
  // Special (Whirlwind / Shadow Strike / Arcane Nova)
  specialCooldown: number;
  specialTimer: number;
  isSpecialActive: boolean;
  
  // States & timers
  invulnerableTimer: number;
  flashTimer: number;
  walkFrame: number;
  walkTimer: number;
  
  // Progression & Stats
  score: number;
  coins: number;
  combo: number;
  comboTimer: number;
  killCount: number;
  wave: number;
  
  // Upgrades
  upgrades: string[];
  hasFireBlade: boolean;
  hasMagnet: boolean;
  hasChainLightning: boolean;
  hasThorns: boolean;
  hasVampire: boolean;
  dashStuns: boolean;
  hasWhirlwindAura: boolean;
}

export type EnemyType = 'SLIME' | 'MINI_SLIME' | 'SKELETON' | 'BERSERKER' | 'MAGE' | 'BOSS_GOLEM';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  facing: Facing;
  
  // AI State
  state: 'idle' | 'chase' | 'windup' | 'attack' | 'cooldown' | 'hurt' | 'leap' | 'slam';
  stateTimer: number;
  telegraphTimer: number;
  telegraphMax: number;
  targetX: number;
  targetY: number;
  attackCooldown: number;
  teleportCooldown?: number;
  
  // Visuals
  flashTimer: number;
  scaleX: number;
  scaleY: number;
  animFrame: number;
  animTimer: number;
  isBoss?: boolean;
  bossPhase?: number;
  milestones?: Set<number>;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  fromPlayer: boolean;
  isPiercing?: boolean;
  type: 'arrow' | 'magic_orb' | 'fire_wave' | 'shockwave' | 'boulder';
}

export interface Pickup {
  id: string;
  type: 'heart' | 'gem' | 'potion' | 'coin';
  x: number;
  y: number;
  value: number;
  bobTimer: number;
  collected?: boolean;
}

export interface BreakableProp {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  type: 'pot' | 'crate' | 'chest' | 'urn' | 'crystal' | 'anvil' | 'skull_pile' | 'barrel' | 'planks' | 'rubble';
  opened?: boolean;
}

export interface Torch {
  x: number;
  y: number;
  flicker: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  isDecal?: boolean; // floor blood/rubble
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
  isCrit?: boolean;
}

export interface UpgradeOption {
  id: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  iconName: 'sword' | 'shield' | 'flame' | 'zap' | 'heart' | 'wind' | 'magnet' | 'skull';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface BossInfo {
  name: string;
  nameTr: string;
  hp: number;
  maxHp: number;
  phase: number;
  isEnraged: boolean;
}

export interface HudState {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  score: number;
  coins: number;
  combo: number;
  comboTimer: number;
  wave: number;
  highScore: number;
  dashReady: boolean;
  dashCooldownProgress: number;
  specialReady: boolean;
  specialCooldownProgress: number;
  enemiesRemaining: number;
  activeBoss: BossInfo | null;
  upgrades: string[];
  heroClass: HeroClass;
  dungeonTheme?: DungeonThemeInfo;
}

export type DungeonBiomeId = 'catacombs' | 'magma' | 'sunken' | 'obsidian' | 'citadel';

export interface DungeonThemeInfo {
  id: DungeonBiomeId;
  name: string;
  nameTr: string;
  subtitle: string;
  subtitleTr: string;
  bannerColor: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  crtShader: boolean;
  language: 'tr' | 'en';
}
