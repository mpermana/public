from td.client import TDClient


# login to ameritrade using credentials
td_client = TDClient(
    client_id='YUVOTO7L0H3CF2QNUUFJ5CP3AR9GQORK',
    redirect_uri='http://erena.tenk.co/oauth',
    credentials_path='credentials.json'
)
td_client.login()
