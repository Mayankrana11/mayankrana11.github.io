// === Mayank Rana Portfolio Script ===
// DevicePixelRatio-aware, high-density monochrome particle network + smooth scroll + fade + glow
(function () {
  "use strict";

  // ---------- FADE-IN ON SCROLL ----------
  const fadeSections = document.querySelectorAll('.fade-section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  fadeSections.forEach(sec => observer.observe(sec));

  // ---------- CURSOR GLOW FOLLOW ----------
  const root = document.documentElement;
  document.addEventListener("mousemove", e => {
    root.style.setProperty("--cursor-x", e.clientX + "px");
    root.style.setProperty("--cursor-y", e.clientY + "px");
    document.body.style.cursor = "none";
    document.querySelector("body").style.setProperty("--cursor-x", `${e.clientX}px`);
    document.querySelector("body").style.setProperty("--cursor-y", `${e.clientY}px`);
    document.querySelector("body::before");
  });

  // ---------- SMOOTH SCROLL (optimized) ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const offset = Math.max(target.offsetTop - 70, 0);
          const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
          if (isMobile && 'scrollBehavior' in document.documentElement.style) {
            window.scrollTo({ top: offset, behavior: "smooth" });
          } else {
            const start = window.pageYOffset;
            const distance = offset - start;
            const duration = 900;
            let startTime = null;

            function easeInOutCubic(t) {
              return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }

            function step(currentTime) {
              if (!startTime) startTime = currentTime;
              const progress = Math.min((currentTime - startTime) / duration, 1);
              const eased = easeInOutCubic(progress);
              window.scrollTo(0, start + distance * eased);
              if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
          }
        }
      }
    });
  });

  // ---------- PARTICLE BACKGROUND ----------
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let DPR = Math.max(window.devicePixelRatio || 1, 1);
  let width = 0, height = 0;
  let particles = [];
  const MAX_DISTANCE = 130;
  let animationId = null;

  function getParticleCountForSize(w, h) {
    const area = w * h;
    return Math.min(Math.floor(area / 7500), 240);
  }

  function resize() {
    DPR = Math.max(window.devicePixelRatio || 1, 1);
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    initParticles();
  }

  window.addEventListener("resize", () => {
    cancelAnimationFrame(animationId);
    resize();
    animate();
  });

  class Particle {
    constructor() {
      this.reset(true);
      this.phase = Math.random() * 2 * Math.PI;
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      const speed = 0.25 + Math.random() * 0.45;
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.baseR = 0.8 + Math.random() * 1.2;
      const shade = 180 + Math.floor(Math.random() * 60);
      this.color = `rgba(${shade},${shade},${shade},0.85)`;
    }
    move() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x <= 0 || this.x >= width) this.vx *= -1;
      if (this.y <= 0 || this.y >= height) this.vy *= -1;
    }
    draw(ctx, time) {
      const glow = Math.sin(time / 800 + this.phase) * 0.4 + 0.6;
      const radius = this.baseR * glow * 1.2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = getParticleCountForSize(width, height);
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  const mouse = { x: null, y: null };
  window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("mouseout", () => { mouse.x = null; mouse.y = null; });

  function connectAndDraw(time) {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.move();
      p.draw(ctx, time);
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MAX_DISTANCE) {
          const op = 1 - dist / MAX_DISTANCE;
          ctx.strokeStyle = `rgba(255,255,255,${(op * 0.3).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (mouse.x !== null && mouse.y !== null) {
      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 120 && d > 0.1) {
          const push = 0.02 * (1 - d / 120);
          p.x += dx * push;
          p.y += dy * push;
        }
      }
    }
  }

  function animate(time = 0) {
    connectAndDraw(time);
    animationId = requestAnimationFrame(animate);
  }

  window.addEventListener("load", () => {
    try {
      resize();
      animate();
    } catch (err) {
      console.error("Particle initialization failed:", err);
    }
  });
})();
