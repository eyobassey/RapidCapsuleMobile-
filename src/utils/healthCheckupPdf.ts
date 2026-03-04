import {generatePDF} from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {Platform, Alert} from 'react-native';

// ── Data interface ──

export interface HealthCheckupPDFData {
  patientName: string;
  age: number;
  sex: string;
  date: string; // ISO string
  triageLevel: string;
  hasEmergency: boolean;
  conditions: Array<{
    id?: string;
    name: string;
    common_name?: string;
    category?: string;
    probability: number;
  }>;
  claudeSummary?: {
    overview: string;
    key_findings: string[];
    possible_conditions_explained: Array<{
      condition: string;
      explanation: string;
      urgency: string;
    }>;
    recommendations: string[];
    when_to_seek_care: string;
    lifestyle_tips?: string[];
  } | null;
}

// ── Triage config ──

const TRIAGE_CONFIG: Record<string, {label: string; color: string; description: string}> = {
  emergency_ambulance: {
    label: 'Emergency',
    color: '#f43f5e',
    description: 'Symptoms indicate a medical emergency requiring immediate attention.',
  },
  emergency: {
    label: 'Emergency',
    color: '#f43f5e',
    description: 'A potentially serious condition requiring immediate medical attention.',
  },
  consultation_24: {
    label: 'Urgent',
    color: '#f97316',
    description: 'Prompt medical attention recommended within 24 hours.',
  },
  consultation: {
    label: 'See a Doctor',
    color: '#0ea5e9',
    description: 'A doctor visit within the next few days is recommended.',
  },
  self_care: {
    label: 'Self-Care',
    color: '#10b981',
    description: 'Symptoms appear manageable with self-care. Monitor and consult a doctor if they worsen.',
  },
};

const URGENCY_CONFIG: Record<string, {label: string; color: string}> = {
  emergency: {label: 'Emergency', color: '#f43f5e'},
  urgent: {label: 'Urgent', color: '#f43f5e'},
  soon: {label: 'See Soon', color: '#f97316'},
  routine: {label: 'Routine', color: '#10b981'},
};

// ── HTML builder ──

