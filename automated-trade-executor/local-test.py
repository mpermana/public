'''
cp /home/mpermana/secrets/ameritrade/credentials-mpermana.json /tmp/credentials.json
'''
def patch_s3_client():
    import boto3.s3.inject
    from boto3 import client
    s3_client = client('s3')
    def download_file(*args, **kwargs):
        print(args, kwargs)
    boto3.s3.inject.download_file = download_file

patch_s3_client()
from lambda_handler import process
from lambda_handler import configuration
configuration['account_id'] = 865770460
configuration['trade_window_start_time_hhmm_cst'] = 830
configuration['trade_window_end_time_hhmm_cst'] = 1500
process('Alert: New symbol: AAPL were added to Buy Alert NEW2')