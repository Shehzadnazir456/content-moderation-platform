from rest_framework import serializers
from .models import CategoryResult, ImageResult, Submission


class CategoryResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryResult
        fields = ['category', 'detected', 'confidence', 'reasoning']


class AppealStatusSerializer(serializers.Serializer):
    """Minimal inline representation of an appeal attached to an image result."""
    id = serializers.IntegerField()
    status = serializers.CharField()


class ImageResultSerializer(serializers.ModelSerializer):
    categories = CategoryResultSerializer(many=True, read_only=True)
    appeal = serializers.SerializerMethodField()

    class Meta:
        model = ImageResult
        fields = ['id', 'image', 'outcome', 'categories', 'policy_snapshot', 'created_at', 'appeal']

    def get_appeal(self, obj):
        if hasattr(obj, 'appeal'):
            return AppealStatusSerializer(obj.appeal).data
        return None


class SubmissionSerializer(serializers.ModelSerializer):
    images = ImageResultSerializer(many=True, read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'user', 'images', 'created_at']
