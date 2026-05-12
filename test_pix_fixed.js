// Teste do payload Pix corrigido
function buildPixPayload({ key, amount, txid, merchantName, merchantCity, description }) {
  function pad(id, value) {
    const length = String(value).length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  }

  function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  // Merchant Account Information (ID 26)
  const merchantAccountInfo = pad('00', 'BR.GOV.BCB.PIX') + pad('01', key);
  const merchantAccountInfoField = pad('26', merchantAccountInfo);

  // Additional Data Field (ID 62)
  let additionalData = pad('05', txid);
  if (description) {
    additionalData += pad('06', description);
  }
  const additionalDataField = pad('62', additionalData);

  // Monta o payload sem CRC16 primeiro
  let payload = '';
  payload += pad('00', '01');  // Payload Format Indicator
  payload += pad('01', '12');  // Point of Initiation Method (12 = QR Code dinâmico)
  payload += merchantAccountInfoField;  // Merchant Account Information
  payload += pad('52', '0000');  // Merchant Category Code (0000 = outros)
  payload += pad('53', '986');   // Transaction Currency (986 = BRL)
  payload += pad('54', amount);  // Transaction Amount
  payload += pad('58', 'BR');    // Country Code
  payload += pad('59', merchantName);  // Merchant Name
  payload += pad('60', merchantCity);  // Merchant City
  payload += additionalDataField;  // Additional Data Field Template
  payload += '6304';  // CRC16 placeholder

  // Calcula CRC16 sobre o payload completo (incluindo '6304')
  const crc = crc16(payload);

  // Substitui os últimos 4 caracteres (CRC placeholder) pelo CRC calculado
  return payload.slice(0, -4) + crc;
}

// Teste com dados reais
const testData = {
  key: 'contato@lkmodas.com',
  amount: '299.90',
  txid: 'PIX-abc123-def456-0001-ABCDEF',
  merchantName: 'LK MODAS',
  merchantCity: 'BRODOWSKI',
  description: 'Pedido LK-2026-001 - LK Modas'
};

const payload = buildPixPayload(testData);
console.log('=== PAYLOAD PIX GERADO ===');
console.log('Payload:', payload);
console.log('Tamanho:', payload.length, 'caracteres');
console.log('Começa com 000201:', payload.startsWith('000201'));
console.log('Contém 6304:', payload.includes('6304'));
console.log('Últimos 4 caracteres (CRC):', payload.slice(-4));

// Validação básica
const isValid = payload.startsWith('000201') &&
                payload.includes('6304') &&
                payload.length <= 336;

console.log('Payload válido:', isValid);

// Teste do CRC16
function validateCrc16(payload) {
  function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  const calculatedCrc = crc16(payload);
  const providedCrc = payload.slice(-4);
  return calculatedCrc === providedCrc;
}

console.log('CRC16 válido:', validateCrc16(payload));