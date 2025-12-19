totalsData = [];
tuitionsData = [];
originalTotalsData = [];
originalTuitionsData = [];
thisYear = null;
thisMonth = null;
let revenueChart = null; // Chart doanh thu theo tháng

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

  // Render / cập nhật biểu đồ doanh thu theo tháng
  const ctxEl = document.getElementById("revenueChart");
  if (ctxEl) {
    const ctx = ctxEl.getContext("2d");

    const labels = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];

    // Lấy dữ liệu doanh thu theo tháng cho năm hiện tại (đơn vị: triệu đồng)
    const monthlyData = [];
    for (let m = 1; m <= 12; m++) {
      const rec = totalsData.find(
        (x) => Number(x.month) === m && Number(x.year) === Number(thisYear)
      );
      const value = rec ? Number(rec.monthly_collected_amounts || 0) : 0;
      monthlyData.push(value / 1_000_000); // chuyển sang triệu đồng
    }

    const chartData = {
      labels,
      datasets: [
        {
          label: "Doanh thu (triệu đồng)",
          data: monthlyData,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
        },
      ],
    };

    const config = {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };

    if (revenueChart) {
      revenueChart.data = chartData;
      revenueChart.update();
    } else {
      revenueChart = new Chart(ctx, config);
    }
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
