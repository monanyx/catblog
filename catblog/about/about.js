(() => {
  // Persist goals locally
  const KEY = 'about_goals_v1';
  const list = document.getElementById('goals');
  const saveBtn = document.getElementById('saveGoals');
  const clearBtn = document.getElementById('clearGoals');

  function save(){
    const items = Array.from(list.querySelectorAll('input[type=checkbox]')).map((cb,i)=>({i, checked: cb.checked}));
    localStorage.setItem(KEY, JSON.stringify(items));
  }
  function load(){
    try{
      const items = JSON.parse(localStorage.getItem(KEY) || '[]');
      items.forEach(({i,checked}) => {
        const cb = list.querySelectorAll('input[type=checkbox]')[i];
        if (cb) cb.checked = checked;
      });
    } catch {}
  }
  saveBtn.addEventListener('click', save);
  clearBtn.addEventListener('click', () => { localStorage.removeItem(KEY); list.querySelectorAll('input').forEach(cb=> cb.checked=false); });
  load();
})();