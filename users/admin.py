from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    # Fields shown in user list
    list_display = (
        'username',
        'email',
        'phone',
        'is_staff',
        'is_active',
        'created_at',
    )

    # Filters in admin sidebar
    list_filter = ('is_staff', 'is_active', 'created_at')

    # Fields for searching users
    search_fields = ('username', 'email', 'phone')

    ordering = ('-created_at',)

    # Fields shown while editing a user
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('phone', 'address', 'created_at', 'updated_at'),
        }),
    )

    # Fields shown while creating a user
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('email', 'phone', 'address'),
        }),
    )

    readonly_fields = ('created_at', 'updated_at')
