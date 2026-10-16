/* Mente em Flor / novos capítulos interativos
   Não envia sentimentos, notas ou cartas a nenhum servidor.
   Regras: linguagem acolhedora, liberdade para parar e segurança em aparelhos compartilhados. */
(() => {
  "use strict";

  const ready = fn => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  };

  ready(() => {
    const $ = selector => document.querySelector(selector);
    const $$ = selector => [...document.querySelectorAll(selector)];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let toastTimer;

    function feedback(message) {
      const box = $("#toast"), text = $("#toastText");
      if (!box || !text) return;
      text.textContent = message;
      box.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => box.classList.remove("show"), 3200);
    }

    function getSaved(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    }

    function setSaved(key, value) {
      try { localStorage.setItem(key, value); return true; }
      catch {
        feedback("Não foi possível guardar neste navegador. Prefira exportar um arquivo.");
        return false;
      }
    }

    function deleteSaved(key) {
      try { localStorage.removeItem(key); return true; }
      catch { feedback("Não foi possível apagar os dados salvos."); return false; }
    }

    async function copyText(text) {
      const content = String(text || "").trim();
      if (!content) return false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(content);
          return true;
        }
      } catch {
        // Browsers on file:// and some school computers restrict Clipboard API.
      }
      const field = document.createElement("textarea");
      field.value = content;
      field.readOnly = true;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.focus();
      field.select();
      let copied = false;
      try { copied = document.execCommand("copy"); }
      catch { copied = false; }
      field.remove();
      return copied;
    }

    // Kit de pausas: sugestões sem avaliação psicológica ou armazenamento.
    const ideas = {
      cansaco: {
        title: "QUANDO O CORPO PEDE PAUSA",
        items: [
          ["Talvez um copo de água.", "Se for possível, faça uma pausa e beba um pouco de água. Não precisa transformar isso em uma missão."],
          ["A próxima coisa pode ser menor.", "Se a lista está longa, escolha apenas uma tarefa pequena ou permita-se adiar alguma coisa."],
          ["Olhe para outro lugar.", "Se estiver diante de uma tela há muito tempo, descanse os olhos por um instante, sem cronômetro."],
          ["O descanso não é recompensa.", "Você pode descansar mesmo sem ter terminado tudo. Seu valor não é medido pelas tarefas concluídas."],
          ["Um gesto confortável.", "Mude de posição, alongue-se suavemente se quiser ou simplesmente encontre uma forma de ficar mais confortável."]
        ]
      },
      mente: {
        title: "QUANDO OS PENSAMENTOS SE ACUMULAM",
        items: [
          ["Uma coisa de cada vez.", "Se houver muita coisa na cabeça, anote só o próximo passo possível. O restante pode esperar alguns minutos."],
          ["Perceba onde você está.", "Observe algo perto de você: a cor de um objeto, um som comum ou a textura da roupa. Faça apenas se ajudar."],
          ["Diminua o barulho.", "Se puder, reduza notificações ou mude para um lugar mais tranquilo por alguns instantes."],
          ["Não precisa resolver tudo agora.", "Pergunte a si mesmo o que é urgente de verdade e o que pode ficar para depois."],
          ["Compartilhe uma preocupação.", "Confiar uma parte do que está acontecendo a alguém seguro pode ser mais leve do que tentar explicar tudo de uma vez."]
        ]
      },
      solidao: {
        title: "QUANDO VOCÊ QUER COMPANHIA",
        items: [
          ["Uma mensagem simples serve.", "Você pode mandar um 'ei, tem uns minutos pra conversar?' para alguém com quem se sinta confortável."],
          ["Presença também conta.", "Às vezes conversar sobre um jogo, mangá ou música com alguém já cria um momento de conexão."],
          ["Um lugar compartilhado.", "Se quiser companhia, procure uma atividade segura com pessoas conhecidas: estudar, jogar ou só ficar por perto."],
          ["Diga o que gostaria.", "Se for confortável, diga que precisa ser escutado, mesmo sem saber explicar por quê."],
          ["Peça apoio fora da tela.", "Um familiar, amigo, educador ou outro adulto de confiança pode ajudar quando ficar sozinho estiver difícil."]
        ]
      },
      incerto: {
        title: "QUANDO NEM EXISTE UM NOME",
        items: [
          ["Você não precisa definir tudo.", "Não encontrar uma palavra para o que sente não torna a experiência menos real."],
          ["Comece pelo que percebe.", "Talvez seja mais simples escrever 'hoje foi pesado' ou 'não sei explicar' do que buscar um rótulo."],
          ["Uma página em branco.", "Se quiser, rabisque ou escreva algumas palavras sem tentar formar um texto bonito."],
          ["Permita um intervalo.", "Você pode voltar a pensar nisso mais tarde. Dar um tempo não significa ignorar o que importa."],
          ["Um convite para conversar.", "Se esse estado continuar atrapalhando sua rotina, procurar alguém de confiança ou ajuda profissional é uma opção."]
        ]
      }
    };

    let kitCategory = "cansaco", kitIndex = 0;
    const kitLabel = $("#flor-kit-label");
    const kitHeading = $("#flor-kit-idea");
    const kitDescription = $("#flor-kit-description");
    const kitPosition = $("#flor-kit-position");

    function renderKit(animate = false) {
      const group = ideas[kitCategory];
      if (!group || !kitHeading || !kitDescription) return;
      const item = group.items[kitIndex];
      kitLabel.textContent = group.title;
      kitHeading.textContent = item[0];
      kitDescription.textContent = item[1];
      kitPosition.textContent =
        String(kitIndex + 1).padStart(2, "0") + " / " + String(group.items.length).padStart(2, "0");
      $$(".flor-kit-choice").forEach(button => {
        const pressed = button.dataset.kitCategory === kitCategory;
        button.classList.toggle("active", pressed);
        button.setAttribute("aria-pressed", String(pressed));
      });
      if (animate && !reducedMotion && kitHeading.animate) {
        kitHeading.animate(
          [{ opacity: .35, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 430, easing: "ease-out" }
        );
      }
    }

    $$(".flor-kit-choice").forEach(button => button.addEventListener("click", () => {
      const id = button.dataset.kitCategory;
      if (!ideas[id]) return;
      kitCategory = id;
      kitIndex = 0;
      renderKit(true);
    }));

    $("#flor-kit-next")?.addEventListener("click", () => {
      kitIndex = (kitIndex + 1) % ideas[kitCategory].items.length;
      renderKit(true);
    });

    $("#flor-kit-copy")?.addEventListener("click", async () => {
      const content = (kitHeading?.textContent || "") + "\n" + (kitDescription?.textContent || "");
      feedback(await copyText(content) ? "Ideia copiada." : "Não foi possível copiar. Você pode selecionar o texto.");
    });

    renderKit();

    // Cartas de conversa copiadas por escolha explícita da pessoa.
    $$(".flor-copy-conversation").forEach(button => button.addEventListener("click", async () => {
      const quote = button.closest(".flor-conversation-card")?.querySelector("blockquote");
      if (!quote) return;
      const copied = await copyText(quote.textContent);
      feedback(copied ? "Mensagem copiada. Pode adaptar do seu jeito." : "Seu navegador não permitiu copiar.");
    }));

    // Carta pessoal: salvar somente quando a pessoa afirma usar seu dispositivo.
    const key = "mente-em-flor:carta-pessoal:v1";
    const letter = $("#flor-letter-text");
    const privateDevice = $("#flor-letter-private");
    const saveButton = $("#flor-letter-save");
    const exportButton = $("#flor-letter-export");
    const clearButton = $("#flor-letter-clear");
    const countLabel = $("#flor-letter-count");
    const statusLabel = $("#flor-letter-status");
    const dateLabel = $("#flor-letter-date");

    if (dateLabel) {
      try {
        dateLabel.textContent = new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit", month: "short", year: "numeric"
        }).format(new Date()).toUpperCase();
      } catch { dateLabel.textContent = "HOJE"; }
    }

    const initialSaved = getSaved(key);
    if (letter && initialSaved !== null) {
      letter.value = initialSaved.slice(0, 2500);
      if (statusLabel) statusLabel.textContent = "Carta recuperada deste navegador. Atenção se o computador é compartilhado.";
    }

    function refreshLetter() {
      if (!letter) return;
      const text = letter.value.trim();
      if (countLabel) countLabel.textContent = letter.value.length + " / 2500";
      if (saveButton) saveButton.disabled = !text || !privateDevice?.checked;
      if (exportButton) exportButton.disabled = !text;
      if (clearButton) clearButton.disabled = !text && getSaved(key) === null;
    }

    privateDevice?.addEventListener("change", refreshLetter);
    letter?.addEventListener("input", () => {
      if (statusLabel) statusLabel.textContent = "Alterações não guardadas.";
      refreshLetter();
    });

    saveButton?.addEventListener("click", () => {
      if (!privateDevice?.checked || !letter?.value.trim()) return;
      if (setSaved(key, letter.value)) {
        if (statusLabel) statusLabel.textContent = "Guardada apenas neste navegador. Outros usuários deste perfil podem ter acesso.";
        feedback("Carta guardada neste navegador.");
      }
      refreshLetter();
    });

    exportButton?.addEventListener("click", () => {
      if (!letter?.value.trim()) return;
      const content = "MENTE EM FLOR / MINHA CARTA\n" + new Date().toLocaleString("pt-BR") + "\n\n" + letter.value;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "minha-carta-mente-em-flor.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      feedback("Seu arquivo de texto foi preparado.");
    });

    clearButton?.addEventListener("click", () => {
      if (!letter || (!letter.value && getSaved(key) === null)) return;
      if (!window.confirm("Apagar a carta da tela e deste navegador? Esta ação não pode ser desfeita.")) return;
      if (getSaved(key) !== null && !deleteSaved(key)) return;
      letter.value = "";
      if (privateDevice) privateDevice.checked = false;
      if (statusLabel) statusLabel.textContent = "Carta apagada. Um novo começo, se quiser.";
      refreshLetter();
      feedback("Carta apagada deste navegador.");
    });

    refreshLetter();
  });
})();
