from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

def validate_video_file(value):
    import os
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
    duration = models.FloatField(default=0.0, help_text="Video duration in seconds")

    def __str__(self):
        return self.title

class UserVideoList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='video_list')
    video = models.ForeignKey(Video, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'video']
        indexes = [
            models.Index(fields=['user', 'video']),
        ]

    def __str__(self):
        return f"{self.user.username}'s list: {self.video.title}"

class VideoProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    video = models.ForeignKey(Video, on_delete=models.CASCADE)
    progress = models.FloatField(default=0.0)  # Percentage (0-100)
    last_watched_position = models.FloatField(default=0.0)  # Seconds
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'video']
        indexes = [
            models.Index(fields=['user', 'video']),
        ]

    def __str__(self):
        return f"{self.user.username}'s progress on {self.video.title}: {self.progress}%"

class VideoProgressInterval(models.Model):
    progress = models.ForeignKey(VideoProgress, on_delete=models.CASCADE, related_name='intervals')
    start_time = models.FloatField()  # Seconds
    end_time = models.FloatField()   # Seconds

    class Meta:
        indexes = [
            models.Index(fields=['progress', 'start_time', 'end_time']),
        ]

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("Start time must be less than end time")
        if self.start_time < 0 or self.end_time > self.progress.video.duration:
            raise ValidationError("Interval out of video duration")
        existing_intervals = self.progress.intervals.filter(
            start_time__lte=self.end_time,
            end_time__gte=self.start_time
        )
        if existing_intervals.exists():
            raise ValidationError("Interval overlaps with existing watched section")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.start_time}, {self.end_time}] for {self.progress.video.title}"