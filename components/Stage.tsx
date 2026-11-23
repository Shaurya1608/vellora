'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Navigation from './Navigation';
import HeroLayer from './HeroLayer';
import IngredientsLayer from './IngredientsLayer';
import BenefitsLayer from './BenefitsLayer';
import SceneLayer from './SceneLayer';
import ProductPin from './ProductPin';

const SHEET1_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261123_060932_f7a02a74-f897-4398-b9ab-96ef9898e8bc.png&w=1024&q=85';
const SHEET2_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261123_060932_90850cb3-1ec6-4622-b548-a8ca88dd30f0.png&w=1024&q=85';

const JAR_RAW_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261123_061027_50e61758-34cf-4e20-b115-380d40ae9a87.png&w=1024&q=85';
const HAND_RAW_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261123_061028_dd300bd1-4172-4809-abac-c1b9e7660381.png&w=1024&q=85';

const JAR_CROP = { x: 214, y: 158, w: 592, h: 680 };
const HAND_CROP = { x: 0, y: 240, w: 858, h: 262 };
const JAR_R = 910 / 669;
const HAND_R = 262 / 858;

// Cubic Bezier Solvers
function createCubicBezier(x1: number, y1: number, x2: number, y2: number) {
  function sampleX(t: number) {
    return ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + 3 * x1 * t;
  }
  function sampleY(t: number) {
    return ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * t + 3 * y1 * t;
  }
  function sampleDerivX(t: number) {
    return (3 * (1 - 3 * x2 + 3 * x1) * t + 2 * (3 * x2 - 6 * x1)) * t + 3 * x1;
  }
  return function (x: number) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX = sampleX(t) - x;
      if (Math.abs(currentX) < 1e-5) return sampleY(t);
      const d = sampleDerivX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= currentX / d;
    }
    let t0 = 0,
      t1 = 1;
    t = x;
    while (t0 < t1) {
      const currentX = sampleX(t);
      if (Math.abs(currentX - x) < 1e-5) return sampleY(t);
      if (x > currentX) t0 = t;
      else t1 = t;
      t = (t1 + t0) / 2;
    }
    return sampleY(t);
  };
}

const EJ = createCubicBezier(0.3, 0, 0.05, 1);
const EP = createCubicBezier(0.3, 0, 0.15, 1);
const EF = createCubicBezier(0.25, 0.1, 0.25, 1);
const EY = createCubicBezier(0.5, 0, 0.1, 1);
const EINTRO = createCubicBezier(0.5, 0, 0, 1);

class Channel {
  current: number;
  target: number;
  from: number;
  startTime: number;
  duration: number;
  delay: number;
  ease: (t: number) => number;
  active: boolean;

  constructor(initialValue: number) {
    this.current = initialValue;
    this.target = initialValue;
    this.from = initialValue;
    this.startTime = 0;
    this.duration = 0;
    this.delay = 0;
    this.ease = (t) => t;
    this.active = false;
  }

  set(target: number, duration: number, ease?: (t: number) => number, delay = 0) {
    this.from = this.current;
    this.target = target;
    this.duration = duration;
    this.delay = delay;
    this.ease = ease || ((t) => t);
    this.startTime = performance.now() + delay;
    this.active = true;
    if (duration <= 0) {
      this.current = target;
      this.active = false;
    }
  }

  update(now: number) {
    if (!this.active) return this.current;
    if (now < this.startTime) return this.current;
    const elapsed = now - this.startTime;
    if (elapsed >= this.duration) {
      this.current = this.target;
      this.active = false;
      return this.current;
    }
    const progress = elapsed / this.duration;
    const eased = this.ease(progress);
    this.current = this.from + (this.target - this.from) * eased;
    return this.current;
  }

  snap(val: number) {
    this.current = val;
    this.target = val;
    this.active = false;
  }
}

