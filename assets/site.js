/* Interações do portfólio Maria Souto — compartilhadas por todas as páginas.
   Cada bloco só roda se o elemento existir na página. */
(function(){
  var $ = function(sel, root){ return (root || document).querySelector(sel); };
  var $$ = function(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Toda página abre no topo (a não ser que o link aponte para uma seção) ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function toTop(){ if (!location.hash) window.scrollTo({top:0, left:0, behavior:'instant'}); }
  toTop();
  window.addEventListener('pageshow', toTop);

  /* ---------- Menu: indicador deslizante ---------- */
  var header = $('#header');
  var links = $('#links');
  var pill = $('#pill');
  var navAnchors = links ? $$('a', links) : [];
  var sheetAnchors = $$('#sheetLinks a');

  function movePill(){
    if (!links || !pill) return;
    var cur = links.querySelector('[aria-current="true"]');
    if (!cur || !cur.offsetWidth){ pill.style.width = '0'; return; }
    pill.style.width = cur.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + cur.offsetLeft + 'px)';
  }
  function setActive(id){
    [navAnchors, sheetAnchors].forEach(function(list){
      list.forEach(function(a){
        var href = a.getAttribute('href') || '';
        if (href.split('#')[1] === id) a.setAttribute('aria-current','true');
        else a.removeAttribute('aria-current');
      });
    });
    movePill();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
  movePill();
  window.addEventListener('resize', function(){ movePill(); if (typeof updateActive === 'function') updateActive(); });

  /* Seção ativa conforme a rolagem (só na home):
     a ativa é a última seção cujo topo já passou de uma linha a 35% da altura da tela. */
  var sections = ['inicio','servicos','projetos','contato'].map(function(id){ return document.getElementById(id); }).filter(Boolean);
  var currentId = null;
  function updateActive(){
    if (!sections.length) return;
    var line = window.innerHeight * 0.35;
    var id = sections[0].id;
    sections.forEach(function(sec){ if (sec.getBoundingClientRect().top <= line) id = sec.id; });
    var atEnd = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 4;
    if (atEnd) id = sections[sections.length - 1].id;
    if (id !== currentId){ currentId = id; setActive(id); }
  }

  /* Menu recolhe ao rolar */
  var ticking = false;
  function onScroll(){
    updateActive();
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if (!ticking){ requestAnimationFrame(onScroll); ticking = true; }
  }, {passive:true});
  if (header) header.addEventListener('transitionend', function(e){ if (e.propertyName === 'max-width') movePill(); });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var burger = $('#burger');
  var sheet = $('#sheet');
  function setMenu(open){
    if (!burger || !sheet) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    sheet.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  }
  if (burger) burger.addEventListener('click', function(){ setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  sheetAnchors.forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });

  /* ---------- Acordeão (um aberto por vez) ---------- */
  var triggers = $$('.acc-trigger');
  triggers.forEach(function(t){
    t.addEventListener('click', function(){
      var willOpen = t.getAttribute('aria-expanded') !== 'true';
      triggers.forEach(function(o){
        o.setAttribute('aria-expanded','false');
        document.getElementById(o.getAttribute('aria-controls')).classList.remove('open');
      });
      if (willOpen){
        t.setAttribute('aria-expanded','true');
        document.getElementById(t.getAttribute('aria-controls')).classList.add('open');
      }
    });
  });

  /* ---------- Faixa de logos: arrastar com o mouse ---------- */
  var sc = $('#logos');
  if (sc){
    var down = false, startX = 0, startLeft = 0;
    sc.addEventListener('pointerdown', function(e){
      if (e.pointerType !== 'mouse' || sc.scrollWidth <= sc.clientWidth) return;
      down = true; startX = e.clientX; startLeft = sc.scrollLeft;
      sc.setPointerCapture(e.pointerId);
    });
    sc.addEventListener('pointermove', function(e){
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 3) sc.classList.add('dragging');
      sc.scrollLeft = startLeft - dx;
    });
    var endDrag = function(){ down = false; sc.classList.remove('dragging'); };
    sc.addEventListener('pointerup', endDrag);
    sc.addEventListener('pointercancel', endDrag);
    sc.addEventListener('wheel', function(e){
      if (sc.scrollWidth <= sc.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var max = sc.scrollWidth - sc.clientWidth;
      if ((e.deltaY < 0 && sc.scrollLeft <= 0) || (e.deltaY > 0 && sc.scrollLeft >= max)) return;
      e.preventDefault(); sc.scrollLeft = Math.max(0, Math.min(max, sc.scrollLeft + e.deltaY));
    }, {passive:false});
  }

  /* ---------- Aviso (toast) ---------- */
  var toast = $('#toast'), toastTimer;
  function showToast(msg, after){
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); if (after) after(); }, 2200);
  }

  /* ---------- Copiar e-mail ---------- */
  var copyBtn = $('#copyBtn'), email = $('#email');
  if (copyBtn && email){
    var selectEmail = function(){
      var r = document.createRange(); r.selectNodeContents(email);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    };
    copyBtn.addEventListener('click', function(){
      var text = email.textContent.trim();
      var reset = function(){ copyBtn.textContent = 'Copiar'; };
      var fallback = function(){ selectEmail(); showToast('E-mail selecionado. Use Ctrl+C para copiar', reset); };
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(function(){ copyBtn.textContent = 'Copiado'; showToast('E-mail copiado', reset); }, fallback);
      } else fallback();
    });
  }

  /* ---------- Mídias dos cases ---------- */
  /* Enquanto o arquivo não existir, mostra a caixa cinza com a descrição. */
  function markEmpty(box, label){ box.classList.add('is-empty'); box.setAttribute('data-empty', label || 'Mídia'); }

  /* Ampliar imagem */
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbClose = $('#lbClose'), lastFocus;
  function closeLb(){
    if (!lb) return;
    lb.classList.remove('open'); document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  if (lb) lb.addEventListener('click', closeLb);

  /* Liga imagens, vídeos e ampliação dentro de um trecho da página.
     Exposto em window.portfolioInitMedia para conteúdo que entra depois (ex.: case protegido por senha). */
  function initMedia(root){
    $$('.fig-media img', root).forEach(function(img){
      var box = img.closest('.fig-media');
      if (!img.getAttribute('src') || (img.complete && img.naturalWidth === 0)) markEmpty(box, img.alt);
      img.addEventListener('error', function(){ markEmpty(box, img.alt); });
      img.addEventListener('load', function(){ box.classList.remove('is-empty'); });
    });
    $$('.fig-video video', root).forEach(function(video){
      var box = video.closest('.fig-video');
      var label = video.getAttribute('aria-label');
      var sources = $$('source', video);
      var failed = 0;
      if ((!sources.length && !video.getAttribute('src')) || video.networkState === 3) markEmpty(box, label);
      sources.forEach(function(src){
        src.addEventListener('error', function(){ failed++; if (failed === sources.length) markEmpty(box, label); });
      });
      video.addEventListener('error', function(){ markEmpty(box, label); });
      video.addEventListener('loadeddata', function(){ box.classList.remove('is-empty'); });

      /* Pausar e retomar; quem prefere menos movimento recebe o vídeo pausado */
      var btn = box.querySelector('.video-toggle');
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function sync(){
        if (!btn) return;
        var paused = video.paused;
        btn.setAttribute('aria-label', paused ? 'Reproduzir vídeo' : 'Pausar vídeo');
        btn.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
      }
      if (reduce){ video.removeAttribute('autoplay'); video.pause(); }
      if (btn) btn.addEventListener('click', function(){ if (video.paused) video.play(); else video.pause(); });
      video.addEventListener('play', sync); video.addEventListener('pause', sync); sync();
    });
    if (lb){
      $$('.fig-media', root).forEach(function(btn){
        btn.addEventListener('click', function(){
          if (btn.classList.contains('is-empty')) return;
          var img = btn.querySelector('img');
          lastFocus = btn; lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt || '';
          lb.classList.add('open'); document.body.style.overflow = 'hidden'; lbClose.focus();
        });
      });
    }
  }
  initMedia(document);
  window.portfolioInitMedia = initMedia;

  /* ---------- Voltar ao topo ---------- */
  $$('.totop').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'});
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    });
  });

  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    setMenu(false);
    if (lb && lb.classList.contains('open')) closeLb();
  });
})();
