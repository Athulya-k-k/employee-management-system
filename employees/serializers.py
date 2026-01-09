from rest_framework import serializers
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from datetime import datetime
from .models import DynamicForm, FormField, Employee

class FormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormField
        fields = ('id', 'label', 'field_type', 'is_required', 'options', 'order', 'placeholder', 'default_value')
        read_only_fields = ('id',)

class DynamicFormSerializer(serializers.ModelSerializer):
    fields = FormFieldSerializer(many=True, required=False)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = DynamicForm
        fields = ('id', 'name', 'description', 'fields', 'created_by', 'created_by_username', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def create(self, validated_data):
        fields_data = validated_data.pop('fields', [])
        form = DynamicForm.objects.create(**validated_data)
        
        for field_data in fields_data:
            FormField.objects.create(form=form, **field_data)
        
        return form

    def update(self, instance, validated_data):
        fields_data = validated_data.pop('fields', None)
        
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        
        if fields_data is not None:
            # Delete existing fields and create new ones
            instance.fields.all().delete()
            for field_data in fields_data:
                FormField.objects.create(form=instance, **field_data)
        
        return instance

class EmployeeSerializer(serializers.ModelSerializer):
    form_name = serializers.CharField(source='form.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    form_fields = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Employee
        fields = ('id', 'form', 'form_name', 'form_fields', 'data', 'created_by', 'created_by_username', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def get_form_fields(self, obj):
        """Return form fields for reference"""
        return FormFieldSerializer(obj.form.fields.all(), many=True).data

    def validate_field_value(self, field, value):
        """Validate individual field value based on field type"""
        if not value and not field.is_required:
            return True
        
        field_type = field.field_type
        
        try:
            if field_type == 'number':
                # Check if value can be converted to number
                float(str(value))
            
            elif field_type == 'email':
                # Validate email format
                validate_email(str(value))
            
            elif field_type == 'date':
                # Validate date format (expecting YYYY-MM-DD or similar)
                if isinstance(value, str):
                    # Try multiple date formats
                    date_formats = ['%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%d/%m/%Y']
                    valid = False
                    for fmt in date_formats:
                        try:
                            datetime.strptime(value, fmt)
                            valid = True
                            break
                        except ValueError:
                            continue
                    if not valid:
                        raise ValueError("Invalid date format")
            
            elif field_type in ['select', 'radio']:
                # Validate that value is in options
                if field.options and isinstance(field.options, list):
                    if str(value) not in [str(opt) for opt in field.options]:
                        raise ValueError(f"Value must be one of: {', '.join(map(str, field.options))}")
            
            elif field_type == 'checkbox':
                # Validate checkbox value (should be list if multiple, or boolean)
                if field.options and isinstance(field.options, list):
                    if isinstance(value, list):
                        for v in value:
                            if str(v) not in [str(opt) for opt in field.options]:
                                raise ValueError(f"Invalid checkbox value: {v}")
                    else:
                        # Single value
                        if str(value) not in [str(opt) for opt in field.options]:
                            raise ValueError(f"Value must be one of: {', '.join(map(str, field.options))}")
            
            return True
            
        except (ValueError, DjangoValidationError) as e:
            return str(e)

    def validate(self, attrs):
        form = attrs.get('form')
        data = attrs.get('data', {})
        
        errors = {}
        
        # Validate each field in the form
        for field in form.fields.all():
            value = data.get(field.label)
            
            # Check if required field is missing
            if field.is_required:
                if value is None or value == '' or (isinstance(value, str) and not value.strip()):
                    errors[field.label] = f"{field.label} is required."
                    continue
            
            # Validate field type if value is provided
            if value is not None and value != '':
                validation_result = self.validate_field_value(field, value)
                if validation_result is not True:
                    errors[field.label] = validation_result
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return attrs

class EmployeeSearchSerializer(serializers.Serializer):
    """Serializer for employee search parameters"""
    search = serializers.CharField(required=False, allow_blank=True)
    form_id = serializers.IntegerField(required=False)
    ordering = serializers.CharField(required=False, default='-created_at')