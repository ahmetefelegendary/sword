/**
 * Pixel Art Generator and Sprite Cache
 * Pre-renders high-detail, retro arcade pixel sprites to offscreen canvases for crisp 60fps performance.
 *
 * Visual Upgrades:
 * - 32x34 High-Detail Characters:
 *   - Knight: Golden lion crest helm, glowing cyan visor slit, crimson fluttering cape, broadsword & heater shield
 *   - Rogue: Twin venom emerald daggers, shadow mask with cat-eyes, twin-tailed assassin cloak
 *   - Mage: Starry starlight archmage robes with gold runes, wizard hat, ancient staff with pulsating crystal orb
 * - High-Detail Enemies:
 *   - Slime: Glossy translucent highlight, bouncy squish & stretch
 *   - Skeleton Archer: Ribcage cavity, bone recurve bow with nocked arrow, glowing crimson eye sockets
 *   - Goblin Berserker: Horned horned war helmet, flaming rage eyes, dual-serrated executioner axe
 *   - Dark Mage: Animated 2-frame floating hover, cursed warlock cowl, skull-topped staff with void flame
 *   - Boss Golem: Massive textured stone titan with glowing cyan core & enraged molten magma fissures
 * - Smooth Ground Contact Drop Shadows for all entities (Player, Enemies, Pickups, Props)
 * - Premium Arcade Combat Slash Effects (Golden cleave, venom cross-cut, arcane cosmic blast)
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
    // 1. Player Walk & Idle Frames for Knight, Rogue, and Mage (4 animated walk frames each)
    const classes: HeroClass[] = ['knight', 'rogue', 'mage'];
    for (const hc of classes) {
      for (let f = 0; f < 4; f++) {
        this.bakePlayer(hc, f, false);
        this.bakePlayer(hc, f, true); // flash hit state
      }
    }

    // 2. Slime & Mini Slime
    this.bakeSlime('SLIME', false);
    this.bakeSlime('SLIME', true);
    this.bakeSlime('MINI_SLIME', false);
    this.bakeSlime('MINI_SLIME', true);

    // 3. Skeleton Archer (2 animated frames)
    this.bakeSkeleton(0, false);
    this.bakeSkeleton(1, false);
    this.bakeSkeleton(0, true);
    this.bakeSkeleton(1, true);

    // 4. Goblin Berserker (2 animated frames)
    this.bakeBerserker(0, false);
    this.bakeBerserker(1, false);
    this.bakeBerserker(0, true);
    this.bakeBerserker(1, true);

    // 5. Dark Mage (2 animated floating frames)
    this.bakeMage(0, false);
    this.bakeMage(1, false);
    this.bakeMage(0, true);
    this.bakeMage(1, true);

    // 6. Boss Golem (4 Animated Walk & Stomp Frames, Normal and Enraged)
    for (let f = 0; f < 4; f++) {
      this.bakeBossGolem(f, false, false);
      this.bakeBossGolem(f, false, true);
      this.bakeBossGolem(f, true, false);
      this.bakeBossGolem(f, true, true);
    }

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

  // --- 1. PLAYER SPRITES (32x34 High-Detail Characters) ---
  private bakePlayer(heroClass: HeroClass, frame: number, isFlash: boolean) {
    const [canvas, ctx] = this.createOffscreen(32, 34);
    const key = `player_${heroClass}_${frame}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      // Solid bright white/gold silhouette for crisp hit flash
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 4, 16, 12); // head & helm
      ctx.fillRect(6, 14, 20, 11); // torso & shoulders
      ctx.fillRect(9, 25, 5, 8); // left leg
      ctx.fillRect(17, 25, 5, 8); // right leg
      this.cache.set(key, canvas);
      return;
    }

    // Stride parameters for unmistakable, lively arcade walking animation
    // Frame 0: Left leg forward stride, right leg trailing back
    // Frame 1: Center passing bounce UP (-2px), cape & plume billowing
    // Frame 2: Right leg forward stride, left leg trailing back
    // Frame 3: Center passing bounce DOWN (+1px), feet passing
    const bob = frame === 1 ? -2 : frame === 3 ? 1 : 0;
    const leftLegY = frame === 0 ? 25 : frame === 1 ? 23 : frame === 2 ? 22 : 24;
    const rightLegY = frame === 0 ? 22 : frame === 1 ? 23 : frame === 2 ? 25 : 24;
    const leftLegH = frame === 0 ? 7 : frame === 1 ? 5 : frame === 2 ? 4 : 5;
    const rightLegH = frame === 0 ? 4 : frame === 1 ? 5 : frame === 2 ? 7 : 5;
    const capeFlutter = frame === 0 ? -3 : frame === 1 ? -1 : frame === 2 ? 3 : 1;
    const weaponSwingY = frame === 0 ? 2 : frame === 2 ? -2 : 0;

    if (heroClass === 'knight') {
      // --- CAPE (Royal Crimson with Dynamic Wind Flutter) ---
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(4 + capeFlutter, 12 + bob, 5, 14);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(5 + capeFlutter, 13 + bob, 4, 13);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(6 + capeFlutter, 14 + bob, 3, 11);
      ctx.fillStyle = '#f59e0b'; // golden bottom hem
      ctx.fillRect(4 + capeFlutter, 25 + bob, 5, 2);

      // --- HEAVY STEEL SABATONS (Armored Striding Legs) ---
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(9, leftLegY + bob, 4, leftLegH);
      ctx.fillRect(17, rightLegY + bob, 4, rightLegH);
      ctx.fillStyle = '#475569';
      ctx.fillRect(9, leftLegY + leftLegH - 2 + bob, 5, 3);
      ctx.fillRect(17, rightLegY + rightLegH - 2 + bob, 5, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(10, leftLegY + leftLegH - 2 + bob, 3, 1);
      ctx.fillRect(18, rightLegY + rightLegH - 2 + bob, 3, 1);

      // --- PLATE BREASTPLATE & PAULDRONS ---
      // Left and right shoulder pauldrons
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 13 + bob, 5, 6);
      ctx.fillRect(19, 13 + bob, 5, 6);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(8, 14 + bob, 3, 4);
      ctx.fillRect(20, 14 + bob, 3, 4);
      ctx.fillStyle = '#f59e0b'; // golden rivets
      ctx.fillRect(7, 13 + bob, 1, 1);
      ctx.fillRect(23, 13 + bob, 1, 1);

      // Torso cuirass
      ctx.fillStyle = '#334155';
      ctx.fillRect(10, 13 + bob, 11, 10);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(11, 14 + bob, 9, 8);
      ctx.fillStyle = '#cbd5e1'; // polished steel chest gleam
      ctx.fillRect(12, 14 + bob, 3, 4);
      ctx.fillStyle = '#f59e0b'; // golden lion insignia
      ctx.fillRect(14, 16 + bob, 3, 3);

      // Belt with lion buckle
      ctx.fillStyle = '#451a03';
      ctx.fillRect(10, 21 + bob, 11, 3);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(14, 21 + bob, 3, 3);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(15, 22 + bob, 1, 1);

      // --- GREAT HELM & GOLDEN CREST ---
      ctx.fillStyle = '#334155';
      ctx.fillRect(9, 3 + bob, 13, 11);
      ctx.fillStyle = '#475569';
      ctx.fillRect(10, 4 + bob, 11, 9);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(11, 4 + bob, 8, 3);
      ctx.fillStyle = '#e2e8f0'; // bright metallic highlight
      ctx.fillRect(12, 4 + bob, 4, 1);

      // Golden Royal Plume / Crest (Sways with step)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(14, 1 + bob, 3, 3);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(14, 0 + bob, 3, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(15, -1 + bob, 2, 2);

      // T-Visor Slit with Cyan/Sky-Blue Glowing Eyes
      ctx.fillStyle = '#090d16';
      ctx.fillRect(11, 8 + bob, 10, 3);
      ctx.fillRect(15, 9 + bob, 2, 4); // vertical nasal guard
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(12, 9 + bob, 3, 1);
      ctx.fillRect(17, 9 + bob, 3, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(13, 9 + bob, 1, 1);
      ctx.fillRect(18, 9 + bob, 1, 1);

      // --- HANDHELD WEAPON (Knight's Steel Broadsword in Right Hand) ---
      ctx.fillStyle = '#451a03'; // leather hilt
      ctx.fillRect(25, 17 + bob + weaponSwingY, 2, 4);
      ctx.fillStyle = '#f59e0b'; // golden pommel & crossguard
      ctx.fillRect(24, 21 + bob + weaponSwingY, 4, 2);
      ctx.fillRect(23, 16 + bob + weaponSwingY, 6, 2);
      ctx.fillStyle = '#dc2626'; // ruby center gem
      ctx.fillRect(25, 16 + bob + weaponSwingY, 2, 2);
      // Gleaming steel blade angled upward
      ctx.fillStyle = '#64748b';
      ctx.fillRect(25, 6 + bob + weaponSwingY, 3, 10);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(25, 6 + bob + weaponSwingY, 2, 10);
      ctx.fillStyle = '#ffffff'; // razor edge shine
      ctx.fillRect(25, 5 + bob + weaponSwingY, 1, 9);
      ctx.fillRect(26, 4 + bob + weaponSwingY, 1, 2); // sword tip

      // --- HANDHELD HEATER SHIELD (Left Arm) ---
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(5, 15 + bob, 5, 8);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(5, 15 + bob, 4, 7);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(6, 16 + bob, 3, 5);
      ctx.fillStyle = '#fbbf24'; // heraldic gold cross on shield
      ctx.fillRect(7, 16 + bob, 1, 5);
      ctx.fillRect(6, 18 + bob, 3, 1);

    } else if (heroClass === 'rogue') {
      // --- SHADOW CLOAK & DUAL TATTERED TAILS ---
      ctx.fillStyle = '#020617';
      ctx.fillRect(5 + capeFlutter, 11 + bob, 4, 13);
      ctx.fillRect(7 + capeFlutter, 16 + bob, 3, 11);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6 + capeFlutter, 12 + bob, 3, 11);

      // --- SLEEK ASSASSIN BOOTS (Striding Legs) ---
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(9, leftLegY + bob, 4, leftLegH);
      ctx.fillRect(17, rightLegY + bob, 4, rightLegH);
      ctx.fillStyle = '#292524';
      ctx.fillRect(9, leftLegY + leftLegH - 2 + bob, 4, 3);
      ctx.fillRect(17, rightLegY + rightLegH - 2 + bob, 4, 3);

      // --- STUDDED LEATHER JERKIN & BANDOLIER ---
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(9, 13 + bob, 13, 10);
      ctx.fillStyle = '#292524';
      ctx.fillRect(10, 14 + bob, 11, 8);
      // Leather bandolier with throwing knives
      ctx.fillStyle = '#78350f';
      ctx.fillRect(11, 14 + bob, 2, 7);
      ctx.fillRect(13, 15 + bob, 2, 6);
      ctx.fillStyle = '#94a3b8'; // throwing dagger hilts
      ctx.fillRect(11, 14 + bob, 2, 1);
      ctx.fillRect(13, 16 + bob, 2, 1);

      // Belt with poison flask pouch
      ctx.fillStyle = '#451a03';
      ctx.fillRect(9, 21 + bob, 13, 3);
      ctx.fillStyle = '#10b981'; // glowing poison vial
      ctx.fillRect(18, 21 + bob, 2, 3);

      // --- HUNTER GREEN LEATHER HOOD & MASK ---
      ctx.fillStyle = '#052e16';
      ctx.fillRect(9, 3 + bob, 13, 11);
      ctx.fillStyle = '#14532d';
      ctx.fillRect(10, 4 + bob, 11, 9);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(11, 4 + bob, 8, 3);
      // Peaked assassin hood tip
      ctx.fillStyle = '#15803d';
      ctx.fillRect(12, 1 + bob, 4, 3);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(13, 0 + bob, 2, 2);

      // Dark face veil & Glowing Emerald Piercing Eyes
      ctx.fillStyle = '#090d16';
      ctx.fillRect(11, 8 + bob, 10, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(12, 9 + bob, 3, 2);
      ctx.fillRect(17, 9 + bob, 3, 2);
      ctx.fillStyle = '#bbf7d0'; // eye highlights
      ctx.fillRect(13, 9 + bob, 1, 1);
      ctx.fillRect(18, 9 + bob, 1, 1);

      // --- WEAPONS: TWIN POISONED DAMASCUS DAGGERS ---
      // Right hand: Main curved dagger pointing forward
      ctx.fillStyle = '#451a03';
      ctx.fillRect(23, 18 + bob, 2, 3);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(22, 17 + bob, 4, 1);
      ctx.fillStyle = '#334155';
      ctx.fillRect(24, 13 + bob, 3, 5);
      ctx.fillStyle = '#10b981'; // venom coated edge
      ctx.fillRect(25, 11 + bob, 2, 5);
      ctx.fillStyle = '#a7f3d0';
      ctx.fillRect(26, 10 + bob, 1, 2); // razor tip

      // Left hand: Reverse-grip stiletto
      ctx.fillStyle = '#451a03';
      ctx.fillRect(6, 17 + bob, 2, 3);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(5, 20 + bob, 2, 5);
      ctx.fillStyle = '#a7f3d0';
      ctx.fillRect(5, 25 + bob, 1, 1);

    } else if (heroClass === 'mage') {
      // --- ASTRAL ARCHMAGE ROBES ---
      ctx.fillStyle = '#0f0a24';
      ctx.fillRect(7, 12 + bob, 17, 14);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(8, 13 + bob, 15, 12);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(10, 14 + bob, 11, 10);
      // Golden Runic Hem & Starlight Embroidery
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(7, 24 + bob, 17, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(11, 24 + bob, 2, 2);
      ctx.fillRect(18, 24 + bob, 2, 2);
      // Floating starlight motes on robe
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(11, 17 + bob, 1, 1);
      ctx.fillRect(19, 16 + bob, 1, 1);
      ctx.fillRect(14, 20 + bob, 1, 1);

      // --- WIZARD HAT WITH CELESTIAL BUCKLE ---
      // Wide curved brim
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(6, 8 + bob, 19, 3);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(8, 7 + bob, 15, 2);
      // Golden hat band & Star Buckle
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(9, 7 + bob, 13, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(14, 6 + bob, 3, 3);
      // Tapering conical curved body
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(9, 3 + bob, 13, 4);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(10, 1 + bob, 9, 3);
      // Floppy curved hat tip
      ctx.fillStyle = '#3730a3';
      ctx.fillRect(8, -1 + bob, 5, 3);
      ctx.fillStyle = '#f59e0b'; // golden star bell on tip
      ctx.fillRect(7, -1 + bob, 2, 2);

      // Mysterious Dark Face & Glowing Cyan Star Eyes
      ctx.fillStyle = '#090d16';
      ctx.fillRect(10, 9 + bob, 11, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(11, 10 + bob, 3, 2);
      ctx.fillRect(17, 10 + bob, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 10 + bob, 1, 1);
      ctx.fillRect(18, 10 + bob, 1, 1);

      // Slippers
      ctx.fillStyle = '#312e81';
      ctx.fillRect(9, leftLegY + bob, 4, leftLegH);
      ctx.fillRect(17, rightLegY + bob, 4, rightLegH);
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(9, leftLegY + leftLegH - 2 + bob, 4, 2);
      ctx.fillRect(17, rightLegY + rightLegH - 2 + bob, 4, 2);

      // --- WEAPONS: ANCIENT RUNIC STAFF (Right Hand) ---
      // Twisted elderwood shaft
      ctx.fillStyle = '#451a03';
      ctx.fillRect(25, 4 + bob + weaponSwingY, 2, 24);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(26, 6 + bob + weaponSwingY, 1, 20);
      // Rooted prongs at head
      ctx.fillStyle = '#b45309';
      ctx.fillRect(23, 2 + bob + weaponSwingY, 6, 2);
      ctx.fillRect(23, 1 + bob + weaponSwingY, 2, 2);
      ctx.fillRect(27, 1 + bob + weaponSwingY, 2, 2);
      // Floating pulsating crystal orb
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(23, -2 + bob + weaponSwingY, 6, 5);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(24, -3 + bob + weaponSwingY, 4, 5);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(24, -2 + bob + weaponSwingY, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, -2 + bob + weaponSwingY, 1, 1);

      // --- LEFTHAND: FLOATING ARCANE GRIMOIRE (SPELLBOOK) ---
      ctx.fillStyle = '#581c87';
      ctx.fillRect(4, 16 + bob, 4, 6);
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(5, 17 + bob, 3, 4);
      ctx.fillStyle = '#f59e0b'; // gold corner clasp
      ctx.fillRect(4, 16 + bob, 1, 1);
      ctx.fillRect(4, 21 + bob, 1, 1);
      ctx.fillStyle = '#38bdf8'; // glowing magic bookmark
      ctx.fillRect(5, 21 + bob, 1, 3);
    }

    this.cache.set(key, canvas);
  }

  // --- 2. SLIME SPRITE (Glossy Translucent Emerald) ---
  private bakeSlime(type: 'SLIME' | 'MINI_SLIME', isFlash: boolean) {
    const isMini = type === 'MINI_SLIME';
    const w = isMini ? 18 : 26;
    const h = isMini ? 16 : 22;
    const [canvas, ctx] = this.createOffscreen(w, h);
    const key = `${type}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 2, w - 4, h - 4);
      this.cache.set(key, canvas);
      return;
    }

    // Outer dark translucent membrane
    ctx.fillStyle = '#052e16';
    ctx.fillRect(2, 4, w - 4, h - 5);
    ctx.fillRect(4, 2, w - 8, h - 3);

    // Lush Emerald gelatinous body
    ctx.fillStyle = '#15803d';
    ctx.fillRect(3, 4, w - 6, h - 6);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(4, 3, w - 8, h - 6);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(5, 3, w - 10, 4); // glossy top dome shine
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(6, 2, Math.max(3, w - 14), 2); // bright specular glint

    // Internal suspended magic bubble
    ctx.fillStyle = '#86efac';
    ctx.fillRect(isMini ? 6 : 9, isMini ? 7 : 10, 2, 2);

    // Expressive glowing eyes
    const eyeY = isMini ? 6 : 8;
    const eyeSize = isMini ? 2 : 3;
    const leftX = isMini ? 4 : 6;
    const rightX = isMini ? 11 : 16;

    ctx.fillStyle = '#022c22';
    ctx.fillRect(leftX, eyeY, eyeSize, eyeSize);
    ctx.fillRect(rightX, eyeY, eyeSize, eyeSize);
    ctx.fillStyle = '#ffffff'; // anime glint
    ctx.fillRect(leftX, eyeY, 1, 1);
    ctx.fillRect(rightX, eyeY, 1, 1);

    this.cache.set(key, canvas);
  }

  // --- 3. SKELETON ARCHER (Detailed Bone Archer with Quiver) ---
  private bakeSkeleton(frame: number, isFlash: boolean) {
    const [canvas, ctx] = this.createOffscreen(26, 30);
    const key = `skeleton_${frame}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 18, 22);
      this.cache.set(key, canvas);
      return;
    }

    const bob = frame === 1 ? 1 : 0;

    // Bone Quiver on Back
    ctx.fillStyle = '#78350f';
    ctx.fillRect(16, 8 + bob, 4, 10);
    ctx.fillStyle = '#dc2626'; // arrow fletching feathers
    ctx.fillRect(16, 5 + bob, 2, 3);
    ctx.fillRect(18, 6 + bob, 2, 3);

    // Skull
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(7, 3 + bob, 11, 9);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(8, 4 + bob, 9, 7);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(9, 4 + bob, 6, 2); // forehead highlight
    // Glowing Crimson Eye Sockets
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(9, 7 + bob, 3, 3);
    ctx.fillRect(14, 7 + bob, 3, 3);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 8 + bob, 1, 1);
    ctx.fillRect(15, 8 + bob, 1, 1);
    // Teeth / Jaw
    ctx.fillStyle = '#475569';
    ctx.fillRect(10, 11 + bob, 6, 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(10, 11 + bob, 1, 1);
    ctx.fillRect(12, 11 + bob, 1, 1);
    ctx.fillRect(14, 11 + bob, 1, 1);

    // Ribcage & Spine
    ctx.fillStyle = '#64748b';
    ctx.fillRect(10, 12 + bob, 6, 8);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(9, 13 + bob, 8, 1);
    ctx.fillRect(9, 15 + bob, 8, 1);
    ctx.fillRect(10, 17 + bob, 6, 1);
    ctx.fillStyle = '#475569';
    ctx.fillRect(12, 12 + bob, 2, 8); // spine column

    // Pelvis & Legs
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(9, 19 + bob, 8, 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(9, 21 + bob, 2, 8 + (frame === 1 ? -1 : 1));
    ctx.fillRect(15, 21 + bob, 2, 8 + (frame === 1 ? 1 : -1));

    // Carved Bone Bow in Hand
    ctx.fillStyle = '#78350f';
    ctx.fillRect(3, 7 + bob, 2, 15);
    ctx.fillRect(4, 6 + bob, 2, 2);
    ctx.fillRect(4, 21 + bob, 2, 2);
    ctx.fillStyle = '#e2e8f0'; // bow string
    ctx.fillRect(5, 7 + bob, 1, 15);

    this.cache.set(key, canvas);
  }

  // --- 4. GOBLIN BERSERKER (Dual-Bladed Rage Colossus) ---
  private bakeBerserker(frame: number, isFlash: boolean) {
    const [canvas, ctx] = this.createOffscreen(28, 32);
    const key = `berserker_${frame}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 20, 24);
      this.cache.set(key, canvas);
      return;
    }

    const bob = frame === 1 ? 1 : 0;

    // Horned War Helmet (Dark Crimson & Spiked Iron)
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(7, 3 + bob, 14, 10);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(8, 4 + bob, 12, 8);
    // Wicked Horns
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(4, 1 + bob, 4, 5);
    ctx.fillRect(20, 1 + bob, 4, 5);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(3, 0 + bob, 2, 3);
    ctx.fillRect(23, 0 + bob, 2, 3);

    // Flaming Orange Rage Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(9, 8 + bob, 10, 3);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(10, 8 + bob, 3, 2);
    ctx.fillRect(15, 8 + bob, 3, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(11, 8 + bob, 1, 1);
    ctx.fillRect(16, 8 + bob, 1, 1);

    // Muscular Brute Torso & Spiked Iron Armbands
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(6, 13 + bob, 16, 9);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(7, 14 + bob, 14, 7);
    ctx.fillStyle = '#334155'; // iron armbands
    ctx.fillRect(4, 14 + bob, 3, 4);
    ctx.fillRect(21, 14 + bob, 3, 4);

    // Heavy Studded Belt
    ctx.fillStyle = '#451a03';
    ctx.fillRect(6, 20 + bob, 16, 3);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(12, 20 + bob, 4, 3);

    // Massive Serrated Battle Axe in Hand
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1, 5 + bob, 6, 10);
    ctx.fillStyle = '#475569';
    ctx.fillRect(2, 6 + bob, 4, 8);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(1, 7 + bob, 1, 6); // serrated blade notches
    // Heavy axe shaft
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 11 + bob, 2, 16);

    // Heavy Boots
    ctx.fillStyle = '#292524';
    ctx.fillRect(8, 23 + bob, 5, 7 + (frame === 1 ? -1 : 1));
    ctx.fillRect(16, 23 + bob, 5, 7 + (frame === 1 ? 1 : -1));

    this.cache.set(key, canvas);
  }

  // --- 5. DARK MAGE (Sinister Floating Warlock) ---
  private bakeMage(frame: number, isFlash: boolean) {
    const [canvas, ctx] = this.createOffscreen(26, 32);
    const key = `mage_${frame}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 18, 24);
      this.cache.set(key, canvas);
      return;
    }

    const bob = frame === 1 ? 1 : 0;

    // Flowing Void Robe (Royal Violet & Cursed Shadows)
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(5, 7 + bob, 16, 21);
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(6, 8 + bob, 14, 19);
    ctx.fillStyle = '#581c87';
    ctx.fillRect(8, 10 + bob, 10, 16);
    // Tattered hem notches
    ctx.fillStyle = '#090d16';
    ctx.fillRect(6, 27 + bob, 2, 2);
    ctx.fillRect(10, 26 + bob, 2, 3);
    ctx.fillRect(15, 27 + bob, 2, 2);
    ctx.fillRect(19, 26 + bob, 2, 3);

    // Horned Warlock Cowl
    ctx.fillStyle = '#1e0847';
    ctx.fillRect(7, 3 + bob, 12, 9);
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(8, 4 + bob, 10, 8);
    // Horned peaks
    ctx.fillStyle = '#581c87';
    ctx.fillRect(6, 1 + bob, 3, 4);
    ctx.fillRect(17, 1 + bob, 3, 4);

    // Shadow Face & Sinister Glowing Amethyst Eyes
    ctx.fillStyle = '#090514';
    ctx.fillRect(9, 7 + bob, 8, 4);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(10, 8 + bob, 2, 2);
    ctx.fillRect(14, 8 + bob, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 8 + bob, 1, 1);
    ctx.fillRect(14, 8 + bob, 1, 1);

    // Cursed Shadow Staff (Topped with Glowing Void Flame)
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(2, 6 + bob, 2, 22);
    // Skull staff head
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(1, 4 + bob, 4, 3);
    // Glowing purple flame
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(0, 0 + bob + (frame === 1 ? -1 : 0), 6, 5);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(1, 1 + bob + (frame === 1 ? -1 : 0), 4, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 1 + bob + (frame === 1 ? -1 : 0), 2, 2);

    this.cache.set(key, canvas);
  }

  // --- 6. BOSS GOLEM (Massive Stone Colossus with 4 Animated Walk/Stomp Frames) ---
  private bakeBossGolem(frame: number, isEnraged: boolean, isFlash: boolean) {
    const [canvas, ctx] = this.createOffscreen(56, 60);
    const key = `boss_${isEnraged ? 'enraged' : 'normal'}_${frame}_${isFlash ? 'flash' : 'normal'}`;

    if (isFlash) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 48, 52);
      this.cache.set(key, canvas);
      return;
    }

    // Dynamic animated walking & stomping parameters
    const bob = frame === 1 ? -2 : frame === 3 ? 1 : 0;
    const leftLegY = frame === 0 ? 43 : frame === 1 ? 40 : frame === 2 ? 39 : 41;
    const rightLegY = frame === 0 ? 39 : frame === 1 ? 40 : frame === 2 ? 43 : 41;
    const leftLegH = frame === 0 ? 11 : frame === 1 ? 14 : frame === 2 ? 15 : 13;
    const rightLegH = frame === 0 ? 15 : frame === 1 ? 14 : frame === 2 ? 11 : 13;
    const leftArmY = frame === 0 ? 22 : frame === 1 ? 25 : frame === 2 ? 29 : 27;
    const rightArmY = frame === 0 ? 29 : frame === 1 ? 25 : frame === 2 ? 22 : 27;

    // Colossal Horned Stone Crown
    ctx.fillStyle = isEnraged ? '#7f1d1d' : '#1e293b';
    ctx.fillRect(16, 4 + bob, 24, 15);
    ctx.fillStyle = isEnraged ? '#b91c1c' : '#334155';
    ctx.fillRect(18, 6 + bob, 20, 11);
    ctx.fillStyle = isEnraged ? '#ea580c' : '#475569';
    ctx.fillRect(13, 2 + bob, 6, 8);
    ctx.fillRect(37, 2 + bob, 6, 8);

    // Glowing Golem Eyes (Fiercer during stride)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(20, 11 + bob, 16, 4);
    ctx.fillStyle = isEnraged ? '#f97316' : '#38bdf8';
    ctx.fillRect(22, 12 + bob, 4, 2);
    ctx.fillRect(30, 12 + bob, 4, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 12 + bob, 2, 2);
    ctx.fillRect(31, 12 + bob, 2, 2);

    // Massive Stone Shoulders & Chest
    ctx.fillStyle = isEnraged ? '#3b0d0c' : '#0f172a';
    ctx.fillRect(8, 19 + bob, 40, 22);
    ctx.fillStyle = isEnraged ? '#591614' : '#334155';
    ctx.fillRect(10, 20 + bob, 36, 20);

    // Glowing Rune Core in chest (Pulsates molten lava when enraged)
    const corePulse = frame % 2 === 1;
    ctx.fillStyle = isEnraged ? (corePulse ? '#f97316' : '#ea580c') : (corePulse ? '#06b6d4' : '#0891b2');
    ctx.fillRect(24, 24 + bob, 8, 8);
    ctx.fillStyle = isEnraged ? '#fbbf24' : '#67e8f9';
    ctx.fillRect(25, 25 + bob, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(27, 27 + bob, 2, 2);

    // Magma Cracks when enraged, or Ancient Moss/Vines when normal
    if (isEnraged) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(12, 23 + bob, 8, 2);
      ctx.fillRect(34, 25 + bob, 8, 2);
      ctx.fillRect(16, 32 + bob, 6, 2);
      ctx.fillRect(30, 33 + bob, 8, 2);
    } else {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(12, 21 + bob, 5, 3);
      ctx.fillRect(34, 22 + bob, 6, 4);
    }

    // Giant Heavy Stone Fists (Swinging with stomp cadence)
    ctx.fillStyle = isEnraged ? '#591614' : '#475569';
    ctx.fillRect(4, leftArmY + bob, 8, 16);
    ctx.fillRect(44, rightArmY + bob, 8, 16);
    ctx.fillStyle = isEnraged ? '#991b1b' : '#64748b';
    ctx.fillRect(5, leftArmY + 10 + bob, 6, 6);
    ctx.fillRect(45, rightArmY + 10 + bob, 6, 6);

    // Heavy Stone Legs (Striding & Ground contact)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, leftLegY + bob, 10, leftLegH);
    ctx.fillRect(30, rightLegY + bob, 10, rightLegH);
    ctx.fillStyle = '#475569';
    ctx.fillRect(15, leftLegY + leftLegH - 4 + bob, 12, 5);
    ctx.fillRect(29, rightLegY + rightLegH - 4 + bob, 12, 5);

    this.cache.set(key, canvas);
  }

  // --- BOULDER PROJECTILE ---
  private bakeBoulder() {
    const [canvas, ctx] = this.createOffscreen(20, 20);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(10, 10, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(9, 9, 7, 0, Math.PI * 2);
    ctx.fill();

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
    // 64x64 Multi-Stone Authentic Pixel Art Layout
    const slabs = [
      { x: 1, y: 1, w: 29, h: 18 },
      { x: 32, y: 1, w: 31, h: 18 },
      { x: 1, y: 21, w: 19, h: 22 },
      { x: 22, y: 21, w: 21, h: 22 },
      { x: 45, y: 21, w: 18, h: 22 },
      { x: 1, y: 45, w: 27, h: 18 },
      { x: 30, y: 45, w: 33, h: 18 },
    ];

    // Helper to render authentic pixel art beveled stone pavers
    const drawStoneSlabs = (
      ctx: CanvasRenderingContext2D,
      bg: string,
      baseColor: string,
      surfaceColor: string,
      hiColor: string,
      darkColor: string,
      moss1: string,
      moss2: string
    ) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 64, 64);

      for (const s of slabs) {
        // Deep shadow base
        ctx.fillStyle = darkColor;
        ctx.fillRect(s.x, s.y, s.w, s.h);

        // Stone body
        ctx.fillStyle = baseColor;
        ctx.fillRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);

        // Surface texture
        ctx.fillStyle = surfaceColor;
        ctx.fillRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);

        // 3D Top/Left Chiseled Highlight
        ctx.fillStyle = hiColor;
        ctx.fillRect(s.x + 1, s.y + 1, s.w - 2, 1);
        ctx.fillRect(s.x + 1, s.y + 1, 1, s.h - 2);

        // 3D Bottom/Right Mortar Shadow
        ctx.fillStyle = darkColor;
        ctx.fillRect(s.x + 1, s.y + s.h - 2, s.w - 2, 1);
        ctx.fillRect(s.x + s.w - 2, s.y + 1, 1, s.h - 2);

        // Chiseled surface pits
        ctx.fillStyle = darkColor;
        ctx.fillRect(s.x + 5, s.y + 5, 2, 1);
        ctx.fillRect(s.x + s.w - 6, s.y + s.h - 6, 2, 1);
        ctx.fillStyle = hiColor;
        ctx.fillRect(s.x + 7, s.y + 5, 1, 1);
      }

      // Authentic moss & crevice weeds
      ctx.fillStyle = moss1;
      ctx.fillRect(30, 16, 3, 3);
      ctx.fillRect(20, 20, 3, 2);
      ctx.fillRect(43, 42, 3, 3);
      ctx.fillRect(28, 44, 3, 2);
      ctx.fillStyle = moss2;
      ctx.fillRect(31, 17, 1, 1);
      ctx.fillRect(21, 21, 1, 1);
      ctx.fillRect(44, 43, 1, 1);
    };

    // 1. CATACOMBS - Weathered Ancient Slate, Emerald Moss & Chiseled Runes
    {
      const [canvas, ctx] = this.createOffscreen(64, 64);
      drawStoneSlabs(
        ctx,
        '#030712', // deep black mortar
        '#1e293b', // slate shadow
        '#334155', // slate surface
        '#64748b', // crisp stone highlight
        '#090d16', // shadow bevel
        '#047857', // moss deep
        '#10b981'  // moss bright
      );

      // Cracked stone fissure details
      ctx.fillStyle = '#090d16';
      ctx.fillRect(12, 6, 1, 4);
      ctx.fillRect(13, 10, 1, 4);
      ctx.fillRect(38, 28, 4, 1);
      ctx.fillRect(42, 29, 3, 1);

      // Chiseled ancient floor rune on central slab
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(28, 28, 8, 8);
      ctx.fillStyle = '#059669';
      ctx.fillRect(30, 30, 4, 4);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(31, 31, 2, 2);

      this.cache.set('floor_catacombs', canvas);
      this.cache.set('floor_tile', canvas);
    }

    // 2. MAGMA FORGE - Scorched Basalt, Molten Seams & Glowing Magma Veins
    {
      const [canvas, ctx] = this.createOffscreen(64, 64);
      drawStoneSlabs(
        ctx,
        '#450a0a', // glowing scorched mortar
        '#18181b', // basalt black
        '#27272a', // dark basalt face
        '#52525b', // basalt rim highlight
        '#09090b', // deep soot
        '#7c2d12', // scorched crust
        '#b45309'  // glowing ember dust
      );

      // Molten Lava Seams in mortar gaps
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 19, 64, 2);
      ctx.fillRect(0, 43, 64, 2);
      ctx.fillRect(20, 20, 2, 24);
      ctx.fillRect(43, 20, 2, 24);

      // Intense yellow-orange magma cores
      ctx.fillStyle = '#f97316';
      ctx.fillRect(8, 19, 14, 1);
      ctx.fillRect(36, 19, 18, 1);
      ctx.fillRect(14, 43, 22, 1);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(14, 19, 4, 1);
      ctx.fillRect(44, 19, 5, 1);
      ctx.fillRect(24, 43, 6, 1);

      this.cache.set('floor_magma', canvas);
    }

    // 3. SUNKEN CRYPT - Drowned Jade Flagstones, Teal Algae & Water Ripples
    {
      const [canvas, ctx] = this.createOffscreen(64, 64);
      drawStoneSlabs(
        ctx,
        '#022c22', // deep water trench
        '#115e59', // jade body
        '#134e4a', // submerged face
        '#2dd4bf', // shimmering wet highlight
        '#042f2e', // water shadow
        '#0f766e', // aquatic algae
        '#5eead4'  // water droplet glint
      );

      // Water sheen ripple glints
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(10, 8, 3, 1);
      ctx.fillRect(42, 10, 4, 1);
      ctx.fillRect(26, 32, 3, 1);
      ctx.fillRect(50, 52, 4, 1);

      this.cache.set('floor_sunken', canvas);
    }

    // 4. OBSIDIAN SANCTUM - Polished Violet Marble, Golden Grout & Crystal Glints
    {
      const [canvas, ctx] = this.createOffscreen(64, 64);
      drawStoneSlabs(
        ctx,
        '#1e1b4b', // royal indigo mortar
        '#2e1065', // violet marble body
        '#3b0764', // polished face
        '#7c3aed', // purple edge glow
        '#090514', // deep obsidian
        '#ca8a04', // golden filigree inlay
        '#facc15'  // gold sparkle
      );

      // Gilded corner florets
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(30, 19, 3, 3);
      ctx.fillRect(20, 43, 3, 3);
      ctx.fillRect(43, 43, 3, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(31, 20, 1, 1);

      this.cache.set('floor_obsidian', canvas);
    }

    // 5. ROYAL CITADEL - Imperial Fortress Paving, Red Heraldic Borders & Gold Studs
    {
      const [canvas, ctx] = this.createOffscreen(64, 64);
      drawStoneSlabs(
        ctx,
        '#1c1917', // heavy soot mortar
        '#292524', // granite slab
        '#44403c', // fortress stone
        '#78716c', // polished stone rim
        '#0c0a09', // granite shadow
        '#991b1b', // crimson heraldic wash
        '#f59e0b'  // bronze floor bolt
      );

      // Red royal floor borders & bronze studs
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 19, 64, 2);
      ctx.fillRect(0, 43, 64, 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(21, 20, 2, 2);
      ctx.fillRect(44, 20, 2, 2);
      ctx.fillRect(29, 44, 2, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(21, 20, 1, 1);
      ctx.fillRect(44, 20, 1, 1);

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

  // Smooth Ambient Occlusion Drop Shadow for all entities
  public drawDropShadow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    alpha: number = 0.38
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(3, 7, 18, ${alpha})`;
    ctx.fill();
    ctx.restore();
  }

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
      lungeX = Math.cos(attackAngle) * peak * 6.0;
      lungeY = Math.sin(attackAngle) * peak * 4.5;
      attackLean = (facing === 'right' ? 1 : -1) * peak * 0.18;
      attackScaleX = 1.0 + peak * 0.16;
      attackScaleY = 1.0 - peak * 0.09;
    }

    // 2. Idle Breathing Animation (Rhythmic chest expansion) vs Running Tilt
    let idleBobY = 0;
    let idleScaleY = 1;
    let runTilt = 0;
    if (isIdle && !isAttacking && !isDashing) {
      const breathe = Math.sin(performance.now() * 0.0055);
      idleBobY = breathe * 0.8;
      idleScaleY = 1.0 + breathe * 0.035;
    } else if (!isAttacking && !isDashing) {
      // Energetic forward tilt while running
      runTilt = (facing === 'right' ? 1 : -1) * 0.06;
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
    } else if (runTilt !== 0) {
      ctx.rotate(facing === 'left' ? -runTilt : runTilt);
    }

    ctx.scale(attackScaleX, attackScaleY * idleScaleY);

    if (isDashing) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, -20, -19, 36, 38);
      ctx.globalAlpha = 1.0;
    }

    // Center 32x34 player sprite cleanly over physics collision center
    ctx.drawImage(img, -16, -17, 32, 34);
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
    ctx.drawImage(img, -16, -17, 32, 34);
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
      // Cosmic Arcane Nova Burst (Expanding Rune Arc & Starlight Specks)
      const radius = 42;
      ctx.beginPath();
      ctx.arc(0, 0, radius, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.strokeStyle = hasFire ? '#ea580c' : '#7c3aed';
      ctx.lineWidth = 10 * (1 - progress);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius - 2, -Math.PI * 0.38, Math.PI * 0.38);
      ctx.strokeStyle = hasFire ? '#f97316' : '#38bdf8';
      ctx.lineWidth = 5 * (1 - progress);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius - 4, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5 * (1 - progress);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (heroClass === 'rogue') {
      // Twin Venom Emerald Cross-Slices
      const radius = 32;
      const sweep = Math.PI * 0.95;
      const startAngle = -sweep / 2 + progress * sweep * 0.25;
      const endAngle = startAngle + sweep * (1 - progress * 0.25);

      // Primary venom blade trail
      ctx.beginPath();
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.strokeStyle = hasFire ? '#f97316' : '#10b981';
      ctx.lineWidth = 6 * (1 - progress);
      ctx.lineCap = 'round';
      ctx.stroke();

      // Secondary reverse cross-cut slice
      ctx.beginPath();
      ctx.arc(0, 0, radius - 6, startAngle + 0.15, endAngle - 0.15);
      ctx.strokeStyle = hasFire ? '#fef08a' : '#6ee7b7';
      ctx.lineWidth = 3.5 * (1 - progress);
      ctx.stroke();

      // Blade Core Gleam
      const bladeLen = 22;
      ctx.rotate(startAngle + sweep * 0.88);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(6, -2, bladeLen, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, -1, bladeLen - 3, 2);
      ctx.restore();
      return;
    }

    // Knight's Heavy Golden Steel Crescent Cleave
    const radius = 38;
    const sweep = Math.PI * 0.82;
    const startAngle = -sweep / 2 + progress * sweep * 0.3;
    const endAngle = startAngle + sweep * (1 - progress * 0.3);

    // Outer Heavy Slicing Edge
    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.strokeStyle = hasFire ? '#ea580c' : '#38bdf8';
    ctx.lineWidth = 8 * (1 - progress);
    ctx.lineCap = 'round';
    ctx.stroke();

    // Hot Molten / Golden Core
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2, startAngle + 0.08, endAngle - 0.08);
    ctx.strokeStyle = hasFire ? '#f97316' : '#fbbf24';
    ctx.lineWidth = 5 * (1 - progress);
    ctx.stroke();

    // White-Hot Razor Center
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, startAngle + 0.15, endAngle - 0.15);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5 * (1 - progress);
    ctx.stroke();

    // Sword Blade Model
    const bladeLen = 32;
    ctx.rotate(startAngle + sweep * 0.86);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(6, -2, bladeLen, 4);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(8, -1, bladeLen - 2, 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(4, -4, 4, 8);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, -2, 5, 4);

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
      const f = (enemy.animFrame || 0) % 2;
      key = `skeleton_${f}_${isFlash ? 'flash' : 'normal'}`;
    } else if (enemy.type === 'BERSERKER') {
      const f = (enemy.animFrame || 0) % 2;
      key = `berserker_${f}_${isFlash ? 'flash' : 'normal'}`;
    } else if (enemy.type === 'MAGE') {
      const f = (enemy.animFrame || 0) % 2;
      key = `mage_${f}_${isFlash ? 'flash' : 'normal'}`;
    } else if (enemy.type === 'BOSS_GOLEM') {
      const isEnraged = (enemy.hp && enemy.maxHp) ? enemy.hp <= enemy.maxHp * 0.5 : false;
      const f = (enemy.animFrame || 0) % 4;
      key = `boss_${isEnraged ? 'enraged' : 'normal'}_${f}_${isFlash ? 'flash' : 'normal'}`;
    }

    const img = this.cache.get(key);
    if (!img) return;

    ctx.save();

    // Dark Mage Floating Wave
    let hoverY = 0;
    if (enemy.type === 'MAGE') {
      hoverY = Math.sin(performance.now() * 0.005 + enemy.x * 0.1) * 3.5;
    }

    ctx.translate(enemy.x, enemy.y + hoverY);
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

  public drawProp(ctx: CanvasRenderingContext2D, type: 'pot' | 'chest' | 'crate' | 'urn' | 'crystal' | 'anvil' | 'skull_pile', x: number, y: number, isOpen: boolean = false) {
    const key = type === 'chest' ? `chest_${isOpen ? 'open' : 'closed'}` : type;
    const img = this.cache.get(key);
    if (!img) return;
    ctx.drawImage(img, x - img.width / 2, y - img.height / 2);
  }

  public drawPickup(ctx: CanvasRenderingContext2D, type: 'heart' | 'coin' | 'gem' | 'potion', x: number, y: number, bobTimer: number) {
    const key = type === 'potion' ? 'heart' : type;
    const img = this.cache.get(key);
    if (!img) return;
    const bob = Math.sin(bobTimer * 4) * 3;
    ctx.drawImage(img, x - img.width / 2, y - img.height / 2 + bob);
  }
}

export const spriteRenderer = new SpriteRenderer();
