(function () {
  const title        = document.getElementById('title');
  const titleWrap    = document.getElementById('titleWrap');
  const track        = document.querySelector('.hero-track');
  const birdMask     = document.querySelector('.bird-mask');
  const loremSection = document.querySelector('.lorem-section');
  const siteHeader   = document.getElementById('siteHeader');
  const djButton     = document.getElementById('djButton');
  const navOverlay   = document.getElementById('navOverlay');
  const musicTitle   = document.getElementById('musicTitle');

  const WORD         = 'BLOCKFLOETENSPATZEN';
  const LINES_MOBILE = ['BLOCK', 'FLOETEN', 'SPATZEN'];
  const BREAKPOINT   = 700;
  const STRETCH_DESK = 2.2;
  const STRETCH_MOB  = 1.9;

  let mode      = null;
  let musicMode = null;
  let booted    = false;

  /* ─────────── Hero title layout ─────────── */
  function buildLines(isMobile) {
    title.innerHTML = '';
    const lines = isMobile ? LINES_MOBILE : [WORD];
    lines.forEach(txt => {
      const span = document.createElement('span');
      span.className = 'line';
      span.textContent = txt;
      title.appendChild(span);
    });
  }

  function fitTitle() {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const isMobile = vw < BREAKPOINT;
    const stretch  = isMobile ? STRETCH_MOB : STRETCH_DESK;

    document.documentElement.style.setProperty('--stretch', stretch);

    if (mode !== (isMobile ? 'mobile' : 'desktop')) {
      buildLines(isMobile);
      mode = isMobile ? 'mobile' : 'desktop';
    }

    const pad    = isMobile ? vw * 0.02 : vw * 0.005;
    const availW = vw - pad * 2;

    title.style.fontSize = '100px';
    const lines = title.querySelectorAll('.line');
    let widest = 0;
    lines.forEach(l => { widest = Math.max(l.offsetWidth, widest); });
    const layoutH = title.offsetHeight;
    const availH  = vh * 0.9;

    const byWidth  = (availW / widest) * 100;
    const byHeight = availH / ((layoutH / 100) * stretch);

    title.style.fontSize = Math.min(byWidth, byHeight) + 'px';
  }

  /* ─────────── Music title — 3 rows on mobile, 1 on desktop ─────────── */
  function buildMusicTitle() {
    if (!musicTitle) return;
    const isMobile = document.documentElement.clientWidth < 780;
    const newMode  = isMobile ? 'mobile' : 'desktop';
    if (musicMode === newMode) return;
    musicMode = newMode;

    const lines = isMobile
      ? ["DJ'S", 'VOM', 'CHIEMSEE']
      : ["DJ'S VOM CHIEMSEE"];

    musicTitle.innerHTML = '';
    lines.forEach(txt => {
      const span = document.createElement('span');
      span.className = 'music-line';
      span.textContent = txt;
      musicTitle.appendChild(span);
    });
  }

  function fitMusicTitle() {
    if (!musicTitle) return;
    const vw = document.documentElement.clientWidth;
    const pad = vw * 0.005;
    const availW = vw - pad * 2;

    musicTitle.style.fontSize = '100px';
    const lines = musicTitle.querySelectorAll('.music-line');
    let widest = 0;
    lines.forEach(l => { widest = Math.max(l.offsetWidth, widest); });
    if (!widest) return;

    const size = (availW / widest) * 100;
    musicTitle.style.fontSize = size + 'px';
  }

  /* ─────────── Music section — size to actual glyph height, not line box ─────────── */
  function fitMusicSection() {
    const section = document.querySelector('.music-section');
    if (!section || !musicTitle) return;

    const isMobile = document.documentElement.clientWidth < 780;
    const stretch  = isMobile ? 1.4 : 2.2;
    document.documentElement.style.setProperty('--music-stretch', stretch);

    const styles     = getComputedStyle(musicTitle);
    const fontSize   = parseFloat(styles.fontSize);
    const lineHeight = parseFloat(styles.lineHeight);
    const lineCount  = musicTitle.querySelectorAll('.music-line').length;
    if (!lineCount || !fontSize || !lineHeight) return;

    /* Font metrics via canvas — gives exact cap glyph bounds */
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');
    ctx.font = `400 ${fontSize}px "Bebas Neue"`;
    const m = ctx.measureText('DJSCVHIM');

    const fontAscent  = m.fontBoundingBoxAscent   || fontSize * 0.8;
    const fontDescent = m.fontBoundingBoxDescent  || fontSize * 0.2;
    const capHeight   = m.actualBoundingBoxAscent  || fontSize * 0.7;
    const capDescent  = m.actualBoundingBoxDescent || 0;

    /* Where the baseline sits inside each line box */
    const halfLeading           = (lineHeight - fontAscent - fontDescent) / 2;
    const baselineFromLineTop   = halfLeading + fontAscent;

    /* Exact glyph bounds within the untransformed element */
    const glyphTop    = baselineFromLineTop - capHeight;
    const glyphBottom = (lineCount - 1) * lineHeight + baselineFromLineTop + capDescent;
    const glyphHeight = glyphBottom - glyphTop;

    /* Shift so the glyph center aligns with section center */
    const innerCenter  = (lineCount * lineHeight) / 2;
    const glyphCenter  = (glyphTop + glyphBottom) / 2;
    const translateY   = stretch * (innerCenter - glyphCenter);

    document.documentElement.style.setProperty('--music-ty', translateY + 'px');
    section.style.height = (glyphHeight * stretch) + 'px';
  }

  /* ─────────── Video height = music section height ─────────── */
  function syncVideoHeight() {
    const videoSection = document.querySelector('.video-section');
    const musicSection = document.querySelector('.music-section');
    if (!videoSection || !musicSection) return;
    videoSection.style.height = musicSection.offsetHeight + 'px';
  }

  /* ─────────── Boot ─────────── */
  function boot() {
    if (booted) return;
    booted = true;
    requestAnimationFrame(() => {
      fitTitle();
      buildMusicTitle();
      fitMusicTitle();
      fitMusicSection();
      syncVideoHeight();
      title.classList.add('is-ready');
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
  window.addEventListener('load', boot);
  setTimeout(boot, 1500);

  /* ─────────── Scroll-linked effects ─────────── */
  let scheduled = false;

  function updateScroll() {
    scheduled = false;

    if (track && birdMask && titleWrap) {
      const rect       = track.getBoundingClientRect();
      const scrollable = track.offsetHeight - window.innerHeight;
      const scrolled   = Math.max(0, -rect.top);
      const progress   = scrollable > 0
        ? Math.min(1, Math.max(0, scrolled / scrollable))
        : 0;

      titleWrap.style.opacity = Math.max(0, 1 - progress / 0.5);

      const birdP    = Math.max(0, (progress - 0.1) / 0.9);
      const revealed = -10 + birdP * 120;
      birdMask.style.setProperty('--revealed', revealed + '%');
    }

    if (loremSection) {
      const show = loremSection.getBoundingClientRect().top < window.innerHeight * 0.85;
      if (siteHeader) siteHeader.classList.toggle('is-visible', show);
      if (djButton)   djButton.classList.toggle('is-visible', show);
    }
  }

  function onScroll() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateScroll);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    fitTitle();
    buildMusicTitle();
    fitMusicTitle();
    fitMusicSection();
    syncVideoHeight();
    updateScroll();
  });
  updateScroll();

  /* ─────────── DJ button → nav overlay ─────────── */
  function openNav() {
    navOverlay.classList.add('is-open');
    navOverlay.setAttribute('aria-hidden', 'false');
    djButton.classList.add('is-open');
    djButton.setAttribute('aria-expanded', 'true');
    djButton.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('nav-open');
  }

  function closeNav() {
    navOverlay.classList.remove('is-open');
    navOverlay.setAttribute('aria-hidden', 'true');
    djButton.classList.remove('is-open');
    djButton.setAttribute('aria-expanded', 'false');
    djButton.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('nav-open');
  }

  function toggleNav() {
    navOverlay.classList.contains('is-open') ? closeNav() : openNav();
  }

  if (djButton && navOverlay) {
    djButton.addEventListener('click', toggleNav);

    navOverlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navOverlay.classList.contains('is-open')) closeNav();
    });

    navOverlay.addEventListener('click', e => {
      if (e.target === navOverlay) closeNav();
    });
  }

  /* ─────────── Music title reveal on scroll ─────────── */
  if (musicTitle) {
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            musicTitle.classList.add('is-ready');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });
      obs.observe(musicTitle);
    } else {
      musicTitle.classList.add('is-ready');
    }
  }

  /* ─────────── Reduced motion fallback ─────────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    title.style.opacity = 1;
    title.style.transform = 'scaleY(' + STRETCH_DESK + ')';
  }
})();