from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Submission, ImageResult, CategoryResult
from .serializers import SubmissionSerializer
from .services import moderate_image


class SubmissionView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        files = request.FILES.getlist('images')
        if not files:
            return Response(
                {'detail': 'No images provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission = Submission.objects.create(user=request.user)

        for file in files:
            image_bytes = file.read()
            mime_type = file.content_type or 'image/jpeg'

            try:
                outcome, category_results, policy_snapshot = moderate_image(image_bytes, mime_type)
            except Exception as e:
                import traceback
                print('=== MODERATION ERROR ===')
                print(f'Exception type: {type(e).__name__}')
                print(f'Exception repr: {e!r}')
                traceback.print_exc()
                print('=========================')
                submission.delete()
                return Response(
                    {'detail': f'AI moderation error: {type(e).__name__}: {e!r}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Reset file pointer before saving to ImageField
            file.seek(0)

            image_result = ImageResult.objects.create(
                submission=submission,
                image=file,
                outcome=outcome,
                policy_snapshot=policy_snapshot,
            )

            for cat in category_results:
                CategoryResult.objects.create(
                    image_result=image_result,
                    category=cat['category'],
                    detected=cat['detected'],
                    confidence=cat['confidence'],
                    reasoning=cat['reasoning'],
                )

        serializer = SubmissionSerializer(submission)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        qs = Submission.objects.filter(user=request.user).order_by('-created_at')

        outcome = request.query_params.get('outcome')
        category = request.query_params.get('category')
        from_dt = request.query_params.get('from')
        to_dt = request.query_params.get('to')

        if outcome:
            qs = qs.filter(images__outcome=outcome)
        if category:
            qs = qs.filter(images__categories__category=category)
        if from_dt:
            qs = qs.filter(created_at__gte=from_dt)
        if to_dt:
            qs = qs.filter(created_at__lte=to_dt)

        serializer = SubmissionSerializer(qs.distinct(), many=True)
        return Response(serializer.data)
