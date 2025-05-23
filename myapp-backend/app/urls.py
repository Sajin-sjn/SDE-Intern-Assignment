from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomAuthToken, VideoViewSet

router = DefaultRouter()
router.register(r'videos', VideoViewSet)

urlpatterns = [
    path('login/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('', include(router.urls)),
]