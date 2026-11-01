/**
 * Pixel Art Generator and Sprite Cache
 * Pre-renders pixel-perfect sprites to offscreen canvases for crisp 60fps performance.
 */

import { Facing, EnemyType, HeroClass, DungeonBiomeId } from './types';

export class SpriteRenderer {
  private cache: Map<string, HTMLCanvasElement> = new Map();
  private patterns: Map<string, CanvasPattern> = new Map();

  constructor() {
    this.prebakeSprites();
  }

  private createOffscreen(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return [canvas, ctx];
  }

  private prebakeSprites() {
    // 1. Player Walk & Idle Frames for Knight, Rogue, and Mage
    const classes: HeroClass[] = ['knight', 'rogue', 'mage'];
    for (const hc of classes) {
      for (let f = 0; f < 4; f++) {
        this.bakePlayer(hc, f, false);
        this.bakePlayer(hc, f, true); // flash state
      }
    }

    // 2. Slime & Mini Slime
    this.bakeSlime('SLIME', false);
    this.bakeSlime('SLIME', true);
    this.bakeSlime('MINI_SLIME', false);
    this.bakeSlime('MINI_SLIME', true);

    // 3. Skeleton Archer
    this.bakeSkeleton(0, false);
    this.bakeSkeleton(1, false);
    this.bakeSkeleton(0, true);

    // 4. Goblin Berserker
    this.bakeBerserker(0, false);
    this.bakeBerserker(1, false);
    this.bakeBerserker(0, true);

    // 5. Dark Mage
    this.bakeMage(0, false);
    this.bakeMage(0, true);

    // 6. Boss Golem (Normal and Enraged)
    this.bakeBossGolem(false, false);
    this.bakeBossGolem(false, true);
    this.bakeBossGolem(true, false);
    this.bakeBossGolem(true, true);

    // 7. Pickups & Props
    this.bakeHeart();
    this.bakeCoin();
    this.bakeGem();
    this.bakeChest(false);
    this.bakeChest(true);
    this.bakePot();
    this.bakeAllFloorTiles();
    this.bakeExtraProps();
    this.bakeWallTile();
    this.bakeBoulder();
  }

