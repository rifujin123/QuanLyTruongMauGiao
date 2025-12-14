totalsData = [];
tuitionsData = [];
originalTotalsData = [];
originalTuitionsData = [];
thisYear = null;
thisMonth = null;

async function initData() {
  totalsData = await fetchDataUrl(`/api/tuitions/totals`);
  tuitionsData = await fetchDataUrl(`/api/tuitions`);
  // Lưu dữ liệu gốc
  originalTotalsData = [...totalsData];
  originalTuitionsData = [...tuitionsData];
}

async function renderUI() {
  console.log(totalsData);
  console.log(tuitionsData);

  // Chỉ set mặc định nếu chưa được set từ filter
  if (thisYear === null || thisMonth === null) {
    date = new Date();
    thisYear = date.getFullYear();
    thisMonth = date.getMonth() + 1;
  }

  total_students = tuitionsData.length;
  console.log(total_students);
  const paid_students = tuitionsData.filter((x) => x.status === "Paid").length;
  console.log(paid_students);

  document.getElementById(
    "percent"
  ).textContent = `${paid_students}/${total_students}`;

  const totalRevenue = document.getElementById("total-revenue");
  const monthlyCollectedAmmounts = document.getElementById("monthly-collected");
  const monthlyUncollectedAmmouns = document.getElementById(
    "monthly-uncollected"
  );

  if (totalsData && totalsData.length > 0) {
    totalRevenue.textContent = formatNumber(totalsData[0].total_revenue) + " đ";
  } else {
    totalRevenue.textContent = "0 đ";
  }

  const total = totalsData.find(
    (x) => x.month == thisMonth && x.year == thisYear
  );
  console.log("Tìm kiếm:", {
    thisMonth,
    thisYear,
    totalsDataLength: totalsData.length,
  });
  console.log("Kết quả:", total);
  if (!total) {
    console.log("chưa tồn tại dữ liệu cho tháng", thisMonth, "năm", thisYear);
    monthlyCollectedAmmounts.textContent = "0 đ";
    monthlyUncollectedAmmouns.textContent = "0 đ";
  } else {
    monthlyCollectedAmmounts.textContent =
      formatNumber(total.monthly_collected_amounts) + " đ";
    monthlyUncollectedAmmouns.textContent =
      formatNumber(total.monthly_uncollected_amounts) + " đ";
  }
}

function filterAndRender(year, month) {
  year = Number(year);
  month = month ? Number(month) : null;

  totalsData = originalTotalsData.filter((x) => Number(x.year) === year);
  tuitionsData = originalTuitionsData.filter((x) => Number(x.year) === year);

  if (month) {
    tuitionsData = tuitionsData.filter((x) => Number(x.month) === month);
  }

  thisYear = year;
  thisMonth = month || new Date().getMonth() + 1;

  renderUI();
}

function initFilters() {
  const yearSelect = document.getElementById("year-select");
  const monthSelect = document.getElementById("month-select");
  const viewBtn = document.getElementById("view-btn");

  const date = new Date();
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;

  if (yearSelect) yearSelect.value = currentYear;
  if (monthSelect) monthSelect.value = currentMonth;

  function handleFilter() {
    const selectedYear = yearSelect ? parseInt(yearSelect.value) : currentYear;
    const selectedMonth =
      monthSelect && monthSelect.value ? parseInt(monthSelect.value) : null;
    filterAndRender(selectedYear, selectedMonth);
  }

  if (viewBtn) viewBtn.addEventListener("click", handleFilter);
  if (yearSelect) yearSelect.addEventListener("change", handleFilter);
  if (monthSelect) monthSelect.addEventListener("change", handleFilter);
}

// Khởi tạo
async function init() {
  await initData();
  renderUI();
  initFilters();
}
