/* Case protegido: o conteúdo vem criptografado (AES-GCM, chave derivada da senha com PBKDF2)
   e só é inserido na página depois que a senha certa é digitada. */
(function(){
  var payloadEl = document.getElementById('casePayload');
  var gate = document.getElementById('gate');
  if (!payloadEl || !gate) return;
  document.documentElement.classList.add('is-locked');
  var data = JSON.parse(payloadEl.textContent);
  var form = document.getElementById('gateForm');
  var input = document.getElementById('gatePass');
  var field = input.closest('.gate-field');
  var errorEl = document.getElementById('gateError');
  var submit = form.querySelector('button[type="submit"]');
  var eye = document.getElementById('gateEye');
  var KEY = 'portfolio-senha';

  function b64(s){ var bin = atob(s), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }

  async function decrypt(password){
    var enc = new TextEncoder();
    var base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey(
      {name:'PBKDF2', salt:b64(data.salt), iterations:data.iter, hash:'SHA-256'},
      base, {name:'AES-GCM', length:256}, false, ['decrypt']);
    var plain = await crypto.subtle.decrypt({name:'AES-GCM', iv:b64(data.iv)}, key, b64(data.ct));
    return new TextDecoder().decode(plain);
  }

  function reveal(html){
    var wrap = document.createElement('div');
    wrap.className = 'case-unlocked';
    wrap.innerHTML = html;
    document.documentElement.classList.remove('is-locked');
    gate.replaceWith(wrap);
    while (wrap.firstChild) wrap.parentNode.insertBefore(wrap.firstChild, wrap);
    wrap.remove();
    var main = document.querySelector('main');
    main.classList.add('case-unlocked');
    if (window.portfolioInitMedia) window.portfolioInitMedia(main);
  }

  async function tryOpen(password, fromForm){
    try {
      var html = await decrypt(password);
      try { sessionStorage.setItem(KEY, password); } catch(e){}
      reveal(html);
      window.scrollTo(0,0);
      if (fromForm){ var h = document.querySelector('.case-head h1'); if (h){ h.setAttribute('tabindex','-1'); h.focus({preventScroll:true}); } }
      return true;
    } catch(e){ return false; }
  }

  eye.addEventListener('click', function(){
    var show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    eye.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    eye.querySelector('use').setAttribute('href', show ? '#i-eye-off' : '#i-eye');
    input.focus();
  });
  input.addEventListener('input', function(){ errorEl.hidden = true; input.removeAttribute('aria-invalid'); });

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    if (!input.value) { input.focus(); return; }
    submit.disabled = true; var label = submit.firstChild.textContent; submit.firstChild.textContent = 'Verificando… ';
    var ok = await tryOpen(input.value, true);
    if (!ok){
      submit.disabled = false; submit.firstChild.textContent = label;
      errorEl.hidden = false; input.setAttribute('aria-invalid','true');
      field.classList.remove('shake'); void field.offsetWidth; field.classList.add('shake');
      input.select();
    }
  });

  /* Já digitou a senha nesta visita? Abre direto. */
  var saved = null; try { saved = sessionStorage.getItem(KEY); } catch(e){}
  if (saved) tryOpen(saved, false);
})();
