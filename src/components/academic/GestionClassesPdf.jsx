// src/components/classes/GestionClassesPdf.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Download, Printer, Loader2, School, Users,
  AlertTriangle, FileText, RefreshCw, Wifi, WifiOff,
  CheckCircle, AlertCircle, X, Eye, File
} from 'lucide-react';
import jsPDF from 'jspdf';

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

const getSexeLabel = (sexe) => {
  if (sexe === 'M' || sexe === 'm') return 'Masculin';
  if (sexe === 'F' || sexe === 'f') return 'Féminin';
  return 'Non spécifié';
};

// ============================================================
// GÉNÉRATION PDF
// ============================================================
const generateClassePDF = (classe, eleves) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = 297;
      const pageHeight = 210;
      const margins = { left: 15, right: 15, top: 18, bottom: 18 };
      const contentWidth = pageWidth - margins.left - margins.right;
      let y = margins.top;

      const company = {
        name: 'SEYDI GROUP',
        address: 'Dakar, Sénégal',
        phone: '+221 33 123 45 67',
        email: 'contact@seydigroup.com'
      };

      const nom = classe.nom || 'Classe non renseignée';
      const code = classe.code || `CL-${String(classe.id).padStart(6, '0')}`;
      const niveauNom = classe.niveau_nom || 'Niveau inconnu';
      const anneeLibelle = classe.annee_libelle || 'Année inconnue';
      const professeurNom = classe.professeur_nom || 'Non assigné';
      const effectif = eleves?.length || 0;

      // EN-TÊTE
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('SEYDI GROUP', margins.left, y + 6);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('LISTE DES ÉLÈVES', pageWidth - margins.right, y + 6, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(company.address.toUpperCase(), margins.left, y + 12);
      doc.text(`Tél: ${company.phone} - Email: ${company.email}`, margins.left, y + 16);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text(`${nom}`, pageWidth - margins.right, y + 12, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(`Code: ${code}`, pageWidth - margins.right, y + 16, { align: 'right' });
      doc.text(`Émis le ${formatDate(new Date().toISOString())}`, pageWidth - margins.right, y + 20, { align: 'right' });

      y += 26;
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 6;

      // INFOS CLASSE
      doc.setFillColor(240, 242, 245);
      doc.roundedRect(margins.left, y, contentWidth, 16, 2, 2, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, y, contentWidth, 16, 2, 2, 'S');

      const infoColW = contentWidth / 4;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('CLASSE', margins.left + 8, y + 5);
      doc.text('NIVEAU', margins.left + infoColW + 8, y + 5);
      doc.text('ANNÉE SCOLAIRE', margins.left + infoColW * 2 + 8, y + 5);
      doc.text('PROFESSEUR', margins.left + infoColW * 3 + 8, y + 5);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 33, 33);
      doc.text(nom, margins.left + 8, y + 12);
      doc.text(niveauNom, margins.left + infoColW + 8, y + 12);
      doc.text(anneeLibelle, margins.left + infoColW * 2 + 8, y + 12);
      doc.text(professeurNom, margins.left + infoColW * 3 + 8, y + 12);

      y += 20;

      // TABLEAU
      if (eleves && eleves.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 35, 126);
        doc.text(`LISTE DES ÉLÈVES (${effectif})`, margins.left, y);
        y += 3;
        doc.setDrawColor(26, 35, 126);
        doc.setLineWidth(0.3);
        doc.line(margins.left, y, pageWidth - margins.right, y);
        y += 6;

        const col1 = 16;
        const col2 = 44;
        const col3 = 58;
        const col4 = 58;
        const col5 = 36;
        const col6 = 48;
        const rowHeight = 9;

        const drawHeader = (baseY) => {
          doc.setFillColor(26, 35, 126);
          doc.rect(margins.left, baseY, contentWidth, rowHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          const cy = baseY + rowHeight / 2 + 0.5;
          let x = margins.left;
          doc.text('N°', x + col1 / 2, cy, { align: 'center' }); x += col1;
          doc.text('MATRICULE', x + col2 / 2, cy, { align: 'center' }); x += col2;
          doc.text('NOM', x + col3 / 2, cy, { align: 'center' }); x += col3;
          doc.text('PRÉNOM', x + col4 / 2, cy, { align: 'center' }); x += col4;
          doc.text('SEXE', x + col5 / 2, cy, { align: 'center' }); x += col5;
          doc.text('DATE NAISS.', x + col6 / 2, cy, { align: 'center' });
          doc.setTextColor(33, 33, 33);
        };

        const drawElevesTable = (startIndex, maxIndex) => {
          let currentY = y;
          let rowNum = startIndex + 1;
          for (let i = startIndex; i < Math.min(maxIndex, eleves.length); i++) {
            const e = eleves[i];
            if (currentY + rowHeight > pageHeight - margins.bottom - 5) {
              return { y: currentY };
            }
            if (i % 2 === 0) {
              doc.setFillColor(248, 249, 250);
              doc.rect(margins.left, currentY, contentWidth, rowHeight, 'F');
            }
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.1);
            doc.line(margins.left, currentY + rowHeight, pageWidth - margins.right, currentY + rowHeight);

            const cy = currentY + rowHeight / 2 + 0.5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(33, 33, 33);
            let x = margins.left;
            doc.text(String(rowNum), x + col1 / 2, cy, { align: 'center' }); x += col1;
            doc.text((e.matricule || '-').substring(0, 15), x + col2 / 2, cy, { align: 'center' }); x += col2;
            doc.text((e.nom || '-').substring(0, 25), x + col3 / 2, cy, { align: 'center' }); x += col3;
            doc.text((e.prenom || '-').substring(0, 25), x + col4 / 2, cy, { align: 'center' }); x += col4;
            doc.text(getSexeLabel(e.sexe || e.genre).substring(0, 9), x + col5 / 2, cy, { align: 'center' }); x += col5;
            doc.text(formatDate(e.date_naissance), x + col6 / 2, cy, { align: 'center' });

            currentY += rowHeight;
            rowNum++;
          }
          return { y: currentY };
        };

        const tableY = y;
        drawHeader(tableY);
        y = tableY + rowHeight;

        const elevesPerPage = 19;
        let result = drawElevesTable(0, elevesPerPage);
        y = result.y;

        let remaining = elevesPerPage;
        while (remaining < eleves.length) {
          doc.addPage();
          y = margins.top;
          drawHeader(y);
          y += rowHeight;
          result = drawElevesTable(remaining, remaining + elevesPerPage);
          y = result.y;
          remaining += elevesPerPage;
        }

        y = Math.min(y, pageHeight - margins.bottom - 5);
      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(158, 158, 158);
        doc.text('Aucun élève inscrit dans cette classe', margins.left + 4, y + 10);
        y += 20;
      }

      // PIED
      const footerY = pageHeight - margins.bottom - 10;
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.3);
      doc.line(margins.left, footerY - 3, pageWidth - margins.right, footerY - 3);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 144, 156);
      doc.text(`SEYDI GROUP - ${company.address}`, pageWidth / 2, footerY + 2, { align: 'center' });
      doc.text(`Tél: ${company.phone} - Email: ${company.email}`, pageWidth / 2, footerY + 6, { align: 'center' });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 170);
        doc.text(`Page ${i}/${pageCount}`, pageWidth - margins.right, pageHeight - margins.bottom, { align: 'right' });
      }

      resolve(doc.output('blob'));
    } catch (error) {
      reject(error);
    }
  });
};

