console.log("js loaded");
let totalsData=[];
let tuitionsFee=[];
const monthly_total_revenue = document.getElementById("monthly-total-revenue");
const monthly_collected_ammounts = document.getElementById("monthly-collected-ammounts");
const monthly_uncollected_ammounts = document.getElementById("monthly-uncollected-ammounts");

baseFee= document.getElementById("base-fee");
mealFee= document.getElementById("meal-fee");
extraFee = document.getElementById("extra-fee")
totalFee=document.getElementById("total-fee")
paymentStatus = document.getElementById("payment-status")
let currentTuitions = [];
let currentStatus = "all";

async function initData(){
    totalsData = await fetchDataUrl(`/api/tuitions/totals`);
    tuitionsFee = await fetchDataUrl(`/api/tuitions`);
}

function renderTuitionsTable(tuitionsFee){
    const tbody = document.querySelector(".tuition-body");
    tbody.innerHTML = "";
    console.log(tbody);

    for (let tuition of tuitionsFee){
        const row = document.createElement("tr");
        console.log(row);

        let statusClass = "text-bg-secondary";
        if(tuition.status === "Paid"){
            statusClass = "text-bg-success";
        }
        else{
            statusClass="text-bg-danger";
        }

        row.innerHTML = `
            <td>${tuition.student.name}</td>
              <td class="text-end" >${formatNumber(tuition.fee_base)}</td>
              <td class="text-end" >${formatNumber(tuition.meal_fee)}</td>
              <td class="text-end" >${formatNumber(tuition.extra_fee)}</td>
              <td class="text-end fw-semibold" id="total-fee">${formatNumber(tuition.fee_base+tuition.meal_fee+tuition.extra_fee)}</td>
              <td class="text-center">
                <span class="badge ${statusClass}" id="payment-status"
                  >${tuition.status === "Paid"? "Đã thu" : "Chưa thu"}</span
                >
              </td>
              <td class="text-end">05/12/2025</td>
        `;
        tbody.appendChild(row);
    }
}

function getMonthInput(){
    const input = document.getElementById("month-input");
    let value = input.value;

    if(!value){
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth()+1).padStart(2,"0");
        value = `${year}-${month}`;
        input.value = value;
    }
    const [year,month] =value.split("-");
    return {year,month};
}

function applyStatusFilter() {
  let data = currentTuitions;

  if (currentStatus !== "all") {
    data = currentTuitions.filter(t => t.status === currentStatus);
  }

  renderTuitionsTable(data);
}

function bindStatusButtons() {
  const group = document.getElementById("status-filter");
  if (!group) return;

  group.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");


      currentStatus = btn.dataset.status;

      applyStatusFilter();
    });
  });
}


async function renderUI(){
  await initData();

  currentTuitions = tuitionsFee;
  bindStatusButtons();
  applyStatusFilter();

  document.getElementById("month-btn").addEventListener("click", async () => {
    const ym = getMonthInput();
    if(!ym) return;

    const total = totalsData.find(
      item => item.month === Number(ym.month) && item.year === Number(ym.year)
    );

    if(total){
      monthly_total_revenue.textContent = formatNumber(total.monthly_revenue);
      monthly_collected_ammounts.textContent = formatNumber(total.monthly_collected_amounts);
      monthly_uncollected_ammounts.textContent = formatNumber(total.monthly_uncollected_amounts);
    } else {
      monthly_total_revenue.textContent = "0";
      monthly_collected_ammounts.textContent = "0";
      monthly_uncollected_ammounts.textContent = "0";
    }


    currentTuitions = await fetchDataUrl(`/api/tuitions?year=${ym.year}&month=${ym.month}`);

    applyStatusFilter();
  });
}




