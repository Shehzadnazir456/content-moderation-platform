from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.submissions.models import ImageResult
from .models import Appeal
from .serializers import AppealSerializer


class AppealCreateView(APIView):
    def post(self, request):
        image_result_id = request.data.get('image_result_id')
        justification = request.data.get('justification', '').strip()

        if not justification:
            return Response(
                {'detail': 'Justification is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            image_result = ImageResult.objects.get(
                id=image_result_id,
                submission__user=request.user,
            )
        except ImageResult.DoesNotExist:
            return Response(
                {'detail': 'Image result not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if image_result.outcome == 'approved':
            return Response(
                {'detail': 'Cannot appeal an approved image.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(image_result, 'appeal'):
            return Response(
                {'detail': 'An appeal already exists for this image.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appeal = Appeal.objects.create(
            image_result=image_result,
            user=request.user,
            justification=justification,
        )
        serializer = AppealSerializer(appeal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyAppealsView(APIView):
    def get(self, request):
        appeals = Appeal.objects.filter(user=request.user).order_by('-created_at')
        serializer = AppealSerializer(appeals, many=True)
        return Response(serializer.data)


class AdminAppealQueueView(APIView):
    def get(self, request):
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        appeals = (
            Appeal.objects.filter(status='pending')
            .select_related('user', 'image_result')
            .order_by('created_at')
        )
        serializer = AppealSerializer(appeals, many=True)
        return Response(serializer.data)


class AdminAppealReviewView(APIView):
    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            appeal = Appeal.objects.get(pk=pk)
        except Appeal.DoesNotExist:
            return Response(
                {'detail': 'Appeal not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get('status')
        if new_status not in ('accepted', 'rejected'):
            return Response(
                {'detail': 'Status must be "accepted" or "rejected".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appeal.status = new_status
        appeal.admin_response = request.data.get('admin_response', '')
        appeal.reviewed_by = request.user
        appeal.reviewed_at = timezone.now()
        appeal.save()

        if new_status == 'accepted':
            appeal.image_result.outcome = 'approved'
            appeal.image_result.save()

        serializer = AppealSerializer(appeal)
        return Response(serializer.data)
