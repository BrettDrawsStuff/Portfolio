// script.js
// Updated to ensure cover background is applied reliably by:
// 1) injecting --cover-url CSS variable on the .cover element once the image loads
// 2) leaving the CSS ::before rule to render the cover image (so cover-art cannot obscure it)
//
// Also keeps previous behavior: left/right sync, flipping, menu, and inline background fallbacks.

const enterBtn = document.getElementById('enterBtn');
const sketchbook = document.getElementById('sketchbook');
const cover = document.getElementById('cover');
const leftPage = document.getElementById('left');
const pagesContainer = document.getElementById('pages');
const pages = Array.from(document.querySelectorAll('.pages .page'));
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const controls = document.querySelector('.controls');

// Asset paths (relative)
const COVER_SRC = 'assets/bookcover.jpg';
const LEFT_SRC = 'assets/leftpage.png';
const RIGHT_SRC = 'assets/rightpage.png';

// Section titles
const PAGE_TITLES = [
  'Home',
  'About Me',
  'Digital Art',
  'Animations/GIFs',
  'Sketchbook',
  'Demo Reel'
];

// Capture right-page templates (HTML inside .page-content)
const pageTemplates = pages.map(p => {
  const content = p.querySelector('.page-content');
  return content ? content.innerHTML : '';
});

// Ensure left has a dedicated content slot at top
function ensureLeftSlot() {
  if (!leftPage) return null;
  const container = leftPage.querySelector('.page-content');
  if (!container) return null;
  let slot = container.querySelector('.left-page-section');
  if (!slot) {
    slot = document.createElement('div');
    slot.className = 'left-page-section';
    const nav = container.querySelector('.left-nav');
    if (nav && nav.parentNode === container) {
      nav.insertAdjacentElement('beforebegin', slot);
    } else {
      container.insertAdjacentElement('afterbegin', slot);
    }
  }
  return slot;
}
const leftSlot = ensureLeftSlot();

// Strip the leading H2 from a template HTML string
function stripLeadingH2(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html || '';
  const firstH2 = temp.querySelector('h2');
  if (firstH2) firstH2.remove();
  return temp.innerHTML;
}

// Sync left slot for index
function syncLeftForIndex(index) {
  const i = Math.max(0, Math.min(index, pageTemplates.length - 1));
  const templateHtml = pageTemplates[i] || '';
  const bodyHtml = stripLeadingH2(templateHtml);
  const leftHtml = `<h2>${PAGE_TITLES[i] || `Page ${i+1}`}</h2>` + bodyHtml;
  if (leftSlot) leftSlot.innerHTML = leftHtml;
  const activeRight = pages[i];
  if (activeRight) {
    const h2 = activeRight.querySelector('h2');
    if (h2) h2.textContent = PAGE_TITLES[i] || h2.textContent;
  }
}

// Apply inline backgrounds for left/right as fallback
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

// Ensure cover image loads, then inject CSS variable used by .cover::before
function ensureCoverBackground() {
  if (!cover) return;
  const img = new Image();
  img.onload = () => {
    // set CSS variable on the cover element so ::before uses it
    cover.style.setProperty('--cover-url', `url('${COVER_SRC}')`);
    // also set inline background-image as an additional fallback
    cover.style.backgroundImage = `url('${COVER_SRC}')`;
    cover.style.backgroundSize = 'contain';
    cover.style.backgroundPosition = 'center';
    cover.style.backgroundRepeat = 'no-repeat';
    console.log('Cover image loaded and applied:', COVER_SRC);
  };
  img.onerror = () => {
    console.error('Failed to load cover image at', COVER_SRC);
    // optional on-screen hint can be added here in development
  };
  img.src = COVER_SRC;
}

// initial view: apply backgrounds, sync left (home), hide pages until open
function setInitialView() {
  applyInlineBackgrounds();
  syncLeftForIndex(0);
  ensureCoverBackground();

  const coverTitle = cover.querySelector('.cover-title');
  if (coverTitle) coverTitle.textContent = "Brett's Portfolio";

  if (leftPage) leftPage.style.display = 'none';
  if (pagesContainer) pagesContainer.style.display = 'none';
  if (controls) controls.style.display = 'none';

  cover.style.transform = 'rotateY(0deg)';
  pages.forEach((p, i) => {
    p.style.transform = 'rotateY(0deg)';
    p.style.zIndex = (100 - i);
  });
}
setInitialView();

// menu creation (hamburger + select)
function createPageMenu() {
  const existing = document.getElementById('pageMenu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'pageMenu';
  Object.assign(menu.style, {
    position: 'absolute', top: '12px', right: '14px', zIndex: 800,
    display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', pointerEvents: 'auto'
  });

  const btn = document.createElement('button');
  btn.type = 'button'; btn.title = 'Menu'; btn.innerHTML = '☰';
  Object.assign(btn.style, { fontSize:'20px', padding:'6px 8px', borderRadius:'6px', border:'2px solid rgba(0,0,0,0.12)', background:'rgba(255,255,255,0.9)', cursor:'pointer' });

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
    if (!isNaN(target)) {
      await openAndReveal();
      await goToPage(target);
      syncLeftForIndex(current);
    }
  });

  btn.addEventListener('click', () => {
    select.style.display = (select.style.display === 'none' || !select.style.display) ? 'inline-block' : 'none';
  });

  menu.appendChild(btn);
  menu.appendChild(select);
  sketchbook.appendChild(menu);
}
createPageMenu();

