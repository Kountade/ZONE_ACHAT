// src/components/classes/GestionClasses.jsx
// Gestion des classes - Liste, filtres, recherche et actions

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Users, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  School, MoreVertical, User, BookOpen, Hash,
  FileText, Download, Printer, Loader2,
  GraduationCap, Building2, UserCheck,
  Wifi, WifiOff
} from 'lucide-react';
import jsPDF from 'jspdf';

const GestionClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [anneesScolaires, setAnneesScolaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('all');
  const [anneeFilter, setAnneeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classeToDelete, setClasseToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [exporting, setExporting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ============================================================
  // SURVEILLER LA CONNEXION
  // ============================================================
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

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      const [classesRes, niveauxRes, enseignantsRes, anneesRes] = await Promise.all([
        axiosInstance.get('/classes/', headers),
        axiosInstance.get('/niveaux/', headers),
        axiosInstance.get('/professeurs/', headers),
        axiosInstance.get('/annees-scolaires/', headers)
      ]);

      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setNiveaux(Array.isArray(niveauxRes.data) ? niveauxRes.data : []);
      setEnseignants(Array.isArray(enseignantsRes.data) ? enseignantsRes.data : []);
      setAnneesScolaires(Array.isArray(anneesRes.data) ? anneesRes.data : []);
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des classes', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!classeToDelete) return;
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/classes/${classeToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Classe supprimée avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setClasseToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      if (error.response?.status === 400) {
        showNotification('Impossible de supprimer : des élèves sont rattachés à cette classe', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  // ============================================================
  // ✅ GÉNÉRATION PDF CLIENT - comme ElevePdf
  // ============================================================
  const generateClassePDF = (classe) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = 210;
        const pageHeight = 297;
        const margins = { left: 15, right: 15, top: 18, bottom: 18 };
        const contentWidth = pageWidth - margins.left - margins.right;
        let y = margins.top;

        // Informations de l'entreprise
        const company = {
          name: 'SEYDI GROUP',
          address: 'Dakar, Sénégal',
          phone: '+221 33 123 45 67',
          email: 'contact@seydigroup.com',
          rccm: 'SN DKR 2023 B 123',
          capital: '10 000 000 FCFA'
        };

        // Données de la classe
        const nom = classe.nom || 'Classe non renseignée';
        const code = classe.code || `CL-${String(classe.id).padStart(6, '0')}`;
        const niveauNom = classe.niveau_nom || getNiveauNom(classe.niveau) || 'Niveau inconnu';
        const anneeLibelle = classe.annee_libelle || getAnneeLibelle(classe.annee_scolaire) || 'Année inconnue';
        const professeurNom = classe.professeur_nom || getEnseignantNom(classe.professeur_principal) || 'Non assigné';
        const capacite = classe.capacite || 0;
        const effectif = classe.effectif || 0;
        const salle = classe.salle || '';
        const description = classe.description || '';
        const statut = classe.statut || 'active';
        const statutLabel = getStatutLabel(statut);

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
        doc.text('FICHE DE CLASSE', pageWidth - margins.right, y + 5, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(84, 110, 122);
        doc.text(`N° ${code}`, pageWidth - margins.right, y + 10, { align: 'right' });
        doc.text(`Émis le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margins.right, y + 14, { align: 'right' });

        y += 27;
        doc.setDrawColor(26, 35, 126);
        doc.setLineWidth(0.4);
        doc.line(margins.left, y, pageWidth - margins.right, y);
        y += 8;

        // ================================================================
        // GRILLE D'INFORMATIONS PRINCIPALES
        // ================================================================
        const gridY = y;
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margins.left, gridY, contentWidth, 24, 2, 2, 'F');
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.roundedRect(margins.left, gridY, contentWidth, 24, 2, 2, 'S');

        const colWidth = contentWidth / 4;
        const gridX1 = margins.left;
        const gridX2 = margins.left + colWidth;
        const gridX3 = margins.left + colWidth * 2;
        const gridX4 = margins.left + colWidth * 3;

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 144, 156);
        
        doc.text('CLASSE', gridX1 + 4, gridY + 4.5);
        doc.text('NIVEAU', gridX2 + 4, gridY + 4.5);
        doc.text('STATUT', gridX3 + 4, gridY + 4.5);
        doc.text('ANNÉE SCOLAIRE', gridX4 + 4, gridY + 4.5);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 35, 126);
        doc.text(nom, gridX1 + 4, gridY + 13);
        doc.text(niveauNom, gridX2 + 4, gridY + 13);
        
        const statutColor = statut === 'active' ? [0, 150, 0] : 
                            statut === 'complete' ? [33, 150, 243] :
                            statut === 'archive' ? [255, 193, 7] : [158, 158, 158];
        doc.setTextColor(statutColor[0], statutColor[1], statutColor[2]);
        doc.text(statutLabel, gridX3 + 4, gridY + 13);
        doc.setTextColor(26, 35, 126);
        doc.text(anneeLibelle, gridX4 + 4, gridY + 13);

        // Deuxième ligne
        const gridY2 = gridY + 24;
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margins.left, gridY2, contentWidth, 18, 2, 2, 'F');
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.roundedRect(margins.left, gridY2, contentWidth, 18, 2, 2, 'S');

        const gridX5 = margins.left;
        const gridX6 = margins.left + colWidth;
        const gridX7 = margins.left + colWidth * 2;
        const gridX8 = margins.left + colWidth * 3;

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 144, 156);
        doc.text('CODE', gridX5 + 4, gridY2 + 4.5);
        doc.text('PROFESSEUR PRINCIPAL', gridX6 + 4, gridY2 + 4.5);
        doc.text('SALLE', gridX7 + 4, gridY2 + 4.5);
        doc.text('CAPACITÉ', gridX8 + 4, gridY2 + 4.5);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33);
        doc.text(code, gridX5 + 4, gridY2 + 13);
        doc.text(professeurNom, gridX6 + 4, gridY2 + 13);
        doc.text(salle || '-', gridX7 + 4, gridY2 + 13);
        doc.text(`${effectif} / ${capacite || '∞'}`, gridX8 + 4, gridY2 + 13);

        y = gridY2 + 22;

        // ================================================================
        // BARRE DE REMPLISSAGE
        // ================================================================
        if (capacite > 0) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(84, 110, 122);
          doc.text('TAUX DE REMPLISSAGE', margins.left, y);
          y += 4;

          const tauxRemplissage = Math.round((effectif / capacite) * 100);
          const barX = margins.left;
          const barY = y;
          const barWidth = contentWidth;
          const barHeight = 6;

          doc.setFillColor(224, 224, 224);
          doc.rect(barX, barY, barWidth, barHeight, 'F');

          const fillWidth = Math.min((tauxRemplissage / 100) * barWidth, barWidth);
          const fillColor = effectif >= capacite ? [244, 67, 54] : 
                            tauxRemplissage > 80 ? [255, 193, 7] : [76, 175, 80];
          doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
          doc.rect(barX, barY, fillWidth, barHeight, 'F');

          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(33, 33, 33);
          doc.text(`${tauxRemplissage}%`, barX + barWidth / 2, barY + barHeight + 4, { align: 'center' });

          y = barY + barHeight + 10;
        }

        // ================================================================
        // SECTION STATISTIQUES
        // ================================================================
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 35, 126);
        doc.text('INFORMATIONS GÉNÉRALES', margins.left, y);
        y += 2;
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.line(margins.left, y, pageWidth - margins.right, y);
        y += 6;

        const statsY = y;
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margins.left, statsY, contentWidth, 24, 2, 2, 'F');
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.roundedRect(margins.left, statsY, contentWidth, 24, 2, 2, 'S');

        const statsColW = contentWidth / 2;
        const statsX1 = margins.left;
        const statsX2 = margins.left + statsColW;

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 144, 156);
        doc.text('EFFECTIF TOTAL', statsX1 + 4, statsY + 4.5);
        doc.text('CAPACITÉ', statsX2 + 4, statsY + 4.5);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 33, 33);
        doc.text(String(effectif), statsX1 + 4, statsY + 13);
        doc.text(String(capacite || 'Illimitée'), statsX2 + 4, statsY + 13);

        y = statsY + 28;

        // ================================================================
        // SECTION DESCRIPTION
        // ================================================================
        if (description) {
          if (y > pageHeight - margins.bottom - 40) {
            doc.addPage();
            y = margins.top;
          }

          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(26, 35, 126);
          doc.text('DESCRIPTION', margins.left, y);
          y += 2;
          doc.setDrawColor(224, 224, 224);
          doc.setLineWidth(0.5);
          doc.line(margins.left, y, pageWidth - margins.right, y);
          y += 6;

          const descLines = doc.splitTextToSize(description, contentWidth - 12);
          const descHeight = Math.max(18, descLines.length * 5 + 10);
          
          doc.setFillColor(248, 249, 250);
          doc.roundedRect(margins.left, y, contentWidth, descHeight, 2, 2, 'F');
          doc.setDrawColor(224, 224, 224);
          doc.setLineWidth(0.5);
          doc.roundedRect(margins.left, y, contentWidth, descHeight, 2, 2, 'S');

          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(33, 33, 33);
          doc.text(descLines, margins.left + 6, y + 6);

          y += descHeight + 6;
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
          doc.text('Signature du Professeur Principal', signatureX2 + (signatureWidth / 2), signatureY, { align: 'center' });
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 144, 156);
          doc.text(professeurNom, signatureX2 + (signatureWidth / 2), signatureY + 12, { align: 'center' });
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

        // Numérotation
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

  // ============================================================
  // ✅ TÉLÉCHARGER PDF - Client Side
  // ============================================================
  const handleGeneratePDF = async (classe) => {
    setIsGeneratingPDF(true);
    try {
      const blob = await generateClassePDF(classe);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Classe_${classe.nom || classe.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('PDF généré avec succès', 'success');
    } catch (error) {
      console.error('❌ Erreur PDF:', error);
      showNotification('Erreur lors de la génération du PDF', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ============================================================
  // ✅ NAVIGATION VERS LA VUE PDF
  // ============================================================
  const goToPdfView = (id) => {
    navigate(`/classes/${id}/pdf`);
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get('/classes/export_csv/', {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'classes_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Export CSV effectué avec succès', 'success');
    } catch (error) {
      console.error('❌ Erreur export:', error);
      showNotification('Erreur lors de l\'export', 'error');
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // FONCTIONS UTILITAIRES
  // ============================================================
  const getNiveauNom = (id) => {
    const niveau = niveaux.find(n => n.id === id);
    return niveau ? niveau.nom : 'Niveau inconnu';
  };

  const getEnseignantNom = (id) => {
    const enseignant = enseignants.find(e => e.id === id);
    if (enseignant) {
      return enseignant.nom_complet || enseignant.nom || enseignant.username || enseignant.email || 'Enseignant';
    }
    return 'Non assigné';
  };

  const getAnneeLibelle = (id) => {
    const annee = anneesScolaires.find(a => a.id === id);
    return annee ? annee.libelle : 'Année inconnue';
  };

  const getStatutBadge = (statut) => {
    const map = {
      active: 'badge-success',
      inactive: 'badge-error',
      archive: 'badge-warning',
      complete: 'badge-info'
    };
    return map[statut] || 'badge-ghost';
  };

  const getStatutLabel = (statut) => {
    const map = {
      active: 'Active',
      inactive: 'Inactive',
      archive: 'Archivée',
      complete: 'Complète'
    };
    return map[statut] || statut || 'Inconnu';
  };

  // ============================================================
  // FILTRAGE
  // ============================================================
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeNiveaux = Array.isArray(niveaux) ? niveaux : [];
  const safeEnseignants = Array.isArray(enseignants) ? enseignants : [];

  const filteredClasses = safeClasses.filter(c => {
    const matchSearch = !searchTerm ||
      (c.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.niveau_nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchNiveau = niveauFilter === 'all' || c.niveau === Number(niveauFilter);
    const matchAnnee = anneeFilter === 'all' || c.annee_scolaire === Number(anneeFilter);

    return matchSearch && matchNiveau && matchAnnee;
  });

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ============================================================
  // STATISTIQUES
  // ============================================================
  const stats = {
    total: safeClasses.length,
    capaciteTotal: safeClasses.reduce((sum, c) => sum + (c.capacite || 0), 0),
    avecProfesseur: safeClasses.filter(c => c.professeur_principal).length,
    actives: safeClasses.filter(c => c.statut === 'active').length,
    completes: safeClasses.filter(c => c.statut === 'complete').length,
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin mx-auto" />
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des classes...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen w-full">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl text-sm sm:text-base rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> : 
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              <span className="font-medium">{notification.message}</span>
            </div>
            <button 
              className="btn btn-ghost btn-xs btn-circle flex-shrink-0" 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL SUPPRESSION
          ============================================================ */}
      {showDeleteModal && classeToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette classe ?</p>
              <p className="font-semibold text-error mt-2">{classeToDelete.nom}</p>
              <p className="text-sm text-gray-500">{getNiveauNom(classeToDelete.niveau)}</p>
              {classeToDelete.effectif > 0 && (
                <p className="text-sm text-warning mt-3 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" /> 
                  {classeToDelete.effectif} élève(s) rattaché(s)
                </p>
              )}
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>
                Annuler
              </button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          EN-TÊTE
          ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <School className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Classes</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez les classes scolaires – {stats.total} classe(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button 
              onClick={handleExportCSV} 
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
              disabled={exporting}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              CSV
            </button>
            <button 
              onClick={fetchData} 
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button 
              onClick={() => navigate('/classes/nouveau')} 
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle classe
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          CARTES STATISTIQUES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <School className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Actives</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{stats.actives}</p>
              </div>
              <UserCheck className="w-8 h-8 text-success/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Capacité totale</p>
                <p className="text-xl sm:text-2xl font-bold text-info">{stats.capaciteTotal}</p>
              </div>
              <Users className="w-8 h-8 text-info/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Avec prof. principal</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">{stats.avecProfesseur}</p>
              </div>
              <User className="w-8 h-8 text-warning/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Complètes</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-500">{stats.completes}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-500/20" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          FILTRES
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, code ou niveau..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" /> 
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={niveauFilter} 
              onChange={(e) => { setNiveauFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les niveaux</option>
              {safeNiveaux.map(n => (
                <option key={n.id} value={n.id}>{n.nom}</option>
              ))}
            </select>
            
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={anneeFilter} 
              onChange={(e) => { setAnneeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Toutes les années</option>
              {anneesScolaires.map(a => (
                <option key={a.id} value={a.id}>{a.libelle}</option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <button 
                className="btn btn-outline gap-2 flex-1 hover:bg-primary/10 transition-all" 
                onClick={() => { 
                  setNiveauFilter('all'); 
                  setAnneeFilter('all');
                  setSearchTerm(''); 
                  setCurrentPage(1); 
                }}
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
              <div className="join">
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          TABLEAU / GRILLE
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {paginatedClasses.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <School className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">
                {searchTerm || niveauFilter !== 'all' || anneeFilter !== 'all'
                  ? 'Aucune classe ne correspond aux filtres'
                  : 'Aucune classe trouvée'}
              </p>
              <button 
                onClick={() => navigate('/classes/nouveau')} 
                className="btn btn-primary btn-sm gap-2 mt-2"
              >
                <Plus className="w-4 h-4" /> Ajouter une classe
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                      <th className="py-4 font-semibold">Classe</th>
                      <th className="py-4 font-semibold hidden sm:table-cell">Code</th>
                      <th className="py-4 font-semibold">Niveau</th>
                      <th className="py-4 font-semibold hidden md:table-cell">Année</th>
                      <th className="py-4 font-semibold text-center">Capacité</th>
                      <th className="py-4 font-semibold hidden lg:table-cell">Professeur</th>
                      <th className="py-4 font-semibold hidden sm:table-cell">Statut</th>
                      <th className="py-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClasses.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <School className="w-4 h-4 text-primary" />
                            </div>
                            <span 
                              className="font-semibold hover:text-primary cursor-pointer transition-colors"
                              onClick={() => navigate(`/classes/${c.id}`)}
                            >
                              {c.nom}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="font-mono text-sm">{c.code || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge badge-primary badge-sm">{getNiveauNom(c.niveau)}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-gray-600">{getAnneeLibelle(c.annee_scolaire)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span>{c.effectif || 0}/{c.capacite || 30}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm">{c.professeur_principal ? getEnseignantNom(c.professeur_principal) : 'Non assigné'}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`badge ${getStatutBadge(c.statut)} badge-sm`}>
                            {getStatutLabel(c.statut)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button 
                              onClick={() => navigate(`/classes/${c.id}`)} 
                              className="btn btn-ghost btn-sm btn-circle tooltip" 
                              title="Détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/classes/${c.id}/modifier`)} 
                              className="btn btn-ghost btn-sm btn-circle tooltip" 
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => goToPdfView(c.id)} 
                              className="btn btn-ghost btn-sm btn-circle tooltip text-primary" 
                              title="Aperçu PDF"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleGeneratePDF(c)} 
                              className="btn btn-ghost btn-sm btn-circle tooltip" 
                              title="Télécharger PDF"
                              disabled={isGeneratingPDF}
                            >
                              {isGeneratingPDF ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </button>
                            <button 
                              onClick={() => { setClasseToDelete(c); setShowDeleteModal(true); }} 
                              className="btn btn-ghost btn-sm btn-circle text-error tooltip" 
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {paginatedClasses.map(c => (
                  <div 
                    key={c.id} 
                    className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200"
                  >
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <School className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 
                              className="font-semibold text-sm truncate hover:text-primary cursor-pointer transition-colors"
                              onClick={() => navigate(`/classes/${c.id}`)}
                            >
                              {c.nom}
                            </h3>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="badge badge-primary badge-xs">{getNiveauNom(c.niveau)}</span>
                              {c.code && <span className="badge badge-ghost badge-xs font-mono">{c.code}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="dropdown dropdown-end" onClick={(ev) => ev.stopPropagation()}>
                          <button className="btn btn-ghost btn-sm btn-circle">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <ul className="dropdown-menu dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li><button onClick={() => navigate(`/classes/${c.id}`)}><Eye className="w-4 h-4" /> Détails</button></li>
                            <li><button onClick={() => navigate(`/classes/${c.id}/modifier`)}><Edit className="w-4 h-4" /> Modifier</button></li>
                            <li><button onClick={() => goToPdfView(c.id)}><Eye className="w-4 h-4" /> Aperçu PDF</button></li>
                            <li><button onClick={() => handleGeneratePDF(c)}><FileText className="w-4 h-4" /> Télécharger PDF</button></li>
                            <li><button onClick={() => { setClasseToDelete(c); setShowDeleteModal(true); }} className="text-error"><Trash2 className="w-4 h-4" /> Supprimer</button></li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>Effectif : <span className="font-medium">{c.effectif || 0}</span></span>
                        <span className="text-gray-400">/ {c.capacite || 30}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="truncate">
                          {c.professeur_principal ? getEnseignantNom(c.professeur_principal) : 'Non assigné'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <span className={`badge ${getStatutBadge(c.statut)}`}>
                          {getStatutLabel(c.statut)}
                        </span>
                        <span className="text-xs text-gray-400">{getAnneeLibelle(c.annee_scolaire)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============================================================
            PAGINATION
            ============================================================ */}
        {filteredClasses.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredClasses.length)}</span>{' '}
                sur <span className="font-semibold">{filteredClasses.length}</span> classes
              </div>
              <div className="flex items-center gap-3">
                <select 
                  className="select select-bordered select-sm" 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <div className="join">
                  <button 
                    className="join-item btn btn-sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                    disabled={currentPage===1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i+1;
                    else if (currentPage <= 3) pageNum = i+1;
                    else if (currentPage >= totalPages-2) pageNum = totalPages-4+i;
                    else pageNum = currentPage-2+i;
                    return (
                      <button 
                        key={pageNum} 
                        onClick={() => setCurrentPage(pageNum)} 
                        className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-primary text-white' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button 
                    className="join-item btn btn-sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                    disabled={currentPage===totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionClasses;