// Script changes: add image-load checks and set image fallbacks as well as background-image (for browsers that prefer it).
// This version will log loading problems so you can see why a background might be white.

const enterBtn = document.getElementById('enterBtn');
const sketchbook = document.getElementById('sketchbook');
const cover = document.getElementById('cover');
const leftPage = document.getElementById('left');
const pagesContainer = document.getElementById('pages');
const pages = Array.from(document.querySelectorAll('.pages .page'));
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const controls = document.querySelector('.controls');
const imageError = document.getElementById('imageError');

// File paths (consistent, relative)
const COVER_SRC = 'assets/bookcover.jpg';
const LEFT_SRC = 'assets/leftpage.png';
const RIGHT_SRC = 'assets/rightpage.png';

// Page titles
const PAGE_TITLES = ['Home', 'About Me', 'Digital Art', 'Animations/GIFs', 'Sketchbook', 'Demo Reel'];

// Ensure headings match
pages.forEach((p,i) => {
  const h2 = p.querySelector('h2');
  if (h2) h2.textContent = PAGE_TITLES[i] || `Page ${i+1}`;
});

// Utility: check if an <img> has loaded actual content (naturalWidth > 1)
function checkImageElement(imgEl) {
  if (!imgEl) return false;
  // If the image is already loaded, check naturalWidth; otherwise attach a load/error handler
  if (imgEl.complete) {
    return imgEl.naturalWidth > 1;
  }
  return false;
}

// Apply image sources to both background-image and <img> fallback elements
function applyBackgroundsAndCheck() {
  // Cover: set <img> src already in DOM; also set CSS background for cover container to be safe
  const coverImg = cover.querySelector('.cover-img');
  if (coverImg) coverImg.src = COVER_SRC;
  cover.style.backgroundImage = `url('${COVER_SRC}')`;

  // Left page image element
  const leftImg = leftPage ? leftPage.querySelector('.left-bg-img') : null;
  if (leftImg) leftImg.src = LEFT_SRC;
  if (leftPage) leftPage.style.backgroundImage = `url('${LEFT_SRC}')`;

  // Right pages — set per-page <img> fallback and CSS background
  pages.forEach(p => {
    const rimg = p.querySelector('.right-bg-img');
    if (rimg) rimg.src = RIGHT_SRC;
    p.style.backgroundImage = `url('${RIGHT_SRC}')`;
  });

  // After assigning srcs, set short timeouts to verify load; if any fail, show error
  setTimeout(() => {
    const coverOK = checkImageElement(cover.querySelector('.cover-img'));
    const leftOK = checkImageElement(leftPage ? leftPage.querySelector('.left-bg-img') : null);
    const rightsOK = pages.every(p => checkImageElement(p.querySelector('.right-bg-img')));
    if (!coverOK || !leftOK || !rightsOK) {
      console.warn('One or more asset images failed to load (check assets/ file names and that they contain valid image data).', {
        coverOK, leftOK, rightsOK
      });
      if (imageError) {
        imageError.hidden = false;
        imageError.textContent = 'Background images not found or invalid in /assets — please re-upload bookcover.jpg, leftpage.png, rightpage.png';
      }
    } else {
      if (imageError) imageError.hidden = true;
      console.log('All background assets loaded successfully.');
    }
  }, 350);
}

// Initial: set image sources / backgrounds and show only cover
function setInitialView() {
  applyBackgroundsAndCheck();

  // Cover title forced
  const coverTitle = cover.querySelector('.cover-title');
  if (coverTitle) coverTitle.textContent = "Brett's Portfolio";

  // Hide left & pages & controls
  if (leftPage) leftPage.style.display = 'none';
  if (pagesContainer) pagesContainer.style.display = 'none';
  if (controls) controls.style.display = 'none';

  // Reset transforms
  cover.style.transform = 'rotateY(0deg)';
  pages.forEach((p,i) => { p.style.transform = 'rotateY(0deg)'; p.style.zIndex = (100 - i); });
}
setInitialView();

// Menu creation (unchanged)
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

  PAGE_TITLES.forEach((t, idx) => { const o = document.createElement('option'); o.value=String(idx); o.textContent = t; select.appendChild(o); });

  select.addEventListener('change', async () => {
    const target = Number(select.value);
    if (!isNaN(target)) { await openAndReveal(); await goToPage(target); }
  });
  btn.addEventListener('click', () => { select.style.display = (select.style.display === 'none' || !select.style.display) ? 'inline-block' : 'none'; });

  menu.appendChild(btn); menu.appendChild(select); sketchbook.appendChild(menu);
}
createPageMenu();

