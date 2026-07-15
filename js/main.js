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

  /* ── Üye kartları: 3D tilt + renk parlaması + Toz Pembe ──────
     Hover'da kart her zaman 3 boyutlu eğilir ve üyenin rengi yanar.
     Ses ise SADECE kulakla doğrulanmış gerçek zaman verisine dayanıyor.

     Şarkının tamamı 3:13; elimizdeki dosya ise iTunes'un resmî 30 sn
     önizlemesi (tam şarkıyı barındırmak telif ihlali olacağından
     yapılmadı). ffprobe bu dosyanın tam 30.01 sn olduğunu doğruluyor.
     Verilen gerçek zamanlara göre Sueda'nın parçası tam şarkıda
     0:48–1:04, Esin'inki 1:05–1:18 — ikisi ard arda tam 30 sn
     (48s→78s) ediyor ve dosyamızın süresiyle birebir örtüşüyor.
     Yani elimizdeki önizleme = şarkının 0:48–1:18 aralığı.
     Diğer dört üyenin (Lidya 0:26-0:32, Zeynep 1:34-1:38,
     Mina 1:34-1:55, Hilal 2:11-2:23 ve 2:25-2:40) gerçek anları bu
     30 sn'nin tamamen dışında kalıyor — o saniyelerin sesi elimizde
     yok, bu yüzden onlar için yerel ses ÇALDIRILMIYOR (sahte olurdu).
     Onların kartında/modalinde gerçek zaman damgası gösterilip tam
     şarkıya link veriliyor. */
    const members = $$('.member');
  let playMemberPart = null, stopMemberPart = null;   // modal da kullanır
  let ttPause = null;                                  // pikap ile ses çakışmasın
  if (members.length) {
    // idx: 0 Esin, 1 Hilal, 2 Lidya, 3 Mina, 4 Sueda, 5 Zeynep
    // Yalnızca gerçek anı 0:48–1:18 penceresine denk gelen üyeler çalınabilir.
    // local = tam şarkı saniyesi − 48 (önizlemenin şarkı içindeki başlangıcı)
    const PLAYABLE = {
      4: { from: 0,  to: 16 },   // Sueda: tam şarkı 0:48–1:04
      0: { from: 17, to: 30 },   // Esin:  tam şarkı 1:05–1:18
    };
    const audio = new Audio('assets/audio/toz-pembe-preview.mp3');
    audio.preload = 'auto';
    let fadeTimer = null, stopTimer = null, active = null;

    // İlk kullanıcı etkileşiminde sesi autoplay kilidinden çıkar.
    // pause() ÇAĞIRMIYORUZ: hemen ardından gelen playSegment'in play()'ini
    // kesip "AbortError: interrupted by pause()" hatasına yol açıyordu.
    // Onun yerine sessiz (muted) bir çalma başlatıp bırakıyoruz; playSegment
    // devralınca sesi açar, kimse devralmazsa klip kendiliğinden biter.
    let primed = false;
    const prime = () => {
      if (primed) return;
      primed = true;
      audio.muted = true;
      audio.play().catch(() => {});
      removeEventListener('pointerdown', prime);
      removeEventListener('keydown', prime);
    };
    addEventListener('pointerdown', prime);
    addEventListener('keydown', prime);

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
      ttPause?.();                        // pikap çalıyorsa duraklat
      clearTimeout(stopTimer);
      members.forEach(m => m.classList.remove('is-playing'));
      // Esin/Sueda: gerçek anları önizleme penceresinde → o offset'ten çal.
      // Diğerleri: gerçek anları elimizdeki 30 sn'nin dışında → önizlemeyi
      // baştan çalıyoruz (kart sessiz kalmasın); gerçek zamanları rozette.
      const range = PLAYABLE[idx];
      audio.muted = false;              // prime muted başlatmış olabilir → aç
      audio.currentTime = range ? range.from : 0;
      audio.volume = 0;
      const p = audio.play();
      if (p) p.then(() => {
        card.classList.add('is-playing');
        active = card;
        fadeTo(.85, 250);
        const full = (isFinite(audio.duration) && audio.duration > 0) ? audio.duration : 28;
        const dur = range ? Math.max(.3, range.to - range.from) : full;
        stopTimer = setTimeout(() => stopSegment(card), dur * 1000);
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
     (manifestgirlband.com + Wikipedia) alınmıştır.

     `tp` alanı: "Toz Pembe"de üyenin gerçekten söylediği zaman aralığı
     (tam 3:13'lük şarkı üzerinden, kulakla doğrulanmıştır — resmî bir
     zaman kodu paylaşılmadığı için tek gerçek kaynak budur).
     `playable: true` olan Esin ve Sueda'nın anları elimizdeki 30 sn'lik
     resmî önizlemenin (şarkının 0:48–1:18 aralığı) içinde kaldığı için
     kartlarında bu gerçek saniyeler çalıyor. Diğer dördünün gerçek anı
     bu pencerenin dışında kaldığından (tam şarkıyı barındırmak telif
     ihlali olur) o üyelerde ses çalmıyoruz; sadece gerçek zamanı
     gösterip tam şarkıya yönlendiriyoruz. */
  const MEMBER_DATA = [
    {
      name: 'Esin Bahat', color: 'Sarı', mc: '#f2b705', tint: 'rgba(242,183,5,.32)',
      role: 'Ana Dansçı', img: 'assets/img/esin.webp',
      tp: ['1:05–1:18'], playable: true,
      bio: 'Uluslararası dans sporunda lisanslı bir yarışmacı olan Esin, yıllarını profesyonel dansçılık ve eğitmenlikle geçirdi. Doğuş Üniversitesi Psikoloji bölümünden mezun oldu. Big5 Türkiye sahnesinde kusursuz tekniği ve sahne hakimiyetiyle öne çıktı; bugün Manifest’in ana dansçısı olarak koreografilerin bel kemiği.',
      facts: [['Doğum', '9 Ağustos 2000'], ['Memleket', 'İstanbul'], ['Burç', 'Aslan'], ['Eğitim', 'Doğuş Ünv. · Psikoloji'], ['Geçmiş', 'Lisanslı dans sporcusu'], ['Görevi', 'Ana Dansçı']],
      ig: 'esin.bahat', tt: 'esinbahat',
    },
    {
      name: 'Hilal Yelekçi', color: 'Mor', mc: '#8b5cf6', tint: 'rgba(139,92,246,.3)',
      role: 'Baş Dansçı', img: 'assets/img/hilal.webp',
      tp: ['2:11–2:23', '2:25–2:40'], playable: false,
      bio: 'İTÜ Bilgisayar Mühendisliği mezunu Hilal, Manifest’ten önce “Pinkeu” sahne adıyla solo K-pop müziği yaptı ve K-pop dans eğitmenliğiyle tanındı. Türkiye’de K-pop kültürünün öncülerinden biri olarak gruba hem dans disiplinini hem de sahnede fırtına gibi esen enerjisini taşıyor.',
      facts: [['Doğum', '20 Mayıs 2001'], ['Memleket', 'İstanbul'], ['Burç', 'Boğa'], ['Eğitim', 'İTÜ · Bilgisayar Müh.'], ['Geçmiş', 'Solo K-pop: “Pinkeu”'], ['Görevi', 'Baş Dansçı']],
      ig: 'hilalyelekci', tt: 'hilalyelekci',
    },
    {
      name: 'Lidya Pınar', color: 'Pembe', mc: '#ee6aa7', tint: 'rgba(238,106,167,.32)',
      role: 'Baş Vokalist', img: 'assets/img/lidya.webp',
      tp: ['0:26–0:32'], playable: false,
      bio: 'Küçük yaşta piyano ve solfej eğitimi alan Lidya, tiyatro sahnesinden geçerek müziğe uzandı. Yeditepe Üniversitesi’nde Rus Dili ve Edebiyatı okuyor. Grubun baş vokalisti olmasının yanında kamera arkasında da üretiyor: Manifest kliplerinde yönetmenlik denemeleri de ona ait.',
      facts: [['Doğum', '24 Haziran 2003'], ['Memleket', 'İstanbul'], ['Burç', 'Yengeç'], ['Eğitim', 'Yeditepe Ünv. · Rus Dili'], ['Geçmiş', 'Piyano · Tiyatro · Yönetmenlik'], ['Görevi', 'Baş Vokalist']],
      ig: 'pynarlidia', tt: 'pynarlidia',
    },
    {
      name: 'Mina Solak', color: 'Kırmızı', mc: '#e63946', tint: 'rgba(230,57,70,.28)',
      role: 'Vokalist · Dansçı', img: 'assets/img/mina.webp',
      tp: ['1:34–1:55'], playable: false,
      bio: 'İzmir doğumlu Mina, bale ile başladığı dans yolculuğunu modern dansla sürdürdü; Manifest’ten önce kliplerde ve konser sahnelerinde profesyonel dansçı olarak yer aldı. Bilgi Üniversitesi Sanat ve Kültür Yönetimi mezunu. Sahnedeki alev gibi varlığıyla grubun ateşini yüksek tutuyor.',
      facts: [['Doğum', '16 Mayıs 2000'], ['Memleket', 'İzmir'], ['Burç', 'Boğa'], ['Eğitim', 'Bilgi Ünv. · Sanat Yönetimi'], ['Geçmiş', 'Bale · Profesyonel dans'], ['Görevi', 'Vokalist · Dansçı']],
      ig: 'minasolakk', tt: 'minasolakk',
    },
    {
      name: 'Sueda Uluca', color: 'Yeşil', mc: '#2fbf71', tint: 'rgba(47,191,113,.3)',
      role: 'Ana Vokalist', img: 'assets/img/sueda.webp',
      tp: ['0:48–1:04'], playable: true,
      bio: 'Grubun en genci ve ana vokalisti. Bale ile başlayıp modern dans ve hip-hop’la devam etti; Magma Gençlik Korosu’nda şarkı söyledi. Özyeğin Üniversitesi İletişim Tasarımı mezunu. Sınır tanımayan sesi ve bulaşıcı neşesiyle Manifest sound’unun kalbinde duruyor.',
      facts: [['Doğum', '23 Ağustos 2004'], ['Memleket', 'İstanbul'], ['Burç', 'Başak'], ['Eğitim', 'Özyeğin Ünv. · İletişim Tasarımı'], ['Geçmiş', 'Koro · Bale · Hip-hop'], ['Görevi', 'Ana Vokalist']],
      ig: 'suedaauluca', tt: 'suedauluca',
    },
    {
      name: 'Zeynep Sude Oktay', color: 'Mavi', mc: '#3b82f6', tint: 'rgba(59,130,246,.3)',
      role: 'Vokalist · Dansçı', img: 'assets/img/zeynep.webp',
      tp: ['1:34–1:38'], playable: false,
      bio: '“Zoktay” sahne adıyla da bilinen Zeynep, Manifest öncesinde profesyonel dansçı olarak sahne aldı. Marmara Üniversitesi Halkla İlişkiler ve Tanıtım mezunu. Sakin özgüveni ve sarsılmaz enerjisiyle grubun dengesini kuran isim; sessiz ama derin bir güç.',
      facts: [['Doğum', '18 Nisan 2001'], ['Memleket', 'İstanbul'], ['Burç', 'Koç'], ['Eğitim', 'Marmara Ünv. · Halkla İlişkiler'], ['Geçmiş', 'Dansçı · Sahne adı “Zoktay”'], ['Görevi', 'Vokalist · Dansçı']],
      ig: 'zeynep.okktay', tt: 'zeynep.okktay',
    },
  ];

  /* ── Pikap: kapaktan plak çıkar, pikaba uçar, çalar ───────
     Şarkı kartına tıkla → kapağın içinden plak kayar, ekranın
     altındaki pikaba uçar, iğne plağa iner ve iTunes'un resmî
     30 sn önizlemesi çalar. */
  const tt = $('#turntable');
  if (tt) {
    const ttAudio  = new Audio();
    ttAudio.preload = 'none';
    const ttCover  = $('.tt-cover', tt);
    const ttTitle  = $('.tt-title', tt);
    const ttBar    = $('.tt-progress i', tt);
    const ttToggle = $('.tt-toggle', tt);
    const ttOpen   = $('.tt-open', tt);
    const ttClose  = $('.tt-close', tt);
    const ICON_PLAY  = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    const ICON_PAUSE = '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
    let currentCard = null;

    const setToggle = playing => { ttToggle.innerHTML = playing ? ICON_PAUSE : ICON_PLAY; };
    setToggle(false);

    const ttDoPause = () => {
      ttAudio.pause();
      tt.classList.remove('is-playing');   // iğne kalkar, plak durur
      setToggle(false);
    };
    ttPause = ttDoPause;

    const ttResume = () => {
      stopMemberPart?.(null);              // üye sesi çalıyorsa sustur
      ttAudio.play().then(() => {
        tt.classList.add('is-playing');    // iğne plağa iner
        setToggle(true);
      }).catch(() => {});
    };

    const ttCloseAll = () => {
      ttDoPause();
      tt.classList.remove('is-open');
      tt.setAttribute('aria-hidden', 'true');
      currentCard?.classList.remove('is-spinning');
      currentCard = null;
    };

    /* plağın (o anki konumundan) pikaba uçuşu */
    const flyDisc = (card, done) => {
      const r = $('.disc-peek', card).getBoundingClientRect();
      const size = r.width;
      const startX = r.left + size / 2;
      const startY = r.top + size / 2;
      // pikap alttan ortalanmış; deck sol kenarda → hedefi hesapla
      const dockW = Math.min(560, innerWidth - 28);
      const endX = innerWidth / 2 - dockW / 2 + 18 + 43;
      const endY = innerHeight - 20 - 57;
      const disc = document.createElement('div');
      disc.className = 'fly-disc';
      disc.style.cssText = `left:0;top:0;width:${size}px;height:${size}px;`;
      document.body.appendChild(disc);
      disc.animate([
        { transform: `translate(${startX - size/2}px, ${startY - size/2}px) rotate(160deg) scale(1)`, opacity: 1 },
        { transform: `translate(${(startX+endX)/2 - size/2}px, ${Math.min(startY,endY) - size/2 - 90}px) rotate(430deg) scale(${(76/size+1)/2})`, opacity: 1, offset: .55 },
        { transform: `translate(${endX - 38}px, ${endY - 38}px) rotate(880deg) scale(${76/size})`, opacity: 1 },
      ], { duration: 850, easing: 'cubic-bezier(.3,.7,.3,1)' }).onfinish = () => {
        disc.remove();
        done();
      };
    };

    /* kapağı ikiye ayır, plak aradan çıksın, sonra uçsun */
    const ejectDisc = (card, done) => {
      if (reduceMotion) { done(); return; }
      // yarımları ilk kullanımda oluştur
      if (!card.dataset.split) {
        const cover = $('.cover', card);
        const src = $('img', cover).src;
        for (const side of ['left', 'right']) {
          const h = document.createElement('span');
          h.className = 'sleeve-half ' + side;
          h.style.backgroundImage = `url("${src}")`;
          h.setAttribute('aria-hidden', 'true');
          cover.appendChild(h);
        }
        card.dataset.split = '1';
      }
      requestAnimationFrame(() => card.classList.add('is-opening'));
      setTimeout(() => {                       // kapak açıldı, plak öne çıktı
        card.classList.add('is-flying');       // karttaki plağı gizle
        flyDisc(card, done);                   // klon pikaba uçar
        setTimeout(() => card.classList.remove('is-opening', 'is-flying'), 620);
      }, 560);
    };

    $$('.release[data-audio]').forEach(card => {
      card.addEventListener('click', e => {
        e.preventDefault();
        if (card.classList.contains('is-opening')) return;   // animasyon sürüyor
        // aynı karta ikinci tık: duraklat / devam et
        if (currentCard === card && tt.classList.contains('is-open')) {
          tt.classList.contains('is-playing') ? ttDoPause() : ttResume();
          return;
        }
        stopMemberPart?.(null);
        ttDoPause();
        currentCard?.classList.remove('is-spinning');
        currentCard = card;
        ttCover.src = $('.cover img', card).src;
        ttTitle.textContent = card.dataset.title;
        ttOpen.href = card.href;
        ttBar.style.width = '0%';
        tt.classList.add('is-open');
        tt.setAttribute('aria-hidden', 'false');
        ejectDisc(card, () => {
          card.classList.add('is-spinning');
          ttAudio.src = card.dataset.audio;
          ttAudio.currentTime = 0;
          ttResume();
        });
      });
    });

    ttToggle.addEventListener('click', () => {
      if (!ttAudio.src) return;
      tt.classList.contains('is-playing') ? ttDoPause() : ttResume();
    });
    ttClose.addEventListener('click', ttCloseAll);
    ttAudio.addEventListener('timeupdate', () => {
      if (ttAudio.duration) ttBar.style.width = (ttAudio.currentTime / ttAudio.duration * 100) + '%';
    });
    ttAudio.addEventListener('ended', () => { ttDoPause(); ttBar.style.width = '100%'; });
  }

  /* ── Modal aç/kapat ───────────────────────────────────────── */
  const modal = $('#memberModal');
  if (modal) {
    const panel   = $('.mmodal-panel', modal);
    const elBody  = $('.mmodal-body', modal);
    const elQuote = $('.mmodal-quote', modal);
    const navPrev = $('.mmodal-prev', modal);
    const navNext = $('.mmodal-next', modal);
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
    const elFull  = $('.mmodal-full', modal);
    const TOZ_PEMBE_URL = 'https://music.apple.com/tr/album/toz-pembe/6784751861?i=6784751987';
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
      elQuote.textContent = '🎵 Toz Pembe’de gerçekten söylediği an: ' + d.tp.join(' ve ');
      elBio.textContent = d.bio;
      elColorI.style.background = d.mc;
      elColorB.textContent = d.color;
      elFacts.innerHTML = d.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      elSoc.innerHTML =
        `<a href="https://www.instagram.com/${d.ig}/" target="_blank" rel="noopener">${IG_SVG} @${d.ig}</a>` +
        `<a href="https://www.tiktok.com/@${d.tt}" target="_blank" rel="noopener">${TT_SVG} @${d.tt}</a>`;
      playBtn.classList.remove('is-on');
      // her üye için ses çalar. Esin/Sueda kendi gerçek anını, diğerleri
      // şarkının resmî önizlemesini duyar; gerçek an rozette/altta yazılı.
      const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
      playBtn.innerHTML = playIcon + (d.playable
        ? 'Kendi Anını Dinle (' + d.tp[0] + ')'
        : 'Önizlemeyi Dinle');
      if (elFull) elFull.href = TOZ_PEMBE_URL;
      // önceki/sonraki üye etiketleri
      const L = MEMBER_DATA.length;
      $('small', navPrev).textContent = MEMBER_DATA[(idx - 1 + L) % L].name.split(' ')[0];
      $('small', navNext).textContent = MEMBER_DATA[(idx + 1) % L].name.split(' ')[0];
      // giriş animasyonları her açılışta/geçişte yeniden oynasın
      const parts = [elPhoto, ...elBody.children];
      parts.forEach((el, i) => {
        el.style.setProperty('--st', i);
        el.style.animation = 'none';
      });
      void elBody.offsetWidth;   // reflow → animasyon sıfırlanır
      parts.forEach(el => { el.style.animation = ''; });
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
    navPrev.addEventListener('click', () => {
      stopMemberPart?.(null);
      openModal((mIdx - 1 + MEMBER_DATA.length) % MEMBER_DATA.length);
    });
    navNext.addEventListener('click', () => {
      stopMemberPart?.(null);
      openModal((mIdx + 1) % MEMBER_DATA.length);
    });
    addEventListener('keydown', e => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft') navPrev.click();
      if (e.key === 'ArrowRight') navNext.click();
    });
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    playBtn.addEventListener('click', () => {
      const d = MEMBER_DATA[mIdx];
      clearTimeout(playPulse);
      if (playBtn.classList.contains('is-on')) {
        playBtn.classList.remove('is-on');
        stopMemberPart?.(null);
        return;
      }
      playBtn.classList.add('is-on');
      playMemberPart?.(members[mIdx], mIdx);
      // buton nabzı: playable ise kendi anı kadar, değilse tam önizleme kadar
      let ms = 28000;
      if (d.playable) {
        const [a, b] = d.tp[0].split('–').map(t => {
          const [m, s] = t.split(':').map(Number);
          return m * 60 + s;
        });
        ms = (b - a + .3) * 1000;
      }
      playPulse = setTimeout(() => playBtn.classList.remove('is-on'), ms);
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
