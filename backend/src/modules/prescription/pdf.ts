import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

const FONT_DIR = path.resolve(__dirname, '..', '..', 'fonts');
const FONT_EN_REG = 'NotoSans';
const FONT_EN_BOLD = 'NotoSans-Bold';
const FONT_BN_REG = 'NotoSansBengali';
const FONT_BN_BOLD = 'NotoSansBengali-Bold';

const isBn = (t: string) => /[\u0980-\u09FF]/.test(t);
const pick = (t: string, bold = false) => isBn(t) ? (bold ? FONT_BN_BOLD : FONT_BN_REG) : (bold ? FONT_EN_BOLD : FONT_EN_REG);
const FONT_REG = FONT_EN_REG;
const FONT_BOLD = FONT_EN_BOLD;

const formAbbr: Record<string, string> = {
  'Tablet': 'TAB.', 'Capsule': 'CAP.', 'Injection': 'INJ.', 'Inject': 'INJ.',
  'Syrup': 'SYP.', 'Cream': 'CRM.', 'Ointment': 'OINT.', 'Gel': 'GEL.',
  'Drop': 'DROP.', 'Inhaler': 'INH.', 'Suspension': 'SUSP.', 'Solution': 'SOLN.',
  'Lotion': 'LOT.', 'Spray': 'SPRAY.', 'Powder': 'PDR.', 'Sachet': 'SACH.',
};

const fmtDur = (d?: string) => {
  if (!d) return '—';
  return /day/i.test(d) ? d : `${d} Days`;
};

const PX = (px: number) => px * 72 / 96;

