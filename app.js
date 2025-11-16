// Initialise date pickers when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  setupStepNavigation();
  initializeDatePicker();
  setupFormEventListener();
  checkQueryParameters();
});

// Current step tracker
let currentStep = 1;
const totalSteps = 4;

// Store export data for download
let exportFormData = null;

/**
 * Listen to click on "next" and "previous" buttons for step navigation.
 */
function setupStepNavigation() {
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");

  nextBtn.addEventListener("click", function () {
    if (validateStep(currentStep)) {
      goToStep(currentStep + 1);
    }
  });

  prevBtn.addEventListener("click", function () {
    goToStep(currentStep - 1);
  });
}

/**
 * Navigate to a specific navigation step.
 * @param {number} step
 */
function goToStep(step) {
  if (step < 1 || step > totalSteps) return;

  // Hide all steps
  document.querySelectorAll(".step-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Show current step
  const stepContent = document.querySelector(
    `.step-content[data-step="${step}"]`,
  );
  if (stepContent) {
    stepContent.classList.add("active");
  }

  updateProgressIndicator(step);
  currentStep = step;
  updateButtons();
}

/**
 * Update step navigation progress indicator.
 * @param {number} step
 */
function updateProgressIndicator(step) {
  document.querySelectorAll(".progress-step").forEach((progressStep) => {
    const stepNumber = parseInt(progressStep.getAttribute("data-step"));
    progressStep.classList.remove("active", "completed");

    if (stepNumber < step) {
      progressStep.classList.add("completed");
    } else if (stepNumber === step) {
      progressStep.classList.add("active");
    }
  });

  // Update progress lines
  document.querySelectorAll(".progress-line").forEach((line, index) => {
    if (index < step - 1) {
      line.classList.add("completed");
    } else {
      line.classList.remove("completed");
    }
  });
}

/**
 * Update button visibility based on `currentStep`.
 */
function updateButtons() {
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const submitBtn = document.getElementById("submitBtn");
  const restartBtn = document.getElementById("restartBtn");
  const buttonGroup = document.querySelector(".button-group");

  if (currentStep === totalSteps) {
    // On final step (step 4), show only restart button
    nextBtn.style.display = "none";
    prevBtn.style.display = "none";
    submitBtn.style.display = "none";
    restartBtn.style.display = "inline-block";
    buttonGroup.classList.add("final-step");
  } else if (currentStep === 3) {
    // On step 3 (format selection), show submit button instead of next
    prevBtn.style.display = "inline-block";
    nextBtn.style.display = "none";
    submitBtn.style.display = "inline-block";
    restartBtn.style.display = "none";
    buttonGroup.classList.remove("final-step");
  } else {
    // On other steps, show previous and next buttons
    prevBtn.style.display = currentStep === 1 ? "none" : "inline-block";
    nextBtn.style.display = "inline-block";
    submitBtn.style.display = "none";
    restartBtn.style.display = "none";
    buttonGroup.classList.remove("final-step");
  }
}

/**
 * Validate form fields for a specific step.
 * @param {number} step
 * @return {boolean}
 */
function validateStep(step) {
  // Clear all previous errors
  clearErrors();

  if (step === 1) {
    const itemName = document.getElementById("itemName").value.trim();
    if (!itemName) {
      showFieldError("itemName", "Item name is required");
      return false;
    }
  } else if (step === 2) {
    const dateRangeValue = document.getElementById("dateRange").value;
    if (!dateRangeValue) {
      showFieldError("dateRange", "Date range is required");
      return false;
    }

    // Validate date range format
    const dates = dateRangeValue.split(" to ");
    if (dates.length !== 2) {
      showFieldError("dateRange", "Please select a valid date range");
      return false;
    }
  }

  return true;
}

/**
 * Display an error message for a specific form field.
 * @param {string} fieldId
 * @param {string} message
 */
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(fieldId + "Error");

  if (field) {
    field.classList.add("error");
  }

  if (errorElement) {
    errorElement.textContent = message;
  }
}

/**
 * Clear an error message for a specific form field.
 * @param {string} fieldId
 */
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(fieldId + "Error");

  if (field) {
    field.classList.remove("error");
  }

  if (errorElement) {
    errorElement.textContent = "";
  }
}

/**
 * Clear all form field errors.
 */
function clearErrors() {
  document.querySelectorAll(".error-text").forEach((el) => {
    el.textContent = "";
  });

  document.querySelectorAll(".form-control.error").forEach((el) => {
    el.classList.remove("error");
  });
}

