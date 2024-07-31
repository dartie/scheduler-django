import datetime

from .models import Jobs
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated  # <-- Auth

import os
import re
import json
import uuid
import subprocess
import dateutil.parser
from pathlib import Path

from common import run_process, queryset_to_dict

jobs_output_folder = os.path.join(os.path.dirname(os.path.realpath(__file__)), "jobs_output")


def get_current_path():
    return os.path.dirname(os.path.realpath(__file__))


def reset_db(request):
    try:
        Jobs.objects.all().delete()
        response = {
            "status": 0
        }
    except:
        response = {
            "status": 1,
            "error": ""
    }

    return JsonResponse(response)


def delete_job(request):
    job_id = request.POST.get("job_id")

    cmd = f"atrm {job_id}"

    p = subprocess.run(cmd, shell=True, text=True, universal_newlines=True, capture_output=True)
    p_rc, p_out, p_err = p.returncode, p.stdout, p.stderr

    if p_rc == 0:
        job_to_delete = Jobs.objects.get(id=job_id)
        job_to_delete.status = 10
        job_to_delete.save()

        response = {
            "status": 0
        }
    else:
        response = {
            "status": 1,
            "error": p_err
        }

    return JsonResponse(response)


def schedule_job(request, api=False):
    if api:
        command = request.data.get("command")
        date_time = request.data.get("schedule_datetime")
        datetime_mode = "absolute"
    else:
        command = request.POST.get("command")
        datetime_mode = request.POST.get("schedule_time_mode")
        date_time = request.POST.get("schedule_datetime")

    if datetime_mode == "absolute":
        date_time_datetime = dateutil.parser.parse(date_time)

        schedule_time_at_string = f"{date_time_datetime.strftime("%H:%M %Y-%m-%d")}"
    else:
        # relative
        schedule_time_at_string = request.POST.get("schedule_relative_time")

    schedule_datetime_for_now = datetime.datetime.now()  # datetime to use if "now" is used as relative time schedule

    # set full path for file where the output command has to be stored
    task_output_file = f"{uuid.uuid4()}.txt"
    cmd = f'echo "{command}" | at {schedule_time_at_string}'
    command_string = r"""echo "current_job_id=\$(atq | awk '{system(\"echo \"\$1 \"  \$(date +%Y-%m-%d_%H-%M-%S --date \\\"\"\$2\" \"\$3\" \"\$4\" \"\$5\" \"\$6\"\\\")  \"\$7\"  \"\$8 )}' | sort -k2 | perl -ne'(\$q,\$j)=/((\d+).*)/;qx(at -c \$j)=~/(marcinDEL\w+).\n(.*?)\n\1/s;print\"\$q \$2\"' | head -1 | awk '{print \$1}') ; bash -c \"curl --request POST --url http://localhost:9001/api/alm/salesforce/ --header 'Authorization: Token a775050e6ca5467bf7ec9c6529925e4af95a1142' --header 'Content-Type: application/json' --data '{\\\"generate\\\":{\\\"quantity\\\":10,\\\"product\\\":\\\"Helix ALM suite\\\",\\\"type\\\":\\\"Floating\\\",\\\"version\\\":\\\"Maint\\\",\\\"cloudkey\\\":false,\\\"expiration\\\":\\\"2024-12-18\\\"},\\\"job\\\": \$current_job_id }'\"" | at now +1 minute"""
    cmd = r"""echo "current_job_id=\$(atq | awk '{system(\"echo \"\$1 \"  \$(date +%Y-%m-%d_%H-%M-%S --date \\\"\"\$2\" \"\$3\" \"\$4\" \"\$5\" \"\$6\"\\\")  \"\$7\"  \"\$8 )}' | sort -k2 | perl -ne'(\$q,\$j)=/((\d+).*)/;qx(at -c \$j)=~/(marcinDEL\w+).\n(.*?)\n\1/s;print\"\$q \$2\"' | head -1 | awk '{print \$1}') ; bash -c \"""" + command + """ > """ + jobs_output_folder + """/out.txt\" | at """ + schedule_time_at_string
    cmd = r"""echo "current_job_id=\$(atq | awk '{system(\"echo \"\$1 \"  \$(date +%Y-%m-%d_%H-%M-%S --date \\\"\"\$2\" \"\$3\" \"\$4\" \"\$5\" \"\$6\"\\\")  \"\$7\"  \"\$8 )}' | sort -k2 | perl -ne'(\$q,\$j)=/((\d+).*)/;qx(at -c \$j)=~/(marcinDEL\w+).\n(.*?)\n\1/s;print\"\$q \$2\"' | head -1 | awk '{print \$1}') ; bash -c \"""" + command + """ > """ + os.path.join(jobs_output_folder, task_output_file) + """\" | at """ + schedule_time_at_string
    cmd = f'echo "{command} > {os.path.join(jobs_output_folder, task_output_file)}" | at {schedule_time_at_string}'

    p = subprocess.run(cmd, shell=True, text=True, universal_newlines=True, capture_output=True)

    p_rc, p_out, p_err = p.returncode, p.stdout, p.stderr

    if p_rc == 0:
        job_id = re.findall(r'job\s(\d+)\sat', p_err)
        if job_id:
            job_id = job_id[0]

            # Save to database. The only reason why is necessary at this stage is for coping with tasks having
            # "now" as relative time schedule. Otherwise, it would be lost and not stored in the database
            #if schedule_time_at_string.strip() == "now":
            new_task = Jobs.objects.create(
                id=job_id,
                schedule_datetime=schedule_datetime_for_now,
                command=command,
                output="",
                output_filename=task_output_file,
                status=1
            )

            new_task.save()

        else:
            job_id = ""
            print("couldn't detect job id")

        response = {
            "status": 0,
            "output": p_err,
            "job_id": job_id
        }
    else:
        response = {
            "status": 1,
            "output": p_err
        }

    return JsonResponse(response, status=200)


