import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { Regulation } from '../types/regulatory';
import { MENAT_COUNTRIES } from '../data/menatData';

export interface PDFExportOptions {
  reportTitle?: string;
  organizationName?: string;
  preparedBy?: string;
  includeExecutiveSummary?: boolean;
  includeCrosswalk?: boolean;
  includeOfficialReferences?: boolean;
  includeClauseDescriptions?: boolean;
  filterMandatoryOnly?: boolean;
}

export function generateComplianceReportPDF(
  selectedRegulations: Regulation[],
  options: PDFExportOptions = {}
): jsPDF {
  const {
    reportTitle = 'ComplianceIQ - Regulatory Compliance & Controls Crosswalk Report',
    organizationName = 'Enterprise Governance, Risk & Compliance (GRC)',
    preparedBy = 'ComplianceIQ - Middle East, North Africa & Türkiye Regulations & Controls ',
    includeExecutiveSummary = true,
    includeCrosswalk = true,
    includeOfficialReferences = true,
    includeClauseDescriptions = true,
    filterMandatoryOnly = false,
  } = options;

  // Initialize PDF in Portrait A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald 500
  const headerBgColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const secondaryBgColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const textDarkColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const textMutedColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // Calculate statistics
  let totalControls = 0;
  let mandatoryControls = 0;
  let nistMappedCount = 0;
  let isoMappedCount = 0;
  let ccmMappedCount = 0;

  const countrySet = new Set<string>();
  const authoritySet = new Set<string>();

  for (const reg of selectedRegulations) {
    countrySet.add(reg.countryId);
    authoritySet.add(reg.authorityShort || reg.authority);
    const controls = reg.sampleControls || [];
    for (const ctrl of controls) {
      if (filterMandatoryOnly && ctrl.mandatoryLevel !== 'Mandatory') continue;
      totalControls++;
      if (ctrl.mandatoryLevel === 'Mandatory') mandatoryControls++;
      if (ctrl.mapping?.nistCsf) nistMappedCount++;
      if (ctrl.mapping?.iso27001) isoMappedCount++;
      if (ctrl.mapping?.csaCcm) ccmMappedCount++;
    }
  }

  // ==================== COVER / HEADER SECTION ====================
  // Top Banner
  doc.setFillColor(...headerBgColor);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent line
  doc.setFillColor(...primaryColor);
  doc.rect(0, 42, pageWidth, 2.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COMPLIANCEIQ REGULATORY COMPLIANCE REPORT', margin, 15);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate 400
  doc.text('Middle East, North Africa & Türkiye Regulations & Controls (NIST CSF 2.0 • ISO 27001 • CSA CCM v4)', margin, 22);

  // Metadata line in banner
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated: ${dateStr}   |   Organization: ${organizationName}`, margin, 32);
  doc.text(`Prepared By: ${preparedBy}   |   Frameworks Selected: ${selectedRegulations.length}`, margin, 37);

  let currentY = 50;

  // Custom Report Title
  if (reportTitle && reportTitle !== 'MENAT Regulatory Compliance & Controls Crosswalk Report') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...textDarkColor);
    doc.text(reportTitle, margin, currentY);
    currentY += 8;
  }

  // ==================== EXECUTIVE SUMMARY CARDS ====================
  if (includeExecutiveSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...textDarkColor);
    doc.text('1. Executive Scope & Metrics Summary', margin, currentY);
    currentY += 4;

    // Metrics Box
    const cardWidth = (contentWidth - 9) / 4;
    const cardHeight = 18;

    const metrics = [
      { label: 'Selected Frameworks', value: `${selectedRegulations.length} Laws`, sub: `${countrySet.size} Jurisdictions` },
      { label: 'Controls Evaluated', value: `${totalControls} Controls`, sub: `${mandatoryControls} Mandatory` },
      {
        label: 'NIST CSF 2.0 Crosswalk',
        value: totalControls > 0 ? `${Math.round((nistMappedCount / totalControls) * 100)}%` : '0%',
        sub: `${nistMappedCount} Mapped`,
      },
      {
        label: 'ISO 27001 / CSA CCM',
        value: totalControls > 0 ? `${Math.round((isoMappedCount / totalControls) * 100)}%` : '0%',
        sub: `${isoMappedCount} ISO / ${ccmMappedCount} CCM`,
      },
    ];

    metrics.forEach((m, idx) => {
      const cardX = margin + idx * (cardWidth + 3);
      doc.setFillColor(248, 250, 252); // slate 50
      doc.setDrawColor(226, 232, 240); // slate 200
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      // Top accent bar
      doc.setFillColor(...primaryColor);
      doc.rect(cardX, currentY, cardWidth, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...textDarkColor);
      doc.text(m.value, cardX + 3, currentY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...textMutedColor);
      doc.text(m.label, cardX + 3, currentY + 12);
      doc.text(m.sub, cardX + 3, currentY + 15.5);
    });

    currentY += cardHeight + 6;

    // Selected Regulations High-Level Table
    const summaryRows = selectedRegulations.map((reg) => {
      const countryObj = MENAT_COUNTRIES.find((c) => c.id === reg.countryId);
      const ctrls = (reg.sampleControls || []).filter(
        (c) => !filterMandatoryOnly || c.mandatoryLevel === 'Mandatory'
      );
      const nistCount = ctrls.filter((c) => !!c.mapping?.nistCsf).length;
      const isoCount = ctrls.filter((c) => !!c.mapping?.iso27001).length;
      const ccmCount = ctrls.filter((c) => !!c.mapping?.csaCcm).length;

      return [
        countryObj ? `${countryObj.name} (${reg.countryId.toUpperCase()})` : reg.countryId.toUpperCase(),
        reg.authorityShort || reg.authority,
        reg.code,
        reg.name,
        reg.status || 'Enacted',
        `${ctrls.length} ctls`,
        `${nistCount} NIST | ${isoCount} ISO | ${ccmCount} CCM`,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Jurisdiction', 'Authority', 'Code', 'Regulation Title', 'Status', 'Scope', 'Crosswalk Mappings']],
      body: summaryRows,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: secondaryBgColor,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: textDarkColor,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 20 },
        2: { cellWidth: 24, fontStyle: 'bold' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 16 },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 36, fontSize: 6.5 },
      },
      didDrawPage: () => {
        // will add unified running headers/footers at the end
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // ==================== SECTION 2: DETAILED CONTROLS & CROSSWALK ====================
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 22;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...textDarkColor);
  doc.text('2. Comprehensive Controls Inventory & Tri-Framework Crosswalk', margin, currentY);
  currentY += 5;

  for (let idx = 0; idx < selectedRegulations.length; idx++) {
    const reg = selectedRegulations[idx];
    const countryObj = MENAT_COUNTRIES.find((c) => c.id === reg.countryId);
    const controls = (reg.sampleControls || []).filter(
      (c) => !filterMandatoryOnly || c.mandatoryLevel === 'Mandatory'
    );

    if (controls.length === 0) continue;

    // Check if enough space on current page, else add page
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 22;
    }

    // Regulation Banner
    doc.setFillColor(241, 245, 249); // slate 100
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 14, 1, 1, 'FD');

    // Left green border
    doc.setFillColor(...primaryColor);
    doc.rect(margin, currentY, 2.5, 14, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDarkColor);
    const regTitleLine = `${countryObj ? countryObj.name : reg.countryId.toUpperCase()} • ${reg.code}: ${reg.name}`;
    doc.text(regTitleLine.length > 85 ? regTitleLine.slice(0, 85) + '...' : regTitleLine, margin + 5, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...textMutedColor);
    doc.text(
      `Enforcing Authority: ${reg.authority}   |   Status: ${reg.status}   |   Enacted: ${reg.yearEnacted || 'Active'}   |   Controls: ${controls.length}`,
      margin + 5,
      currentY + 10
    );

    currentY += 16;

    // Prepare table rows for this regulation's controls
    const tableRows = controls.map((ctrl) => {
      let descText = ctrl.title;
      if (includeClauseDescriptions && ctrl.description && ctrl.description !== ctrl.title) {
        descText += `\n${ctrl.description}`;
      }

      const crosswalkCell = [
        ctrl.mapping?.nistCsf ? `NIST: ${ctrl.mapping.nistCsf}` : '',
        ctrl.mapping?.iso27001 ? `ISO: ${ctrl.mapping.iso27001}` : '',
        ctrl.mapping?.csaCcm ? `CCM: ${ctrl.mapping.csaCcm}` : '',
      ]
        .filter(Boolean)
        .join('\n') || 'N/A';

      const sectors = ctrl.applicableSectors ? ctrl.applicableSectors.slice(0, 3).join(', ') : 'All';

      return [
        ctrl.code,
        `${ctrl.domainName || ''}\n${ctrl.clauseReference ? 'Cl. ' + ctrl.clauseReference : ''}`.trim(),
        descText,
        ctrl.mandatoryLevel || 'Mandatory',
        sectors,
        crosswalkCell,
      ];
    });

    const headers = includeCrosswalk
      ? ['Control ID', 'Domain / Clause', 'Control Title & Description', 'Mandate', 'Sectors', 'Crosswalk (NIST / ISO / CCM)']
      : ['Control ID', 'Domain / Clause', 'Control Title & Description', 'Mandate', 'Sectors'];

    const columnStyles: Record<number, any> = includeCrosswalk
      ? {
          0: { cellWidth: 18, fontStyle: 'bold', fontSize: 6.5 },
          1: { cellWidth: 26, fontSize: 6.5 },
          2: { cellWidth: 'auto', fontSize: 6.5 },
          3: { cellWidth: 16, fontSize: 6.5, halign: 'center' },
          4: { cellWidth: 20, fontSize: 6 },
          5: { cellWidth: 38, fontSize: 6 },
        }
      : {
          0: { cellWidth: 22, fontStyle: 'bold', fontSize: 7 },
          1: { cellWidth: 32, fontSize: 7 },
          2: { cellWidth: 'auto', fontSize: 7 },
          3: { cellWidth: 20, fontSize: 7, halign: 'center' },
          4: { cellWidth: 28, fontSize: 6.5 },
        };

    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: tableRows,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: {
        fillColor: secondaryBgColor,
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 6.5,
        cellPadding: 2,
        textColor: textDarkColor,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles,
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // ==================== SECTION 3: OFFICIAL GAZETTE & REFERENCE DIRECTORY ====================
  if (includeOfficialReferences) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 22;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...textDarkColor);
    doc.text('3. Official Gazette & Regulatory Reference Directory', margin, currentY);
    currentY += 4;

    const refRows = selectedRegulations.map((reg) => {
      const countryObj = MENAT_COUNTRIES.find((c) => c.id === reg.countryId);
      return [
        countryObj ? countryObj.name : reg.countryId.toUpperCase(),
        reg.authority,
        reg.code,
        reg.officialUrl || 'N/A',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Jurisdiction', 'Enforcing Authority', 'Regulation Code', 'Official Gazette / Source Portal URL']],
      body: refRows,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: secondaryBgColor,
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 6.5,
        cellPadding: 2,
        textColor: textDarkColor,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30, fontStyle: 'bold' },
        3: { cellWidth: 'auto', textColor: [2, 132, 199] }, // sky 600
      },
    });
  }

  // ==================== GLOBAL RUNNING HEADERS & FOOTERS ====================
  const totalPages = doc.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // Running Header (pages 2+)
    if (pageNum > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate 400
      doc.text('COMPLIANCEIQ - MIDDLE EAST, NORTH AFRICA & TÜRKİYE REGULATIONS & CONTROLS', margin, 10);
      doc.text(`CONFIDENTIAL - FOR AUDIT USE`, pageWidth - margin, 10, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 12, pageWidth - margin, 12);
    }

    // Running Footer (all pages)
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by ComplianceIQ - Middle East, North Africa & Türkiye Regulations & Controls    |   ${selectedRegulations.length} Frameworks Evaluated`,
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  return doc;
}
