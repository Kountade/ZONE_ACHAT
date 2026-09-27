// src/components/evaluations/SemestrePDF.jsx
// Génération PDF simple d'une période

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  FileText, ChevronLeft, Download, Printer, Loader2,
  Wifi, WifiOff, AlertTriangle, Calendar, CalendarRange,
  X, RefreshCw
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';
import jsPDF from 'jspdf';

// ========== FONCTIONS DE FORMATAGE ==========
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

const formatDateTime = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
};

const getStatusLabel = (periode) => {
  if (periode?.est_cloture) return 'Clôturée';
  if (periode?.est_active) return 'Active';
  return 'À venir';
};

// ========== FONCTION DE GÉNÉRATION PDF ==========
const generatePeriodePDF = (periode) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const margins = { left: 15, right: 15, top: 18, bottom: 18 };
      let y = margins.top;

      // ========== DONNÉES ==========
      const libelle = periode.libelle || 'Période non renseignée';
      const typePeriode = periode.type_periode || 'Non défini';
      const anneeLibelle = periode.annee_libelle || 'Année non renseignée';
      const dateDebut = periode.date_debut || '';
      const dateFin = periode.date_fin || '';
      const estCloture = periode.est_cloture || false;
      const ordre = periode.ordre || 0;
      const dateCreation = periode.date_creation || '';
      const dateModification = periode.date_modification || '';
      const dateCloture = periode.date_cloture || '';
      const statusLabel = getStatusLabel(periode);

      // Calcul durée
      let duree = 0;
      if (dateDebut && dateFin) {
        duree = Math.ceil((new Date(dateFin) - new Date(dateDebut)) / (1000 * 60 * 60 * 24));
      }

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
      doc.text('FICHE DE PÉRIODE', pageWidth - margins.right, y + 5, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(`N° ${String(periode.id || 0).padStart(6, '0')}`, pageWidth - margins.right, y + 10, { align: 'right' });
      doc.text(`Généré le ${formatDate(new Date().toISOString())}`, pageWidth - margins.right, y + 14, { align: 'right' });

      y += 27;
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.4);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 10;

      // ================================================================
      // TITRE
      // ================================================================
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text(libelle, pageWidth / 2, y, { align: 'center' });
      y += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(`${typePeriode} • ${anneeLibelle}`, pageWidth / 2, y, { align: 'center' });
      y += 12;

      // ================================================================
      // STATUT
      // ================================================================
      const statusColor = estCloture ? [120, 120, 120] : [0, 150, 0];
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(`Statut : ${statusLabel}`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // ================================================================
      // LIGNE DE SÉPARATION
      // ================================================================
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 8;

      // ================================================================
      // INFORMATIONS GÉNÉRALES
      // ================================================================
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('INFORMATIONS GÉNÉRALES', margins.left, y);
      y += 6;

      // ================================================================
      // GRILLE DES INFORMATIONS
      // ================================================================
      const gridY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, gridY, pageWidth - margins.left - margins.right, 65, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, gridY, pageWidth - margins.left - margins.right, 65, 2, 2, 'S');

      const col1 = margins.left + 4;
      const col2 = margins.left + 70;
      const col3 = margins.left + 4;
      const col4 = margins.left + 70;
      let rowY = gridY + 6;

      // Ligne 1: Type
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('TYPE', col1, rowY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(typePeriode, col2, rowY);
      rowY += 8;

      // Ligne 2: Libellé
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('LIBELLÉ', col1, rowY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(libelle, col2, rowY);
      rowY += 8;

      // Ligne 3: Année scolaire
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('ANNÉE SCOLAIRE', col1, rowY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(anneeLibelle, col2, rowY);
      rowY += 8;

      // Ligne 4: Date de début
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('DATE DE DÉBUT', col1, rowY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(formatDate(dateDebut), col2, rowY);
      rowY += 8;

      // Ligne 5: Date de fin
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('DATE DE FIN', col1, rowY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(formatDate(dateFin), col2, rowY);
      rowY += 8;

      // Ligne 6: Durée
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('DURÉE', col1, rowY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(`${duree} jours`, col2, rowY);
      rowY += 8;

      // Ligne 7: Statut
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('STATUT', col1, rowY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(statusLabel, col2, rowY);
      rowY += 8;

      // Ligne 8: Date clôture (si clôturée)
      if (estCloture && dateCloture) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 144, 156);
        doc.text('DATE DE CLÔTURE', col1, rowY);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33);
        doc.text(formatDate(dateCloture), col2, rowY);
        rowY += 8;
      }

      // Ligne 9: Ordre
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('ORDRE', col1, rowY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(String(ordre), col2, rowY);

      y = gridY + 70;

      // ================================================================
      // LIGNE DE SÉPARATION
      // ================================================================
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 8;

      // ================================================================
      // AUDIT
      // ================================================================
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('AUDIT', margins.left, y);
      y += 6;

      const auditY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, auditY, pageWidth - margins.left - margins.right, 18, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, auditY, pageWidth - margins.left - margins.right, 18, 2, 2, 'S');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('CRÉÉ LE', margins.left + 4, auditY + 4.5);
      doc.text('MODIFIÉ LE', margins.left + 70, auditY + 4.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(formatDateTime(dateCreation), margins.left + 4, auditY + 13);
      doc.text(formatDateTime(dateModification), margins.left + 70, auditY + 13);

      y = auditY + 24;

      // ================================================================
      // PIED DE PAGE
      // ================================================================
      const footerY = pageHeight - margins.bottom - 10;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, footerY - 5, pageWidth - margins.right, footerY - 5);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 144, 156);
      doc.text('SEYDI GROUP - DAKAR, SÉNÉGAL', pageWidth / 2, footerY, { align: 'center' });
      doc.text('Tél: +221 33 123 45 67 - Email: contact@seydigroup.com', pageWidth / 2, footerY + 4, { align: 'center' });

      // Numérotation des pages
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 170);
      doc.text('Page 1/1', pageWidth - margins.right, pageHeight - margins.bottom, { align: 'right' });

      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);

    } catch (error) {
      reject(error);
    }
  });
};

