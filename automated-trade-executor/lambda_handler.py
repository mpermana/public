from logging import basicConfig, exception
basicConfig()

from boto3 import client
from dateutil import tz
from datetime import datetime
from itertools import chain
from pprint import pprint
from re import search
from td.client import TDClient
from time import sleep
from time import time

configuration = {
    'authorization': '# TODO',
    'account_id': '',
    'maximum_position_count': 6,
    'trade_size_type': 'TRADE_SIZE_DOLLAR',
    # trade_size_type can be:
    #   'TRADE_SIZE_DOLLAR',
    # for margin account
    #   'TRADE_SIZE_FRACTION_OF_INITIAL_BALANCE_BUYING_POWER',
    #   'TRADE_SIZE_FRACTION_OF_INITIAL_BALANCE_DAY_TRADING_BUYING_POWER',
    #   'TRADE_SIZE_FRACTION_OF_INITIAL_BALANCE_LIQUIDATION_VALUE'
    # for cash account
    #   'TRADE_SIZE_FRACTION_OF_INITIAL_BALANCE_CASH_AVAILABLE_FOR_TRADING'
    'trade_size_dollar': 1000,
    # If trade_size_quantity is set to an integer (i.e 100) then it is used
    # otherwise the quantity is set to the trade_size_dollar/quote price
    'trade_size_quantity': 1,
    'trade_size_fraction_of_initial_balance': 1/6,
    'trade_window_start_time_hhmm_cst': 900,
    'trade_window_end_time_hhmm_cst': 1130,
    'liquidate_position_start_time_window_hhmm_cst': 1455,
    'liquidate_position_end_time_window_hhmm_cst': 1500,
    # enter_position can have values: 'place_order_and_chase' or 'place_market_order_and_stop_loss'
    'enter_position': 'place_market_order_and_stop_loss',
    # polling_interval_seconds and polling_seconds is for place_order_and_chase, it place limit order then polls the order and chase the price with new price until it is filled
    'polling_interval_seconds': 5,
    'polling_seconds': 60,
    'stop_loss_percentage': 3,
    'price': 'buy_at_bid_short_at_ask'    
}

strategy_instruction = {
    'long': ('BUY', 'SELL'),
    'short': ('SELL_SHORT', 'BUY_TO_COVER')
}

# download credentials
s3_client = client('s3')
s3_client.download_file('TODO', 'credentials.json', '/tmp/credentials.json')


# login to ameritrade using credentials
td_client = TDClient(
    client_id='YUVOTO7L0H3CF2QNUUFJ5CP3AR9GQORK',
    redirect_uri='http://erena.tenk.co/oauth',
    credentials_path='/tmp/credentials.json'
)
td_client.login()

def get_account():
    return td_client.get_accounts(configuration['account_id'], fields=['positions'])

def get_order_symbols():
    return set([
        order_leg.get('instrument', {}).get('symbol')
        for order_leg in chain.from_iterable(
            [order.get('orderLegCollection', []) for order in td_client.get_orders(configuration['account_id'])]
        )
    ])

def get_quote(symbol):
    quote = td_client.get_quotes([symbol])[symbol]
    return quote

def place_order(order):
    print('Order:', order)
    execution = td_client.place_order(configuration['account_id'], order)
    print('Execution:', execution)
    return execution

def parse_alert(text):
    pattern = r'symbols?: (.*) (was|were) added to (Buy|Sell)'
    matches = search(pattern, text)
    buy_sell = matches.group(3).upper()
    if buy_sell == 'BUY':
        strategy = 'long'
    elif buy_sell == 'SELL':
        strategy = 'short'
    else:
        raise Exception('Invalid buy_sell strategy: %s' % text)
    return {
        'strategy': strategy,
        'symbols': list(map(lambda s: s.strip(), matches.group(1).split(',')))
    }

