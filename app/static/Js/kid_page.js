nameField = document.getElementById("nameField");
classNameField = document.getElementById("classNameField");
dobField = document.getElementById("dobField");
genderField = document.getElementById("genderField");
parentNameField = document.getElementById("parentNameField");
parentPhoneField = document.getElementById("parentPhoneField");
addressField = document.getElementById("addressField");

// sẽ được set khi loadKidSelectOptions được gọi từ template
let currentParentId = null;

weightValue = document.getElementById("weightValue");
heightValue = document.getElementById("heightValue");
tempValue = document.getElementById("tempValue");
currentRecordDate = document.querySelectorAll(".currentRecordDate");

healthRecord1Date = document.getElementById("healthRecord1Date");
healthRecord1Weight = document.getElementById("healthRecord1Weight");
healthRecord1Height = document.getElementById("healthRecord1Height");
healthRecord1Temp = document.getElementById("healthRecord1Temp");
healthRecord1Teacher = document.getElementById("healthRecord1Teacher");
healthRecord1Note = document.getElementById("healthRecord1Note");

healthRecord2Date = document.getElementById("healthRecord2Date");
healthRecord2Weight = document.getElementById("healthRecord2Weight");
healthRecord2Height = document.getElementById("healthRecord2Height");
healthRecord2Temp = document.getElementById("healthRecord2Temp");
healthRecord2Teacher = document.getElementById("healthRecord2Teacher");
healthRecord2Note = document.getElementById("healthRecord2Note");

healthRecord3Date = document.getElementById("healthRecord3Date");
healthRecord3Weight = document.getElementById("healthRecord3Weight");
healthRecord3Height = document.getElementById("healthRecord3Height");
healthRecord3Temp = document.getElementById("healthRecord3Temp");
healthRecord3Teacher = document.getElementById("healthRecord3Teacher");
healthRecord3Note = document.getElementById("healthRecord3Note");

healthRecord4Date = document.getElementById("healthRecord4Date");
healthRecord4Weight = document.getElementById("healthRecord4Weight");
healthRecord4Height = document.getElementById("healthRecord4Height");
healthRecord4Temp = document.getElementById("healthRecord4Temp");
healthRecord4Teacher = document.getElementById("healthRecord4Teacher");
healthRecord4Note = document.getElementById("healthRecord4Note");

checkRow1 = document.getElementById("checkRow1");
checkRow2 = document.getElementById("checkRow2");
checkRow3 = document.getElementById("checkRow3");
checkRow4 = document.getElementById("checkRow4");

checkRowArray = [checkRow1, checkRow2, checkRow3, checkRow4];

kidSelect = document.getElementById("selectKid");

kidSelect.addEventListener("change", async () => {
  checkRowArray.forEach((row) => (row.innerHTML = "")); // reset check rows

  const kidId = kidSelect.value;
  if (!kidId) return;

  await fetchKidDataById(kidId);
  await fetchHealthRecordById(kidId);
  await fetchHealthHistoryById(kidId);
});

async function fetchKidDataById(kidId) {
  if (!currentParentId) {
    console.warn("currentParentId is not set, cannot fetch kid detail");
    return;
  }

  const kidsData = await fetchDataUrl(`/api/kids/${currentParentId}`);

  if (!kidsData || !Array.isArray(kidsData) || kidsData.length === 0) {
    console.warn("No kids data returned for parent:", currentParentId);
    return;
  }

  const kid = kidsData.find((k) => String(k.id) === String(kidId));
  if (!kid) {
    console.warn("Kid not found in response for id:", kidId, kidsData);
    return;
  }

  nameField.textContent = kid.name ?? "";
  classNameField.textContent = kid.class?.name ?? "";
  dobField.textContent = kid.dob ?? "";
  genderField.textContent = kid.gender ?? "";
  parentNameField.textContent = kid.parent?.name ?? "";
  parentPhoneField.textContent = kid.parent?.phone ?? "";
  addressField.textContent = kid.address ?? "";

  console.log("kid detail", kid);
}

async function fetchHealthRecordById(kidId) {
  const healthRecordData = await fetchDataUrl(`api/health/${kidId}`);

  const healthRecord = healthRecordData.at(-1);

  weightValue.textContent = healthRecord.weight ?? "";
  heightValue.textContent = healthRecord.height ?? "";
  tempValue.textContent = healthRecord.temperature ?? "";
  currentRecordDate[0].textContent = healthRecord.date_created ?? "";
  currentRecordDate[1].textContent = healthRecord.date_created ?? "";
  currentRecordDate[2].textContent = healthRecord.date_created ?? "";
}

