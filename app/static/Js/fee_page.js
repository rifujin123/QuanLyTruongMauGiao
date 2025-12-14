console.log("js loaded");
ITEMS_PER_PAGE = 10;
let totalsData=[];
let tuitionsFee=[];
const monthly_total_revenue = document.getElementById("monthly-total-revenue");
const monthly_collected_ammounts = document.getElementById("monthly-collected-ammounts");
const monthly_uncollected_ammounts = document.getElementById("monthly-uncollected-ammounts");

const percentCollected = document.getElementById("percentCollected");

async function initData(){
    totalsData = await fetchDataUrl(`/api/tuitions/totals`);
    tuitionsFee = await fetchDataUrl(`/api/tuitions`);
}

function renderTuitionsTable(tuitionsFee){
    const tbody = document.querySelector(".tuition-body");
    tbody.innerHTML = "";

    for (let tuition of tuitionsFee){
        const row = document.createElement("tr");

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

async function renderUI(){
    await initData();
    btnFilter();
    console.log(totalsData);
    console.log(tuitionsFee);
    //Lấy tháng
    document.getElementById("month-btn").addEventListener("click",()=>{
        const value = document.getElementById("month-input").value; //"2025-12"
        const ym = getMonthInput();
        if(!ym) return;

        console.log("Year: ",ym.year);
        console.log("Month: " ,ym.month);

        const total = totalsData.find(
        item => item.month == Number(ym.month) && item.year == Number(ym.year)
        );

        if(total)
        {
            console.log(total)
            monthly_total_revenue.textContent = formatNumber(total.monthly_revenue);
            monthly_collected_ammounts.textContent = formatNumber(total.monthly_collected_amounts);
            monthly_uncollected_ammounts.textContent = formatNumber(total.monthly_uncollected_amounts);
        }

    });
}

function btnFilter(){
    const allBtn = document.getElementById("all-btn");
    const paidBtn = document.getElementById("paid-btn");
    const unpaidBtn= document.getElementById("unpaid-btn");
    let buttons = [];
    buttons.push(allBtn,paidBtn,unpaidBtn);

    buttons.forEach((btn) => {
        btn.addEventListener("click",()=>{
            buttons.forEach(b=>b.classList.remove("active"));
            btn.classList.add("active");

            let filteredTuitions = tuitionsFee;

            if(btn.dataset.status === "Paid"){
                filteredTuitions =tuitionsFee.filter(t=>t.status == "Paid");
            } else if (btn.dataset.status === "Unpaid"){
                filteredTuitions =tuitionsFee.filter(t=>t.status == "Unpaid");
            }

            renderTuitionsTable(filteredTuitions);

        });
    });

    allBtn.click();
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




