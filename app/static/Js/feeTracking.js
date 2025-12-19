let studentId = null;
let parentId = null;
let tuitions = [];
let baseFeeValue = 0,
  mealFeeValue = 0,
  extraFeeValue = 0,
  totalFeeValue = 0;

// DOM elements
const total_fee = document.getElementById("total-fee");
const base_fee = document.getElementById("base-fee");
const meal_fee = document.getElementById("meal-fee");
const extra_fee = document.getElementById("extra-fee");

function getMonthInput() {
  const input = document.getElementById("monthSelector");
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

function queryTuitionFeeByMonthYear(month, year) {
  if (!tuitions || tuitions.length === 0) {
    return [];
  }

  let filterTuitions = [];
  tuitions.forEach((tuition) => {
    if (
      Number(tuition.month) === Number(month) &&
      Number(tuition.year) === Number(year)
    ) {
      filterTuitions.push(tuition);
    }
  });
  return filterTuitions;
}

async function loadTuitionItemsTable(tuitionId) {
  try {
    const data = await fetchDataUrl(`/api/tuitions/${tuitionId}/items`);

    const items = data.items;
    const tbody = document.querySelector("#tuition-items-tbody");

    tbody.innerHTML = "";
    items.forEach((item) => {
      const statusClass =
        item.status === "Paid" ? "text-bg-success" : "text-bg-warning";
      const statusText = item.status === "Paid" ? "Đã thu" : "Chưa thu";
      const btnText = item.status === "Paid" ? "Xem biên lai" : "Thanh toán";
      const btnClass =
        item.status === "Paid" ? "btn-outline-secondary" : "btn-primary";

      const row = `
        <tr>
          <td>${item.label}</td>
          <td class="text-end">${formatNumber(item.amount)} đ</td>
          <td class="text-center">
            <span class="badge ${statusClass}">${statusText}</span>
          </td>
          <td class="text-end">05/12/2025</td>
          <td class="text-end">
            <a href="#" class="btn btn-sm ${btnClass}"
               onclick="handleItemAction(${tuitionId}, '${item.type}', '${
        item.status
      }')">
              ${btnText}
            </a>
          </td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error loading tuition items:", error);
  }
}

async function loadStudentOptions() {
  const select = document.getElementById("studentSelector");
  const nameLabel = document.getElementById("student-name-label");
  if (!select) return;

  const students = await fetchDataUrl(`/api/parent/students`);
  if (!students || !Array.isArray(students) || students.length === 0) {
    console.warn("No students for current parent");
    // default nếu chưa có học sinh
    select.innerHTML = '<option value="">Chưa có học sinh</option>';
    if (nameLabel) {
      nameLabel.textContent = "Chưa có học sinh";
    }
    // Hiển thị giá trị mặc định cho các khoản phí
    if (total_fee) total_fee.textContent = "0 đ";
    if (base_fee) base_fee.textContent = "0 đ";
    if (meal_fee) meal_fee.textContent = "0 đ";
    if (extra_fee) extra_fee.textContent = "0 đ";
    // Ẩn nút thanh toán
    const payNowBtn = document.getElementById("pay-now-btn");
    const viewReceiptBtn = document.getElementById("view-receipt-btn");
    if (payNowBtn) payNowBtn.style.display = "none";
    if (viewReceiptBtn) viewReceiptBtn.style.display = "none";
    return;
  }

  select.innerHTML = "";

  students.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.classroom?.name
      ? `${s.name} - ${s.classroom.name}`
      : s.name;
    select.appendChild(opt);
  });

  studentId = students[0].id;
  select.value = String(studentId);

  if (nameLabel) {
    nameLabel.textContent = select.options[select.selectedIndex].textContent;
  }
}

function getSelectedMonthYear() {
  const { year, month } = getMonthInput();
  return [Number(month), Number(year)];
}

async function main() {
  try {
    const allTuitions = await fetchDataUrl(`/api/tuitions`);
    if (!allTuitions) {
      console.error("Failed to fetch tuitions");
      return;
    }

    tuitions = allTuitions.filter(
      (t) => t.student && String(t.student.id) === String(studentId)
    );
    console.log("Tuitions for student:", tuitions);

    const [month, year] = getSelectedMonthYear();
    let latestTuitionArray = queryTuitionFeeByMonthYear(month, year);

    let defaultTuitionData = {
      total_fee: 0,
      extra_fee: 0,
      fee_base: 0,
      meal_fee: 0,
      status: "Unpaid",
    };

    let latestTuition = null;
    if (latestTuitionArray && latestTuitionArray.length > 0) {
      latestTuition = latestTuitionArray[0];

      if (latestTuition.id) {
        await loadTuitionItemsTable(latestTuition.id);

        const payNowBtn = document.getElementById("pay-now-btn");
        const viewReceiptBtn = document.getElementById("view-receipt-btn");
        if (payNowBtn && viewReceiptBtn) {
          payNowBtn.style.display = "";
          viewReceiptBtn.style.display = "";
          if (latestTuition.status === "Paid") {
            payNowBtn.classList.add("d-none");
            viewReceiptBtn.classList.remove("d-none");
            // Khi đã thu dẫn tới trang biên lai
            viewReceiptBtn.onclick = () => {
              window.location.href = `/payment/${latestTuition.id}/receipt`;
            };
          } else {
            payNowBtn.classList.remove("d-none");
            payNowBtn.href = `/payment/${latestTuition.id}`;
            viewReceiptBtn.classList.add("d-none");
            // Khi chưa thu, không cho xem biên lai
            viewReceiptBtn.onclick = null;
          }
        }
      }
    } else {
      // ko có học phí thì mặc định chỉ hiện thanh toán
      const payNowBtn = document.getElementById("pay-now-btn");
      const viewReceiptBtn = document.getElementById("view-receipt-btn");
      if (payNowBtn && viewReceiptBtn) {
        payNowBtn.classList.remove("d-none");
        payNowBtn.style.display = "";
        payNowBtn.href = "#";
        payNowBtn.onclick = (e) => {
          e.preventDefault();
          alert("Chưa có học phí để thanh toán");
        };
        viewReceiptBtn.classList.add("d-none");
        viewReceiptBtn.style.display = "none";
        viewReceiptBtn.onclick = null;
      }
      // Hiển thị thông báo không có dữ liệu trong bảng
      const tbody = document.querySelector("#tuition-items-tbody");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="text-center text-muted">Chưa có dữ liệu học phí cho tháng này</td></tr>';
      }
    }

    if (!latestTuition) {
      console.log("Chưa có dữ liệu cho tháng hiện tại");
      latestTuition = defaultTuitionData;
    } else {
      if (!latestTuition.total_fee) {
        latestTuition.total_fee =
          latestTuition.fee_base +
          latestTuition.meal_fee +
          latestTuition.extra_fee;
      }
    }

    console.log("Latest tuition:", latestTuition);

    if (total_fee) {
      total_fee.textContent = formatNumber(latestTuition.total_fee || 0) + " đ";
    }
    if (base_fee) {
      base_fee.textContent = formatNumber(latestTuition.fee_base || 0) + " đ";
    }
    if (meal_fee) {
      meal_fee.textContent = formatNumber(latestTuition.meal_fee || 0) + " đ";
    }
    if (extra_fee) {
      extra_fee.textContent = formatNumber(latestTuition.extra_fee || 0) + " đ";
    }
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

function handleItemAction(tuitionId, itemType, status) {
  console.log("Handle action:", tuitionId, itemType, status);
  if (status === "Paid") {
    window.location.href = `/payment/${tuitionId}/receipt`;
  } else {
    window.location.href = `/payment/${tuitionId}`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  getMonthInput();

  // load danh sách, đầu tiên
  await loadStudentOptions();
  if (studentId != null) {
    await main();
  } else {
    // Nếu không có học sinh, hiển thị giá trị mặc định
    const tbody = document.querySelector("#tuition-items-tbody");
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted">Chưa có dữ liệu học phí</td></tr>';
    }
  }

  const select = document.getElementById("studentSelector");
  const nameLabel = document.getElementById("student-name-label");
  if (select) {
    select.addEventListener("change", async () => {
      studentId = select.value;
      if (!studentId) {
        // Nếu không chọn học sinh, hiển thị giá trị mặc định
        if (nameLabel) {
          nameLabel.textContent = "Chưa có học sinh";
        }
        if (total_fee) total_fee.textContent = "0 đ";
        if (base_fee) base_fee.textContent = "0 đ";
        if (meal_fee) meal_fee.textContent = "0 đ";
        if (extra_fee) extra_fee.textContent = "0 đ";
        const tbody = document.querySelector("#tuition-items-tbody");
        if (tbody) {
          tbody.innerHTML =
            '<tr><td colspan="5" class="text-center text-muted">Chưa có dữ liệu học phí</td></tr>';
        }
        return;
      }
      if (nameLabel) {
        nameLabel.textContent =
          select.options[select.selectedIndex].textContent;
      }
      await main();
    });
  }

  const filterBtn = document.getElementById("filter-btn");
  if (filterBtn) {
    filterBtn.addEventListener("click", async () => {
      if (studentId) {
        await main();
      }
    });
  }
});
