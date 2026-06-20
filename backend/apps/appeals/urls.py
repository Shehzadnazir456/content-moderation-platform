from django.urls import path
from .views import AppealCreateView, MyAppealsView, AdminAppealQueueView, AdminAppealReviewView

urlpatterns = [
    path('',          AppealCreateView.as_view()),
    path('mine/',     MyAppealsView.as_view()),
    path('queue/',    AdminAppealQueueView.as_view()),
    path('<int:pk>/', AdminAppealReviewView.as_view()),
]