def make_order(symbol, price, stop_price, quantity, strategy='long', order_type='LIMIT'):
    # ensure 2 decimal price
    price = '%.2f' % price
    stop_price = '%.2f' % stop_price
    open_instruction, close_instruction = strategy_instruction[strategy]
    order = {
        "orderType": order_type,
        "session": "NORMAL",
        "price": price,
        "duration": "DAY",
        "orderStrategyType": "TRIGGER",
        "orderLegCollection": [
            {
                "instruction": open_instruction,
                "quantity": quantity,
                "instrument": {"symbol": symbol, "assetType": "EQUITY"},
            }
        ],
        "childOrderStrategies": [
            make_stop_loss_order(symbol, quantity, stop_price, close_instruction)
        ],
    }
    return order

def make_market_order(symbol, quantity, instruction='SELL'):
    '''
    instructions: 'BUY', 'SELL', 'SELL_SHORT', 'BUY_TO_COVER'
    '''
    order = {
        "orderType": "MARKET",
        "session": "NORMAL",
        "duration": "DAY",
        "orderStrategyType": "SINGLE",
        "orderLegCollection": [
            {
                "instruction": instruction,
                "quantity": quantity,
                "instrument": {"assetType": "EQUITY", "symbol": symbol},
            }
        ]
    }
    return order

def make_stop_loss_order(symbol, quantity, stop_price, instruction='SELL'):
    '''
    instructions: 'BUY', 'SELL', 'SELL_SHORT', 'BUY_TO_COVER'
    '''
    order = {
        "duration": "DAY",
        "orderType": "STOP",
        "session": "NORMAL",
        "stopPrice": stop_price,
        "stopType": "STANDARD",
        "orderStrategyType": "SINGLE",
        "orderLegCollection": [
            {
                "instruction": instruction,
                "quantity": quantity,
                "instrument": {"assetType": "EQUITY", "symbol": symbol},
            }
        ]
    }
    return order


def get_position_symbols(asset_type_filter=['EQUITY']):
    account = get_account()
    return [
        position['instrument']['symbol']
        for position in account['securitiesAccount'].get('positions', [])
        if position['instrument']['assetType'] in asset_type_filter
    ]

def get_account_initial_balance(key='buyingPower'):
    '''
    key can be 'accountValue', 'accruedInterest', 'availableFundsNonMarginableTrade', 
    'bondValue', 'buyingPower', 'cashAvailableForTrading', 'cashBalance', 'cashReceipts',
    'dayTradingBuyingPower', 'dayTradingBuyingPowerCall', 'dayTradingEquityCall', 'equity',
    'equityPercentage', 'isInCall', 'liquidationValue', 'longMarginValue', 'longOptionMarketValue',
    'longStockValue', 'maintenanceCall', 'maintenanceRequirement', 'margin', 'marginBalance',
    'marginEquity', 'moneyMarketFund', 'mutualFundValue', 'pendingDeposits', 'regTCall', 'shortBalance',
    'shortMarginValue', 'shortOptionMarketValue', 'shortStockValue', 'totalCash'
    '''
    account = get_account()
    return account['securitiesAccount']['initialBalances'][key]

