(() => {
    "use strict";

    const onReady = callback => {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    };

    onReady(() => {
        const body = document.body;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const finePointer = window.matchMedia("(pointer: fine)").matches;
        const wideScreen = window.matchMedia("(min-width: 900px)").matches;

        document.querySelectorAll("[data-year]").forEach(node => {
            node.textContent = String(new Date().getFullYear());
        });

        const mentalMeta = document.querySelector('meta[name="mental-project-url"]');
        const mentalUrl = mentalMeta?.content?.trim() || "../mente-em-flor/index.html";

        document.querySelectorAll("[data-mental-project-link]").forEach(link => {
            link.href = mentalUrl;
        });

        const header = document.querySelector("header");
        const nav = document.querySelector("#site-nav");
        const menuToggle = document.querySelector(".menu-toggle");
        const anchorLinks = [...document.querySelectorAll('a[href^="#"]')];

        /* Barra de progresso da página */
        const progressBar = document.createElement("div");
        progressBar.className = "page-progress";
        progressBar.setAttribute("aria-hidden", "true");
        body.appendChild(progressBar);

        let scrollQueued = false;

        const updateScrollUI = () => {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;

            progressBar.style.transform =
                `scaleX(${Math.min(100, Math.max(0, progress)) / 100})`;

            header?.classList.toggle("scrolled", window.scrollY > 24);

            document.documentElement.style.setProperty(
                "--scroll-y",
                `${window.scrollY}px`
            );

            scrollQueued = false;
        };

        const requestScrollUI = () => {
            if (scrollQueued) return;

            scrollQueued = true;
            window.requestAnimationFrame(updateScrollUI);
        };

        updateScrollUI();

        window.addEventListener("scroll", requestScrollUI, { passive: true });
        window.addEventListener("resize", requestScrollUI, { passive: true });

        /* Menu para celular */
        const closeMenu = () => {
            if (!menuToggle || !nav) return;

            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Abrir menu");

            nav.classList.remove("is-open");
            body.classList.remove("menu-open");
        };

        if (menuToggle && nav) {
            menuToggle.addEventListener("click", () => {
                const isOpening =
                    menuToggle.getAttribute("aria-expanded") !== "true";

                menuToggle.setAttribute(
                    "aria-expanded",
                    String(isOpening)
                );

                menuToggle.setAttribute(
                    "aria-label",
                    isOpening ? "Fechar menu" : "Abrir menu"
                );

                nav.classList.toggle("is-open", isOpening);
                body.classList.toggle("menu-open", isOpening);
            });

            nav.querySelectorAll("a").forEach(link => {
                link.addEventListener("click", closeMenu);
            });

            document.addEventListener("click", event => {
                if (
                    !nav.contains(event.target) &&
                    !menuToggle.contains(event.target)
                ) {
                    closeMenu();
                }
            });

            document.addEventListener("keydown", event => {
                if (event.key === "Escape") closeMenu();
            });

            window.addEventListener("resize", () => {
                if (window.innerWidth > 850) closeMenu();
            }, { passive: true });
        }

        /* Navegação suave entre seções */
        anchorLinks.forEach(link => {
            link.addEventListener("click", event => {
                const href = link.getAttribute("href");

                if (!href || href === "#") return;

                const target = document.getElementById(href.slice(1));

                if (!target) return;

                event.preventDefault();

                target.scrollIntoView({
                    behavior: reducedMotion ? "auto" : "smooth",
                    block: "start"
                });

                if (history.replaceState) {
                    history.replaceState(null, "", href);
                }
            });
        });

        /* Elementos aparecem conforme você desce a página */
        const revealSelector = [
            "section:not(.hero) > .section-label",
            "section:not(.hero) > .section-title",
            "section:not(.hero) > .section-description",
            ".about-grid > div",
            ".timeline-item",
            ".julya-photo",
            ".julya-text",
            ".tofu-card",
            ".taste-card",
            ".tech-card",
            ".mental-project-copy > *",
            ".mental-project-art",
            ".mental-feature-row article",
            ".project-card",
            ".gallery-item",
            ".social-card",
            ".quote-section blockquote",
            ".quote-author"
        ].join(",");

        const revealElements = [
            ...document.querySelectorAll(revealSelector)
        ];

        if (reducedMotion || !("IntersectionObserver" in window)) {
            revealElements.forEach(element => {
                element.classList.add("visible");
            });
        } else {
            revealElements.forEach((element, index) => {
                element.classList.add("reveal");

                const siblingIndex = element.parentElement
                    ? [...element.parentElement.children]
                        .filter(child => child.matches(revealSelector))
                        .indexOf(element)
                    : index;

                element.style.setProperty(
                    "--reveal-delay",
                    `${Math.min(Math.max(siblingIndex, 0), 5) * 75}ms`
                );
            });

            const revealObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;

                    entry.target.classList.add("visible");
                    revealObserver.unobserve(entry.target);
                });
            }, {
                threshold: 0.08,
                rootMargin: "0px 0px -45px 0px"
            });

            revealElements.forEach(element => {
                revealObserver.observe(element);
            });
        }

        /* Entrada animada da apresentação principal */
        if (!reducedMotion) {
            [
                ".hero-status",
                ".hero h1",
                ".hero-subtitle",
                ".hero-buttons",
                ".hero-photo"
            ].forEach((selector, index) => {
                const element = document.querySelector(selector);

                if (!element) return;

                element.classList.add("hero-enter");

                element.style.setProperty(
                    "--hero-delay",
                    `${120 + index * 125}ms`
                );

                element.addEventListener("animationend", () => {
                    element.classList.remove("hero-enter");
                }, { once: true });
            });
        }

        /* Destaca automaticamente a seção atual no menu */
        const pageSections = [
            ...document.querySelectorAll("main section[id]")
        ];

        const navLinks = [
            ...document.querySelectorAll("#site-nav a[href^='#']")
        ];

        if ("IntersectionObserver" in window && pageSections.length) {
            const navObserver = new IntersectionObserver(entries => {
                const visible = entries
                    .filter(entry => entry.isIntersecting)
                    .sort(
                        (a, b) => b.intersectionRatio - a.intersectionRatio
                    )[0];

                if (!visible) return;

                navLinks.forEach(link => {
                    const active =
                        link.getAttribute("href") === `#${visible.target.id}`;

                    link.classList.toggle("active", active);

                    if (active) {
                        link.setAttribute("aria-current", "location");
                    } else {
                        link.removeAttribute("aria-current");
                    }
                });
            }, {
                rootMargin: "-22% 0px -58% 0px",
                threshold: [0, 0.1, 0.25, 0.5]
            });

            pageSections.forEach(section => {
                navObserver.observe(section);
            });
        }

        /* Luz roxa que acompanha o mouse */
        if (finePointer && wideScreen && !reducedMotion) {
            const glow = document.createElement("div");

            glow.className = "cursor-glow";
            glow.setAttribute("aria-hidden", "true");

            body.appendChild(glow);

            let frame = 0;

            document.addEventListener("pointermove", event => {
                if (frame) cancelAnimationFrame(frame);

                frame = requestAnimationFrame(() => {
                    glow.style.left = `${event.clientX}px`;
                    glow.style.top = `${event.clientY}px`;

                    glow.classList.add("is-active");
                    frame = 0;
                });
            }, { passive: true });

            document.addEventListener("pointerleave", () => {
                glow.classList.remove("is-active");
            });
        }

        /* Movimento 3D discreto nas imagens principais */
        if (finePointer && wideScreen && !reducedMotion) {
            const tiltItems = [
                document.querySelector(".hero-photo"),
                document.querySelector(".mental-project-art")
            ].filter(Boolean);

            tiltItems.forEach(item => {
                item.classList.add("tilt-enabled");

                item.addEventListener("pointermove", event => {
                    const rect = item.getBoundingClientRect();

                    const x = (event.clientX - rect.left) / rect.width - 0.5;
                    const y = (event.clientY - rect.top) / rect.height - 0.5;

                    item.style.setProperty(
                        "--tilt-x",
                        `${(x * 3.5).toFixed(2)}deg`
                    );

                    item.style.setProperty(
                        "--tilt-y",
                        `${(-y * 3.5).toFixed(2)}deg`
                    );
                }, { passive: true });

                item.addEventListener("pointerleave", () => {
                    item.style.setProperty("--tilt-x", "0deg");
                    item.style.setProperty("--tilt-y", "0deg");
                });
            });
        }

        /* Reflexo acompanha o mouse dentro dos cards */
        if (finePointer && !reducedMotion) {
            document.querySelectorAll(
                ".project-card, .taste-card, .tech-card, " +
                ".social-card, .mental-feature-row article"
            ).forEach(card => {
                card.addEventListener("pointermove", event => {
                    const rect = card.getBoundingClientRect();

                    card.style.setProperty(
                        "--pointer-x",
                        `${event.clientX - rect.left}px`
                    );

                    card.style.setProperty(
                        "--pointer-y",
                        `${event.clientY - rect.top}px`
                    );
                }, { passive: true });
            });
        }

        /* Contador animado de projetos */
        const projectCards = [
            ...document.querySelectorAll(".project-card")
        ];

        const projectCounter = document.querySelector(
            ".project-counter strong"
        );

        if (projectCounter) {
            const total = projectCards.length;

            const renderTotal = () => {
                projectCounter.textContent = String(total).padStart(2, "0");
            };

            if (reducedMotion || !("IntersectionObserver" in window)) {
                renderTotal();
            } else {
                let counted = false;

                const counterObserver = new IntersectionObserver(entries => {
                    if (
                        counted ||
                        !entries.some(entry => entry.isIntersecting)
                    ) {
                        return;
                    }

                    counted = true;
                    counterObserver.disconnect();

                    const startedAt = performance.now();
                    const duration = 900;

                    const animate = now => {
                        const progress = Math.min(
                            (now - startedAt) / duration,
                            1
                        );

                        const eased = 1 - Math.pow(1 - progress, 4);

                        projectCounter.textContent = String(
                            Math.floor(eased * total)
                        ).padStart(2, "0");

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            renderTotal();
                        }
                    };

                    requestAnimationFrame(animate);
                }, { threshold: 0.5 });

                counterObserver.observe(projectCounter);
            }
        }

        /* Galeria com visualização ampliada */
        const galleryItems = [
            ...document.querySelectorAll(".gallery-item")
        ];

        const galleryImages = galleryItems
            .map(item => item.querySelector("img"))
            .filter(Boolean);

        if (galleryImages.length) {
            const lightbox = document.createElement("div");

            lightbox.id = "lightbox";
            lightbox.setAttribute("role", "dialog");
            lightbox.setAttribute("aria-modal", "true");
            lightbox.setAttribute(
                "aria-label",
                "Visualizador da galeria"
            );

            lightbox.innerHTML = `
                <div class="lightbox-background"></div>
                <button class="lightbox-close" type="button"
                    aria-label="Fechar imagem">×</button>
                <button class="lightbox-prev" type="button"
                    aria-label="Imagem anterior">‹</button>
                <img class="lightbox-image" src="" alt="">
                <button class="lightbox-next" type="button"
                    aria-label="Próxima imagem">›</button>
                <div class="lightbox-counter" aria-live="polite"></div>
            `;

            body.appendChild(lightbox);

            const image = lightbox.querySelector(".lightbox-image");
            const closeButton = lightbox.querySelector(".lightbox-close");
            const previousButton = lightbox.querySelector(".lightbox-prev");
            const nextButton = lightbox.querySelector(".lightbox-next");
            const background = lightbox.querySelector(".lightbox-background");
            const counter = lightbox.querySelector(".lightbox-counter");

            let currentIndex = 0;
            let lastTrigger = null;

            const showImage = index => {
                currentIndex =
                    (index + galleryImages.length) % galleryImages.length;

                const selected = galleryImages[currentIndex];

                image.src = selected.currentSrc || selected.src;

                image.alt = selected.alt ||
                    `Imagem ${currentIndex + 1} da galeria`;

                counter.textContent =
                    `${String(currentIndex + 1).padStart(2, "0")} / ` +
                    `${String(galleryImages.length).padStart(2, "0")}`;
            };

            const openLightbox = index => {
                lastTrigger = document.activeElement;

                showImage(index);

                lightbox.style.display = "flex";
                body.classList.add("lightbox-open");
                body.style.overflow = "hidden";

                requestAnimationFrame(() => {
                    lightbox.classList.add("open");
                });

                closeButton.focus({ preventScroll: true });
            };

            const closeLightbox = () => {
                lightbox.classList.remove("open");
                body.classList.remove("lightbox-open");
                body.style.overflow = "";

                window.setTimeout(() => {
                    lightbox.style.display = "none";
                }, reducedMotion ? 0 : 240);

                if (lastTrigger instanceof HTMLElement) {
                    lastTrigger.focus({ preventScroll: true });
                }
            };

            galleryItems.forEach((item, index) => {
                item.setAttribute("tabindex", "0");
                item.setAttribute("role", "button");

                item.setAttribute(
                    "aria-label",
                    `Abrir imagem ${index + 1} da galeria`
                );

                item.addEventListener("click", () => {
                    openLightbox(index);
                });

                item.addEventListener("keydown", event => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openLightbox(index);
                    }
                });
            });

            previousButton.addEventListener("click", () => {
                showImage(currentIndex - 1);
            });

            nextButton.addEventListener("click", () => {
                showImage(currentIndex + 1);
            });

            closeButton.addEventListener("click", closeLightbox);
            background.addEventListener("click", closeLightbox);

            document.addEventListener("keydown", event => {
                if (lightbox.style.display !== "flex") return;

                if (event.key === "Escape") {
                    closeLightbox();
                }

                if (event.key === "ArrowLeft") {
                    showImage(currentIndex - 1);
                }

                if (event.key === "ArrowRight") {
                    showImage(currentIndex + 1);
                }

                if (event.key === "Tab") {
                    event.preventDefault();
                    closeButton.focus();
                }
            });
        }

        /* Botão para voltar ao topo */
        const backToTop = document.createElement("button");

        backToTop.className = "back-to-top";
        backToTop.type = "button";
        backToTop.setAttribute("aria-label", "Voltar ao topo");
        backToTop.innerHTML = '<span aria-hidden="true">↑</span>';

        body.appendChild(backToTop);

        const toggleBackToTop = () => {
            backToTop.classList.toggle(
                "is-visible",
                window.scrollY > 550
            );
        };

        toggleBackToTop();

        window.addEventListener("scroll", toggleBackToTop, {
            passive: true
        });

        backToTop.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: reducedMotion ? "auto" : "smooth"
            });
        });

        /* Pequeno detalhe na aba quando você sai dela */
        const originalTitle = document.title;

        document.addEventListener("visibilitychange", () => {
            document.title = document.hidden
                ? "volta aí 👀 — Luiz"
                : originalTitle;
        });

        /* Tratamento de imagens que não carregam */
        document.querySelectorAll("img").forEach(img => {
            img.addEventListener("error", () => {
                img.classList.add("image-unavailable");
            }, { once: true });

            if (img.complete && img.naturalWidth === 0) {
                img.classList.add("image-unavailable");
            }
        });
    });
})();

