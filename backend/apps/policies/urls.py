from django.urls import path
from .views import PolicyListView, PolicyDetailView

urlpatterns = [
    path('',                PolicyListView.as_view()),
    path('<str:category>/', PolicyDetailView.as_view()),
]
