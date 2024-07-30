from django.db import models

# Create your models here.


class Jobs(models.Model):
    id = models.IntegerField(primary_key=True, unique=True)
    schedule_datetime = models.DateTimeField()
    command = models.CharField(max_length=10000)
    output = models.CharField(max_length=10000)
    output_filename = models.CharField(max_length=50, default="")
    status = models.IntegerField()  # 0=Scheduled; 1=Executed Success; 2=Executed Failed; 10=Deleted
