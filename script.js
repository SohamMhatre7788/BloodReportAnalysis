// script.js

// Utility Functions
function qs(selector) {
    return document.querySelector(selector);
}

function qsa(selector) {
    return document.querySelectorAll(selector);
}

// Navigation and Page Transition
function navigateTo(page) {
    window.location.href = page;
}

// Show relevant input fields based on selected test
function showFields() {
    const testFields = qsa('.test-fields');
    testFields.forEach(field => field.classList.add('hidden'));

    const selectedTest = qs('#test').value;

    if (selectedTest) {
        qs(`#${selectedTest}-fields`).classList.remove('hidden');
    }
}

// Real-time Form Validation
function validateInput(input) {
    let isValid = true;
    const value = input.value.trim();

    if (!value) {
        isValid = false;
        input.classList.add('error');
        showError(input, 'This field is required.');
    } else {
        input.classList.remove('error');
        hideError(input);
    }

    return isValid;
}

function showError(input, message) {
    let error = input.nextElementSibling;
    if (error && error.classList.contains('error-message')) {
        error.textContent = message;
    } else {
        error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        input.parentNode.insertBefore(error, input.nextSibling);
    }
}

function hideError(input) {
    const error = input.nextElementSibling;
    if (error && error.classList.contains('error-message')) {
        error.textContent = '';
    }
}

// Handle form submission
function handleSubmit(event) {
    event.preventDefault();

    const test = qs('#test').value;
    if (!test) {
        alert('Please select a test.');
        return;
    }

    const inputs = qsa(`#${test}-fields input, #${test}-fields select`);
    let inputData = { test };
    let valid = true;

    inputs.forEach(input => {
        if (!validateInput(input)) {
            valid = false;
        } else {
            inputData[input.id] = input.value.trim();
        }
    });

    if (!valid) {
        alert('Please correct the errors in the form.');
        return;
    }

    localStorage.setItem('testData', JSON.stringify(inputData));
    navigateTo('result.html');
}

// Analyze results and display on result page
function analyzeResults() {
    const data = JSON.parse(localStorage.getItem('testData'));
    if (!data) {
        qs('#result').innerHTML = '<p>No data found. Please go back and enter your values.</p>';
        return;
    }

    let resultHTML = '';

    switch (data.test) {
        case 'wbc':
            resultHTML += '<h2>WBC Test Analysis</h2>';
            resultHTML += generateTable([
                { parameter: 'Neutrophils', value: data.neutrophils, min: 40, max: 70, unit: '%' },
                { parameter: 'Lymphocytes', value: data.lymphocytes, min: 20, max: 40, unit: '%' },
                { parameter: 'Monocytes', value: data.monocytes, min: 2, max: 8, unit: '%' }
            ]);
            break;
        case 'cholesterol':
            const totalCholesterol = parseFloat(data['total-cholesterol']);
            const hdl = parseFloat(data.hdl);
            resultHTML += '<h2>Cholesterol Test Analysis</h2>';
            resultHTML += generateTable([
                { parameter: 'Total Cholesterol', value: totalCholesterol, min: 0, max: 200, unit: 'mg/dL', optimal: '<200' },
                { parameter: 'HDL Cholesterol', value: hdl, min: 40, max: 60, unit: 'mg/dL', optimal: '>40' }
            ]);
            break;
        case 'fbc':
            resultHTML += '<h2>Full Blood Count Analysis</h2>';
            resultHTML += generateTable([
                { parameter: 'Hemoglobin', value: data.hemoglobin, min: 12, max: 16, unit: 'g/dL' },
                { parameter: 'RBC Count', value: data.rbc, min: 4.5, max: 5.9, unit: 'million cells/uL' }
            ]);
            break;
        case 'kidney':
            const creatinine = parseFloat(data.creatinine);
            const age = parseInt(data.age);
            let egfr = 175 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203);
            if (data.sex === 'female') egfr *= 0.742;
            data.egfr = egfr.toFixed(2);

            resultHTML += '<h2>Kidney Function Test Analysis</h2>';
            resultHTML += generateTable([
                { parameter: 'Serum Creatinine', value: creatinine, min: 0.6, max: 1.3, unit: 'mg/dL' },
                { parameter: 'eGFR', value: data.egfr, min: 90, max: Infinity, unit: 'mL/min/1.73m²', optimal: '>90' }
            ]);
            break;
        case 'liver':
            resultHTML += '<h2>Liver Function Test Analysis</h2>';
            resultHTML += generateTable([
                { parameter: 'Bilirubin', value: data.bilirubin, min: 0.1, max: 1.2, unit: 'mg/dL' }
            ]);
            break;
        default:
            resultHTML = '<p>Invalid test selected.</p>';
    }

    qs('#result').innerHTML = resultHTML;
}

// Generate analysis table
function generateTable(parameters) {
    let tableHTML = '<table class="table"><thead><tr><th>Parameter</th><th>Value</th><th>Normal Range</th><th>Status</th></tr></thead><tbody>';

    parameters.forEach(param => {
        const value = parseFloat(param.value);
        const min = param.min;
        const max = param.max;
        const optimal = param.optimal || `${min} - ${max}`;
        let status = '';

        if (value < min || value > max) {
            status = '<span class="abnormal">Abnormal</span>';
        } else {
            status = '<span class="normal">Normal</span>';
        }

        tableHTML += `<tr>
            <td>${param.parameter}</td>
            <td>${value} ${param.unit}</td>
            <td>${optimal} ${param.unit}</td>
            <td>${status}</td>
        </tr>`;
    });

    tableHTML += '</tbody></table>';
    return tableHTML;
}

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', () => {
    const inputForm = qs('#inputForm');
    if (inputForm) {
        inputForm.addEventListener('submit', handleSubmit);

        // Real-time validation
        const inputs = qsa('input[required], select[required]');
        inputs.forEach(input => {
            input.addEventListener('input', () => validateInput(input));
        });

        // Show fields if test is selected
        const testSelect = qs('#test');
        if (testSelect) {
            showFields();
            testSelect.addEventListener('change', showFields);
        }
    }

    // Analyze results if on result page
    if (qs('#result')) {
        analyzeResults();
    }
});
