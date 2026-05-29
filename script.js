/* ============================================================
   HAFSA — portfolio interactions
   01 Loader · 02 Year · 03 Mobile menu · 04 Scroll/header
   05 Reveal · 06 Cursor glow · 07 Magnetic buttons
   08 Story auto-slideshow (mobile) · 09 Gallery slideshow
   ============================================================ */

const loader     = document.getElementById('loader');
const progress   = document.getElementById('progress');
const menuBtn     = document.getElementById('menuBtn');
const nav         = document.getElementById('nav');
const cursorGlow  = document.getElementById('cursorGlow');
const finePointer = window.matchMedia('(pointer:fine)').matches;

/* ---------- 01 · loader ---------- */
window.addEventListener('load', () => {
  setTimeout(() => loader && loader.classList.add('hide'), 900);
  setTimeout(() => loader && loader.remove(), 1700);
});

/* ---------- 02 · year ---------- */
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

/* ---------- 03 · mobile menu ---------- */
function closeMenu() {
  nav && nav.classList.remove('active');
  menuBtn && menuBtn.classList.remove('active');
  document.body.classList.remove('menu-open');
  menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
}
menuBtn && menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('active');
  menuBtn.classList.toggle('active', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
});
document.querySelectorAll('.nav a, .header-cta, .footer-nav a, .btn[href^="#"]').forEach(link => {
  link.addEventListener('click', closeMenu);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

/* ---------- 04 · scroll progress + header state ---------- */
let ticking = false;
function onScroll() {
  ticking = false;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const pct = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  if (progress) progress.style.width = pct + '%';
  document.body.classList.toggle('scrolled', window.scrollY > 30);
}
window.addEventListener('scroll', () => {
  if (!ticking) requestAnimationFrame(onScroll);
  ticking = true;
}, { passive: true });
onScroll();

/* ---------- 05 · reveal on scroll ---------- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ---------- 06 · cursor glow ---------- */
if (finePointer && cursorGlow) {
  window.addEventListener('mousemove', e => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top  = e.clientY + 'px';
  }, { passive: true });
}

/* ---------- 07 · magnetic buttons ---------- */
if (finePointer) {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = 'translate(' + (x * 0.18) + 'px,' + (y * 0.28 - 4) + 'px)';
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* ============================================================
   08 · STORY — automatic crossfade slideshow (mobile only)
   Cinematic 2s crossfade · no swipe/click required · no jumping
   ============================================================ */
(() => {
  const grid = document.getElementById('storyGrid');
  if (!grid) return;

  const cards   = [...grid.querySelectorAll('.story-card')];
  const dotsBox = document.getElementById('storyDots');
  if (cards.length < 2) return;

  const INTERVAL = 2000;
  const mq = window.matchMedia('(max-width: 760px)');
  let idx = 0;
  let timer = null;

  // build dot indicators (shown only on mobile via CSS)
  if (dotsBox && !dotsBox.children.length) {
    cards.forEach(() => dotsBox.appendChild(document.createElement('span')));
  }
  const dots = dotsBox ? [...dotsBox.children] : [];

  function paint() {
    cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }
  function tick()  { idx = (idx + 1) % cards.length; paint(); }
  function play()  { clearInterval(timer); paint(); timer = setInterval(tick, INTERVAL); }
  function pause() { clearInterval(timer); timer = null; }

  function sync() {
    if (mq.matches) {
      if (!timer) { idx = 0; play(); }
    } else {
      pause();
      cards.forEach(c => c.classList.remove('is-active')); // restore static desktop grid
      dots.forEach(d => d.classList.remove('active'));
    }
  }

  mq.addEventListener('change', sync);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (mq.matches) play();           // resume from current frame — no reset, no jump
  });

  sync();
})();

/* ============================================================
   09 · GALLERY SLIDESHOW (auto 2s · crossfade · swipe · dots)
   ============================================================ */
const slideshow  = document.getElementById('slideshow');
const slides     = [...document.querySelectorAll('.slide')];
const slideStage = document.getElementById('slideStage');
const slideInfo  = document.querySelector('.slide-info');
const ssCat      = document.getElementById('ssCat');
const ssTitle    = document.getElementById('ssTitle');
const ssCaption  = document.getElementById('ssCaption');
const ssIndex    = document.getElementById('ssIndex');
const ssBar      = document.getElementById('ssBar');
const ssDots     = document.getElementById('ssDots');
const ssPlay     = document.getElementById('ssPlay');

