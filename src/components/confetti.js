// ════════════════════════════════════════════════════════════
// CONFETTI EFFECT — Canvas-based particle system
// ════════════════════════════════════════════════════════════

const COLORS = ['#3ECF8E', '#27E8A0', '#5B8AF6', '#F9B43A', '#9B6BF9', '#F96060', '#FFD700'];
const PARTICLE_COUNT = 80;

let animId = null;

export function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: canvas.width * Math.random(),
      y: canvas.height * -.3 * Math.random(),
      w: 4 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      vx: (Math.random() - .5) * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * 360,
      rotV: (Math.random() - .5) * 12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
      decay: .003 + Math.random() * .004,
    });
  }

  if (animId) cancelAnimationFrame(animId);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += .12; // gravity
      p.rot += p.rotV;
      p.life -= p.decay;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (alive) {
      animId = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animId = null;
    }
  }

  draw();
}
