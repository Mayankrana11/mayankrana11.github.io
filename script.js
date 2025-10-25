// === SUPER SMOOTH SCROLL ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offsetTop = target.offsetTop - 70; // slight offset for navbar
      smoothScrollTo(offsetTop, 1000); // 1000ms = super smooth
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

// === MONOCHROME TRAIL BACKGROUND ===
const canvas = document.getElementById("trailCanvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  let width, height;
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const trails = [];
  const maxTrails = 60;
  let mouse = { x: width / 2, y: height / 2 };

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    trails.push({ x: mouse.x, y: mouse.y, alpha: 1.0 });
    if (trails.length > maxTrails) trails.shift();
  });

  function animate() {
    ctx.fillStyle = "rgba(10,10,10,0.15)";
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2;
    for (let i = 0; i < trails.length - 1; i++) {
      const p = trails[i];
      const next = trails[i + 1];
      const gradient = ctx.createLinearGradient(p.x, p.y, next.x, next.y);
      gradient.addColorStop(0, `rgba(255,255,255,${p.alpha})`);
      gradient.addColorStop(1, `rgba(150,150,150,${next.alpha * 0.6})`);
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
      p.alpha *= 0.95;
    }
    requestAnimationFrame(animate);
  }
  animate();
}
