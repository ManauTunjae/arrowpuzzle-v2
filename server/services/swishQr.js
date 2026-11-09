// Simulated Swish. Fake number, no real payments.
import QRCode from 'qrcode';

const MESSAGE_MAX = 50; // Swish messages are short

export function swishMessage(orgName) {
  return `Tänd ett ljus – ${orgName}`.slice(0, MESSAGE_MAX);
}

// The text inside the QR code. Swish format: C<number>;<amount>;<message>;<locked fields>
export function swishQrText({ number, amount, message }) {
  return `C${number};${amount};${message};0`;
}

// Link for the "Open Swish" button on mobile.
export function swishLink({ number, amount, message }) {
  const data = {
    version: 1,
    payee: { value: number },
    amount: { value: amount },
    message: { value: message },
  };
  return `swish://payment?data=${encodeURIComponent(JSON.stringify(data))}`;
}

// QR code as an SVG string.
export function swishQrSvg(payment) {
  return QRCode.toString(swishQrText(payment), { type: 'svg', margin: 2, errorCorrectionLevel: 'M' });
}
