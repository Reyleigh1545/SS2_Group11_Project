const reportForm = document.querySelector(".report-section form");

reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = reportForm.querySelector("select").value;
  const description = reportForm.querySelector("textarea").value;

  if (!description.trim()) {
    alert("Please enter description");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type,
        description
      })
    });

    const data = await response.json();

    if (data.success) {
      alert("Report submitted successfully!");
      reportForm.reset();
    } else {
      alert("Failed to submit report");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});

const presetBtns =
  document.querySelectorAll(".preset-btn");

const amountInput =
  document.querySelector(".glass-input");

presetBtns.forEach((btn) => {

  btn.addEventListener("click", () => {

    amountInput.value =
      btn.textContent.replace("$", "");

  });

});

const donateBtn =
  document.querySelector(".btn-dark-blue");

const modal =
  document.querySelector(".donate-modal");

const qrImage =
  document.getElementById("qrImage");

const donateAmount =
  document.getElementById("donateAmount");

const closeDonate =
  document.getElementById("closeDonate");

donateBtn.addEventListener("click", () => {

  let amount = amountInput.value;

  if (!amount || isNaN(amount)) {
    alert("Enter valid amount");
    return;
  }

  amount = Number(amount) * 25000;

  const bank = "MB";
  const account = "0943985568";

  const qr =
`https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${amount}&addInfo=SupportSkyCast`;

  qrImage.src = qr;

  donateAmount.textContent =
    `Donation Amount: ${amount.toLocaleString()} VND`;

  modal.classList.remove("hidden");

});

closeDonate.addEventListener("click", () => {
  modal.classList.add("hidden");
});

const observationForm =
  document.querySelector(".contribute-form-container form");

observationForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const inputs =
    observationForm.querySelectorAll("input");

  const textarea =
    observationForm.querySelector("textarea");

  const payload = {
    location: inputs[0].value,
    condition: inputs[1].value,
    details: textarea.value
  };

  try {

    const response = await fetch(
      "http://localhost:3000/api/observation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (data.success) {

      alert("Observation submitted!");

      observationForm.reset();

    }

  } catch (err) {

    console.log(err);

  }

});

const helpBtn =
  document.querySelector(".icon-btn");

const helpModal =
  document.querySelector(".help-modal");

const closeHelp =
  document.getElementById("closeHelp");

helpBtn.addEventListener("click", () => {

  helpModal.classList.remove("hidden");

});

closeHelp.addEventListener("click", () => {

  helpModal.classList.add("hidden");

});

closeHelp.addEventListener("click", () => {

  helpModal.classList.add("hidden");

});

helpModal.addEventListener("click", (e) => {

  if(e.target === helpModal){

    helpModal.classList.add("hidden");

  }

});