
function criarCoracao() {
  const heart = document.createElement("div");

  heart.classList.add("heart");
  heart.innerText = "❤";

  heart.style.left = Math.random() * 100 + "vw";
  heart.style.bottom = "0px";

  // voltar cor padrão vermelha
  heart.style.color = "red";

  heart.style.fontSize = Math.random() * 20 + 10 + "px";
  heart.style.animationDuration = Math.random() * 3 + 2 + "s";

  document.body.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, 5000);
}

setInterval(criarCoracao, 300);
