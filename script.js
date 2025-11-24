// script.js
// Clean, robust behavior controlling closed/open states and page navigation.
// Expectations:
// - GSAP is available on the page for animations (used if present).
// - cover/title/enter visible only when closed; page content and controls only when open.
// - top-right menu hidden until open.
// - prev/next arrows auto-hide at edges.
// - open background (backgroundpaper.png) is applied via CSS variable.

(() => {
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
    console.error('Required DOM elements missing: sketchbook or cover');
    return;
  }

  // State
  let current = 0;
  const maxIndex = pages.length - 1;
  let flipping = false;

  // Helpers to set CSS variables
  function setOpenBgVariable() {
    sketchbook.style.setProperty('--open-bg-url', `url('${OPEN_BG_SRC}')`);
  }
  function setCoverVariable() {
    cover.style.setProperty('--cover-src', `url('${COVER_SRC}')`);
  }

  // Preload images (report errors in console)
  function preload(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(src);
      img.src = src;
    });
  }

  // Apply inline backgrounds as a fallback (keeps visuals even if CSS fails)
  function applyInlineBackgrounds() {
    if (leftPage) {
      leftPage.style.backgroundImage = `url('${LEFT_SRC}')`;
      leftPage.style.backgroundSize = 'contain';
    }
    pages.forEach(p => {
      p.style.backgroundImage = `url('${RIGHT_SRC}')`;
      p.style.backgroundSize = 'contain';
    });
  }

  // Show/hide menu (also updates aria-hidden)
  function showMenu() {
    const m = document.getElementById('pageMenu');
    if (!m) return;
    m.style.display = 'flex';
    m.setAttribute('aria-hidden', 'false');
    m.style.pointerEvents = 'auto';
  }
  function hideMenu() {
    const m = document.getElementById('pageMenu');
    if (!m) return;
    m.style.display = 'none';
    m.setAttribute('aria-hidden', 'true');
    m.style.pointerEvents = 'none';
  }

  // Keep left-page section slot for injecting active content
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

  // Read page templates
  const pageTemplates = pages.map(p => {
    const content = p.querySelector('.page-content');
    return content ? content.innerHTML : '';
  });

  function stripLeadingH2(html) {
    const t = document.createElement('div');
    t.innerHTML = html || '';
    const h2 = t.querySelector('h2');
    if (h2) h2.remove();
    return t.innerHTML;
  }

  // Sync left panel content (title + body) for given index
  const PAGE_TITLES = pages.map((p, i) => {
    const h2 = p.querySelector('h2');
    return h2 ? h2.textContent.trim() : `Page ${i+1}`;
  });
  function syncLeftForIndex(i) {
    const idx = Math.max(0, Math.min(i, pageTemplates.length - 1));
    const body = stripLeadingH2(pageTemplates[idx] || '');
    if (leftSlot) leftSlot.innerHTML = `<h2>${PAGE_TITLES[idx] || `Page ${idx+1}`}</h2>${body}`;
    // ensure page H2s are canonical
    const right = pages[idx];
    if (right) {
      const h2 = right.querySelector('h2');
      if (h2) h2.textContent = PAGE_TITLES[idx];
    }
  }

  // Update control visibility and disable edges
  function updateControlsVisibility() {
    if (!controls) return;
    // container show/hide handled by CSS based on .open; just ensure button states
    if (current <= 0) {
      prevBtn.style.display = 'none';
      prevBtn.disabled = true;
      prevBtn.setAttribute('aria-hidden', 'true');
    } else {
      prevBtn.style.display = '';
      prevBtn.disabled = false;
      prevBtn.setAttribute('aria-hidden', 'false');
    }
    if (current >= maxIndex) {
      nextBtn.style.display = 'none';
      nextBtn.disabled = true;
      nextBtn.setAttribute('aria-hidden', 'true');
    } else {
      nextBtn.style.display = '';
      nextBtn.disabled = false;
      nextBtn.setAttribute('aria-hidden', 'false');
    }
  }

  // Flip animation (uses GSAP if available; otherwise just toggles state)
  function flipPage(index, direction = 'forward') {
    return new Promise(resolve => {
      const page = pages[index];
      if (!page) return resolve();
      if (window.gsap) {
        const tl = gsap.timeline({
          onComplete: () => resolve()
        });
        if (direction === 'forward') {
          page.style.zIndex = 300;
          tl.to(page, { duration: 0.65, rotationY: -180, transformOrigin: 'left center', ease: 'power2.inOut' });
        } else {
          page.style.zIndex = 300;
          page.style.transform = 'rotateY(-180deg)';
          tl.to(page, { duration: 0.65, rotationY: 0, transformOrigin: 'left center', ease: 'power2.inOut' });
        }
      } else {
        // fallback: no-visible animation, just wait a short moment
        setTimeout(resolve, 220);
      }
    });
  }

  // Open/close behavior
  async function openBook() {
    if (sketchbook.classList.contains('open')) return;
    // set CSS variables
    setOpenBgVariable();
    setCoverVariable();
    // show DOM panels (they'll be visually hidden by CSS while open, but we keep them in DOM)
    if (leftPage) leftPage.style.display = 'block';
    if (pagesContainer) pagesContainer.style.display = 'block';
    // add class
    sketchbook.classList.add('open');
    // accessibility: hide cover-art from assistive tech
    const coverArt = cover.querySelector('.cover-art');
    if (coverArt) coverArt.setAttribute('aria-hidden', 'true');
    // animate cover out of the way
    if (window.gsap) {
      await new Promise(res => {
        const tl = gsap.timeline({ onComplete: res });
        tl.to(cover, { duration: 1.0, rotationY: -160, transformOrigin: 'left center', ease: 'power3.out' });
      });
    } else {
      cover.style.transform = 'rotateY(-160deg)';
      await new Promise(r => setTimeout(r, 350));
    }
    // reveal controls/menu
    showMenu();
    updateControlsVisibility();
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
    hideMenu();
    // accessibility: show cover-art
    const coverArt = cover.querySelector('.cover-art');
    if (coverArt) coverArt.setAttribute('aria-hidden', 'false');

    // hide panels visually (CSS handles this). Keep pages in DOM but hide content
    updateControlsVisibility();
  }

  // Sequential navigation to a target page index
  async function goToPage(target) {
    const t = Math.max(0, Math.min(target, maxIndex));
    if (!sketchbook.classList.contains('open')) {
      await openBook();
    }
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

  // Event bindings
  if (enterBtn) {
    enterBtn.addEventListener('click', async () => {
      if (!sketchbook.classList.contains('open')) {
        await openBook();
      } else {
        await closeBook();
      }
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

  // Keyboard
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') {
      if (nextBtn) nextBtn.click();
    } else if (e.key === 'ArrowLeft') {
      if (prevBtn) prevBtn.click();
    } else if (e.key === 'Enter') {
      if (enterBtn) enterBtn.click();
    } else if (e.key === 'Escape') {
      if (sketchbook.classList.contains('open')) closeBook();
    }
  });

  // Create a simple page menu (hamburger + select) hidden until open.
  function createPageMenu() {
    const existing = document.getElementById('pageMenu');
    if (existing) return existing;

    const menu = document.createElement('div');
    menu.id = 'pageMenu';
    menu.setAttribute('aria-hidden', 'true');
    Object.assign(menu.style, {
      position: 'absolute', top: '12px', right: '14px', zIndex: 1600,
      display: 'none', alignItems: 'center', gap: '6px', fontFamily: 'inherit', pointerEvents: 'none'
    });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Menu';
    btn.innerHTML = '☰';
    Object.assign(btn.style, { fontSize:'20px', padding:'6px 8px', borderRadius:'6px', border:'2px solid rgba(0,0,0,0.12)', background:'rgba(255,255,255,0.9)', cursor:'pointer', fontFamily: '"Carrotflower", "Amatic SC", sans-serif' });

    const select = document.createElement('select');
    select.id = 'pageSelect';
    Object.assign(select.style, { padding:'6px 8px', borderRadius:'6px', border:'2px solid rgba(0,0,0,0.12)', background:'rgba(255,255,255,0.95)', display:'none' });

    PAGE_TITLES.forEach((title, idx) => {
      const o = document.createElement('option');
      o.value = String(idx);
      o.textContent = title;
      select.appendChild(o);
    });

    select.addEventListener('change', async () => {
      const val = Number(select.value);
      if (!Number.isNaN(val)) await goToPage(val);
    });

    btn.addEventListener('click', () => {
      select.style.display = (select.style.display === 'none' || !select.style.display) ? 'inline-block' : 'none';
    });

    menu.appendChild(btn);
    menu.appendChild(select);
    sketchbook.appendChild(menu);
    return menu;
  }

  // initialize things on load
  async function init() {
    // set CSS variables
    setOpenBgVariable();
    setCoverVariable();
    // preload key images (best-effort)
    try { await Promise.all([preload(COVER_SRC), preload(OPEN_BG_SRC)]); } catch(e) { /* ignore */ }
    // apply inline fallbacks
    applyInlineBackgrounds();
    // initial left content
    syncLeftForIndex(current);
    // ensure closed-state visibility: cover-art visible, page content hidden
    hideMenu();
    updateControlsVisibility();
  }

  // Expose some helpers (for debugging / future use)
  window.__sketchbook = {
    openBook,
    closeBook,
    goToPage,
    updateControlsVisibility,
    getState: () => ({ current, maxIndex, open: sketchbook.classList.contains('open') })
  };

  // run init
  init();

})();
