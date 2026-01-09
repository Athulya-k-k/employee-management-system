from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class DynamicForm(models.Model):
    FIELD_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('password', 'Password'),
        ('email', 'Email'),
        ('textarea', 'Text Area'),
        ('checkbox', 'Checkbox'),
        ('radio', 'Radio'),
        ('select', 'Select'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class FormField(models.Model):
    form = models.ForeignKey(DynamicForm, on_delete=models.CASCADE, related_name='fields')
    label = models.CharField(max_length=255)
    field_type = models.CharField(max_length=50, choices=DynamicForm.FIELD_TYPES)
    is_required = models.BooleanField(default=False)
    options = models.JSONField(blank=True, null=True)  # For select, radio, checkbox
    order = models.IntegerField(default=0)
    placeholder = models.CharField(max_length=255, blank=True, null=True)
    default_value = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.form.name} - {self.label}"

class Employee(models.Model):
    form = models.ForeignKey(DynamicForm, on_delete=models.CASCADE, related_name='employees')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='employees')
    data = models.JSONField()  # Store dynamic field values
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Employee #{self.id} - {self.form.name}"
