// Interactive kitten growth: parametric SVG that updates with a slider
(() => {
  const $ = (id) => document.getElementById(id);
  const svg = $('catSVG');
  const monthRange = $('monthRange');
  const monthOut = $('monthOut');
  const stageOut = $('stageOut');
  const weightOut = $('weightOut');
  const sleepOut = $('sleepOut');

  const body = $('body'); // ellipse
  const head = $('head'); // circle
  const earL = $('earL'), earR = $('earR');
  const eyeL = $('eyeL'), eyeR = $('eyeR'), pupilL = $('pupilL'), pupilR = $('pupilR');
  const tail = $('tail');
  const pawF = $('pawF'), pawB = $('pawB');

  // Clamp helper
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // Linear interpolate
  const lerp = (a, b, t) => a + (b - a) * t;
  // Map months [0..12] to t [0..1]
  const norm = (m) => clamp(m / 12, 0, 1);

  // Derived facts (very rough illustrative ranges)
  function estWeight( months ){
    // ~0.1 kg at birth → ~3.5 kg at 12 mo (varies by breed/sex)
    const t = norm(months);
    return (lerp(0.1, 3.5, Math.pow(t, 0.85))).toFixed(1);
  }
  function estSleep( months ){
    // neonates ~20h → adult ~15h
    const t = norm(months);
    return Math.round(lerp(20, 15, t));
  }
  function stageLabel( months ){
    if (months < 0.5) return 'Newborn';
    if (months < 1) return 'Neonate';
    if (months < 2) return 'Wobbly Walker';
    if (months < 4) return 'Explorer';
    if (months < 7) return 'Teen';
    return 'Young Adult';
  }

  function drawCat(months){
    const t = norm(months);

    // Body ellipse grows + elongates slightly
    const bodyRx = lerp(55, 95, t);
    const bodyRy = lerp(34, 64, t);
    body.setAttribute('rx', bodyRx.toFixed(2));
    body.setAttribute('ry', bodyRy.toFixed(2));
    body.setAttribute('cx', lerp(200, 215, t).toFixed(2));
    body.setAttribute('cy', lerp(205, 200, t).toFixed(2));

    // Head grows but proportionally smaller over time
    const headR = lerp(40, 46, t) * lerp(1.15, 0.85, t);
    head.setAttribute('r', headR.toFixed(2));
    head.setAttribute('cx', lerp(140, 130, t).toFixed(2));
    head.setAttribute('cy', lerp(160, 155, t).toFixed(2));

    // Ears: taller and sharper with age
    const earBaseY = lerp(115, 108, t);
    const earSpan = lerp(24, 32, t);
    const earHeight = lerp(18, 28, t);
    const headX = parseFloat(head.getAttribute('cx'));
    const headY = parseFloat(head.getAttribute('cy'));
    const headRadius = parseFloat(head.getAttribute('r'));

    // Left ear points
    const lBaseX1 = headX - earSpan/2, lBaseX2 = headX - earSpan/6;
    const lTipX = headX - earSpan/2.2, lTipY = earBaseY - earHeight;
    earL.setAttribute('points', `${lBaseX1},${earBaseY} ${lBaseX2},${earBaseY} ${lTipX},${lTipY}`);
    // Right ear points
    const rBaseX1 = headX + earSpan/6, rBaseX2 = headX + earSpan/2;
    const rTipX = headX + earSpan/2.2, rTipY = earBaseY - earHeight;
    earR.setAttribute('points', `${rBaseX1},${earBaseY} ${rBaseX2},${earBaseY} ${rTipX},${rTipY}`);

    // Eyes: bigger in kittens, shrink relative to head with age
    const eyeR = lerp(6.2, 4.2, t);
    eyeL.setAttribute('r', eyeR.toFixed(2));
    eyeR.setAttribute('r', eyeR.toFixed(2));
    pupilL.setAttribute('r', (eyeR*0.44).toFixed(2));
    pupilR.setAttribute('r', (eyeR*0.44).toFixed(2));
    eyeL.setAttribute('cx', (headX - lerp(12, 15, t)).toFixed(2));
    eyeR.setAttribute('cx', (headX + lerp(12, 15, t)).toFixed(2));
    eyeL.setAttribute('cy', (headY - lerp(2, 0, t)).toFixed(2));
    eyeR.setAttribute('cy', (headY - lerp(2, 0, t)).toFixed(2));
    pupilL.setAttribute('cx', eyeL.getAttribute('cx'));
    pupilR.setAttribute('cx', eyeR.getAttribute('cx'));
    pupilL.setAttribute('cy', eyeL.getAttribute('cy'));
    pupilR.setAttribute('cy', eyeR.getAttribute('cy'));

    // Tail: longer & curlier with age
    const tailBaseX = lerp(280, 300, t);
    const tailBaseY = lerp(212, 205, t);
    const tailLen = lerp(60, 120, t);
    const curl = lerp(0, 40, t); // curvature
    const tipX = tailBaseX + tailLen * 0.7;
    const tipY = tailBaseY - tailLen * 0.5;
    const c1x = tailBaseX + tailLen * 0.3;
    const c1y = tailBaseY - curl * 0.4;
    const c2x = tailBaseX + tailLen * 0.6;
    const c2y = tailBaseY - curl;
    const tailWidth = lerp(14, 18, t);
    tail.setAttribute('d', `M ${tailBaseX} ${tailBaseY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tipX} ${tipY}
                            a ${tailWidth} ${tailWidth} 0 1 1 -0.1 0.1 Z`);

    // Paws scale
    pawF.setAttribute('rx', lerp(12, 16, t).toFixed(2));
    pawF.setAttribute('ry', lerp(8, 10, t).toFixed(2));
    pawB.setAttribute('rx', lerp(14, 18, t).toFixed(2));
    pawB.setAttribute('ry', lerp(9, 12, t).toFixed(2));

    // Update stats
    monthOut.textContent = months.toFixed(1);
    stageOut.textContent = stageLabel(months);
    weightOut.textContent = estWeight(months);
    sleepOut.textContent = estSleep(months);
  }

  // Human age converter
  (function(){
    const input = document.getElementById('catYears');
    const out = document.getElementById('humanOut');
    const btn = document.getElementById('convertBtn');
    function convert(){
      const y = Math.max(0, parseFloat(input.value||0));
      let human;
      if (y <= 1) human = 15*y;
      else if (y <= 2) human = 24 + (y-2)*9; // smooth bridge
      else human = 24 + (y-2)*4;
      out.textContent = '≈ ' + Math.round(human) + ' human years';
    }
    btn.addEventListener('click', convert);
    input.addEventListener('input', convert);
    convert();
  })();

  // Wire slider
  monthRange.addEventListener('input', (e) => drawCat(parseFloat(e.target.value)));
  // Initial draw
  drawCat(parseFloat(monthRange.value));
})();