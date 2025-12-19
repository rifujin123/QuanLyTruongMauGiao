console.log("js loaded");
ITEMS_PER_PAGE = 10;
let totalsData = [];
let tuitionsFee = [];
let currentTuitions = [];
let filteredTuitions = [];
let classrooms = [];
let paginator = null;

const monthly_total_revenue = document.getElementById("monthly-total-revenue");
const monthly_collected_ammounts = document.getElementById(
  "monthly-collected-ammounts"
);
const monthly_uncollected_ammounts = document.getElementById(
  "monthly-uncollected-ammounts"
);

async function initData() {
  totalsData = await fetchDataUrl(`/api/tuitions/totals`);
  tuitionsFee = await fetchDataUrl(`/api/tuitions`);
  classrooms = await fetchDataUrl(`/api/classrooms`);
}

function renderTuitionsTable(tuitions, page = 1) {
  const tbody = document.querySelector(".tuition-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!tuitions || tuitions.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center text-muted">Không có dữ liệu</td></tr>';
    if (paginator) {
      paginator.setTotalPages(1);
      paginator.setPageWithoutCallback(1);
    }
    return;
  }

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTuitions = tuitions.slice(startIndex, endIndex);

  if (paginator) {
    const totalPages = Math.ceil(tuitions.length / ITEMS_PER_PAGE);
    paginator.setTotalPages(totalPages);
    paginator.setPageWithoutCallback(page);
  }

  for (let tuition of paginatedTuitions) {
    const row = document.createElement("tr");

    let statusClass = "text-bg-secondary";
    if (tuition.status === "Paid") {
      statusClass = "text-bg-success";
    } else {
      statusClass = "text-bg-danger";
    }

    row.innerHTML = `
            <td>${tuition.student.name}</td>
              <td>${
                tuition.classroom ? tuition.classroom.name : "Chưa phân lớp"
              }</td>
              <td class="text-end" >${formatNumber(tuition.fee_base)}</td>
              <td class="text-end" >${formatNumber(tuition.meal_fee)}</td>
              <td class="text-end" >${formatNumber(tuition.extra_fee)}</td>
              <td class="text-end fw-semibold" id="total-fee">${formatNumber(
                tuition.fee_base + tuition.meal_fee + tuition.extra_fee
              )}</td>
              <td class="text-center">
                <span class="badge ${statusClass}" id="payment-status"
                  >${tuition.status === "Paid" ? "Đã thu" : "Chưa thu"}</span
                >
              </td>
              <td class="text-end">${tuition.due_date || ""}</td>
        `;
    tbody.appendChild(row);
  }
}

function getMonthInput() {
  const input = document.getElementById("month-input");
  let value = input.value;

  if (!value) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    value = `${year}-${month}`;
    input.value = value;
  }
  const [year, month] = value.split("-");
  return { year, month };
}

function updateStatistics(ym) {
  const total = totalsData.find(
    (item) => item.month === Number(ym.month) && item.year === Number(ym.year)
  );

  if (total) {
    monthly_total_revenue.textContent = formatNumber(total.monthly_revenue);
    monthly_collected_ammounts.textContent = formatNumber(
      total.monthly_collected_amounts
    );
    monthly_uncollected_ammounts.textContent = formatNumber(
      total.monthly_uncollected_amounts
    );
  } else {
    monthly_total_revenue.textContent = "0";
    monthly_collected_ammounts.textContent = "0";
    monthly_uncollected_ammounts.textContent = "0";
  }
}

function ClassFilter() {
  const classFilter = document.getElementById("class-filter");
  if (!classFilter) return;

  while (classFilter.children.length > 1) {
    classFilter.removeChild(classFilter.lastChild);
  }

  classrooms.forEach((classroom) => {
    const option = document.createElement("option");
    option.value = classroom.id;
    option.textContent = classroom.name;
    classFilter.appendChild(option);
  });
}

function applyFilters(page = 1) {
  const selectedClass = document.getElementById("class-filter")?.value;
  const activeStatusBtn = document.querySelector(".btn-group .btn.active");
  const status = activeStatusBtn?.dataset.status || "all";

  if (currentTuitions) {
    filteredTuitions = currentTuitions.slice();
  } else {
    filteredTuitions = [];
  }

  // Filter theo lớp
  if (selectedClass && selectedClass !== "all") {
    filteredTuitions = filteredTuitions.filter(
      (t) => t.classroom && t.classroom.id === Number(selectedClass)
    );
  }

  // Filter theo trạng thái
  if (status === "Paid") {
    filteredTuitions = filteredTuitions.filter((t) => t.status === "Paid");
  } else if (status === "Unpaid") {
    filteredTuitions = filteredTuitions.filter((t) => t.status === "Unpaid");
  }

  renderTuitionsTable(filteredTuitions, page);
}

function btnFilter() {
  const allBtn = document.getElementById("all-btn");
  const paidBtn = document.getElementById("paid-btn");
  const unpaidBtn = document.getElementById("unpaid-btn");
  let buttons = [];
  buttons.push(allBtn, paidBtn, unpaidBtn);

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters(1);
    });
  });

  const classFilter = document.getElementById("class-filter");
  if (classFilter) {
    classFilter.addEventListener("change", () => {
      applyFilters(1);
    });
  }
}

async function renderUI() {
  await initData();

  const ym = getMonthInput();

  updateStatistics(ym);

  currentTuitions = tuitionsFee.filter(
    (t) =>
      Number(t.year) === Number(ym.year) && Number(t.month) === Number(ym.month)
  );

  ClassFilter();
  btnFilter();

  // Khởi tạo pagination
  paginator = createPaginator({
    paginationId: "tuition-pagination",
    prevId: "tuition-prev",
    nextId: "tuition-next",
    onPageChange: (page) => {
      applyFilters(page);
    },
  });

  applyFilters(1);

  const allBtn = document.getElementById("all-btn");
  if (allBtn) {
    allBtn.classList.add("active");
    document.getElementById("paid-btn")?.classList.remove("active");
    document.getElementById("unpaid-btn")?.classList.remove("active");
  }

  const monthBtn = document.getElementById("month-btn");
  if (monthBtn) {
    monthBtn.addEventListener("click", () => {
      const selectedYm = getMonthInput();
      if (!selectedYm) return;

      // Cập nhật theo tháng đang chọn
      updateStatistics(selectedYm);
      currentTuitions = tuitionsFee.filter(
        (t) =>
          Number(t.year) === Number(selectedYm.year) &&
          Number(t.month) === Number(selectedYm.month)
      );
      applyFilters(1); // Reset về trang 1
    });
  }

  // test
  const generateBtn = document.getElementById("generate-tuition-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      const { year, month } = getMonthInput();
      try {
        const res = await fetch("/api/tuitions/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: Number(year),
            month: Number(month),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "Tạo học phí thất bại");
          return;
        }

        alert(
          `Đã tạo ${data.created} học phí cho tháng ${data.month}/${data.year}`
        );

        // reload dữ liệu + UI
        await initData();
        const ymAfter = getMonthInput();
        updateStatistics(ymAfter);
        currentTuitions = tuitionsFee.filter(
          (t) =>
            Number(t.year) === Number(ymAfter.year) &&
            Number(t.month) === Number(ymAfter.month)
        );
        ClassFilter();
        applyFilters(1); // Reset về trang 1
      } catch (err) {
        console.error(err);
        alert(err.message || "Có lỗi khi gọi API tạo học phí");
      }
    });
  }
}
