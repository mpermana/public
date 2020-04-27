'''
Usage:
- modify airflow.cfg api to use this module as auth, take care your PYTHONPAH and module packaging:
  [api]
  auth_backend = airflow_token_auth
- create the user and set the password to unhashed token, this example assume you already have user with id=userid:
  from airflow import settings
  session = settings.Session()
  user = session.query(PasswordUser).get(userid)
  user._password = 'yourtoken'
  session.commit()
- use -H 'Authorization: Bearer yourtoken' when calling API
'''
from airflow.utils.db import create_session
from flask import make_response
from flask import request
from functools import wraps
from .password_auth import PasswordUser


CLIENT_AUTH = None

def init_app(_):
    """Initializes backend"""


def authenticate(session, token):
    user = session.query(PasswordUser).filter(
        PasswordUser.password == token
    ).first()
    return user


def requires_authentication(function):
    @wraps(function)
    def decorated(*args, **kwargs):
        header = request.headers.get('Authorization')
        if header:
            token = ''.join(header.split()[1:])
            with create_session() as session:
                user = authenticate(session, token)
                if user:
                    response = function(*args, **kwargs)
                    response = make_response(response)
                    return response
        return Response('Unauthorized', 401)
    return decorated
