/* ════════════════════════════════════════════════════════════
   MANIFEST — main.js
   Preloader · cursor · nav/scrollspy · reveal · tilt · parallax
   ════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Preloader ──────────────────────────────────────────── */
  const preloader = $('.preloader');
  const hero = $('.hero');
  const finishLoad = () => {
    preloader.classList.add('is-done');
    hero.classList.add('is-ready');
    document.body.classList.remove('no-scroll');
  };
  document.body.classList.add('no-scroll');
  if (reduceMotion) {
    finishLoad();
  } else {
    // hold the curtain briefly for the logo animation, never longer than 1.6s
    const minDelay = new Promise(r => setTimeout(r, 1200));
    const loaded   = new Promise(r => {
      if (document.readyState === 'complete') r();
      else addEventListener('load', r, { once: true });
      setTimeout(r, 1600);
    });
    Promise.all([minDelay, loaded]).then(finishLoad);
  }

  /* ── Custom cursor ──────────────────────────────────────── */
  if (finePointer && !reduceMotion) {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform  = `translate(${mx}px, ${my}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();

    const hoverables = 'a, button, .release, .soc, .member, .video-card, .strip-item, input';
    document.addEventListener('mouseover', e => {
      document.body.classList.toggle('cursor-hover', !!e.target.closest(hoverables));
    });
  }

  /* ── Nav: scrolled state, progress bar, back-to-top ─────── */
  const nav = $('.nav');
  const progress = $('.progress');
  const toTop = $('.to-top');
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    toTop.classList.toggle('is-show', y > 700);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ── Scrollspy ──────────────────────────────────────────── */
  const spyLinks = $$('.nav-links a[href^="#"]');
  const spyMap = new Map();
  spyLinks.forEach(a => {
    const sec = $(a.getAttribute('href'));
    if (sec) spyMap.set(sec, a);
  });
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      spyLinks.forEach(a => a.classList.remove('is-active'));
      spyMap.get(e.target)?.classList.add('is-active');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  spyMap.forEach((_, sec) => spy.observe(sec));

  /* ── Mobile drawer ──────────────────────────────────────── */
  const burger = $('.burger');
  const drawer = $('.drawer');
  const setDrawer = open => {
    burger.classList.toggle('is-open', open);
    drawer.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.classList.toggle('no-scroll', open);
  };
  burger.addEventListener('click', () => setDrawer(!drawer.classList.contains('is-open')));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });

  /* ── Reveal on scroll ───────────────────────────────────── */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  $$('[data-reveal]').forEach(el => revealIO.observe(el));

  /* ── Animated counters ──────────────────────────────────── */
  const counterIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      counterIO.unobserve(e.target);
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target + suffix; return; }
      const t0 = performance.now(), dur = 1200;
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => counterIO.observe(el));

  /* ── Hero parallax blobs ────────────────────────────────── */
  if (finePointer && !reduceMotion) {
    const blobs = $$('.blob');
    const strengths = [26, 38, 18];
    addEventListener('mousemove', e => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      blobs.forEach((b, i) => {
        const s = strengths[i] || 20;
        b.style.translate = `${nx * s}px ${ny * s}px`;
      });
    }, { passive: true });
  }

  /* ── 3D tilt cards ──────────────────────────────────────── */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach(card => {
      const max = parseFloat(card.dataset.tilt) || 7;
      let raf = null;
      card.addEventListener('mousemove', e => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform =
            `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-4px)`;
          raf = null;
        });
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ── Magnetic buttons ───────────────────────────────────── */
  if (finePointer && !reduceMotion) {
    $$('.btn--grad, .nav-cta, .to-top').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.22;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ── Newsletter (client-side demo) ──────────────────────── */
  const form = $('.newsletter-form');
  if (form) {
    const msg = $('.newsletter-msg');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = $('input[type="email"]', form);
      const email = input.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      msg.classList.remove('ok', 'err');
      if (!valid) {
        msg.textContent = 'Lütfen geçerli bir e-posta adresi gir.';
        msg.classList.add('err');
        input.focus();
        return;
      }
      msg.textContent = 'Aramıza hoş geldin! 💜 Yeni haberler yakında kutunda.';
      msg.classList.add('ok');
      form.reset();
    });
  }

  /* ── Footer year ────────────────────────────────────────── */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
