from collections import Counter

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.submissions.models import Submission, ImageResult, CategoryResult
from apps.appeals.models import Appeal
from apps.users.models import User


class AnalyticsView(APIView):
    def get(self, request):
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 1. Submission volume by date
        submission_rows = Submission.objects.values('created_at')
        date_counts = Counter(row['created_at'].date() for row in submission_rows)
        submission_volume = [
            {'date': str(d), 'count': c}
            for d, c in sorted(date_counts.items())
        ]

        # 2. Verdict distribution by outcome
        outcome_rows = ImageResult.objects.values('outcome')
        outcome_counts = Counter(row['outcome'] for row in outcome_rows)
        verdict_by_outcome = [
            {'outcome': outcome, 'count': count}
            for outcome, count in outcome_counts.items()
        ]

        # 3. Detections by category (only detected=True)
        cat_rows = CategoryResult.objects.values('category', 'detected')
        detected_categories = [row['category'] for row in cat_rows if row['detected']]
        category_counts = Counter(detected_categories)
        verdict_by_category = [
            {'category': cat, 'count': count}
            for cat, count in sorted(category_counts.items(), key=lambda x: -x[1])
        ]

        # 4. Appeal stats by status
        appeal_rows = Appeal.objects.values('status')
        appeal_status_counts = Counter(row['status'] for row in appeal_rows)
        appeal_stats = [
            {'status': status_val, 'count': count}
            for status_val, count in appeal_status_counts.items()
        ]

        # Build a user_id -> username lookup once, reused below (avoids any FK join)
        user_id_to_username = dict(User.objects.values_list('id', 'username'))

        # 5. Top users by submissions
        submission_user_ids = Submission.objects.values('user_id')
        user_submission_counts = Counter(row['user_id'] for row in submission_user_ids)
        top_by_submissions = [
            {'user__username': user_id_to_username.get(uid, 'Unknown'), 'count': count}
            for uid, count in sorted(user_submission_counts.items(), key=lambda x: -x[1])[:10]
        ]

        # 6. Top users by violations (flagged + blocked)
        violation_submission_ids = (
            ImageResult.objects
            .filter(outcome__in=['flagged', 'blocked'])
            .values('submission_id')
        )
        violation_counts_by_submission = Counter(
            row['submission_id'] for row in violation_submission_ids
        )
        submission_id_to_user_id = dict(Submission.objects.values_list('id', 'user_id'))

        user_violation_counts = Counter()
        for sub_id, count in violation_counts_by_submission.items():
            uid = submission_id_to_user_id.get(sub_id)
            if uid is not None:
                user_violation_counts[uid] += count

        top_by_violations = [
            {'submission__user__username': user_id_to_username.get(uid, 'Unknown'), 'count': count}
            for uid, count in sorted(user_violation_counts.items(), key=lambda x: -x[1])[:10]
        ]

        return Response({
            'submission_volume':   submission_volume,
            'verdict_by_outcome':  verdict_by_outcome,
            'verdict_by_category': verdict_by_category,
            'appeal_stats':        appeal_stats,
            'top_by_submissions':  top_by_submissions,
            'top_by_violations':   top_by_violations,
        })