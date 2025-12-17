// Sidebar active state handler
(function () {
  function setActiveSidebarItem() {
    // Lấy URL hiện tại
    const currentPath = window.location.pathname;
    const allNavLinks = document.querySelectorAll(".sidebar .nav-link");

    // Xóa tất cả class active
    allNavLinks.forEach((link) => {
      link.classList.remove("active");
    });

    // Tìm link phù hợp với URL hiện tại và thêm class active
    allNavLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (
        href &&
        (currentPath === href || currentPath.startsWith(href + "/"))
      ) {
        link.classList.add("active");
      }
    });

    // Nếu đang ở trang gốc "/", active Dashboard
    if (currentPath === "/" || currentPath === "/dashboard") {
      const dashboardLink = document.querySelector(
        '.sidebar .nav-link[href="/"]'
      );
      if (dashboardLink) {
        dashboardLink.classList.add("active");
      }
    }
  }

  // Chạy khi DOM ready
  document.addEventListener("DOMContentLoaded", function () {
    setActiveSidebarItem();

    // Thêm event listener cho mỗi link trong sidebar
    const sidebarLinks = document.querySelectorAll(".sidebar .nav-link");
    sidebarLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        // Xóa active của tất cả links
        sidebarLinks.forEach((l) => l.classList.remove("active"));
        // Thêm active cho link vừa click
        this.classList.add("active");
      });
    });
  });

  // Cập nhật lại khi navigate (nếu dùng SPA routing hoặc sau khi load trang mới)
  window.addEventListener("popstate", setActiveSidebarItem);
})();
