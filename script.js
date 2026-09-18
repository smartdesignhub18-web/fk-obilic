const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");

menuButton.addEventListener("click", () => {
    navigation.classList.toggle("open");
});

document.querySelectorAll(".navigation a").forEach(link => {
    link.addEventListener("click", () => {
        navigation.classList.remove("open");
    });
});