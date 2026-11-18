(() => {
  try { const theme = localStorage.getItem('thermal-theme'); if(theme)document.documentElement.dataset.theme=theme; } catch {}
  const button=document.getElementById('theme');
  const update=()=>button?.setAttribute('aria-label',document.documentElement.dataset.theme==='dark'?'Switch to light mode':'Switch to dark mode');
  button?.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('thermal-theme',theme);}catch{}update();});update();
  const updateLinks=()=>document.querySelectorAll('[data-scenario-link]').forEach(a=>{a.href=a.getAttribute('href').split('#')[0]+location.hash;});
  updateLinks();window.addEventListener('hashchange',updateLinks);
})();
