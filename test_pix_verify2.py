import re

def pad(id_val, value):
    return f"{id_val}{len(value):02d}{value}"

def crc16(s):
    crc = 0xFFFF
    for ch in s:
        crc ^= ord(ch) << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) if (crc & 0x8000) else (crc << 1)
            crc &= 0xFFFF
    return f"{crc:04X}"

key='contato@lkmodas.com'
amount='1.00'
txid='PED-1776448850980'
merchantName='LK MODAS'
merchantCity='BRODOWSKI'
description='Pedido PED-1776448850980 - LK Modas'

payload=''
payload += pad('00','01')
payload += pad('01','12')
merchantAccountInfo = pad('00','BR.GOV.BCB.PIX') + pad('01', key) + pad('02', description)
payload += pad('26', merchantAccountInfo)
payload += pad('52','0000')
payload += pad('53','986')
payload += pad('54', amount)
payload += pad('58','BR')
payload += pad('59', merchantName)
payload += pad('60', merchantCity)
payload += pad('62', pad('05', txid))
payload += '6304'
crc = crc16(payload)
payload = payload[:-4] + crc
print(payload)
print('len', len(payload))
print('startswith', payload.startswith('000201'))
print('valid regex', bool(re.search(r'6304[0-9A-F]{4}$', payload)))
