// src/components/evaluations/BulletinPDF.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';

import {
  FileText,
  ChevronLeft,
  Download,
  Printer,
  Loader2,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  X,
  CheckCircle2
} from 'lucide-react';

import axiosInstance from '../AxiosInstance';

// ============================================================
// FONCTIONS DE FORMATAGE
// ============================================================
const formatDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

const getMention = (moyenne) => {
  if (moyenne >= 16) return { label: 'Très Bien', color: [0, 128, 0] };
  if (moyenne >= 14) return { label: 'Bien', color: [0, 0, 255] };
  if (moyenne >= 12) return { label: 'Assez Bien', color: [255, 165, 0] };
  if (moyenne >= 10) return { label: 'Passable', color: [255, 215, 0] };
  return { label: 'Non Admis', color: [255, 0, 0] };
};

const getMoyenneColor = (moyenne) => {
  if (moyenne === null || moyenne === undefined || moyenne === '') return [150, 150, 150];
  const val = parseFloat(moyenne);
  if (isNaN(val)) return [150, 150, 150];
  if (val >= 16) return [0, 128, 0];
  if (val >= 14) return [0, 0, 255];
  if (val >= 12) return [255, 165, 0];
  if (val >= 10) return [255, 215, 0];
  return [255, 0, 0];
};

// ============================================================
// APPRÉCIATIONS TEXTUELLES
// ============================================================

// Appréciation textuelle par matière (courte)
const getAppreciationMatiere = (moyenne) => {
  if (moyenne === null || moyenne === undefined || moyenne === '') return 'Non évalué';
  const val = parseFloat(moyenne);
  if (isNaN(val)) return 'Non évalué';
  if (val >= 18) return 'Exceptionnel ⭐';
  if (val >= 16) return 'Excellent';
  if (val >= 14) return 'Très bien';
  if (val >= 12) return 'Bien';
  if (val >= 10) return 'Satisfaisant';
  if (val >= 8) return 'Passable';
  return 'À améliorer';
};

// Appréciation détaillée pour une matière (pour info-bulle ou détail)
const getAppreciationDetailleeMatiere = (moyenne) => {
  if (moyenne === null || moyenne === undefined || moyenne === '') return 'Non évalué';
  const val = parseFloat(moyenne);
  if (isNaN(val)) return 'Non évalué';
  if (val >= 18) return 'Performance exceptionnelle, félicitations !';
  if (val >= 16) return 'Excellent travail, continuez ainsi !';
  if (val >= 14) return 'Très bon travail, gardez cette dynamique.';
  if (val >= 12) return 'Bon travail, quelques efforts supplémentaires seront bénéfiques.';
  if (val >= 10) return 'Travail satisfaisant, plus de rigueur est nécessaire.';
  if (val >= 8) return 'Des progrès sont à faire, ne vous découragez pas.';
  return 'Des efforts significatifs sont nécessaires pour progresser.';
};

