from os import environ
from requests import get
from sys import argv


paused = True


def lambda_handler(event, context):
    subject = event['Records'][0]['ses']['mail']['commonHeaders']['subject']
    print('subject', subject)
    headers = {
        'authorization': environ['AUTHORIZATION'],
        'subject': subject
    }
    mpermana_function_url = 'https://nboyu5xx4kerxaycw7gdll46ni0fvlmw.lambda-url.us-west-2.on.aws/'
    doug_function_url = 'https://vi6zn4upzqcdawt6eyjbtm6uoe0avewf.lambda-url.us-east-2.on.aws/'
    function_url = doug_function_url
    if paused:
        print('lambda_handler is paused')
        return
    print(function_url, subject)
    response = get(function_url, headers=headers)
    print(response.content)

if __name__ == '__main__':
    subject = argv[1] if argv[1:] else 'subject from email-alert/lambda_handler.py'
    event = {'Records': [{'ses': {'mail': {'commonHeaders': {'subject': subject}}}}]}
    lambda_handler(event, None)