def get_last_job_id():
    last_job_id = -1  # init variable

    cmd = r"""atq | awk '{system("echo "$1 "  $(date +%Y-%m-%d_%H-%M-%S --date \""$2" "$3" "$4" "$5" "$6"\")  "$7"  "$8 )}' | sort -k2"""
    p = subprocess.run(cmd, shell=True, text=True, universal_newlines=True, capture_output=True)
    p_rc, p_out, p_err = p.returncode, p.stdout, p.stderr

    if p_out:
        p_out_lines = p_out.split("\n")
        if p_out_lines:
            last_job_line = p_out_lines[0]
            info_last_job = last_job_line.split("\t")
            if info_last_job:
                last_job_id = int(info_last_job[0])

    return last_job_id


def get_job_command(job_id):
    cmd = [
        "at",
        "-c",
        str(job_id)
    ]
    p_rc, p_out, p_err = run_process(cmd)

    # extract command from output
    re_matches = re.findall(r"marcinDELIMITER[\w]+'([\S\s]*)marcinDELIMITER[\w]+", p_out)
    job_command = ""  # init variable in case of missing match
    if re_matches:
        job_command = re_matches[0].strip()

    return job_command


def get_system_scheduled_jobs():
    cmd = 'atq'
    p_rc, p_out, p_err = run_process(cmd)

    if p_rc != 0:
        pass  # TODO: handle this case

    jobs_dict = {}
    jobs_list = []

    jobs_cmd_list = p_out.split("\n")
    for j in jobs_cmd_list:
        if j == '':
            continue
        job_info = j.split("\t")
        job_id = int(job_info[0])
        job_schedule_date_time = job_info[1].rsplit(" ", 2)[0]
        job_command = get_job_command(job_id)

        job_info_dict = {
            #"": "",  # empty element for row details in datatables
            "id": job_id,
            "scheduled_datetime": dateutil.parser.parse(job_schedule_date_time),
            "status": "Scheduled",
            "command": job_command,
            "output": "",
        }
        jobs_dict[job_id] = job_info_dict

        jobs_list.append(list(job_info_dict.values()))

    return jobs_list, jobs_dict


# Create your views here.
def view_jobs(request):
    return render(request, "jobs.html", {"manage_jobs": True})


def load_jobs():
    # get jobs from the database
    stored_jobs_dict = queryset_to_dict(Jobs.objects.all())

    scheduled_jobs_list, scheduled_jobs_dict = get_system_scheduled_jobs()

    # Get missing system jobs (atq) from the database -> store them
    missing_jobs_ids_from_db = list(set(list(scheduled_jobs_dict.keys())) - set(list(stored_jobs_dict.keys())))
    for db_missing_job_id in missing_jobs_ids_from_db:
        Jobs.objects.create(
            id=db_missing_job_id,
            schedule_datetime=scheduled_jobs_dict[db_missing_job_id]['scheduled_datetime'],
            command=scheduled_jobs_dict[db_missing_job_id]['command'],
            output=scheduled_jobs_dict[db_missing_job_id]['output'],
            status=0
        )

    # Get missing stored jobs from system jobs (atq) -> look for the output command (stored in the db) and update status
    missing_jobs_ids_from_system = list(set(list(stored_jobs_dict.keys())) - set(list(scheduled_jobs_dict.keys())))
    jobs_output_fullpath = os.path.join(Path(__file__).resolve().parent, "jobs_output")
    for system_missing_job_id in missing_jobs_ids_from_system:
        job_record_to_update = Jobs.objects.get(id=system_missing_job_id)

        # Get job output
        jobs_output_file = os.path.join(jobs_output_fullpath, job_record_to_update.output_filename)

        # if the output is not already stored in the database and the output is present in the output file,
        # store the output command in the database
        if job_record_to_update.output == "" and job_record_to_update.output_filename and os.path.exists(jobs_output_file):
            with open(jobs_output_file, "r", errors="ignore", encoding="utf-8") as read_job_output:
                job_output = read_job_output.read()
                # job_output = job_output.replace("\n", "<br>")
                job_record_to_update.output = job_output

        # TODO: detect if the job result is success or failed
        #job_record_to_update.status = 1

        job_record_to_update.save()


    # missing_jobs_ids_from_system = [x for x in list(stored_jobs_dict.keys()) if not list(scheduled_jobs_dict.keys())]
    #
    # jobs_dict = {**stored_jobs_dict, **scheduled_jobs_dict}
    # jobs_list = [list(x.values()) for x in list(jobs_dict.values())]

    jobs_dict = queryset_to_dict(Jobs.objects.values("id", "schedule_datetime", "status", "command", "output"))
    jobs_list = [list(x.values()) for x in list(jobs_dict.values())]

    return jobs_list, jobs_dict


def load_jobs_ajax(request):
    jobs_list, _ = load_jobs()

    # add empty element in the first position for datatable row detail feature
    # add icon element for actions on the datatable row
    datatable_jobs_list = []
    for j in jobs_list:
        datatable_jobs_list.append(["", "", *j])

    data = {"data": datatable_jobs_list}
    data_json = json.dumps(data, indent=4, sort_keys=True, default=str)

    return HttpResponse(data_json)


def schedule_job_api(request):  # TODO: to remove if unused
    print()


class ScheduleJob(APIView):
    permission_classes = (IsAuthenticated,)             # <-- Auth

    def post(self, request):
        return schedule_job(request, api=True)
