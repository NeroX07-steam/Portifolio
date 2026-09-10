document.addEventListener("DOMContentLoaded", function () {

    iniciarPagina();
    animarAoRolar();
    efeitoCursor();
    atualizarAno();

});


function iniciarPagina() {

    const elementos = document.querySelectorAll(
        ".hero-label, .hero h1, .hero-text, .hero-buttons, .hero-info, .hero-photo"
    );

    elementos.forEach(function (elemento, index) {

        elemento.style.opacity = "0";
        elemento.style.transform = "translateY(25px)";

        setTimeout(function () {

            elemento.style.transition =
                "opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)";

            elemento.style.opacity = "1";
            elemento.style.transform = "translateY(0)";

        }, 150 + index * 130);

    });

}


function animarAoRolar() {

    const elementos = document.querySelectorAll(
        ".section-top, .about-text, .about-box, .special-content, .tofu-image, .tofu-text, .tech-card, .quote-section, .project"
    );


    const observador = new IntersectionObserver(
        function (entradas) {

            entradas.forEach(function (entrada) {

                if (entrada.isIntersecting) {

                    entrada.target.classList.add("apareceu");

                    observador.unobserve(entrada.target);

                }

            });

        },
        {
            threshold: 0.12
        }
    );


    elementos.forEach(function (elemento, index) {

        elemento.style.opacity = "0";
        elemento.style.transform = "translateY(35px)";

        elemento.style.transition =
            "opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)";

        elemento.style.transitionDelay =
            Math.min(index * 0.04, 0.25) + "s";

        observador.observe(elemento);

    });


    const estilo = document.createElement("style");

    estilo.textContent = `

        .apareceu {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }

    `;

    document.head.appendChild(estilo);

}


function efeitoCursor() {

    const cursor = document.querySelector(".cursor-glow");

    if (!cursor) {
        return;
    }


    if (window.innerWidth <= 700) {

        cursor.style.display = "none";

        return;

    }


    window.addEventListener("mousemove", function (evento) {

        cursor.style.left = evento.clientX + "px";
        cursor.style.top = evento.clientY + "px";

    });

}


function atualizarAno() {

    const ano = new Date().getFullYear();

    const elemento =
        document.querySelector(".footer-year");

    if (elemento) {

        elemento.textContent =
            "© " + ano;

    }

}


/* SCROLL SUAVE */

const links =
    document.querySelectorAll('a[href^="#"]');


links.forEach(function (link) {

    link.addEventListener("click", function (evento) {

        const destino =
            link.getAttribute("href");


        if (destino === "#") {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            evento.preventDefault();

            return;

        }


        const elemento =
            document.querySelector(destino);


        if (elemento) {

            evento.preventDefault();

            elemento.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    });

});


/* HEADER AO ROLAR */

window.addEventListener("scroll", function () {

    const header =
        document.querySelector(".header");


    if (!header) {
        return;
    }


    if (window.scrollY > 40) {

        header.style.background =
            "rgba(7, 7, 7, 0.95)";

        header.style.borderBottomColor =
            "#292929";

    } else {

        header.style.background =
            "rgba(7, 7, 7, 0.82)";

        header.style.borderBottomColor =
            "#181818";

    }

});