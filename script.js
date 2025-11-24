// Sketchbook prototype script (uses GSAP)
// script.js is deferred in index.html, so DOM is available

const enterBtn = document.getElementById('enterBtn');
const sketchbook = document.getElementById('sketchbook');
const cover = document.getElementById('cover');
const leftPage = document.getElementById('left');
const pagesContainer = document.getElementById('pages');
const pages = Array.from(document.querySelectorAll('.pages .page'));
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const controls = document.querySelector('.controls');

// Page names in order (must match the DOM order)
const PAGE_TITLES = [
  'Home',
  'About Me',
  'Digital Art',
  'Animations/GIFs',
  'Sketchbook',
  'Demo Reel'
];

// Ensure each page heading matches the title list
pages.forEach((p, i) => {
  const h2 = p.querySelector('h2');
  if (h2) h2.textContent = PAGE_TITLES[i] || `Page ${i + 1}`;
});

// Use the provided images as backgrounds (assumes assets/ folder at repo root)
function applyBackgrounds() {
  // Cover image
  cover.style.backgroundImage = "url('assets/bookcover.jpg')";
  cover.style.backgroundSize = 'cover';
  cover.style.backgroundPosition = 'center';
  cover.style.backgroundRepeat = 'no-repeat';
  cover.querySelector('.cover-art').style.background = 'transparent'; // let the image show

  // Left side background for the whole left panel
  leftPage.style.backgroundImage = "url('assets/leftpage.png')";
  leftPage.style.backgroundSize = 'cover';
  leftPage.style.backgroundPosition = 'center';
  leftPage.style.backgroundRepeat = 'no-repeat';

  // Right side image used as background for each right-page
  pages.forEach(p => {
    p.style.backgroundImage = "url('assets/rightpage.png')";
    p.style.backgroundSize = 'cover';
    p.style.backgroundPosition = 'center';
    p.style.backgroundRepeat = 'no-repeat';
    // Ensure page content sits on top; make content background semi-transparent if needed
    const content = p.querySelector('.page-content');
    if (content) {
      content.style.background = 'rgba(255,255,255,0.0)'; // transparent so the paper shows
      content.style.backdropFilter = 'none';
    }
  });
}

// Initial state: show only the cover (hide left side, pages and controls)
function setInitialView() {
  applyBackgrounds();

  // Ensure cover title text as requested
  const coverTitle = cover.querySelector('.cover-title');
  if (coverTitle) coverTitle.textContent = "Brett's Portfolio";

  // Hide left and pages until we "enter" the book
  leftPage.style.display = 'none';
  pagesContainer.style.display = 'none';
  controls.style.display = 'none';

  // Make sure cover is front and reset transforms
  cover.style.zIndex = 200;
  cover.style.transform = 'rotateY(0deg)';
  pages.forEach((p, i) => {
    p.style.transform = 'rotateY(0deg)';
    p.style.zIndex = (100 - i);
  });
}
setInitialView();

