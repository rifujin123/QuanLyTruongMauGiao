const container = document.querySelector(".container");
const registerBtn = document.querySelector(".register-btn");
const loginBtn = document.querySelector(".login-btn");

// Khởi tạo theo tham số URL: ?mode=register hoặc hash #register
document.addEventListener("DOMContentLoaded", () => {
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") || window.location.hash.replace("#", "");
  if (mode && mode.toLowerCase() === "register") {
    container.classList.add("active");
  } else if (mode && mode.toLowerCase() === "login") {
    container.classList.remove("active");
  }
});

if (registerBtn) {
  registerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.add("active");
  });
}

if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.remove("active");
  });
}
