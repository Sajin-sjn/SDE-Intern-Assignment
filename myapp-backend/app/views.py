from rest_framework import viewsets, permissions
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import User
from django.db import transaction
from .models import Video, UserVideoList, VideoProgress, VideoProgressInterval
from .serializers import UserSerializer, VideoSerializer, UserVideoListSerializer, VideoProgressSerializer, VideoProgressIntervalSerializer
from .utils import merge_intervals, calculate_unique_duration

class IsInUserVideoList(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return UserVideoList.objects.filter(user=request.user, video=obj).exists()

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'username': user.username,
                'is_admin': user.is_staff,
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.id,
                'username': user.username,
                'is_admin': user.is_staff,
            }, status=status.HTTP_201_CREATED)
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({'message': 'Video deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

class UserVideoListViewSet(viewsets.ModelViewSet):
    serializer_class = UserVideoListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserVideoList.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("Request data:", request.data)
        print("Serializer errors:", serializer.errors)
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({'message': 'Video removed from list'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['delete'], url_path='remove')
    def remove(self, request, pk=None):
        try:
            user_video = UserVideoList.objects.get(user=request.user, video__id=pk)
            user_video.delete()
            return Response({'message': 'Video removed from list'}, status=status.HTTP_204_NO_CONTENT)
        except UserVideoList.DoesNotExist:
            return Response({'error': 'Video not in list'}, status=status.HTTP_404_NOT_FOUND)

class VideoProgressViewSet(viewsets.ModelViewSet):
    serializer_class = VideoProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VideoProgress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_progress(self, request):
        video_id = request.data.get('video_id')
        current_time = request.data.get('current_time')
        intervals = request.data.get('intervals', [])

        if not video_id:
            return Response({
                'error': 'video_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            video = Video.objects.get(id=video_id)
        except Video.DoesNotExist:
            return Response({
                'error': 'Video not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if not UserVideoList.objects.filter(user=request.user, video=video).exists():
            return Response({
                'error': 'Video not in user\'s list'
            }, status=status.HTTP_403_FORBIDDEN)

        progress, created = VideoProgress.objects.get_or_create(
            user=self.request.user,
            video=video,
            defaults={'progress': 0.0, 'last_watched_position': 0.0}
        )

        try:
            current_time = float(current_time) if current_time is not None else progress.last_watched_position
            if 0 <= current_time <= video.duration:
                progress.last_watched_position = current_time
        except (ValueError, TypeError):
            pass

        # Collect new intervals
        new_intervals = []
        for interval in intervals:
            try:
                start_time = float(interval.get('start_time'))
                end_time = float(interval.get('end_time'))
                if start_time is None or end_time is None:
                    continue
                if start_time < 0 or end_time > video.duration or start_time >= end_time:
                    continue
                new_intervals.append((start_time, end_time))
            except (ValueError, TypeError, AttributeError):
                continue

        with transaction.atomic():
            # Get existing intervals
            existing_intervals = [(i.start_time, i.end_time) for i in progress.intervals.all()]
            print(f"Video {video_id} - Existing intervals: {existing_intervals}, New intervals: {new_intervals}")  # Debug

            # Merge all intervals
            all_intervals = merge_intervals(existing_intervals + new_intervals)
            print(f"Video {video_id} - Merged intervals: {all_intervals}")  # Debug

            # Clear existing intervals
            progress.intervals.all().delete()

            # Save merged intervals
            try:
                for start, end in all_intervals:
                    interval_obj = VideoProgressInterval(
                        progress=progress,
                        start_time=start,
                        end_time=end
                    )
                    interval_obj.clean()  # Validate before saving
                    interval_obj.save()
            except ValidationError as e:
                print(f"Video {video_id} - Validation error: {str(e)}")  # Debug
                return Response({
                    'error': f'Invalid intervals: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)

            unique_duration = calculate_unique_duration(all_intervals)
            progress.progress = (unique_duration / video.duration) * 100 if video.duration > 0 else 0
            progress.save()

        serializer = self.get_serializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        return Response({
            'error': 'Use POST /api/progress/update_progress/ for progress updates'
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, *args, **kwargs):
        return Response({
            'error': 'Use POST /api/progress/update_progress/ for progress updates'
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def intervals(self, request, pk=None):
        try:
            progress = self.get_queryset().get(pk=pk)
        except VideoProgress.DoesNotExist:
            return Response({
                'error': 'Progress not found'
            }, status=status.HTTP_404_NOT_FOUND)
        serializer = VideoProgressIntervalSerializer(progress.intervals.all(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
