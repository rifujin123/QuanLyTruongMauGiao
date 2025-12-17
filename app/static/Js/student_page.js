const studentsPerPage = 10;
let currentPage = 1;
let data = [];
let totalPages = 1;
let selectedClass = "all";
let searchTerm = "";
let studentPaginator = null;
let editModal = null;
let parentOptions = [];

// Helper function để xóa backdrop và reset body styles
function removeModalBackdrop() {
  const backdrop = document.querySelector(".modal-backdrop");
  if (backdrop) backdrop.remove();
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}

// Tải danh sách học sinh từ API theo bộ lọc tìm kiếm/lớp và cập nhật bảng + phân trang
async function fetchStudents() {
  const student_list = document.getElementById("student_list");
  if (!student_list) return;

  // Hiển thị loading
  student_list.innerHTML =
    '<tr><td colspan="8" class="text-center"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div> Đang tải dữ liệu...</td></tr>';

  try {
    // Lấy query parameter từ URL nếu có
    let apiUrl = `/api/students?`;
    if (searchTerm) apiUrl += `q=${encodeURIComponent(searchTerm)}&`;
    if (selectedClass !== "all") apiUrl += `class_id=${selectedClass}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch students");
    }

    data = await response.json();
    buildParentOptions();
    currentPage = 1;
    totalPages = Math.ceil(data.length / studentsPerPage);

    if (data.length === 0) {
      student_list.innerHTML =
        '<tr><td colspan="8" class="text-center text-muted">Không có dữ liệu học sinh</td></tr>';
      if (studentPaginator) studentPaginator.setTotalPages(1);
      return;
    }

    totalPages = Math.max(1, totalPages);
    if (studentPaginator) {
      studentPaginator.setTotalPages(totalPages);
      studentPaginator.goTo(1);
    } else {
      RenderStudentList();
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    student_list.innerHTML =
      '<tr><td colspan="8" class="text-center text-danger">Lỗi khi tải dữ liệu học sinh. Vui lòng thử lại sau.</td></tr>';
  }
}

// Render bảng học sinh cho trang hiện tại dựa trên dữ liệu đã tải
function RenderStudentList() {
  const student_list = document.getElementById("student_list");
  if (!student_list || !data.length) return;

  student_list.innerHTML = "";

  let start = (currentPage - 1) * studentsPerPage;
  let end = start + studentsPerPage;

  data.slice(start, end).forEach((student) => {
    const row = `
      <tr>
        <td>${student.id}</td>
        <td>${student.name}</td>
        <td>${student.dob || student.formatted_dob}</td>
        <td>${student.gender?.value || student.gender}</td>
        <td>${student.classroom?.name || "Chưa phân lớp"}</td>
        <td>${student.parent?.name}</td>
        <td>${student.parent?.phone}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm" role="group">
            <button
              class="btn btn-outline-primary"
              data-id="${student.id}"
              data-action="edit"
              aria-label="Chỉnh sửa học sinh ${student.name}"
            >
              Chỉnh sửa
            </button>
            <button
              class="btn btn-outline-danger"
              data-id="${student.id}"
              data-action="delete"
              aria-label="Xóa học sinh ${student.name}"
            >
              Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
    student_list.innerHTML += row;
  });
}

// Tải danh sách toàn bộ phụ huynh từ API users (roles chứa 'Parent')
function buildParentOptions() {
  fetch("/api/users/")
    .then((res) => res.json())
    .then((users) => {
      const parents = Array.isArray(users)
        ? users.filter((u) =>
            Array.isArray(u.roles)
              ? u.roles.includes("Parent")
              : String(u.roles || "").includes("Parent")
          )
        : [];

      parentOptions = parents.map((p) => ({
        id: p.id,
        name: p.name || "",
        phone: p.phone || "",
      }));

      // Cập nhật dropdown phụ huynh nếu có
      populateParentSelect(
        document.getElementById("editParentSelect"),
        document.getElementById("editParentSearch")?.value || "",
        document.getElementById("editStudentParentId")?.value || ""
      );
      populateParentSelect(
        document.getElementById("createParentSelect"),
        document.getElementById("createParentSearch")?.value || "",
        document.getElementById("createStudentParentId")?.value || ""
      );
    })
    .catch((err) => {
      console.error("Failed to load parent options:", err);
    });
}

