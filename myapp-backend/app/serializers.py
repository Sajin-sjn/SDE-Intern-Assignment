from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Video

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