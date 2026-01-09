# Employee Management System

A comprehensive full-stack web application for managing employees with dynamic form creation. Built with Django REST Framework backend and  JavaScript frontend.

## Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with registration, login, and profile management
- **Dynamic Form Builder**: Create custom forms with various field types (text, number, date, email, textarea, select, radio, checkbox)
- **Employee Management**: Add, edit, delete, and search employee records using dynamic forms
- **Drag-and-Drop**: Reorder form fields with intuitive drag-and-drop interface
- **Real-time Search**: Search and filter employees across all dynamic fields

### User Management
- Profile management (update personal information)
- Password change functionality
- JWT token-based authentication with automatic token refresh

### Form Management
- Create unlimited custom forms
- Support for 9 field types: text, number, date, password, email, textarea, checkbox, radio, select
- Field validation (required fields, email validation, date formats)
- Drag-and-drop field reordering
- Edit and delete forms
- Field customization (placeholder, default values, options)

### Employee Records
- Add employees using any created form
- View all employee records with filtering
- Search across all dynamic field values
- Edit employee information
- Delete individual employee records
- Filter employees by form type

## Technology Stack

### Backend
- **Django 4.2**: Web framework
- **Django REST Framework**: RESTful API
- **Simple JWT**: JWT authentication
- **SQLite**: Database (development)
- **CORS Headers**: Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **HTML5 & CSS3**: Modern responsive design
- **Fetch API**: HTTP requests
- **LocalStorage**: Client-side token management

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd employee_management
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
```

### Step 4: Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 5: Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### Step 6: Run Development Server
```bash
python manage.py runserver
```

The application will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/users/register/` - Register new user
- `POST /api/users/login/` - Login (get JWT tokens)
- `POST /api/users/token/refresh/` - Refresh access token
- `GET /api/users/profile/` - Get user profile
- `PATCH /api/users/profile/` - Update user profile
- `POST /api/users/change-password/` - Change password

### Forms
- `GET /api/employees/forms/` - List all forms
- `POST /api/employees/forms/` - Create new form
- `GET /api/employees/forms/{id}/` - Get form details
- `PUT /api/employees/forms/{id}/` - Update form
- `DELETE /api/employees/forms/{id}/` - Delete form
- `POST /api/employees/forms/{id}/reorder_fields/` - Reorder form fields

### Employee Records
- `GET /api/employees/records/` - List all employees
- `POST /api/employees/records/` - Create employee
- `GET /api/employees/records/{id}/` - Get employee details
- `PUT /api/employees/records/{id}/` - Update employee
- `DELETE /api/employees/records/{id}/` - Delete employee
- `POST /api/employees/records/bulk_delete/` - Delete multiple employees
- `GET /api/employees/records/search_fields/` - Get searchable fields

### Query Parameters
- `search` - Search in all fields
- `form_id` - Filter by form
- `ordering` - Sort results (e.g., `-created_at`)

## Usage Guide

### 1. Register/Login
- Navigate to the application
- Register a new account or login with existing credentials

### 2. Create a Dynamic Form
- Go to "Forms" page
- Click "Create New Form"
- Add form name and description
- Add fields by clicking "Add Field"
- Configure each field:
  - Label: Field name
  - Type: Choose from 9 field types
  - Required: Mark as mandatory
  - Placeholder: Helper text
  - Options: For select/radio/checkbox fields
- Drag fields to reorder
- Save the form

### 3. Add Employees
- Go to "Employees" page
- Click "Add Employee"
- Select a form from dropdown
- Fill in the dynamic form fields
- Save employee record

### 4. Search and Filter
- Use search bar to find employees
- Filter by specific form type
- Search works across all dynamic fields

### 5. Manage Data
- Edit employees by clicking "Edit"
- Delete employees with "Delete" button
- Edit forms to update structure
- Delete forms (removes associated employees)

