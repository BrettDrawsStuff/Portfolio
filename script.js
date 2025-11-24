// script.js
// Rewritten to:
// - Ensure cover overlay only displays while CLOSED.
// - Ensure each page's own title/content is visible when OPEN.
// - Place the page dropdown menu in the TOP-LEFT and show it when the book is OPEN.
// - Keep arrow controls visible when open; JS will hide prev/next at edges.
// - Provide small debugging access at window.__sketchbook.

(function () {
  const COVER_SRC = 'assets/bookcover.jpg';
  const OPEN_BG_SRC = 'assets/backgroundpaper.png';
  const LEFT_SRC = 'assets/leftpage.png';
  const RIGHT_SRC = 'assets/rightpage.png';

  const sketchbook = document.getElementById('sketchbook');
  const cover = document.getElementById('cover');
  const enterBtn = document.getElementById('enterBtn');
  const leftPage = document.getElementById('left');
  const pagesContainer = document.getElementById('pages');
  const pages = Array.from(document.querySelectorAll('.pages .page'));
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const controls = document.querySelector('.controls');

  if (!sketchbook || !cover) {
    console.error('sketchbook or cover element missing');
    return;
  }

  // state
  let current = 0;
  const maxIndex = Math.max(0, pages.length - 1);
  let flipping = false;

  // helpers
  function setCSSVar(el, name, value) {
    el.style.setProperty(name, value);
  }

  function preload(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  // apply inline page backgrounds as fallback (non-critical)
  function applyInlineBackgrounds() {
    if (leftPage) {
      leftPage.style.backgroundImage = `url('${LEFT_SRC}')`;
      leftPage.style.backgroundSize = 'contain';
      leftPage.style.backgroundPosition = 'center';
      leftPage.style.backgroundRepeat = 'no-repeat';
    }
    pages.forEach(p => {
      p.style.backgroundImage = `url('${RIGHT_SRC}')`;
      p.style.backgroundSize = 'contain';
      p.style.backgroundPosition = 'center';
      p.style.backgroundRepeat = 'no-repeat';
    });
  }

  // ensure cover and open background CSS variables
  function applyVisualVars() {
    setCSSVar(document.documentElement, '--open-bg-url', `url('${OPEN_BG_SRC}')`);
    setCSSVar(document.documentElement, '--cover-src', `url('${COVER_SRC}')`);
  }

  // left slot management
  function ensureLeftSlot() {
    if (!leftPage) return null;
    const container = leftPage.querySelector('.page-content') || leftPage;
    let slot = container.querySelector('.left-page-section');
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'left-page-section';
      container.insertAdjacentElement('afterbegin', slot);
    }
    return slot;
  }
  const leftSlot = ensureLeftSlot();

  // page templates and titles
  const pageTemplates = pages.map(p => {
    const content = p.querySelector('.page-content');
    return content ? content.innerHTML : '';
  });
  const PAGE_TITLES = pages.map((p,i) => {
    const h2 = p.querySelector('h2');
    return h2 ? h2.textContent.trim() : `Page ${i+1}`;
  });

  function stripLeadingH2(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    const h2 = div.querySelector('h2');
    if (h2) h2.remove();
    return div.innerHTML;
  }

  function syncLeftForIndex(i) {
    const idx = Math.max(0, Math.min(i, pageTemplates.length - 1));
    const body = stripLeadingH2(pageTemplates[idx] || '');
    if (leftSlot) leftSlot.innerHTML = `<h2>${PAGE_TITLES[idx]}</h2>${body}`;
    // ensure right page H2 text matches canonical title
    const right = pages[idx];
    if (right) {
      const h2 = right.querySelector('h2');
      if (h2) h2.textContent = PAGE_TITLES[idx];
    }
  }

  // menu: top-left placement
  function createPageMenu() {
    const existing = document.getElementById('pageMenu');
    if (existing) return existing;

    const menu = document.createElement('div');
    menu.id = 'pageMenu';
    menu.setAttribute('aria-hidden', 'true');
    Object.assign(menu.style, {
      position: 'absolute',
      top: '12px',
      left: '14px', // top-left as requested
      zIndex: 1600,
      display: 'none',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'inherit',
      pointerEvents: 'none'
    });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Menu';
    btn.innerHTML = '☰';
    Object.assign(btn.style, { fontSize:'20px', padding:'6px 8px', borderRadius:'6px', border:'2px solid rgba(0,0,0,0.12)', background:'rgba(255,255,255,0.95)', cursor:'pointer', fontFamily: '"Carrotflower", "Amatic SC", sans-serif' });

    const select = document.createElement('select');
    select.id = 'pageSelect';
    Object.assign(select.style, { padding:'6px 8px', borderRadius:'6px', border:'2px solid rgba(0,0,0,0.12)', background:'rgba(255,255,255,0.95)', display:'none' });

    PAGE_TITLES.forEach((t, idx) => {
      const o = document.createElement('option');
      o.value = String(idx);
      o.textContent = t;
      select.appendChild(o);
    });

    select.addEventListener('change', async () => {
      const target = Number(select.value);
      if (!Number.isNaN(target)) await goToPage(target);
      select.style.display = 'none';
    });

    btn.addEventListener('click', () => {
      select.style.display = (select.style.display === 'none' || !select.style.display) ? 'inline-block' : 'none';
    });

    menu.appendChild(btn);
    menu.appendChild(select);
    sketchbook.appendChild(menu);
    return menu;
  }
  const pageMenu = createPageMenu();

  function showPageMenu() {
    if (!pageMenu) return;
    pageMenu.style.display = 'flex';
    pageMenu.style.pointerEvents = 'auto';
    pageMenu.setAttribute('aria-hidden', 'false');
  }
  function hidePageMenu() {
    if (!pageMenu) return;
    pageMenu.style.display = 'none';
    pageMenu.style.pointerEvents = 'none';
    pageMenu.setAttribute('aria-hidden', 'true');
  }

  // controls visibility at edges
  function updateControlsVisibility() {
    if (!controls) return;
    // container display is handled by CSS (.sketchbook.open .controls)
    // we only show/hide prev/next based on current index
    if (prevBtn) {
      if (current <= 0) { prevBtn.style.display = 'none'; prevBtn.disabled = true; prevBtn.setAttribute('aria-hidden','true'); }
      else { prevBtn.style.display = ''; prevBtn.disabled = false; prevBtn.setAttribute('aria-hidden','false'); }
    }
    if (nextBtn) {
      if (current >= maxIndex) { nextBtn.style.display = 'none'; nextBtn.disabled = true; nextBtn.setAttribute('aria-hidden','true'); }
      else { nextBtn.style.display = ''; nextBtn.disabled = false; nextBtn.setAttribute('aria-hidden','false'); }
    }
  }

  // basic flip animation using GSAP if present, otherwise simple timeout
  function flipPage(index, direction='forward') {
    return new Promise(resolve => {
      const page = pages[index];
      if (!page) return resolve();
      if (window.gsap) {
        const tl = gsap.timeline({ onComplete: resolve });
        if (direction === 'forward') {
          page.style.zIndex = 300;
          tl.to(page, { duration: 0.65, rotationY: -180, transformOrigin: 'left center', ease: 'power2.inOut' });
        } else {
          page.style.zIndex = 300;
          page.style.transform = 'rotateY(-180deg)';
          tl.to(page, { duration: 0.65, rotationY: 0, transformOrigin: 'left center', ease: 'power2.inOut' });
        }
      } else {
        setTimeout(resolve, 220);
      }
    });
  }

  // open/close book
  async function openBook() {
    if (sketchbook.classList.contains('open')) return;
    applyVisualVars();
    // show panels in DOM (CSS will make them visually hidden of needed)
    if (leftPage) leftPage.style.display = 'block';
    if (pagesContainer) pagesContainer.style.display = 'block';

    sketchbook.classList.add('open');
    // hide cover overlay from screen readers
    const ca = cover.querySelector('.cover-art');
    if (ca) ca.setAttribute('aria-hidden', 'true');

    // animate cover out of way
    if (window.gsap) {
      await new Promise(res => {
        const tl = gsap.timeline({ onComplete: res });
        tl.to(cover, { duration: 1.0, rotationY: -160, transformOrigin: 'left center', ease: 'power3.out' });
      });
    } else {
      cover.style.transform = 'rotateY(-160deg)';
      await new Promise(r => setTimeout(r, 350));
    }

    showPageMenu();
    updateControlsVisibility();
    syncLeftForIndex(current);
  }

  async function closeBook() {
    if (!sketchbook.classList.contains('open')) return;
    // animate cover back
    if (window.gsap) {
      await new Promise(res => {
        const tl = gsap.timeline({ onComplete: res });
        tl.to(cover, { duration: 0.9, rotationY: 0, transformOrigin: 'left center', ease: 'power2.in' });
      });
    } else {
      cover.style.transform = 'rotateY(0deg)';
      await new Promise(r => setTimeout(r, 220));
    }
    sketchbook.classList.remove('open');
    hidePageMenu();
    // restore cover-art for screen readers
    const ca = cover.querySelector('.cover-art');
    if (ca) ca.setAttribute('aria-hidden', 'false');
    updateControlsVisibility();
  }

  // goToPage sequential flips
  async function goToPage(target) {
    const t = Math.max(0, Math.min(target, maxIndex));
    if (!sketchbook.classList.contains('open')) await openBook();
    if (t === current) return;
    if (t > current) {
      while (current < t) {
        await flipPage(current, 'forward');
        current++;
      }
    } else {
      while (current > t) {
        current--;
        await flipPage(current, 'backward');
      }
    }
    syncLeftForIndex(current);
    updateControlsVisibility();
  }

  // event bindings
  if (enterBtn) {
    enterBtn.addEventListener('click', async () => {
      if (!sketchbook.classList.contains('open')) await openBook();
      else await closeBook();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      if (flipping) return;
      if (!sketchbook.classList.contains('open')) await openBook();
      if (current >= maxIndex) return;
      flipping = true;
      await flipPage(current, 'forward');
      current++;
      syncLeftForIndex(current);
      updateControlsVisibility();
      flipping = false;
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', async () => {
      if (flipping) return;
      if (!sketchbook.classList.contains('open')) await openBook();
      if (current <= 0) return;
      flipping = true;
      current--;
      await flipPage(current, 'backward');
      syncLeftForIndex(current);
      updateControlsVisibility();
      flipping = false;
    });
  }

  // keyboard
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { if (nextBtn) nextBtn.click(); }
    if (e.key === 'ArrowLeft') { if (prevBtn) prevBtn.click(); }
    if (e.key === 'Enter') { if (enterBtn) enterBtn.click(); }
    if (e.key === 'Escape') { if (sketchbook.classList.contains('open')) closeBook(); }
  });

  // initialization
  async function init() {
    applyVisualVars();
    applyInlineBackgrounds();
    await Promise.all([preload(COVER_SRC), preload(OPEN_BG_SRC)]);
    syncLeftForIndex(current);
    hidePageMenu();
    updateControlsVisibility();
    // ensure page content is visible only when open (CSS handles it), but make sure page H2s show
    pages.forEach((p, i) => {
      const h2 = p.querySelector('h2');
      if (h2) h2.textContent = PAGE_TITLES[i];
    });
  }

  // expose for debugging
  window.__sketchbook = {
    openBook, closeBook, goToPage, updateControlsVisibility,
    getState: () => ({ current, maxIndex, open: sketchbook.classList.contains('open') })
  };

  init();

})();