// Create a compact dropdown menu in the top-right of the sketchbook
function createPageMenu() {
  // If a menu already exists remove it first
  const existing = document.getElementById('pageMenu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'pageMenu';
  // Inline styles so it works without editing CSS file
  Object.assign(menu.style, {
    position: 'absolute',
    top: '12px',
    right: '14px',
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'inherit'
  });

  // Button (hamburger / label)
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.title = 'Menu';
  btn.innerHTML = '☰';
  Object.assign(btn.style, {
    fontSize: '20px',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '2px solid rgba(0,0,0,0.12)',
    background: 'rgba(255,255,255,0.85)',
    cursor: 'pointer'
  });

  // Select dropdown to jump to pages
  const select = document.createElement('select');
  select.id = 'pageSelect';
  Object.assign(select.style, {
    padding: '6px 8px',
    borderRadius: '6px',
    border: '2px solid rgba(0,0,0,0.12)',
    background: 'rgba(255,255,255,0.95)'
  });

  PAGE_TITLES.forEach((title, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = title;
    select.appendChild(opt);
  });

  // When the select changes, navigate to the page (auto-open book first)
  select.addEventListener('change', async (e) => {
    const target = Number(select.value);
    if (isNaN(target)) return;
    await openAndReveal();
    await goToPage(target);
  });

  // Toggle select visibility when pressing the button (compact UI)
  btn.addEventListener('click', () => {
    // toggle display
    select.style.display = (select.style.display === 'none' || !select.style.display) ? 'inline-block' : 'none';
  });

  // Start with select hidden to minimize distraction
  select.style.display = 'none';

  menu.appendChild(btn);
  menu.appendChild(select);
  sketchbook.appendChild(menu);
}
createPageMenu();

// Helpers to reveal/hide book pages around the cover animation.
// We show left and right pages during the cover opening so it looks natural.
async function openAndReveal() {
  if (sketchbook.classList.contains('open')) {
    // already open; ensure controls visible
    controls.style.display = 'flex';
    return;
  }

  // Make left and pages visible behind the cover (but keep them subtle until cover moves)
  leftPage.style.display = 'block';
  pagesContainer.style.display = 'block';
  leftPage.style.opacity = '0';
  pagesContainer.style.opacity = '0';
  controls.style.display = 'none'; // show controls after animation

  // Force a tiny repaint so styles apply before animation
  void sketchbook.offsetWidth;

  // animate fade-in for left and pages while opening cover
  const tl = gsap.timeline({
    onStart: () => {
      sketchbook.classList.add('open');
      cover.setAttribute('aria-pressed', 'true');
    },
    onComplete: () => {
      // ensure controls visible after open completes
      controls.style.display = 'flex';
      leftPage.style.opacity = '';
      pagesContainer.style.opacity = '';
    }
  });

  tl.to(cover, { duration: 1.0, rotationY: -160, transformOrigin: "left center", ease: "power3.out" }, 0);
  tl.to([leftPage, pagesContainer], { duration: 0.6, opacity: 1, ease: "power2.out" }, 0.1);

  // Wait for timeline to finish
  await tl.then ? tl : new Promise(res => setTimeout(res, 1100));
}

function closeAndHide() {
  if (!sketchbook.classList.contains('open')) return;

  // Hide controls immediately
  controls.style.display = 'none';

  // animate cover closing and fade out pages
  const tl = gsap.timeline({
    onStart: () => {
      cover.setAttribute('aria-pressed', 'false');
    },
    onComplete: () => {
      sketchbook.classList.remove('open');
      // hide left and pages after close so only cover remains
      leftPage.style.display = 'none';
      pagesContainer.style.display = 'none';
      // reset cover rotation cleanly
      cover.style.transform = 'rotateY(0deg)';
    }
  });

  tl.to([leftPage, pagesContainer], { duration: 0.45, opacity: 0, ease: "power2.in" }, 0);
  tl.to(cover, { duration: 0.9, rotationY: 0, transformOrigin: "left center", ease: "power2.in" }, 0.05);
}

// Enter button behavior: toggle open/close with the above helpers
enterBtn.addEventListener('click', async () => {
  if (!sketchbook.classList.contains('open')) {
    await openAndReveal();
  } else {
    closeAndHide();
  }
});

// Page-flip behavior (arrows)
let current = 0;
const maxIndex = pages.length - 1;
let flipping = false;

// Ensure stacking order on reveal/open
function resetPageStack() {
  pages.forEach((p, i) => {
    p.style.zIndex = (100 - i);
    p.style.transformOrigin = 'left center';
    p.style.transform = 'rotateY(0deg)';
  });
}
resetPageStack();

async function flipPage(index, direction = 'forward') {
  return new Promise((resolve) => {
    const page = pages[index];
    const tl = gsap.timeline({
      onComplete: () => {
        // housekeeping of stacking order after flip
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
      // simulate flipping back: start visually rotated then animate to 0
      page.style.transform = 'rotateY(-180deg)';
      page.style.zIndex = 300;
      tl.to(page, { duration: 0.65, rotationY: 0, transformOrigin: "left center", ease: "power2.inOut" });
    }
  });
}

// Next/Prev wired to arrow buttons; ensure book is open first
nextBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openAndReveal();
  if (current >= maxIndex) return;
  flipping = true;
  await flipPage(current, 'forward');
  current++;
  flipping = false;
});

prevBtn.addEventListener('click', async () => {
  if (flipping) return;
  await openAndReveal();
  if (current <= 0) return;
  flipping = true;
  current--;
  await flipPage(current, 'backward');
  flipping = false;
});

// goToPage flips sequentially toward the target index
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
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'Escape') closeAndHide();
  if (e.key === 'Enter') {
    // If focus is on an input/select, let it behave; otherwise toggle book
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      enterBtn.click();
    }
  }
});

// Ambient doodles animation (keeps previous behavior)
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
