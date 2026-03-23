/**
 * Generates a dark-themed HTML string for an appointment receipt PDF,
 * matching the RapidCapsule app design language.
 * Uses inline styles only — no external resources needed.
 */

// Design tokens (mirroring src/theme/colors.ts)
const BG = '#151c2c';
const CARD = '#1a2236';
const MUTED = '#222d44';
const BORDER = '#2a3550';
const FG = '#f8fafc';
const MUTED_FG = '#7c8ba3';
const PRIMARY = '#0ea5e9';
const SUCCESS = '#10b981';

interface ReceiptData {
  specialistName: string;
  specialty: string;
  date: string;
  time: string;
  appointmentType: string;
  consultationFee: string;
  receiptNumber: string;
}

export function buildReceiptHtml(data: ReceiptData): string {
  const { specialistName, specialty, date, time, appointmentType, consultationFee, receiptNumber } =
    data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: ${BG}; color: ${FG}; font-size: 14px; }
  .page { max-width: 560px; margin: 0 auto; padding: 40px 36px; }

  /* Header */
  .header { display: flex; justify-content: space-between;
            align-items: flex-start; margin-bottom: 28px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-icon { width: 44px; height: 44px; border-radius: 10px;
                background: ${MUTED}; border: 1px solid ${BORDER};
                display: flex; align-items: center; justify-content: center; }
  .brand-letters { font-size: 18px; font-weight: 800; color: ${PRIMARY}; }
  .brand-name { font-size: 16px; font-weight: 700; color: ${FG}; line-height: 1.2; }
  .brand-tagline { font-size: 11px; color: ${MUTED_FG}; }
  .paid-badge { background: ${SUCCESS}; color: #fff; font-size: 11px;
                font-weight: 700; letter-spacing: 1px; padding: 5px 12px;
                border-radius: 20px; }

  .divider { border: none; border-top: 1.5px dashed ${BORDER}; margin: 20px 0; }
  .divider-solid { border: none; border-top: 1px solid ${BORDER}; margin: 0; }

  /* Receipt meta */
  .receipt-meta { margin-bottom: 24px; }
  .receipt-meta h1 { font-size: 20px; font-weight: 700; color: ${FG}; margin-bottom: 4px; }
  .receipt-meta p { font-size: 12px; color: ${MUTED_FG}; }

  /* Section card */
  .section { background: ${CARD}; border: 1px solid ${BORDER};
             border-radius: 14px; padding: 0 16px; margin-bottom: 16px; }
  .section-label { font-size: 10px; font-weight: 700; color: ${MUTED_FG};
                   letter-spacing: 1.2px; text-transform: uppercase;
                   padding: 14px 0 6px; }
  .row { display: flex; justify-content: space-between;
         align-items: center; padding: 12px 0; }
  .row-label { color: ${MUTED_FG}; font-size: 13px; }
  .row-value { color: ${FG}; font-size: 13px; font-weight: 500; text-align: right; }
  .row-value.bold { font-weight: 700; }
  .row-value.primary { color: ${PRIMARY}; font-size: 15px; font-weight: 700; }

  /* Total row */
  .total-row { display: flex; justify-content: space-between;
               align-items: center; padding: 14px 0; }
  .total-label { font-size: 15px; font-weight: 700; color: ${FG}; }

  /* Notice */
  .notice { display: flex; align-items: flex-start; gap: 10px;
            background: ${MUTED}; border: 1px solid ${BORDER};
            border-radius: 10px; padding: 14px 16px; margin-top: 4px; }
  .notice-icon { font-size: 15px; line-height: 1.5; color: ${MUTED_FG}; flex-shrink: 0; }
  .notice-text { font-size: 12px; color: ${MUTED_FG}; line-height: 1.6; }

  /* Footer */
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: ${MUTED_FG}; opacity: 0.6; }
</style>
</head>
<body>
<div class="page">

  <!-- Header: logo + PAID badge -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">
        <span class="brand-letters">RC</span>
      </div>
      <div>
        <div class="brand-name">RapidCapsule</div>
        <div class="brand-tagline">Healthcare Platform</div>
      </div>
    </div>
    <span class="paid-badge">PAID</span>
  </div>

  <hr class="divider" />

  <!-- Receipt title + number -->
  <div class="receipt-meta">
    <h1>Appointment Receipt</h1>
    <p>Receipt #${receiptNumber}</p>
  </div>

  <!-- Appointment details -->
  <div class="section">
    <div class="section-label">Appointment Details</div>

    <div class="row">
      <span class="row-label">Date</span>
      <span class="row-value bold">${date}</span>
    </div>
    <hr class="divider-solid" />

    <div class="row">
      <span class="row-label">Time</span>
      <span class="row-value bold">${time}</span>
    </div>
    <hr class="divider-solid" />

    <div class="row">
      <span class="row-label">Specialist</span>
      <span class="row-value bold">${specialistName}</span>
    </div>
    <hr class="divider-solid" />

    <div class="row">
      <span class="row-label">Category</span>
      <span class="row-value">${specialty}</span>
    </div>
    <hr class="divider-solid" />

    <div class="row">
      <span class="row-label">Type</span>
      <span class="row-value">${appointmentType}</span>
    </div>
  </div>

  <!-- Payment details -->
  <div class="section">
    <div class="section-label">Payment Details</div>

    <div class="row">
      <span class="row-label">Consultation Fee</span>
      <span class="row-value">${consultationFee}</span>
    </div>
    <hr class="divider-solid" />

    <div class="total-row">
      <span class="total-label">Total Paid</span>
      <span class="row-value primary">${consultationFee}</span>
    </div>
  </div>

  <!-- Notice -->
  <div class="notice">
    <span class="notice-icon">ⓘ</span>
    <span class="notice-text">
      This is your digital receipt for the consultation.
      For any queries, please contact support.
    </span>
  </div>

  <!-- Footer -->
  <div class="footer">
    Generated by RapidCapsule · rapidcapsule.com
  </div>

</div>
</body>
</html>`;
}
