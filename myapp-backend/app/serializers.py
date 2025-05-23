from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Video, UserVideoList, VideoProgress

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

    class Meta:
        model = Video
        fields = ['id', 'title', 'description', 'video_file', 'uploaded_by', 'created_at']

class UserVideoListSerializer(serializers.ModelSerializer):
    video = VideoSerializer(read_only=True)
    video_id = serializers.PrimaryKeyRelatedField(
        queryset=Video.objects.all(), source='video', write_only=True
    )

    class Meta:
        model = UserVideoList
        fields = ['id', 'user', 'video', 'video_id', 'added_at']

class VideoProgressSerializer(serializers.ModelSerializer):
    video = VideoSerializer(read_only=True)
    video_id = serializers.PrimaryKeyRelatedField(
        queryset=Video.objects.all(), source='video', write_only=True
    )

    class Meta:
        model = VideoProgress
        fields = ['id', 'user', 'video', 'video_id', 'progress', 'last_updated']