// open animation
async function openAndReveal() {
  if (sketchbook.classList.contains('open')) {
    if (controls) controls.style.display = 'flex';
    if (leftPage) leftPage.style.display = 'block';
    if (pagesContainer) pagesContainer.style.display = 'block';
    return;
  }

  if (leftPage) { leftPage.style.display = 'block'; leftPage.style.opacity = '0'; }
  if (pagesContainer) { pagesContainer.style.display = 'block'; pagesContainer.style.opacity = '0'; }
  if (controls) controls.style.display = 'none';
  void sketchbook.offsetWidth; // reflow

  const tl = gsap.timeline({
    onStart: () => {
      sketchbook.classList.add('open');
      cover.setAttribute('aria-pressed', 'true');
    },
    onComplete: () => {
      if (controls) controls.style.display = 'flex';
      if (leftPage) leftPage.style.opacity = '';
      if (pagesContainer) pagesContainer.style.opacity = '';
    }
  });

  tl.to(cover, { duration: 1.0, rotationY: -160, transformOrigin: "left center", ease: "power3.out" }, 0);
  tl.to([leftPage, pagesContainer], { duration: 0.6, opacity: 1, ease: "power2.out" }, 0.1);

  syncLeftForIndex(current);
  await new Promise(res => setTimeout(res, 1100));
}

// close
function closeAndHide() {
  if (!sketchbook.classList.contains('open')) return;
  if (controls) controls.style.display = 'none';

  const tl = gsap.timeline({
    onStart: () => { cover.setAttribute('aria-pressed', 'false'); },
    onComplete: () => {
      sketchbook.classList.remove('open');
      if (leftPage) leftPage.style.display = 'none';
      if (pagesContainer) pagesContainer.style.display = 'none';
      cover.style.transform = 'rotateY(0deg)';
    }
  });

  tl.to([leftPage, pagesContainer], { duration: 0.45, opacity: 0, ease: "power2.in" }, 0);
  tl.to(cover, { duration: 0.9, rotationY: 0, transformOrigin: "left center", ease: "power2.in" }, 0.05);
}

// Enter button
enterBtn.addEventListener('click', async () => {
  if (!sketchbook.classList.contains('open')) {
    await openAndReveal();
  } else {
    closeAndHide();
  }
});

// page flip logic
let current = 0;
const maxIndex = pages.length - 1;
let flipping = false;

function resetPageStack() {
  pages.forEach((p, i) => {
    p.style.zIndex = (100 - i);
    p.style.transformOrigin = 'left center';
    p.style.transform = 'rotateY(0deg)';
  });
}
resetPageStack();

function flipPage(index, direction = 'forward') {
  return new Promise((resolve) => {
    const page = pages[index];
    const tl = gsap.timeline({
      onComplete: () => {
        if (direction === 'forward') {
          page.style.transform = 'rotateY(0deg)';
          page.style.zIndex = 10 + index;
        } else {
          page.style.transform = 'rotateY(0deg)';
          page.style.zIndex = 100 - index;
        }
        resolve();
      }
    });

    if (direction === 'forward') {
      page.style.zIndex = 300;
      tl.to(page, { duration: 0.65, rotationY: -180, transformOrigin: "left center", ease: "power2.inOut" });
    } else {
      page.style.transform = 'rotateY(-180deg)';
      page.style.zIndex = 300;
      tl.to(page, { duration: 0.65, rotationY: 0, transformOrigin: "left center", ease: "power2.inOut" });
    }
  });
}

// next/prev handlers
nextBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openAndReveal();
  if (current >= maxIndex) return;
  flipping = true;
  await flipPage(current, 'forward');
  current++;
  syncLeftForIndex(current);
  flipping = false;
});

prevBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openAndReveal();
  if (current <= 0) return;
  flipping = true;
  current--;
  await flipPage(current, 'backward');
  syncLeftForIndex(current);
  flipping = false;
});

// goToPage
async function goToPage(target) {
  if (!sketchbook.classList.contains('open')) {
    await openAndReveal();
  }
  if (target === current) return;
  if (target > current) {
    while (current < target) {
      await flipPage(current, 'forward');
      current++;
    }
  } else {
    while (current > target) {
      current--;
      await flipPage(current, 'backward');
    }
  }
  syncLeftForIndex(current);
}

// keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'Escape') closeAndHide();
  if (e.key === 'Enter') {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      enterBtn.click();
    }
  }
});

// ambient doodles
gsap.utils.toArray('.floating').forEach((el, i) => {
  gsap.to(el, {
    y: (i + 1) * 10,
    x: (i % 2 ? -14 : 14),
    duration: 4 + i * 1.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    delay: i * 0.3
  });
});

// ensure cover background is applied once page loads (additional safety)
window.addEventListener('load', () => {
  ensureCoverBackground();
  applyInlineBackgrounds();
  syncLeftForIndex(current);
});