// Render options cho dropdown phụ huynh theo term tìm kiếm và id đang chọn
function populateParentSelect(selectEl, filterTerm = "", selectedId = "") {
  if (!selectEl) return;
  const term = (filterTerm || "").toLowerCase();

  selectEl.innerHTML = '<option value="">-- Không gán phụ huynh --</option>';
  parentOptions
    .filter((p) => {
      if (!term) return true;
      const label = `${p.name || ""} ${p.phone || ""}`.toLowerCase();
      return label.includes(term);
    })
    .forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name || "Không tên"} - ${p.phone || "Không số"}`;
      if (selectedId && String(p.id) === String(selectedId)) {
        opt.selected = true;
      }
      selectEl.appendChild(opt);
    });
}

// Mở modal và đổ dữ liệu học sinh
function openEditModal(student) {
  if (!student) return;
  document.getElementById("editStudentId").value = student.id || "";
  document.getElementById("editStudentName").value = student.name || "";
  document.getElementById("editStudentDob").value =
    student.dob || student.formatted_dob || "";
  document.getElementById("editStudentGender").value =
    student.gender?.value || student.gender || "";
  document.getElementById("editStudentClassSelect").value =
    student.class_id || student.classroom?.id || "";

  const parentId = student.parent?.id || "";
  // cập nhật dropdown + hidden parent id
  document.getElementById("editStudentParentId").value = parentId || "";
  const editSearchEl = document.getElementById("editParentSearch");
  const editSelectEl = document.getElementById("editParentSelect");
  if (editSelectEl) {
    populateParentSelect(
      editSelectEl,
      editSearchEl?.value || "",
      parentId || ""
    );
  }
  document.getElementById("editStudentError").textContent = "";

  if (!editModal) {
    const modalEl = document.getElementById("editStudentModal");
    if (!modalEl) return;
    editModal = new bootstrap.Modal(modalEl);
  }
  editModal.show();
}

// Lưu chỉnh sửa qua API PATCH
async function saveStudent() {
  const studentId = document.getElementById("editStudentId")?.value;
  if (!studentId) return;

  const name = document.getElementById("editStudentName")?.value.trim();
  const dob = document.getElementById("editStudentDob")?.value.trim();
  const gender = document.getElementById("editStudentGender")?.value;
  const classId = document.getElementById("editStudentClassSelect")?.value;
  const parentId = document.getElementById("editStudentParentId")?.value;
  const errorEl = document.getElementById("editStudentError");
  if (errorEl) errorEl.textContent = "";

  let payload = {
    name,
    dob,
    gender,
    class_id: classId ? Number(classId) : null,
    parent_id: parentId ? Number(parentId) : null,
  };

  // Xóa các field không có giá trị
  Object.keys(payload).forEach(
    (key) => payload[key] == null && delete payload[key]
  );

  try {
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMessage = data.message || "Cập nhật thất bại";
      if (errorEl) {
        errorEl.textContent = errorMessage;
      }

      // Hiển thị alert
      if (errorMessage === "Lớp đã đầy") {
        alert("Lớp đã đầy");
      } else {
        alert("Lỗi cập nhật: " + errorMessage);
      }
      return;
    }

    if (editModal) editModal.hide();
    fetchStudents();
  } catch (err) {
    console.error(err);
    if (errorEl) errorEl.textContent = err.message || "Có lỗi xảy ra";
    else alert("Có lỗi xảy ra");
  }
}

function init() {
  // đọc q từ URL nếu có
  const urlParams = new URLSearchParams(window.location.search);
  searchTerm = (urlParams.get("q") || "").trim();

  if (typeof createPaginator === "function") {
    studentPaginator = createPaginator({
      paginationId: "pagination",
      prevId: "prevBtn",
      nextId: "nextBtn",
      onPageChange: (page) => {
        currentPage = page;
        RenderStudentList();
      },
    });
  }

  // dropdown filter lớp dùng chung
  if (typeof initDropdownFilter === "function") {
    const df = initDropdownFilter({
      containerSelector: "#classFilter",
      dataAttr: "class",
      defaultValue: "all",
      toggleSelector: "#classFilterToggle",
      onChange: (val) => {
        selectedClass = val;
        fetchStudents();
      },
    });
    // đồng bộ nút toggle với giá trị mặc định
    df.setValue(selectedClass);
  }

  // tìm kiếm dùng chung
  if (typeof initSearchInput === "function") {
    initSearchInput({
      formSelector: "#studentSearchForm",
      inputSelector: "#studentSearchInput",
      onSearch: (val) => {
        searchTerm = val;
        fetchStudents();
      },
    }).setValue(searchTerm);
  }

  fetchStudents();

  // Ủy quyền sự kiện click nút chỉnh sửa
  const student_list = document.getElementById("student_list");
  if (student_list) {
    student_list.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const action = btn.dataset.action || "edit";
      if (action === "delete") {
        deleteStudent(id);
      } else {
        const student = data.find((s) => String(s.id) === String(id));
        openEditModal(student);
      }
    });
  }

  // Sự kiện lưu trong modal
  const saveBtn = document.getElementById("saveStudentBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveStudent);
  }

  // Tìm kiếm + dropdown phụ huynh (modal chỉnh sửa)
  const editParentSearch = document.getElementById("editParentSearch");
  const editParentSelect = document.getElementById("editParentSelect");
  const editParentIdHidden = document.getElementById("editStudentParentId");
  if (editParentSearch && editParentSelect && editParentIdHidden) {
    editParentSearch.addEventListener("input", () => {
      populateParentSelect(
        editParentSelect,
        editParentSearch.value,
        editParentIdHidden.value
      );
    });
    editParentSelect.addEventListener("change", () => {
      editParentIdHidden.value = editParentSelect.value || "";
    });
  }

  // Tìm kiếm + dropdown phụ huynh (modal tạo mới)
  const createParentSearch = document.getElementById("createParentSearch");
  const createParentSelect = document.getElementById("createParentSelect");
  const createParentIdHidden = document.getElementById("createStudentParentId");
  if (createParentSearch && createParentSelect && createParentIdHidden) {
    createParentSearch.addEventListener("input", () => {
      populateParentSelect(
        createParentSelect,
        createParentSearch.value,
        createParentIdHidden.value
      );
    });
    createParentSelect.addEventListener("change", () => {
      createParentIdHidden.value = createParentSelect.value || "";
    });
  }

  // Sự kiện lưu trong modal tạo mới
  const saveCreateBtn = document.getElementById("saveCreateStudentBtn");
  if (saveCreateBtn) {
    saveCreateBtn.addEventListener("click", createStudent);
  }

  // Mở modal tạo mới và reset form
  const createModalEl = document.getElementById("createStudentModal");
  if (createModalEl) {
    createModalEl.addEventListener("show.bs.modal", () => {
      resetCreateForm();
      // populate dropdown phụ huynh khi mở modal
      populateParentSelect(
        document.getElementById("createParentSelect"),
        document.getElementById("createParentSearch")?.value || "",
        document.getElementById("createStudentParentId")?.value || ""
      );
    });
  }
}

// Reset form tạo mới
function resetCreateForm() {
  document.getElementById("createStudentName").value = "";
  document.getElementById("createStudentDob").value = "";
  document.getElementById("createStudentGender").value = "";
  document.getElementById("createStudentAddress").value = "";
  document.getElementById("createStudentClassSelect").value = "";
  document.getElementById("createParentSearch").value = "";
  document.getElementById("createStudentParentId").value = "";
  document.getElementById("createStudentError").textContent = "";
}

// Tạo học sinh mới qua API POST
async function createStudent() {
  const name = document.getElementById("createStudentName")?.value.trim();
  const dob = document.getElementById("createStudentDob")?.value.trim();
  const gender = document.getElementById("createStudentGender")?.value;
  const address = document.getElementById("createStudentAddress")?.value.trim();
  const classId = document.getElementById("createStudentClassSelect")?.value;
  const parentId = document.getElementById("createStudentParentId")?.value;
  const errorEl = document.getElementById("createStudentError");
  if (errorEl) errorEl.textContent = "";

  // Validation
  if (!name || !dob || !gender || !address) {
    if (errorEl)
      errorEl.textContent = "Vui lòng điền đầy đủ thông tin bắt buộc";
    return;
  }

  let payload = {
    name,
    dob,
    gender,
    address,
    class_id: classId ? Number(classId) : null,
    parent_id: parentId ? Number(parentId) : null,
  };

  // Xóa các field null
  Object.keys(payload).forEach(
    (key) => payload[key] == null && delete payload[key]
  );

  try {
    const res = await fetch(`/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMessage = data.message || "Tạo học sinh thất bại";
      if (errorEl) {
        errorEl.textContent = errorMessage;
      }

      // Hiển thị alert
      if (errorMessage === "Lớp đã đầy") {
        alert("Lớp đã đầy");
      } else {
        alert("Lỗi: " + errorMessage);
      }
      return;
    }
    alert("Thêm học sinh thành công!!");
    // Đóng modal và reload danh sách
    const createModalEl = document.getElementById("createStudentModal");
    if (createModalEl) {
      const modal = bootstrap.Modal.getInstance(createModalEl);
      if (modal) {
        // Đợi modal đóng hoàn toàn rồi mới reload và xóa backdrop
        createModalEl.addEventListener(
          "hidden.bs.modal",
          async () => {
            removeModalBackdrop();
            await fetchStudents();
          },
          { once: true }
        );
        modal.hide();
      } else {
        removeModalBackdrop();
        await fetchStudents();
      }
    } else {
      removeModalBackdrop();
      await fetchStudents();
    }

  } catch (err) {
    console.error(err);
    if (errorEl) errorEl.textContent = err.message || "Có lỗi xảy ra";
    else alert("Có lỗi xảy ra");
  }

}

// Xóa học sinh
async function deleteStudent(studentId) {
  if (!studentId) return;
  const confirmed = window.confirm("Bạn chắc chắn muốn xóa học sinh này?");
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/students/${studentId}`, {
      method: "DELETE",
    });
    const dataRes = await res.json();
    if (!res.ok) {
      alert(dataRes.message || "Xóa học sinh thất bại");
      return;
    }
    await fetchStudents();
  } catch (err) {
    console.error(err);
    alert(err.message || "Có lỗi xảy ra khi xóa học sinh");
  }
}

// Chờ DOM sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

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
