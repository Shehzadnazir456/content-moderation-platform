from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/auth/',        include('apps.users.urls')),
    path('api/submissions/', include('apps.submissions.urls')),
    path('api/appeals/',     include('apps.appeals.urls')),
    path('api/policies/',    include('apps.policies.urls')),
    path('api/analytics/',   include('apps.analytics.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
