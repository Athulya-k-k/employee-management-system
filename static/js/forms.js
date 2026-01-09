// Global Variables
let formFields = [];
let editingFormId = null;
let draggedElement = null;

// Load Forms
async function loadForms() {
    try {
        const forms = await formsAPI.list();
        displayForms(forms);
    } catch (error) {
        showError(error);
    }
}

// Display Forms
function displayForms(forms) {
    const container = document.getElementById('formsContainer');
    
    if (!forms || forms.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center;">No forms found. Create your first form!</p>';
        return;
    }
    
    container.innerHTML = forms.map(form => `
        <div class="form-card">
            <h3>${form.name}</h3>
            <p>${form.description || 'No description'}</p>
            <p style="color: #999; font-size: 12px;">Fields: ${form.fields ? form.fields.length : 0}</p>
            <p style="color: #999; font-size: 12px;">Created: ${new Date(form.created_at).toLocaleDateString()}</p>
            <div class="form-card-actions">
                <button class="btn btn-primary btn-sm" onclick="editForm(${form.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteForm(${form.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Show Create Form Modal
function showCreateFormModal() {
    editingFormId = null;
    formFields = [];
    document.getElementById('formModalTitle').textContent = 'Create Dynamic Form';
    document.getElementById('createFormForm').reset();
    document.getElementById('formFieldsContainer').innerHTML = '';
    document.getElementById('createFormModal').classList.add('active');
}

// Close Create Form Modal
function closeCreateFormModal() {
    document.getElementById('createFormModal').classList.remove('active');
}

// Add Form Field
function addFormField() {
    const fieldId = Date.now();
    const field = {
        id: fieldId,
        label: '',
        field_type: 'text',
        is_required: false,
        placeholder: '',
        default_value: '',
        options: null,
        order: formFields.length
    };
    
    formFields.push(field);
    renderFormFields();
}

// Render Form Fields
function renderFormFields() {
    const container = document.getElementById('formFieldsContainer');
    
    container.innerHTML = formFields.map((field, index) => `
        <div class="field-item" draggable="true" data-field-id="${field.id}" data-index="${index}">
            <div class="field-header">
                <h4>
                    <span class="drag-handle">☰</span>
                    Field ${index + 1}
                </h4>
                <button type="button" class="field-remove" onclick="removeField(${field.id})">Remove</button>
            </div>
            <div class="field-inputs">
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" value="${field.label}" onchange="updateField(${field.id}, 'label', this.value)" required>
                </div>
                <div class="form-group">
                    <label>Field Type</label>
                    <select onchange="updateField(${field.id}, 'field_type', this.value); renderFormFields();">
                        <option value="text" ${field.field_type === 'text' ? 'selected' : ''}>Text</option>
                        <option value="number" ${field.field_type === 'number' ? 'selected' : ''}>Number</option>
                        <option value="date" ${field.field_type === 'date' ? 'selected' : ''}>Date</option>
                        <option value="password" ${field.field_type === 'password' ? 'selected' : ''}>Password</option>
                        <option value="email" ${field.field_type === 'email' ? 'selected' : ''}>Email</option>
                        <option value="textarea" ${field.field_type === 'textarea' ? 'selected' : ''}>Text Area</option>
                        <option value="checkbox" ${field.field_type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                        <option value="radio" ${field.field_type === 'radio' ? 'selected' : ''}>Radio</option>
                        <option value="select" ${field.field_type === 'select' ? 'selected' : ''}>Select</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Placeholder</label>
                    <input type="text" value="${field.placeholder || ''}" onchange="updateField(${field.id}, 'placeholder', this.value)">
                </div>
                <div class="form-group">
                    <label>Default Value</label>
                    <input type="text" value="${field.default_value || ''}" onchange="updateField(${field.id}, 'default_value', this.value)">
                </div>
                ${['select', 'radio', 'checkbox'].includes(field.field_type) ? `
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label>Options (comma-separated)</label>
                        <input type="text" value="${field.options ? field.options.join(',') : ''}" 
                            onchange="updateField(${field.id}, 'options', this.value.split(',').map(o => o.trim()))"
                            placeholder="Option1, Option2, Option3">
                    </div>
                ` : ''}
                <div class="form-group field-checkbox" style="grid-column: 1 / -1;">
                    <input type="checkbox" ${field.is_required ? 'checked' : ''} 
                        onchange="updateField(${field.id}, 'is_required', this.checked)">
                    <label>Required Field</label>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add drag and drop event listeners
    addDragAndDropListeners();
}

// Update Field
function updateField(fieldId, property, value) {
    const field = formFields.find(f => f.id === fieldId);
    if (field) {
        field[property] = value;
    }
}

// Remove Field
function removeField(fieldId) {
    formFields = formFields.filter(f => f.id !== fieldId);
    renderFormFields();
}

// Drag and Drop
function addDragAndDropListeners() {
    const items = document.querySelectorAll('.field-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(this.parentElement, e.clientY);
    if (afterElement == null) {
        this.parentElement.appendChild(draggedElement);
    } else {
        this.parentElement.insertBefore(draggedElement, afterElement);
    }
}

function handleDrop(e) {
    e.stopPropagation();
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Update order in formFields array
    const items = document.querySelectorAll('.field-item');
    const newOrder = [];
    items.forEach((item, index) => {
        const fieldId = parseInt(item.dataset.fieldId);
        const field = formFields.find(f => f.id === fieldId);
        if (field) {
            field.order = index;
            newOrder.push(field);
        }
    });
    formFields = newOrder;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.field-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Handle Create/Update Form
async function handleCreateForm(event) {
    event.preventDefault();
    
    if (formFields.length === 0) {
        showAlert('Please add at least one field', 'error');
        return;
    }
    
    // Validate fields
    for (let field of formFields) {
        if (!field.label) {
            showAlert('All fields must have a label', 'error');
            return;
        }
    }
    
    const formData = {
        name: document.getElementById('formName').value,
        description: document.getElementById('formDescription').value,
        fields: formFields.map(f => ({
            label: f.label,
            field_type: f.field_type,
            is_required: f.is_required,
            placeholder: f.placeholder,
            default_value: f.default_value,
            options: f.options,
            order: f.order
        }))
    };
    
    try {
        if (editingFormId) {
            await formsAPI.update(editingFormId, formData);
            showAlert('Form updated successfully!', 'success');
        } else {
            await formsAPI.create(formData);
            showAlert('Form created successfully!', 'success');
        }
        
        closeCreateFormModal();
        loadForms();
    } catch (error) {
        showError(error);
    }
}

// Edit Form
async function editForm(formId) {
    try {
        const form = await formsAPI.get(formId);
        editingFormId = formId;
        
        document.getElementById('formModalTitle').textContent = 'Edit Dynamic Form';
        document.getElementById('formName').value = form.name;
        document.getElementById('formDescription').value = form.description || '';
        
        formFields = form.fields.map(field => ({
            id: field.id,
            label: field.label,
            field_type: field.field_type,
            is_required: field.is_required,
            placeholder: field.placeholder || '',
            default_value: field.default_value || '',
            options: field.options,
            order: field.order
        }));
        
        renderFormFields();
        document.getElementById('createFormModal').classList.add('active');
    } catch (error) {
        showError(error);
    }
}

// Delete Form
async function deleteForm(formId) {
    if (!confirm('Are you sure you want to delete this form? This will also delete all employees associated with this form.')) {
        return;
    }
    
    try {
        await formsAPI.delete(formId);
        showAlert('Form deleted successfully!', 'success');
        loadForms();
    } catch (error) {
        showError(error);
    }
}