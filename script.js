// script.js
// Minimal, focused behavior:
// - Closed: cover displayed. Click Enter to open.
// - Open: show backgroundpaper.png (via CSS variable), show pages (one at a time).
// - Titles centered in Carrotflower, black. Bottom arrow controls to navigate.
// - Top-right dropdown menu to jump to pages.
// - Prev/Next arrows auto-hide at edges.

(() => {
  const sketchbook = document.getElementById('sketchbook');
  const cover = document.getElementById('cover');
  const enterBtn = document.getElementById('enterBtn');
  const pagesContainer = document.getElementById('pages');
  const pages = Array.from(document.querySelectorAll('.pages .page'));
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const controls = document.querySelector('.controls');

  const PAGE_TITLES = ['Home', 'About Me', 'Digital Art', 'Animations/GIFs', 'Sketches', 'Demo Reel'];

  // Guard
  if (!sketchbook) {
    console.error('Missing #sketchbook element');
    return;
  }

  // Initialize CSS vars (open background)
  sketchbook.style.setProperty('--open-bg-url', "url('assets/backgroundpaper.png')");
  cover.style.setProperty('--cover-src', "url('assets/bookcover.jpg')");

  // State
  let current = 0;
  const maxIndex = Math.max(0, pages.length - 1);

  // Utility: ensure each right page has a title (H2) and the page-content wrapper exists
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
    h2.textContent = PAGE_TITLES[i] || `Page ${i+1}`;
    // optional body placeholder (left empty)
    let body = content.querySelector('.body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'body';
      content.appendChild(body);
    }
  });

  // Activate a page (show it)
  function activatePage(index) {
    index = Math.max(0, Math.min(index, maxIndex));
    pages.forEach((p, i) => {
      if (i === index) p.classList.add('active');
      else p.classList.remove('active');
    });
    current = index;
    updateControlsVisibility();
  }

  // Update prev/next visibility
  function updateControlsVisibility() {
    if (!controls) return;
    if (current <= 0) {
      prevBtn.style.display = 'none';
      prevBtn.disabled = true;
    } else {
      prevBtn.style.display = '';
      prevBtn.disabled = false;
    }
    if (current >= maxIndex) {
      nextBtn.style.display = 'none';
      nextBtn.disabled = true;
    } else {
      nextBtn.style.display = '';
      nextBtn.disabled = false;
    }
  }

  // Menu creation (top-right)
  function createPageMenu() {
    let menu = document.getElementById('pageMenu');
    if (menu) return menu;

    menu = document.createElement('div');
    menu.id = 'pageMenu';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Menu';
    btn.textContent = '☰';

    const select = document.createElement('select');
    select.id = 'pageSelect';
    PAGE_TITLES.forEach((t, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = t;
      select.appendChild(o);
    });

    // Jump to page when select changes
    select.addEventListener('change', (e) => {
      const idx = Number(select.value);
      goToPage(idx);
      select.blur();
    });

    // Toggle select visibility on btn click (desktop-friendly)
    btn.addEventListener('click', () => {
      select.style.display = (select.style.display === 'inline-block' ? 'none' : 'inline-block');
      if (select.style.display === 'inline-block') select.focus();
    });

    menu.appendChild(btn);
    menu.appendChild(select);
    document.body.appendChild(menu); // append at body level so absolute positioning works
    // Move it inside sketchbook for CSS selection (.sketchbook.open #pageMenu)
    sketchbook.appendChild(menu);
    return menu;
  }

  // Ensure menu exists
  createPageMenu();

  // Open / Close actions
  async function openBook() {
    if (sketchbook.classList.contains('open')) return;
    sketchbook.classList.add('open');
    // Show pages container and activate current page
    if (pagesContainer) pagesContainer.style.display = 'block';
    activatePage(current);
    // show controls/menu are controlled by CSS; still call update to set edge buttons
    updateControlsVisibility();
  }
  function closeBook() {
    if (!sketchbook.classList.contains('open')) return;
    sketchbook.classList.remove('open');
    // hide pages container
    if (pagesContainer) pagesContainer.style.display = 'none';
    // hide controls/menu are handled by CSS
  }

  // Navigate
  async function goToPage(index) {
    index = Math.max(0, Math.min(index, maxIndex));
    if (!sketchbook.classList.contains('open')) await openBook();
    activatePage(index);
  }

  // Event handlers
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      if (!sketchbook.classList.contains('open')) openBook();
      else closeBook();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      if (current < maxIndex) {
        await goToPage(current + 1);
      }
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', async () => {
      if (current > 0) {
        await goToPage(current - 1);
      }
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') {
      if (current < maxIndex) goToPage(current + 1);
    } else if (e.key === 'ArrowLeft') {
      if (current > 0) goToPage(current - 1);
    } else if (e.key === 'Enter') {
      if (!sketchbook.classList.contains('open')) openBook();
    } else if (e.key === 'Escape') {
      if (sketchbook.classList.contains('open')) closeBook();
    }
  });

  // Initialization: ensure pages container hidden until opened, set initial page titles
  function init() {
    // hide pages until open
    if (pagesContainer) pagesContainer.style.display = sketchbook.classList.contains('open') ? 'block' : 'none';
    // set initial active page content
    pages.forEach((p, i) => {
      if (i === current) p.classList.add('active'); else p.classList.remove('active');
    });
    updateControlsVisibility();
  }

  init();

  // Expose for debugging
  window.__sketchbook = {
    goToPage, openBook, closeBook, getState: () => ({ current, maxIndex, open: sketchbook.classList.contains('open') })
  };
})();