function buildHealthCheckupHTML(data: HealthCheckupPDFData): string {
  const effectiveTriage = data.hasEmergency ? 'emergency' : (data.triageLevel || 'self_care');
  const triage = TRIAGE_CONFIG[effectiveTriage] || TRIAGE_CONFIG.self_care;

  const dateObj = new Date(data.date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const conditionsHTML = data.conditions.map((c, i) => {
    const pct = Math.round(c.probability * 100);
    const barColor = pct >= 70 ? '#f43f5e' : pct >= 40 ? '#f97316' : '#0ea5e9';
    return `
      <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb; gap: 12px;">
        <div style="width: 28px; height: 28px; border-radius: 14px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span style="font-size: 12px; font-weight: 700; color: #64748b;">${i + 1}</span>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 14px; font-weight: 600; color: #1a1a2e; margin-bottom: 4px;">${c.common_name || c.name}</div>
          ${c.category ? `<div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">${c.category}</div>` : ''}
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${barColor}; border-radius: 3px;"></div>
            </div>
            <span style="font-size: 12px; font-weight: 700; color: ${barColor}; min-width: 36px; text-align: right;">${pct}%</span>
          </div>
        </div>
      </div>`;
  }).join('');

  const summaryHTML = data.claudeSummary ? buildSummaryHTML(data.claudeSummary) : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a2e;
      background: #ffffff;
      font-size: 14px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 2px solid #0ea5e9;
      margin-bottom: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      object-fit: contain;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 800;
      color: #0ea5e9;
    }
    .brand-sub {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
    }
    .patient-info {
      display: flex;
      gap: 24px;
      background: #f8fafc;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
    }
    .info-item {
      font-size: 12px;
      color: #64748b;
    }
    .info-value {
      font-weight: 700;
      color: #1a1a2e;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 10px;
      margin-top: 24px;
    }
    .triage-card {
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 4px;
    }
    .triage-label {
      font-size: 20px;
      font-weight: 800;
    }
    .triage-desc {
      font-size: 13px;
      margin-top: 6px;
      opacity: 0.85;
    }
    .conditions-list {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 4px 16px;
    }
    .disclaimer {
      background: #fef9c3;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 24px;
    }
    .disclaimer-title {
      font-size: 12px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 4px;
    }
    .disclaimer-text {
      font-size: 11px;
      color: #78350f;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #94a3b8;
    }
    .summary-section {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 18px;
      margin-top: 20px;
    }
    .summary-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .summary-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #0ea5e9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: 700;
    }
    .summary-label {
      font-size: 14px;
      font-weight: 700;
      color: #0c4a6e;
    }
    .summary-sublabel {
      font-size: 10px;
      color: #0ea5e9;
    }
    .summary-overview {
      font-size: 13px;
      color: #1e3a5f;
      line-height: 1.7;
      margin-bottom: 14px;
    }
    .sub-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #0c4a6e;
      margin-bottom: 8px;
      margin-top: 14px;
    }
    .bullet-item {
      font-size: 12px;
      color: #1e3a5f;
      line-height: 1.6;
      padding-left: 14px;
      position: relative;
      margin-bottom: 4px;
    }
    .bullet-item::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #0ea5e9;
      font-weight: 700;
    }
    .condition-card {
      background: #ffffff;
      border: 1px solid #e0f2fe;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }
    .condition-name {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .urgency-badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      margin-left: 8px;
    }
    .condition-explanation {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.5;
    }
    .care-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 12px 14px;
      margin-top: 14px;
    }
    .care-title {
      font-size: 11px;
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 4px;
    }
    .care-text {
      font-size: 12px;
      color: #7f1d1d;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <img class="brand-icon" src="data:image/png;base64,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AAAAJ3RFWHRwZGY6SGlSZXNCb3VuZGluZ0JveAAyOTUuNTN4MTgyLjc5MSswKzBajf5RAAAAE3RFWHRwZGY6VmVyc2lvbgBQREYtMS41UzZawQAAABV0RVh0cGhvdG9zaG9wOkNvbG9yTW9kZQAzVgKzQAAAACZ0RVh0cGhvdG9zaG9wOklDQ1Byb2ZpbGUAc1JHQiBJRUM2MTk2Ni0yLjEcL2wLAAAAKHRFWHR4bXA6Q3JlYXRlRGF0ZQAyMDIwLTA1LTEzVDEzOjQwOjQwKzAxOjAw+avJCQAAADN0RVh0eG1wOkNyZWF0b3JUb29sAEFkb2JlIElsbHVzdHJhdG9yIENDIDIzLjAgKFdpbmRvd3MpYwqJSwAAACp0RVh0eG1wOk1ldGFkYXRhRGF0ZQAyMDIwLTA1LTEzVDEzOjUyOjMyKzAxOjAwKdCxQwAAACh0RVh0eG1wOk1vZGlmeURhdGUAMjAyMC0wNS0xM1QxMzo1MjozMiswMTowMBV04v0AAAAbdEVYdHhtcE1NOkRlcml2ZWRGcm9tAHByb29mOnBkZrYVLeUAAAA9dEVYdHhtcE1NOkRvY3VtZW50SUQAeG1wLmRpZDoxNmM4NDY0YS02ODMxLTIwNDAtYWE0OC0zMTRmZTQzMTQ5MmSQQXr7AAAAOnRFWHR4bXBNTTpJbnN0YW5jZUlEAHV1aWQ6N2NlYTMyODgtMjFhNS00MjI2LWFhOWItNzYxODlmYWVmNzJhDvHxGgAAAEV0RVh0eG1wTU06T3JpZ2luYWxEb2N1bWVudElEAHhtcC5kaWQ6ZWM4ODJlYmYtNmI2ZC0wODRhLWFiYjctZDU2OThiNTRiMDAw/c+glgAAAB50RVh0eG1wTU06UmVuZGl0aW9uQ2xhc3MAcHJvb2Y6cGRmhKbfiQAAACB0RVh0eG1wVFBnOkhhc1Zpc2libGVPdmVycHJpbnQARmFsc2V5GcblAAAAI3RFWHR4bXBUUGc6SGFzVmlzaWJsZVRyYW5zcGFyZW5jeQBGYWxzZTpcPYIAAAAedEVYdHhtcFRQZzpNYXhQYWdlU2l6ZQBNaWxsaW1ldGVyc249MbUAAAAPdEVYdHhtcFRQZzpOUGFnZXMAMcmB27IAAAAASUVORK5CYII=" alt="RapidCapsule" />
      <div>
        <div class="brand-name">RapidCapsule</div>
        <div class="brand-sub">Health Checkup Report</div>
      </div>
    </div>
  </div>

  <!-- Patient Info -->
  <div class="patient-info">
    <div class="info-item">Patient: <span class="info-value">${escapeHTML(data.patientName)}</span></div>
    <div class="info-item">Age: <span class="info-value">${data.age} years</span></div>
    <div class="info-item">Sex: <span class="info-value">${capitalize(data.sex)}</span></div>
    <div class="info-item">Date: <span class="info-value">${formattedDate}, ${formattedTime}</span></div>
  </div>

  <!-- Triage Assessment -->
  <div class="section-title">Triage Assessment</div>
  <div class="triage-card" style="background: ${triage.color}12; border: 1px solid ${triage.color}40;">
    <div class="triage-label" style="color: ${triage.color};">${triage.label}</div>
    <div class="triage-desc" style="color: ${triage.color};">${triage.description}</div>
  </div>

  <!-- Conditions -->
  <div class="section-title">Possible Conditions (${data.conditions.length})</div>
  ${data.conditions.length > 0 ? `
    <div class="conditions-list">
      ${conditionsHTML}
    </div>
  ` : `
    <div style="text-align: center; color: #94a3b8; padding: 20px; font-size: 13px;">
      No specific conditions identified. If symptoms persist, please consult a doctor.
    </div>
  `}

  <!-- AI Summary -->
  ${summaryHTML}

  <!-- Disclaimer -->
  <div class="disclaimer">
    <div class="disclaimer-title">⚠ Important Disclaimer</div>
    <div class="disclaimer-text">
      This report was generated by an AI-powered health assessment tool and is <strong>NOT a medical diagnosis</strong>.
      The information provided is for educational and informational purposes only. It should not be used as a substitute
      for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider
      with any questions you may have regarding a medical condition. If you think you may have a medical emergency,
      call your doctor or emergency services immediately.
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Generated by RapidCapsule &bull; rapidcapsule.com &bull; ${formattedDate}
  </div>
</body>
</html>`;
}

function buildSummaryHTML(summary: NonNullable<HealthCheckupPDFData['claudeSummary']>): string {
  const findingsHTML = (summary.key_findings || [])
    .map(f => `<div class="bullet-item">${escapeHTML(f)}</div>`)
    .join('');

  const conditionsHTML = (summary.possible_conditions_explained || [])
    .map(item => {
      const u = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.routine;
      return `
        <div class="condition-card">
          <div>
            <span class="condition-name">${escapeHTML(item.condition)}</span>
            <span class="urgency-badge" style="background: ${u.color}15; color: ${u.color};">${u.label}</span>
          </div>
          <div class="condition-explanation">${escapeHTML(item.explanation)}</div>
        </div>`;
    })
    .join('');

  const recsHTML = (summary.recommendations || [])
    .map(r => `<div class="bullet-item">${escapeHTML(r)}</div>`)
    .join('');

  const tipsHTML = (summary.lifestyle_tips || [])
    .map(t => `<div class="bullet-item">${escapeHTML(t)}</div>`)
    .join('');

  return `
  <div class="summary-section">
    <div class="summary-header">
      <div class="summary-icon">AI</div>
      <div>
        <div class="summary-label">AI Health Summary</div>
        <div class="summary-sublabel">Powered by Claude AI</div>
      </div>
    </div>

    <div class="summary-overview">${escapeHTML(summary.overview)}</div>

    ${findingsHTML ? `
      <div class="sub-title">Key Findings</div>
      ${findingsHTML}
    ` : ''}

    ${conditionsHTML ? `
      <div class="sub-title">Conditions Explained</div>
      ${conditionsHTML}
    ` : ''}

    ${recsHTML ? `
      <div class="sub-title">Recommendations</div>
      ${recsHTML}
    ` : ''}

    ${summary.when_to_seek_care ? `
      <div class="care-box">
        <div class="care-title">When to Seek Care</div>
        <div class="care-text">${escapeHTML(summary.when_to_seek_care)}</div>
      </div>
    ` : ''}

    ${tipsHTML ? `
      <div class="sub-title" style="margin-top: 14px;">Lifestyle Tips</div>
      ${tipsHTML}
    ` : ''}
  </div>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}

// ── PDF generator ──

export async function generateHealthCheckupPDF(data: HealthCheckupPDFData): Promise<void> {
  try {
    const html = buildHealthCheckupHTML(data);
    const dateStr = new Date(data.date).toISOString().split('T')[0];

    const file = await generatePDF({
      html,
      fileName: `RapidCapsule_Checkup_${dateStr}`,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Downloads',
      base64: false,
    });

    if (!file.filePath) {
      throw new Error('PDF generation failed');
    }

    await Share.open({
      url: Platform.OS === 'ios' ? file.filePath : `file://${file.filePath}`,
      type: 'application/pdf',
      title: 'Health Checkup Report',
      subject: 'RapidCapsule Health Checkup Report',
    });
  } catch (error: any) {
    // User dismissed share sheet — not an error
    if (
      error?.message?.includes?.('User did not share') ||
      error?.message?.includes?.('cancelled') ||
      error?.message?.includes?.('dismiss')
    ) {
      return;
    }
    Alert.alert('PDF Error', 'Could not generate the report. Please try again.');
  }
}
