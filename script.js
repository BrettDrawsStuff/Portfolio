// script.js
// Robust, minimal behavior that guarantees page titles, menu, and arrow controls work.
// - Creates missing UI (pages, controls, menu) if HTML doesn't already include them.
// - Ensures titles are visible above the open background.
// - Lightweight: no external dependencies required.

(() => {
  const PAGE_TITLES = ['Home', 'About Me', 'Digital Art', 'Animations/GIFs', 'Sketches', 'Demo Reel'];

  // Get or create sketchbook and cover elements
  const sketchbook = document.getElementById('sketchbook');
  if (!sketchbook) {
    console.error('[sketchbook] element not found. Aborting.');
    return;
  }
  const cover = document.getElementById('cover');
  const enterBtn = document.getElementById('enterBtn');

  // Ensure pages container exists; if not, create it
  let pagesContainer = document.getElementById('pages');
  if (!pagesContainer) {
    pagesContainer = document.createElement('div');
    pagesContainer.id = 'pages';
    pagesContainer.className = 'pages';
    // append inside sketchbook
    sketchbook.appendChild(pagesContainer);
  }

  // Ensure at least one .page exists for each PAGE_TITLES entry.
  let pages = Array.from(pagesContainer.querySelectorAll('.page'));
  if (pages.length < PAGE_TITLES.length) {
    // clear existing pages and recreate correct number to avoid mismatches
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
    // make sure titles exist and match PAGE_TITLES
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
      h2.textContent = PAGE_TITLES[i] || h2.textContent || `Page ${i + 1}`;
      let body = content.querySelector('.body');
      if (!body) {
        body = document.createElement('div');
        body.className = 'body';
        content.appendChild(body);
      }
    });
  }

  // Create controls area if missing
  let controls = document.querySelector('.controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'controls';
    controls.setAttribute('aria-hidden', 'true');
    const prevBtn = document.createElement('button');
    prevBtn.id = 'prevBtn';
    prevBtn.type = 'button';
    prevBtn.textContent = '←';
    const nextBtn = document.createElement('button');
    nextBtn.id = 'nextBtn';
    nextBtn.type = 'button';
    nextBtn.textContent = '→';
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    sketchbook.appendChild(controls);
  }
  // ensure prev/next buttons exist
  let prevBtn = document.getElementById('prevBtn');
  let nextBtn = document.getElementById('nextBtn');
  if (!prevBtn) {
    prevBtn = document.createElement('button');
    prevBtn.id = 'prevBtn';
    prevBtn.textContent = '←';
    controls.insertBefore(prevBtn, controls.firstChild);
  }
  if (!nextBtn) {
    nextBtn = document.createElement('button');
    nextBtn.id = 'nextBtn';
    nextBtn.textContent = '→';
    controls.appendChild(nextBtn);
  }

  // Create top-right menu if missing
  let pageMenu = document.getElementById('pageMenu');
  if (!pageMenu) {
    pageMenu = document.createElement('div');
    pageMenu.id = 'pageMenu';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '☰';
    btn.id = 'menuBtn';
    const select = document.createElement('select');
    select.id = 'pageSelect';
    PAGE_TITLES.forEach((t, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = t;
      select.appendChild(o);
    });
    // small behavior: selecting jumps to page
    select.addEventListener('change', () => {
      const idx = Number(select.value);
      goToPage(idx);
      select.style.display = 'none';
    });
    btn.addEventListener('click', () => {
      select.style.display = (select.style.display === 'inline-block' ? 'none' : 'inline-block');
      if (select.style.display === 'inline-block') select.focus();
    });
    pageMenu.appendChild(btn);
    pageMenu.appendChild(select);
    sketchbook.appendChild(pageMenu);
  }

  // state
  let current = 0;
  const maxIndex = pages.length - 1;

  // utilities
  function activatePage(index) {
    index = Math.max(0, Math.min(index, maxIndex));
    pages.forEach((p, i) => {
      if (i === index) p.classList.add('active');
      else p.classList.remove('active');
    });
    current = index;
    updateControlsVisibility();
    // set pageSelect value if present
    const select = document.getElementById('pageSelect');
    if (select) select.value = String(index);
  }

  function updateControlsVisibility() {
    // show/hide prev/next depending on edges
    if (prevBtn) {
      if (current <= 0) { prevBtn.style.display = 'none'; prevBtn.disabled = true; }
      else { prevBtn.style.display = ''; prevBtn.disabled = false; }
    }
    if (nextBtn) {
      if (current >= maxIndex) { nextBtn.style.display = 'none'; nextBtn.disabled = true; }
      else { nextBtn.style.display = ''; nextBtn.disabled = false; }
    }
  }

  // navigation helpers
  async function openBook() {
    if (sketchbook.classList.contains('open')) return;
    sketchbook.classList.add('open');
    // show pages container and ensure the current page is active
    pagesContainer.style.display = 'block';
    activatePage(current);
    // ensure menu is visible (CSS handles display via .open)
    // ensure controls are visible (CSS handles it)
  }
  function closeBook() {
    if (!sketchbook.classList.contains('open')) return;
    sketchbook.classList.remove('open');
    pagesContainer.style.display = 'none';
  }
  async function goToPage(index) {
    index = Math.max(0, Math.min(index, maxIndex));
    if (!sketchbook.classList.contains('open')) await openBook();
    activatePage(index);
  }

  // Attach events
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      if (sketchbook.classList.contains('open')) closeBook();
      else openBook();
    });
  } else {
    // if there's no enter button in markup, let clicking the cover open the book
    if (cover) {
      cover.addEventListener('click', () => { if (!sketchbook.classList.contains('open')) openBook(); });
    }
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (current < maxIndex) goToPage(current + 1);
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (current > 0) goToPage(current - 1);
    });
  }

  // keyboard navigation
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { if (current < maxIndex) goToPage(current + 1); }
    if (e.key === 'ArrowLeft') { if (current > 0) goToPage(current - 1); }
    if (e.key === 'Enter') { if (!sketchbook.classList.contains('open')) openBook(); }
    if (e.key === 'Escape') { if (sketchbook.classList.contains('open')) closeBook(); }
  });

  // initialization
  function init() {
    // default: hide pages until open
    pagesContainer.style.display = sketchbook.classList.contains('open') ? 'block' : 'none';
    // activate first page
    activatePage(current);
    // make sure titles are visible (style ensures black Carrotflower)
    updateControlsVisibility();
  }

  // expose for debugging
  window.__sketchbook = {
    openBook, closeBook, goToPage, activatePage, getState: () => ({ current, maxIndex, open: sketchbook.classList.contains('open') })
  };

  init();
})();