const formatFollowUp = (date: Date): string => {
  const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${formatted} (${Math.abs(diff)} days ago)`;
  if (diff === 0) return `${formatted} (Today)`;
  if (diff === 1) return `${formatted} (Tomorrow)`;
  return `${formatted} (${diff} days)`;
};

export const generatePrescriptionPDF = async (data: {
  doctor: any;
  patient: any;
  medicines: any[];
  investigations: any[];
  prescriptionNo: string;
  createdAt: string;
  updatedAt?: string | null;
  symptoms?: string | null;
  chiefComplaint?: string | null;
  diagnosis?: string | null;
  diagnosisNotes?: string | null;
  bloodPressure?: string | null;
  pulseRate?: string | null;
  temperature?: string | null;
  oxygenSaturation?: string | null;
  advice?: string | null;
  foodAdvice?: string | null;
  followUpDate?: string | Date | null;
}): Promise<Buffer> => {
  const M = PX(34);
  const PAGE_W = 595.28, PAGE_H = 841.89;
  const CONTENT_W = PAGE_W - M * 2;
  const PAD = PX(24);
  const BODY_W = CONTENT_W - PAD * 2;
  const LEFT_W = PX(158);
  const GAP = PX(24);
  const BORDER = 1;
  const RIGHT_W = BODY_W - LEFT_W - GAP;

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: M, bottom: M, left: M, right: M },
  });
  [
    [FONT_BN_REG, 'NotoSansBengali-Regular.ttf'],
    [FONT_BN_BOLD, 'NotoSansBengali-Bold.ttf'],
    [FONT_EN_REG, 'NotoSans-Regular.ttf'],
    [FONT_EN_BOLD, 'NotoSans-Bold.ttf'],
  ].forEach(([name, file]) => {
    const p = path.join(FONT_DIR, file);
    if (fs.existsSync(p)) doc.registerFont(name as string, p);
  });

  const origText = doc.text.bind(doc);
  doc.text = function (t: any, x?: any, y?: any, opts?: any) {
    const bold = typeof opts?.bold === 'boolean' ? opts.bold : false;
    const f = bold ? FONT_EN_BOLD : FONT_EN_REG;
    doc.font(pick(String(t || ''), bold) || f);
    return origText(t, x, y, opts);
  } as typeof doc.text;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const uploadsDir = path.join(__dirname, '../../../uploads');
    const tryImg = (f: string | null | undefined, x: number, y: number, w: number) => {
      if (!f) return;
      try { const p = path.join(uploadsDir, f); if (fs.existsSync(p)) doc.image(p, x, y, { width: w }); } catch {}
    };

    const lx = M + PAD;
    const rx = lx + LEFT_W + GAP + BORDER;

    // ---------- Letterhead ----------
    const drName = data.doctor.fullName ? `Dr. ${data.doctor.fullName}` : 'Dr. Doctor';
    const LH_ITEMS: { text: string; size: number; bold: boolean }[] = [
      { text: drName, size: PX(18), bold: true },
    ];
    const deg = (data.doctor.degree || []).join(', ');
    if (deg) LH_ITEMS.push({ text: deg, size: PX(11), bold: true });
    const spec = (data.doctor.specialization || []).join(', ');
    if (spec) LH_ITEMS.push({ text: spec, size: PX(10), bold: false });
    if (data.doctor.clinicName) LH_ITEMS.push({ text: data.doctor.clinicName, size: PX(10), bold: false });
    if (data.doctor.clinicAddress) LH_ITEMS.push({ text: data.doctor.clinicAddress, size: PX(10), bold: false });
    if (data.doctor.bmdcRegNo) LH_ITEMS.push({ text: `BMDC: ${data.doctor.bmdcRegNo}`, size: PX(10), bold: false });

    let ly = 0;
    LH_ITEMS.forEach((item) => {
      doc.font(item.bold ? FONT_BOLD : FONT_REG).fontSize(item.size).fillColor('#000');
      doc.text(item.text, lx, ly, { width: CONTENT_W - PX(80) });
      ly += item.size + (item.bold ? 2 : 1);
    });

    const dt = new Date(data.createdAt);
    const dateStr = `${dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · ${dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    let updateStr = '';
    if (data.updatedAt) {
      const ud = new Date(data.updatedAt);
      if (ud.getTime() !== dt.getTime()) {
        updateStr = `Last update: ${ud.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · ${ud.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      }
    }

    tryImg(data.doctor.clinicLogo, lx + CONTENT_W - PX(48), 0, PX(48));
    if (data.doctor.clinicLogo) {
      doc.fontSize(PX(8)).font(FONT_BOLD).fillColor('#000')
        .text('Forwarded by MEDICLOUD', lx + CONTENT_W - PX(60), PX(50), { width: PX(60), align: 'right' });
      doc.fontSize(PX(9)).font(FONT_REG).fillColor('#000')
        .text(`Rx: ${data.prescriptionNo}`, lx + CONTENT_W - PX(60), PX(64), { width: PX(60), align: 'right' })
        .text(dateStr, lx + CONTENT_W - PX(60), PX(74), { width: PX(60), align: 'right' });
      if (updateStr) doc.fontSize(PX(8)).font(FONT_REG).fillColor('#000').text(updateStr, lx + CONTENT_W - PX(60), PX(84), { width: PX(60), align: 'right' });
    } else {
      doc.roundedRect(lx + CONTENT_W - PX(48), 0, PX(40), PX(40), PX(6)).fill('#000');
      doc.fill('#fff').fontSize(PX(10)).font(FONT_BOLD).text('RX', lx + CONTENT_W - PX(40), PX(14), { width: PX(24), align: 'center' });
      doc.fill('#000').fontSize(PX(8)).font(FONT_BOLD).text('Forwarded by MEDICLOUD', lx + CONTENT_W - PX(60), PX(42), { width: PX(60), align: 'right' });
      doc.fontSize(PX(9)).font(FONT_REG).fillColor('#000')
        .text(`Rx: ${data.prescriptionNo}`, lx + CONTENT_W - PX(60), PX(56), { width: PX(60), align: 'right' })
        .text(dateStr, lx + CONTENT_W - PX(60), PX(66), { width: PX(60), align: 'right' });
      if (updateStr) doc.fontSize(PX(8)).font(FONT_REG).fillColor('#000').text(updateStr, lx + CONTENT_W - PX(60), PX(76), { width: PX(60), align: 'right' });
    }

    const lhBottom = ly + PX(11);
    doc.moveTo(lx, lhBottom).lineTo(lx + CONTENT_W, lhBottom).lineWidth(PX(3)).strokeColor('#000').stroke();
    let y = lhBottom + PX(24);

    // ---------- Right Column (Rx content) ----------
    let ry = y;
    doc.fontSize(PX(36)).fillColor('#000').font(FONT_REG)
      .text('Rx', rx, ry);
    doc.moveTo(rx + PX(36), ry + PX(14)).lineTo(rx + RIGHT_W, ry + PX(14)).lineWidth(1).strokeColor('#000').stroke();

    // Medicines
    const meds = (data.medicines || []).filter((m: any) => m.name);
    let medY = ry + PX(30);
    meds.forEach((m: any) => {
      const prefix = m.form ? (formAbbr[m.form] || m.form.toUpperCase() + '.') : '';
      doc.fontSize(PX(14)).font(FONT_BOLD).fillColor('#000')
        .text(`${prefix} ${m.name}${m.strength ? ` ${m.strength}` : ''}${m.genericName ? ` (${m.genericName})` : ''}`, rx, medY, { width: RIGHT_W });
      medY += PX(18);
      const durDisplay = fmtDur(m.duration);
      doc.fontSize(PX(13)).font(FONT_REG).fillColor('#000')
        .text(`${m.dosage || '—'} · ${m.frequency || '—'} · ${durDisplay}`, rx + PX(32), medY, { width: RIGHT_W - PX(32) });
      medY += PX(16);
      if (m.instructions) {
        doc.fontSize(PX(11)).font(FONT_REG).fillColor('#000')
          .text(m.instructions, rx + PX(32), medY, { width: RIGHT_W - PX(32) });
        medY += PX(14);
      }
      medY += PX(6);
    });

    // Investigations
    const invs = (data.investigations || []).filter((i: any) => i.name);
    if (invs.length) {
      medY += PX(14);
      doc.fontSize(PX(12)).font(FONT_BOLD).fillColor('#000').text('INVESTIGATIONS', rx, medY, { width: RIGHT_W });
      doc.moveTo(rx, medY + PX(14)).lineTo(rx + RIGHT_W, medY + PX(14)).lineWidth(2).strokeColor('#000').stroke();
      medY += PX(20);
      doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000')
        .text(invs.map((i: any) => i.name).join(', '), rx, medY, { width: RIGHT_W });
      medY += PX(18);
    }

    // Advice
    if (data.advice) {
      medY += PX(9);
      doc.fontSize(PX(12)).font(FONT_BOLD).fillColor('#000').text('ADVICE', rx, medY, { width: RIGHT_W });
      doc.moveTo(rx, medY + PX(14)).lineTo(rx + RIGHT_W, medY + PX(14)).lineWidth(2).strokeColor('#000').stroke();
      medY += PX(20);
      doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000').text(data.advice, rx, medY, { width: RIGHT_W });
      medY += PX(18);
    }

    // Food Advice
    if (data.foodAdvice) {
      medY += PX(9);
      doc.fontSize(PX(12)).font(FONT_BOLD).fillColor('#000').text('FOOD ADVICE', rx, medY, { width: RIGHT_W });
      doc.moveTo(rx, medY + PX(14)).lineTo(rx + RIGHT_W, medY + PX(14)).lineWidth(2).strokeColor('#000').stroke();
      medY += PX(20);
      doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000').text(data.foodAdvice, rx, medY, { width: RIGHT_W });
      medY += PX(18);
    }

    // Follow-up
    if (data.followUpDate) {
      medY += PX(9);
      doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000').text(
        'Follow-up: ' + formatFollowUp(new Date(data.followUpDate)),
        rx, medY, { width: RIGHT_W }
      );
      medY += PX(18);
    }

    // ---------- Left Column ----------
    let ly2 = ry;

    // Patient details
    if (data.patient) {
      doc.fontSize(PX(10)).font(FONT_BOLD).fillColor('#000').text('PATIENT DETAILS', lx, ly2, { width: LEFT_W });
      ly2 += PX(14);
      doc.fontSize(PX(12)).font(FONT_BOLD).fillColor('#000')
        .text(data.patient.fullName || '', lx, ly2, { width: LEFT_W });
      ly2 += PX(16);
      doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000')
        .text(`Age: ${data.patient.age || ''}Y | Sex: ${(data.patient.gender || '')?.charAt(0) || ''} | Wt: ${data.patient.weight || '—'}kg`, lx, ly2, { width: LEFT_W });
      ly2 += PX(16);
    }

    // Chief Complaint
    doc.fontSize(PX(10)).font(FONT_BOLD).fillColor('#000').text('CHIEF COMPLAINT', lx, ly2, { width: LEFT_W });
    ly2 += PX(14);
    if (data.chiefComplaint) {
      const ccLines = data.chiefComplaint.split('\n').filter(Boolean);
      ccLines.forEach((line: string) => {
        doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000').text(`• ${line}`, lx, ly2, { width: LEFT_W });
        ly2 += PX(16);
      });
    } else {
      doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000').text('—', lx, ly2, { width: LEFT_W });
      ly2 += PX(18);
    }

    // Symptoms
    if (data.symptoms) {
      doc.fontSize(PX(10)).font(FONT_BOLD).fillColor('#000').text('SYMPTOMS', lx, ly2, { width: LEFT_W });
      ly2 += PX(14);
      doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000').text(data.symptoms, lx, ly2, { width: LEFT_W });
      ly2 += PX(18);
    }

    // Vitals
    if (data.bloodPressure || data.pulseRate) {
      doc.fontSize(PX(10)).font(FONT_BOLD).fillColor('#000').text('VITALS', lx, ly2, { width: LEFT_W });
      ly2 += PX(14);
      doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000').text(`BP: ${data.bloodPressure || '—'} mmHg`, lx, ly2, { width: LEFT_W });
      ly2 += PX(14);
      doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000').text(`HR: ${data.pulseRate || '—'} bpm`, lx, ly2, { width: LEFT_W });
      ly2 += PX(16);
    }

    // Diagnosis
    if (data.diagnosis) {
      doc.fontSize(PX(10)).font(FONT_BOLD).fillColor('#000').text('DIAGNOSIS', lx, ly2, { width: LEFT_W });
      ly2 += PX(14);
      doc.fontSize(PX(12)).font(FONT_REG).fillColor('#000').text(data.diagnosis, lx, ly2, { width: LEFT_W });
      ly2 += PX(18);
    }

    // QR code
    ly2 += PX(14);
    QRCode.toBuffer(
      JSON.stringify({ rxNo: data.prescriptionNo, doctor: data.doctor.fullName, patient: data.patient.fullName }),
      { width: PX(72), margin: 1 }
    ).then((qr) => {
      doc.image(qr, lx, ly2, { width: PX(72) });
      doc.fontSize(PX(10)).font(FONT_BOLD).fillColor('#000')
        .text('Scan for e-validation', lx, ly2 + PX(76), { width: PX(80) });

      // ---------- Signature ----------
      const sigW = PX(140);
      const sigX = rx + RIGHT_W - sigW;
      const sigY = PAGE_H - M - PX(60) - (data.doctor.signatureImg ? PX(50) : PX(20));
      tryImg(data.doctor.signatureImg, sigX, sigY, PX(120));
      const sigTextY = data.doctor.signatureImg ? sigY + PX(38) : sigY;
      doc.fontSize(PX(12)).font(FONT_BOLD).fillColor('#000')
        .text(drName, sigX, sigTextY, { width: sigW, align: 'right' });
      if (data.doctor.bmdcRegNo) {
        doc.fontSize(PX(10)).font(FONT_REG).fillColor('#000')
          .text(`Reg No: ${data.doctor.bmdcRegNo}`, sigX, sigTextY + PX(14), { width: sigW, align: 'right' });
      }

      doc.end();
    }).catch(() => doc.end());
  });
};
