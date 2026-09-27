// src/components/inscriptions/InscriptionPdf.jsx
// Génération PDF d'une inscription - Téléchargement et Impression

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  FileText, ChevronLeft, Download, Printer, Loader2,
  Wifi, WifiOff, AlertTriangle, Calendar,
  User, File as FileIcon, X, RefreshCw
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';
import jsPDF from 'jspdf';

// ========== FONCTIONS DE FORMATAGE ==========
const formatNumber = (n) => {
  const num = parseFloat(n) || 0;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatCurrency = (amt) => `${formatNumber(amt)} FCFA`;

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}) : '-';

const getStatutLabel = (statut) => {
  const map = {
    inscrit: 'Inscrit',
    reinscrit: 'Réinscrit',
    transfert: 'Transfert',
    abandon: 'Abandon'
  };
  return map[statut] || statut || 'Inconnu';
};

// ========== FONCTION DE GÉNÉRATION PDF INSCRIPTION ==========
const generateInscriptionPDF = (inscription) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const margins = { left: 15, right: 15, top: 18, bottom: 18 };
      const contentWidth = pageWidth - margins.left - margins.right;
      let y = margins.top;

      // ========== INFORMATIONS DE L'ENTREPRISE ==========
      const company = {
        name: 'SEYDI GROUP',
        address: 'Dakar, Sénégal',
        phone: '+221 33 123 45 67',
        email: 'contact@seydigroup.com',
        rccm: 'SN DKR 2023 B 123',
        capital: '10 000 000 FCFA'
      };

      // ========== DONNÉES DE L'INSCRIPTION ==========
      const id = inscription.id || 'N/A';
      const eleveId = inscription.eleve || 'N/A';
      const eleveNom = inscription.eleve_nom || 'Nom non renseigné';
      const elevePrenom = inscription.eleve_prenom || 'Prénom non renseigné';
      const eleveMatricule = inscription.eleve_matricule || 'N/A';
      
      const anneeScolaireId = inscription.annee_scolaire || 'N/A';
      const anneeLibelle = inscription.annee_libelle || 'Année non renseignée';
      
      const niveauId = inscription.niveau || 'N/A';
      const niveauNom = inscription.niveau_nom || 'Niveau non renseigné';
      
      const classeId = inscription.classe || 'N/A';
      const classeNom = inscription.classe_nom || 'Classe non renseignée';
      
      const dateInscription = inscription.date_inscription || '';
      const dateReinscription = inscription.date_reinscription || '';
      const statut = inscription.statut || 'inscrit';
      const statutLabel = getStatutLabel(statut);
      
      const tarifInscription = parseFloat(inscription.tarif_inscription) || 0;
      const tarifMensuel = parseFloat(inscription.tarif_mensuel) || 0;
      
      const numeroActe = inscription.numero_acte || '';
      const observations = inscription.observations || '';
      
      const dateCreation = inscription.date_creation || '';
      const dateModification = inscription.date_modification || '';

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
      doc.text(`Capital social : ${company.capital}`, margins.left, y + 10);
      doc.text(`N° RCCM : ${company.rccm}`, margins.left, y + 14);
      doc.text(company.address.toUpperCase(), margins.left, y + 18);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('CERTIFICAT D\'INSCRIPTION', pageWidth - margins.right, y + 5, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(`N° ${String(id).padStart(6, '0')}`, pageWidth - margins.right, y + 10, { align: 'right' });
      doc.text(`Émis le ${formatDate(new Date().toISOString())}`, pageWidth - margins.right, y + 14, { align: 'right' });

      y += 27;
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.4);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 8;

      // ================================================================
      // SECTION ÉLÈVE
      // ================================================================
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('INFORMATIONS DE L\'ÉLÈVE', margins.left, y);
      y += 2;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 6;

      const eleveY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, eleveY, contentWidth, 24, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, eleveY, contentWidth, 24, 2, 2, 'S');

      const colWidth = contentWidth / 3;
      const x1 = margins.left;
      const x2 = margins.left + colWidth;
      const x3 = margins.left + colWidth * 2;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('ÉLÈVE', x1 + 4, eleveY + 4.5);
      doc.text('MATRICULE', x2 + 4, eleveY + 4.5);
      doc.text('STATUT', x3 + 4, eleveY + 4.5);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text(`${elevePrenom} ${eleveNom}`, x1 + 4, eleveY + 13);
      doc.text(eleveMatricule, x2 + 4, eleveY + 13);
      
      const statutColor = statut === 'inscrit' ? [0, 150, 0] : 
                          statut === 'reinscrit' ? [33, 150, 243] :
                          statut === 'transfert' ? [255, 193, 7] : [158, 158, 158];
      doc.setTextColor(statutColor[0], statutColor[1], statutColor[2]);
      doc.text(statutLabel, x3 + 4, eleveY + 13);

      y = eleveY + 28;

      // ================================================================
      // SECTION SCOLAIRE
      // ================================================================
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('INFORMATIONS SCOLAIRES', margins.left, y);
      y += 2;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 6;

      const scolaireY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, scolaireY, contentWidth, 30, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, scolaireY, contentWidth, 30, 2, 2, 'S');

      const scolColW = contentWidth / 4;
      const sx1 = margins.left;
      const sx2 = margins.left + scolColW;
      const sx3 = margins.left + scolColW * 2;
      const sx4 = margins.left + scolColW * 3;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('ANNÉE SCOLAIRE', sx1 + 4, scolaireY + 4.5);
      doc.text('NIVEAU', sx2 + 4, scolaireY + 4.5);
      doc.text('CLASSE', sx3 + 4, scolaireY + 4.5);
      doc.text('DATE INSCRIPTION', sx4 + 4, scolaireY + 4.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(anneeLibelle, sx1 + 4, scolaireY + 13);
      doc.text(niveauNom, sx2 + 4, scolaireY + 13);
      doc.text(classeNom, sx3 + 4, scolaireY + 13);
      doc.text(formatDate(dateInscription), sx4 + 4, scolaireY + 13);

      // Deuxième ligne : date de réinscription
      if (dateReinscription) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 144, 156);
        doc.text('DATE DE RÉINSCRIPTION', sx3 + 4, scolaireY + 22);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33);
        doc.text(formatDate(dateReinscription), sx3 + 4, scolaireY + 27);
      }

      y = scolaireY + 34;

      // ================================================================
      // SECTION FINANCIÈRE
      // ================================================================
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('INFORMATIONS FINANCIÈRES', margins.left, y);
      y += 2;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 6;

      const financeY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, financeY, contentWidth, 24, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, financeY, contentWidth, 24, 2, 2, 'S');

      const finColW = contentWidth / 2;
      const fx1 = margins.left;
      const fx2 = margins.left + finColW;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('TARIF D\'INSCRIPTION', fx1 + 4, financeY + 4.5);
      doc.text('TARIF MENSUEL', fx2 + 4, financeY + 4.5);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text(formatCurrency(tarifInscription), fx1 + 4, financeY + 13);
      doc.text(formatCurrency(tarifMensuel), fx2 + 4, financeY + 13);

      y = financeY + 28;

      // ================================================================
      // SECTION NUMÉRO D'ACTE
      // ================================================================
      if (numeroActe) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 35, 126);
        doc.text('NUMÉRO D\'ACTE', margins.left, y);
        y += 2;
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.line(margins.left, y, pageWidth - margins.right, y);
        y += 6;

        const acteY = y;
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margins.left, acteY, contentWidth, 18, 2, 2, 'F');
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.roundedRect(margins.left, acteY, contentWidth, 18, 2, 2, 'S');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33);
        doc.text(numeroActe, margins.left + 6, acteY + 12);

        y = acteY + 22;
      }

      // ================================================================
      // SECTION OBSERVATIONS
      // ================================================================
      if (observations) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 35, 126);
        doc.text('OBSERVATIONS', margins.left, y);
        y += 2;
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.line(margins.left, y, pageWidth - margins.right, y);
        y += 6;

        const obsY = y;
        const obsLines = doc.splitTextToSize(observations, contentWidth - 12);
        const obsHeight = Math.max(18, obsLines.length * 5 + 10);
        
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margins.left, obsY, contentWidth, obsHeight, 2, 2, 'F');
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.roundedRect(margins.left, obsY, contentWidth, obsHeight, 2, 2, 'S');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33);
        doc.text(obsLines, margins.left + 6, obsY + 6);

        y = obsY + obsHeight + 6;
      }

      // ================================================================
      // SECTION DATES DE CRÉATION / MODIFICATION
      // ================================================================
      if (dateCreation || dateModification) {
        y += 4;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 160, 170);
        if (dateCreation) {
          doc.text(`Créé le : ${formatDate(dateCreation)}`, margins.left, y);
        }
        if (dateModification && dateModification !== dateCreation) {
          const modX = dateCreation ? margins.left + 60 : margins.left;
          doc.text(`Modifié le : ${formatDate(dateModification)}`, modX, y);
        }
        y += 8;
      }

      // ================================================================
      // SIGNATURES
      // ================================================================
      if (y < pageHeight - margins.bottom - 40) {
        const signatureY = y + 8;
        const signatureWidth = 85;
        const signatureX1 = margins.left;
        const signatureX2 = pageWidth - margins.right - signatureWidth;

        doc.setDrawColor(66, 66, 66);
        doc.setLineWidth(0.5);
        doc.line(signatureX1, signatureY + 5, signatureX1 + signatureWidth, signatureY + 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(84, 110, 122);
        doc.text('Signature du Chef d\'établissement', signatureX1 + (signatureWidth / 2), signatureY, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 144, 156);
        doc.text('Nom et date', signatureX1 + (signatureWidth / 2), signatureY + 12, { align: 'center' });

        doc.line(signatureX2, signatureY + 5, signatureX2 + signatureWidth, signatureY + 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(84, 110, 122);
        doc.text('Signature du Responsable Pédagogique', signatureX2 + (signatureWidth / 2), signatureY, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 144, 156);
        doc.text('Nom et date', signatureX2 + (signatureWidth / 2), signatureY + 12, { align: 'center' });
      }

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
      doc.text(`Tél: ${company.phone} - Email: ${company.email}`, pageWidth / 2, footerY + 4, { align: 'center' });
      doc.text(`RCCM: ${company.rccm}`, pageWidth / 2, footerY + 8, { align: 'center' });

      // ================================================================
      // NUMÉROTATION DES PAGES
      // ================================================================
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 170);
        doc.text(`Page ${i}/${pageCount}`, pageWidth - margins.right, pageHeight - margins.bottom, { align: 'right' });
      }

      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);

    } catch (error) {
      reject(error);
    }
  });
};

