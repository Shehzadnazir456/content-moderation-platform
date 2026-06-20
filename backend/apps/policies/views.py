from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Policy, CATEGORY_CHOICES
from .serializers import PolicySerializer


class PolicyListView(APIView):
    def get(self, request):
        # Seed defaults for all categories
        for category, _ in CATEGORY_CHOICES:
            Policy.objects.get_or_create(category=category)

        policies = Policy.objects.all()
        serializer = PolicySerializer(policies, many=True)
        return Response(serializer.data)


class PolicyDetailView(APIView):
    def patch(self, request, category):
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        policy, _ = Policy.objects.get_or_create(category=category)
        serializer = PolicySerializer(policy, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
