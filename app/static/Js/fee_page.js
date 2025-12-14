console.log("js loaded");
ITEMS_PER_PAGE = 10;
let totalsData = [];
let tuitionsFee = [];
let currentTuitions = [];

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
}

function renderTuitionsTable(tuitions) {
  const tbody = document.querySelector(".tuition-body");
  tbody.innerHTML = "";

  for (let tuition of tuitions) {
    const row = document.createElement("tr");

    let statusClass = "text-bg-secondary";
    if (tuition.status === "Paid") {
      statusClass = "text-bg-success";
    } else {
      statusClass = "text-bg-danger";
    }

    row.innerHTML = `
            <td>${tuition.student.name}</td>
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
              <td class="text-end">05/12/2025</td>
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

      let filteredTuitions = currentTuitions;

      if (btn.dataset.status === "Paid") {
        filteredTuitions = currentTuitions.filter((t) => t.status === "Paid");
      } else if (btn.dataset.status === "Unpaid") {
        filteredTuitions = currentTuitions.filter((t) => t.status === "Unpaid");
      }

      renderTuitionsTable(filteredTuitions);
    });
  });
}

async function renderUI() {
  await initData();

  const ym = getMonthInput();

  updateStatistics(ym);

  currentTuitions = tuitionsFee;

  btnFilter();

  renderTuitionsTable(currentTuitions);

  const allBtn = document.getElementById("all-btn");
  if (allBtn) {
    allBtn.classList.add("active");
    document.getElementById("paid-btn")?.classList.remove("active");
    document.getElementById("unpaid-btn")?.classList.remove("active");
  }

  document.getElementById("month-btn").addEventListener("click", () => {
    const selectedYm = getMonthInput();
    if (!selectedYm) return;

    updateStatistics(selectedYm);
  });
}
