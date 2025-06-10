data = [
    {
        "run": True,
        "name": "Fire Spammer",
        "sequence": "211111-101111110^143@34"
    },
    {
        "name": "BLM Ley Lines",
        "sequence": "^1",
        "interval_seconds": 120,
        "last_timestamp": None
    }
]

def enqueue(key):
    pass

import threading
import time

mutex = threading.Lock()

from utility import send_key, is_final_fantasy_active

def mutexed_send_key(modifier, key, delay=2.51):
    start_time = time.time()
    with mutex:
        send_key(modifier, key)
        elapsed_time = time.time() - start_time
        wait_time = delay - elapsed_time
        if wait_time > 0:
            time.sleep(wait_time)

def mutexed_send_key_checkff14(modifier, key, delay=2.51):
    with mutex:
        while not is_final_fantasy_active():
            time.sleep(0.1)
        send_key(modifier, key)
        time.sleep(delay)


def task1(*args, **kwargs):
    i = 0
    sequence = data[0]['sequence']
    while True:
        c = sequence[i]
        mutexed_send_key(None, c)
        i = (i + 1) % len(sequence)

if __name__ == '__main__':
    thread1 = threading.Thread(target=task1, args=("Thread 1",))
    # thread2 = threading.Thread(target=task, args=("Thread 2",))
    thread1.start()
    thread1.join()