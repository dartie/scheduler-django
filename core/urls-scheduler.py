"""core URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from rest_framework.authtoken.views import obtain_auth_token            # <-- Request Token
from scheduler.views import view_jobs, load_jobs_ajax, schedule_job, delete_job, reset_db
from scheduler import views as scheduler_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),  # <-- Request Token


    # Scheduler
    path('api/schedule-job/', scheduler_views.ScheduleJob.as_view(), name='api-schedule-job'),  # API
    path('jobs/', view_jobs, name='view-jobs'),
    path('load-jobs/', load_jobs_ajax, name='load-jobs'),
    path('schedule-job/', schedule_job, name='schedule-job'),
    path('delete-job/', delete_job, name='delete-job'),
    path('reset-db/', reset_db, name='reset-db'),

]