def get_price_and_stop_price_and_quantity(symbol, strategy):
    if configuration['trade_size_type'] == 'TRADE_SIZE_DOLLAR':
        trade_size_dollar = configuration['trade_size_dollar']
    elif configuration['trade_size_type'] == 'TRADE_SIZE_FRACTION_OF_INITIAL_BALANCE_BUYING_POWER':
        trade_size_dollar = get_account_initial_balance('buyingPower') * configuration['trade_size_fraction_of_initial_balance']        
    elif configuration['trade_size_type'] == 'TRADE_SIZE_FRACTION_OF_INITIAL_BALANCE_DAY_TRADING_BUYING_POWER':
        trade_size_dollar = get_account_initial_balance('dayTradingBuyingPowerCall') * configuration['trade_size_fraction_of_initial_balance']        
    elif configuration['trade_size_type'] == 'TRADE_SIZE_FRACTION_OF_INITIAL_BALANCE_LIQUIDATION_VALUE':
        trade_size_dollar = get_account_initial_balance('liquidationValue') * configuration['trade_size_fraction_of_initial_balance']        
    elif configuration['trade_size_type'] == 'TRADE_SIZE_FRACTION_OF_INITIAL_BALANCE_CASH_AVAILABLE_FOR_TRADING':
        trade_size_dollar = get_account_initial_balance('cashAvailableForTrading') * configuration['trade_size_fraction_of_initial_balance']                
    else:
        raise Exception('Invalid trade_size_type: %s' % configuration)
    quote = get_quote(symbol)
    if strategy == 'long':
        price = quote['bidPrice'] if configuration['price'] == 'buy_at_bid_short_at_ask' else quote['askPrice']
        stop_price = price*(100-configuration['stop_loss_percentage'])/100
    else:
        price = quote['askPrice'] if configuration['price'] == 'buy_at_bid_short_at_ask' else quote['bidPrice']
        stop_price = price*(100+configuration['stop_loss_percentage'])/100
    quantity = configuration['trade_size_quantity'] or  int(trade_size_dollar / price)
    return price, stop_price, quantity

STATUS_CLOSED = ['CANCELED', 'FILLED', 'REJECTED']

def wait_until_order_in_status(order_id, in_status=STATUS_CLOSED, timeout_seconds=60):
    last_order = None
    start_time = time()
    while True:
        order = td_client.get_orders(configuration['account_id'], order_id)
        duration_seconds = time() - start_time
        if last_order != order:
            leg = order['orderLegCollection'][0]
        last_order = order
        if order['status'] in in_status:
            break
        if timeout_seconds is not None and duration_seconds > timeout_seconds:
            break
        sleep(1)
    return order

def create_stop_loss_for_symbol(symbol):
    account = get_account()
    for position in account['securitiesAccount'].get('positions', []):
        if position['instrument']['symbol'] == symbol:
            open_price = position['averagePrice']
            if position['longQuantity'] > 0:
                quantity = position['longQuantity']
                stop_loss_sign = -1
                instruction = 'SELL'
            if position['shortQuantity'] > 0:
                quantity = position['shortQuantity']
                stop_loss_sign = 1
                instruction = 'BUY_TO_COVER'
            stop_price = open_price*(100+stop_loss_sign*configuration['stop_loss_percentage'])/100
            stop_loss_order = make_stop_loss_order(symbol, quantity, f'{stop_price:.2f}', instruction)
            place_order(stop_loss_order)


def enter_position(symbol, strategy):
    price, stop_price, quantity = get_price_and_stop_price_and_quantity(symbol, strategy)
    if configuration['enter_position'] == 'place_order_and_chase':
        start_time = datetime.now()
        while (datetime.now() - start_time).total_seconds() < configuration['polling_seconds'] and is_within_trade_time_window():
            order = make_order(symbol, price, stop_price, quantity, strategy=strategy)
            placed_order = place_order(order)
            latest_order = wait_until_order_in_status(placed_order['order_id'], timeout_seconds=configuration['polling_interval_seconds'])
            if latest_order['status'] in STATUS_CLOSED:
                break
            else:
                cancel_order(latest_order)
    elif configuration['enter_position'] == 'place_market_order_and_stop_loss':
        open_instruction, close_instruction = strategy_instruction[strategy]
        market_order = make_market_order(symbol, quantity, instruction=open_instruction)
        placed_order = place_order(market_order)
        latest_order = wait_until_order_in_status(placed_order['order_id'])
        cancel_order(latest_order)
        create_stop_loss_for_symbol(symbol)
    else:
        raise Exception('Invalid place_order_function: %s' % configuration['place_order_function'])


        

