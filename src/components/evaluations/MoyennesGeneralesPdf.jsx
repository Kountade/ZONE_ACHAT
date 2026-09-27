// src/components/evaluations/MoyennesGeneralesPdf.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  FileText, ChevronLeft, Download, Printer, Loader2, Wifi, WifiOff,
  AlertTriangle, RefreshCw, X, CheckCircle2, School, Users, User,
  Calendar, BarChart3, Award, Star, Crown, Trophy, Medal, Gauge,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';

// ============================================================
// FORMATAGE
// ============================================================
const formatDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch { return '-'; }
};

const getMentionLabel = (moyenne) => {
  if (moyenne >= 16) return 'Très Bien';
  if (moyenne >= 14) return 'Bien';
  if (moyenne >= 12) return 'Assez Bien';
  if (moyenne >= 10) return 'Passable';
  if (moyenne > 0) return 'Non Admis';
  return 'Non noté';
};

const getMentionColor = (mention) => {
  const map = {
    'Très Bien': [0, 128, 0],
    'Bien': [0, 0, 255],
    'Assez Bien': [255, 165, 0],
    'Passable': [255, 215, 0],
    'Non Admis': [255, 0, 0],
    'Non noté': [150, 150, 150]
  };
  return map[mention] || [100, 100, 100];
};

const getMoyenneColor = (moyenne) => {
  if (moyenne === null || moyenne === undefined || moyenne === 0) return [150, 150, 150];
  const val = parseFloat(moyenne);
  if (isNaN(val)) return [150, 150, 150];
  if (val >= 16) return [0, 128, 0];
  if (val >= 12) return [255, 165, 0];
  if (val >= 10) return [255, 215, 0];
  return [255, 0, 0];
};

