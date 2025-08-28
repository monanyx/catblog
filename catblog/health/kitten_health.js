(() => {
  // --- Tabs ---
  const tabs = Array.from(document.querySelectorAll('#tabs .tab'));
  const panes = {
    overview: document.getElementById('pane-overview'),
    vaccines: document.getElementById('pane-vaccines'),
    care: document.getElementById('pane-care'),
    vetlog: document.getElementById('pane-vetlog')
  };
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    Object.values(panes).forEach(p => p.classList.remove('show'));
    panes[tab.dataset.pane].classList.add('show');
  }));

  // --- Overview: age slider -> stage + checklist ---
  const ageRange = document.getElementById('ageMonths');
  const ageOut = document.getElementById('ageOut');
  const stageOut = document.getElementById('stageOut');
  const checklistEl = document.getElementById('checklist');

  function stageLabel(m){
    if (m < 0.5) return 'Newborn';
    if (m < 1) return 'Neonate';
    if (m < 2) return 'Wobbly Walker';
    if (m < 4) return 'Explorer';
    if (m < 7) return 'Teen';
    return 'Young Adult';
  }

  const tasksByStage = [
    { when: m => m < 0.5, text: 'Warmth support (no drafts), frequent feeds.' },
    { when: m => m < 1,   text: 'Begin gentle handling and supervised socialization.' },
    { when: m => m < 2,   text: 'Introduce litter tray (low sides), short play.' },
    { when: m => m < 3,   text: 'First vet check if not done; discuss deworming.' },
    { when: m => m < 4,   text: 'Schedule FVRCP #1 if vet-approved.' },
    { when: m => m < 5,   text: 'Transition to kitten wet/dry food; 3–4 meals/day.' },
    { when: m => m < 7,   text: 'FVRCP series + rabies per vet; regular nail trims.' },
    { when: m => m >= 6,  text: 'Discuss spay/neuter timing with vet.' }
  ];

  function renderChecklist(m){
    checklistEl.innerHTML = '';
    tasksByStage.forEach(t => {
      if (t.when(m)) {
        const row = document.createElement('label');
        row.className = 'task';
        row.innerHTML = `<input type="checkbox"> <span>${t.text}</span>`;
        checklistEl.appendChild(row);
      }
    });
    if (!checklistEl.children.length){
      const row = document.createElement('div');
      row.className = 'task'; row.textContent = 'Keep up with play, enrichment, and regular checkups.';
      checklistEl.appendChild(row);
    }
  }

  ageRange.addEventListener('input', () => {
    const m = parseFloat(ageRange.value);
    ageOut.textContent = m.toFixed(1);
    stageOut.textContent = stageLabel(m);
    renderChecklist(m);
  });
  // init
  renderChecklist(parseFloat(ageRange.value));

  // --- Vaccines: generate dates from birth date ---
  const genBtn = document.getElementById('genVax');
  const birthInput = document.getElementById('birthDate');
  const vaxOut = document.getElementById('vaxOut');

  function addWeeks(date, w){ const d = new Date(date); d.setDate(d.getDate() + w*7); return d; }
  function fmt(d){ return d.toLocaleDateString(); }

  genBtn.addEventListener('click', () => {
    const b = birthInput.valueAsDate;
    if (!b){ vaxOut.textContent = 'Pick a start date.'; return; }
    const plan = [
      { label:'FVRCP #1', when: addWeeks(b, 7) },      // 6–8 weeks ~7
      { label:'FVRCP #2', when: addWeeks(b, 11) },     // 10–12 weeks ~11
      { label:'FVRCP #3 + Rabies', when: addWeeks(b, 15) }, // 14–16 ~15
      { label:'Boosters (~1 year)', when: addWeeks(b, 52) }
    ];
    vaxOut.innerHTML = plan.map(p => `<div class="vrow"><strong>${p.label}</strong> → <span>${fmt(p.when)}</span></div>`).join('');
  });

  // --- Care: hydration estimator ---
  const weightKg = document.getElementById('weightKg');
  const calcHydro = document.getElementById('calcHydro');
  const waterOut = document.getElementById('waterOut');
  calcHydro.addEventListener('click', () => {
    const w = parseFloat(weightKg.value);
    if (isNaN(w) || w <= 0){ waterOut.textContent = 'Enter a valid weight.'; return; }
    const low = Math.round(w*50);    // 50 ml/kg/day
    const high = Math.round(w*60);   // 60 ml/kg/day
    waterOut.textContent = `${low}–${high} ml/day`;
  });

  // --- Weight tracker (localStorage) ---
  const tDate = document.getElementById('tDate');
  const tWeight = document.getElementById('tWeight');
  const addEntry = document.getElementById('addEntry');
  const trackTable = document.getElementById('trackTable').querySelector('tbody');
  const exportTrack = document.getElementById('exportTrack');
  const clearTrack = document.getElementById('clearTrack');
  const KEY_TRACK = 'kitten_weight_log_v1';

  function loadTrack(){
    try { return JSON.parse(localStorage.getItem(KEY_TRACK) || '[]'); } catch { return []; }
  }
  function saveTrack(rows){ localStorage.setItem(KEY_TRACK, JSON.stringify(rows)); }
  function renderTrack(){
    const data = loadTrack();
    trackTable.innerHTML = '';
    data.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.date}</td><td>${r.weight}</td><td><button class="btn danger" data-i="${idx}">Delete</button></td>`;
      trackTable.appendChild(tr);
    });
  }
  addEntry.addEventListener('click', () => {
    const d = tDate.value;
    const w = parseFloat(tWeight.value);
    if (!d || isNaN(w) || w<=0) return;
    const data = loadTrack();
    data.push({date:d, weight:w});
    saveTrack(data); renderTrack();
    tWeight.value='';
  });
  trackTable.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-i]'); if(!btn) return;
    const i = parseInt(btn.dataset.i, 10);
    const data = loadTrack(); data.splice(i,1); saveTrack(data); renderTrack();
  });
  exportTrack.addEventListener('click', ()=>{
    const blob = new Blob([localStorage.getItem(KEY_TRACK) || '[]'], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kitten_weight_log.json'; a.click();
  });
  clearTrack.addEventListener('click', ()=>{ if(confirm('Clear all weight entries?')){ localStorage.removeItem(KEY_TRACK); renderTrack(); } });
  renderTrack();

  // --- Vet log (localStorage) ---
  const vDate = document.getElementById('vDate');
  const vReason = document.getElementById('vReason');
  const vMed = document.getElementById('vMed');
  const vNotes = document.getElementById('vNotes');
  const addVet = document.getElementById('addVet');
  const vetTable = document.getElementById('vetTable').querySelector('tbody');
  const exportVet = document.getElementById('exportVet');
  const clearVet = document.getElementById('clearVet');
  const KEY_VET = 'kitten_vet_log_v1';

  function loadVet(){ try { return JSON.parse(localStorage.getItem(KEY_VET) || '[]'); } catch { return []; } }
  function saveVet(rows){ localStorage.setItem(KEY_VET, JSON.stringify(rows)); }
  function renderVet(){
    const data = loadVet();
    vetTable.innerHTML = '';
    data.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.date||''}</td><td>${r.reason||''}</td><td>${r.med||''}</td><td>${r.notes||''}</td><td><button class="btn danger" data-i="${idx}">Delete</button></td>`;
      vetTable.appendChild(tr);
    });
  }
  addVet.addEventListener('click', () => {
    const row = {date:vDate.value, reason:vReason.value, med:vMed.value, notes:vNotes.value};
    if (!row.date && !row.reason && !row.med && !row.notes) return;
    const data = loadVet(); data.push(row); saveVet(data); renderVet();
    vReason.value = vMed.value = vNotes.value = '';
  });
  vetTable.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-i]'); if(!btn) return;
    const i = parseInt(btn.dataset.i, 10);
    const data = loadVet(); data.splice(i,1); saveVet(data); renderVet();
  });
  exportVet.addEventListener('click', ()=>{
    const blob = new Blob([localStorage.getItem(KEY_VET) || '[]'], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kitten_vet_log.json'; a.click();
  });
  clearVet.addEventListener('click', ()=>{ if(confirm('Clear all vet entries?')){ localStorage.removeItem(KEY_VET); renderVet(); } });
  renderVet();
})();