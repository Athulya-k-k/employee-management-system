from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import DynamicForm, Employee
from .serializers import DynamicFormSerializer, EmployeeSerializer


class DynamicFormViewSet(viewsets.ModelViewSet):
    queryset = DynamicForm.objects.all()
    serializer_class = DynamicFormSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter to only show forms created by the current user
        queryset = DynamicForm.objects.filter(created_by=self.request.user)
        
        # Apply ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        queryset = queryset.order_by(ordering)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Override destroy to return JSON response"""
        instance = self.get_object()
        form_name = instance.name
        form_id = instance.id
        self.perform_destroy(instance)
        return Response({
            'message': f'Form "{form_name}" deleted successfully',
            'deleted': True,
            'id': form_id
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reorder_fields(self, request, pk=None):
        """Reorder form fields based on provided order"""
        form = self.get_object()
        field_orders = request.data.get('field_orders', [])
        
        for item in field_orders:
            field_id = item.get('field_id')
            order = item.get('order')
            try:
                field = form.fields.get(id=field_id)
                field.order = order
                field.save()
            except:
                pass
        
        serializer = self.get_serializer(form)
        return Response(serializer.data)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter to only show employees created by the current user
        queryset = Employee.objects.filter(created_by=self.request.user)
        
        # Apply ordering (default to most recent first)
        ordering = self.request.query_params.get('ordering', '-created_at')
        queryset = queryset.order_by(ordering)
        
        # Filter by form (only user's own forms)
        form_id = self.request.query_params.get('form_id', None)
        if form_id:
            queryset = queryset.filter(form_id=form_id)
        
        # Enhanced search in dynamic fields
        search = self.request.query_params.get('search', None)
        if search:
            # Get all employees first
            all_employees = list(queryset)
            matching_ids = []
            
            search_lower = search.lower()
            
            for employee in all_employees:
                # Search through all values in the employee's data
                if employee.data:
                    for key, value in employee.data.items():
                        # Convert value to string and search
                        value_str = str(value).lower() if value is not None else ''
                        if search_lower in value_str:
                            matching_ids.append(employee.id)
                            break  # Found a match, no need to check other fields
            
            # Filter queryset by matching IDs
            if matching_ids:
                queryset = Employee.objects.filter(id__in=matching_ids).order_by(ordering)
            else:
                # No matches found, return empty queryset
                queryset = Employee.objects.none()
        
        # Filter by specific dynamic field
        for key, value in self.request.query_params.items():
            if key.startswith('field_'):
                field_label = key.replace('field_', '').replace('_', ' ')
                
                # Get current queryset as list
                current_employees = list(queryset)
                matching_ids = []
                
                value_lower = value.lower()
                
                for employee in current_employees:
                    if employee.data and field_label in employee.data:
                        field_value = employee.data[field_label]
                        field_value_str = str(field_value).lower() if field_value is not None else ''
                        if value_lower in field_value_str:
                            matching_ids.append(employee.id)
                
                # Filter queryset by matching IDs
                if matching_ids:
                    queryset = Employee.objects.filter(id__in=matching_ids).order_by(ordering)
                else:
                    queryset = Employee.objects.none()
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Override destroy to return JSON response"""
        instance = self.get_object()
        employee_id = instance.id
        self.perform_destroy(instance)
        return Response({
            'message': f'Employee #{employee_id} deleted successfully',
            'deleted': True,
            'id': employee_id
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Delete multiple employees (only user's own)"""
        ids = request.data.get('ids', [])
        # Ensure only deleting user's own employees
        deleted_count = Employee.objects.filter(
            id__in=ids,
            created_by=self.request.user
        ).delete()[0]
        return Response({
            'message': f'{deleted_count} employees deleted successfully',
            'deleted_count': deleted_count
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def search_fields(self, request):
        """Get all available field labels for search (from user's own forms)"""
        form_id = request.query_params.get('form_id', None)
        
        if form_id:
            try:
                # Ensure the form belongs to the current user
                form = DynamicForm.objects.get(id=form_id, created_by=self.request.user)
                fields = [{'label': field.label, 'type': field.field_type} 
                         for field in form.fields.all()]
                return Response({'fields': fields})
            except DynamicForm.DoesNotExist:
                return Response({'fields': []})
        else:
            # Get all unique fields across user's own forms
            user_forms = DynamicForm.objects.filter(created_by=self.request.user)
            field_dict = {}
            for form in user_forms:
                for field in form.fields.all():
                    if field.label not in field_dict:
                        field_dict[field.label] = field.field_type
            
            fields = [{'label': label, 'type': ftype} 
                     for label, ftype in field_dict.items()]
            return Response({'fields': fields})