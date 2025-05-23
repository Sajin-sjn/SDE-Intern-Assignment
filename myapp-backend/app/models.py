from django.db import models
from django.contrib.auth.models import User

def validate_video_file(value):
    import os
    from django.core.exceptions import ValidationError
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.mp4', '.webm']
    if ext not in valid_extensions:
        raise ValidationError('Unsupported file format. Use MP4 or WebM.')

class Video(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    video_file = models.FileField(upload_to='videos/', validators=[validate_video_file])
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class UserVideoList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='video_list')
    video = models.ForeignKey(Video, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'video']

    def __str__(self):
        return f"{self.user.username}'s list: {self.video.title}"

class VideoProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    video = models.ForeignKey(Video, on_delete=models.CASCADE)
    progress = models.FloatField(default=0.0)  # Percentage (0-100)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'video']

    def __str__(self):
        return f"{self.user.username}'s progress on {self.video.title}: {self.progress}%"