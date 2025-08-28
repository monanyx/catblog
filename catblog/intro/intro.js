// Windows 7–style bubbles: translucent, drifting upward, interactive (hover repel, click pop)
(() => {
  const canvas = document.getElementById('bubbleCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM) return;

  let W = 0, H = 0, dpr = Math.max(1, window.devicePixelRatio || 1);
  let bubbles = [];
  const TARGET = 36;         // total bubbles
  const PINK_H_RANGE = [330, 350]; // HSL hue range for pinks
  const mouse = { x: -9999, y: -9999, active: false };

  function resize(){
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  class Bubble {
    constructor(initial=false){ this.reset(initial); }
    reset(initial=false){
      this.r = rand(22, 86);
      this.x = rand(this.r, W - this.r);
      this.y = initial ? rand(H*0.1, H + 200) : H + this.r + rand(0, 220);
      this.vy = rand(20, 55) / 60;        // upward speed
      this.vx = rand(-12, 12) / 60;       // slight sway
      this.h  = rand(PINK_H_RANGE[0], PINK_H_RANGE[1]);
      this.s  = rand(60, 85);
      this.l  = rand(70, 88);
      this.alpha = 0.28;
    }
    step(){
      this.y -= this.vy; this.x += this.vx * 0.5;
      if (this.x < -this.r) this.x = W + this.r;
      if (this.x > W + this.r) this.x = -this.r;

      // Mouse repulsion
      if (mouse.active){
        const dx = this.x - mouse.x, dy = this.y - mouse.y;
        const rr = (this.r + 90);
        const d2 = dx*dx + dy*dy;
        if (d2 < rr*rr){
          const d = Math.max(1, Math.hypot(dx,dy));
          const force = (rr - d) / rr;
          this.x += (dx/d) * force * 2.0;
          this.y += (dy/d) * force * 2.0;
        }
      }
      if (this.y < -this.r - 10) this.reset();
    }
    draw(){
      const g = ctx.createRadialGradient(this.x - this.r*0.35, this.y - this.r*0.4, this.r*0.1, this.x, this.y, this.r);
      g.addColorStop(0, `hsla(${this.h}, ${this.s}%, ${Math.min(95,this.l+5)}%, ${this.alpha+0.12})`);
      g.addColorStop(0.6, `hsla(${this.h}, ${this.s-10}%, ${this.l-5}%, ${this.alpha})`);
      g.addColorStop(1, `hsla(${this.h}, ${this.s-20}%, ${this.l-15}%, ${this.alpha*0.6})`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();

      // glossy highlight
      ctx.beginPath();
      ctx.ellipse(this.x - this.r*0.35, this.y - this.r*0.45, this.r*0.25, this.r*0.18, -0.6, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fill();

      // rim
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function rand(a,b){ return a + Math.random()*(b-a); }

  function ensure(){
    while (bubbles.length < TARGET) bubbles.push(new Bubble(true));
    if (bubbles.length > TARGET) bubbles.length = TARGET;
  }

  function loop(){
    requestAnimationFrame(loop);
    ctx.clearRect(0,0,W,H);
    ensure();
    for (const b of bubbles){ b.step(); b.draw(); }
  }

  // Interactivity
  function move(e){
    mouse.active = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }
  function leave(){ mouse.active = false; mouse.x = mouse.y = -9999; }
  function click(e){
    // pop nearest bubble under cursor
    let idx = -1, best = Infinity;
    for (let i=0;i<bubbles.length;i++){
      const b=bubbles[i]; const d = Math.hypot(b.x - e.clientX, b.y - e.clientY);
      if (d < b.r*1.05 && d < best){ best = d; idx = i; }
    }
    if (idx >= 0){
      const b = bubbles[idx];
      // quick flash ring
      ctx.save();
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r*1.12, 0, Math.PI*2);
      ctx.strokeStyle='rgba(255,255,255,0.75)'; ctx.lineWidth=2; ctx.stroke();
      ctx.restore();
      bubbles[idx] = new Bubble(false);
    }
  }

  // Wire up
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', move, { passive:true });
  window.addEventListener('mouseleave', leave);
  window.addEventListener('click', click);

  resize();
  loop();
})();
