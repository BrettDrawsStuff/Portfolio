// script.js
// Full replacement — small, robust dropdown (icon-only until clicked).
// - Creates missing UI pieces if they're not present.
// - Page menu uses a custom options list (not a native <select>) so it starts minimized.
// - Clicking the menu icon toggles the options; clicking outside closes them.

(() => {
  const PAGE_TITLES = ['Home', 'About Me', 'Digital Art', 'Animations/GIFs', 'Sketches', 'Demo Reel'];

  const sketchbook = document.getElementById('sketchbook');
  if (!sketchbook) { console.error('No #sketchbook element found'); return; }
  const cover = document.getElementById('cover');
  const enterBtn = document.getElementById('enterBtn');

  // ensure pages container
  let pagesContainer = document.getElementById('pages');
  if (!pagesContainer) {
    pagesContainer = document.createElement('div');
    pagesContainer.id = 'pages';
    pagesContainer.className = 'pages';
    sketchbook.appendChild(pagesContainer);
  }

  // ensure pages exist and have titles
  let pages = Array.from(pagesContainer.querySelectorAll('.page'));
  if (pages.length < PAGE_TITLES.length) {
    pagesContainer.innerHTML = '';
    pages = PAGE_TITLES.map((title, i) => {
      const p = document.createElement('div');
      p.className = 'page';
      p.dataset.index = String(i);
      const content = document.createElement('div');
      content.className = 'page-content';
      const h2 = document.createElement('h2');
      h2.textContent = title;
      content.appendChild(h2);
      const body = document.createElement('div');
      body.className = 'body';
      content.appendChild(body);
      p.appendChild(content);
      pagesContainer.appendChild(p);
      return p;
    });
  } else {
    pages.forEach((p, i) => {
      let content = p.querySelector('.page-content');
      if (!content) {
        content = document.createElement('div');
        content.className = 'page-content';
        p.appendChild(content);
      }
      let h2 = content.querySelector('h2');
      if (!h2) {
        h2 = document.createElement('h2');
        content.insertAdjacentElement('afterbegin', h2);
      }
      h2.textContent = PAGE_TITLES[i] || h2.textContent || `Page ${i+1}`;
      let body = content.querySelector('.body');
      if (!body) {
        body = document.createElement('div');
        body.className = 'body';
        content.appendChild(body);
      }
    });
  }

  // controls (prev/next)
  let controls = document.querySelector('.controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'controls';
    sketchbook.appendChild(controls);
  }
  let prevBtn = document.getElementById('prevBtn');
  let nextBtn = document.getElementById('nextBtn');
  if (!prevBtn) {
    prevBtn = document.createElement('button');
    prevBtn.id = 'prevBtn';
    prevBtn.type = 'button';
    prevBtn.textContent = '◀';
    controls.appendChild(prevBtn);
  }
  if (!nextBtn) {
    nextBtn = document.createElement('button');
    nextBtn.id = 'nextBtn';
    nextBtn.type = 'button';
    nextBtn.textContent = '▶';
    controls.appendChild(nextBtn);
  }

  // create/customize page menu (top-right) — custom options (ul) to avoid native select behavior
  let pageMenu = document.getElementById('pageMenu');
  if (!pageMenu) {
    pageMenu = document.createElement('div');
    pageMenu.id = 'pageMenu';
    // icon button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'menu-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-haspopup', 'true');
    btn.textContent = '☰';
    // options container
    const options = document.createElement('div');
    options.className = 'menu-options';
    options.setAttribute('role', 'menu');
    PAGE_TITLES.forEach((t, idx) => {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'menu-option';
      opt.setAttribute('role', 'menuitem');
      opt.dataset.index = String(idx);
      opt.textContent = t;
      opt.addEventListener('click', (e) => {
        const i = Number(e.currentTarget.dataset.index);
        goToPage(i);
        closeMenu();
      });
      options.appendChild(opt);
    });
    pageMenu.appendChild(btn);
    pageMenu.appendChild(options);
    sketchbook.appendChild(pageMenu);

    // toggle behavior
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const isOpen = pageMenu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      // if opened, focus first option for keyboard users
      if (isOpen) {
        const first = options.querySelector('.menu-option');
        if (first) first.focus();
      }
    });
  } else {
    // ensure menu-options exist and are hidden initially
    const btn = pageMenu.querySelector('.menu-btn');
    const options = pageMenu.querySelector('.menu-options') || (function createOptions() {
      const o = document.createElement('div');
      o.className = 'menu-options';
      pageMenu.appendChild(o);
      return o;
    })();
    // rebuild options to match PAGE_TITLES
    options.innerHTML = '';
    PAGE_TITLES.forEach((t, idx) => {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'menu-option';
      opt.dataset.index = String(idx);
      opt.textContent = t;
      opt.addEventListener('click', (e) => {
        const i = Number(e.currentTarget.dataset.index);
        goToPage(i);
        closeMenu();
      });
      options.appendChild(opt);
    });
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const isOpen = pageMenu.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    }
  }

  // close menu helper
  function closeMenu() {
    if (!pageMenu) return;
    pageMenu.classList.remove('open');
    const btn = pageMenu.querySelector('.menu-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  // close menu on outside click
  document.addEventListener('click', (ev) => {
    if (!pageMenu) return;
    if (!pageMenu.contains(ev.target)) closeMenu();
  });

  // keyboard: Escape closes menu
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeMenu();
  });

  // state
  let current = 0;
  const maxIndex = pages.length - 1;

  function activatePage(index) {
    index = Math.max(0, Math.min(index, maxIndex));
    pages.forEach((p, i) => {
      if (i === index) p.classList.add('active');
      else p.classList.remove('active');
    });
    current = index;
    updateControlsVisibility();
  }

  function updateControlsVisibility() {
    if (prevBtn) {
      if (current <= 0) { prevBtn.style.display = 'none'; prevBtn.disabled = true; }
      else { prevBtn.style.display = ''; prevBtn.disabled = false; }
    }
    if (nextBtn) {
      if (current >= maxIndex) { nextBtn.style.display = 'none'; nextBtn.disabled = true; }
      else { nextBtn.style.display = ''; nextBtn.disabled = false; }
    }
  }

  async function openBook() {
    if (sketchbook.classList.contains('open')) return;
    sketchbook.classList.add('open');
    pagesContainer.style.display = 'block';
    activatePage(current);
    // ensure menu closed initially when opening
    closeMenu();
  }
  function closeBook() {
    if (!sketchbook.classList.contains('open')) return;
    sketchbook.classList.remove('open');
    pagesContainer.style.display = 'none';
    closeMenu();
  }
  async function goToPage(index) {
    index = Math.max(0, Math.min(index, maxIndex));
    if (!sketchbook.classList.contains('open')) await openBook();
    activatePage(index);
  }

  // attach events
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      if (sketchbook.classList.contains('open')) closeBook();
      else openBook();
    });
  } else if (cover) {
    cover.addEventListener('click', () => { if (!sketchbook.classList.contains('open')) openBook(); });
  }

  if (nextBtn) nextBtn.addEventListener('click', () => { if (current < maxIndex) goToPage(current + 1); });
  if (prevBtn) prevBtn.addEventListener('click', () => { if (current > 0) goToPage(current - 1); });

  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { if (current < maxIndex) goToPage(current + 1); }
    if (e.key === 'ArrowLeft')  { if (current > 0) goToPage(current - 1); }
    if (e.key === 'Enter') { if (!sketchbook.classList.contains('open')) openBook(); }
    if (e.key === 'Escape') { if (sketchbook.classList.contains('open')) closeBook(); }
  });

  // init
  function init() {
    pagesContainer.style.display = sketchbook.classList.contains('open') ? 'block' : 'none';
    activatePage(current);
    closeMenu();
  }

  // expose for debug
  window.__sketchbook = { openBook, closeBook, goToPage, getState: () => ({ current, maxIndex, open: sketchbook.classList.contains('open') }) };

  init();
})();
