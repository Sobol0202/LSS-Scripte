// ==UserScript==
// @name         LSS Feuerwerk
// @version      1.0
// @author       Sobol
// @description  Feuerwerk ist teuer und schlecht für die Umwelt, darum Digital
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const button = document.createElement('button');
  button.textContent = '🎆 Feuerwerk';
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    zIndex: 100000,
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    background: '#222',
    color: '#fff',
    fontSize: '15px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
  });
  document.body.appendChild(button);


  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    zIndex: 99997,
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 1.2s ease'
  });
  document.body.appendChild(overlay);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 99998
  });
  document.body.appendChild(canvas);

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let rockets = [];
  let guidedRockets = [];
  let particles = [];
  let running = false;
  let startTime = 0;
  let timelineIndex = 0;


  const useTrailFade = true;


  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];


  class Rocket {
    constructor(opts) {
      this.x = opts.x ?? canvas.width / 2;
      this.y = canvas.height + (opts.startOffsetY ?? 0);
      this.angle = opts.angle ?? -90;
      this.speed = opts.speed ?? 7;
      this.explosion = opts.explosion ?? 'burst';
      this.color = opts.color ?? 'orange';
      this.targetY = opts.targetY ?? canvas.height * 0.5;

      const rad = (this.angle * Math.PI) / 180;
      this.vx = Math.cos(rad) * this.speed;
      this.vy = Math.sin(rad) * this.speed;

      this.sizeW = opts.rocketW ?? 8;
      this.sizeH = opts.rocketH ?? 18;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < -50 || this.x > canvas.width + 50 || this.y > canvas.height + 50) return false;

      if (this.y <= this.targetY) {
        explode(this.x, this.y, this.explosion, this.color, this.explosionScale ?? 1);
        return false;
      }
      return true;
    }

    draw() {
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.sizeW / 2, this.y - this.sizeH, this.sizeW, this.sizeH);
      ctx.restore();
    }
  }


  class GuidedRocket {
    constructor(opts) {
      this.x = opts.x ?? canvas.width / 2;
      this.y = canvas.height + (opts.startOffsetY ?? 0);

      this.tx = opts.targetX ?? this.x;
      this.ty = opts.targetY ?? canvas.height * 0.4;

      this.color = opts.color ?? 'white';
      this.speed = opts.speed ?? 7;
      this.explosion = opts.explosion ?? 'star';
      this.explosionScale = opts.explosionScale ?? 1.2;

      this.turn = opts.turn ?? 0.10;
      this.vx = rand(-1, 1);
      this.vy = -this.speed;


      this.trail = [];
      this.trailMax = opts.trailMax ?? 28;
      this.trailStep = opts.trailStep ?? 1;
      this._step = 0;

      this.sizeW = opts.rocketW ?? 7;
      this.sizeH = opts.rocketH ?? 16;
    }

    update() {
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 10) {
        explode(this.x, this.y, this.explosion, this.color, this.explosionScale);
        return false;
      }

      const ux = dx / (dist || 1);
      const uy = dy / (dist || 1);

      const vdist = Math.hypot(this.vx, this.vy) || 1;
      const cvx = this.vx / vdist;
      const cvy = this.vy / vdist;

      const nvx = (1 - this.turn) * cvx + this.turn * ux;
      const nvy = (1 - this.turn) * cvy + this.turn * uy;


      this.vx = nvx * this.speed;
      this.vy = nvy * this.speed;

      this.x += this.vx;
      this.y += this.vy;


      this._step++;
      if (this._step >= this.trailStep) {
        this._step = 0;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailMax) this.trail.shift();
      }


      if (this.x < -80 || this.x > canvas.width + 80 || this.y < -120 || this.y > canvas.height + 120) return false;

      return true;
    }

    draw() {

      ctx.save();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = this.color;
      ctx.shadowBlur = 25;
      ctx.shadowColor = this.color;
      ctx.globalAlpha = 0.95;

      ctx.beginPath();
      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();


      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.sizeW / 2, this.y - this.sizeH, this.sizeW, this.sizeH);
      ctx.restore();
    }
  }


  class Particle {
    constructor(x, y, angle, speed, color, size, life) {
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = life;
      this.maxLife = life;
      this.size = size;
      this.color = color;
    }

    update() {
      this.vy += 0.06; // gravity
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
      return this.life > 0;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.life / this.maxLife;
      ctx.shadowBlur = 18;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }


  function explode(x, y, type, color, scale = 1) {
    const baseCount = 90;
    const count = Math.round(baseCount * scale);
    const sizeBase = 4 * Math.sqrt(scale);
    const lifeBase = Math.round(95 + 25 * scale);

    switch (type) {
      case 'ring': {
        for (let i = 0; i < count; i++) {
          const a = (Math.PI * 2 * i) / count;
          particles.push(new Particle(x, y, a, 5.5 * scale, color, sizeBase, lifeBase));
        }
        break;
      }

      case 'star': {

        const arms = 10;
        for (let i = 0; i < arms; i++) {
          const a = (Math.PI * 2 * i) / arms;
          const sp = i % 2 === 0 ? 7 * scale : 3.8 * scale;
          const sz = i % 2 === 0 ? sizeBase + 1 : sizeBase;
          particles.push(new Particle(x, y, a, sp, color, sz, lifeBase));
        }

        for (let i = 0; i < Math.round(20 * scale); i++) {
          particles.push(new Particle(x, y, Math.random() * Math.PI * 2, rand(1.5, 3.5) * scale, color, sizeBase - 0.5, lifeBase - 15));
        }
        break;
      }

      case 'heart': {

        for (let i = 0; i < count; i++) {
          const t = (Math.PI * 2 * i) / count;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy =
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t);

          const a = Math.atan2(-hy, hx);
          const r = Math.hypot(hx, hy);
          const sp = (0.16 * r) * scale;
          particles.push(new Particle(x, y, a, sp, color, sizeBase, lifeBase));
        }
        break;
      }

      case 'spiral': {

        for (let i = 0; i < count; i++) {
          const a = i * 0.32;
          const sp = (0.12 * i) * (scale / 1.2);
          particles.push(new Particle(x, y, a, sp, color, sizeBase, lifeBase));
        }
        break;
      }

      case 'smiley': {

        for (let i = 0; i < count; i++) {
          particles.push(new Particle(x, y, Math.random() * Math.PI * 2, rand(2.2, 5.0) * scale, 'yellow', sizeBase, lifeBase));
        }
        particles.push(new Particle(x - 14 * scale, y - 10 * scale, -Math.PI / 2, 0.5, '#FFFF00', sizeBase + 1, lifeBase + 30));
        particles.push(new Particle(x + 14 * scale, y - 10 * scale, -Math.PI / 2, 0.5, '#FFFF00', sizeBase + 1, lifeBase + 30));
        const mouthCount = Math.round(20 * scale);
        for (let i = 0; i < mouthCount; i++) {
          const a = Math.PI * (0.15 + (0.7 * i) / mouthCount);
          const mx = x + Math.cos(a) * 20 * scale;
          const my = y + Math.sin(a) * 18 * scale + 6 * scale;
          particles.push(new Particle(mx, my, -Math.PI / 2, 0.2, '#FFFF00', sizeBase - 0.5, lifeBase + 20));
        }
        break;
      }

      case 'burst':
      default: {
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = rand(2.0, 6.5) * scale;
          particles.push(new Particle(x, y, a, sp, color, rand(sizeBase - 0.5, sizeBase + 1.5), lifeBase));
        }
      }
    }
  }


  const DIGIT_STROKES = {
    '2': [

      [0,0],[1,0],[2,0],[3,0],[4,0],
      [4,1],[4,2],
      [0,2],[1,2],[2,2],[3,2],[4,2],
      [0,3],[0,4],
      [0,4],[1,4],[2,4],[3,4],[4,4]
    ],
    '0': [
      [0,0],[1,0],[2,0],[3,0],[4,0],
      [0,1],[0,2],[0,3],[0,4],
      [4,1],[4,2],[4,3],[4,4],
      [0,4],[1,4],[2,4],[3,4],[4,4]
    ],
    '6': [
      [1,0],[2,0],[3,0],[4,0],
      [0,1],[0,2],[0,3],[0,4],
      [0,2],[1,2],[2,2],[3,2],[4,2],
      [4,3],[4,4],
      [0,4],[1,4],[2,4],[3,4],[4,4]
    ]
  };

  function launchDigitGuided(digitChar, offsetX, offsetY, spacing, color) {
    const pts = DIGIT_STROKES[digitChar];
    if (!pts) return;

    const baseDelay = 28;
    const startNow = performance.now() - startTime;
    const startAt = startNow + 150;


    const events = [];
    for (let i = 0; i < pts.length; i++) {
      const [gx, gy] = pts[i];
      events.push({
        time: Math.max(0, Math.round(startAt + i * baseDelay)),
        action: 'guidedPoint',
        options: {
          x: offsetX + gx * spacing,
          targetX: offsetX + gx * spacing,
          targetY: offsetY + gy * spacing,
          color,
          speed: 7.5,
          turn: 0.14,
          trailMax: 34,
          explosion: 'star',
          explosionScale: 1.4
        }
      });
    }
    return events;
  }


  const choreography = [];
  let t = 0;

  for (let i = 0; i < 95; i++) {
    choreography.push({
      time: t,
      action: 'launch',
      options: {
        x: Math.random() * canvas.width,
        angle: -60 - Math.random() * 60,
        speed: rand(6.5, 8.5),
        explosion: pick(['burst', 'ring', 'star']),
        color: `hsl(${Math.random() * 360},100%,60%)`,
        rocketW: 8,
        rocketH: 18
      }
    });
    t += 260;
  }

  for (let wave = 0; wave < 14; wave++) {
    const centerX = canvas.width / 2;
    for (let i = -6; i <= 6; i++) {
      choreography.push({
        time: t,
        action: 'launch',
        options: {
          x: centerX,
          angle: -90 + i * 6,
          speed: 8.5,
          explosion: wave % 2 === 0 ? 'spiral' : 'ring',
          color: wave % 2 === 0 ? 'cyan' : 'gold'
        }
      });
    }
    t += 560;
  }


  for (let i = 0; i < 70; i++) {
    choreography.push({
      time: t,
      action: 'launch',
      options: {
        x: Math.random() * canvas.width,
        angle: -55 - Math.random() * 70,
        speed: rand(7.5, 9.0),
        explosion: pick(['heart', 'smiley', 'burst', 'star']),
        color: `hsl(${Math.random() * 360},100%,65%)`
      }
    });
    t += 230;
  }


  for (let i = 0; i < 10; i++) {
    choreography.push({
      time: t,
      action: 'launch',
      options: {
        x: canvas.width * (0.15 + i * 0.07),
        angle: -90,
        speed: 6.5,
        explosion: 'ring',
        color: 'white',
        explosionScale: 1.25
      }
    });
    t += 420;
  }


  t += 1600;

  const digitSpacing = 22;
  const digitBlockW = 5 * digitSpacing;
  const gap = 70;
  const totalW = digitBlockW * 4 + gap * 3;
  const startX = (canvas.width - totalW) / 2;
  const baseY = canvas.height * 0.22;
  const digits = ['2', '0', '2', '6'];

  choreography.push({ time: t, action: 'spawnDigit', digit: '2', x: startX + 0 * (digitBlockW + gap), y: baseY });
  choreography.push({ time: t + 380, action: 'spawnDigit', digit: '0', x: startX + 1 * (digitBlockW + gap), y: baseY });
  choreography.push({ time: t + 760, action: 'spawnDigit', digit: '2', x: startX + 2 * (digitBlockW + gap), y: baseY });
  choreography.push({ time: t + 1140, action: 'spawnDigit', digit: '6', x: startX + 3 * (digitBlockW + gap), y: baseY });


  t += 4200;


  for (let i = 0; i < 12; i++) {
    choreography.push({
      time: t + i * 140,
      action: 'launch',
      options: {
        x: startX + rand(0, totalW),
        angle: -90,
        speed: 8.5,
        targetY: canvas.height * 0.36 + rand(-40, 60),
        explosion: 'ring',
        explosionScale: 1.6,
        color: 'white'
      }
    });
  }


  t += 2200;
  for (let i = 0; i < 90; i++) {
    choreography.push({
      time: t + i * 90,
      action: 'launch',
      options: {
        x: Math.random() * canvas.width,
        angle: -70 - Math.random() * 40,
        speed: rand(8.5, 11.0),
        explosion: pick(['burst', 'star', 'ring', 'spiral']),
        explosionScale: rand(1.2, 2.0),
        color: i % 6 === 0 ? 'gold' : `hsl(${Math.random() * 360},100%,65%)`
      }
    });
  }

  t += 9000;
  for (let i = 0; i < 12; i++) {
    choreography.push({
      time: t + i * 220,
      action: 'launch',
      options: {
        x: canvas.width * (0.15 + i * 0.07),
        angle: -90,
        speed: 10.5,
        targetY: canvas.height * 0.35,
        explosion: pick(['burst', 'star']),
        explosionScale: 2.4,
        color: 'gold'
      }
    });
  }

  function runTimeline() {
    const now = performance.now() - startTime;

    while (timelineIndex < choreography.length && now >= choreography[timelineIndex].time) {
      const ev = choreography[timelineIndex];

      if (ev.action === 'launch') {
        rockets.push(new Rocket(ev.options));
      }

      if (ev.action === 'guidedPoint') {
        guidedRockets.push(new GuidedRocket(ev.options));
      }

      if (ev.action === 'spawnDigit') {
        const events = launchDigitGuided(
          ev.digit,
          ev.x,
          ev.y,
          digitSpacing,
          'white'
        ) || [];
        choreography.push(...events);
        choreography.sort((a, b) => a.time - b.time);

        for (let i = 0; i < choreography.length; i++) {
          if (choreography[i].time > now) { timelineIndex = i; break; }
        }
      }

      timelineIndex++;
    }
  }


  function animate() {
    if (!running) return;

    if (useTrailFade) {

      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    runTimeline();

    rockets = rockets.filter(r => { r.draw(); return r.update(); });
    guidedRockets = guidedRockets.filter(r => { r.draw(); return r.update(); });
    particles = particles.filter(p => { p.draw(); return p.update(); });

    if (
      timelineIndex >= choreography.length &&
      rockets.length === 0 &&
      guidedRockets.length === 0 &&
      particles.length === 0
    ) {
      running = false;
      overlay.style.opacity = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    requestAnimationFrame(animate);
  }


  button.addEventListener('click', () => {
    if (running) return;


    rockets = [];
    guidedRockets = [];
    particles = [];
    timelineIndex = 0;

    running = true;
    startTime = performance.now();

    overlay.style.opacity = 1;


    if (useTrailFade) {
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    animate();
  });

})();
