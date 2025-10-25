// robust, devicePixelRatio-aware particle network + smooth scroll
(function () {
  "use strict";

  // ---- smooth scroll (unchanged) ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offsetTop = Math.max(target.offsetTop - 70, 0);
        smoothScrollTo(offsetTop, 900);
      }
    });
  });

  function smoothScrollTo(targetY, duration) {
    const startY = window.pageYOffset;
    const distanceY = targetY - startY;
    let startTime = null;
    function step(now) {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + distanceY * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ---- particle system ----
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) {
    console.error("particleCanvas element not found");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("2D context unavailable");
    return;
  }

  let DPR = Math.max(window.devicePixelRatio || 1, 1);
  let width = 0, height = 0;
  let particles = [];
  const MAX_DISTANCE = 130;
  let animationId = null;

  // choose high-density target like mobile
  function getParticleCountForSize(w, h) {
    const area = w * h;
    // denser: 1 particle per 8000 px², capped at 220
    return Math.min(Math.max(Math.floor(area / 8000), 80), 220);
  }

  function resize() {
    DPR = Math.max(window.devicePixelRatio || 1, 1);
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // handle hi-dpi
    initParticles();
  }

  window.addEventListener("resize", () => {
    cancelAnimationFrame(animationId);
    resize();
    animate();
  });

  // particle class
  class Particle {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      const speed = 0.2 + Math.random() * 0.6; // slow smooth speeds
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed * (Math.random() * 0.6 + 0.6);
      this.vy = Math.sin(angle) * speed * (Math.random() * 0.6 + 0.6);
      this.r = (Math.random() * 1.4) + 0.5;
      const shade = 180 + Math.floor(Math.random() * 60);
      this.color = `rgba(${shade},${shade},${shade},0.9)`;
      if (!initial && (this.x < 0 || this.x > width || this.y < 0 || this.y > height)) {
        // keep inside
        this.x = Math.random() * width;
        this.y = Math.random() * height;
      }
    }
    move() {
      this.x += this.vx;
      this.y += this.vy;
      // bounce edges smoothly
      if (this.x <= 0 || this.x >= width) this.vx *= -1;
      if (this.y <= 0 || this.y >= height) this.vy *= -1;
    }
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = getParticleCountForSize(width, height);
    for (let i = 0; i < count; i++) particles.push(new Particle());
    console.log(`particle system: ${particles.length} particles`);
  }

  // mouse subtle interaction
  const mouse = { x: null, y: null };
  window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("mouseout", () => { mouse.x = null; mouse.y = null; });

  // main draw
  function connectAndDraw() {
    ctx.clearRect(0, 0, width, height);

    // draw particles
    for (const p of particles) {
      p.move();
      p.draw(ctx);
    }

    // connect
    const len = particles.length;
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < MAX_DISTANCE) {
          const op = 1 - (d / MAX_DISTANCE);
          ctx.strokeStyle = `rgba(255,255,255,${(op * 0.28).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // gentle mouse repulsion
    if (mouse.x !== null && mouse.y !== null) {
      for (const p of particles) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 120 && d > 0.1) {
          // push slightly away
          const push = 0.02 * (1 - d / 120);
          p.x += dx * push;
          p.y += dy * push;
        }
      }
    }
  }

  function animate() {
    connectAndDraw();
    animationId = requestAnimationFrame(animate);
  }

  // safety: draw a single dot if anything goes wrong
  function debugDot() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    console.warn("Debug dot drawn — particle loop may not have started");
  }

  // initialize on load
  window.addEventListener('load', () => {
    try {
      resize();
      if (!particles || particles.length === 0) initParticles();
      animate();
    } catch (err) {
      console.error("Particle init error:", err);
      try { debugDot(); } catch (e) { /* ignore */ }
    }
  });

})();
