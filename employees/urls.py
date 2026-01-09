from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DynamicFormViewSet, EmployeeViewSet

router = DefaultRouter()
router.register(r'forms', DynamicFormViewSet, basename='form')
router.register(r'records', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('', include(router.urls)),
]