// ========== COMPOSANT PRINCIPAL ==========
function InscriptionPdf() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inscription, setInscription] = useState(null);
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

        // Charger l'inscription
        const response = await AxiosInstance.get(`/inscriptions/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setInscription(response.data);

        // Générer le PDF automatiquement
        await generatePDF(response.data);

      } catch (error) {
        console.error('❌ Erreur chargement:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else if (error.response?.status === 404) {
          setError('Inscription non trouvée');
        } else {
          setError('Erreur lors du chargement de l\'inscription');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }

    // Nettoyer l'URL blob
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [id, navigate]);

  // Générer le PDF
  const generatePDF = async (inscriptionData) => {
    if (!inscriptionData) return;
    
    setGenerating(true);
    try {
      const blob = await generateInscriptionPDF(inscriptionData);

      // Créer une URL pour le blob
      const url = URL.createObjectURL(blob);
      
      // Nettoyer l'ancienne URL
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      
      setPdfBlobUrl(url);

      // Charger dans l'iframe
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
      const nomFichier = `Inscription_${String(id).padStart(6, '0')}.pdf`;
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
        // Fallback: ouvrir dans un nouvel onglet pour imprimer
        if (pdfBlobUrl) {
          const win = window.open(pdfBlobUrl, '_blank');
          win?.focus();
        }
      }
    }
  };

  // ✅ Régénérer le PDF
  const handleRegenerate = async () => {
    await generatePDF(inscription);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-base-content/60">Chargement de l'inscription...</p>
        </div>
      </div>
    );
  }

  if (error || !inscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-lg font-medium">{error || 'Inscription non trouvée'}</h3>
          <Link to="/inscriptions" className="btn btn-primary mt-4">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-88px)] flex flex-col bg-base-200">
      
      {/* ✅ Barre d'outils */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-base-100 border-b border-base-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/inscriptions/${id}`)}
            className="btn btn-ghost btn-sm btn-square"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Aperçu PDF</h1>
              <p className="text-xs text-base-content/60">
                {inscription.eleve_matricule || 'N/A'} - {inscription.eleve_prenom || ''} {inscription.eleve_nom || ''}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
          
          <div className="divider divider-horizontal mx-0 h-6"></div>
          
          {/* ✅ BOUTON TÉLÉCHARGER */}
          <button
            onClick={handleDownload}
            className="btn btn-sm btn-success gap-1.5"
            disabled={!pdfBlobUrl || generating}
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>
          
          {/* ✅ BOUTON IMPRIMER */}
          <button
            onClick={handlePrint}
            className="btn btn-sm btn-primary gap-1.5"
            disabled={!pdfBlobUrl || generating}
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          
          {/* ✅ BOUTON RÉGÉNÉRER */}
          <button
            onClick={handleRegenerate}
            className="btn btn-sm btn-ghost gap-1.5"
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
      <div className="flex-1 bg-base-200 p-2 overflow-hidden">
        {generating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
              <p className="text-base-content/60">Génération du PDF en cours...</p>
            </div>
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfBlobUrl}
            className="w-full h-full rounded-lg shadow-lg border border-base-200 bg-white"
            title="Aperçu de l'inscription"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
              <p className="text-base-content/60">Aucun aperçu disponible</p>
              <button
                onClick={handleRegenerate}
                className="btn btn-primary btn-sm mt-4 gap-1.5"
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

export default InscriptionPdf;