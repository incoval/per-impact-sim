import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { computeIRWithPER, generateScenarios, formatEuro, formatPct } from './tax-engine';
import type { ClientData } from '@/components/ClientInfo';

export function exportPDF(
  client: ClientData,
  revenuNet: number,
  versementPER: number,
  parts: number
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const { avant, apres, gain } = computeIRWithPER(revenuNet, versementPER, parts);
  const scenarios = generateScenarios(revenuNet, versementPER, parts);
  const now = new Date().toLocaleDateString('fr-FR');

  const margin = 20;
  let y = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Simulation PER – Gain fiscal', margin, y);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date : ${now}`, margin, y);
  y += 8;

  // Client info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations client', margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${client.prenom} ${client.nom}, ${client.age} ans`, margin, y);
  y += 10;

  // Parameters
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Paramètres', margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const params = [
    `Revenu net annuel : ${formatEuro(revenuNet)}`,
    `Versement PER : ${formatEuro(versementPER)}`,
    `Parts fiscales : ${parts}`,
    `Abattement 10% : min 504 €, max 14 426 €`,
    `Barème : IR 2025`,
  ];
  params.forEach((p) => {
    doc.text(p, margin, y);
    y += 5;
  });
  y += 5;

  // KPIs
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Résultats', margin, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Revenu imposable (avant PER)', formatEuro(avant.revenuImposable)],
      ['Impôt estimé (avant PER)', formatEuro(avant.impot)],
      ['Impôt estimé (après PER)', formatEuro(apres.impot)],
      ['Gain fiscal', formatEuro(gain)],
      ['TMI avant', formatPct(avant.tmi)],
      ['TMI après', formatPct(apres.tmi)],
    ],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 49, 74] },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Scenarios table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Scénarios de versement', margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Versement PER', 'Rev. net fiscal', 'Rev. imposable', 'Impôt', 'Gain fiscal', 'TMI']],
    body: scenarios.map((s) => [
      `${formatEuro(s.versement)} (${formatEuro(Math.round(s.versement / 12))}/mois)`,
      formatEuro(s.revenuNetFiscal),
      formatEuro(s.revenuImposable),
      formatEuro(s.impot),
      s.gain > 0 ? formatEuro(s.gain) : '–',
      formatPct(s.tmi),
    ]),
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 49, 74] },
    margin: { left: margin, right: margin },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Calcul indicatif : hors décote et dispositifs spécifiques.', margin, pageHeight - 10);

  doc.save(`simulation-per-${client.nom}-${client.prenom}.pdf`);
}
