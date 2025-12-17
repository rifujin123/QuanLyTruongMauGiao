const healthPerPage = 10;
let healthCurrentPage = 1;
let healthTotalPages = 1;
let healthRows = [];
let healthFilteredRows = [];
let healthPaginator = null;
let healthSelectedClass = "all";
let healthSearch = "";

//Declare Input field
const weightInput = document.getElementById("weight");
const heightInput = document.getElementById("height");
const temperatureInput = document.getElementById("temperature");
const noteInput = document.getElementById("note");

function renderHealthPage() {
  const start = (healthCurrentPage - 1) * healthPerPage;
  const end = start + healthPerPage;

  // Ẩn tất cả trước
  healthRows.forEach((row) => (row.style.display = "none"));

  healthFilteredRows.forEach((row, idx) => {
    row.style.display = idx >= start && idx < end ? "" : "none";
  });
}

function initHealthPagination() {
  const tbody = document.getElementById("health_list");
  if (!tbody) return;

  healthRows = Array.from(tbody.querySelectorAll("tr"));
  healthFilteredRows = [...healthRows];
  healthTotalPages = Math.max(1, Math.ceil(healthRows.length / healthPerPage));

  healthPaginator = createPaginator({
    paginationId: "pagination-health",
    prevId: "prevBtnHealth",
    nextId: "nextBtnHealth",
    onPageChange: (page) => {
      healthCurrentPage = page;
      renderHealthPage();
    },
  });

  if (healthPaginator) {
    healthPaginator.setTotalPages(healthTotalPages);
    healthPaginator.goTo(1);
  }

  // Filter lớp
  initDropdownFilter({
    containerSelector: "#classFilterHealth",
    dataAttr: "class",
    defaultValue: "all",
    onChange: (val) => {
      healthSelectedClass = val;
      applyHealthFilters();
    },
  });

  // Tìm kiếm
  initSearchInput({
    formSelector: "#healthSearchForm",
    inputSelector: "#healthSearchInput",
    onSearch: (val) => {
      healthSearch = val.toLowerCase();
      applyHealthFilters();
    },
  });
}

function applyHealthFilters() {
  healthFilteredRows = healthRows.filter((row) => {
    const classId = row.dataset.classId;
    const name = (row.dataset.studentName || "").toLowerCase();
    const matchClass =
      healthSelectedClass === "all" ||
      (classId && String(classId) === String(healthSelectedClass));
    const matchSearch = !healthSearch || name.includes(healthSearch);
    return matchClass && matchSearch;
  });

  healthTotalPages = Math.max(
    1,
    Math.ceil(healthFilteredRows.length / healthPerPage)
  );
  if (healthPaginator) {
    healthPaginator.setTotalPages(healthTotalPages);
    healthPaginator.goTo(1);
  } else {
    renderHealthPage();
  }
}

// Chờ DOM sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHealthPagination);
} else {
  initHealthPagination();
}
document.addEventListener("DOMContentLoaded", () => {
  loadAllLatestRecords();
});
setInterval(() => {
  loadAllLatestRecords();
}, 60000);

function initDropdownFilter({
  containerSelector,
  itemSelector = ".dropdown-item",
  dataAttr = "class",
  defaultValue = "all",
  onChange,
  toggleSelector,
  activeClass = "active",
}) {
  const container = document.querySelector(containerSelector);
  const toggleBtn = toggleSelector
    ? document.querySelector(toggleSelector)
    : null;

  if (!container) return { setValue: () => {}, getValue: () => defaultValue };

  let current = defaultValue;

  container.querySelectorAll(itemSelector).forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const value = this.dataset[dataAttr];
      current = value ?? defaultValue;

      // cập nhật nhãn nút toggle nếu có
      if (toggleBtn) {
        toggleBtn.textContent = this.textContent.trim();
      }

      // cập nhật trạng thái active
      if (activeClass) {
        container.querySelectorAll(itemSelector).forEach((el) => {
          el.classList.toggle(activeClass, el === this);
        });
      }

      onChange?.(current);
    });
  });

  const api = {
    setValue(val) {
      current = val ?? defaultValue;
      onChange?.(current);

      // đồng bộ nhãn toggle theo item khớp
      if (toggleBtn) {
        const matched = Array.from(
          container.querySelectorAll(itemSelector)
        ).find((el) => el.dataset[dataAttr] === current);
        if (matched) {
          toggleBtn.textContent = matched.textContent.trim();
        }
      }
    },
    getValue() {
      return current;
    },
  };

  // khởi tạo nhãn toggle mặc định
  api.setValue(defaultValue);

  return api;
}