// Appréciation générale (pour le bas du bulletin)
const getAppreciationGenerale = (moyenne, matieresAvecNotes = [], rang = null, totalEleves = null) => {
  const val = parseFloat(moyenne);
  if (isNaN(val)) return 'Aucune note enregistrée pour cette période.';
  
  let appreciation = '';
  
  // Appréciation basée sur la moyenne
  if (val >= 16) {
    appreciation = 'Excellent travail, continuez avec cette détermination ! ';
  } else if (val >= 14) {
    appreciation = 'Très bon travail, gardez cette dynamique positive. ';
  } else if (val >= 12) {
    appreciation = 'Bon travail, quelques efforts supplémentaires vous permettront de progresser. ';
  } else if (val >= 10) {
    appreciation = 'Travail satisfaisant, plus de rigueur et de régularité sont nécessaires. ';
  } else {
    appreciation = 'Des efforts supplémentaires sont nécessaires pour atteindre les objectifs. ';
  }
  
  // Ajout d'informations sur le rang si disponible
  if (rang && totalEleves && rang > 0) {
    if (rang <= Math.ceil(totalEleves * 0.1)) {
      appreciation += `Vous faites partie des 10% meilleurs de la classe (${rang}e/${totalEleves}).`;
    } else if (rang <= Math.ceil(totalEleves * 0.25)) {
      appreciation += `Vous êtes dans le premier quartile de la classe (${rang}e/${totalEleves}).`;
    } else if (rang <= Math.ceil(totalEleves * 0.5)) {
      appreciation += `Vous êtes dans la première moitié de la classe (${rang}e/${totalEleves}).`;
    } else {
      appreciation += `Vous êtes ${rang}e sur ${totalEleves} élèves.`;
    }
  }
  
  // Ajout d'information sur les matières fortes/faibles
  if (matieresAvecNotes && matieresAvecNotes.length > 0) {
    const matieresTriees = [...matieresAvecNotes].filter(m => m.aDesNotes).sort((a, b) => b.moyenne - a.moyenne);
    if (matieresTriees.length >= 3) {
      const meilleure = matieresTriees[0];
      const plusFaible = matieresTriees[matieresTriees.length - 1];
      if (meilleure && meilleure.moyenne >= 14) {
        appreciation += ` À souligner : excellente performance en ${meilleure.matiere}.`;
      }
      if (plusFaible && plusFaible.moyenne < 10) {
        appreciation += ` Des efforts sont à fournir en ${plusFaible.matiere}.`;
      }
    }
  }
  
  return appreciation;
};

