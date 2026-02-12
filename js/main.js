document.addEventListener("DOMContentLoaded", () => {

  const page = document.querySelector(".page");
  page.classList.add("reveal");

  const card = document.querySelector(".card");

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    card.style.transform =
      `translateY(${scrollY * 0.05}px)`;
  });

});