const INTERVAL = 2000;
let activeSlide = 0;
let timer = null;
let playing = true;

if (slides.length) {
  // build dots
  slides.forEach((s, i) => {
    const d = document.createElement('button');
    d.className = 'ss-dot' + (i === 0 ? ' active' : '');
    d.type = 'button';
    d.setAttribute('aria-label', 'Frame ' + (i + 1));
    d.addEventListener('click', () => goTo(i));
    ssDots && ssDots.appendChild(d);
  });

  function paintInfo() {
    const s = slides[activeSlide];
    slideInfo && slideInfo.classList.add('swap');
    setTimeout(() => {
      if (ssCat)     ssCat.textContent     = s.dataset.cat;
      if (ssTitle)   ssTitle.textContent   = s.dataset.title;
      if (ssCaption) ssCaption.textContent = s.dataset.caption;
      slideInfo && slideInfo.classList.remove('swap');
    }, 200);
    if (ssIndex) ssIndex.textContent = String(activeSlide + 1).padStart(2, '0');
    [...(ssDots ? ssDots.children : [])].forEach((d, i) => d.classList.toggle('active', i === activeSlide));
  }

  function restartBar() {
    if (!ssBar) return;
    ssBar.classList.remove('run');
    void ssBar.offsetWidth;            // reflow to restart animation
    if (playing) ssBar.classList.add('run');
  }

  function showSlide(i) {
    activeSlide = (i + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle('active', idx === activeSlide));
    paintInfo();
  }

  function startTimer() {
    clearTimeout(timer);
    restartBar();
    if (playing) timer = setTimeout(() => goTo(activeSlide + 1), INTERVAL);
  }

  function goTo(i) { showSlide(i); startTimer(); }

  function setPlaying(state) {
    playing = state;
    slideshow.classList.toggle('paused', !playing);
    if (ssPlay) ssPlay.innerHTML = playing ? "<i class='bx bx-pause'></i>" : "<i class='bx bx-play'></i>";
    if (ssPlay) ssPlay.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
    if (playing) startTimer(); else clearTimeout(timer);
  }

  // controls
  const bind = (id, fn) => { const el = document.getElementById(id); el && el.addEventListener('click', fn); };
  bind('ssPrev',  () => goTo(activeSlide - 1));
  bind('ssNext',  () => goTo(activeSlide + 1));
  bind('ssPrev2', () => goTo(activeSlide - 1));
  bind('ssNext2', () => goTo(activeSlide + 1));
  ssPlay && ssPlay.addEventListener('click', () => setPlaying(!playing));

  // pause on hover (desktop)
  if (finePointer) {
    slideshow.addEventListener('mouseenter', () => { if (playing) { clearTimeout(timer); slideshow.classList.add('paused'); } });
    slideshow.addEventListener('mouseleave', () => { if (playing) { slideshow.classList.remove('paused'); startTimer(); } });
  }

  // swipe / drag on the stage (mobile + desktop)
  let sx = null, sdragging = false;
  function pStart(x) { sx = x; sdragging = true; clearTimeout(timer); slideshow.classList.add('paused'); }
  function pEnd(x) {
    if (!sdragging) return;
    const dx = x - sx; sdragging = false; sx = null;
    slideshow.classList.remove('paused');
    if (Math.abs(dx) > 40) goTo(activeSlide + (dx < 0 ? 1 : -1));
    else if (playing) startTimer();
  }
  if (slideStage) {
    slideStage.addEventListener('touchstart', e => pStart(e.touches[0].clientX), { passive: true });
    slideStage.addEventListener('touchend',  e => pEnd(e.changedTouches[0].clientX), { passive: true });
    slideStage.addEventListener('mousedown', e => { e.preventDefault(); pStart(e.clientX); });
    window.addEventListener('mouseup', e => { if (sdragging) pEnd(e.clientX); });
  }

  // keyboard when gallery in view
  document.addEventListener('keydown', e => {
    const portfolio = document.getElementById('portfolio');
    const r = portfolio && portfolio.getBoundingClientRect();
    if (!r || r.bottom < 0 || r.top > window.innerHeight) return;
    if (e.key === 'ArrowLeft')  goTo(activeSlide - 1);
    if (e.key === 'ArrowRight') goTo(activeSlide + 1);
  });

  // pause when tab hidden, resume when visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else if (playing) startTimer();
  });

  // go
  showSlide(0);
  startTimer();
}
