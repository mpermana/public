from datetime import datetime
from pytz import timezone
from dateutil import tz

from os import listdir

cst_timezone  = timezone('America/Chicago')
utc_timezone  = timezone('UTC')

for filename in listdir('email'):
    date = datetime.strptime(filename, '%Y-%m-%d %H:%M:%S.%f')
    utc_date = utc_timezone.localize(date)
    cst_date = utc_date.astimezone(cst_timezone)
    print(cst_date, 'CST', ''.join([line for line in open('email/' + filename, 'r').read().splitlines() if line.startswith('Subject: Alert:')]))
