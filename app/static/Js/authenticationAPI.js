// Xử lý form đăng nhập và đăng ký
document.addEventListener("DOMContentLoaded", function () {
  // Form đăng nhập
  const loginForm = document.querySelector(".form-box.login form");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = loginForm.querySelector('input[name="email"]')?.value;
      const password = loginForm.querySelector('input[name="password"]')?.value;

      if (!email || !password) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
      }

      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          alert(data.message || "Đăng nhập thành công");
          // Redirect hoặc xử lý sau khi đăng nhập thành công
          window.location.href = "/";
        } else {
          alert(data.error || "Đăng nhập thất bại");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Có lỗi xảy ra khi đăng nhập");
      }
    });
  }

  // Form đăng ký
  const registerForm = document.querySelector(".form-box.register form");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const phone = registerForm.querySelector('input[name="phone"]')?.value;
      const email = registerForm.querySelector('input[name="email"]')?.value;
      const password = registerForm.querySelector(
        'input[name="password"]'
      )?.value;
      const confirmPassword = registerForm.querySelector(
        'input[name="confirmPassword"]'
      )?.value;

      if (!phone || !email || !password || !confirmPassword) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
      }

      if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp");
        return;
      }

      try {
        const response = await fetch("/signup?mode=register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone,
            email: email,
            password: password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          alert(data.message || "Đăng ký thành công");
          // Chuyển về form đăng nhập sau khi đăng ký thành công
          document.querySelector(".container").classList.remove("active");
          // Cập nhật URL với mode=login
          const url = new URL(window.location);
          url.searchParams.set("mode", "login");
          window.history.pushState({}, "", url);
        } else {
          alert(data.error || "Đăng ký thất bại");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Có lỗi xảy ra khi đăng ký");
      }
    });
  }
});
