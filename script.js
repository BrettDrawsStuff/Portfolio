// Sketchbook prototype script (uses GSAP)
// script.js is deferred in index.html, so DOM is available
const enterBtn = document.getElementById('enterBtn');
const sketchbook = document.getElementById('sketchbook');
const cover = document.getElementById('cover');
const pages = Array.from(document.querySelectorAll('.pages .page'));
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const navItems = Array.from(document.querySelectorAll('.left-nav .nav-item'));

let current = 0;
const maxIndex = pages.length - 1;
let flipping = false;

// stacking initial order
pages.forEach((p, i) => {
  p.style.zIndex = (100 - i);
  p.style.transformOrigin = 'left center';
  p.style.transform = 'rotateY(0deg)';
});

// open/close cover
enterBtn.addEventListener('click', () => {
  if (!sketchbook.classList.contains('open')) {
    sketchbook.classList.add('open');
    cover.setAttribute('aria-pressed', 'true');
    gsap.to(cover, {duration:1.2, rotationY:-160, transformOrigin:"left center", ease:"power3.out"});
    gsap.fromTo(pages[0], {y:-6, opacity:0}, {duration:0.8, y:0, opacity:1, delay:0.4, ease:"power2.out"});
  } else {
    sketchbook.classList.remove('open');
    cover.setAttribute('aria-pressed', 'false');
    gsap.to(cover, {duration:0.9, rotationY:0, ease:"power2.in"});
  }
});

// next / prev
nextBtn.addEventListener('click', () => {
  if (!sketchbook.classList.contains('open')) return;
  if (current >= maxIndex || flipping) return;
  flipPage(current, 'forward').then(()=> current++);
});
prevBtn.addEventListener('click', () => {
  if (!sketchbook.classList.contains('open')) return;
  if (current <= 0 || flipping) return;
  current--;
  flipPage(current, 'backward');
});

// nav click to go to a specific page index
navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = Number(btn.getAttribute('data-target'));
    if (!sketchbook.classList.contains('open')) return;
    if (isNaN(target)) return;
    goToPage(target);
  });
});

// keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'Enter') enterBtn.click();
});

// flipPage returns a Promise that resolves when animation completes
function flipPage(index, direction='forward'){
  return new Promise((resolve) => {
    flipping = true;
    const page = pages[index];
    const tl = gsap.timeline({
      onComplete: () => {
        // small housekeeping of stacking order after flip
        if (direction === 'forward') {
          page.style.transform = 'rotateY(0deg)';
          page.style.zIndex = 10 + index;
        } else {
          page.style.transform = 'rotateY(0deg)';
          page.style.zIndex = 100 - index;
        }
        flipping = false;
        resolve();
      }
    });

    if (direction === 'forward'){
      page.style.zIndex = 300;
      tl.to(page, {duration:0.65, rotationY:-180, transformOrigin:"left center", ease:"power2.inOut"});
    } else {
      // simulate flipping back: start visually rotated then animate to 0
      page.style.transform = 'rotateY(-180deg)';
      page.style.zIndex = 300;
      tl.to(page, {duration:0.65, rotationY:0, transformOrigin:"left center", ease:"power2.inOut"});
    }
  });
}

// goToPage flips sequentially toward the target index
async function goToPage(target){
  if (flipping) return;
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

// ambient animations
gsap.utils.toArray('.floating').forEach((el, i) => {
  gsap.to(el, {
    y: (i+1)*10,
    x: (i%2? -14: 14),
    duration: 4 + i*1.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    delay: i*0.3
  });
});