// ============================================================
// FONCTION DE GÉNÉRATION PDF
// ============================================================
const generateBulletinPDF = (bulletin) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Génération du PDF avec les données:', bulletin);

      if (!bulletin) {
        reject(new Error('Aucune donnée de bulletin'));
        return;
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const margins = { left: 15, right: 15, top: 18, bottom: 18 };
      let y = margins.top;

      // ========== DONNÉES ==========
      const nomEleve = bulletin?.eleve?.nom || 'Élève';
      const matricule = bulletin?.eleve?.matricule || '-';
      const classe = bulletin?.eleve?.classe || 'N/A';
      const periode = bulletin?.periode?.libelle || 'Période';
      const matieres = bulletin?.matieres || [];
      const moyenneGenerale = bulletin?.moyenne_generale || 0;
      const moyenneClasse = bulletin?.moyenne_classe || 0;
      const rang = bulletin?.rang || '-';
      const totalEleves = bulletin?.total_eleves || 0;
      const totalCoefficients = bulletin?.total_coefficients || 0;
      
      // Utiliser l'appréciation génératrice avec plus de contexte
      const matieresAvecNotes = matieres.filter(m => m.aDesNotes);
      const appreciation = bulletin?.appreciation || getAppreciationGenerale(
        moyenneGenerale, 
        matieresAvecNotes, 
        rang, 
        totalEleves
      );

      console.log('📊 Matières à afficher:', matieres.length);
      console.log('📝 Matières avec notes:', matieresAvecNotes.length);

      // ================================================================
      // EN-TÊTE
      // ================================================================
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('SEYDI GROUP', margins.left, y + 5);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text('Dakar, Sénégal', margins.left, y + 10);
      doc.text('Tél: +221 33 123 45 67', margins.left, y + 14);
      doc.text('Email: contact@seydigroup.com', margins.left, y + 18);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('BULLETIN SCOLAIRE', pageWidth - margins.right, y + 5, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(`N° ${String(Date.now()).slice(-8)}`, pageWidth - margins.right, y + 10, { align: 'right' });
      doc.text(`Généré le ${formatDate(new Date().toISOString())}`, pageWidth - margins.right, y + 14, { align: 'right' });

      y += 27;
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.8);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 12;

      // ================================================================
      // TITRE
      // ================================================================
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('BULLETIN SCOLAIRE', pageWidth / 2, y, { align: 'center' });
      y += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(periode, pageWidth / 2, y, { align: 'center' });
      y += 14;

      // ================================================================
      // INFORMATIONS ÉLÈVE
      // ================================================================
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(margins.left, y, pageWidth - margins.left - margins.right, 30, 3, 3, 'F');
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.3);
      doc.roundedRect(margins.left, y, pageWidth - margins.left - margins.right, 30, 3, 3, 'S');

      const col1 = margins.left + 8;
      const col2 = margins.left + 60;
      const col3 = margins.left + 110;
      const col4 = margins.left + 160;
      let rowY = y + 7;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('ÉLÈVE', col1, rowY);
      doc.text('MATRICULE', col2, rowY);
      doc.text('CLASSE', col3, rowY);
      doc.text('PÉRIODE', col4, rowY);
      rowY += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(nomEleve, col1, rowY);
      doc.text(matricule, col2, rowY);
      doc.text(classe, col3, rowY);
      doc.text(periode, col4, rowY);

      y += 36;

      // ================================================================
      // TABLEAU DES NOTES
      // ================================================================
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('RÉSULTATS PAR MATIÈRE', margins.left, y);
      y += 8;

      // Ajustement des colonnes pour mieux afficher les appréciations
      const tableX1 = margins.left;
      const tableX2 = margins.left + 52;  // Matière
      const tableX3 = margins.left + 92;  // Moyenne
      const tableX4 = margins.left + 122; // Coef.
      const tableX5 = margins.left + 150; // Rang
      const tableX6 = margins.left + 175; // Appréciation
      const tableY = y;

      doc.setFillColor(26, 35, 126);
      doc.rect(tableX1, tableY, pageWidth - margins.left - margins.right, 8, 'F');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('MATIÈRE', tableX1 + 2, tableY + 5.5);
      doc.text('MOY.', tableX2 + 2, tableY + 5.5);
      doc.text('COEF.', tableX3 + 2, tableY + 5.5);
      doc.text('RANG', tableX4 + 2, tableY + 5.5);
      doc.text('APPRÉCIATION', tableX5 + 2, tableY + 5.5);

      y = tableY + 8;

      let rowIndex = 0;
      const rowHeight = 7.5;

      if (matieres.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(84, 110, 122);
        doc.text('Aucune matière configurée', pageWidth / 2, y + 10, { align: 'center' });
        y += 20;
      } else {
        for (const matiere of matieres) {
          if (rowIndex >= 20) break; // Augmenté pour plus de matières
          
          const moy = matiere.moyenne !== null && matiere.moyenne !== undefined ? matiere.moyenne : '-';
          const isNoted = moy !== '-' && moy !== '';
          const displayMoy = isNoted ? parseFloat(moy).toFixed(2) : '-';
          const color = isNoted ? getMoyenneColor(moy) : [150, 150, 150];
          
          // Appréciation textuelle par matière
          const appreciationMatiere = isNoted ? getAppreciationMatiere(moy) : 'Non évalué';
          const appreciationColor = isNoted ? getMoyenneColor(moy) : [150, 150, 150];
          
          // Appréciation détaillée pour info-bulle (optionnel)
          const appreciationDetail = isNoted ? getAppreciationDetailleeMatiere(moy) : '';

          const rowYPos = y + rowIndex * rowHeight;
          
          if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 249, 250);
            doc.rect(tableX1, rowYPos, pageWidth - margins.left - margins.right, rowHeight, 'F');
          }

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(33, 33, 33);
          
          // Tronquer le nom de la matière si trop long
          const matiereNom = matiere.matiere || 'Sans nom';
          const truncatedNom = matiereNom.length > 16 ? matiereNom.substring(0, 14) + '…' : matiereNom;
          doc.text(truncatedNom, tableX1 + 2, rowYPos + 5);

          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFont('helvetica', isNoted ? 'bold' : 'normal');
          doc.text(displayMoy, tableX2 + 2, rowYPos + 5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(33, 33, 33);
          doc.text(String(matiere.coefficient || 1), tableX3 + 2, rowYPos + 5);
          doc.text(isNoted ? String(matiere.rang || '-') : '-', tableX4 + 2, rowYPos + 5);

          // Afficher l'appréciation textuelle avec la couleur appropriée
          doc.setTextColor(appreciationColor[0], appreciationColor[1], appreciationColor[2]);
          doc.setFont('helvetica', isNoted ? 'bold' : 'normal');
          doc.text(appreciationMatiere, tableX5 + 2, rowYPos + 5);

          rowIndex++;
        }
      }

      y = y + Math.max(rowIndex, 1) * rowHeight + 6;

      // ================================================================
      // MOYENNE GÉNÉRALE
      // ================================================================
      const matieresAvecNotesFilter = matieres.filter(m => m.moyenne !== null && m.moyenne !== undefined && m.moyenne !== '');
      if (matieresAvecNotesFilter.length > 0) {
        doc.setDrawColor(26, 35, 126);
        doc.setLineWidth(0.5);
        doc.line(tableX1, y, pageWidth - margins.right, y);
        
        doc.setFillColor(240, 248, 255);
        doc.rect(tableX1, y + 1, pageWidth - margins.left - margins.right, 8, 'F');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 35, 126);
        doc.text('MOYENNE GÉNÉRALE', tableX1 + 2, y + 6.5);

        doc.setTextColor(26, 35, 126);
        doc.text(`${moyenneGenerale.toFixed(2)} / 20`, tableX2 + 2, y + 6.5);
        doc.text(`Coef. ${totalCoefficients}`, tableX3 + 2, y + 6.5);

        // Mention avec couleur appropriée
        const mentionFinale = getMention(moyenneGenerale);
        doc.setTextColor(mentionFinale.color[0], mentionFinale.color[1], mentionFinale.color[2]);
        doc.text(mentionFinale.label, tableX5 + 2, y + 6.5);

        y += 14;
      } else {
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.line(tableX1, y, pageWidth - margins.right, y);
        y += 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('Aucune note enregistrée pour cette période', pageWidth / 2, y, { align: 'center' });
        y += 10;
      }

      // ================================================================
      // STATISTIQUES
      // ================================================================
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('STATISTIQUES', margins.left, y);
      y += 6;

      const statX1 = margins.left;
      const statX2 = margins.left + 70;
      const statX3 = margins.left + 140;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 144, 156);
      doc.text('MOYENNE DE LA CLASSE', statX1, y);
      doc.text('RANG', statX2, y);
      doc.text('NOMBRE D\'ÉLÈVES', statX3, y);

      y += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 33, 33);
      doc.text(moyenneClasse > 0 ? `${moyenneClasse.toFixed(2)} / 20` : 'N/A', statX1, y);
      doc.text(rang !== '-' ? `${rang}` : 'N/A', statX2, y);
      doc.text(totalEleves > 0 ? String(totalEleves) : 'N/A', statX3, y);

      y += 12;

      // ================================================================
      // APPRÉCIATION GÉNÉRALE
      // ================================================================
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('APPRÉCIATION GÉNÉRALE', margins.left, y);
      y += 6;

      // Décorations pour l'appréciation
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margins.left + 2, y - 2, pageWidth - margins.left - margins.right - 4, 0, 2, 2, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(60, 60, 70);
      
      const appreciationLines = doc.splitTextToSize(`"${appreciation}"`, pageWidth - margins.left - margins.right - 14);
      doc.text(appreciationLines, margins.left + 8, y);
      y += (appreciationLines.length * 5.5) + 14;

      // ================================================================
      // SIGNATURES
      // ================================================================
      doc.setDrawColor(200, 200, 210);
      doc.setLineWidth(0.3);
      
      // Ligne pour la signature du chef d'établissement
      const signatureY = y + 10;
      doc.line(margins.left + 10, signatureY, margins.left + 60, signatureY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 130);
      doc.text('Signature du Chef d\'Établissement', margins.left + 10, signatureY + 4);
      
      // Cachet
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 160);
      doc.text('Cachet de l\'établissement', pageWidth - margins.right - 40, signatureY + 4);
      
      y = signatureY + 12;

      // ================================================================
      // PIED DE PAGE
      // ================================================================
      const footerY = pageHeight - margins.bottom - 8;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.3);
      doc.line(margins.left, footerY - 3, pageWidth - margins.right, footerY - 3);
      
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 160);
      doc.text('SEYDI GROUP - DAKAR, SÉNÉGAL', pageWidth / 2, footerY + 2, { align: 'center' });
      doc.text('Tél: +221 33 123 45 67 - Email: contact@seydigroup.com', pageWidth / 2, footerY + 6, { align: 'center' });

      doc.setFontSize(6.5);
      doc.setTextColor(180, 180, 190);
      doc.text('Page 1/1', pageWidth - margins.right, footerY + 6, { align: 'right' });

      const pdfBlob = doc.output('blob');
      console.log('✅ PDF généré avec succès');
      resolve(pdfBlob);

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      reject(error);
    }
  });
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
function BulletinPDF() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  
  const [bulletin, setBulletin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [periodes, setPeriodes] = useState([]);
  const iframeRef = useRef(null);

  // Afficher une notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // CHARGEMENT DU BULLETIN
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        const searchParams = new URLSearchParams(location.search);
        const eleveId = searchParams.get('eleve') || id;
        const periodeId = searchParams.get('periode');

        console.log('📌 Paramètres:', { eleveId, periodeId, id });

        if (!eleveId || !periodeId) {
          setError('Paramètres manquants: eleve et periode sont requis');
          setLoading(false);
          return;
        }

        // ================================================================
        // ÉTAPE 1: Charger les périodes
        // ================================================================
        console.log('🔍 Récupération des périodes...');
        try {
          const periodesRes = await axiosInstance.get('/periodes/', headers);
          let periodesData = [];
          if (Array.isArray(periodesRes.data)) {
            periodesData = periodesRes.data;
          } else if (periodesRes.data?.results) {
            periodesData = periodesRes.data.results;
          }
          setPeriodes(periodesData);
          console.log('📋 Périodes chargées:', periodesData.length);
        } catch (e) {
          console.warn('Impossible de charger les périodes:', e);
        }

        // ================================================================
        // ÉTAPE 2: Récupérer les informations de l'élève
        // ================================================================
        console.log('🔍 Récupération de l\'élève...');
        const eleveRes = await axiosInstance.get(`/eleves/${eleveId}/`, headers);
        const eleve = eleveRes.data;
        console.log('👤 Élève:', eleve);

        // ================================================================
        // ÉTAPE 3: Récupérer le niveau de l'élève
        // ================================================================
        const niveauId = eleve.niveau;
        console.log('📚 Niveau:', niveauId);

        // ================================================================
        // ÉTAPE 4: Récupérer TOUTES les matières du niveau
        // ================================================================
        console.log('🔍 Récupération des matières du niveau...');
        let toutesLesMatieres = [];
        try {
          const matieresNiveauRes = await axiosInstance.get(`/matieres/?niveau=${niveauId}`, headers);
          if (Array.isArray(matieresNiveauRes.data)) {
            toutesLesMatieres = matieresNiveauRes.data;
          } else if (matieresNiveauRes.data?.results) {
            toutesLesMatieres = matieresNiveauRes.data.results;
          }
        } catch (e) {
          console.warn('Impossible de récupérer les matières du niveau:', e);
          try {
            const allMatieresRes = await axiosInstance.get('/matieres/', headers);
            if (Array.isArray(allMatieresRes.data)) {
              toutesLesMatieres = allMatieresRes.data;
            } else if (allMatieresRes.data?.results) {
              toutesLesMatieres = allMatieresRes.data.results;
            }
          } catch (e2) {
            console.error('Impossible de récupérer les matières:', e2);
          }
        }
        console.log('📚 Matières trouvées:', toutesLesMatieres.length);

        // ================================================================
        // ÉTAPE 5: Récupérer les notes de l'élève
        // ================================================================
        console.log('🔍 Récupération des notes...');
        const notesRes = await axiosInstance.get(`/notes/?eleve=${eleveId}`, headers);
        let notesData = [];
        if (Array.isArray(notesRes.data)) {
          notesData = notesRes.data;
        } else if (notesRes.data?.results) {
          notesData = notesRes.data.results;
        }
        console.log('📝 Notes totales:', notesData.length);

        // ================================================================
        // ÉTAPE 6: Récupérer les évaluations de la période
        // ================================================================
        console.log('🔍 Récupération des évaluations...');
        const evalRes = await axiosInstance.get(`/evaluations/?periode=${periodeId}`, headers);
        let evalData = [];
        if (Array.isArray(evalRes.data)) {
          evalData = evalRes.data;
        } else if (evalRes.data?.results) {
          evalData = evalRes.data.results;
        }
        console.log('📋 Évaluations:', evalData.length);

        // ================================================================
        // ÉTAPE 7: Filtrer les notes par période
        // ================================================================
        const evaluationIds = evalData.map(e => e.id);
        const notesPeriode = notesData.filter(n => evaluationIds.includes(n.evaluation));
        console.log('📝 Notes de la période:', notesPeriode.length);

        // ================================================================
        // ÉTAPE 8: Regrouper les notes par matière
        // ================================================================
        const notesParMatiere = {};
        for (const note of notesPeriode) {
          const evaluation = evalData.find(e => e.id === note.evaluation);
          if (!evaluation) continue;
          
          const matiereId = evaluation.matiere;
          if (!notesParMatiere[matiereId]) {
            notesParMatiere[matiereId] = {
              notes: [],
              matiere_id: matiereId
            };
          }
          
          if (note.note !== null && note.note !== undefined) {
            notesParMatiere[matiereId].notes.push(parseFloat(note.note) || 0);
          }
        }

        // ================================================================
        // ÉTAPE 9: Construire le tableau des matières avec leurs moyennes
        // ================================================================
        const matieresResult = [];
        let totalCoefficients = 0;
        let sommePonderee = 0;

        for (const matiere of toutesLesMatieres) {
          const matiereId = matiere.id;
          const notes = notesParMatiere[matiereId]?.notes || [];
          
          let moyenne = null;
          let nombreEvaluations = 0;
          
          if (notes.length > 0) {
            const somme = notes.reduce((a, b) => a + b, 0);
            moyenne = somme / notes.length;
            nombreEvaluations = notes.length;
          }
          
          let coefficient = 1;
          try {
            const configRes = await axiosInstance.get(`/matieres/${matiereId}/configurations/`, headers);
            if (configRes.data && configRes.data.length > 0) {
              const config = configRes.data.find(c => c.niveau === niveauId);
              if (config) {
                coefficient = config.coefficient || 1;
              }
            }
          } catch (e) {
            coefficient = 1;
          }
          
          matieresResult.push({
            matiere: matiere.nom,
            matiere_id: matiereId,
            moyenne: moyenne,
            coefficient: coefficient,
            nombre_evaluations: nombreEvaluations,
            rang: moyenne !== null ? 0 : null,
            aDesNotes: moyenne !== null
          });
          
          if (moyenne !== null) {
            totalCoefficients += coefficient;
            sommePonderee += moyenne * coefficient;
          }
        }

        console.log('📚 Matières traitées:', matieresResult.length);
        console.log('📊 Matières avec notes:', matieresResult.filter(m => m.aDesNotes).length);

        // ================================================================
        // ÉTAPE 10: Calculer la moyenne générale
        // ================================================================
        const moyenneGenerale = totalCoefficients > 0 ? sommePonderee / totalCoefficients : 0;

        // ================================================================
        // ÉTAPE 11: Trier et ajouter les rangs
        // ================================================================
        const matieresAvecNotes = matieresResult.filter(m => m.aDesNotes);
        matieresAvecNotes.sort((a, b) => b.moyenne - a.moyenne);
        matieresAvecNotes.forEach((item, index) => {
          const originalItem = matieresResult.find(m => m.matiere_id === item.matiere_id);
          if (originalItem) {
            originalItem.rang = index + 1;
          }
        });

        // ================================================================
        // ÉTAPE 12: Moyenne de la classe et rang
        // ================================================================
        let moyenneClasse = 0;
        let rang = 0;
        let totalEleves = 0;

        try {
          const classeElevesRes = await axiosInstance.get(`/eleves/?classe=${eleve.classe}&statut=actif`, headers);
          let classeEleves = [];
          if (Array.isArray(classeElevesRes.data)) {
            classeEleves = classeElevesRes.data;
          } else if (classeElevesRes.data?.results) {
            classeEleves = classeElevesRes.data.results;
          }
          
          totalEleves = classeEleves.length;
          
          const moyennesClasse = [];
          for (const eleveClasse of classeEleves) {
            if (eleveClasse.id === parseInt(eleveId)) continue;
            
            try {
              const notesClasseRes = await axiosInstance.get(`/notes/?eleve=${eleveClasse.id}`, headers);
              let notesClasse = [];
              if (Array.isArray(notesClasseRes.data)) {
                notesClasse = notesClasseRes.data;
              } else if (notesClasseRes.data?.results) {
                notesClasse = notesClasseRes.data.results;
              }
              
              const notesClassePeriode = notesClasse.filter(n => evaluationIds.includes(n.evaluation));
              if (notesClassePeriode.length > 0) {
                const notesValides = notesClassePeriode.filter(n => n.note !== null && n.note !== undefined);
                if (notesValides.length > 0) {
                  const sum = notesValides.reduce((s, n) => s + (parseFloat(n.note) || 0), 0);
                  const moy = sum / notesValides.length;
                  moyennesClasse.push(moy);
                }
              }
            } catch (e) {}
          }
          
          if (moyennesClasse.length > 0) {
            const sumClasse = moyennesClasse.reduce((a, b) => a + b, 0);
            moyenneClasse = sumClasse / moyennesClasse.length;
          }
          
          if (moyenneGenerale > 0) {
            const toutesMoyennes = [...moyennesClasse, moyenneGenerale];
            toutesMoyennes.sort((a, b) => b - a);
            rang = toutesMoyennes.indexOf(moyenneGenerale) + 1;
          }
          
        } catch (e) {
          console.warn('Impossible de calculer le rang:', e);
        }

        // ================================================================
        // ÉTAPE 13: Récupérer le libellé de la période
        // ================================================================
        let periodeLibelle = 'Période';
        let periodeAnnee = '';
        try {
          const periodeInfo = periodes.find(p => p.id === parseInt(periodeId));
          if (periodeInfo) {
            periodeLibelle = periodeInfo.libelle || 'Période';
            periodeAnnee = periodeInfo.annee_libelle || '';
          }
        } catch (e) {
          console.warn('Impossible de récupérer le libellé de la période:', e);
        }

        // ================================================================
        // ÉTAPE 14: Construire le bulletin
        // ================================================================
        const matieresAvecNotesFinal = matieresResult.filter(m => m.aDesNotes);
        const bulletinData = {
          eleve: {
            id: eleve.id,
            nom: eleve.nom_complet || eleve.nom || eleve.prenom,
            matricule: eleve.matricule || '-',
            classe: eleve.classe_nom || 'N/A'
          },
          periode: {
            id: periodeId,
            libelle: periodeLibelle,
            annee: periodeAnnee
          },
          matieres: matieresResult,
          moyenne_generale: moyenneGenerale,
          moyenne_classe: moyenneClasse,
          rang: rang,
          total_eleves: totalEleves,
          total_coefficients: totalCoefficients,
          appreciation: getAppreciationGenerale(moyenneGenerale, matieresAvecNotesFinal, rang, totalEleves)
        };

        console.log('📊 Bulletin construit:', bulletinData);
        console.log('📚 Matières totales:', bulletinData.matieres.length);
        console.log('📊 Matières notées:', bulletinData.matieres.filter(m => m.aDesNotes).length);

        setBulletin(bulletinData);
        await generatePDF(bulletinData);

      } catch (error) {
        console.error('❌ Erreur:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Erreur lors du chargement du bulletin: ' + (error.message || ''));
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [id, location.search, navigate]);

  // ============================================================
  // GÉNÉRER LE PDF
  // ============================================================
  const generatePDF = async (bulletinData) => {
    if (!bulletinData) {
      showNotification('Aucune donnée à afficher', 'error');
      return;
    }
    
    setGenerating(true);
    try {
      console.log('📄 Génération du PDF...');
      const blob = await generateBulletinPDF(bulletinData);

      const url = URL.createObjectURL(blob);
      
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      
      setPdfBlobUrl(url);

      if (iframeRef.current) {
        iframeRef.current.src = url;
      }

      console.log('✅ PDF généré avec succès');

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      showNotification('Erreur lors de la génération du PDF: ' + error.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleDownload = () => {
    if (pdfBlobUrl) {
      const nomFichier = `Bulletin_${bulletin?.eleve?.nom || 'eleve'}.pdf`;
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = nomFichier;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('PDF téléchargé avec succès', 'success');
    }
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.print();
      } catch (e) {
        if (pdfBlobUrl) {
          const win = window.open(pdfBlobUrl, '_blank');
          win?.focus();
        }
      }
    }
  };

  const handleRegenerate = async () => {
    if (bulletin) {
      await generatePDF(bulletin);
      showNotification('PDF régénéré avec succès', 'success');
    }
  };

  const handleBack = () => {
    navigate('/bulletins');
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Chargement du bulletin...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-600">Erreur</h3>
          <p className="text-gray-600 mt-2">{error}</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={handleBack} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Retour
            </button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      
      {notification.show && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 ${
          notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="ml-4 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barre d'outils */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">Bulletin PDF</h1>
              <p className="text-xs text-gray-500">
                {bulletin?.eleve?.nom || 'Élève'} - {bulletin?.matieres?.filter(m => m.aDesNotes).length || 0}/{bulletin?.matieres?.length || 0} matière(s) notée(s)
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleDownload} className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5 text-sm disabled:opacity-50" disabled={!pdfBlobUrl || generating}>
            <Download className="w-4 h-4" /> Télécharger
          </button>
          <button onClick={handlePrint} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm disabled:opacity-50" disabled={!pdfBlobUrl || generating}>
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button onClick={handleRegenerate} className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-1.5 text-sm disabled:opacity-50" disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {generating ? 'Génération...' : 'Régénérer'}
          </button>
        </div>
      </div>

      {/* Aperçu PDF */}
      <div className="flex-1 bg-gray-100 p-2 overflow-hidden">
        {generating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Génération du PDF en cours...</p>
            </div>
          </div>
        ) : pdfBlobUrl ? (
          <iframe ref={iframeRef} src={pdfBlobUrl} className="w-full h-full rounded-lg shadow-lg border border-gray-200 bg-white" title="Aperçu du bulletin" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun aperçu disponible</p>
              <button onClick={handleRegenerate} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1.5 mx-auto">
                <FileText className="w-4 h-4" /> Générer le PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BulletinPDF;