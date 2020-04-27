import logging
def setup_logging():
    from logging import Formatter
    from logging import getLogger
    from logging import StreamHandler

    formatter = Formatter('%(asctime)s %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    stream_handler = StreamHandler()
    stream_handler.setFormatter(formatter)

    logger = getLogger()
    logger.addHandler(stream_handler)
    logger.setLevel(20)
setup_logging()

import asyncio
from aiosmtpd.controller import Controller
from datetime import datetime
from os import environ
from requests import get
from time import time

from aiosmtpd.smtp import SMTP as SMTPServer
from aiosmtpd.smtp import Envelope as SMTPEnvelope
from aiosmtpd.smtp import Session as SMTPSession

mpermana_function_url = 'https://nboyu5xx4kerxaycw7gdll46ni0fvlmw.lambda-url.us-west-2.on.aws/'
doug_function_url = 'https://vi6zn4upzqcdawt6eyjbtm6uoe0avewf.lambda-url.us-east-2.on.aws/'
function_url = doug_function_url

if 'authorization' in environ:
    authorization = environ['authorization']
else:
    authorization = open('/var/smtp-alert-server/authorization', 'r').readlines()[0].strip()
    


def send_alert_subject(subject):
    headers = {
        'authorization': authorization,
        'subject': subject
    }
    logging.info('%s %s', function_url, subject)
    response = get(function_url, headers=headers)
    logging.info(response.content)


class SinkHandler:

    async def handle_DATA(
        self, server: SMTPServer, session: SMTPSession, envelope: SMTPEnvelope
    ) -> str:
        for line in envelope.content.splitlines():
            if line.startswith(b'Subject: Alert:'):
                send_alert_subject(line.decode()[len('Subject :'):])
        return "250 OK"


async def test_alert():
    handler = SinkHandler()
    envelope = SMTPEnvelope()
    envelope.content = b'Subject: test subject'
    await handler.handle_DATA(None, None, envelope)    


async def amain():
    handler = SinkHandler()
    cont = Controller(handler, hostname='0.0.0.0', port=25)
    cont.start()


if __name__ == '__main__':
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.create_task(amain())
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        print("User abort indicated")
