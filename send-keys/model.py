data = [
    {
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

def mutexed_send_key(name, modifier, key, delay=2.51):
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
        mutexed_send_key("standard", None, c)
        i = (i + 1) % len(sequence)

thread1 = threading.Thread(target=task1, args=("Thread 1",))
# thread2 = threading.Thread(target=task, args=("Thread 2",))
thread1.start()
thread1.join()