def process(alert_text):
    alert = parse_alert(alert_text)
    print('proces alert:', alert)
    for symbol in alert['symbols']:
        position_symbols = get_position_symbols()
        print('current position_symbols', position_symbols)
        is_maximum_position_count_reached = len(position_symbols) >= configuration['maximum_position_count']
        if is_maximum_position_count_reached:
            print('Already have maximum_position_count:', configuration['maximum_position_count'], 'position_symbols:', position_symbols)
            break
        if symbol in ['GOOG', 'GOOGL']:
            is_new_symbol = 'GOOG' not in position_symbols and 'GOOGL' not in position_symbols
        else:
            is_new_symbol = symbol not in position_symbols 
        if symbol in get_order_symbols():
            print('Skipping because symbol already in the history:', symbol)
            break
        if is_new_symbol and is_within_trade_time_window():
            try:
                enter_position(symbol, alert['strategy'])
            except:
                exception('Place order may failed for %s', symbol)

def hhmm_to_minutes(hhmm: int) -> int:	
    return hhmm//100*60+hhmm%100

def is_within_trade_time_window():
    cst  = tz.gettz('America/Chicago')
    now = datetime.now(cst)
    now_minutes = now.hour*60+now.minute
    start_time_minutes = hhmm_to_minutes(configuration['trade_window_start_time_hhmm_cst'])
    end_time_minutes = hhmm_to_minutes(configuration['trade_window_end_time_hhmm_cst'])
    result = start_time_minutes <= now_minutes <= end_time_minutes
    print('is_within_trade_time_window: %s' % result)
    return result

def is_within_liquidate_position_time_window():
    cst  = tz.gettz('America/Chicago')
    now = datetime.now(cst)
    now_minutes = now.hour*60+now.minute
    start_time_minutes = hhmm_to_minutes(configuration['liquidate_position_start_time_window_hhmm_cst'])
    end_time_minutes = hhmm_to_minutes(configuration['liquidate_position_end_time_window_hhmm_cst'])
    result = start_time_minutes <= now_minutes <= end_time_minutes
    print('is_within_liquidate_position_time_window: %s' % result)
    return result

def cancel_order(order):
    open_order_status = [
        'AWAITING_PARENT_ORDER',
        'AWAITING_CONDITION',
        'AWAITING_MANUAL_REVIEW',
        'AWAITING_UR_OUT',
        'PENDING_ACTIVATION',
        'QUEUED',
        'WORKING',
        'PENDING_CANCEL',
        'PENDING_REPLACE'
    ]
    if order['status'] in open_order_status:
        print('Cancelling order', order['orderId'], order['status'])
        td_client.cancel_order(configuration['account_id'], order['orderId'])

def cancel_orders():
    orders = td_client.get_orders(configuration['account_id'])
    for order in orders:
        for child_order in order.get('childOrderStrategies', []):
            cancel_order(child_order)
        cancel_order(order)

def liquidate_positions():
    if is_within_liquidate_position_time_window():
        print('Liquidating positions')
        cancel_orders()
        sleep(10)
        account = get_account()
        for position in account['securitiesAccount'].get('positions', []):
            symbol = position['instrument']['symbol']        
            try:
                pprint(position)
                if position['instrument']['assetType'] == 'EQUITY':
                    if position['longQuantity'] > 0:
                        place_order(make_market_order(symbol, position['longQuantity'], 'SELL'))
                    if position['shortQuantity'] > 0:
                        place_order(make_market_order(symbol, position['shortQuantity'], 'BUY_TO_COVER'))
            except:
                exception('Unable to liquidate %s', symbol)

def process_subject_alert(subject):
    if subject and is_within_trade_time_window():
        process(subject)

def lambda_handler(event, context):
    if not configuration['account_id']:
        print('Account ID should be configured')
        return
    if event['headers'].get('authorization') != configuration['authorization']:
        return {
            'error': 'Invalid authorization header'
        }
    command = event['headers'].get('command', 'process_subject_alert')
    if command == 'liquidate_positions':
        liquidate_positions()
    elif command == 'process_subject_alert':
        process_subject_alert(event['headers'].get('subject'))
    return 'OK'

if __name__ == '__main__':
    # process('Alert: New symbol: AAPL were added to Buy Alert NEW2')
    pass
