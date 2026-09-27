// src/components/academic/EmploiDuTempsPdf.jsx
import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const EmploiDuTempsPdf = ({
  cours = [],
  stats = {},
  filterType = 'classe',
  filterValue = '',
  filterOptions = [],
  filters = {},
  currentWeekStart = new Date(),
  jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  joursDisplay = {
    lundi: 'Lun',
    mardi: 'Mar',
    mercredi: 'Mer',
    jeudi: 'Jeu',
    vendredi: 'Ven',
    samedi: 'Sam'
  },
  joursComplet = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi'
  },
  typeCoursConfig = {
    cours: { label: 'CM', color: '#2563eb' },
    td: { label: 'TD', color: '#6b7280' },
    tp: { label: 'TP', color: '#8b5cf6' }
  },
  getCoursForDay = () => [],
  formatHeure = (h) => h?.substring(0, 5) || '',
  getDuree = () => ''
}) => {
  const [exportLoading, setExportLoading] = useState(false);

  const joursTravail = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const joursAffiches = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi'
  };

  const getFilterLabel = () => {
    const selectedOption = filterOptions.find(
      opt => opt.value.toString() === filterValue.toString()
    );
    if (selectedOption) {
      const typeLabel = filterType === 'classe' ? 'Classe' :
                       filterType === 'enseignant' ? 'Professeur' : 'Salle';
      return `${typeLabel} : ${selectedOption.label}`;
    }
    return '';
  };

  const generatePDF = async () => {
    if (!cours || cours.length === 0) {
      toast.error('Aucun cours à exporter');
      return;
    }

    setExportLoading(true);
    const toastId = toast.loading('Génération du PDF en cours...');

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
      });

      doc.setFont('times');

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margins = { left: 10, right: 10, top: 15, bottom: 15 };
      const contentWidth = pageWidth - margins.left - margins.right;
      let y = margins.top;

      const colors = {
        primary: [26, 35, 126],
        primaryLight: [63, 81, 181],
        secondary: [84, 110, 122],
        text: [33, 33, 33],
        textLight: [120, 144, 156],
        background: [248, 249, 250],
        border: [200, 200, 200],
        white: [255, 255, 255],
        warning: [245, 158, 11],
        error: [239, 68, 68],
        success: [34, 197, 94],
        headerBg: [240, 242, 245]
      };

      // ========== EN-TÊTE ==========
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('EMPLOI DU TEMPS', pageWidth / 2, y, { align: 'center' });
      y += 9;

      doc.setFontSize(13);
      doc.setFont('times', 'normal');
      doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      doc.text('Établissement Scolaire - Année Académique', pageWidth / 2, y, { align: 'center' });
      y += 8;

      const filterLabel = getFilterLabel();
      if (filterLabel) {
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setLineWidth(0.1);
        const filterBoxWidth = 120;
        const filterBoxX = (pageWidth - filterBoxWidth) / 2;
        doc.roundedRect(filterBoxX, y - 3, filterBoxWidth, 10, 3, 3, 'FD');

        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(filterLabel, pageWidth / 2, y + 5, { align: 'center' });
        y += 12;
      }

      const weekStart = currentWeekStart;
      const weekEnd = addDays(currentWeekStart, 5);
      doc.setFontSize(11);
      doc.setFont('times', 'normal');
      doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      doc.text(
        `Semaine du ${format(weekStart, 'dd MMMM yyyy', { locale: fr })} au ${format(weekEnd, 'dd MMMM yyyy', { locale: fr })}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      y += 6;

      let filterTexts = [];
      if (filters.type_cours) {
        const typeLabel = typeCoursConfig[filters.type_cours]?.label || filters.type_cours;
        filterTexts.push(`Type : ${typeLabel}`);
      }
      if (filters.est_recurrent !== '') {
        filterTexts.push(filters.est_recurrent === 'true' ? 'Cours récurrents' : 'Cours ponctuels');
      }
      if (filters.jour) {
        filterTexts.push(`Jour : ${joursComplet[filters.jour]}`);
      }
      if (filterTexts.length > 0) {
        doc.setFontSize(9);
        doc.setFont('times', 'italic');
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.text(filterTexts.join('  •  '), pageWidth / 2, y, { align: 'center' });
        y += 6;
      }

      doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setLineWidth(0.8);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      doc.setLineWidth(0.3);
      doc.line(margins.left, y + 1.5, pageWidth - margins.right, y + 1.5);
      y += 8;

      // ========== STATISTIQUES ==========
      const statsData = [
        { label: 'Total Cours', value: stats.total || cours.length, icon: '📚' },
        { label: 'Jours', value: Object.keys(stats.parJour || {}).length, icon: '📅' },
        { label: 'Matières', value: Object.keys(stats.parMatiere || {}).length, icon: '📖' },
        { label: 'Enseignants', value: Object.keys(stats.parEnseignant || {}).length, icon: '👨‍🏫' },
        { label: 'Durée Totale', value: `${Math.round((stats.dureeTotale || 0) / 60)}h`, icon: '⏰' }
      ];

      const statsWidth = contentWidth / statsData.length;
      doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.3);

      statsData.forEach((stat, index) => {
        const x = margins.left + index * statsWidth;
        doc.roundedRect(x, y, statsWidth - 1, 16, 3, 3, 'FD');
        doc.setFontSize(16);
        doc.setFont('times', 'bold');
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(stat.value.toString(), x + statsWidth / 2, y + 7, { align: 'center' });
        doc.setFontSize(7.5);
        doc.setFont('times', 'normal');
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        let labelText = stat.label;
        if (stat.label === 'Total Cours') labelText = 'Cours';
        else if (stat.label === 'Jours') labelText = 'Jours';
        else if (stat.label === 'Matières') labelText = 'Matières';
        else if (stat.label === 'Enseignants') labelText = 'Professeurs';
        else if (stat.label === 'Durée Totale') labelText = 'Durée';
        doc.text(labelText, x + statsWidth / 2, y + 13.5, { align: 'center' });
      });

      y += 22;

      // ========== GRILLE (6 jours) ==========
      const colWidth = contentWidth / 6;
      const rowHeight = 28;
      const maxRows = 10;

      // ---- En-têtes des colonnes (sans les dates) ----
      const headerHeight = 14; // légèrement plus haut pour plus de lisibilité
      for (let i = 0; i < 6; i++) {
        const x = margins.left + i * colWidth;
        const jour = joursTravail[i];
        const date = addDays(currentWeekStart, i);
        const isToday = new Date().toDateString() === date.toDateString();

        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, colWidth, headerHeight, 3, 3, 'FD');

        // Nom du jour en grand
        doc.setFontSize(13);
        doc.setFont('times', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(joursAffiches[jour], x + colWidth / 2, y + headerHeight / 2 + 1.5, { align: 'center' });

        // Petit indicateur "Aujourd'hui" si c'est le jour courant (sans date)
        if (isToday) {
          doc.setFontSize(6);
          doc.setFont('times', 'italic');
          doc.setTextColor(255, 255, 200);
          doc.text("Aujourd'hui", x + colWidth / 2, y + headerHeight - 2, { align: 'center' });
        }
      }

      y += headerHeight + 2; // petit espace

      // ---- Contenu des colonnes ----
      for (let i = 0; i < 6; i++) {
        const x = margins.left + i * colWidth;
        const coursOfDay = getCoursForDay(i);
        const sortedCours = [...coursOfDay].sort((a, b) => 
          (a.heure_debut || '').localeCompare(b.heure_debut || '')
        );

        const colHeight = Math.min(sortedCours.length * rowHeight + 4, 270);
        doc.setFillColor(252, 252, 253);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, colWidth - 0.5, colHeight, 2, 2, 'FD');

        if (sortedCours.length === 0) {
          doc.setFontSize(14);
          doc.setFont('times', 'normal');
          doc.setTextColor(210, 210, 210);
          doc.text('—', x + colWidth / 2, y + 20, { align: 'center' });
          doc.setFontSize(7);
          doc.setFont('times', 'italic');
          doc.setTextColor(200, 200, 200);
          doc.text('Aucun cours', x + colWidth / 2, y + 30, { align: 'center' });
        } else {
          let rowY = y + 2;
          sortedCours.slice(0, maxRows).forEach((c) => {
            const typeInfo = typeCoursConfig[c.type_cours] || { label: 'Cours', color: '#2563eb' };
            const isException = c.est_exception;
            const isAnnule = c.est_annule;

            const isEven = Math.floor((rowY - y) / rowHeight) % 2 === 0;
            doc.setFillColor(
              isAnnule ? 248 : (isException ? 255 : (isEven ? 252 : 248)),
              isAnnule ? 248 : (isException ? 248 : (isEven ? 252 : 248)),
              isAnnule ? 248 : (isException ? 240 : (isEven ? 252 : 248))
            );
            doc.setDrawColor(235, 235, 235);
            doc.setLineWidth(0.1);
            doc.roundedRect(x + 1, rowY, colWidth - 3, rowHeight - 1, 2, 2, 'FD');

            // LIGNE 1 : Matière
            doc.setFontSize(10);
            doc.setFont('times', 'bold');
            if (isAnnule) {
              doc.setTextColor(180, 180, 180);
            } else if (isException) {
              doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
            } else {
              doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            }
            const matiere = c.matiere_nom || 'Sans matière';
            const matiereDisplay = matiere.length > 28 ? matiere.substring(0, 26) + '…' : matiere;
            doc.text(matiereDisplay, x + 4, rowY + 6);

            // LIGNE 2 : Horaire + durée
            doc.setFontSize(8);
            doc.setFont('times', 'normal');
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            const duree = getDuree(c.heure_debut, c.heure_fin);
            const heureStr = `${formatHeure(c.heure_debut)} - ${formatHeure(c.heure_fin)}${duree ? `  (${duree})` : ''}`;
            doc.text(`Horaire : ${heureStr}`, x + 4, rowY + 11);

            // LIGNE 3 : Enseignant + Salle
            doc.setFontSize(7.5);
            doc.setFont('times', 'normal');
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            let infoLine = '';
            if (c.enseignant_nom) {
              const enseignant = c.enseignant_nom;
              infoLine += `Prof : ${enseignant.length > 20 ? enseignant.substring(0, 18) + '…' : enseignant}`;
            }
            if (c.salle_nom) {
              if (infoLine) infoLine += '  •  ';
              const salle = c.salle_nom;
              infoLine += `Salle : ${salle.length > 15 ? salle.substring(0, 13) + '…' : salle}`;
            }
            if (infoLine) {
              doc.text(infoLine, x + 4, rowY + 16);
            }

            // LIGNE 4 (optionnelle) : Exception/Annulation ou Classe
            let yOffset = 21;
            if (isException || isAnnule) {
              const label = isAnnule ? 'Annulé' : 'Exception';
              const color = isAnnule ? colors.error : colors.warning;
              doc.setFontSize(8);
              doc.setFont('times', 'bold');
              doc.setTextColor(color[0], color[1], color[2]);
              doc.text(label, x + 4, rowY + yOffset);
              if (c.raison_ajustement && !isAnnule) {
                doc.setFontSize(6);
                doc.setFont('times', 'italic');
                doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
                const raison = c.raison_ajustement.length > 25 ? c.raison_ajustement.substring(0, 23) + '…' : c.raison_ajustement;
                doc.text(`(${raison})`, x + 4 + doc.getTextWidth(label) + 2, rowY + yOffset);
              }
              yOffset += 4;
            }

            if (c.classe_nom && filterType !== 'classe') {
              doc.setFontSize(6.5);
              doc.setFont('times', 'normal');
              doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
              const classe = c.classe_nom;
              doc.text(`Classe : ${classe.length > 20 ? classe.substring(0, 18) + '…' : classe}`, x + 4, rowY + yOffset);
            }

            // Badge type (en haut à droite)
            const badgeColors = {
              cours: { bg: [219, 234, 254], text: [30, 64, 175] },
              td: { bg: [209, 250, 229], text: [6, 95, 70] },
              tp: { bg: [252, 231, 243], text: [157, 23, 77] }
            };
            const colorsBadge = badgeColors[c.type_cours] || badgeColors.cours;
            doc.setFillColor(colorsBadge.bg[0], colorsBadge.bg[1], colorsBadge.bg[2]);
            doc.setDrawColor(colorsBadge.bg[0], colorsBadge.bg[1], colorsBadge.bg[2]);
            const badgeX = x + colWidth - 20;
            const badgeY = rowY + 2;
            doc.roundedRect(badgeX, badgeY, 15, 6, 2, 2, 'FD');
            doc.setFontSize(6);
            doc.setFont('times', 'bold');
            doc.setTextColor(colorsBadge.text[0], colorsBadge.text[1], colorsBadge.text[2]);
            doc.text(typeInfo.label, badgeX + 7.5, badgeY + 4.5, { align: 'center' });

            rowY += rowHeight;
          });

          if (sortedCours.length > maxRows) {
            doc.setFontSize(6);
            doc.setFont('times', 'italic');
            doc.setTextColor(150, 150, 150);
            const remaining = sortedCours.length - maxRows;
            doc.text(`+ ${remaining} cours supplémentaire${remaining > 1 ? 's' : ''}`, x + colWidth / 2, rowY + 8, { align: 'center' });
          }
        }
      }

      y += 270; // hauteur fixe, peut être ajustée dynamiquement si besoin

      // ========== PIED DE PAGE ==========
      const footerY = pageHeight - margins.bottom - 12;
      doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margins.left, footerY - 6, pageWidth - margins.right, footerY - 6);
      doc.setLineWidth(0.2);
      doc.line(margins.left, footerY - 4.5, pageWidth - margins.right, footerY - 4.5);

      doc.setFontSize(8);
      doc.setFont('times', 'normal');
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      const footerText = `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} • ${cours.length} cours au total`;
      doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });

      doc.setFontSize(6.5);
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text(
        'CM : Cours Magistral  |  TD : Travaux Dirigés  |  TP : Travaux Pratiques  |  Exception  |  Annulé',
        pageWidth / 2,
        footerY + 5,
        { align: 'center' }
      );

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 170);
        doc.text(
          `Page ${i}/${pageCount}`,
          pageWidth - margins.right,
          pageHeight - margins.bottom,
          { align: 'right' }
        );
      }

      const fileName = `emploi_du_temps_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      toast.success('PDF téléchargé avec succès !', { id: toastId });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF : ' + error.message, { id: toastId });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="btn btn-primary btn-sm gap-2"
      disabled={!cours || cours.length === 0 || exportLoading}
    >
      {exportLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      PDF
    </button>
  );
};

export default EmploiDuTempsPdf;