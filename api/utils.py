import threading
import traceback

def run_on_interval(func, interval_seconds=600, initial_delay_seconds=0):
    def run_func():
        try:
            func()
        except:
            # TODO: better error handling 
            traceback.print_exc()
        threading.Timer(interval_seconds, run_func).start()

    threading.Timer(initial_delay_seconds, run_func).start()
