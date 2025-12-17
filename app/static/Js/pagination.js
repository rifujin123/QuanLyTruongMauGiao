// Hàm khởi tạo paginator dùng chung
function createPaginator({ paginationId, prevId, nextId, onPageChange }) {
  const pagination = document.getElementById(paginationId);
  if (!pagination) return null;

  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  if (!prevBtn || !nextBtn) return null;

  let currentPage = 1;
  let totalPages = 1;

  // Hàm vẽ lại các nút phân trang
  function renderPagination() {
    const pageItems = pagination.querySelectorAll(
      `.page-item:not(#${prevId}):not(#${nextId})`
    );
    pageItems.forEach((item) => item.remove());

    let paginationHTML = "";
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
      if (startPage > 2) {
        paginationHTML += `<li class="page-item disabled"><a class="page-link" href="#">...</a></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? "active" : "";
      paginationHTML += `<li class="page-item ${activeClass}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<li class="page-item disabled"><a class="page-link" href="#">...</a></li>`;
      }
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }

    nextBtn.insertAdjacentHTML("beforebegin", paginationHTML);

    prevBtn.classList.toggle("disabled", currentPage === 1);
    nextBtn.classList.toggle("disabled", currentPage === totalPages);
  }

  // Hàm chuyển tới 1 trang cụ thể
  function goTo(page) {
    const target = Math.min(Math.max(1, page), totalPages);
    currentPage = target;
    onPageChange?.(currentPage);
    renderPagination();
  }

  // Hàm xử lý click trên thanh phân trang
  function handleClick(e) {
    const link = e.target.closest(".page-link");
    if (!link || link.classList.contains("disabled")) return;
    e.preventDefault();
    const page = link.dataset.page;
    if (page === "prev") {
      goTo(currentPage - 1);
    } else if (page === "next") {
      goTo(currentPage + 1);
    } else if (!isNaN(page)) {
      goTo(Number(page));
    }
  }

  if (pagination.dataset.listenerAttached !== "true") {
    pagination.addEventListener("click", handleClick);
    pagination.dataset.listenerAttached = "true";
  }

  return {
    // Hàm cập nhật tổng số trang
    setTotalPages(n) {
      totalPages = Math.max(1, n || 1);
      if (currentPage > totalPages) currentPage = totalPages;
      renderPagination();
    },
    goTo,
    // Hàm trả về trang hiện tại
    getCurrentPage() {
      return currentPage;
    },
  };
}
