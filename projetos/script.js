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