// Khởi tạo input tìm kiếm (copy từ filters.js, dùng riêng cho trang này)
function initSearchInput({ formSelector, inputSelector, onSearch }) {
  const form = document.querySelector(formSelector);
  const input = document.querySelector(inputSelector);
  if (!form || !input) return { setValue: () => {} };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    onSearch?.(input.value.trim());
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch?.(input.value.trim());
    }
  });

  return {
    setValue(val) {
      input.value = val ?? "";
    },
    getValue() {
      return input.value.trim();
    },
  };
}

//Xử healthModal
async function createHealthRecord(studentID) {
  if (!studentID) {
    studentID = document.getElementById("student-id")?.value;
  }
  if (!studentID) return;

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("healthRecordModal")
  );
  const weight = weightInput.value;
  const height = heightInput.value;
  const temperature = temperatureInput.value;
  const note = noteInput.value;

  const payload = {
    weight: Number(weight),
    height: Number(height),
    temperature: Number(temperature),
    note: note || null,
  };

  const res = await fetch(`/api/health/${studentID}/health-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("created: ", data);

  if (!res.ok) {
    alert("Ghi nhận thất bại");
  } else {
    closeHealthModal();
    document.getElementById(
      `latest-record-${studentID}`
    ).innerHTML = `<small class="text-muted">${data.data.time_ago}</small>`;
    // Cập nhật badge trạng thái sau khi tạo health record mới
    updateStatusBadge(studentID, Number(temperature));
  }
}

function closeHealthModal() {
  const modalEl = document.getElementById("healthRecordModal");
  console.log(modalEl);
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
}

async function openHealthModal(button) {
  if (!button) return;
  const studentID = button.dataset.studentId;
  const studentName = button.dataset.studentName;

  document.getElementById("student-id").value = studentID;
  document.getElementById("student-name").value = studentName;

  resetHealthForm();

  //load current record
  await fetchHealthRecord(studentID);
}

function resetHealthForm() {
  weightInput.value = "";
  heightInput.value = "";
  temperatureInput.value = "";
  noteInput.value = "";
}

function isToday(dateStr) {
  const recordDate = new Date(dateStr);
  const today = new Date();

  return (
    recordDate.getFullYear() === today.getFullYear() &&
    recordDate.getMonth() === today.getMonth() &&
    recordDate.getDate() === today.getDate()
  );
}

//Load dữ liệu từ api lên giao diện
async function fetchHealthRecord(studentID) {
  const res = await fetch(`/api/health/${studentID}`);
  const data = await res.json();

  if (!res.ok) {
    console.error("GET error: ", data);
    alert("Ko tải được dữ liệu");
    return;
  }

  const latest = get_latest_record(data);
  if (!latest) {
    console.log("Ko có bản ghi nào");
    return;
  }

  if (!isToday(latest.date_created)) {
    return;
  }

  document.getElementById("weight").value = latest.weight;
  document.getElementById("height").value = latest.height;
  document.getElementById("temperature").value = latest.temperature;
  document.getElementById("note").value = latest.note ?? "";
  console.log(latest.date_created);
}

function get_latest_record(records) {
  if (!records || records.length === 0) return null;
  return records.at(-1);
}

function updateStatusBadge(studentID, temperature) {
  const statusElement = document.getElementById(`status-${studentID}`);
  if (!statusElement) return;

  // Nếu không có dữ liệu, không hiển thị badge
  if (temperature === null || temperature === undefined) {
    statusElement.innerHTML = "";
    return;
  }

  // Chỉ hiển thị badge khi có dữ liệu
  if (temperature > 37.5) {
    statusElement.innerHTML = `
      <span class="badge bg-danger-subtle text-danger">
        <i class="fas fa-exclamation-triangle me-1"></i>Sốt
      </span>
    `;
  } else {
    statusElement.innerHTML = `
      <span class="badge bg-success-subtle text-success">
        <i class="fas fa-check-circle me-1"></i>Bình thường
      </span>
    `;
  }
}

async function loadAllLatestRecords() {
  const rows = document.querySelectorAll("#health_list tr");
  rows.forEach(async (row) => {
    const studentID = row.querySelector("button")?.dataset.studentId;
    if (!studentID) return;

    const res = await fetch(`/api/health/${studentID}`);
    const data = await res.json();

    const latest = get_latest_record(data);
    if (!latest) {
      updateStatusBadge(studentID, null);
      return;
    }

    document.getElementById(
      `latest-record-${studentID}`
    ).innerHTML = `<small class="text-muted">${latest.time_ago}</small>`;
    updateStatusBadge(studentID, latest.temperature);
  });
}
