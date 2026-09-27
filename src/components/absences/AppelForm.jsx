// src/components/absences/AppelForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle, X, Save,
  GraduationCap, User, ClipboardList, Calendar,
  BookOpen, Users, Check, UserX, RotateCw,
  Clock, School, Gauge, UserRound, Search, Download,
  Printer, ChevronLeft, ChevronRight, Filter, Layers,
  TrendingUp, UserCheck, UserMinus, CheckCheck, Info,
  FileText, Timer, AlertTriangle, FileSpreadsheet
} from 'lucide-react';

const AppelForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Données
  const [niveaux, setNiveaux] = useState([]);
  const [classes, setClasses] = useState([]);
  const [coursByClasse, setCoursByClasse] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [appel, setAppel] = useState(null);
  const [appelDetails, setAppelDetails] = useState([]);

  // Sélections
  const [niveauId, setNiveauId] = useState('');
  const [classeId, setClasseId] = useState('');
  const [coursId, setCoursId] = useState('');
  const [enseignantId, setEnseignantId] = useState('');

  // Formulaire
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    heure_debut: '',
    heure_fin: '',
    type_appel: 'cours',
    observations: ''
  });

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [searchEleve, setSearchEleve] = useState('');
  const [showAbsents, setShowAbsents] = useState(false);
  const [showPresents, setShowPresents] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [stats, setStats] = useState({
    total: 0, presents: 0, absents: 0, retards: 0, excuses: 0
  });

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showMessage = (texte, type = 'success') => {
    setNotification({ show: true, message: texte, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // HELPER : charge toutes les pages DRF
  // ============================================================
  const fetchAllPages = async (url, headers) => {
    let all = [];
    let next = url;
    let safety = 0;
    while (next && safety < 30) {
      const res = await axiosInstance.get(next, headers);
      if (Array.isArray(res.data)) {
        all = all.concat(res.data);
        next = null;
      } else if (res.data?.results) {
        all = all.concat(res.data.results);
        next = res.data.next;
      } else {
        next = null;
      }
      safety++;
    }
    return all;
  };

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        // Charger niveaux + enseignants en parallèle
        const [niveauxData, enseignantsData] = await Promise.all([
          fetchAllPages('/niveaux/', headers).catch(() => []),
          fetchAllPages('/professeurs/', headers).catch(() => [])
        ]);

        setNiveaux(niveauxData);
        setEnseignants(enseignantsData);

        // Si édition
        if (id) {
          await loadAppelDetails(id, headers);
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ Erreur initiale:', err);
        setError('Erreur de chargement des données');
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // ============================================================
  // CHARGEMENT DÉTAILS APPEL (édition)
  // ============================================================
  const loadAppelDetails = async (appelId, headersParam = null) => {
    try {
      const token = localStorage.getItem('Token');
      const headers = headersParam || { headers: { Authorization: `Token ${token}` } };

      const appelRes = await axiosInstance.get(`/appels/${appelId}/`, headers);
      const data = appelRes.data;
      setAppel(data);

      setFormData({
        date: data.date || '',
        heure_debut: data.heure_debut || '',
        heure_fin: data.heure_fin || '',
        type_appel: data.type_appel || 'cours',
        observations: data.observations || ''
      });

      if (data.enseignant) setEnseignantId(data.enseignant);
      if (data.cours) {
        setCoursId(data.cours);
        // Charger le cours pour récupérer classe + niveau
        try {
          const coursDetail = await axiosInstance.get(`/cours/${data.cours}/`, headers);
          if (coursDetail.data?.classe) {
            setClasseId(coursDetail.data.classe);
            // Charger les classes du niveau
            const classeDetail = await axiosInstance.get(`/classes/${coursDetail.data.classe}/`, headers);
            if (classeDetail.data?.niveau) {
              setNiveauId(classeDetail.data.niveau);
              await loadClassesByNiveau(classeDetail.data.niveau, headers);
              await loadCoursByClasse(classeDetail.data.classe, headers);
            }
            // Charger les élèves
            await loadEleves(coursDetail.data.classe, headers, false);
          }
        } catch (e) {
          console.warn('Impossible de charger les détails du cours:', e);
        }
      }

      // Charger les détails de l'appel existant
      if (data.details && Array.isArray(data.details)) {
        setAppelDetails(data.details);
        updateStats(data.details);
      }

    } catch (err) {
      console.error('❌ Erreur chargement appel:', err);
      showMessage('Erreur de chargement des détails', 'error');
    }
  };

  // ============================================================
  // CHARGER CLASSES PAR NIVEAU
  // ============================================================
  const loadClassesByNiveau = async (niveauIdParam, headersParam = null) => {
    if (!niveauIdParam) {
      setClasses([]);
      return;
    }
    try {
      const token = localStorage.getItem('Token');
      const headers = headersParam || { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(
        `/classes/?niveau=${niveauIdParam}&actif=true`,
        headers
      );

      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.results) data = res.data.results;

      setClasses(data);
    } catch (err) {
      console.error('❌ Erreur classes:', err);
      setClasses([]);
    }
  };

  // ============================================================
  // CHARGER COURS PAR CLASSE
  // ============================================================
  const loadCoursByClasse = async (classeIdParam, headersParam = null) => {
    if (!classeIdParam) {
      setCoursByClasse([]);
      return;
    }
    try {
      const token = localStorage.getItem('Token');
      const headers = headersParam || { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(
        `/cours/?classe=${classeIdParam}`,
        headers
      );

      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.results) data = res.data.results;

      setCoursByClasse(data);
    } catch (err) {
      console.error('❌ Erreur cours:', err);
      setCoursByClasse([]);
    }
  };

  // ============================================================
  // ⭐ CHARGER ÉLÈVES — SANS FILTRE CLIENT (fix principal)
  // ============================================================
  const loadEleves = async (classeIdParam, headersParam = null, resetDetails = true) => {
    if (!classeIdParam) {
      setEleves([]);
      if (resetDetails) setAppelDetails([]);
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const headers = headersParam || { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(
        `/eleves/?classe=${classeIdParam}&statut=actif`,
        headers
      );

      // ✅ Extraction robuste SANS filtre client
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }

      console.log(`📊 ${data.length} élèves chargés pour la classe ${classeIdParam}`);
      setEleves(data);
      setCurrentPage(1);

      // ✅ Créer les détails uniquement si demandé et si pas en édition
      if (resetDetails && data.length > 0) {
        const details = data.map(e => ({
          eleve: e.id,
          eleve_nom: e.nom_complet || `${e.prenom || ''} ${e.nom || ''}`.trim(),
          eleve_matricule: e.matricule || '-',
          presence: 'present',
          motif_absence: '',
          heure_arrivee: ''
        }));
        setAppelDetails(details);
        updateStats(details);
      } else if (data.length > 0) {
        updateStats(appelDetails);
      }

    } catch (err) {
      console.error('❌ Erreur chargement élèves:', err);
      showMessage('Erreur chargement des élèves', 'error');
      setEleves([]);
    }
  };

  // ============================================================
  // STATISTIQUES
  // ============================================================
  const updateStats = (detailsList = appelDetails) => {
    const total = detailsList.length;
    const presents = detailsList.filter(d => d.presence === 'present').length;
    const absents = detailsList.filter(d => d.presence === 'absent').length;
    const retards = detailsList.filter(d => d.presence === 'retard').length;
    const excuses = detailsList.filter(d => d.presence === 'excuse' || d.presence === 'excusé').length;

    setStats({ total, presents, absents, retards, excuses });
  };

  // ============================================================
  // GESTIONNAIRES EN CASCADE
  // ============================================================
  const handleNiveauChange = async (e) => {
    const value = e.target.value;
    setNiveauId(value);

    setClasses([]);
    setClasseId('');
    setCoursByClasse([]);
    setCoursId('');
    setEleves([]);
    setAppelDetails([]);
    setEnseignantId('');
    setStats({ total: 0, presents: 0, absents: 0, retards: 0, excuses: 0 });

    if (value) {
      await loadClassesByNiveau(value);
    }
  };

  const handleClasseChange = async (e) => {
    const value = e.target.value;
    setClasseId(value);

    setCoursByClasse([]);
    setCoursId('');
    setEleves([]);
    setAppelDetails([]);
    setEnseignantId('');
    setStats({ total: 0, presents: 0, absents: 0, retards: 0, excuses: 0 });

    if (value) {
      await Promise.all([
        loadCoursByClasse(value),
        loadEleves(value, null, true)
      ]);
    }
  };

  const handleCoursChange = async (e) => {
    const value = e.target.value;
    setCoursId(value);

    if (!value) {
      setFormData(prev => ({ ...prev, heure_debut: '', heure_fin: '' }));
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };
      const coursDetail = await axiosInstance.get(`/cours/${value}/`, headers);

      // Auto-remplir les heures
      const heureDebut = coursDetail.data?.heure_debut || '';
      const heureFin = coursDetail.data?.heure_fin || '';
      setFormData(prev => ({
        ...prev,
        heure_debut: heureDebut,
        heure_fin: heureFin
      }));

      // Auto-remplir l'enseignant
      if (coursDetail.data?.enseignant) {
        setEnseignantId(coursDetail.data.enseignant);
      }

      // ⚠️ NE PAS recharger les élèves ici — c'est déjà fait au niveau de la classe
      // On recharge uniquement si la classe du cours est différente
      if (coursDetail.data?.classe && parseInt(coursDetail.data.classe) !== parseInt(classeId)) {
        setClasseId(coursDetail.data.classe);
        await loadEleves(coursDetail.data.classe, headers, true);
      }

    } catch (err) {
      console.warn('Impossible de charger les détails du cours:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePresenceChange = (eleveId, field, value) => {
    setAppelDetails(prev => {
      const updated = prev.map(detail =>
        detail.eleve === eleveId ? { ...detail, [field]: value } : detail
      );
      updateStats(updated);
      return updated;
    });
  };

  // ============================================================
  // ACTIONS RAPIDES
  // ============================================================
  const handleAllPresent = () => {
    if (appelDetails.length === 0) return;
    setAppelDetails(prev => {
      const updated = prev.map(d => ({
        ...d,
        presence: 'present',
        motif_absence: '',
        heure_arrivee: ''
      }));
      updateStats(updated);
      return updated;
    });
    showMessage(`✅ ${appelDetails.length} élève(s) marqué(s) présent(s)`, 'success');
  };

  const handleAllAbsent = () => {
    if (appelDetails.length === 0) return;
    if (!window.confirm(`Marquer TOUS les ${appelDetails.length} élèves ABSENTS ?`)) return;
    setAppelDetails(prev => {
      const updated = prev.map(d => ({
        ...d,
        presence: 'absent',
        motif_absence: 'Absent non justifié',
        heure_arrivee: ''
      }));
      updateStats(updated);
      return updated;
    });
    showMessage(`⚠️ ${appelDetails.length} élève(s) marqué(s) absent(s)`, 'info');
  };

  // ============================================================
  // FILTRES & PAGINATION
  // ============================================================
  const getFilteredEleves = () => {
    let filtered = [...appelDetails];

    if (searchEleve) {
      const search = searchEleve.toLowerCase().trim();
      filtered = filtered.filter(e =>
        (e.eleve_nom || '').toLowerCase().includes(search) ||
        (e.eleve_matricule || '').toLowerCase().includes(search)
      );
    }

    if (showAbsents) {
      filtered = filtered.filter(e => e.presence === 'absent');
    }
    if (showPresents) {
      filtered = filtered.filter(e => e.presence === 'present');
    }
    return filtered;
  };

  const filteredEleves = getFilteredEleves();
  const totalFiltered = filteredEleves.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const paginatedEleves = filteredEleves.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchEleve, showAbsents, showPresents]);

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coursId) return showMessage('Veuillez sélectionner un cours', 'error');
    if (!formData.date) return showMessage('Veuillez sélectionner une date', 'error');
    if (!formData.heure_debut) return showMessage('Veuillez renseigner l\'heure de début', 'error');
    if (!formData.heure_fin) return showMessage('Veuillez renseigner l\'heure de fin', 'error');
    if (!enseignantId) return showMessage('Veuillez sélectionner un enseignant', 'error');

    setSubmitting(true);

    try {
      const token = localStorage.getItem('Token');
      const headers = {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      };

      const dataToSend = {
        cours: parseInt(coursId),
        date: formData.date,
        heure_debut: formData.heure_debut,
        heure_fin: formData.heure_fin,
        type_appel: formData.type_appel || 'cours',
        enseignant: parseInt(enseignantId),
        observations: formData.observations || ''
      };

      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/appels/${id}/`, dataToSend, headers);
        showMessage('Appel modifié avec succès', 'success');
      } else {
        response = await axiosInstance.post('/appels/', dataToSend, headers);
        showMessage('Appel créé avec succès', 'success');
      }

      const appelId = response.data.id || id;

      if (appelDetails.length > 0) {
        const presenceData = {
          presences: appelDetails.map(d => ({
            eleve_id: d.eleve,
            presence: d.presence,
            motif_absence: d.motif_absence || '',
            heure_arrivee: d.heure_arrivee || null
          }))
        };
        await axiosInstance.post(`/appels/${appelId}/enregistrer_presence/`, presenceData, headers);
      }

      setTimeout(() => navigate('/appels'), 1500);

    } catch (err) {
      console.error('❌ Erreur:', err);
      if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        showMessage(errors.join(' ') || 'Erreur lors de l\'enregistrement', 'error');
      } else {
        showMessage('Erreur lors de l\'enregistrement', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const exportCSV = () => {
    if (appelDetails.length === 0) return;

    const presenceLabels = {
      present: 'Présent', absent: 'Absent',
      retard: 'Retard', excuse: 'Excusé'
    };

    const csvHeaders = ['N°', 'Élève', 'Matricule', 'Présence', 'Motif', 'Heure arrivée'];
    const rows = appelDetails.map((d, i) => [
      i + 1, d.eleve_nom || '', d.eleve_matricule || '-',
      presenceLabels[d.presence] || d.presence,
      d.motif_absence || '', d.heure_arrivee || ''
    ]);

    const csvContent = [csvHeaders, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `appel_${formData.date || 'appel'}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showMessage('Export CSV réussi', 'success');
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin mx-auto" />
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-error mx-auto mb-4" />
          <h3 className="text-lg font-bold text-error">{error}</h3>
          <button onClick={() => window.location.reload()} className="btn btn-primary mt-3 gap-2">
            <RotateCw className="h-4 w-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">

      {/* NOTIFICATION TOAST */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${
            notification.type === 'success' ? 'alert-success' :
            notification.type === 'error' ? 'alert-error' : 'alert-info'
          } shadow-xl text-sm sm:text-base rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {notification.type === 'info' && <AlertTriangle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL STATISTIQUES */}
      {showStats && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Statistiques de l'appel
              </h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowStats(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="stat bg-primary/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Total</div>
                <div className="stat-value text-2xl font-bold text-primary">{stats.total}</div>
              </div>
              <div className="stat bg-success/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Présents</div>
                <div className="stat-value text-2xl font-bold text-success">{stats.presents}</div>
              </div>
              <div className="stat bg-error/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Absents</div>
                <div className="stat-value text-2xl font-bold text-error">{stats.absents}</div>
              </div>
              <div className="stat bg-warning/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Retards</div>
                <div className="stat-value text-2xl font-bold text-warning">{stats.retards}</div>
              </div>
              <div className="stat bg-info/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Excusés</div>
                <div className="stat-value text-2xl font-bold text-info">{stats.excuses}</div>
              </div>
            </div>

            {stats.total > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">Taux de présence</div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-success h-full transition-all"
                    style={{ width: `${(stats.presents / stats.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((stats.presents / stats.total) * 100).toFixed(1)}% de présence
                </p>
              </div>
            )}

            <div className="modal-action">
              <button className="btn" onClick={() => setShowStats(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <ClipboardList className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">
                {isEditing ? 'Modifier l\'appel' : 'Nouvel appel'}
              </h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              {appel ? appel.cours_nom : 'Gérez la présence des élèves'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {appelDetails.length > 0 && (
              <button
                onClick={() => setShowStats(true)}
                className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
              >
                <TrendingUp className="w-4 h-4" /> Stats
              </button>
            )}
            <button
              onClick={exportCSV}
              disabled={appelDetails.length === 0}
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={() => navigate('/appels')}
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

        {/* SÉLECTION EN CASCADE */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Sélection en cascade
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* NIVEAU */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-500" /> Niveau *
              </label>
              <select
                value={niveauId}
                onChange={handleNiveauChange}
                className="select select-bordered w-full focus:border-primary"
                required
              >
                <option value="">Sélectionnez un niveau</option>
                {niveaux.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.nom} {n.cycle ? `(${n.cycle})` : ''}
                  </option>
                ))}
              </select>
              {niveauId && (
                <p className="text-xs text-gray-500 mt-1">{classes.length} classe(s)</p>
              )}
            </div>

            {/* CLASSE */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
                <School className="h-4 w-4 text-gray-500" /> Classe *
              </label>
              <select
                value={classeId}
                onChange={handleClasseChange}
                className="select select-bordered w-full focus:border-primary"
                disabled={!niveauId || classes.length === 0}
                required
              >
                <option value="">
                  {!niveauId ? 'Sélectionnez d\'abord un niveau'
                    : classes.length === 0 ? 'Aucune classe'
                    : 'Sélectionnez une classe'}
                </option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
              {classeId && (
                <p className="text-xs text-gray-500 mt-1">{eleves.length} élève(s)</p>
              )}
            </div>

            {/* COURS */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-500" /> Cours *
              </label>
              <select
                value={coursId}
                onChange={handleCoursChange}
                className="select select-bordered w-full focus:border-primary"
                disabled={!classeId || coursByClasse.length === 0}
                required
              >
                <option value="">
                  {!classeId ? 'Sélectionnez d\'abord une classe'
                    : coursByClasse.length === 0 ? 'Aucun cours'
                    : 'Sélectionnez un cours'}
                </option>
                {coursByClasse.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.matiere_nom || 'Sans matière'} - {c.jour || ''} {c.heure_debut ? `(${c.heure_debut.substring(0,5)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Indicateur progression */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 flex-wrap">
            <div className={`flex items-center gap-1.5 text-xs ${niveauId ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${niveauId ? 'bg-green-100' : 'bg-gray-100'}`}>
                {niveauId ? <Check className="w-3 h-3" /> : '1'}
              </div>
              Niveau
            </div>
            <div className="w-6 h-px bg-gray-300"></div>
            <div className={`flex items-center gap-1.5 text-xs ${classeId ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${classeId ? 'bg-green-100' : 'bg-gray-100'}`}>
                {classeId ? <Check className="w-3 h-3" /> : '2'}
              </div>
              Classe
            </div>
            <div className="w-6 h-px bg-gray-300"></div>
            <div className={`flex items-center gap-1.5 text-xs ${coursId ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${coursId ? 'bg-green-100' : 'bg-gray-100'}`}>
                {coursId ? <Check className="w-3 h-3" /> : '3'}
              </div>
              Cours
            </div>
          </div>
        </div>

        {/* INFOS DATE / HEURES / ENSEIGNANT */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Informations de l'appel
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" /> Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input input-bordered w-full focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" /> Heure début *
              </label>
              <input
                type="time"
                name="heure_debut"
                value={formData.heure_debut}
                onChange={handleChange}
                className="input input-bordered w-full focus:border-primary"
                readOnly={!!coursId}
                required
              />
              {coursId && formData.heure_debut && (
                <p className="text-xs text-green-600 mt-1">✓ Auto depuis le cours</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" /> Heure fin *
              </label>
              <input
                type="time"
                name="heure_fin"
                value={formData.heure_fin}
                onChange={handleChange}
                className="input input-bordered w-full focus:border-primary"
                readOnly={!!coursId}
                required
              />
              {coursId && formData.heure_fin && (
                <p className="text-xs text-green-600 mt-1">✓ Auto depuis le cours</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-gray-500" /> Enseignant *
              </label>
              <select
                value={enseignantId}
                onChange={(e) => setEnseignantId(e.target.value)}
                className="select select-bordered w-full focus:border-primary"
                required
              >
                <option value="">Sélectionnez</option>
                {enseignants.map(ens => (
                  <option key={ens.id} value={ens.id}>
                    {ens.nom_complet || ens.nom || ens.prenom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" /> Type d'appel
              </label>
              <select
                name="type_appel"
                value={formData.type_appel}
                onChange={handleChange}
                className="select select-bordered w-full focus:border-primary"
              >
                <option value="cours">Cours</option>
                <option value="examen">Examen</option>
                <option value="permanence">Permanence</option>
                <option value="activite">Activité</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" /> Observations
              </label>
              <input
                type="text"
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                className="input input-bordered w-full focus:border-primary"
                placeholder="Observations..."
              />
            </div>
          </div>
        </div>

        {/* STATISTIQUES RAPIDES */}
        {appelDetails.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
              <div className="card-body p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
                    <p className="text-xl font-bold text-primary">{stats.total}</p>
                  </div>
                  <Users className="w-7 h-7 text-primary/20" />
                </div>
              </div>
            </div>
            <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
              <div className="card-body p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Présents</p>
                    <p className="text-xl font-bold text-success">{stats.presents}</p>
                  </div>
                  <UserCheck className="w-7 h-7 text-success/20" />
                </div>
              </div>
            </div>
            <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
              <div className="card-body p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Absents</p>
                    <p className="text-xl font-bold text-error">{stats.absents}</p>
                  </div>
                  <UserX className="w-7 h-7 text-error/20" />
                </div>
              </div>
            </div>
            <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
              <div className="card-body p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Retards</p>
                    <p className="text-xl font-bold text-warning">{stats.retards}</p>
                  </div>
                  <Timer className="w-7 h-7 text-warning/20" />
                </div>
              </div>
            </div>
            <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
              <div className="card-body p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Excusés</p>
                    <p className="text-xl font-bold text-info">{stats.excuses}</p>
                  </div>
                  <CheckCircle className="w-7 h-7 text-info/20" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTIONS RAPIDES */}
        {appelDetails.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCheck className="h-4 w-4 text-primary" />
              Actions rapides
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAllPresent}
                className="btn btn-sm bg-success hover:bg-success/90 text-white gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Tous présents ({appelDetails.length})
              </button>
              <button
                type="button"
                onClick={handleAllAbsent}
                className="btn btn-sm btn-outline btn-error gap-2"
              >
                <UserMinus className="w-4 h-4" />
                Tous absents
              </button>
            </div>
          </div>
        )}

        {/* TABLEAU DES ÉLÈVES */}
        {appelDetails.length > 0 ? (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Barre d'outils */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {totalFiltered} élève(s)
                  </span>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchEleve}
                      onChange={(e) => setSearchEleve(e.target.value)}
                      className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'} gap-1`}
                  >
                    <Filter className="h-4 w-4" />
                  </button>
                  {showFilters && (
                    <>
                      <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showAbsents}
                          onChange={(e) => setShowAbsents(e.target.checked)}
                          className="checkbox checkbox-sm checkbox-primary"
                        />
                        Absents
                      </label>
                      <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showPresents}
                          onChange={(e) => setShowPresents(e.target.checked)}
                          className="checkbox checkbox-sm checkbox-primary"
                        />
                        Présents
                      </label>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="btn btn-sm btn-outline gap-1"
                  >
                    <Download className="h-4 w-4" /> Exporter
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-sm btn-outline gap-1"
                  >
                    <Printer className="h-4 w-4" /> Imprimer
                  </button>
                </div>
              </div>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                    <th className="py-3 font-semibold">
                      <Info className="h-3 w-3 inline mr-1" /> N°
                    </th>
                    <th className="py-3 font-semibold">
                      <GraduationCap className="h-3 w-3 inline mr-1" /> Élève
                    </th>
                    <th className="py-3 font-semibold">
                      <User className="h-3 w-3 inline mr-1" /> Matricule
                    </th>
                    <th className="py-3 text-center font-semibold">
                      <UserCheck className="h-3 w-3 inline mr-1" /> Présence
                    </th>
                    <th className="py-3 font-semibold">
                      <FileText className="h-3 w-3 inline mr-1" /> Motif
                    </th>
                    <th className="py-3 text-center font-semibold">
                      <Clock className="h-3 w-3 inline mr-1" /> Heure arrivée
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEleves.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                            <UserRound className="w-10 h-10 text-gray-300" />
                          </div>
                          <p className="text-gray-500 font-medium">Aucun élève ne correspond aux filtres</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedEleves.map((detail, index) => {
                      const presenceColors = {
                        present: 'text-success bg-success/10',
                        absent: 'text-error bg-error/10',
                        retard: 'text-warning bg-warning/10',
                        excuse: 'text-info bg-info/10'
                      };
                      const isAbsent = detail.presence === 'absent';

                      return (
                        <tr
                          key={detail.eleve}
                          className={`border-t hover:bg-gray-50 transition ${isAbsent ? 'bg-red-50/40' : ''}`}
                        >
                          <td className="text-sm text-gray-500">{startIndex + index + 1}</td>
                          <td className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <span>{detail.eleve_nom || 'Inconnu'}</span>
                              {isAbsent && <span className="badge badge-error badge-xs">Absent</span>}
                            </div>
                          </td>
                          <td className="text-sm text-gray-500 font-mono">{detail.eleve_matricule || '-'}</td>
                          <td className="text-center">
                            <select
                              value={detail.presence}
                              onChange={(e) => handlePresenceChange(detail.eleve, 'presence', e.target.value)}
                              className={`select select-bordered select-sm ${presenceColors[detail.presence]} font-semibold`}
                            >
                              <option value="present">Présent</option>
                              <option value="absent">Absent</option>
                              <option value="retard">Retard</option>
                              <option value="excuse">Excusé</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={detail.motif_absence || ''}
                              onChange={(e) => handlePresenceChange(detail.eleve, 'motif_absence', e.target.value)}
                              className="input input-bordered input-sm w-full"
                              placeholder="Motif..."
                              disabled={detail.presence === 'present'}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="time"
                              value={detail.heure_arrivee || ''}
                              onChange={(e) => handlePresenceChange(detail.eleve, 'heure_arrivee', e.target.value)}
                              className="input input-bordered input-sm w-28 text-center"
                              disabled={detail.presence !== 'retard'}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalFiltered > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500">
                    Affichage de <span className="font-semibold text-primary">{startIndex + 1}</span> à{' '}
                    <span className="font-semibold text-primary">{endIndex}</span> sur{' '}
                    <span className="font-semibold">{totalFiltered}</span> élève(s)
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      className="select select-bordered select-sm"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <div className="join">
                      <button
                        type="button"
                        className="join-item btn btn-sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-primary text-white' : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className="join-item btn btn-sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-700">
                {!niveauId ? 'Sélectionnez un niveau'
                  : classes.length === 0 ? 'Aucune classe pour ce niveau'
                  : !classeId ? 'Sélectionnez une classe'
                  : eleves.length === 0 ? 'Aucun élève dans cette classe'
                  : !coursId ? 'Sélectionnez un cours'
                  : 'Prêt'}
              </h3>
              <p className="text-gray-500">
                {!niveauId ? 'Commencez par choisir un niveau'
                  : classes.length === 0 ? 'Aucune classe définie pour ce niveau'
                  : !classeId ? 'Choisissez une classe pour voir les élèves'
                  : eleves.length === 0 ? 'Aucun élève inscrit dans cette classe'
                  : !coursId ? 'Choisissez un cours pour continuer'
                  : ''}
              </p>
            </div>
          </div>
        )}

        {/* BOUTONS ENREGISTREMENT */}
        {appelDetails.length > 0 && (
          <div className="sticky bottom-4 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-500">
                {stats.presents} présent(s) • {stats.absents} absent(s)
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/appels')}
                  className="btn btn-outline gap-2"
                >
                  <X className="h-4 w-4" /> Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isEditing ? 'Modifier l\'appel' : 'Enregistrer l\'appel'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};

export default AppelForm;