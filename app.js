import { formatLocalISO, escapeCSVField, downloadFile } from "./lib.js";

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

  return [beginDate, endDate];
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
  const fileFormat = document.querySelector(
    'input[name="fileFormat"]:checked',
  ).value;

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
async function handleDownload() {
  if (!exportFormData) {
    console.error("No export data available");
    return;
  }

  const { itemName, beginDate, endDate, fileFormat } = exportFormData;
  const filename = `${itemName}_${beginDate}_to_${endDate}`;

  async function fetchItemUnit(item) {
    try {
      // Limit returned fields to unitSymbol to reduce payload
      const url = `/rest/items/${encodeURIComponent(item)}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        console.warn(`Failed to fetch item metadata for ${item}: ${res.status}`);
        return "";
      }

      const json = await res.json();
      // unitSymbol may be present or undefined
      return json.unitSymbol || "";
    } catch (err) {
      console.error(`Error fetching item metadata for ${item}:`, err);
      return "";
    }
  }

  async function fetchPersistenceData(item, startISO, endISO) {
    const rows = [];

    const url = `/rest/persistence/items/${encodeURIComponent(item)}?starttime=${encodeURIComponent(startISO)}&endtime=${encodeURIComponent(endISO)}`;

    let res;
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
    } catch (err) {
      console.error(`Network error fetching history for ${item}:`, err);
      return rows;
    }

    if (!res.ok) {
      console.error(`Failed to fetch history for ${item}: ${res.status}`);
      return rows;
    }

    const json = await res.json();
    const data = json.data || [];

    for (const dp of data) {
      const date = new Date(dp.time);
      const utcIso = date.toISOString();
      const localIso = formatLocalISO(date);

      const value = dp.state;

      rows.push({ item, time: date, utcIso, localIso, value });
    }

    return rows;
  }

  // Convert beginDate/endDate (YYYY-MM-DD) to ISO range covering whole days
  const startISO = `${beginDate}T00:00:00.000Z`;
  const endISO = `${endDate}T23:59:59.999Z`;

  try {
    if (fileFormat === "CSV") {
      // CSV header per specification: Item Name,UTC Time,Local Time,Value,Unit
      const header =
        ["Item Name", "UTC Time", "Local Time", "Value", "Unit"]
          .map(escapeCSVField)
          .join(",") + "\n";

      // Fetch unit (metadata) and history
      const unit = await fetchItemUnit(itemName);

      // Fetch persistence data and build CSV rows
      const rows = await fetchPersistenceData(itemName, startISO, endISO);

      // Assemble CSV content
      const csvParts = [header];

      for (const r of rows) {
        const row =
          [
            escapeCSVField(r.item),
            escapeCSVField(r.utcIso),
            escapeCSVField(r.localIso),
            r.value,
            unit ? escapeCSVField(unit) : "",
          ].join(",") + "\n";

        csvParts.push(row);
      }

      // If no rows, include a comment row indicating empty result
      if (rows.length === 0) {
        csvParts.push(
          `# No historic data found for ${itemName} in range ${beginDate} to ${endDate}\n`,
        );
      }

      const content = csvParts.join("");

      const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
      downloadFile(filename, blob);
    } else if (fileFormat === "JSON") {
      const unit = await fetchItemUnit(itemName);
      const historyRows = await fetchPersistenceData(
        itemName,
        startISO,
        endISO,
      );

      const jsonOut = {
        itemName: itemName,
        unit: unit || null,
        beginDate: beginDate,
        endDate: endDate,
        datapoints: historyRows.length,
        data: historyRows.map((r) => ({
          time: r.time,
          timeUtc: r.utcIso,
          timeLocal: r.localIso,
          value: r.value,
        })),
      };

      const content = JSON.stringify(jsonOut, null, 2);
      const blob = new Blob([content], { type: "application/json;charset=utf-8" });
      downloadFile(filename, blob);
    }
  } catch (err) {
    console.error("Error during export:", err);
  }
}

/**
 * Handle restart button click.
 */
function handleRestart() {
  // Clear export data
  exportFormData = null;

  // Reset form fields
  document.getElementById("itemName").value = "";
  document.getElementById("dateRange").value =
    initialDatePickerRange().join(" to ");
  document.querySelector('input[name="fileFormat"][value="CSV"]').checked =
    true;

  clearErrors();
  goToStep(1);
}

/**
 * Check for query parameters and pre-fill form fields.
 */
function checkQueryParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemName = urlParams.get("itemname");

  if (itemName) {
    // Set the item name field
    document.getElementById("itemName").value = itemName;

    // Skip to step 2 (date range selection)
    goToStep(2);
  }
}
