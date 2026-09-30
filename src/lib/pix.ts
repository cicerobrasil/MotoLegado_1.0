/**
 * Utilitário Oficial de PIX Padrão Banco Central do Brasil (EMV / BR Code)
 * MotoLegado - Configuração do Titular e Geração de Payload
 */

export const OFFICIAL_PIX_CONFIG = {
  keyType: 'Celular',
  key: '+5547991362628',
  displayKey: '(47) 99136-2628',
  receiverName: 'Cicero Ranieri Brasil',
  receiverCity: 'Itajaí - SC',
  cityBacen: 'ITAJAI',
  whatsappNumber: '5547991362628',
  annualAmount: 299.00,
};

function emvField(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return id + len + value;
}

export function crc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera a string Pix Copia e Cola Oficial compatível com todos os bancos
 */
export function generateBacenPixPayload(options?: {
  key?: string;
  name?: string;
  city?: string;
  amount?: number;
  txid?: string;
}): string {
  const key = options?.key || OFFICIAL_PIX_CONFIG.key;
  const name = (options?.name || OFFICIAL_PIX_CONFIG.receiverName).slice(0, 25).toUpperCase();
  const city = (options?.city || OFFICIAL_PIX_CONFIG.cityBacen).slice(0, 15).toUpperCase();
  const amount = (options?.amount !== undefined ? options.amount : OFFICIAL_PIX_CONFIG.annualAmount).toFixed(2);
  const txid = (options?.txid || 'MOTOLEGADO').slice(0, 25);

  const mai = emvField('00', 'br.gov.bcb.pix') + emvField('01', key);
  const addData = emvField('05', txid);

  let payload = 
    emvField('00', '01') +
    emvField('26', mai) +
    emvField('52', '0000') +
    emvField('53', '986') +
    emvField('54', amount) +
    emvField('58', 'BR') +
    emvField('59', name) +
    emvField('60', city) +
    emvField('62', addData) +
    '6304';

  payload += crc16(payload);
  return payload;
}

/**
 * Retorna a URL da imagem do QR Code legível por câmera e apps bancários
 */
export function getPixQrCodeUrl(payload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(payload)}`;
}

/**
 * Gera o link direto para WhatsApp com mensagem pré-configurada
 */
export function getWhatsAppReceiptUrl(pilotName?: string, pilotEmail?: string, amount = 299.00): string {
  const name = pilotName || 'Piloto';
  const email = pilotEmail || 'Não informado';
  const message = `Olá Cícero! Acabei de realizar o pagamento do Plano Anual MotoLegado VIP Pro via PIX (R$ ${amount.toFixed(2).replace('.', ',')}).\n\nNome: ${name}\nE-mail da conta: ${email}\n\nSegue em anexo o comprovante para ativação da minha conta!`;
  return `https://wa.me/${OFFICIAL_PIX_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
