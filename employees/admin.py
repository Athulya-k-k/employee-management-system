from django.contrib import admin
from .models import DynamicForm, FormField, Employee


# Inline FormField inside DynamicForm
class FormFieldInline(admin.TabularInline):
    model = FormField
    extra = 1
    ordering = ('order',)


@admin.register(DynamicForm)
class DynamicFormAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at', 'updated_at')
    search_fields = ('name', 'description', 'created_by__username')
    list_filter = ('created_at',)
    inlines = [FormFieldInline]
    ordering = ('-created_at',)




@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'form',
        'created_by',
        'created_at',
        'updated_at',
    )

    list_filter = (
        'form',
        'created_at',
    )

    search_fields = (
        'form__name',
        'created_by__username',
    )

    ordering = ('-created_at',)

    readonly_fields = (
        'created_at',
        'updated_at',
    )