// ============================================================
// GÉNÉRATION PDF — MODE PAYSAGE
// ============================================================
const generateMoyennesGeneralesPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Génération du PDF (Paysage)...');

      if (!data || !data.moyennes || data.moyennes.length === 0) {
        reject(new Error('Aucune donnée de moyennes générales'));
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = 297;
      const pageHeight = 210;
      const margins = { left: 15, right: 15, top: 18, bottom: 18 };
      let y = margins.top;

      const moyennes = data.moyennes || [];
      const classeNom = data.classe_nom || 'Classe';
      const periodeLibelle = data.periode_libelle || 'Période';
      const stats = data.stats || {
        total: 0, moyenneGenerale: 0, max: 0, min: 0,
        mentionTB: 0, mentionB: 0, mentionAB: 0, mentionP: 0, mentionNA: 0
      };

      // ============================================================
      // EN-TÊTE
      // ============================================================
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('SEYDI GROUP', margins.left, y + 6);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('MOYENNES GÉNÉRALES', pageWidth - margins.right, y + 6, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text('Dakar, Sénégal', margins.left, y + 12);
      doc.text('Tél: +221 33 123 45 67 - Email: contact@seydigroup.com', margins.left, y + 16);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text(`${classeNom}`, pageWidth - margins.right, y + 12, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(`Période: ${periodeLibelle}`, pageWidth - margins.right, y + 16, { align: 'right' });
      doc.text(`Généré le ${formatDate(new Date().toISOString())}`, pageWidth - margins.right, y + 20, { align: 'right' });

      y += 26;
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 8;

      // ============================================================
      // STATISTIQUES
      // ============================================================
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(margins.left, y, pageWidth - margins.left - margins.right, 22, 3, 3, 'F');
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.3);
      doc.roundedRect(margins.left, y, pageWidth - margins.left - margins.right, 22, 3, 3, 'S');

      const colW = (pageWidth - margins.left - margins.right) / 7;
      let rowY = y + 5;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('Total', margins.left + colW * 0 + 4, rowY);
      doc.text('Moyenne', margins.left + colW * 1 + 4, rowY);
      doc.text('Maximum', margins.left + colW * 2 + 4, rowY);
      doc.text('Minimum', margins.left + colW * 3 + 4, rowY);
      doc.text('TB', margins.left + colW * 4 + 4, rowY);
      doc.text('B/AB', margins.left + colW * 5 + 4, rowY);
      doc.text('NA', margins.left + colW * 6 + 4, rowY);

      rowY += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 33, 33);
      doc.text(String(stats.total || 0), margins.left + colW * 0 + 4, rowY);
      doc.text((stats.moyenneGenerale || 0).toFixed(2), margins.left + colW * 1 + 4, rowY);
      doc.text((stats.max || 0).toFixed(2), margins.left + colW * 2 + 4, rowY);
      doc.text((stats.min || 0).toFixed(2), margins.left + colW * 3 + 4, rowY);
      doc.text(String(stats.mentionTB || 0), margins.left + colW * 4 + 4, rowY);
      doc.text(String((stats.mentionB || 0) + (stats.mentionAB || 0)), margins.left + colW * 5 + 4, rowY);
      doc.text(String(stats.mentionNA || 0), margins.left + colW * 6 + 4, rowY);

      y += 28;

      // ============================================================
      // TABLEAU
      // ============================================================
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('LISTE DES ÉLÈVES', margins.left, y);
      y += 3;
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.3);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 8;

      const col1 = 16, col2 = 65, col3 = 45, col4 = 35, col5 = 30, col6 = 65;
      const rowHeight = 8;
      const tableY = y;

      doc.setFillColor(26, 35, 126);
      doc.rect(margins.left, tableY, pageWidth - margins.left - margins.right, rowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');

      const headerCenterY = tableY + rowHeight / 2 + 0.5;
      let xPos = margins.left;
      doc.text('Rang', xPos + col1 / 2, headerCenterY, { align: 'center' }); xPos += col1;
      doc.text('Élève', xPos + col2 / 2, headerCenterY, { align: 'center' }); xPos += col2;
      doc.text('Matricule', xPos + col3 / 2, headerCenterY, { align: 'center' }); xPos += col3;
      doc.text('Moyenne', xPos + col4 / 2, headerCenterY, { align: 'center' }); xPos += col4;
      doc.text('Notes', xPos + col5 / 2, headerCenterY, { align: 'center' }); xPos += col5;
      doc.text('Mention', xPos + col6 / 2, headerCenterY, { align: 'center' });

      doc.setTextColor(33, 33, 33);
      y = tableY + rowHeight;

      const maxRowsPerPage = 20;
      const totalEleves = moyennes.length;

      const drawTable = (startIndex, maxIndex) => {
        let currentY = y;
        let rowNum = startIndex + 1;

        for (let i = startIndex; i < Math.min(maxIndex, totalEleves); i++) {
          const item = moyennes[i];

          if (currentY + rowHeight > pageHeight - margins.bottom - 5) {
            return { y: currentY, needNewPage: true };
          }

          if (i % 2 === 0) {
            doc.setFillColor(248, 249, 250);
            doc.rect(margins.left, currentY, pageWidth - margins.left - margins.right, rowHeight, 'F');
          }

          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.1);
          doc.line(margins.left, currentY + rowHeight, pageWidth - margins.right, currentY + rowHeight);

          const cellCenterY = currentY + rowHeight / 2 + 0.5;

          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(33, 33, 33);

          let x = margins.left;

          const rangDisplay = item.rang === '-' ? '-' :
                              item.rang === 1 ? '1er' :
                              item.rang === 2 ? '2e' :
                              item.rang === 3 ? '3e' : `#${item.rang}`;
          doc.text(rangDisplay, x + col1 / 2, cellCenterY, { align: 'center' });
          x += col1;

          const nom = (item.eleve_nom || '-').substring(0, 28);
          doc.text(nom, x + 2, cellCenterY);
          x += col2;

          const matricule = (item.eleve_matricule || '-').substring(0, 15);
          doc.text(matricule, x + 2, cellCenterY);
          x += col3;

          const moyenne = item.moyenne || 0;
          const moyColor = getMoyenneColor(moyenne);
          doc.setTextColor(moyColor[0], moyColor[1], moyColor[2]);
          doc.setFont('helvetica', 'bold');
          doc.text(moyenne > 0 ? moyenne.toFixed(2) : '-', x + col4 / 2, cellCenterY, { align: 'center' });

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(33, 33, 33);
          x += col4;

          doc.text(String(item.nombre_notes || 0), x + col5 / 2, cellCenterY, { align: 'center' });
          x += col5;

          const mentionColor = getMentionColor(item.mention);
          doc.setTextColor(mentionColor[0], mentionColor[1], mentionColor[2]);
          doc.setFont('helvetica', 'bold');
          doc.text((item.mention || 'Non noté').substring(0, 18), x + 2, cellCenterY);
          doc.setTextColor(33, 33, 33);
          doc.setFont('helvetica', 'normal');

          currentY += rowHeight;
          rowNum++;
        }
        return { y: currentY, needNewPage: false };
      };

      let result = drawTable(0, maxRowsPerPage);
      y = result.y;

      let remaining = maxRowsPerPage;
      while (remaining < totalEleves) {
        doc.addPage();
        y = margins.top;

        doc.setFillColor(26, 35, 126);
        doc.rect(margins.left, y, pageWidth - margins.left - margins.right, rowHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');

        const headerCenterY2 = y + rowHeight / 2 + 0.5;
        let x = margins.left;
        doc.text('Rang', x + col1 / 2, headerCenterY2, { align: 'center' }); x += col1;
        doc.text('Élève', x + col2 / 2, headerCenterY2, { align: 'center' }); x += col2;
        doc.text('Matricule', x + col3 / 2, headerCenterY2, { align: 'center' }); x += col3;
        doc.text('Moyenne', x + col4 / 2, headerCenterY2, { align: 'center' }); x += col4;
        doc.text('Notes', x + col5 / 2, headerCenterY2, { align: 'center' }); x += col5;
        doc.text('Mention', x + col6 / 2, headerCenterY2, { align: 'center' });

        doc.setTextColor(33, 33, 33);
        y += rowHeight;

        const start = remaining;
        const end = Math.min(remaining + maxRowsPerPage, totalEleves);
        result = drawTable(start, end);
        y = result.y;
        remaining += maxRowsPerPage;
      }

      // PIED DE PAGE
      const footerY = pageHeight - margins.bottom - 10;
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.3);
      doc.line(margins.left, footerY - 3, pageWidth - margins.right, footerY - 3);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 144, 156);
      doc.text('SEYDI GROUP - DAKAR, SÉNÉGAL', pageWidth / 2, footerY + 2, { align: 'center' });
      doc.text('Tél: +221 33 123 45 67 - Email: contact@seydigroup.com', pageWidth / 2, footerY + 6, { align: 'center' });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 170);
        doc.text(`Page ${i}/${pageCount}`, pageWidth - margins.right, pageHeight - margins.bottom, { align: 'right' });
      }

      const pdfBlob = doc.output('blob');
      console.log('✅ PDF généré avec succès (Paysage)');
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
function MoyennesGeneralesPdf() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [moyennes, setMoyennes] = useState([]);
  const [classeNom, setClasseNom] = useState('');
  const [periodeLibelle, setPeriodeLibelle] = useState('');
  const [stats, setStats] = useState({
    total: 0, moyenneGenerale: 0, max: 0, min: 0,
    mentionTB: 0, mentionB: 0, mentionAB: 0, mentionP: 0, mentionNA: 0
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // CHARGEMENT
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
        const classeId = searchParams.get('classe') || id;
        const periodeId = searchParams.get('periode');

        console.log('📌 Paramètres:', { classeId, periodeId, id });

        if (!classeId || !periodeId) {
          setError('Paramètres manquants: classe et periode sont requis');
          setLoading(false);
          return;
        }

        // Classe
        const classeRes = await axiosInstance.get(`/classes/${classeId}/`, headers);
        setClasseNom(classeRes.data?.nom || 'Classe');

        // Période
        const periodeRes = await axiosInstance.get(`/periodes/${periodeId}/`, headers);
        setPeriodeLibelle(periodeRes.data?.libelle || 'Période');

        // ✅ ÉLÈVES — CORRIGÉ (sans filtre client)
        console.log('🔍 Chargement des élèves pour la classe:', classeId);
        const elevesRes = await axiosInstance.get(
          `/eleves/?classe=${classeId}&statut=actif`,
          headers
        );

        let elevesData = [];
        if (Array.isArray(elevesRes.data)) {
          elevesData = elevesRes.data;
        } else if (elevesRes.data?.results) {
          elevesData = elevesRes.data.results;
        } else if (typeof elevesRes.data === 'object' && elevesRes.data !== null) {
          elevesData = Object.values(elevesRes.data).filter(item => item?.id);
        }

        console.log(`📊 ${elevesData.length} élèves reçus`);

        // ✅ PAS de filtre client
        if (elevesData.length === 0) {
          setError('Aucun élève dans cette classe');
          setLoading(false);
          return;
        }

        // Évaluations de la période
        const evalRes = await axiosInstance.get(
          `/evaluations/?periode=${periodeId}`,
          headers
        );
        let evalData = [];
        if (Array.isArray(evalRes.data)) evalData = evalRes.data;
        else if (evalRes.data?.results) evalData = evalRes.data.results;

        const evaluationIds = evalData.map(e => e.id);

        // Calcul moyennes générales
        const resultats = [];

        for (const eleve of elevesData) {
          const notesRes = await axiosInstance.get(
            `/notes/?eleve=${eleve.id}`,
            headers
          );
          let notesData = [];
          if (Array.isArray(notesRes.data)) notesData = notesRes.data;
          else if (notesRes.data?.results) notesData = notesRes.data.results;

          const notesPeriode = notesData.filter(n => evaluationIds.includes(n.evaluation));

          const nomComplet = eleve.nom_complet || `${eleve.prenom || ''} ${eleve.nom || ''}`;

          if (notesPeriode.length === 0) {
            resultats.push({
              eleve: eleve.id,
              eleve_nom: nomComplet,
              eleve_matricule: eleve.matricule || '-',
              moyenne: 0, nombre_notes: 0, rang: '-', mention: 'Non noté'
            });
            continue;
          }

          const notesValides = notesPeriode.filter(
            n => n.note !== null && n.note !== undefined
          );

          if (notesValides.length > 0) {
            const sum = notesValides.reduce((s, n) => s + (parseFloat(n.note) || 0), 0);
            const moyenne = sum / notesValides.length;

            resultats.push({
              eleve: eleve.id,
              eleve_nom: nomComplet,
              eleve_matricule: eleve.matricule || '-',
              moyenne: moyenne,
              nombre_notes: notesValides.length,
              rang: '-',
              mention: getMentionLabel(moyenne)
            });
          } else {
            resultats.push({
              eleve: eleve.id,
              eleve_nom: nomComplet,
              eleve_matricule: eleve.matricule || '-',
              moyenne: 0, nombre_notes: 0, rang: '-', mention: 'Non noté'
            });
          }
        }

        resultats.sort((a, b) => b.moyenne - a.moyenne);

        let rang = 1;
        let previousMoyenne = -1;
        resultats.forEach((item, index) => {
          if (item.moyenne > 0) {
            if (item.moyenne !== previousMoyenne) {
              rang = index + 1;
              previousMoyenne = item.moyenne;
            }
            item.rang = rang;
          } else {
            item.rang = '-';
          }
        });

        // Stats
        const notesValidesStats = resultats.filter(m => m.moyenne > 0);
        let moyenneGenerale = 0, max = 0, min = 0;
        if (notesValidesStats.length > 0) {
          const valeurs = notesValidesStats.map(m => parseFloat(m.moyenne) || 0);
          moyenneGenerale = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
          max = Math.max(...valeurs);
          min = Math.min(...valeurs);
        }

        const mentionTB = resultats.filter(m => m.mention === 'Très Bien').length;
        const mentionB = resultats.filter(m => m.mention === 'Bien').length;
        const mentionAB = resultats.filter(m => m.mention === 'Assez Bien').length;
        const mentionP = resultats.filter(m => m.mention === 'Passable').length;
        const mentionNA = resultats.filter(m => m.mention === 'Non Admis' || m.mention === 'Non noté').length;

        const statsData = {
          total: resultats.length || 0,
          moyenneGenerale: moyenneGenerale || 0,
          max: max || 0, min: min || 0,
          mentionTB, mentionB, mentionAB, mentionP, mentionNA
        };

        setMoyennes(resultats);
        setStats(statsData);

        await generatePDF({
          moyennes: resultats,
          classe_nom: classeRes.data?.nom || 'Classe',
          periode_libelle: periodeRes.data?.libelle || 'Période',
          stats: statsData
        });

      } catch (error) {
        console.error('❌ Erreur:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Erreur lors du chargement: ' + (error.message || ''));
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.search, navigate]);

  // ============================================================
  // GÉNÉRER PDF
  // ============================================================
  const generatePDF = async (data) => {
    if (!data) {
      showNotification('Aucune donnée à afficher', 'error');
      return;
    }

    setGenerating(true);
    try {
      const blob = await generateMoyennesGeneralesPDF(data);
      const url = URL.createObjectURL(blob);

      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(url);

      if (iframeRef.current) iframeRef.current.src = url;

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      showNotification('Erreur: ' + error.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleDownload = () => {
    if (pdfBlobUrl) {
      const nomFichier = `Moyennes_generales_${classeNom}_${periodeLibelle}.pdf`;
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = nomFichier;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('PDF téléchargé', 'success');
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
    await generatePDF({
      moyennes, classe_nom: classeNom,
      periode_libelle: periodeLibelle, stats
    });
    showNotification('PDF régénéré', 'success');
  };

  const handleBack = () => navigate('/moyennes-generales');

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERREUR
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
            <button onClick={() => window.location.reload()} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">

      {notification.show && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 ${
          notification.type === 'error'
            ? 'bg-red-50 border-red-500 text-red-700'
            : 'bg-green-50 border-green-500 text-green-700'
        }`}>
          {notification.type === 'error'
            ? <AlertTriangle className="w-5 h-5" />
            : <CheckCircle2 className="w-5 h-5" />}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BARRE D'OUTILS */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">Moyennes Générales PDF</h1>
              <p className="text-xs text-gray-500">
                {classeNom} - {periodeLibelle} ({moyennes.length} élèves)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-2 py-1 text-xs flex items-center gap-1 rounded ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1"></div>

          <button
            onClick={handleDownload}
            className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5 text-sm disabled:opacity-50"
            disabled={!pdfBlobUrl || generating}
          >
            <Download className="w-4 h-4" /> Télécharger
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm disabled:opacity-50"
            disabled={!pdfBlobUrl || generating}
          >
            <Printer className="w-4 h-4" /> Imprimer
          </button>

          <button
            onClick={handleRegenerate}
            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-1.5 text-sm disabled:opacity-50"
            disabled={generating}
          >
            {generating
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />}
            {generating ? 'Génération...' : 'Régénérer'}
          </button>
        </div>
      </div>

      {/* APERÇU PDF */}
      <div className="flex-1 bg-gray-100 p-2 overflow-hidden">
        {generating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Génération du PDF en cours...</p>
            </div>
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfBlobUrl}
            className="w-full h-full rounded-lg shadow-lg border border-gray-200 bg-white"
            title="Aperçu des moyennes générales"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun aperçu disponible</p>
              <button
                onClick={handleRegenerate}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1.5 mx-auto"
              >
                <BarChart3 className="w-4 h-4" /> Générer le PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MoyennesGeneralesPdf;