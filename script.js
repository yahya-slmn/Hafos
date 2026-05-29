/* ============================================================
   HAFSA — portfolio interactions
   ============================================================ */

const loader = document.getElementById('loader');
const progress = document.getElementById('progress');
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');
const cursorGlow = document.getElementById('cursorGlow');

/* ---------- loader ---------- */
window.addEventListener('load', () => {
  setTimeout(() => loader && loader.classList.add('hide'), 500);
  setTimeout(() => loader && loader.remove(), 1200);
});

/* ---------- year ---------- */
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

/* ---------- mobile menu ---------- */
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

/* ---------- scroll progress + header state ---------- */
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

/* ---------- reveal on scroll ---------- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ---------- cursor glow ---------- */
if (window.matchMedia('(pointer:fine)').matches && cursorGlow) {
  window.addEventListener('mousemove', e => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  }, { passive: true });
}

/* ---------- magnetic buttons ---------- */
if (window.matchMedia('(pointer:fine)').matches) {
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
   GALLERY SLIDESHOW (auto 2s · crossfade · swipe · dots)
   ============================================================ */
const slideshow = document.getElementById('slideshow');
const slides = [...document.querySelectorAll('.slide')];
const slideStage = document.getElementById('slideStage');
const slideInfo = document.querySelector('.slide-info');
const ssCat = document.getElementById('ssCat');
const ssTitle = document.getElementById('ssTitle');
const ssCaption = document.getElementById('ssCaption');
const ssIndex = document.getElementById('ssIndex');
const ssBar = document.getElementById('ssBar');
const ssDots = document.getElementById('ssDots');
const ssPlay = document.getElementById('ssPlay');

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
      if (ssCat) ssCat.textContent = s.dataset.cat;
      if (ssTitle) ssTitle.textContent = s.dataset.title;
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
  bind('ssPrev', () => goTo(activeSlide - 1));
  bind('ssNext', () => goTo(activeSlide + 1));
  bind('ssPrev2', () => goTo(activeSlide - 1));
  bind('ssNext2', () => goTo(activeSlide + 1));
  ssPlay && ssPlay.addEventListener('click', () => setPlaying(!playing));

  // pause on hover (desktop)
  if (window.matchMedia('(pointer:fine)').matches) {
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
    slideStage.addEventListener('touchend', e => pEnd(e.changedTouches[0].clientX), { passive: true });
    slideStage.addEventListener('mousedown', e => { e.preventDefault(); pStart(e.clientX); });
    window.addEventListener('mouseup', e => { if (sdragging) pEnd(e.clientX); });
  }

  // keyboard when gallery in view
  document.addEventListener('keydown', e => {
    const r = document.getElementById('portfolio') && document.getElementById('portfolio').getBoundingClientRect();
    if (!r || r.bottom < 0 || r.top > window.innerHeight) return;
    if (e.key === 'ArrowLeft') goTo(activeSlide - 1);
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