// ========== COMPOSANT PRINCIPAL ==========
function SemestrePDF() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [periode, setPeriode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const iframeRef = useRef(null);

  // Surveiller la connexion
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

  // Charger les données et générer le PDF
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

        // Charger la période
        const periodeRes = await axiosInstance.get(`/periodes/${id}/`, headers);
        setPeriode(periodeRes.data);

        // Générer le PDF automatiquement
        await generatePDF(periodeRes.data);

      } catch (error) {
        console.error('❌ Erreur chargement:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else if (error.response?.status === 404) {
          setError('Période non trouvée');
        } else {
          setError('Erreur lors du chargement de la période');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }

    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [id, navigate]);

  // Générer le PDF
  const generatePDF = async (periodeData) => {
    if (!periodeData) return;
    
    setGenerating(true);
    try {
      const blob = await generatePeriodePDF(periodeData);

      const url = URL.createObjectURL(blob);
      
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      
      setPdfBlobUrl(url);

      if (iframeRef.current) {
        iframeRef.current.src = url;
      }

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      setError('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  // ✅ Télécharger le PDF
  const handleDownload = () => {
    if (pdfBlobUrl) {
      const link = document.createElement('a');
      const nomFichier = `Periode_${periode?.libelle || 'periode'}.pdf`;
      link.href = pdfBlobUrl;
      link.download = nomFichier;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // ✅ Imprimer le PDF
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

  // ✅ Régénérer le PDF
  const handleRegenerate = async () => {
    await generatePDF(periode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement de la période...</p>
        </div>
      </div>
    );
  }

  if (error || !periode) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium">{error || 'Période non trouvée'}</h3>
          <Link to="/periodes" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-88px)] flex flex-col bg-gray-50">
      
      {/* ✅ Barre d'outils */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/periodes/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">Aperçu PDF</h1>
              <p className="text-xs text-gray-500">
                {periode.libelle || 'Période'} - {periode.annee_libelle || 'Année'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`badge ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-2 py-1 text-xs flex items-center gap-1`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
          
          <div className="w-px h-6 bg-gray-200 mx-1"></div>
          
          {/* ✅ BOUTON TÉLÉCHARGER */}
          <button
            onClick={handleDownload}
            className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 text-sm disabled:opacity-50"
            disabled={!pdfBlobUrl || generating}
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>
          
          {/* ✅ BOUTON IMPRIMER */}
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm disabled:opacity-50"
            disabled={!pdfBlobUrl || generating}
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          
          {/* ✅ BOUTON RÉGÉNÉRER */}
          <button
            onClick={handleRegenerate}
            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1.5 text-sm disabled:opacity-50"
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {generating ? 'Génération...' : 'Régénérer'}
          </button>
        </div>
      </div>

      {/* ✅ APERÇU PDF */}
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
            title="Aperçu de la période"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun aperçu disponible</p>
              <button
                onClick={handleRegenerate}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Générer le PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SemestrePDF;