// Open/close behaviors (unchanged logic, same animation)
async function openAndReveal() {
  if (sketchbook.classList.contains('open')) { if (controls) controls.style.display = 'flex'; if (leftPage) leftPage.style.display = 'block'; if (pagesContainer) pagesContainer.style.display = 'block'; return; }

  if (leftPage) { leftPage.style.display = 'block'; leftPage.style.opacity = '0'; }
  if (pagesContainer) { pagesContainer.style.display = 'block'; pagesContainer.style.opacity = '0'; }
  if (controls) controls.style.display = 'none';
  void sketchbook.offsetWidth;

  const tl = gsap.timeline({
    onStart: () => { sketchbook.classList.add('open'); cover.setAttribute('aria-pressed','true'); },
    onComplete: () => { if (controls) controls.style.display = 'flex'; if (leftPage) leftPage.style.opacity=''; if (pagesContainer) pagesContainer.style.opacity=''; }
  });

  tl.to(cover, { duration: 1.0, rotationY: -160, transformOrigin: "left center", ease: "power3.out" }, 0);
  tl.to([leftPage, pagesContainer], { duration: 0.6, opacity: 1, ease: "power2.out" }, 0.1);

  await new Promise(res => setTimeout(res, 1100));
}

function closeAndHide() {
  if (!sketchbook.classList.contains('open')) return;
  if (controls) controls.style.display = 'none';
  const tl = gsap.timeline({
    onStart: () => { cover.setAttribute('aria-pressed','false'); },
    onComplete: () => { sketchbook.classList.remove('open'); if (leftPage) leftPage.style.display='none'; if (pagesContainer) pagesContainer.style.display='none'; cover.style.transform='rotateY(0deg)'; }
  });
  tl.to([leftPage, pagesContainer], { duration: 0.45, opacity: 0, ease: "power2.in" }, 0);
  tl.to(cover, { duration: 0.9, rotationY: 0, transformOrigin: "left center", ease: "power2.in" }, 0.05);
}

// Hook Enter
enterBtn.addEventListener('click', async () => { if (!sketchbook.classList.contains('open')) { await openAndReveal(); } else { closeAndHide(); } });

// Page flip handlers (unchanged)
let current = 0; const maxIndex = pages.length - 1; let flipping = false;
function resetPageStack(){ pages.forEach((p,i)=>{ p.style.zIndex=(100-i); p.style.transformOrigin='left center'; p.style.transform='rotateY(0deg)'; }); }
resetPageStack();

function flipPage(index, direction='forward'){ return new Promise((resolve)=>{ const page = pages[index]; const tl = gsap.timeline({ onComplete: ()=>{ if (direction === 'forward'){ page.style.transform='rotateY(0deg)'; page.style.zIndex=10+index; } else { page.style.transform='rotateY(0deg)'; page.style.zIndex=100-index; } resolve(); } }); if (direction === 'forward'){ page.style.zIndex=300; tl.to(page,{duration:0.65, rotationY:-180, transformOrigin:"left center", ease:"power2.inOut"}); } else { page.style.transform='rotateY(-180deg)'; page.style.zIndex=300; tl.to(page,{duration:0.65, rotationY:0, transformOrigin:"left center", ease:"power2.inOut"}); } }); }

// Arrow buttons
nextBtn.addEventListener('click', async ()=>{ if (flipping) return; await openAndReveal(); if (current >= maxIndex) return; flipping = true; await flipPage(current,'forward'); current++; flipping = false; });
prevBtn.addEventListener('click', async ()=>{ if (flipping) return; await openAndReveal(); if (current <= 0) return; flipping = true; current--; await flipPage(current,'backward'); flipping = false; });

// Sequential navigation
async function goToPage(target){ if (!sketchbook.classList.contains('open')) await openAndReveal(); if (target === current) return; if (target > current){ while (current < target){ await flipPage(current,'forward'); current++; } } else { while (current > target){ current--; await flipPage(current,'backward'); } } }

// Keyboard
document.addEventListener('keydown', (e)=>{ if (e.key === 'ArrowRight') nextBtn.click(); if (e.key === 'ArrowLeft') prevBtn.click(); if (e.key === 'Escape') closeAndHide(); if (e.key === 'Enter'){ const tag = document.activeElement && document.activeElement.tagName; if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') enterBtn.click(); } });

// Ambient doodles
gsap.utils.toArray('.floating').forEach((el,i)=>{ gsap.to(el, { y:(i+1)*10, x:(i%2? -14:14), duration:4 + i*1.2, repeat:-1, yoyo:true, ease:'sine.inOut', delay: i*0.3 }); });

// After DOM load ensure images are applied and checked
window.addEventListener('load', () => {
  applyBackgroundsAndCheck();
});
