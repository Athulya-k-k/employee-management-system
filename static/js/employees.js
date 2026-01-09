// =====================
// Global Variables
// =====================
let currentEmployeeId = null;
let selectedForm = null;

// =====================
// Page Load
// =====================
document.addEventListener('DOMContentLoaded', () => {
    loadFormFilter();     // load once
    loadEmployees();      // load employees
});

// =====================
// Load Employees
// =====================
async function loadEmployees(params = {}) {
    try {
        const employees = await employeesAPI.list(params);
        displayEmployees(employees);
    } catch (error) {
        showError(error);
    }
}

// =====================
// Display Employees
// =====================
function displayEmployees(employees) {
    const container = document.getElementById('employeesContainer');

    if (!employees || employees.length === 0) {
        container.innerHTML =
            '<p style="padding:20px;text-align:center;color:#999;">No employees found.</p>';
        return;
    }

    container.innerHTML = employees.map(employee => {
        const dataPreview = Object.entries(employee.data)
            .slice(0, 3)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' | ');

        return `
            <div class="employee-item">
                <div class="employee-info">
                    <h4><strong>Form:</strong> ${employee.form_name}</h4>
                    <p style="color:#666;font-size:13px;">${dataPreview}</p>
                    <p style="color:#999;font-size:12px;">
                        Created: ${new Date(employee.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div class="employee-actions">
                    <button class="btn btn-primary btn-sm" onclick="editEmployee(${employee.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEmployee(${employee.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// =====================
// Load Form Filter (ONLY ONCE)
// =====================
async function loadFormFilter() {
    try {
        const forms = await formsAPI.list();
        const select = document.getElementById('formFilter');

        select.innerHTML = `
            <option value="">All Forms</option>
            ${forms.map(form => `<option value="${form.id}">${form.name}</option>`).join('')}
        `;
    } catch (error) {
        console.error('Error loading form filter:', error);
    }
}

// =====================
// Search & Filter Employees
// =====================
function searchEmployees() {
    const search = document.getElementById('employeeSearch').value;
    const formId = document.getElementById('formFilter').value;

    const params = {};
    if (search) params.search = search;
    if (formId) params.form_id = formId;

    loadEmployees(params);
}

function filterEmployees() {
    searchEmployees();
}

// =====================
// Show Create Employee Modal
// =====================
async function showCreateEmployeeModal() {
    currentEmployeeId = null;
    document.getElementById('employeeModalTitle').textContent = 'Add Employee';
    document.getElementById('createEmployeeForm').reset();
    document.getElementById('employeeFormFields').innerHTML = '';

    try {
        const forms = await formsAPI.list();
        const select = document.getElementById('employeeFormSelect');

        if (!forms.length) {
            showAlert('Please create a form first', 'error');
            return;
        }

        select.innerHTML = `
            <option value="">-- Select Form --</option>
            ${forms.map(form => `<option value="${form.id}">${form.name}</option>`).join('')}
        `;

        document.getElementById('createEmployeeModal').classList.add('active');
    } catch (error) {
        showError(error);
    }
}

// =====================
// Close Modal
// =====================
function closeCreateEmployeeModal() {
    document.getElementById('createEmployeeModal').classList.remove('active');
}

// =====================
// Load Employee Form
// =====================
async function loadEmployeeForm() {
    const formId = document.getElementById('employeeFormSelect').value;

    if (!formId) {
        document.getElementById('employeeFormFields').innerHTML = '';
        return;
    }

    try {
        selectedForm = await formsAPI.get(formId);
        renderEmployeeFormFields(selectedForm.fields);
    } catch (error) {
        showError(error);
    }
}

// =====================
// Render Dynamic Fields
// =====================
function renderEmployeeFormFields(fields, data = {}) {
    const container = document.getElementById('employeeFormFields');

    container.innerHTML = fields.map(field => {
        const value = data[field.label] || '';

        let input = '';

        switch (field.field_type) {
            case 'textarea':
                input = `<textarea id="field_${field.id}" ${field.is_required ? 'required' : ''}>${value}</textarea>`;
                break;

            case 'select':
                input = `
                    <select id="field_${field.id}" ${field.is_required ? 'required' : ''}>
                        <option value="">-- Select --</option>
                        ${field.options.map(opt =>
                            `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`
                        ).join('')}
                    </select>`;
                break;

            case 'radio':
                input = field.options.map(opt => `
                    <label>
                        <input type="radio" name="field_${field.id}" value="${opt}"
                            ${opt === value ? 'checked' : ''}>
                        ${opt}
                    </label>
                `).join('');
                break;

            case 'checkbox':
                input = field.options.map(opt => `
                    <label>
                        <input type="checkbox" name="field_${field.id}" value="${opt}"
                            ${(Array.isArray(value) && value.includes(opt)) ? 'checked' : ''}>
                        ${opt}
                    </label>
                `).join('');
                break;

            default:
                input = `<input type="${field.field_type}" id="field_${field.id}" value="${value}">`;
        }

        return `
            <div class="form-group">
                <label>${field.label}${field.is_required ? ' *' : ''}</label>
                ${input}
            </div>
        `;
    }).join('');
}

// =====================
// Create / Update Employee
// =====================
async function handleCreateEmployee(e) {
    e.preventDefault();

    if (!selectedForm) {
        showAlert('Please select a form', 'error');
        return;
    }

    const data = {};

    selectedForm.fields.forEach(field => {
        if (field.field_type === 'checkbox') {
            const checked = document.querySelectorAll(`input[name="field_${field.id}"]:checked`);
            data[field.label] = Array.from(checked).map(c => c.value);
        } else if (field.field_type === 'radio') {
            const radio = document.querySelector(`input[name="field_${field.id}"]:checked`);
            data[field.label] = radio ? radio.value : '';
        } else {
            data[field.label] = document.getElementById(`field_${field.id}`)?.value || '';
        }
    });

    const payload = {
        form: selectedForm.id,
        data
    };

    try {
        if (currentEmployeeId) {
            await employeesAPI.update(currentEmployeeId, payload);
            showAlert('Employee updated successfully!', 'success');
        } else {
            await employeesAPI.create(payload);
            showAlert('Employee created successfully!', 'success');
        }

        closeCreateEmployeeModal();
        loadEmployees();
    } catch (error) {
        showError(error);
    }
}

// =====================
// Edit Employee
// =====================
async function editEmployee(id) {
    try {
        const employee = await employeesAPI.get(id);
        currentEmployeeId = id;

        const forms = await formsAPI.list();
        document.getElementById('employeeFormSelect').innerHTML =
            forms.map(f =>
                `<option value="${f.id}" ${f.id === employee.form ? 'selected' : ''}>${f.name}</option>`
            ).join('');

        selectedForm = await formsAPI.get(employee.form);
        renderEmployeeFormFields(selectedForm.fields, employee.data);

        document.getElementById('employeeModalTitle').textContent = 'Edit Employee';
        document.getElementById('createEmployeeModal').classList.add('active');
    } catch (error) {
        showError(error);
    }
}

// =====================
// Delete Employee
// =====================
async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
        await employeesAPI.delete(id);
        showAlert('Employee deleted successfully!', 'success');
        loadEmployees();
    } catch (error) {
        showError(error);
    }
}
