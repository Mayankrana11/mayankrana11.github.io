// === SUPER SMOOTH SCROLL ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offsetTop = target.offsetTop - 70;
      smoothScrollTo(offsetTop, 1000);
    }
  });
});

function smoothScrollTo(targetY, duration) {
  const startY = window.pageYOffset;
  const distanceY = targetY - startY;
  let startTime = null;

  function animation(currentTime) {
    if (!startTime) startTime = currentTime;
    const progress = currentTime - startTime;
    const easeInOut = easeInOutCubic(progress / duration);
    window.scrollTo(0, startY + distanceY * easeInOut);
    if (progress < duration) requestAnimationFrame(animation);
  }
  requestAnimationFrame(animation);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// === MONOCHROME PARTICLE NETWORK (HIGH DENSITY VERSION) ===
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

let particles = [];
let width, height;
const maxDistance = 130;
let numParticles;

// ✨ Force high density (mobile-style)
function getParticleCount() {
  const area = window.innerWidth * window.innerHeight;
  // increased density factor for fuller look
  return Math.min(Math.floor(area / 8000), 180); // cap at 180 for performance
}

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  numParticles = getParticleCount();
  initParticles();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = (Math.random() - 0.5) * 0.8;
    this.radius = Math.random() * 1.5 + 0.6;
    const shade = 200 + Math.floor(Math.random() * 55);
    this.color = `rgba(${shade},${shade},${shade},0.9)`;
  }

  move() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
}

function connectParticles() {
  for (let a = 0; a < numParticles; a++) {
    for (let b = a + 1; b < numParticles; b++) {
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance) {
        const opacity = 1 - distance / maxDistance;
        ctx.strokeStyle = `rgba(255,255,255,${opacity * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
  }
}

// 🧠 Subtle mouse repulsion for natural feel
const mouse = { x: null, y: null };
window.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener("mouseout", () => {
  mouse.x = null;
  mouse.y = null;
});

function animate() {
  ctx.clearRect(0, 0, width, height);

  for (const p of particles) {
    p.move();
    p.draw();
  }

  connectParticles();

  if (mouse.x && mouse.y) {
    for (const p of particles) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        p.x += dx * 0.03;
        p.y += dy * 0.03;
      }
    }
  }

  requestAnimationFrame(animate);
}

initParticles();
animate();