/**
 * Get the initial value for the date range picker (last 30 days).
 * @return {Date[]}
 */
function initialDatePickerRange() {
  const beginDate = new Date();
  const endDate = new Date();
  beginDate.setDate(endDate.getDate() - 30);

  return [beginDate, endDate]
}

/**
 * Initialise flatpickr date picker for date range selection.
 * See <https://flatpickr.js.org/examples/#range-calendar>.
 */
function initializeDatePicker() {
  flatpickr("#dateRange", {
    mode: "range",
    dateFormat: "Y-m-d",
    altFormat: "M j, Y",
    altInput: true,
    defaultDate: initialDatePickerRange(),
  });
}

/**
 * Setup form fields event listeners.
 */
function setupFormEventListener() {
  const exportForm = document.getElementById("exportForm");
  exportForm.addEventListener("submit", handleFormSubmit);

  // Clear errors on input
  document.getElementById("itemName").addEventListener("input", function () {
    clearFieldError("itemName");
  });

  document.getElementById("dateRange").addEventListener("change", function () {
    clearFieldError("dateRange");
  });

  // Setup download button
  const downloadBtn = document.getElementById("downloadBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", handleDownload);
  }

  // Setup restart button
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.addEventListener("click", handleRestart);
  }
}

/**
 * Handle form submission.
 * @param {Event} e
 */
function handleFormSubmit(e) {
  e.preventDefault();

  // Get form values
  const itemName = document.getElementById("itemName").value.trim();
  const dateRangeValue = document.getElementById("dateRange").value;
  const fileFormat = document.querySelector('input[name="fileFormat"]:checked',).value;

  // Validate inputs
  if (!itemName) {
    showFieldError("itemName", "Item name is required");
    goToStep(1);
    return;
  }

  if (!dateRangeValue) {
    showFieldError("dateRange", "Date range is required");
    goToStep(2);
    return;
  }

  // Parse date range (format: "YYYY-MM-DD to YYYY-MM-DD")
  const dates = dateRangeValue.split(" to ");
  if (dates.length !== 2) {
    showFieldError("dateRange", "Please select a valid date range");
    goToStep(2);
    return;
  }

  const beginDate = dates[0].trim();
  const endDate = dates[1].trim();

  // Validate date range
  const begin = new Date(beginDate);
  const end = new Date(endDate);

  if (begin > end) {
    showFieldError("dateRange", "Begin date must be before end date");
    goToStep(2);
    return;
  }

  exportFormData = {
    itemName: itemName,
    beginDate: beginDate,
    endDate: endDate,
    fileFormat: fileFormat,
  };

  console.log("Export Form Data:", exportFormData);

  // Navigate to step 4 (download page)
  goToStep(4);
}

// Handle download button click
function handleDownload() {
  if (!exportFormData) {
    console.error("No export data available");
    return;
  }

  const { itemName, beginDate, endDate, fileFormat } = exportFormData;
  const filename = `${itemName}_${beginDate}_to_${endDate}.${fileFormat.toLowerCase()}`;

  // TODO: Implement actual REST API call and data processing; mock data for now
  let content = "";
  if (fileFormat === "CSV") {
    content = "timestamp,value\n";
    content += "2024-01-01T00:00:00Z,100\n";
    content += "2024-01-02T00:00:00Z,105\n";
    content += "2024-01-03T00:00:00Z,110\n";
  } else if (fileFormat === "JSON") {
    content = JSON.stringify({
      itemName: itemName,
      beginDate: beginDate,
      endDate: endDate,
      data: [
        { timestamp: "2024-01-01T00:00:00Z", value: 100 },
        { timestamp: "2024-01-02T00:00:00Z", value: 105 },
        { timestamp: "2024-01-03T00:00:00Z", value: 110 },
      ],
    }, null, 2);
  }

  // Create a blob and trigger download
  const blob = new Blob([content], {
    type: fileFormat === "CSV" ? "text/csv" : "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Handle restart button click.
 */
function handleRestart() {
  // Clear export data
  exportFormData = null;

  // Reset form fields
  document.getElementById("itemName").value = "";
  document.getElementById("dateRange").value = initialDatePickerRange().join(" to ");
  document.querySelector('input[name="fileFormat"][value="CSV"]').checked = true;

  clearErrors();
  goToStep(1);
}

/**
 * Check for query parameters and pre-fill form fields.
 */
function checkQueryParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemName = urlParams.get('itemname');

  if (itemName) {
    // Set the item name field
    document.getElementById("itemName").value = itemName;

    // Skip to step 2 (date range selection)
    goToStep(2);
  }
}