  // --- PLAYER SPRITES FOR 3 CLASSES ---
  private bakePlayer(heroClass: HeroClass, frame: number, isFlash: boolean) {
    const [canvas, ctx] = this.createOffscreen(26, 30);
    const key = `player_${heroClass}_${frame}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      // Solid white silhouette
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 4, 12, 10); // head
      ctx.fillRect(5, 12, 16, 10); // body
      ctx.fillRect(7, 22, 4, 6); // left leg
      ctx.fillRect(15, 22, 4, 6); // right leg
      this.cache.set(key, canvas);
      return;
    }

    const bob = frame % 2 === 1 ? 1 : 0;
    const legOffset = frame === 1 ? 2 : frame === 3 ? -2 : 0;

    if (heroClass === 'knight') {
      // Cape (crimson)
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(4, 11 + bob, 4, 11);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(5, 12 + bob, 3, 10);

      // Silver Helmet
      ctx.fillStyle = '#475569';
      ctx.fillRect(7, 3 + bob, 12, 10);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, 4 + bob, 10, 8);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(9, 4 + bob, 6, 2); // highlight

      // Helmet plume (golden crest)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(11, 1 + bob, 4, 3);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(12, 0 + bob, 2, 2);

      // Visor slit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(9, 8 + bob, 9, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(11, 9 + bob, 6, 1); // glowing eyes

      // Steel Chest Armor
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 13 + bob, 12, 9);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(8, 14 + bob, 10, 7);
      ctx.fillStyle = '#f59e0b'; // belt buckle
      ctx.fillRect(11, 19 + bob, 4, 3);

      // Greaves
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, 22 + bob, 4, 5 + (legOffset > 0 ? -1 : 0));
      ctx.fillRect(14, 22 + bob, 4, 5 + (legOffset < 0 ? -1 : 0));
      ctx.fillStyle = '#64748b';
      ctx.fillRect(7, 25 + bob, 5, 3);
      ctx.fillRect(14, 25 + bob, 5, 3);
    } else if (heroClass === 'rogue') {
      // Dark Shadow Cloak
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 10 + bob, 4, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 11 + bob, 3, 11);

      // Rogue Leather Hood
      ctx.fillStyle = '#14532d'; // dark forest green
      ctx.fillRect(7, 3 + bob, 12, 10);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(8, 4 + bob, 10, 8);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(9, 2 + bob, 4, 2); // hood peak

      // Shadow face & glowing emerald eyes
      ctx.fillStyle = '#090d16';
      ctx.fillRect(9, 8 + bob, 8, 4);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(10, 9 + bob, 2, 2);
      ctx.fillRect(14, 9 + bob, 2, 2);

      // Leather Jerkin & Bandolier
      ctx.fillStyle = '#292524';
      ctx.fillRect(7, 13 + bob, 12, 9);
      ctx.fillStyle = '#78350f'; // leather strap
      ctx.fillRect(8, 14 + bob, 3, 7);
      ctx.fillRect(11, 15 + bob, 3, 6);

      // Agile Boots
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(8, 22 + bob, 4, 5 + (legOffset > 0 ? -1 : 0));
      ctx.fillRect(14, 22 + bob, 4, 5 + (legOffset < 0 ? -1 : 0));
    } else if (heroClass === 'mage') {
      // Mystical Robe
      ctx.fillStyle = '#1e1b4b'; // deep indigo
      ctx.fillRect(5, 11 + bob, 16, 13);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(7, 12 + bob, 12, 11);
      ctx.fillStyle = '#f59e0b'; // golden runic hem
      ctx.fillRect(5, 23 + bob, 16, 2);

      // Wizard Hat
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(4, 8 + bob, 18, 3); // wide brim
      ctx.fillStyle = '#3730a3';
      ctx.fillRect(7, 4 + bob, 12, 5);
      ctx.fillRect(9, 1 + bob, 8, 4);
      ctx.fillRect(11, -1 + bob, 4, 3); // hat tip
      // Hat ribbon
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(7, 8 + bob, 12, 2);

      // Mysterious face & Glowing Cyan Star Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, 9 + bob, 10, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(10, 10 + bob, 2, 2);
      ctx.fillRect(14, 10 + bob, 2, 2);

      // Slippers
      ctx.fillStyle = '#312e81';
      ctx.fillRect(8, 24 + bob, 4, 3);
      ctx.fillRect(14, 24 + bob, 4, 3);
    }

    this.cache.set(key, canvas);
  }

  // --- SLIME SPRITE ---
  private bakeSlime(type: 'SLIME' | 'MINI_SLIME', isFlash: boolean) {
    const isMini = type === 'MINI_SLIME';
    const w = isMini ? 16 : 24;
    const h = isMini ? 14 : 20;
    const [canvas, ctx] = this.createOffscreen(w, h);
    const key = `${type}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 2, w - 4, h - 4);
      this.cache.set(key, canvas);
      return;
    }

    // Emerald gelatinous body
    ctx.fillStyle = '#15803d';
    ctx.fillRect(3, 4, w - 6, h - 5);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(4, 3, w - 8, h - 5);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(5, 2, w - 10, 3); // top shine

    // Eyes
    ctx.fillStyle = '#052e16';
    const eyeSize = isMini ? 2 : 3;
    ctx.fillRect(isMini ? 4 : 6, isMini ? 5 : 8, eyeSize, eyeSize);
    ctx.fillRect(isMini ? 10 : 15, isMini ? 5 : 8, eyeSize, eyeSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(isMini ? 4 : 6, isMini ? 5 : 8, 1, 1);
    ctx.fillRect(isMini ? 10 : 15, isMini ? 5 : 8, 1, 1);

    this.cache.set(key, canvas);
  }

  // --- SKELETON ARCHER ---
  private bakeSkeleton(frame: number, isFlash: boolean) {
    const [canvas, ctx] = this.createOffscreen(22, 28);
    const key = `skeleton_${frame}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 14, 20);
      this.cache.set(key, canvas);
      return;
    }

    const bob = frame === 1 ? 1 : 0;
    // Skull
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(6, 3 + bob, 10, 8);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(7, 4 + bob, 8, 6);
    // Dark eye sockets
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 6 + bob, 2, 3);
    ctx.fillRect(12, 6 + bob, 2, 3);

    // Ribcage & Spine
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(8, 11 + bob, 6, 7);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(7, 12 + bob, 8, 1);
    ctx.fillRect(7, 14 + bob, 8, 1);
    ctx.fillRect(8, 16 + bob, 6, 1);

    // Legs
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(8, 18 + bob, 2, 7);
    ctx.fillRect(12, 18 + bob, 2, 7);

    // Bone Bow in hand
    ctx.fillStyle = '#78350f';
    ctx.fillRect(2, 8 + bob, 2, 12);
    ctx.fillRect(3, 7 + bob, 2, 2);
    ctx.fillRect(3, 19 + bob, 2, 2);

    this.cache.set(key, canvas);
  }

  // --- GOBLIN BERSERKER ---
  private bakeBerserker(frame: number, isFlash: boolean) {
    const [canvas, ctx] = this.createOffscreen(26, 30);
    const key = `berserker_${frame}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 18, 22);
      this.cache.set(key, canvas);
      return;
    }

    const bob = frame === 1 ? 1 : 0;
    // Red horned war helmet
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(7, 4 + bob, 12, 9);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(8, 5 + bob, 10, 7);
    // Horns
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(5, 2 + bob, 3, 4);
    ctx.fillRect(18, 2 + bob, 3, 4);

    // Fierce glowing eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 8 + bob, 10, 3);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(10, 9 + bob, 2, 1);
    ctx.fillRect(14, 9 + bob, 2, 1);

    // Muscular Brute Body & Spiked Armbands
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(6, 13 + bob, 14, 8);
    ctx.fillStyle = '#78350f'; // leather belt
    ctx.fillRect(6, 18 + bob, 14, 3);

    // Heavy Spiked Axe in hand
    ctx.fillStyle = '#475569';
    ctx.fillRect(2, 6 + bob, 5, 8);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 11 + bob, 2, 14);

    // Boots
    ctx.fillStyle = '#451a03';
    ctx.fillRect(7, 21 + bob, 4, 6);
    ctx.fillRect(15, 21 + bob, 4, 6);

    this.cache.set(key, canvas);
  }

  // --- DARK MAGE ---
  private bakeMage(frame: number, isFlash: boolean) {
    const [canvas, ctx] = this.createOffscreen(24, 30);
    const key = `mage_${frame}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 16, 22);
      this.cache.set(key, canvas);
      return;
    }

    // Shadow Purple Robe
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(5, 6, 14, 19);
    ctx.fillStyle = '#581c87';
    ctx.fillRect(6, 8, 12, 16);

    // Hood & glowing amethyst eyes
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(6, 3, 12, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 6, 8, 4);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(9, 7, 2, 2);
    ctx.fillRect(13, 7, 2, 2);

    // Orb staff
    ctx.fillStyle = '#78350f';
    ctx.fillRect(2, 5, 2, 20);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(0, 3, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 4, 2, 2);

    this.cache.set(key, canvas);
  }

  // --- BOSS GOLEM (NORMAL & ENRAGED) ---
  private bakeBossGolem(isEnraged: boolean, isFlash: boolean) {
    const [canvas, ctx] = this.createOffscreen(56, 60);
    const key = `boss_${isEnraged ? 'enraged' : 'normal'}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 6, 44, 48);
      this.cache.set(key, canvas);
      return;
    }

    // Heavy Stone Head
    ctx.fillStyle = isEnraged ? '#450a0a' : '#1e293b';
    ctx.fillRect(18, 6, 20, 14);
    ctx.fillStyle = isEnraged ? '#7f1d1d' : '#475569';
    ctx.fillRect(20, 8, 16, 11);

    // Glowing ancient rune eyes (flaring red/orange when enraged, cyan when normal)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(22, 12, 4, 3);
    ctx.fillRect(30, 12, 4, 3);
    ctx.fillStyle = isEnraged ? '#ef4444' : '#06b6d4';
    ctx.fillRect(23, 13, 3, 2);
    ctx.fillRect(31, 13, 3, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 13, 1, 1);
    ctx.fillRect(32, 13, 1, 1);

    // Massive Stone Shoulders & Chest
    ctx.fillStyle = isEnraged ? '#3b0d0c' : '#0f172a';
    ctx.fillRect(8, 19, 40, 22);
    ctx.fillStyle = isEnraged ? '#591614' : '#334155';
    ctx.fillRect(10, 20, 36, 20);

    // Glowing Rune Core in chest (Molten Lava when enraged)
    ctx.fillStyle = isEnraged ? '#ea580c' : '#0891b2';
    ctx.fillRect(24, 24, 8, 8);
    ctx.fillStyle = isEnraged ? '#fbbf24' : '#67e8f9';
    ctx.fillRect(26, 26, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(27, 27, 2, 2);

    // Magma Cracks when enraged, or Moss/Vines when normal
    if (isEnraged) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(12, 23, 8, 2);
      ctx.fillRect(34, 25, 8, 2);
      ctx.fillRect(16, 32, 6, 2);
      ctx.fillRect(30, 33, 8, 2);
    } else {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(12, 21, 5, 3);
      ctx.fillRect(34, 22, 6, 4);
    }

    // Giant Stone Fists
    ctx.fillStyle = isEnraged ? '#591614' : '#475569';
    ctx.fillRect(4, 26, 8, 16);
    ctx.fillRect(44, 26, 8, 16);
    ctx.fillStyle = isEnraged ? '#991b1b' : '#64748b';
    ctx.fillRect(5, 36, 6, 6);
    ctx.fillRect(45, 36, 6, 6);

    // Heavy Stone Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, 41, 10, 13);
    ctx.fillRect(30, 41, 10, 13);
    ctx.fillStyle = '#475569';
    ctx.fillRect(15, 50, 12, 5);
    ctx.fillRect(29, 50, 12, 5);

    this.cache.set(key, canvas);
  }

  // --- BOULDER PROJECTILE ---
  private bakeBoulder() {
    const [canvas, ctx] = this.createOffscreen(20, 20);
    // Jagged round rock
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(10, 10, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(9, 9, 7, 0, Math.PI * 2);
    ctx.fill();

    // Cracks & magma glow
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(6, 7, 6, 2);
    ctx.fillRect(10, 9, 4, 3);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(8, 8, 3, 2);

    this.cache.set('boulder', canvas);
  }

  // --- PICKUPS & PROPS ---
  private bakeHeart() {
    const [canvas, ctx] = this.createOffscreen(14, 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(2, 3, 4, 3);
    ctx.fillRect(8, 3, 4, 3);
    ctx.fillRect(1, 5, 12, 4);
    ctx.fillRect(2, 9, 10, 2);
    ctx.fillRect(4, 11, 6, 2);
    ctx.fillRect(6, 13, 2, 1);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(3, 4, 2, 2);
    this.cache.set('heart', canvas);
  }

  private bakeCoin() {
    const [canvas, ctx] = this.createOffscreen(12, 12);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(2, 1, 8, 10);
    ctx.fillRect(1, 2, 10, 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(2, 2, 8, 8);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(4, 3, 4, 6);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(5, 4, 2, 4);
    this.cache.set('coin', canvas);
  }

  private bakeGem() {
    const [canvas, ctx] = this.createOffscreen(14, 14);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(4, 2, 6, 10);
    ctx.fillRect(2, 4, 10, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(5, 4, 4, 4);
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(5, 3, 2, 2);
    this.cache.set('gem', canvas);
  }

  private bakeChest(isOpen: boolean) {
    const [canvas, ctx] = this.createOffscreen(20, 18);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(2, 4, 16, 12);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(3, 5, 14, 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(2, 8, 16, 2);
    ctx.fillRect(2, 4, 2, 12);
    ctx.fillRect(16, 4, 2, 12);
    ctx.fillRect(8, 7, 4, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(9, 8, 2, 2);

    if (isOpen) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(4, 3, 12, 3);
    }

    this.cache.set(`chest_${isOpen ? 'open' : 'closed'}`, canvas);
  }

  private bakePot() {
    const [canvas, ctx] = this.createOffscreen(16, 16);
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(4, 2, 8, 2);
    ctx.fillRect(2, 4, 12, 8);
    ctx.fillRect(4, 12, 8, 2);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(4, 5, 8, 6);
    ctx.fillStyle = '#fdba74';
    ctx.fillRect(5, 5, 2, 4);
    this.cache.set('pot', canvas);
  }

  private bakeAllFloorTiles() {
    // 1. CATACOMBS - Ancient Mossy Slate Pavers
    {
      const [canvas, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 32, 32);

      const stones = [
        { x: 1, y: 1, w: 14, h: 14 },
        { x: 17, y: 1, w: 14, h: 14 },
        { x: 1, y: 17, w: 14, h: 14 },
        { x: 17, y: 17, w: 14, h: 14 },
      ];
      for (const s of stones) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = '#334155';
        ctx.fillRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
        ctx.fillStyle = '#475569';
        ctx.fillRect(s.x + 1, s.y + 1, s.w - 2, 1);
        ctx.fillRect(s.x + 1, s.y + 1, 1, s.h - 2);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(s.x + 1, s.y + s.h - 2, s.w - 2, 1);
        ctx.fillRect(s.x + s.w - 2, s.y + 1, 1, s.h - 2);
      }
      ctx.fillStyle = '#065f46';
      ctx.fillRect(15, 14, 2, 2);
      ctx.fillRect(14, 15, 2, 2);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(15, 15, 1, 1);
      ctx.fillRect(2, 2, 1, 1);
      ctx.fillRect(30, 30, 1, 1);

      this.cache.set('floor_catacombs', canvas);
      this.cache.set('floor_tile', canvas);
    }

    // 2. MAGMA FORGE - Scorched Basalt & Glowing Magma Fissures
    {
      const [canvas, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(0, 0, 32, 32);

      const slabs = [
        { x: 2, y: 2, w: 13, h: 13 },
        { x: 17, y: 2, w: 13, h: 13 },
        { x: 2, y: 17, w: 13, h: 13 },
        { x: 17, y: 17, w: 13, h: 13 },
      ];
      for (const s of slabs) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = '#27272a';
        ctx.fillRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
      }
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 15, 32, 2);
      ctx.fillRect(15, 0, 2, 32);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(1, 15, 30, 1);
      ctx.fillRect(15, 1, 1, 30);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(14, 15, 4, 2);
      ctx.fillRect(15, 14, 2, 4);

      this.cache.set('floor_magma', canvas);
    }

    // 3. SUNKEN CRYPT - Deep Aquamarine Submerged Tiles & Water Sheen
    {
      const [canvas, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#042f2e';
      ctx.fillRect(0, 0, 32, 32);

      const tiles = [
        { x: 1, y: 1, w: 14, h: 14 },
        { x: 17, y: 1, w: 14, h: 14 },
        { x: 1, y: 17, w: 14, h: 14 },
        { x: 17, y: 17, w: 14, h: 14 },
      ];
      for (const t of tiles) {
        ctx.fillStyle = '#115e59';
        ctx.fillRect(t.x, t.y, t.w, t.h);
        ctx.fillStyle = '#134e4a';
        ctx.fillRect(t.x + 1, t.y + 1, t.w - 2, t.h - 2);
        ctx.fillStyle = '#2dd4bf';
        ctx.fillRect(t.x + 2, t.y + 2, 3, 2);
        ctx.fillStyle = '#0f766e';
        ctx.fillRect(t.x + 2, t.y + t.h - 3, t.w - 4, 1);
      }
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(0, 15, 32, 2);
      ctx.fillRect(15, 0, 2, 32);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(7, 15, 3, 1);
      ctx.fillRect(23, 15, 3, 1);
      ctx.fillRect(15, 8, 1, 3);
      ctx.fillRect(15, 24, 1, 3);

      this.cache.set('floor_sunken', canvas);
    }

    // 4. OBSIDIAN SANCTUM - Royal Violet Polished Marble & Gilded Seams
    {
      const [canvas, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#090514';
      ctx.fillRect(0, 0, 32, 32);

      const slabs = [
        { x: 1, y: 1, w: 14, h: 14 },
        { x: 17, y: 1, w: 14, h: 14 },
        { x: 1, y: 17, w: 14, h: 14 },
        { x: 17, y: 17, w: 14, h: 14 },
      ];
      for (const s of slabs) {
        ctx.fillStyle = '#2e1065';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = '#3b0764';
        ctx.fillRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
        ctx.fillStyle = '#581c87';
        ctx.fillRect(s.x + 3, s.y + 3, s.w - 6, s.h - 6);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(s.x + 1, s.y + 1, s.w - 2, 1);
        ctx.fillRect(s.x + 1, s.y + 1, 1, s.h - 2);
      }
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(14, 15, 4, 2);
      ctx.fillRect(15, 14, 2, 4);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(15, 15, 2, 2);

      this.cache.set('floor_obsidian', canvas);
    }

    // 5. ROYAL CITADEL - Imperial Fortress Flagstones with Crimson Border
    {
      const [canvas, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, 0, 32, 32);

      const flags = [
        { x: 1, y: 1, w: 14, h: 14 },
        { x: 17, y: 1, w: 14, h: 14 },
        { x: 1, y: 17, w: 14, h: 14 },
        { x: 17, y: 17, w: 14, h: 14 },
      ];
      for (const f of flags) {
        ctx.fillStyle = '#292524';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = '#44403c';
        ctx.fillRect(f.x + 1, f.y + 1, f.w - 2, f.h - 2);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(f.x + 3, f.y + 3, f.w - 6, f.h - 6);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(f.x + 4, f.y + 4, f.w - 8, f.h - 8);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(f.x + 6, f.y + 6, 2, 2);
      }
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, 15, 32, 2);
      ctx.fillRect(15, 0, 2, 32);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(15, 15, 2, 2);

      this.cache.set('floor_citadel', canvas);
    }
  }

  private bakeExtraProps() {
    // 1. Crate
    {
      const [canvas, ctx] = this.createOffscreen(18, 18);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(1, 1, 16, 16);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(2, 2, 14, 14);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(3, 3, 12, 12);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(3, 3, 2, 2);
      ctx.fillRect(13, 13, 2, 2);
      ctx.fillRect(3, 13, 2, 2);
      ctx.fillRect(13, 3, 2, 2);
      ctx.fillRect(8, 8, 2, 2);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(1, 1, 4, 2);
      ctx.fillRect(1, 1, 2, 4);
      ctx.fillRect(13, 1, 4, 2);
      ctx.fillRect(15, 1, 2, 4);
      ctx.fillRect(1, 15, 4, 2);
      ctx.fillRect(1, 13, 2, 4);
      ctx.fillRect(13, 15, 4, 2);
      ctx.fillRect(15, 13, 2, 4);
      this.cache.set('crate', canvas);
    }

    // 2. Ancient Urn
    {
      const [canvas, ctx] = this.createOffscreen(16, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 2, 8, 2);
      ctx.fillRect(2, 4, 12, 10);
      ctx.fillRect(4, 14, 8, 3);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(4, 3, 8, 2);
      ctx.fillRect(3, 5, 10, 8);
      ctx.fillRect(5, 14, 6, 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(3, 8, 10, 2);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(4, 6, 2, 4);
      this.cache.set('urn', canvas);
    }

    // 3. Glowing Crystal Cluster
    {
      const [canvas, ctx] = this.createOffscreen(18, 18);
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(3, 8, 4, 8);
      ctx.fillRect(7, 3, 5, 13);
      ctx.fillRect(12, 7, 4, 9);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(4, 9, 2, 6);
      ctx.fillRect(8, 4, 3, 11);
      ctx.fillRect(13, 8, 2, 7);
      ctx.fillStyle = '#a5f3fc';
      ctx.fillRect(8, 4, 1, 4);
      ctx.fillRect(13, 8, 1, 3);
      this.cache.set('crystal', canvas);
    }

    // 4. Blacksmith Anvil
    {
      const [canvas, ctx] = this.createOffscreen(20, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 3, 16, 5);
      ctx.fillRect(6, 8, 8, 4);
      ctx.fillRect(4, 12, 12, 3);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 4, 14, 3);
      ctx.fillRect(7, 8, 6, 3);
      ctx.fillRect(5, 12, 10, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(3, 4, 14, 1);
      this.cache.set('anvil', canvas);
    }

    // 5. Skull & Bones Pile
    {
      const [canvas, ctx] = this.createOffscreen(16, 16);
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 10, 12, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(3, 11, 10, 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(5, 3, 6, 6);
      ctx.fillRect(6, 9, 4, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 6, 1, 2);
      ctx.fillRect(9, 6, 1, 2);
      this.cache.set('skull_pile', canvas);
    }
  }

  private bakeWallTile() {
    const [canvas, ctx] = this.createOffscreen(32, 32);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 32, 4);
    ctx.fillRect(0, 0, 4, 32);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, 4, 24, 24);
    this.cache.set('wall_tile', canvas);
  }

  // --- DRAW METHODS ---
  public drawFloor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    biome: DungeonBiomeId = 'catacombs'
  ) {
    const tile = this.cache.get(`floor_${biome}`) || this.cache.get('floor_tile');
    if (!tile) return;
    let pattern = this.patterns.get(biome);
    if (!pattern) {
      const created = ctx.createPattern(tile, 'repeat');
      if (created) {
        pattern = created;
        this.patterns.set(biome, created);
      }
    }
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(x, y, w, h);
    }
  }

  public drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: Facing,
    frame: number,
    isFlash: boolean,
    isDashing: boolean,
    heroClass: HeroClass = 'knight',
    isAttacking: boolean = false,
    attackProgress: number = 0,
    attackAngle: number = 0,
    isIdle: boolean = false
  ) {
    const key = `player_${heroClass}_${frame}_${isFlash ? 'flash' : 'normal'}`;
    const img = this.cache.get(key);
    if (!img) return;

    ctx.save();

    // 1. Attack Lunge Dynamics (Physical weight & forward momentum)
    let lungeX = 0;
    let lungeY = 0;
    let attackLean = 0;
    let attackScaleX = 1;
    let attackScaleY = 1;

    if (isAttacking) {
      const peak = Math.sin(attackProgress * Math.PI);
      lungeX = Math.cos(attackAngle) * peak * 5.0;
      lungeY = Math.sin(attackAngle) * peak * 4.0;
      attackLean = (facing === 'right' ? 1 : -1) * peak * 0.16;
      attackScaleX = 1.0 + peak * 0.15;
      attackScaleY = 1.0 - peak * 0.08;
    }

    // 2. Idle Breathing Animation (Rhythmic chest & cape expansion)
    let idleBobY = 0;
    let idleScaleY = 1;
    if (isIdle && !isAttacking && !isDashing) {
      const breathe = Math.sin(performance.now() * 0.0055);
      idleBobY = breathe * 0.8;
      idleScaleY = 1.0 + breathe * 0.035;
    }

    // 3. Hurt Flinch Recoil
    let hurtOffsetX = 0;
    if (isFlash) {
      hurtOffsetX = facing === 'right' ? -3 : 3;
    }

    ctx.translate(x + lungeX + hurtOffsetX, y + lungeY + idleBobY);

    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    if (attackLean !== 0) {
      ctx.rotate(facing === 'left' ? -attackLean : attackLean);
    }

    ctx.scale(attackScaleX, attackScaleY * idleScaleY);

    if (isDashing) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, -18, -15, 28, 32);
      ctx.globalAlpha = 1.0;
    }

    ctx.drawImage(img, -13, -15, 26, 30);
    ctx.restore();
  }

  public drawGhostTrail(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: Facing,
    frame: number,
    alpha: number,
    heroClass: HeroClass = 'knight'
  ) {
    const key = `player_${heroClass}_${frame}_normal`;
    const img = this.cache.get(key);
    if (!img) return;

    ctx.save();
    ctx.translate(x, y);
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.drawImage(img, -13, -15, 26, 30);
    ctx.restore();
  }

  public drawSwordSlash(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    progress: number,
    hasFire: boolean,
    heroClass: HeroClass = 'knight'
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (heroClass === 'mage') {
      // Magic blast arc
      const radius = 38;
      ctx.beginPath();
      ctx.arc(0, 0, radius, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.strokeStyle = hasFire ? '#f97316' : '#38bdf8';
      ctx.lineWidth = 8 * (1 - progress);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius - 3, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4 * (1 - progress);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const radius = heroClass === 'rogue' ? 28 : 34;
    const sweep = heroClass === 'rogue' ? Math.PI * 0.9 : Math.PI * 0.75;
    const startAngle = -sweep / 2 + progress * sweep * 0.3;
    const endAngle = startAngle + sweep * (1 - progress * 0.3);

    // Trail arc
    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.strokeStyle = hasFire ? '#f97316' : heroClass === 'rogue' ? '#4ade80' : '#e0f2fe';
    ctx.lineWidth = (heroClass === 'rogue' ? 4 : 6) * (1 - progress);
    ctx.lineCap = 'round';
    ctx.stroke();

    // Hot inner core arc
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2, startAngle + 0.1, endAngle - 0.1);
    ctx.strokeStyle = hasFire ? '#fef08a' : '#ffffff';
    ctx.lineWidth = 3 * (1 - progress);
    ctx.stroke();

    // Weapon Blade
    const bladeLen = heroClass === 'rogue' ? 18 : 28;
    ctx.rotate(startAngle + sweep * 0.85);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(6, -2, bladeLen, 3);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(8, -1, bladeLen - 2, 2);
    ctx.fillStyle = heroClass === 'rogue' ? '#15803d' : '#f59e0b';
    ctx.fillRect(4, -3, 3, 6);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, -2, 4, 3);

    ctx.restore();
  }

  public drawEnemy(
    ctx: CanvasRenderingContext2D,
    enemy: {
      type: EnemyType;
      x: number;
      y: number;
      facing: Facing;
      flashTimer: number;
      animFrame: number;
      scaleX: number;
      scaleY: number;
      isBoss?: boolean;
      bossPhase?: number;
      hp?: number;
      maxHp?: number;
    }
  ) {
    const isFlash = enemy.flashTimer > 0;
    let key = '';

    if (enemy.type === 'SLIME' || enemy.type === 'MINI_SLIME') {
      key = `${enemy.type}_${isFlash ? 'flash' : 'normal'}`;
    } else if (enemy.type === 'SKELETON') {
      key = `skeleton_${enemy.animFrame}_${isFlash ? 'flash' : 'normal'}`;
    } else if (enemy.type === 'BERSERKER') {
      key = `berserker_${enemy.animFrame}_${isFlash ? 'flash' : 'normal'}`;
    } else if (enemy.type === 'MAGE') {
      key = `mage_0_${isFlash ? 'flash' : 'normal'}`;
    } else if (enemy.type === 'BOSS_GOLEM') {
      const isEnraged = (enemy.hp && enemy.maxHp) ? enemy.hp <= enemy.maxHp * 0.5 : false;
      key = `boss_${isEnraged ? 'enraged' : 'normal'}_${isFlash ? 'flash' : 'normal'}`;
    }

    const img = this.cache.get(key);
    if (!img) return;

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    if (enemy.facing === 'left') {
      ctx.scale(-1, 1);
    }
    // Squash & Stretch
    ctx.scale(enemy.scaleX || 1, enemy.scaleY || 1);

    const w = img.width;
    const h = img.height;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  public drawBoulder(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number) {
    const img = this.cache.get('boulder');
    if (!img) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }

  public drawPickup(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, bob: number) {
    const img = this.cache.get(type);
    if (!img) return;
    ctx.save();
    ctx.translate(x, y + Math.sin(bob) * 3);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }

  public drawProp(
    ctx: CanvasRenderingContext2D,
    type: 'pot' | 'chest' | 'crate' | 'urn' | 'crystal' | 'anvil' | 'skull_pile',
    x: number,
    y: number,
    opened?: boolean
  ) {
    let key: string = type;
    if (type === 'chest') {
      key = `chest_${opened ? 'open' : 'closed'}`;
    }
    const img = this.cache.get(key);
    if (!img) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }
}

export const spriteRenderer = new SpriteRenderer();
