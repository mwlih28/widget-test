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
  let playMemberPart = null, stopMemberPart = null;   // modal da kullanır
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
    playMemberPart = playSegment;
    stopMemberPart = stopSegment;

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

  /* ── Üye detay modali ─────────────────────────────────────
     Biyografiler ve bireysel hesaplar resmî kaynaklardan
     (manifestgirlband.com + Wikipedia) alınmıştır. */
  const MEMBER_DATA = [
    {
      name: 'Esin Bahat', color: 'Sarı', mc: '#f2b705', tint: 'rgba(242,183,5,.32)',
      role: 'Ana Dansçı', img: 'assets/img/esin.webp',
      bio: 'Uluslararası dans sporunda lisanslı bir yarışmacı olan Esin, yıllarını profesyonel dansçılık ve eğitmenlikle geçirdi. Doğuş Üniversitesi Psikoloji bölümünden mezun oldu. Big5 Türkiye sahnesinde kusursuz tekniği ve sahne hakimiyetiyle öne çıktı; bugün Manifest’in ana dansçısı olarak koreografilerin bel kemiği.',
      facts: [['Doğum', '9 Ağustos 2000 · İstanbul'], ['Eğitim', 'Doğuş Ünv. · Psikoloji'], ['Geçmiş', 'Lisanslı dans sporcusu'], ['Görevi', 'Ana Dansçı']],
      ig: 'esin.bahat', tt: 'esinbahat',
    },
    {
      name: 'Hilal Yelekçi', color: 'Mor', mc: '#8b5cf6', tint: 'rgba(139,92,246,.3)',
      role: 'Baş Dansçı', img: 'assets/img/hilal.webp',
      bio: 'İTÜ Bilgisayar Mühendisliği mezunu Hilal, Manifest’ten önce “Pinkeu” sahne adıyla solo K-pop müziği yaptı ve K-pop dans eğitmenliğiyle tanındı. Türkiye’de K-pop kültürünün öncülerinden biri olarak gruba hem dans disiplinini hem de sahnede fırtına gibi esen enerjisini taşıyor.',
      facts: [['Doğum', '20 Mayıs 2001 · İstanbul'], ['Eğitim', 'İTÜ · Bilgisayar Müh.'], ['Geçmiş', 'Solo K-pop: “Pinkeu”'], ['Görevi', 'Baş Dansçı']],
      ig: 'hilalyelekci', tt: 'hilalyelekci',
    },
    {
      name: 'Lidya Pınar', color: 'Pembe', mc: '#ee6aa7', tint: 'rgba(238,106,167,.32)',
      role: 'Baş Vokalist', img: 'assets/img/lidya.webp',
      bio: 'Küçük yaşta piyano ve solfej eğitimi alan Lidya, tiyatro sahnesinden geçerek müziğe uzandı. Yeditepe Üniversitesi’nde Rus Dili ve Edebiyatı okuyor. Grubun baş vokalisti olmasının yanında kamera arkasında da üretiyor: Manifest kliplerinde yönetmenlik denemeleri de ona ait.',
      facts: [['Doğum', '24 Haziran 2003 · İstanbul'], ['Eğitim', 'Yeditepe Ünv. · Rus Dili'], ['Geçmiş', 'Piyano · Tiyatro'], ['Görevi', 'Baş Vokalist']],
      ig: 'pynarlidia', tt: 'pynarlidia',
    },
    {
      name: 'Mina Solak', color: 'Kırmızı', mc: '#e63946', tint: 'rgba(230,57,70,.28)',
      role: 'Vokalist · Dansçı', img: 'assets/img/mina.webp',
      bio: 'İzmir doğumlu Mina, bale ile başladığı dans yolculuğunu modern dansla sürdürdü; Manifest’ten önce kliplerde ve konser sahnelerinde profesyonel dansçı olarak yer aldı. Bilgi Üniversitesi Sanat ve Kültür Yönetimi mezunu. Sahnedeki alev gibi varlığıyla grubun ateşini yüksek tutuyor.',
      facts: [['Doğum', '16 Mayıs 2000 · İzmir'], ['Eğitim', 'Bilgi Ünv. · Sanat Yönetimi'], ['Geçmiş', 'Bale · Profesyonel dans'], ['Görevi', 'Vokalist · Dansçı']],
      ig: 'minasolakk', tt: 'minasolakk',
    },
    {
      name: 'Sueda Uluca', color: 'Yeşil', mc: '#2fbf71', tint: 'rgba(47,191,113,.3)',
      role: 'Ana Vokalist', img: 'assets/img/sueda.webp',
      bio: 'Grubun en genci ve ana vokalisti. Bale ile başlayıp modern dans ve hip-hop’la devam etti; Magma Gençlik Korosu’nda şarkı söyledi. Özyeğin Üniversitesi İletişim Tasarımı mezunu. Sınır tanımayan sesi ve bulaşıcı neşesiyle Manifest sound’unun kalbinde duruyor.',
      facts: [['Doğum', '23 Ağustos 2004 · İstanbul'], ['Eğitim', 'Özyeğin Ünv. · İletişim Tasarımı'], ['Geçmiş', 'Koro · Bale · Hip-hop'], ['Görevi', 'Ana Vokalist']],
      ig: 'suedaauluca', tt: 'suedauluca',
    },
    {
      name: 'Zeynep Sude Oktay', color: 'Mavi', mc: '#3b82f6', tint: 'rgba(59,130,246,.3)',
      role: 'Vokalist · Dansçı', img: 'assets/img/zeynep.webp',
      bio: '“Zoktay” sahne adıyla da bilinen Zeynep, Manifest öncesinde profesyonel dansçı olarak sahne aldı. Marmara Üniversitesi Halkla İlişkiler ve Tanıtım mezunu. Sakin özgüveni ve sarsılmaz enerjisiyle grubun dengesini kuran isim; sessiz ama derin bir güç.',
      facts: [['Doğum', '18 Nisan 2001 · İstanbul'], ['Eğitim', 'Marmara Ünv. · Halkla İlişkiler'], ['Geçmiş', 'Profesyonel dansçı · “Zoktay”'], ['Görevi', 'Vokalist · Dansçı']],
      ig: 'zeynep.okktay', tt: 'zeynep.okktay',
    },
  ];

  /* ── Modal aç/kapat ───────────────────────────────────────── */
  const modal = $('#memberModal');
  if (modal) {
    const panel   = $('.mmodal-panel', modal);
    const elPhoto = $('.mmodal-photo', modal);
    const elGhost = $('.mmodal-ghost', modal);
    const elName  = $('.mmodal-name', modal);
    const elRole  = $('.mmodal-role', modal);
    const elBio   = $('.mmodal-bio', modal);
    const elFacts = $('.mmodal-facts', modal);
    const elColorI = $('.mmodal-color i', modal);
    const elColorB = $('.mmodal-color b', modal);
    const elSoc   = $('.mmodal-socials', modal);
    const playBtn = $('.mmodal-play', modal);
    let mIdx = 0, playPulse = null;

    const IG_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2a6.6 6.6 0 1 0 0 13.2 6.6 6.6 0 0 0 0-13.2zm0 10.9a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6zm8.4-11.1a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>';
    const TT_SVG = '<svg viewBox="0 0 24 24"><path d="M19.6 6.7a5 5 0 0 1-3.8-4.2V2h-3.4v13.4a2.9 2.9 0 1 1-2-2.7V9.2a6.3 6.3 0 1 0 5.4 6.2V8.6a8.3 8.3 0 0 0 4.4 1.3V6.7h-.6z"/></svg>';

    const openModal = idx => {
      mIdx = idx;
      const d = MEMBER_DATA[idx];
      panel.style.setProperty('--mc', d.mc);
      panel.style.setProperty('--tint', d.tint);
      elPhoto.src = d.img;
      elPhoto.alt = d.name;
      elGhost.textContent = d.name.split(' ')[0];
      elName.textContent = d.name;
      elRole.textContent = d.role;
      elBio.textContent = d.bio;
      elColorI.style.background = d.mc;
      elColorB.textContent = d.color;
      elFacts.innerHTML = d.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      elSoc.innerHTML =
        `<a href="https://www.instagram.com/${d.ig}/" target="_blank" rel="noopener">${IG_SVG} @${d.ig}</a>` +
        `<a href="https://www.tiktok.com/@${d.tt}" target="_blank" rel="noopener">${TT_SVG} @${d.tt}</a>`;
      playBtn.classList.remove('is-on');
      // fotoğraf giriş animasyonu her açılışta tekrar oynasın
      elPhoto.style.animation = 'none';
      requestAnimationFrame(() => { elPhoto.style.animation = ''; });
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      playBtn.classList.remove('is-on');
      clearTimeout(playPulse);
      stopMemberPart?.(null);
    };

    $$('.member-more').forEach((btn, i) => {
      btn.addEventListener('click', e => {
        e.stopPropagation();          // dokunmatikte kartın ses tetiğine karışmasın
        openModal(i);
      });
    });
    $$('[data-close]', modal).forEach(el => el.addEventListener('click', closeModal));
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    playBtn.addEventListener('click', () => {
      clearTimeout(playPulse);
      if (playBtn.classList.contains('is-on')) {
        playBtn.classList.remove('is-on');
        stopMemberPart?.(null);
        return;
      }
      playBtn.classList.add('is-on');
      playMemberPart?.(members[mIdx], mIdx);
      playPulse = setTimeout(() => playBtn.classList.remove('is-on'), 5200);
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
