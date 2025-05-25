from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Video, UserVideoList, VideoProgress, VideoProgressInterval

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class VideoSerializer(serializers.ModelSerializer):
    video_file = serializers.FileField()
    uploaded_by = serializers.ReadOnlyField(source='uploaded_by.username')
    is_in_user_list = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = ['id', 'title', 'description', 'video_file', 'uploaded_by', 'created_at', 'duration', 'is_in_user_list']

    def get_is_in_user_list(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return UserVideoList.objects.filter(user=user, video=obj).exists()
        return False

class UserVideoListSerializer(serializers.ModelSerializer):
    video = VideoSerializer(read_only=True)
    video_id = serializers.PrimaryKeyRelatedField(
        queryset=Video.objects.all(), source='video', write_only=True
    )

    class Meta:
        model = UserVideoList
        fields = ['id', 'video', 'video_id', 'added_at']

    def validate(self, attrs):
        # Ensure user is set in the context for unique_together validation
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            raise serializers.ValidationError("Authenticated user is required.")
        # Check unique_together constraint manually
        video = attrs.get('video')
        user = request.user
        if UserVideoList.objects.filter(user=user, video=video).exists():
            raise serializers.ValidationError({"non_field_errors": ["This video is already in the user's list."]})
        return attrs

    def create(self, validated_data):
        # Set user from request context
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            raise serializers.ValidationError("Authenticated user is required.")
        validated_data['user'] = request.user
        return super().create(validated_data)

class VideoProgressIntervalSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoProgressInterval
        fields = ['id', 'start_time', 'end_time']

class VideoProgressSerializer(serializers.ModelSerializer):
    video = VideoSerializer(read_only=True)
    video_id = serializers.PrimaryKeyRelatedField(
        queryset=Video.objects.all(), source='video', write_only=True
    )
    intervals = VideoProgressIntervalSerializer(many=True, read_only=True)

    class Meta:
        model = VideoProgress
        fields = ['id', 'user', 'video', 'video_id', 'progress', 'last_watched_position', 'last_updated', 'intervals']