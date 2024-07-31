import datetime
import os
import subprocess
from colorama import Fore, Back, Style, init
from typing import Literal

# Init colorama
init()


def queryset_to_dict(queryset, key="id", state=False):
    data_dict = {}

    for data in queryset:
        if isinstance(data, dict):
            data_tmp_dict = data
        else:
            data_tmp_dict = data.__dict__

        if not state:
            if "_state" in data_tmp_dict:
                del data_tmp_dict["_state"]
        data_dict[data_tmp_dict[key]] = data_tmp_dict

    return data_dict


def run_process(cmd, cwd=None):
    shell = True if os.sep == "\\" else False
    result = subprocess.run(cmd, cwd=cwd, universal_newlines=True, shell=shell, capture_output=True)

    return result.returncode, result.stdout, result.stderr


def run_process_a(cmd):
    shell = True if os.sep == "\\" else False

    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=shell, universal_newlines=True, text=True)
    p_out, p_err = p.communicate()
    p_rc = p.returncode

    return p_rc, p_out, p_err


def print_log(message, status: Literal["success", "warning", "error", "info", "none"] = "success"):
    if status == "success":
        color = Fore.GREEN
    elif status == "warning":
        color = Fore.YELLOW
    elif status == "error":
        color = Fore.RED
    elif status == "info":
        color = Fore.CYAN
    else:
        color = ""
    print(f'{Style.BRIGHT}{color}{datetime.datetime.now().strftime("[%d/%b/%Y %H:%M:%S]")} {message}{Style.RESET_ALL}')
