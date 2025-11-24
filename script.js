// Sketchbook prototype script (uses GSAP)
// Updated so left and right halves show the same section (spread) for each page.
// No scaling logic here.

const enterBtn = document.getElementById('enterBtn');
const sketchbook = document.getElementById('sketchbook');
const cover = document.getElementById('cover');
const leftPage = document.getElementById('left');
const pagesContainer = document.getElementById('pages');
const pages = Array.from(document.querySelectorAll('.pages .page'));
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const controls = document.querySelector('.controls');

// Section titles (must match order of right .page elements)
const PAGE_TITLES = [
  'Home',
  'About Me',
  'Digital Art',
  'Animations/GIFs',
  'Sketchbook',
  'Demo Reel'
];

// Capture original templates from the right-side pages so we can re-apply them later.
// We store the HTML of each page's .page-content as a template.
const pageTemplates = pages.map(p => {
  const content = p.querySelector('.page-content');
  return content ? content.innerHTML : '';
});

// Utility: ensure left has a dedicated slot for section content so we don't clobber nav.
function ensureLeftSlot() {
  if (!leftPage) return null;
  const container = leftPage.querySelector('.page-content');
  if (!container) return null;
  let slot = container.querySelector('.left-page-section');
  if (!slot) {
    slot = document.createElement('div');
    slot.className = 'left-page-section';
    // Insert the slot after the nav if present, otherwise append
    const nav = container.querySelector('.left-nav');
    if (nav && nav.parentNode === container) {
      nav.insertAdjacentElement('afterend', slot);
    } else {
      container.appendChild(slot);
    }
  }
  return slot;
}
const leftSlot = ensureLeftSlot();

// Apply the template content for a given index to both left and right sides
function syncSpread(index) {
  const i = Math.max(0, Math.min(index, pageTemplates.length - 1));
  const html = pageTemplates[i] || `<h2>${PAGE_TITLES[i] || `Page ${i+1}`}</h2><div class="content-inner"></div>`;

  // Set left slot content (keeps nav & hint intact in left .page-content)
  if (leftSlot) {
    leftSlot.innerHTML = html;
  }

  // Apply to every right page .page-content so the right pages visually match the active spread
  pages.forEach((p) => {
    const c = p.querySelector('.page-content');
    if (c) {
      c.innerHTML = html;
    }
  });

  // Also ensure headings reflect the title list (defensive)
  pages.forEach((p, idx) => {
    const h2 = p.querySelector('h2');
    if (h2) h2.textContent = PAGE_TITLES[i] || PAGE_TITLES[idx] || h2.textContent;
  });
}

// ---------- Initial view: show only cover ----------
function applyBackgroundsAndInitialState() {
  // Keep existing background logic elsewhere (CSS/HTML or previous script).
  // We only prepare content and visibility here.
  syncSpread(0);

  // Set cover title
  const coverTitle = cover.querySelector('.cover-title');
  if (coverTitle) coverTitle.textContent = "Brett's Portfolio";

  // Hide left & pages & controls until Enter is clicked
  if (leftPage) leftPage.style.display = 'none';
  if (pagesContainer) pagesContainer.style.display = 'none';
  if (controls) controls.style.display = 'none';

  // Reset transforms and stacking
  cover.style.transform = 'rotateY(0deg)';
  pages.forEach((p, i) => {
    p.style.transform = 'rotateY(0deg)';
    p.style.zIndex = (100 - i);
  });
}
applyBackgroundsAndInitialState();

// Create compact page menu (unchanged pattern)
function createPageMenu() {
  const existing = document.getElementById('pageMenu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'pageMenu';
  Object.assign(menu.style, {
    position: 'absolute', top: '12px', right: '14px', zIndex: 800,
    display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', pointerEvents: 'auto'
  });

  const btn = document.createElement('button'); btn.type='button'; btn.title='Menu'; btn.innerHTML='☰';
  Object.assign(btn.style, { fontSize:'20px', padding:'6px 8px', borderRadius:'6px', border:'2px solid rgba(0,0,0,0.12)', background:'rgba(255,255,255,0.9)', cursor:'pointer' });

  const select = document.createElement('select'); select.id='pageSelect';
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
      // After navigation completes, ensure both halves show the final spread
      syncSpread(current);
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

// ---------- Open / Close animations ----------
async function openAndReveal() {
  if (sketchbook.classList.contains('open')) {
    if (controls) controls.style.display = 'flex';
    if (leftPage) leftPage.style.display = 'block';
    if (pagesContainer) pagesContainer.style.display = 'block';
    return;
  }

  // make pages visible behind cover (hidden initially)
  if (leftPage) { leftPage.style.display = 'block'; leftPage.style.opacity = '0'; }
  if (pagesContainer) { pagesContainer.style.display = 'block'; pagesContainer.style.opacity = '0'; }
  if (controls) controls.style.display = 'none';
  void sketchbook.offsetWidth;

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

  // rotate cover and fade in pages
  tl.to(cover, { duration: 1.0, rotationY: -160, transformOrigin: "left center", ease: "power3.out" }, 0);
  tl.to([leftPage, pagesContainer], { duration: 0.6, opacity: 1, ease: "power2.out" }, 0.1);

  // ensure the spread shows the current index content when revealed
  syncSpread(current);

  await new Promise(res => setTimeout(res, 1100));
}

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

// Hook Enter button to open/close
enterBtn.addEventListener('click', async () => {
  if (!sketchbook.classList.contains('open')) {
    await openAndReveal();
  } else {
    closeAndHide();
  }
});

// ---------- Page flip logic (flips right pages but content is synced) ----------
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
        // housekeeping stacking order after flip
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

// Next / Prev buttons: flip then sync spread so both halves match
nextBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openAndReveal();
  if (current >= maxIndex) return;
  flipping = true;
  await flipPage(current, 'forward');
  current++;
  // After updating current, sync both halves to the new active section
  syncSpread(current);
  flipping = false;
});

prevBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openAndReveal();
  if (current <= 0) return;
  flipping = true;
  current--;
  await flipPage(current, 'backward');
  // After moving back, sync both halves
  syncSpread(current);
  flipping = false;
});

// goToPage flips sequentially; we only update the visible content after navigation completes
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
  syncSpread(current);
}

// Keyboard shortcuts
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

// Ambient doodles (unchanged)
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