// ============================================================
// COMPOSANT
// ============================================================
const GestionClassesPdf = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [classe, setClasse] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const iframeRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // CONNEXION
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

  // CHARGEMENT
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        const headers = { headers: { Authorization: `Token ${token}` } };

        const classeRes = await axiosInstance.get(`/classes/${id}/`, headers);
        const classeData = classeRes.data;
        setClasse(classeData);

        const elevesRes = await axiosInstance.get(`/eleves/?classe=${id}`, headers);
        let elevesData = [];
        if (Array.isArray(elevesRes.data)) elevesData = elevesRes.data;
        else if (elevesRes.data?.results) elevesData = elevesRes.data.results;
        else if (typeof elevesRes.data === 'object') {
          elevesData = Object.values(elevesRes.data).filter(item => item?.id);
        }

        setEleves(elevesData);

        // Générer le PDF
        setGenerating(true);
        const blob = await generateClassePDF(classeData, elevesData);
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        if (iframeRef.current) iframeRef.current.src = url;
        setGenerating(false);

      } catch (err) {
        console.error('❌ Erreur:', err);
        if (err.response?.status === 401) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
        } else if (err.response?.status === 404) {
          setError('Classe non trouvée');
        } else {
          setError('Erreur lors du chargement');
        }
        setGenerating(false);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadData();
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [id]);

  // RÉGÉNÉRER
  const handleRegenerate = async () => {
    if (!classe) return;
    setGenerating(true);
    try {
      const blob = await generateClassePDF(classe, eleves);
      const url = URL.createObjectURL(blob);
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(url);
      if (iframeRef.current) iframeRef.current.src = url;
      showNotification('PDF régénéré', 'success');
    } catch (err) {
      showNotification('Erreur régénération', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // TÉLÉCHARGER
  const handleDownload = () => {
    if (!pdfBlobUrl) return;
    const code = classe?.code || `CL-${String(classe?.id || '').padStart(6, '0')}`;
    const nom = classe?.nom || 'classe';
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `Liste_eleves_${nom}_${code}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('PDF téléchargé', 'success');
  };

  // IMPRIMER
  const handlePrint = () => {
    if (!pdfBlobUrl) return;
    const win = window.open(pdfBlobUrl, '_blank');
    win?.focus();
    if (win) {
      win.onload = () => setTimeout(() => win.print(), 500);
    }
    showNotification('PDF ouvert pour impression', 'success');
  };

  // CHARGEMENT
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 mt-4">
            Chargement de la classe...
          </p>
        </div>
      </div>
    );
  }

  // ERREUR
  if (error || !classe) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-error mt-4">
            {error || 'Classe non trouvée'}
          </h3>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate('/classes')} className="btn btn-primary gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">

      {/* NOTIFICATION */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle"
                    onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/classes/${id}`)}
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <File className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Aperçu PDF - Liste des élèves
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="font-mono">
                    {classe.code || `CL-${String(classe.id).padStart(6, '0')}`}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{classe.nom}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{eleves.length} élève(s)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button
              onClick={handleDownload}
              className="btn btn-sm btn-success gap-2"
              disabled={!pdfBlobUrl || generating}
            >
              <Download className="w-4 h-4" /> Télécharger
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-sm btn-primary gap-2"
              disabled={!pdfBlobUrl || generating}
            >
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            <button
              onClick={handleRegenerate}
              className="btn btn-sm btn-outline gap-2"
              disabled={generating}
            >
              {generating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />}
              Régénérer
            </button>
          </div>
        </div>
      </div>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Classe</p>
          <p className="text-sm font-semibold truncate">{classe.nom}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Niveau</p>
          <p className="text-sm font-semibold truncate">{classe.niveau_nom || '-'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Année</p>
          <p className="text-sm font-semibold text-primary truncate">
            {classe.annee_libelle || '-'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Effectif</p>
          <p className="text-sm font-semibold">{eleves.length}</p>
        </div>
      </div>

      {/* APERÇU PDF */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-700">
              Aperçu du document
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>{eleves.length} élève(s)</span>
          </div>
        </div>

        <div className="bg-gray-100 p-4 min-h-[600px]">
          {generating ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Génération du PDF en cours...</p>
              </div>
            </div>
          ) : pdfBlobUrl ? (
            <iframe
              ref={iframeRef}
              src={pdfBlobUrl}
              className="w-full h-[600px] lg:h-[800px] rounded-lg shadow-lg border border-gray-200 bg-white"
              title="Liste des élèves"
            />
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun aperçu disponible</p>
                <button
                  onClick={handleRegenerate}
                  className="btn btn-primary btn-sm mt-4 gap-2"
                >
                  <FileText className="w-4 h-4" /> Générer le PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS BAS DE PAGE */}
      <div className="flex flex-wrap gap-2 justify-center pb-4">
        <button
          onClick={() => navigate(`/classes/${id}`)}
          className="btn btn-outline gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la classe
        </button>
        <button
          onClick={handleDownload}
          className="btn btn-success gap-2"
          disabled={!pdfBlobUrl || generating}
        >
          <Download className="w-4 h-4" /> Télécharger le PDF
        </button>
        <button
          onClick={handlePrint}
          className="btn btn-primary gap-2"
          disabled={!pdfBlobUrl || generating}
        >
          <Printer className="w-4 h-4" /> Imprimer
        </button>
      </div>

    </div>
  );
};

export default GestionClassesPdf;