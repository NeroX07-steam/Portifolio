(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storage = {
    get(key, fallback = null) {
      try { const value = localStorage.getItem(`mente-em-flor:${key}`); return value === null ? fallback : JSON.parse(value); }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(`mente-em-flor:${key}`, JSON.stringify(value)); return true; }
      catch { showToast('O navegador não permitiu salvar este dado.'); return false; }
    },
    remove(key) { try { localStorage.removeItem(`mente-em-flor:${key}`); } catch {} }
  };

  let toastTimeout;
  function showToast(message) {
    const toast = $('#toast');
    const label = $('#toastText');
    if (!toast || !label) return;
    label.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2900);
  }

  // Entrada curta: não bloqueia conteúdo nem teclado por muito tempo.
  const intro = $('.intro-screen');
  if (intro && !prefersReducedMotion && !sessionStorage.getItem('mente-em-flor:intro')) {
    document.body.classList.add('intro-running');
    setTimeout(() => {
      intro.classList.add('is-over');
      document.body.classList.remove('intro-running');
      sessionStorage.setItem('mente-em-flor:intro', '1');
    }, 1350);
  } else if (intro) {
    intro.classList.add('is-over');
  }

  // Reveal progressivo, com fallback caso IntersectionObserver não exista.
  const revealItems = $$('.reveal');
  revealItems.forEach((item, index) => {
    const parent = item.parentElement;
    if (parent && (parent.classList.contains('practice-grid') || parent.classList.contains('support-grid') || parent.classList.contains('hobby-stack'))) {
      item.style.setProperty('--delay', `${Math.min(index % 4, 3) * 90}ms`);
    }
  });
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  // Barra de progresso, header e botão de voltar ao topo.
  const progressBar = $('.page-progress span');
  const header = $('.site-header');
  const backTop = $('#backTop');
  let scrollTicking = false;
  function updateScrollUI() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = `${scrollable > 0 ? Math.min(100, scrollTop / scrollable * 100) : 0}%`;
    header?.classList.toggle('scrolled', scrollTop > 24);
    backTop?.classList.toggle('visible', scrollTop > 650);
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTicking) { window.requestAnimationFrame(updateScrollUI); scrollTicking = true; }
  }, { passive: true });
  updateScrollUI();
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));

  // Navegação adaptada ao celular e atualização da seção ativa.
  const nav = $('#mainNav');
  const menuButton = $('.menu-toggle');
  function closeMenu() {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Abrir menu');
  }
  menuButton?.addEventListener('click', () => {
    const willOpen = !nav.classList.contains('open');
    nav.classList.toggle('open', willOpen);
    menuButton.setAttribute('aria-expanded', String(willOpen));
    menuButton.setAttribute('aria-label', willOpen ? 'Fechar menu' : 'Abrir menu');
  });
  $$('.nav-link', nav).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  const sectionLinks = $$('.nav-link');
  const sections = sectionLinks.map(link => $(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach(link => {
        const active = link.getAttribute('href') === `#${visible.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-25% 0px -62% 0px', threshold: [0, .2, .5] });
    sections.forEach(section => sectionObserver.observe(section));
  }

  // Alternância de tema persistente.
  const themeToggle = $('.theme-toggle');
  const themeIcon = $('.theme-icon');
  function setTheme(mode) {
    const isDark = mode === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    if (themeIcon) themeIcon.textContent = isDark ? '☀' : '☾';
    themeToggle?.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
    themeToggle?.setAttribute('title', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
    storage.set('theme', isDark ? 'dark' : 'light');
  }
  const savedTheme = storage.get('theme', 'light');
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');
  themeToggle?.addEventListener('click', () => setTheme(document.body.classList.contains('dark-mode') ? 'light' : 'dark'));

  // Brilho de cursor e parallax sutil apenas em dispositivos com mouse.
  const aura = $('.pointer-aura');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !prefersReducedMotion && aura) {
    aura.style.opacity = '1';
    let pointerX = -500, pointerY = -500, auraX = pointerX, auraY = pointerY;
    window.addEventListener('pointermove', event => { pointerX = event.clientX; pointerY = event.clientY; }, { passive: true });
    const moveAura = () => {
      auraX += (pointerX - auraX) * .13;
      auraY += (pointerY - auraY) * .13;
      aura.style.transform = `translate(${auraX}px, ${auraY}px) translate(-50%, -50%)`;
      requestAnimationFrame(moveAura);
    };
    requestAnimationFrame(moveAura);
    const heroVisual = $('.hero-visual');
    heroVisual?.addEventListener('pointermove', event => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      heroVisual.style.setProperty('--pointer-x', `${x * 10}px`);
      heroVisual.style.setProperty('--pointer-y', `${y * 10}px`);
      const flower = $('.flower-scene', heroVisual);
      if (flower) flower.style.transform = `translate(${x * -11}px, ${y * -9 + 12}px) rotate(${x * 2}deg)`;
    });
    heroVisual?.addEventListener('pointerleave', () => {
      const flower = $('.flower-scene', heroVisual);
      if (flower) flower.style.transform = '';
    });
  } else if (aura) aura.remove();

  // Inclinação 3D: movimento pequeno e sem alterar o conteúdo.
  if (finePointer && !prefersReducedMotion) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - .5;
        const ny = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = `perspective(900px) rotateX(${ny * -3}deg) rotateY(${nx * 3}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    $$('.magnetic').forEach(button => {
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .08}px, ${(event.clientY - rect.top - rect.height / 2) * .1}px)`;
      });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }

  // Ripple discreto para botões acionáveis.
  $$('button, .button').forEach(button => {
    button.addEventListener('pointerdown', event => {
      if (prefersReducedMotion || event.pointerType === 'touch') return;
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'click-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.style.position = button.style.position || 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });

  // Pausa guiada acessível: 60 segundos, com ciclos suaves e botão de reinício.
  const breathWidget = $('#breathWidget');
  const breathOrb = $('#breathOrb');
  const breathInstruction = $('#breathInstruction');
  const breathSubtext = $('#breathSubtext');
  const breathCount = $('#breathCount');
  const breathStart = $('#breathStart');
  const breathReset = $('#breathReset');
  const progressCircle = $('.progress-circle');
  const breathDialog = $('#breathDialog');
  const DURATION = 60;
  const CIRCUMFERENCE = 2 * Math.PI * 132;
  let breathElapsed = 0;
  let breathInterval = null;
  let breathRunning = false;
  function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
  function breathPhase(seconds) {
    const phase = seconds % 12;
    if (phase < 4) return { name: 'Inspire suavemente', sub: 'se for confortável', type: 'inhale' };
    if (phase < 6) return { name: 'Deixe o ar sair', sub: 'sem forçar', type: 'exhale' };
    return { name: 'Solte os ombros', sub: 'volte ao seu ritmo', type: 'rest' };
  }
  function renderBreath() {
    const remaining = Math.max(0, DURATION - breathElapsed);
    if (breathCount) breathCount.textContent = formatTime(remaining);
    if (progressCircle) progressCircle.style.strokeDashoffset = String(CIRCUMFERENCE * (breathElapsed / DURATION));
    if (!breathRunning && breathElapsed === 0) {
      if (breathInstruction) breathInstruction.textContent = 'Pronto para pausar?';
      if (breathSubtext) breathSubtext.textContent = 'Você decide o ritmo.';
      breathOrb?.classList.remove('is-breathing', 'is-exhale');
      return;
    }
    const phase = breathPhase(breathElapsed);
    if (breathInstruction) breathInstruction.textContent = phase.name;
    if (breathSubtext) breathSubtext.textContent = phase.sub;
    breathOrb?.classList.toggle('is-breathing', phase.type === 'inhale');
    breathOrb?.classList.toggle('is-exhale', phase.type === 'exhale');
  }
  function stopBreath(completed = false) {
    clearInterval(breathInterval);
    breathInterval = null;
    breathRunning = false;
    if (breathStart) { breathStart.innerHTML = completed ? 'Recomeçar <span>↻</span>' : 'Continuar <span>→</span>'; breathStart.disabled = false; }
    if (completed && breathInstruction) {
      breathInstruction.textContent = 'Você chegou até aqui.';
      if (breathSubtext) breathSubtext.textContent = 'Obrigada por fazer esta pausa.';
      breathOrb?.classList.remove('is-breathing', 'is-exhale');
      showToast('Pausa concluída. Vá no seu tempo.');
    }
  }
  function startBreath() {
    if (breathRunning) {
      stopBreath(false);
      if (breathStart) breathStart.innerHTML = 'Continuar <span>→</span>';
      return;
    }
    if (breathElapsed >= DURATION) breathElapsed = 0;
    breathRunning = true;
    if (breathStart) breathStart.innerHTML = 'Pausar <span>Ⅱ</span>';
    renderBreath();
    breathInterval = setInterval(() => {
      breathElapsed += 1;
      if (breathElapsed >= DURATION) {
        breathElapsed = DURATION;
        renderBreath();
        stopBreath(true);
        return;
      }
      renderBreath();
    }, 1000);
  }
  function resetBreath() {
    clearInterval(breathInterval);
    breathInterval = null;
    breathRunning = false;
    breathElapsed = 0;
    if (breathStart) { breathStart.innerHTML = 'Começar <span>→</span>'; breathStart.disabled = false; }
    renderBreath();
  }
  breathStart?.addEventListener('click', startBreath);
  breathReset?.addEventListener('click', resetBreath);
  $('.launch-breath')?.addEventListener('click', () => {
    if (breathDialog?.showModal) { breathDialog.showModal(); document.body.classList.add('modal-open'); }
    else document.querySelector('#pausas')?.scrollIntoView({ behavior: 'smooth' });
  });
  $$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => breathDialog?.close()));
  breathDialog?.addEventListener('close', () => document.body.classList.remove('modal-open'));
  $('#dialogStartBreath')?.addEventListener('click', () => {
    breathDialog?.close();
    document.querySelector('#pausas')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    setTimeout(() => { if (!breathRunning) startBreath(); }, prefersReducedMotion ? 0 : 550);
  });

  // Check-in: seleção e nota são opcionais, ficam apenas no navegador atual.
  const moodButtons = $$('.mood-option');
  const noteInput = $('#checkinNote');
  const noteCount = $('#noteCount');
  const saveCheckin = $('#saveCheckin');
  const checkinFeedback = $('#checkinFeedback');
  let selectedMood = '';
  const existingCheckin = storage.get('checkin', null);
  if (existingCheckin && typeof existingCheckin === 'object') {
    selectedMood = existingCheckin.mood || '';
    if (noteInput) noteInput.value = existingCheckin.note || '';
    moodButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mood === selectedMood)));
    if (noteCount && noteInput) noteCount.textContent = `${noteInput.value.length} / 280`;
    if (checkinFeedback) checkinFeedback.textContent = 'Seu último check-in está salvo neste navegador. Você pode atualizar quando quiser.';
    if (saveCheckin) saveCheckin.disabled = !(selectedMood || (noteInput?.value || '').trim());
  }
  moodButtons.forEach(button => button.addEventListener('click', () => {
    selectedMood = button.dataset.mood || '';
    moodButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    if (saveCheckin) saveCheckin.disabled = false;
    if (checkinFeedback) checkinFeedback.textContent = '';
  }));
  noteInput?.addEventListener('input', () => {
    if (noteCount) noteCount.textContent = `${noteInput.value.length} / 280`;
    if (saveCheckin) saveCheckin.disabled = !(selectedMood || noteInput.value.trim());
    if (checkinFeedback) checkinFeedback.textContent = '';
  });
  saveCheckin?.addEventListener('click', () => {
    const note = (noteInput?.value || '').trim();
    if (!selectedMood && !note) return;
    const saved = storage.set('checkin', { mood: selectedMood, note, updatedAt: new Date().toISOString() });
    if (saved && checkinFeedback) checkinFeedback.textContent = 'Salvo neste navegador. Obrigado por separar um instante para você.';
    if (saved) showToast('Seu check-in foi salvo neste dispositivo.');
  });
  $('.open-checkin')?.addEventListener('click', () => {
    $('#checkin')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    setTimeout(() => moodButtons[0]?.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 550);
  });

  // Salvar ideias de lazer para revisitar. Nenhuma conta ou envio é necessário.
  const savedIdeasBox = $('#savedIdeas');
  const savedIdeasList = $('#savedIdeasList');
  const ideaLabels = { leitura: 'Leitura', jogos: 'Jogos', criacao: 'Música e criação', natureza: 'Uma pausa ao ar livre' };
  let savedIdeas = storage.get('ideas', []);
  if (!Array.isArray(savedIdeas)) savedIdeas = [];
  function renderIdeas() {
    $$('.save-idea').forEach(button => {
      const isSaved = savedIdeas.includes(button.dataset.idea);
      button.setAttribute('aria-pressed', String(isSaved));
      const label = isSaved ? 'Guardado' : (button.dataset.idea === 'leitura' ? 'Guardar esta ideia' : 'Guardar ideia');
      button.innerHTML = `<span>${isSaved ? '♥' : '♡'}</span> ${label}`;
    });
    if (savedIdeasBox) savedIdeasBox.hidden = savedIdeas.length === 0;
    if (savedIdeasList) savedIdeasList.textContent = savedIdeas.map(key => ideaLabels[key]).filter(Boolean).join(' · ') || 'Ainda nenhuma ideia guardada.';
  }
  $$('.save-idea').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.idea;
    if (!key) return;
    savedIdeas = savedIdeas.includes(key) ? savedIdeas.filter(item => item !== key) : [...savedIdeas, key];
    if (storage.set('ideas', savedIdeas)) {
      renderIdeas();
      showToast(savedIdeas.includes(key) ? 'Ideia guardada neste navegador.' : 'Ideia removida das guardadas.');
    }
  }));
  $('#clearIdeas')?.addEventListener('click', () => { savedIdeas = []; storage.set('ideas', savedIdeas); renderIdeas(); showToast('Lista de ideias limpa.'); });
  renderIdeas();

  // A frase de apoio é copiada por ação explícita da pessoa.
  $('#copyMessage')?.addEventListener('click', async () => {
    const message = 'Não estou bem e não sei exatamente como falar sobre isso. Você pode ficar comigo um pouco?';
    try {
      await navigator.clipboard.writeText(message);
      showToast('Frase copiada. Use quando for útil para você.');
    } catch {
      const temporary = document.createElement('textarea');
      temporary.value = message;
      temporary.setAttribute('readonly', '');
      temporary.style.position = 'fixed'; temporary.style.opacity = '0';
      document.body.appendChild(temporary); temporary.select();
      const copied = document.execCommand('copy'); temporary.remove();
      showToast(copied ? 'Frase copiada.' : 'Seu navegador não permitiu copiar automaticamente.');
    }
  });

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Ao voltar à aba, não deixa o cronômetro ficar visualmente atrasado.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') updateScrollUI();
  });
})();