/* =====================================================================
   XQRENS / PUNPUN EDITION - MÓDULOS DE EXPERIÊNCIA
   Sem dependências de build, carregamento progressivo e navegação acessível.
   ===================================================================== */
(() => {
    "use strict";

    const ready = callback => {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    };

    ready(() => {
        const select = (query, context = document) => context.querySelector(query);
        const selectAll = (query, context = document) => [...context.querySelectorAll(query)];
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const storage = {
            get(key) {
                try { return localStorage.getItem(key); }
                catch { return null; }
            },
            set(key, value) {
                try { localStorage.setItem(key, value); return true; }
                catch { return false; }
            },
            remove(key) {
                try { localStorage.removeItem(key); return true; }
                catch { return false; }
            }
        };

        const notify = (() => {
            const element = select("#ink-toast");
            let hideHandle;
            return message => {
                if (!element) return;
                element.textContent = message;
                element.classList.add("is-visible");
                clearTimeout(hideHandle);
                hideHandle = setTimeout(() => element.classList.remove("is-visible"), 2600);
            };
        })();

        /* -------------------------------------------------------------
           Paleta salva no dispositivo, com estados sincronizados.
           ------------------------------------------------------------- */
        const paletteKey = "xqrens:palette";
        const validPalettes = new Set(["paper", "night", "plum"]);
        const paintPalette = value => {
            const palette = validPalettes.has(value) ? value : "paper";
            document.body.dataset.inkPalette = palette;
            selectAll("[data-ink-palette].ink-palette").forEach(button => {
                const selected = button.dataset.inkPalette === palette;
                button.classList.toggle("is-selected", selected);
                button.setAttribute("aria-pressed", String(selected));
            });
            const themeMeta = select('meta[name="theme-color"]');
            if (themeMeta) {
                themeMeta.content = {
                    paper: "#e8e3d9",
                    night: "#101011",
                    plum: "#211b27"
                }[palette];
            }
            return palette;
        };
        paintPalette(storage.get(paletteKey) || "paper");
        selectAll(".ink-palette").forEach(button => {
            button.addEventListener("click", () => {
                const value = paintPalette(button.dataset.inkPalette);
                storage.set(paletteKey, value);
                notify("Atmosfera alterada para " + value + ".");
            });
        });

        /* -------------------------------------------------------------
           Progresso de leitura sincronizado com a página inteira.
           ------------------------------------------------------------- */
        const progress = select(".ink-reading-progress > span");
        let progressPending = false;
        const updateProgress = () => {
            const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
            if (progress) progress.style.width = Math.min(100, Math.max(0, scrollY / max * 100)) + "%";
            progressPending = false;
        };
        const queueProgress = () => {
            if (progressPending) return;
            progressPending = true;
            requestAnimationFrame(updateProgress);
        };
        updateProgress();
        addEventListener("scroll", queueProgress, { passive: true });
        addEventListener("resize", queueProgress, { passive: true });

        /* -------------------------------------------------------------
           Entradas editoriais suaves, sem bloquear quem reduz animação.
           ------------------------------------------------------------- */
        const animated = selectAll([
            ".ink-section-title",
            ".ink-chapter-item",
            ".ink-book",
            ".ink-note",
            ".ink-lab-card",
            ".ink-love-text",
            ".ink-diary-paper",
            ".ink-intermission-inner"
        ].join(","));
        if (!reduceMotion && "IntersectionObserver" in window) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-in");
                    observer.unobserve(entry.target);
                });
            }, { threshold: .08, rootMargin: "0px 0px -24px 0px" });

            animated.forEach((element, index) => {
                element.classList.add("ink-animated");
                if (element.closest("[data-ink-stagger]")) {
                    element.style.transitionDelay = Math.min(index % 4, 3) * 55 + "ms";
                }
                observer.observe(element);
            });
        }

        /* -------------------------------------------------------------
           Gerador de frases autorais curtas, com seleção não repetida.
           ------------------------------------------------------------- */
        const thoughts = [
            "Toda história muda um pouco quando você vira a página.",
            "A página em branco também pode ser um começo.",
            "Tem dias em que o silêncio parece uma conversa.",
            "Nem tudo que importa cabe numa tela.",
            "Uma ideia pequena também merece existir.",
            "O mundo é estranho, mas ainda tem coisas bonitas nele.",
            "Aprender significa errar sem fazer disso um fim.",
            "Fazer um site é tentar colocar alguma coisa pra fora.",
            "Algumas memórias ficam nas entrelinhas.",
            "Um lugar na internet também pode ter personalidade.",
            "Nem todo capítulo precisa terminar com uma resposta.",
            "Às vezes a melhor ideia chega depois do erro.",
            "Pequenos detalhes mudam uma história inteira.",
            "Há coisas que valem mais que números na tela.",
            "Criar é deixar um rastro do que a gente sente.",
            "O futuro é um projeto que ninguém terminou.",
            "Uma linha de código pode virar uma lembrança.",
            "Toda tentativa ensina um detalhe novo.",
            "Não preciso saber tudo para começar.",
            "A beleza também mora nas coisas incompletas."
        ];
        const oracleText = select("#ink-oracle-text");
        let oracleIndex = -1;
        select("#ink-oracle-button")?.addEventListener("click", () => {
            let next = Math.floor(Math.random() * thoughts.length);
            if (next === oracleIndex) next = (next + 1) % thoughts.length;
            oracleIndex = next;
            if (oracleText) {
                oracleText.textContent = thoughts[next];
                if (!reduceMotion && oracleText.animate) {
                    oracleText.animate([
                        { opacity: .3, transform: "translateY(9px)" },
                        { opacity: 1, transform: "translateY(0)" }
                    ], { duration: 460, easing: "ease-out" });
                }
            }
        });

        /* -------------------------------------------------------------
           Mensagens pequenas, sem prometer respostas para a vida.
           ------------------------------------------------------------- */
        const letters = [
            "Ainda dá tempo de fazer uma coisa bonita hoje.",
            "Você não precisa transformar todo dia em produtividade.",
            "Uma conversa sincera pode melhorar uma tarde.",
            "As melhores páginas às vezes começam com um erro.",
            "O descanso também faz parte do caminho.",
            "Guarde uma lembrança boa de hoje.",
            "Seu próximo projeto pode começar com um rabisco.",
            "Um pouco de calma entre uma tarefa e outra.",
            "Nem tudo precisa ser resolvido neste instante.",
            "Pequenos recomeços merecem espaço."
        ];
        let lastLetter = -1;
        select("#ink-letter-button")?.addEventListener("click", () => {
            let current = Math.floor(Math.random() * letters.length);
            if (current === lastLetter) current = (current + 1) % letters.length;
            lastLetter = current;
            const preview = select("#ink-letter-preview");
            if (preview) preview.textContent = letters[current];
        });

        /* -------------------------------------------------------------
           Partículas decorativas limitadas e removidas automaticamente.
           ------------------------------------------------------------- */
        const sky = select("#ink-particle-sky");
        select("#ink-particles-button")?.addEventListener("click", () => {
            if (!sky) return;
            if (reduceMotion) {
                notify("Animação reduzida está ativada neste dispositivo.");
                return;
            }
            sky.replaceChildren();
            const symbols = ["✳", "·", "✦", "✧", "⋆"];
            for (let i = 0; i < 38; i++) {
                const dot = document.createElement("span");
                dot.className = "ink-spark";
                dot.textContent = symbols[i % symbols.length];
                dot.style.left = (5 + Math.random() * 90) + "%";
                dot.style.top = (20 + Math.random() * 65) + "%";
                dot.style.setProperty("--dx", (Math.random() * 130 - 65) + "px");
                dot.style.setProperty("--dy", (-40 - Math.random() * 90) + "px");
                dot.style.setProperty("--spark-size", (8 + Math.random() * 19) + "px");
                dot.style.animationDelay = (Math.random() * .6) + "s";
                dot.addEventListener("animationend", () => dot.remove(), { once: true });
                sky.appendChild(dot);
            }
        });

        /* -------------------------------------------------------------
           Diário local. Nunca faz upload das notas para um servidor.
           ------------------------------------------------------------- */
        const diary = select("#ink-diary-input");
        const count = select("#ink-diary-count");
        const dateElement = select("#ink-diary-date");
        const status = select("#ink-diary-status");
        const diaryKey = "xqrens:diario:v1";
        if (dateElement) {
            dateElement.textContent = new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit", month: "long", year: "numeric"
            }).format(new Date()).toUpperCase();
        }
        const updateCount = () => {
            if (count && diary) count.textContent = diary.value.length + " / 4000";
        };
        if (diary) {
            diary.value = storage.get(diaryKey) || "";
            updateCount();
            let saveHandle;
            diary.addEventListener("input", () => {
                updateCount();
                if (status) status.textContent = "Escrevendo...";
                clearTimeout(saveHandle);
                saveHandle = setTimeout(() => {
                    const saved = storage.set(diaryKey, diary.value);
                    if (status) status.textContent = saved
                        ? "Salvo neste navegador."
                        : "Armazenamento indisponível. Exporte sua nota para não perdê-la.";
                }, 450);
            });
        }
        select("#ink-diary-export")?.addEventListener("click", () => {
            if (!diary?.value.trim()) {
                notify("Escreva uma nota primeiro.");
                return;
            }
            const header = "Meu diário / XQRENS\n" + new Date().toLocaleString("pt-BR") + "\n\n";
            const blob = new Blob([header, diary.value], { type: "text/plain;charset=utf-8" });
            const objectUrl = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = "meu-diario-xqrens.txt";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            notify("Arquivo de texto preparado.");
        });
        select("#ink-diary-clear")?.addEventListener("click", () => {
            if (!diary) return;
            if (!diary.value) return;
            if (!window.confirm("Deseja apagar a nota deste navegador?")) return;
            diary.value = "";
            storage.remove(diaryKey);
            updateCount();
            if (status) status.textContent = "Nota apagada.";
            notify("A nota foi apagada.");
        });

        /* -------------------------------------------------------------
           Navegação rápida com busca local, acessível por teclado.
           ------------------------------------------------------------- */
        const chapters = [
            ["01", "Sobre mim", "sobre"],
            ["02", "Trajetória", "trajetoria"],
            ["03", "Julya, minha namorada", "julya"],
            ["04", "Tofu", "tofu"],
            ["05", "Gostos", "gostos"],
            ["06", "Leituras", "leituras"],
            ["07", "Tecnologias", "tecnologias"],
            ["08", "Laboratório", "laboratorio"],
            ["09", "Projetos", "projetos"],
            ["10", "Diário", "diario"],
            ["11", "Mente em Flor", "saude-mental"],
            ["12", "Contato", "contato"],
            ["13", "Evolução GitHub", "evolucao"],
            ["14", "Julya.exe e cartas", "julya-exe"],
            ["15", "Tofu World", "tofu-world"],
            ["16", "Sala de Música", "sala-musica"],
            ["17", "Laboratório SENAI", "senai-lab"],
            ["18", "Mangateca 2.0", "mangateca"],
            ["19", "Segredos", "segredos"],
            ["20", "Fragmentos", "fragmentos"]
        ];
        const modal = select("#ink-command-backdrop");
        const commandSearch = select("#ink-command-search");
        const resultBox = select("#ink-command-results");
        let previousFocus = null;
        const closeCommand = () => {
            if (!modal) return;
            modal.hidden = true;
            document.body.style.removeProperty("overflow");
            previousFocus?.focus?.();
        };
        const goToChapter = id => {
            closeCommand();
            select("#" + id)?.scrollIntoView({
                behavior: reduceMotion ? "instant" : "smooth",
                block: "start"
            });
            history.replaceState(null, "", "#" + id);
        };
        const renderResults = query => {
            if (!resultBox) return;
            const normalized = query.toLocaleLowerCase("pt-BR").trim();
            const matches = chapters.filter(item =>
                item[1].toLocaleLowerCase("pt-BR").includes(normalized) ||
                item[0].includes(normalized)
            );
            resultBox.replaceChildren();
            matches.forEach(([number, label, id]) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "ink-command-result";
                const title = document.createElement("span");
                title.textContent = label;
                const count = document.createElement("small");
                count.textContent = number + " ↗";
                button.append(title, count);
                button.addEventListener("click", () => goToChapter(id));
                resultBox.appendChild(button);
            });
            if (!matches.length) {
                const empty = document.createElement("p");
                empty.textContent = "Nenhum capítulo encontrado.";
                resultBox.appendChild(empty);
            }
        };
        const openCommand = () => {
            if (!modal) return;
            previousFocus = document.activeElement;
            modal.hidden = false;
            document.body.style.overflow = "hidden";
            if (commandSearch) commandSearch.value = "";
            renderResults("");
            commandSearch?.focus();
        };
        select("#ink-command-launch")?.addEventListener("click", openCommand);
        select("#ink-command-close")?.addEventListener("click", closeCommand);
        commandSearch?.addEventListener("input", () => renderResults(commandSearch.value));
        commandSearch?.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;
            const first = select(".ink-command-result", resultBox);
            if (first) first.click();
        });
        modal?.addEventListener("click", event => {
            if (event.target === modal) closeCommand();
        });
        document.addEventListener("keydown", event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                if (modal?.hidden) openCommand();
                else closeCommand();
            }
            if (event.key === "Escape" && modal && !modal.hidden) {
                event.preventDefault();
                closeCommand();
            }
            if (event.key === "Tab" && modal && !modal.hidden) {
                const controls = selectAll("button, input, [href]", modal).filter(node => !node.disabled);
                if (!controls.length) return;
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });

        /* -------------------------------------------------------------
           Check de recursos: sem remapear rotas nem remover projetos.
           ------------------------------------------------------------- */
        selectAll(".ink-book, .ink-note").forEach(card => {
            card.addEventListener("pointermove", event => {
                if (reduceMotion || event.pointerType !== "mouse") return;
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--ink-x", ((event.clientX - rect.left) / rect.width * 100) + "%");
                card.style.setProperty("--ink-y", ((event.clientY - rect.top) / rect.height * 100) + "%");
            }, { passive: true });
        });

        /* O navegador pode suspender abas; mantém o progresso correto. */
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) queueProgress();
        });
    });
})();
