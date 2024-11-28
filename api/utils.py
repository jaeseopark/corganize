import logging
from random import sample
import threading
import traceback
import os
import time
from typing import List

logger = logging.getLogger("corganize")


def run_on_interval(func, interval_seconds, initial_delay_seconds=0):
    logger.info(f"Scheduling... {func.__name__=}")

    def run_func():
        threading.Timer(interval_seconds, run_func).start()
        try:
            func()
        except:
            # TODO: better error handling
            traceback.print_exc()

    threading.Timer(initial_delay_seconds, run_func).start()


def run_back_to_back(func, pause_seconds: int, initial_delay_seconds=0):
    logger.info(f"Scheduling... {func.__name__=}")

    def run_func():
        try:
            func()
        except:
            # TODO: better error handling
            traceback.print_exc()
        threading.Timer(pause_seconds, run_func).start()

    threading.Timer(initial_delay_seconds, run_func).start()


def get_shuffled_copy(original_list: list):
    return list(sample(original_list, len(original_list)))


def get_old_files(directory_path: str, age_seconds: int) -> List[str]:
    current_time = time.time()
    old_files = []
    for filename in os.listdir(directory_path):
        file_path = os.path.join(directory_path, filename)
        if os.path.isfile(file_path):
            file_mod_time = os.path.getmtime(file_path)
            if current_time - file_mod_time > age_seconds:
                old_files.append(filename)

    return old_files


def get_epoch_millis() -> int:
    current_time_seconds = time.time()
    return int(current_time_seconds * 1000)
