from rest_framework import serializers
from .models import Appeal


class AppealSerializer(serializers.ModelSerializer):
    image_result_outcome = serializers.SerializerMethodField()
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = Appeal
        fields = '__all__'
        read_only_fields = ['user', 'status', 'admin_response', 'reviewed_by', 'reviewed_at']

    def get_image_result_outcome(self, obj):
        try:
            return obj.image_result.outcome
        except Exception:
            return None

    def get_user_details(self, obj):
        try:
            return {'username': obj.user.username, 'email': obj.user.email}
        except Exception:
            return None
