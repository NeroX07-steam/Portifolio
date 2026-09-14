document.addEventListener("DOMContentLoaded", () => {

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;


    /* =========================
       ANO
    ========================= */

    const year = new Date().getFullYear();

    document.querySelectorAll("[data-year]").forEach(element => {
        element.textContent = year;
    });


    /* =========================
       HEADER
    ========================= */

    const header = document.querySelector("header");

    function updateHeader() {
        if (!header) return;

        header.classList.toggle(
            "scrolled",
            window.scrollY > 30
        );
    }

    updateHeader();

    window.addEventListener(
        "scroll",
        updateHeader,
        { passive: true }
    );


    /* =========================
       REVEAL
    ========================= */

    const revealElements = document.querySelectorAll(
        "section:not(.hero) > .section-label, " +
        "section:not(.hero) > .section-title, " +
        "section:not(.hero) > .section-description, " +
        ".timeline-item, " +
        ".julya-photo, " +
        ".julya-text, " +
        ".tofu-card, " +
        ".taste-card, " +
        ".tech-card, " +
        ".project-card, " +
        ".gallery-item, " +
        ".social-card"
    );

    if (reducedMotion) {

        revealElements.forEach(element => {
            element.classList.add("visible");
        });

    } else {

        revealElements.forEach(element => {
            element.classList.add("reveal");
        });

        const observer = new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (!entry.isIntersecting) return;

                    entry.target.classList.add("visible");

                    observer.unobserve(entry.target);
                });

            },
            {
                threshold: 0.08,
                rootMargin: "0px 0px -35px 0px"
            }
        );

        revealElements.forEach(element => {
            observer.observe(element);
        });
    }


    /* =========================
       HERO
    ========================= */

    if (!reducedMotion) {

        const heroElements = document.querySelectorAll(
            ".hero-status, .hero h1, .hero-subtitle, .hero-buttons, .hero-photo"
        );

        heroElements.forEach((element, index) => {

            element.style.opacity = "0";
            element.style.transform = "translateY(25px)";

            setTimeout(() => {

                element.style.transition =
                    "opacity .8s ease, transform .8s ease";

                element.style.opacity = "1";
                element.style.transform = "translateY(0)";

            }, 120 + index * 120);
        });
    }


    /* =========================
       NAV ATIVA
    ========================= */

    const sections = document.querySelectorAll(
        "main section[id]"
    );

    const links = document.querySelectorAll(
        "header nav a"
    );

    function updateActiveLink() {

        let current = "";

        sections.forEach(section => {

            const top =
                section.getBoundingClientRect().top;

            if (top <= 170) {
                current = section.id;
            }
        });

        links.forEach(link => {

            link.classList.toggle(
                "active",
                link.getAttribute("href") === `#${current}`
            );
        });
    }

    updateActiveLink();

    window.addEventListener(
        "scroll",
        updateActiveLink,
        { passive: true }
    );


    /* =========================
       SCROLL SUAVE
    ========================= */

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach(link => {

        link.addEventListener("click", event => {

            const id =
                link.getAttribute("href");

            const target =
                document.querySelector(id);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: reducedMotion
                    ? "auto"
                    : "smooth"
            });
        });
    });


    /* =========================
       CURSOR GLOW
    ========================= */

    if (
        !reducedMotion &&
        window.innerWidth > 850
    ) {

        const glow = document.createElement("div");

        glow.className = "cursor-glow";

        document.body.appendChild(glow);

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;

        let x = mouseX;
        let y = mouseY;

        document.addEventListener(
            "mousemove",
            event => {
                mouseX = event.clientX;
                mouseY = event.clientY;
            }
        );

        function moveGlow() {

            x += (mouseX - x) * .08;
            y += (mouseY - y) * .08;

            glow.style.left = `${x}px`;
            glow.style.top = `${y}px`;

            requestAnimationFrame(moveGlow);
        }

        moveGlow();
    }


    /* =========================
       PARALLAX HERO
    ========================= */

    const heroPhoto =
        document.querySelector(".hero-photo");

    if (
        heroPhoto &&
        !reducedMotion &&
        window.innerWidth > 900
    ) {

        window.addEventListener(
            "scroll",
            () => {

                if (window.scrollY > window.innerHeight) {
                    return;
                }

                heroPhoto.style.transform =
                    `translateY(${window.scrollY * .07}px)`;
            },
            { passive: true }
        );
    }


    /* =========================
       CONTADOR DE PROJETOS
    ========================= */

    const projectCards =
        document.querySelectorAll(".project-card");

    const counter =
        document.querySelector(".project-counter strong");

    if (counter) {

        const total = projectCards.length;

        if (reducedMotion) {

            counter.textContent =
                String(total).padStart(2, "0");

        } else {

            let start = null;

            function count(time) {

                if (!start) {
                    start = time;
                }

                const progress =
                    Math.min(
                        (time - start) / 900,
                        1
                    );

                const eased =
                    1 - Math.pow(1 - progress, 3);

                const value =
                    Math.floor(eased * total);

                counter.textContent =
                    String(value).padStart(2, "0");

                if (progress < 1) {
                    requestAnimationFrame(count);
                }
            }

            requestAnimationFrame(count);
        }
    }


    /* =========================
       GALERIA
    ========================= */

    const galleryImages =
        document.querySelectorAll(
            ".gallery-item img"
        );

    if (galleryImages.length) {

        const lightbox =
            document.createElement("div");

        lightbox.id = "lightbox";

        lightbox.style.position = "fixed";
        lightbox.style.inset = "0";
        lightbox.style.zIndex = "9999";
        lightbox.style.display = "none";
        lightbox.style.alignItems = "center";
        lightbox.style.justifyContent = "center";

        lightbox.innerHTML = `
            <div class="lightbox-background"></div>

            <button class="lightbox-close" aria-label="Fechar">
                ×
            </button>

            <button class="lightbox-prev" aria-label="Anterior">
                ‹
            </button>

            <img class="lightbox-image" src="" alt="">

            <button class="lightbox-next" aria-label="Próxima">
                ›
            </button>

            <div class="lightbox-counter"></div>
        `;

        document.body.appendChild(lightbox);

        const image =
            lightbox.querySelector(".lightbox-image");

        const close =
            lightbox.querySelector(".lightbox-close");

        const previous =
            lightbox.querySelector(".lightbox-prev");

        const next =
            lightbox.querySelector(".lightbox-next");

        const background =
            lightbox.querySelector(".lightbox-background");

        const counter =
            lightbox.querySelector(".lightbox-counter");

        let current = 0;

        function show(index) {

            if (index < 0) {
                index = galleryImages.length - 1;
            }

            if (index >= galleryImages.length) {
                index = 0;
            }

            current = index;

            const selected =
                galleryImages[current];

            image.src = selected.src;
            image.alt =
                selected.alt || "Imagem";

            counter.textContent =
                `${current + 1} / ${galleryImages.length}`;
        }

        function open(index) {

            show(index);

            lightbox.style.display = "flex";

            document.body.style.overflow = "hidden";

            requestAnimationFrame(() => {
                lightbox.classList.add("open");
            });
        }

        function closeBox() {

            lightbox.classList.remove("open");

            setTimeout(() => {
                lightbox.style.display = "none";
            }, 220);

            document.body.style.overflow = "";
        }

        galleryImages.forEach(
            (galleryImage, index) => {

                const item =
                    galleryImage.closest(".gallery-item");

                item.addEventListener(
                    "click",
                    () => open(index)
                );
            }
        );

        previous.addEventListener(
            "click",
            event => {
                event.stopPropagation();
                show(current - 1);
            }
        );

        next.addEventListener(
            "click",
            event => {
                event.stopPropagation();
                show(current + 1);
            }
        );

        close.addEventListener(
            "click",
            closeBox
        );

        background.addEventListener(
            "click",
            closeBox
        );

        document.addEventListener(
            "keydown",
            event => {

                if (lightbox.style.display !== "flex") {
                    return;
                }

                if (event.key === "Escape") {
                    closeBox();
                }

                if (event.key === "ArrowLeft") {
                    show(current - 1);
                }

                if (event.key === "ArrowRight") {
                    show(current + 1);
                }
            }
        );
    }


    /* =========================
       TÍTULO DA ABA
    ========================= */

    const originalTitle =
        document.title;

    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.hidden) {
                document.title =
                    "volta aí 👀 — Luiz";
            } else {
                document.title =
                    originalTitle;
            }
        }
    );

});