async function fetchHealthHistoryById(kidId) {
  checkRowArray.forEach((row) => (row.innerHTML = "")); // reset check rows
  const healthHistoryData = await fetchDataUrl(`api/health/${kidId}`);

  const healthRecord1 = healthHistoryData.at(-1);
  const healthRecord2 = healthHistoryData.at(-2);
  const healthRecord3 = healthHistoryData.at(-3);
  const healthRecord4 = healthHistoryData.at(-4);

  healthRecordArray = [
    healthRecord1,
    healthRecord2,
    healthRecord3,
    healthRecord4,
  ];

  console.log(healthRecord1.temperature);

  healthRecord1Date.textContent = " " + healthRecord1?.date_created ?? "";
  healthRecord1Weight.textContent = healthRecord1?.weight ?? "";
  healthRecord1Height.textContent = healthRecord1?.height ?? "";
  healthRecord1Temp.textContent = healthRecord1?.temperature ?? "";
  healthRecord1Teacher.textContent = healthRecord1?.teacher.name ?? "";
  healthRecord1Note.textContent = healthRecord1?.note ?? "";

  healthRecord2Date.textContent = " " + healthRecord2?.date_created ?? "";
  healthRecord2Weight.textContent = healthRecord2?.weight ?? "";
  healthRecord2Height.textContent = healthRecord2?.height ?? "";
  healthRecord2Temp.textContent = healthRecord2?.temperature ?? "";
  healthRecord2Teacher.textContent = healthRecord2?.teacher.name ?? "";
  healthRecord2Note.textContent = healthRecord2?.note ?? "";

  healthRecord3Date.textContent = " " + healthRecord3?.date_created ?? "";
  healthRecord3Weight.textContent = healthRecord3?.weight ?? "";
  healthRecord3Height.textContent = healthRecord3?.height ?? "";
  healthRecord3Temp.textContent = healthRecord3?.temperature ?? "";
  healthRecord3Teacher.textContent = healthRecord3?.teacher.name ?? "";
  healthRecord3Note.textContent = healthRecord3?.note ?? "";

  healthRecord4Date.textContent = " " + healthRecord4?.date_created ?? "";
  healthRecord4Weight.textContent = healthRecord4?.weight ?? "";
  healthRecord4Height.textContent = healthRecord4?.height ?? "";
  healthRecord4Temp.textContent = healthRecord4?.temperature ?? "";
  healthRecord4Teacher.textContent = healthRecord4?.teacher.name ?? "";
  healthRecord4Note.textContent = healthRecord4?.note ?? "";

  for (let i = 0; i < healthRecordArray.length; i++) {
    if (!healthRecordArray[i]) {
      console.log("No data");
    } else if (healthRecordArray[i].temperature >= 37.5) {
      checkRowArray[i].innerHTML += `
            <span class="badge bg-danger-subtle text-danger">
                      <i class="fas fa-exclamation-triangle me-1"></i>Sốt
                    </span>`;
      console.log("Sốt");
    } else {
      checkRowArray[i].innerHTML += `
            <span class="badge bg-success-subtle text-success">
                      <i class="fas fa-check-circle me-1"></i>Bình thường
                    </span>`;
      console.log("Bình thường");
    }
  }
}

async function loadKidSelectOptions(parentId, initialKidId = null) {
  currentParentId = parentId;
  const kids = await fetchDataUrl(`/api/kids/${parentId}`);

  kidSelect.innerHTML = ""; // clear cũ

  kids.forEach((kid) => {
    const opt = document.createElement("option");
    opt.value = kid.id;
    opt.textContent = `${kid.name} - ${kid.class.name}`;
    kidSelect.appendChild(opt);
  });

  //load đứa đầu tiên
  const firstId = kids[0]?.id;
  const targetId = initialKidId ?? firstId;
  if (targetId) {
    await fetchKidDataById(targetId);
    await fetchHealthRecordById(targetId);
    await fetchHealthHistoryById(targetId);
  }

  console.log("kids from API", kids);
  console.log("selected kidId", kidSelect.value);
}
