from django.conf import settings
from django.db import models


class Submission(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'submissions'

    def __str__(self):
        return f'Submission {self.id} by {self.user}'


class ImageResult(models.Model):
    OUTCOME_CHOICES = [
        ('approved', 'Approved'),
        ('flagged',  'Flagged'),
        ('blocked',  'Blocked'),
    ]

    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name='images',
    )
    image = models.ImageField(upload_to='submissions/')
    outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES)
    policy_snapshot = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'submissions'

    def __str__(self):
        return f'ImageResult {self.id} - {self.outcome}'


class CategoryResult(models.Model):
    image_result = models.ForeignKey(
        ImageResult,
        on_delete=models.CASCADE,
        related_name='categories',
    )
    category = models.CharField(max_length=50)
    detected = models.BooleanField()
    confidence = models.FloatField()
    reasoning = models.TextField()

    class Meta:
        app_label = 'submissions'

    def __str__(self):
        return f'{self.category} - {self.detected}'
