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

  /* ── Üye kartları: 3D tilt + renk parlaması + Toz Pembe ──
     Hover'da kart 3D eğilir, üyenin rengi kartı sarar ve
     "Toz Pembe"nin resmî 30 sn önizlemesinden o üyeye ayrılan
     bölüm çalar (iTunes preview). */
  const members = $$('.member');
  if (members.length) {
    /* Toz Pembe (resmî 30 sn önizleme) içinde her üyenin bölümü.
       Kart sırası: Esin, Hilal, Lidya, Mina, Sueda, Zeynep.
       Kimin hangi saniyede söylediğini biliyorsan start/dur değerlerini
       buradan güncelle — başka hiçbir yere dokunman gerekmez. */
    const PARTS = [
      { name: 'Esin',   start:  0.0, dur: 5.0 },
      { name: 'Hilal',  start:  5.0, dur: 5.0 },
      { name: 'Lidya',  start: 10.0, dur: 5.0 },
      { name: 'Mina',   start: 15.0, dur: 5.0 },
      { name: 'Sueda',  start: 20.0, dur: 5.0 },
      { name: 'Zeynep', start: 25.0, dur: 4.8 },
    ];
    const audio = new Audio('assets/audio/toz-pembe-preview.mp3');
    audio.preload = 'auto';
    let fadeTimer = null, stopTimer = null, active = null;

    // Tarayıcı autoplay kilidini ilk dokunuş/tıkta aç
    const unlock = () => {
      audio.muted = true;
      audio.play().then(() => { audio.pause(); audio.muted = false; }).catch(() => { audio.muted = false; });
      removeEventListener('pointerdown', unlock);
      removeEventListener('keydown', unlock);
    };
    addEventListener('pointerdown', unlock, { once: false });
    addEventListener('keydown', unlock, { once: false });

    const fadeTo = (target, ms, then) => {
      clearInterval(fadeTimer);
      const step = 30, delta = (target - audio.volume) / (ms / step);
      fadeTimer = setInterval(() => {
        const v = audio.volume + delta;
        if ((delta > 0 && v >= target) || (delta < 0 && v <= target)) {
          audio.volume = target; clearInterval(fadeTimer);
          if (then) then();
        } else audio.volume = Math.min(1, Math.max(0, v));
      }, step);
    };

    const playSegment = (card, idx) => {
      clearTimeout(stopTimer);
      members.forEach(m => m.classList.remove('is-playing'));
      const part = PARTS[idx] || PARTS[0];
      audio.currentTime = part.start;
      audio.volume = 0;
      const p = audio.play();
      if (p) p.then(() => {
        card.classList.add('is-playing');
        active = card;
        fadeTo(.85, 250);
        stopTimer = setTimeout(() => stopSegment(card), part.dur * 1000);
      }).catch(() => {}); // autoplay kilitliyse sessizce geç
    };

    const stopSegment = card => {
      clearTimeout(stopTimer);
      fadeTo(0, 350, () => audio.pause());
      (card || active)?.classList.remove('is-playing');
      if (card === active || !card) active = null;
    };

    members.forEach((card, idx) => {
      const maxTilt = 9;
      let raf = null;

      if (finePointer) {
        card.addEventListener('mousemove', e => {
          if (raf) return;
          raf = requestAnimationFrame(() => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
            if (!reduceMotion) {
              card.style.transform =
                `perspective(950px) rotateX(${((.5 - py) * maxTilt).toFixed(2)}deg) rotateY(${((px - .5) * maxTilt).toFixed(2)}deg) translateY(-6px)`;
            }
            raf = null;
          });
        });
        card.addEventListener('mouseenter', () => playSegment(card, idx));
        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
          stopSegment(card);
        });
      } else {
        // Dokunmatik: karta dokun = çal / tekrar dokun = durdur
        card.addEventListener('click', e => {
          if (e.target.closest('a')) return;
          if (card.classList.contains('is-playing')) stopSegment(card);
          else playSegment(card, idx);
        });
      }
    });
  }

  /* ── Scroll animasyonları ─────────────────────────────────
     1) Hero: fotoğraf ve logo farklı hızlarda kayar (parallax)
     2) Galeri şeridi: scroll hızına göre eğilir (velocity skew)
     3) Footer'daki dev MANIFEST: scroll ile yana kayar */
  if (!reduceMotion) {
    const heroPhoto = $('.hero-photo');
    const heroLogo = $('.hero-logo');
    const stripInner = $('.strip-inner');
    const footerWord = $('.footer-word');
    let lastY = scrollY, velocity = 0, fxTicking = false;

    const scrollFX = () => {
      const y = scrollY;
      velocity = velocity * .82 + (y - lastY) * .18;   // yumuşatılmış hız
      lastY = y;

      // hero parallax (yalnızca hero görünürken)
      if (y < innerHeight * 1.2) {
        if (heroPhoto) heroPhoto.style.translate = `0 ${(y * .28).toFixed(1)}px`;
        if (heroLogo)  heroLogo.style.translate  = `0 ${(y * .14).toFixed(1)}px`;
      }

      // şerit eğimi: hızlı scroll'da içerik eğilir, durunca düzelir
      if (stripInner) {
        const skew = Math.max(-7, Math.min(7, velocity * .28));
        stripInner.style.transform = `skewX(${skew.toFixed(2)}deg)`;
      }

      // footer wordmark yatay kayma
      if (footerWord) {
        const r = footerWord.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) {
          const p = 1 - (r.top + r.height / 2) / innerHeight; // 0..1
          footerWord.style.translate = `${((p - .5) * 90).toFixed(1)}px 0`;
        }
      }

      fxTicking = false;
    };
    addEventListener('scroll', () => {
      if (!fxTicking) { fxTicking = true; requestAnimationFrame(scrollFX); }
    }, { passive: true });
    // hız sıfırlansın diye boşta da birkaç kare çalıştır
    setInterval(() => {
      if (Math.abs(velocity) > .1 && !fxTicking) { fxTicking = true; requestAnimationFrame(scrollFX); }
    }, 120);
  }

  /* ── Hikâye fotoğrafları: scroll parallax ───────────────── */
  const storyVisual = $('.story-visual');
  if (storyVisual && !reduceMotion) {
    const back = $('.story-photo:not(.story-photo--front)', storyVisual);
    const front = $('.story-photo--front', storyVisual);
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const r = storyVisual.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / innerHeight)); // 0..1
        if (back)  back.style.transform  = `translateY(${((p - .5) * -26).toFixed(1)}px)`;
        if (front) front.style.transform = `rotate(3deg) translateY(${((p - .5) * 30).toFixed(1)}px)`;
        ticking = false;
      });
    }, { passive: true });
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
