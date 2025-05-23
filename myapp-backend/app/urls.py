from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomAuthToken, UserViewSet, VideoViewSet, UserVideoListViewSet, VideoProgressViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'videos', VideoViewSet)
router.register(r'my-list', UserVideoListViewSet, basename='my-list')
router.register(r'progress', VideoProgressViewSet, basename='progress')

urlpatterns = [
    path('login/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('', include(router.urls)),
]