export default function Stage() {
  const [stageClass, setStageClass] = useState('stage');
  const [activeScene, setActiveScene] = useState(0);
  const [navLight, setNavLight] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLHeadingElement>(null);
  const heroFrameRef = useRef<HTMLDivElement>(null);
  const vidARef = useRef<HTMLVideoElement>(null);
  const vidBRef = useRef<HTMLVideoElement>(null);
  const beneRowsRef = useRef<HTMLDivElement>(null);
  const jarRef = useRef<HTMLImageElement>(null);
  const handRef = useRef<HTMLImageElement>(null);

  const channelsRef = useRef({
    jarX: new Channel(720),
    jarY: new Channel(505),
    jarW: new Channel(205),
    hero: new Channel(1),
    bene: new Channel(0),
    handOut: new Channel(0),
    rows: new Channel(0),
    scene: new Channel(0),
  });

  const stateRef = useRef({
    currentState: 0,
    isInputLocked: false,
    introOffset: 0,
    introStartTime: 0,
    isIntroRunning: true,
    vw: 1440,
    vh: 900,
    isPortrait: false,
    s: 1,
    c: 1,
    fl: 0,
    ft: 0,
    ul: 0,
    ut: 0,
    K0: { x: 720, y: 505, w: 205 },
    K1: { x: 720, y: 1012, w: 466 },
    K2: { x: 465, y: 640, w: 300 },
    K4: { x: 720, y: 510, w: 145 },
    hw: 900,
    hx0: 0,
    handTop: 0,
    W_JAR: 466,
  });

  const timersRef = useRef<{
    ingr?: NodeJS.Timeout;
    bene?: NodeJS.Timeout;
    scene?: NodeJS.Timeout;
  }>({});

  // Clean Cutout utility
  const cleanCutout = useCallback((url: string, crop: { x: number; y: number; w: number; h: number }) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = crop.w;
          canvas.height = crop.h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return resolve(url);

          ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
          const w = crop.w;
          const h = crop.h;

          // 2 Erode passes
          for (let pass = 0; pass < 2; pass++) {
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            const orig = new Uint8Array(d.length / 4);
            for (let i = 0; i < orig.length; i++) orig[i] = d[i * 4 + 3];

            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const i = y * w + x;
                let minA = orig[i];
                if (x > 0) minA = Math.min(minA, orig[i - 1]);
                if (x < w - 1) minA = Math.min(minA, orig[i + 1]);
                if (y > 0) minA = Math.min(minA, orig[i - w]);
                if (y < h - 1) minA = Math.min(minA, orig[i + w]);
                d[i * 4 + 3] = minA;
              }
            }
            ctx.putImageData(imgData, 0, 0);
          }

          // 1 Feather pass
          const imgDataF = ctx.getImageData(0, 0, w, h);
          const df = imgDataF.data;
          const origF = new Uint8Array(df.length / 4);
          for (let i = 0; i < origF.length; i++) origF[i] = df[i * 4 + 3];

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const i = y * w + x;
              let sum = origF[i] * 4;
              let samples = 4;
              if (x > 0) {
                sum += origF[i - 1];
                samples++;
              }
              if (x < w - 1) {
                sum += origF[i + 1];
                samples++;
              }
              if (y > 0) {
                sum += origF[i - w];
                samples++;
              }
              if (y < h - 1) {
                sum += origF[i + w];
                samples++;
              }
              df[i * 4 + 3] = Math.round(sum / samples);
            }
          }
          ctx.putImageData(imgDataF, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              resolve(url);
            }
          }, 'image/webp', 0.92);
        } catch (e) {
          resolve(url);
        }
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }, []);

  // Compute Layout & Coordinates
  const computeLayout = useCallback(() => {
    const sState = stateRef.current;
    sState.vw = window.innerWidth;
    sState.vh = stageRef.current?.clientHeight || window.innerHeight;
    sState.isPortrait = sState.vw / sState.vh < 0.9;

    const s = Math.max(sState.vw / 1440, sState.vh / 900);
    const fl = (sState.vw - 1440 * s) / 2;
    const ft = (sState.vh - 900 * s) / 2;

    const c = Math.min(sState.vw / 1440, sState.vh / 900);
    const ul = (sState.vw - 1440 * c) / 2;
    const ut = (sState.vh - 900 * c) / 2;

    sState.s = s;
    sState.c = c;
    sState.fl = fl;
    sState.ft = ft;
    sState.ul = ul;
    sState.ut = ut;

    document.documentElement.style.setProperty('--s', `${s}px`);
    document.documentElement.style.setProperty('--c', `${c}px`);
    document.documentElement.style.setProperty('--fl', `${fl}px`);
    document.documentElement.style.setProperty('--ft', `${ft}px`);
    document.documentElement.style.setProperty('--ut', `${ut}px`);

    const nav = document.getElementById('nav');
    const navBottom = nav ? nav.getBoundingClientRect().bottom : 50;
    document.documentElement.style.setProperty('--nav-bottom', `${navBottom}px`);

    if (!sState.isPortrait) {
      // Desktop / Landscape
      const chipSize = Math.max(44, 116 * c);
      const cnSize = Math.max(12, 21 * c);
      const csSize = Math.max(11, 17.5 * c);
      const rtSize = Math.max(48, 96 * c);
      const rhSize = Math.max(14, 25 * c);
      const rpSize = Math.max(11, 16.5 * c);
      const rgSize = Math.max(14, 40 * c);
      const rwSize = Math.max(200, 330 * c);
      const thSize = Math.max(17, 34 * c);
      const tfSize = Math.max(12, 16 * c);
      const tbSize = Math.max(16, 30 * c);

      document.documentElement.style.setProperty('--chip', `${chipSize}px`);
      document.documentElement.style.setProperty('--cn', `${cnSize}px`);
      document.documentElement.style.setProperty('--cs', `${csSize}px`);
      document.documentElement.style.setProperty('--rt', `${rtSize}px`);
      document.documentElement.style.setProperty('--rh', `${rhSize}px`);
      document.documentElement.style.setProperty('--rp', `${rpSize}px`);
      document.documentElement.style.setProperty('--rg', `${rgSize}px`);
      document.documentElement.style.setProperty('--rw', `${rwSize}px`);
      document.documentElement.style.setProperty('--th', `${thSize}px`);
      document.documentElement.style.setProperty('--tf', `${tfSize}px`);
      document.documentElement.style.setProperty('--tb', `${tbSize}px`);

      sState.K0 = { x: fl + 720 * s, y: ft + 505 * s, w: 205 * s };

      const dy = Math.max(0, navBottom + 6 - (ut + 196 * c - chipSize / 2));
      sState.K1 = { x: ul + 720 * c, y: ut + 1012 * c + dy, w: 466 * c };

      sState.K2 = { x: ul + 465 * c, y: ut + 640 * c, w: 300 * c };
      sState.hw = sState.K2.w * 3.05;
      sState.hx0 = sState.K2.x - 0.56 * sState.hw;
      sState.K2.x = sState.hx0 + 0.63 * sState.hw;
      sState.handTop = sState.K2.y + 0.13 * (sState.K2.w * JAR_R) - 0.3 * (sState.hw * HAND_R);

      const forestScale = Math.max(sState.vw / 1024, sState.vh / 512);
      const forestJarW = Math.min(145 * forestScale, 0.16 * sState.vw);
      sState.K4 = { x: sState.vw / 2, y: 300 * forestScale, w: forestJarW };

      // Chips
      const kx = Math.max(c, (0.96 * sState.vw) / 1440);
      const chipCoords = [
        { id: 'chip0', x: 230, y: 421 },
        { id: 'chip1', x: 454, y: 268 },
        { id: 'chip2', x: 720, y: 196 },
        { id: 'chip3', x: 988, y: 278 },
        { id: 'chip4', x: 1212, y: 439 },
      ];

      chipCoords.forEach((ch) => {
        const el = document.getElementById(ch.id);
        if (el) {
          el.style.left = `${sState.vw / 2 + (ch.x - 720) * kx}px`;
          el.style.top = `${ut + ch.y * c + dy}px`;
        }
      });

      if (beneRowsRef.current) {
        beneRowsRef.current.style.left = `${ul + 915 * c}px`;
        beneRowsRef.current.style.right = 'auto';
        beneRowsRef.current.style.transform = 'translateY(-44%)';
      }
    } else {
      // Portrait Mode
      const isSmallPhone = sState.vw < 420;
      const chipSize = Math.min(Math.max(52, 0.155 * sState.vw), 88);
      const cnSize = Math.min(Math.max(12, 0.034 * sState.vw), 17);
      const csSize = Math.min(Math.max(10.5, 0.028 * sState.vw), 15);
      const rtSize = Math.min(Math.max(46, 0.125 * sState.vw), 74);
      const rhSize = Math.min(Math.max(15, 0.042 * sState.vw), 22);
      const rpSize = Math.min(Math.max(12, 0.033 * sState.vw), 16);
      const rgSize = Math.min(Math.max(12, 0.02 * sState.vh), 24);
      const thSize = Math.min(Math.max(18, 0.052 * sState.vw), 32);
      const tfSize = isSmallPhone ? 13 : 15;
      const tbSize = isSmallPhone ? 16 : 22;

      document.documentElement.style.setProperty('--chip', `${chipSize}px`);
      document.documentElement.style.setProperty('--cn', `${cnSize}px`);
      document.documentElement.style.setProperty('--cs', `${csSize}px`);
      document.documentElement.style.setProperty('--rt', `${rtSize}px`);
      document.documentElement.style.setProperty('--rh', `${rhSize}px`);
      document.documentElement.style.setProperty('--rp', `${rpSize}px`);
      document.documentElement.style.setProperty('--rg', `${rgSize}px`);
      document.documentElement.style.setProperty('--rw', '100%');
      document.documentElement.style.setProperty('--th', `${thSize}px`);
      document.documentElement.style.setProperty('--tf', `${tfSize}px`);
      document.documentElement.style.setProperty('--tb', `${tbSize}px`);

      sState.K0 = { x: fl + 720 * s, y: ft + 505 * s, w: Math.min(205 * s, 0.38 * sState.vw) };

      const topY = navBottom + 24 + chipSize / 2;
      const side1Y = topY + 0.28 * chipSize;
      const labelAllowance = 0.2 * chipSize + cnSize * 1.4 + csSize * 2.8 + 18;
      const row2Y = side1Y + chipSize / 2 + labelAllowance + chipSize / 2 + 6;

      const portChips = [
        { id: 'chip1', x: 0.19 * sState.vw, y: side1Y },
        { id: 'chip2', x: 0.5 * sState.vw, y: topY },
        { id: 'chip3', x: 0.81 * sState.vw, y: side1Y },
        { id: 'chip0', x: 0.25 * sState.vw, y: row2Y },
        { id: 'chip4', x: 0.75 * sState.vw, y: row2Y },
      ];

      let lowestChipLabelBottom = 0;
      portChips.forEach((ch) => {
        const el = document.getElementById(ch.id);
        if (el) {
          el.style.left = `${ch.x}px`;
          el.style.top = `${ch.y}px`;
          const bottomEstimate = ch.y + chipSize / 2 + labelAllowance;
          if (bottomEstimate > lowestChipLabelBottom) lowestChipLabelBottom = bottomEstimate;
        }
      });

      const w1 = Math.min(0.66 * sState.vw, 0.36 * sState.vh);
      const y1 = Math.max(sState.vh + 0.15 * w1 * JAR_R, lowestChipLabelBottom + 18 + w1 * JAR_R);
      sState.K1 = { x: sState.vw / 2, y: y1, w: w1 };

      const beneTop = navBottom + 22;
      if (beneRowsRef.current) {
        beneRowsRef.current.style.left = `${Math.max(18, 0.06 * sState.vw)}px`;
        beneRowsRef.current.style.right = `${Math.max(18, 0.06 * sState.vw)}px`;
        beneRowsRef.current.style.top = `${beneTop}px`;
        beneRowsRef.current.style.transform = 'none';
      }

      const w2 = Math.min(0.38 * sState.vw, 0.21 * sState.vh);
      const estRowsBottom = beneTop + 3 * (rtSize + 12) + 2 * rgSize;
      const minK2Y = estRowsBottom + w2 * JAR_R + 24;
      sState.K2 = { x: sState.vw / 2, y: Math.max(0.8 * sState.vh, minK2Y), w: w2 };
      sState.hw = 3.2 * w2;
      sState.hx0 = sState.K2.x - 0.63 * sState.hw;
      sState.handTop = sState.K2.y + 0.13 * (sState.K2.w * JAR_R) - 0.3 * (sState.hw * HAND_R);

      const forestScalePort = Math.max(sState.vw / 1024, sState.vh / 512);
      const forestJarWPort = Math.min(145 * forestScalePort, 0.32 * sState.vw);
      sState.K4 = { x: sState.vw / 2, y: 300 * forestScalePort, w: forestJarWPort };
    }

    sState.W_JAR = Math.max(sState.K0.w, sState.K1.w, sState.K2.w, sState.K4.w, 466);
    if (jarRef.current) jarRef.current.style.width = `${sState.W_JAR}px`;
    if (handRef.current) handRef.current.style.width = `${sState.hw}px`;

    // Wordmark sizing
    const wm = wordmarkRef.current;
    if (wm) {
      const targetWidth = sState.isPortrait ? 0.9 * sState.vw : Math.min(1080 * s, 0.92 * sState.vw);
      const range = document.createRange();
      range.selectNodeContents(wm);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0) {
        const currentFont = parseFloat(window.getComputedStyle(wm).fontSize) || 120;
        wm.style.fontSize = `${(targetWidth / rect.width) * currentFont}px`;
      }
      const fontSize = parseFloat(wm.style.fontSize) || 120;
      const jarH0 = sState.K0.w * JAR_R;
      const jarTop0 = sState.K0.y - jarH0;
      const capCenterY = jarTop0 + 0.25 * jarH0;
      const elementTop = capCenterY - (0.2 + 0.708 / 2) * fontSize;
      const minSafeTop = navBottom + 28;
      wm.style.top = `${Math.max(elementTop, minSafeTop)}px`;
    }
  }, []);

  // Video loop handling
  const playHeroVideos = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const vA = vidARef.current;
    const vB = vidBRef.current;
    if (vA && vB && vA.paused && vB.paused) {
      vA.play().catch(() => {});
    }
  }, []);

  const pauseHeroVideos = useCallback(() => {
    const vA = vidARef.current;
    const vB = vidBRef.current;
    if (vA && !vA.paused) vA.pause();
    if (vB && !vB.paused) vB.pause();
  }, []);

  // Transitions
  const transitionTo = useCallback(
    (nextState: number, instant = false) => {
      if (nextState < 0) nextState = 0;
      if (nextState > 3) nextState = 3;

      const sState = stateRef.current;
      const ch = channelsRef.current;
      const prevState = sState.currentState;
      sState.currentState = nextState;
      setActiveScene(nextState);

      // Clear class timers
      if (timersRef.current.ingr) clearTimeout(timersRef.current.ingr);
      if (timersRef.current.bene) clearTimeout(timersRef.current.bene);
      if (timersRef.current.scene) clearTimeout(timersRef.current.scene);

      if (instant) {
        setStageClass('stage');
        if (nextState === 0) {
          ch.jarX.snap(sState.K0.x); ch.jarY.snap(sState.K0.y); ch.jarW.snap(sState.K0.w);
          ch.hero.snap(1); ch.bene.snap(0); ch.handOut.snap(0); ch.rows.snap(0); ch.scene.snap(0);
        } else if (nextState === 1) {
          ch.jarX.snap(sState.K1.x); ch.jarY.snap(sState.K1.y); ch.jarW.snap(sState.K1.w);
          ch.hero.snap(0); ch.bene.snap(0); ch.handOut.snap(0); ch.rows.snap(0); ch.scene.snap(0);
          setStageClass('stage ingr-on');
        } else if (nextState === 2) {
          ch.jarX.snap(sState.K2.x); ch.jarY.snap(sState.K2.y); ch.jarW.snap(sState.K2.w);
          ch.hero.snap(0); ch.bene.snap(1); ch.handOut.snap(0); ch.rows.snap(1); ch.scene.snap(0);
          setStageClass('stage bene-on');
        } else if (nextState === 3) {
          ch.jarX.snap(sState.K4.x); ch.jarY.snap(sState.K4.y); ch.jarW.snap(sState.K4.w);
          ch.hero.snap(0); ch.bene.snap(1); ch.handOut.snap(1); ch.rows.snap(0); ch.scene.snap(1);
          setStageClass('stage scene-on nav-dark-theme');
        }
        return;
      }

      if (nextState === 0) {
        setStageClass('stage');
        ch.jarX.set(sState.K0.x, 1150, EJ);
        ch.jarY.set(sState.K0.y, 1150, EJ);
        ch.jarW.set(sState.K0.w, 1150, EJ);

        ch.hero.set(1, 700, EP);
        ch.bene.set(0, 650, EP);
        ch.handOut.set(0, 500, EP);
        ch.rows.set(0, 400, EF);
        ch.scene.set(0, 650, EP);

        playHeroVideos();
      } else if (nextState === 1) {
        setStageClass('stage');
        ch.jarX.set(sState.K1.x, 1150, EJ);
        ch.jarY.set(sState.K1.y, 1150, EJ);
        ch.jarW.set(sState.K1.w, 1150, EJ);

        ch.hero.set(0, 700, EP);
        ch.bene.set(0, 650, EP);
        ch.handOut.set(0, 500, EP);
        ch.rows.set(0, 400, EF);
        ch.scene.set(0, 650, EP);

        const delay = prevState < 1 ? 1000 : 600;
        timersRef.current.ingr = setTimeout(() => {
          setStageClass('stage ingr-on');
        }, delay);
      } else if (nextState === 2) {
        setStageClass('stage');
        ch.jarX.set(sState.K2.x, 1150, EJ);
        ch.jarY.set(sState.K2.y, 1150, EJ);
        ch.jarW.set(sState.K2.w, 1150, EJ);

        ch.hero.set(0, 700, EP);
        ch.bene.set(1, 650, EP);
        ch.scene.set(0, 650, EP);

        if (prevState === 3) {
          ch.handOut.set(0, 650, EP, 150);
          ch.rows.set(1, 500, EF, 300);
        } else {
          ch.handOut.set(0, 500, EP);
          ch.rows.set(1, 500, EF);
        }

        const delay = prevState < 2 ? 550 : 350;
        timersRef.current.bene = setTimeout(() => {
          setStageClass('stage bene-on');
        }, delay);
      } else if (nextState === 3) {
        setStageClass('stage');
        if (prevState === 2) {
          ch.jarX.set(sState.K4.x, 700, EJ);
          ch.jarY.set(sState.K4.y, 1600, EY);
          ch.jarW.set(sState.K4.w, 1600, EJ);
        } else {
          ch.jarX.set(sState.K4.x, 1150, EJ);
          ch.jarY.set(sState.K4.y, 1150, EJ);
          ch.jarW.set(sState.K4.w, 1150, EJ);
        }

        ch.handOut.set(1, 600, EP);
        ch.rows.set(0, 400, EF);
        ch.scene.set(1, 650, EP, 350);

        timersRef.current.scene = setTimeout(() => {
          setStageClass('stage scene-on nav-dark-theme');
        }, 1350);
      }

      sState.isInputLocked = true;
      setTimeout(() => {
        sState.isInputLocked = false;
      }, 1000);
    },
    [playHeroVideos]
  );

  // Setup Lifecycle
  useEffect(() => {
    const sState = stateRef.current;
    const ch = channelsRef.current;

    // Apply Sheet Crops
    const sheetMap: Record<string, { url: string; pos: string }> = {
      'crop-acacia': { url: SHEET1_URL, pos: '1.15% 1.15%' },
      'crop-lavender': { url: SHEET1_URL, pos: '98.85% 1.15%' },
      'crop-blueberry': { url: '/assets/blueberry_chip.png', pos: 'center center' },
      'crop-honeycomb': { url: SHEET1_URL, pos: '1.15% 98.85%' },
      'crop-pollen': { url: SHEET1_URL, pos: '98.85% 98.85%' },
      'crop-resin': { url: SHEET2_URL, pos: '1.15% 1.15%' },
      'crop-energy': { url: SHEET2_URL, pos: '98.85% 1.15%' },
      'crop-throat': { url: SHEET2_URL, pos: '1.15% 98.85%' },
      'crop-raw': { url: SHEET2_URL, pos: '98.85% 98.85%' },
    };

    Object.entries(sheetMap).forEach(([id, { url, pos }]) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.backgroundImage = `url('${url}')`;
        el.style.backgroundPosition = pos;
        if (id === 'crop-blueberry') {
          el.style.backgroundSize = 'cover';
        }
      }
    });

    // Set Velora Jar & clean Hand cutout
    if (jarRef.current) jarRef.current.src = '/assets/velora_jar.png';
    cleanCutout(HAND_RAW_URL, HAND_CROP).then((src) => {
      if (handRef.current) handRef.current.src = src;
    });

    computeLayout();
    transitionTo(0, true);

    // Setup Video Loop
    const vA = vidARef.current;
    const vB = vidBRef.current;
    if (vA && vB && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      vA.addEventListener(
        'playing',
        () => {
          vA.style.opacity = '1';
        },
        { once: true }
      );
      vA.play().catch(() => {});

      const checkCrossfade = (active: HTMLVideoElement, next: HTMLVideoElement) => {
        const onTime = () => {
          if (active.duration && active.currentTime >= active.duration - 0.6) {
            active.removeEventListener('timeupdate', onTime);
            next.currentTime = 0;
            next
              .play()
              .then(() => {
                next.style.opacity = '1';
                setTimeout(() => {
                  active.pause();
                  active.style.opacity = '0';
                  checkCrossfade(next, active);
                }, 600);
              })
              .catch(() => {});
          }
        };
        active.addEventListener('timeupdate', onTime);
      };
      checkCrossfade(vA, vB);
    }

    // Intro Animation
    document.documentElement.classList.remove('intro');
    sState.introStartTime = performance.now();
    sState.isIntroRunning = true;

    // Wordmark & Nav fade in
    const wm = wordmarkRef.current;
    const nav = document.getElementById('nav');
    if (nav) {
      nav.style.opacity = '0';
      setTimeout(() => {
        nav.style.transition = 'opacity 0.35s ease-out';
        nav.style.opacity = '1';
      }, 0);
    }
    if (wm) {
      wm.style.opacity = '0';
      setTimeout(() => {
        wm.style.transition = 'opacity 0.45s ease-out';
        wm.style.opacity = '1';
      }, 60);
    }

    // Expose testing hook
    (window as unknown as { hiven: { go: (n: number, instant?: boolean) => void; state: number } }).hiven = {
      go: (n: number, instant = false) => transitionTo(n, instant),
      get state() {
        return sState.currentState;
      },
    };

    // Render loop
    let animId: number;
    const render = (now: number) => {
      if (sState.isIntroRunning) {
        const elapsed = now - sState.introStartTime;
        if (elapsed >= 1600) {
          sState.introOffset = 0;
          sState.isIntroRunning = false;
        } else {
          const p = elapsed / 1600;
          const eased = EINTRO(p);
          sState.introOffset = (1 - eased) * 0.276 * sState.vh;
        }
      }

      const jx = ch.jarX.update(now);
      const jy = ch.jarY.update(now);
      const jw = ch.jarW.update(now);

      const vHero = ch.hero.update(now);
      const vBene = ch.bene.update(now);
      const vHandOut = ch.handOut.update(now);
      const vRows = ch.rows.update(now);
      const vScene = ch.scene.update(now);

      const layerHero = document.getElementById('layerHero');
      const hFrame = heroFrameRef.current;
      const layerBene = document.getElementById('layerBene');
      const bRows = beneRowsRef.current;
      const layerScene = document.getElementById('layerScene');

      if (layerHero) layerHero.style.opacity = `${vHero}`;
      if (hFrame) {
        hFrame.style.transform = `translate3d(0, ${sState.introOffset}px, 0) scale(${1 + (1 - vHero) * 0.06})`;
      }

      if (layerBene) {
        layerBene.style.transform = `translate3d(0, ${(1 - vBene) * 100}%, 0)`;
      }
      if (bRows) bRows.style.opacity = `${vRows}`;

      if (layerScene) {
        layerScene.style.transform = `translate3d(0, ${(1 - vScene) * 100}%, 0)`;
      }

      setNavLight(vScene > 0.96);

      if (sState.W_JAR > 0 && jarRef.current) {
        const tx = jx - sState.W_JAR / 2;
        const ty = jy - sState.W_JAR * JAR_R + sState.introOffset;
        const scale = jw / sState.W_JAR;
        jarRef.current.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      }

      if (handRef.current) {
        const hx = sState.hx0 - vHandOut * (sState.hx0 + 1.05 * sState.hw);
        const hy = sState.handTop + (1 - vBene) * sState.vh;
        handRef.current.style.transform = `translate3d(${hx.toFixed(2)}px, ${hy.toFixed(2)}px, 0)`;
      }

      if (sState.currentState !== 0 && vHero < 0.01) {
        pauseHeroVideos();
      }

      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    // Event Listeners: Wheel
    let lastWheelTime = 0;
    let lastDelta = 0;
    let accumulatedDelta = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (sState.isInputLocked) return;

      const now = performance.now();
      const delta = e.deltaY;
      const timeDiff = now - lastWheelTime;

      const isFresh = timeDiff > 160 || Math.abs(delta) > 1.6 * Math.abs(lastDelta) + 4;
      if (isFresh) accumulatedDelta = 0;

      lastWheelTime = now;
      lastDelta = delta;
      accumulatedDelta += delta;

      if (Math.abs(accumulatedDelta) >= 24) {
        const step = Math.sign(accumulatedDelta);
        accumulatedDelta = 0;
        transitionTo(sState.currentState + step);
      }
    };

    // Touch
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (sState.isInputLocked) return;
      if (e.changedTouches && e.changedTouches.length > 0) {
        const dist = touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(dist) > 40) {
          const step = Math.sign(dist);
          transitionTo(sState.currentState + step);
        }
      }
    };

    // Keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sState.isInputLocked) return;
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        transitionTo(sState.currentState + 1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        transitionTo(sState.currentState - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        transitionTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        transitionTo(3);
      }
    };

    const handleResize = () => {
      computeLayout();
      transitionTo(sState.currentState, true);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [cleanCutout, computeLayout, pauseHeroVideos, transitionTo]);

  return (
    <div className={stageClass} id="stage" ref={stageRef}>
      <Navigation currentScene={activeScene} onNavigate={(s) => transitionTo(s)} />
      <HeroLayer
        wordmarkRef={wordmarkRef}
        heroFrameRef={heroFrameRef}
        vidARef={vidARef}
        vidBRef={vidBRef}
      />
      <IngredientsLayer />
      <BenefitsLayer beneRowsRef={beneRowsRef} />
      <SceneLayer onDiscover={() => transitionTo(0)} />
      <ProductPin jarRef={jarRef} handRef={handRef} />
    </div>
  );
}
