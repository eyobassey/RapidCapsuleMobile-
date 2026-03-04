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
      width: 42px;
      height: 42px;
      flex-shrink: 0;
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
      <svg class="brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42" width="42" height="42">
        <rect width="42" height="42" rx="10" fill="#F16439"/>
        <circle cx="29" cy="29" r="17" fill="#39C9DF"/>
        <text x="21" y="28" text-anchor="middle" font-size="17" font-weight="900" fill="#FFFFFF" font-family="-apple-system, Arial, Helvetica, sans-serif" letter-spacing="-0.5">RC</text>
      </svg>
      <div>
        <div class="brand-name">RapidCapsule</div>
        <div class="brand-sub">Health Checkup Report</div>
      </div>
    </div>
  </div>

  <!-- Patient Info -->
  <div class="patient-info">
    <div class="info-item">Patient: <span class="info-value">${escapeHTML(data.patientName)}</span></div>
    ${data.age ? `<div class="info-item">Age: <span class="info-value">${data.age} years</span></div>` : ''}
    ${data.sex ? `<div class="info-item">Sex: <span class="info-value">${capitalize(data.sex)}</span></div>` : ''}
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
