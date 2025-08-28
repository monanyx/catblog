(() => {
  const tabs = Array.from(document.querySelectorAll('#tabs .tab'));
  const gallery = document.getElementById('gallery');
  const tiles = Array.from(gallery.querySelectorAll('.tile'));
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbClose = document.getElementById('lbClose');
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showTile(tile, delayMs){
    tile.style.display = '';
    tile.classList.add('hide');        // ensure hidden start
    // set per-tile delay for stagger (skip if reduced motion)
    tile.style.transitionDelay = RM ? '0ms' : `${delayMs}ms`;
    // reflow to apply the start state
    void tile.offsetWidth;
    tile.classList.remove('hide');     // animate to visible
  }

  function hideTile(tile){
    if (tile.classList.contains('hide')) return;
    tile.style.transitionDelay = '0ms'; // hide immediately without extra delay
    tile.classList.add('hide');
    tile.addEventListener('transitionend', (e)=>{
      if (e.propertyName !== 'opacity') return;
      tile.style.display = 'none';
    }, { once:true });
  }

  function applyFilter(cat){
    // active tab state
    tabs.forEach(t => t.classList.toggle('active', t.dataset.cat === cat || (cat==='all' && t.dataset.cat==='all')));

    // determine target visible tiles
    const target = tiles.filter(t => cat === 'all' || t.dataset.cat === cat);

    // first, hide the rest (no stagger on hide)
    tiles.forEach(t => { if (!target.includes(t)) hideTile(t); });

    // then, show target with stagger
    let idx = 0;
    const baseDelay = 40; // ms between tiles
    target.forEach(t => {
      const wasHidden = (getComputedStyle(t).display === 'none') || t.classList.contains('hide');
      if (wasHidden) showTile(t, idx * baseDelay);
      else t.style.transitionDelay = '0ms'; // already visible
      idx++;
    });
  }

  // wire tabs
  tabs.forEach(tab => tab.addEventListener('click', () => applyFilter(tab.dataset.cat)));

  // initial state (read hash if present)
  const initial = new URL(window.location).hash.replace('#', '') || 'all';
  const valid = ['all','newborn','wobbly','explorer','teen','adult'];
  applyFilter(valid.includes(initial) ? initial : 'all');

  // lightbox
  gallery.addEventListener('click', e => {
    const t = e.target.closest('.tile'); if(!t) return;
    lbImg.src = t.dataset.src || t.querySelector('img')?.src || '';
    lb.classList.add('open');
    document.body.style.overflow='hidden';
  });
  function close(){ lb.classList.remove('open'); lbImg.src=''; document.body.style.overflow=''; }
  lbClose.addEventListener('click', close);
  lb.addEventListener('click', e => { if(e.target === lb) close(); });
  window.addEventListener('keydown', e => { if(e.key==='Escape' && lb.classList.contains('open')) close(); });
})();