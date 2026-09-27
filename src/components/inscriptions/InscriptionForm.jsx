// src/components/inscriptions/InscriptionForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, CheckCircle, AlertCircle,
  User, Calendar, GraduationCap, School,
  Users, FileText, Loader2, Edit, AlertTriangle,
  RefreshCw, Phone, Mail, MapPin, UserCheck
} from 'lucide-react';

const InscriptionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // ============================================================
  // ÉTATS DU FORMULAIRE
  // ============================================================
  const [formData, setFormData] = useState({
    eleve: '',
    annee_scolaire: '',
    niveau: '',
    classe: '',
    date_inscription: new Date().toISOString().split('T')[0],
    date_reinscription: '',
    statut: 'inscrit',
    tarif_inscription: 0,
    tarif_mensuel: 0,
    numero_acte: '',
    observations: '',
    etablissement: null,
  });

  // ============================================================
  // ÉTATS DE L'APPLICATION
  // ============================================================
  const [eleves, setEleves] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [selectedNiveau, setSelectedNiveau] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES DE BASE
  // ============================================================
  const loadBaseData = async () => {
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      const [elevesRes, anneesRes, niveauxRes] = await Promise.all([
        axiosInstance.get('/eleves/', headers),
        axiosInstance.get('/annees-scolaires/', headers),
        axiosInstance.get('/niveaux/', headers)
      ]);

      setEleves(Array.isArray(elevesRes.data) ? elevesRes.data : []);
      setAnnees(Array.isArray(anneesRes.data) ? anneesRes.data : []);
      setNiveaux(Array.isArray(niveauxRes.data) ? niveauxRes.data : []);

      // Sélectionner l'année active par défaut
      const activeAnnee = anneesRes.data?.find(a => a.est_active);
      if (activeAnnee && !isEditMode) {
        setFormData(prev => ({ ...prev, annee_scolaire: activeAnnee.id }));
      }

      // Récupérer l'établissement de l'utilisateur
      try {
        const userRes = await axiosInstance.get('/auth/users/me/', headers);
        if (userRes.data?.etablissement) {
          setFormData(prev => ({ ...prev, etablissement: userRes.data.etablissement }));
        }
      } catch (userError) {
        console.warn('Impossible de récupérer l\'établissement de l\'utilisateur:', userError);
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('❌ Erreur chargement données de base:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Impossible de charger les données', 'error');
      }
    }
  };

  // ============================================================
  // CHARGEMENT DE L'INSCRIPTION (mode édition)
  // ============================================================
  const loadInscription = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get(`/inscriptions/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });

      const data = response.data;
      setFormData({
        eleve: data.eleve || '',
        annee_scolaire: data.annee_scolaire || '',
        niveau: data.niveau || '',
        classe: data.classe || '',
        date_inscription: data.date_inscription || new Date().toISOString().split('T')[0],
        date_reinscription: data.date_reinscription || '',
        statut: data.statut || 'inscrit',
        tarif_inscription: data.tarif_inscription || 0,
        tarif_mensuel: data.tarif_mensuel || 0,
        numero_acte: data.numero_acte || '',
        observations: data.observations || '',
        etablissement: data.etablissement || null,
      });

      // Charger les classes du niveau
      if (data.niveau) {
        await loadClassesForNiveau(data.niveau);
      }

      // Récupérer les infos de l'élève
      if (data.eleve) {
        try {
          const eleveRes = await axiosInstance.get(`/eleves/${data.eleve}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          setSelectedEleve(eleveRes.data);
        } catch (eleveError) {
          console.warn('Impossible de charger l\'élève:', eleveError);
        }
      }

    } catch (error) {
      console.error('❌ Erreur chargement inscription:', error);
      if (error.response?.status === 404) {
        showNotification('Inscription non trouvée', 'error');
        navigate('/inscriptions');
      } else {
        showNotification('Impossible de charger l\'inscription', 'error');
      }
    } finally {
      setFetching(false);
    }
  };

  // ============================================================
  // CHARGEMENT DES CLASSES PAR NIVEAU
  // ============================================================
  const loadClassesForNiveau = async (niveauId) => {
    if (!niveauId) {
      setFilteredClasses([]);
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get(`/classes/?niveau=${niveauId}`, {
        headers: { Authorization: `Token ${token}` }
      });
      setFilteredClasses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('❌ Erreur chargement classes:', error);
      setFilteredClasses([]);
    }
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES DE L'ÉLÈVE SÉLECTIONNÉ
  // ============================================================
  const loadEleveInfo = async (eleveId) => {
    if (!eleveId) {
      setSelectedEleve(null);
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get(`/eleves/${eleveId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setSelectedEleve(response.data);
    } catch (error) {
      console.warn('Impossible de charger l\'élève:', error);
      setSelectedEleve(null);
    }
  };

  // ============================================================
  // INITIALISATION
  // ============================================================
  useEffect(() => {
    const init = async () => {
      await loadBaseData();
      await loadInscription();
    };
    init();
  }, [id]);

  // ============================================================
  // EFFET : Charger les classes quand le niveau change
  // ============================================================
  useEffect(() => {
    if (formData.niveau) {
      loadClassesForNiveau(formData.niveau);
    } else {
      setFilteredClasses([]);
    }
  }, [formData.niveau]);

  // ============================================================
  // EFFET : Charger l'élève quand la sélection change
  // ============================================================
  useEffect(() => {
    if (formData.eleve) {
      loadEleveInfo(formData.eleve);
    } else {
      setSelectedEleve(null);
    }
  }, [formData.eleve]);

  // ============================================================
  // GESTION DES CHANGEMENTS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value ? parseFloat(value) : 0) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    
    if (!formData.eleve) newErrors.eleve = 'L\'élève est requis';
    if (!formData.annee_scolaire) newErrors.annee_scolaire = 'L\'année scolaire est requise';
    if (!formData.niveau) newErrors.niveau = 'Le niveau est requis';
    if (!formData.classe) newErrors.classe = 'La classe est requise';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      const payload = {
        eleve: formData.eleve,
        annee_scolaire: formData.annee_scolaire,
        niveau: formData.niveau,
        classe: formData.classe,
        date_inscription: formData.date_inscription || new Date().toISOString().split('T')[0],
        date_reinscription: formData.date_reinscription || null,
        statut: formData.statut || 'inscrit',
        tarif_inscription: formData.tarif_inscription || 0,
        tarif_mensuel: formData.tarif_mensuel || 0,
        numero_acte: formData.numero_acte || '',
        observations: formData.observations || '',
        etablissement: formData.etablissement || 1,
      };

      console.log('📤 Données envoyées:', payload);

      let response;
      if (isEditMode) {
        response = await axiosInstance.put(`/inscriptions/${id}/`, payload, headers);
        showNotification('✅ Inscription mise à jour avec succès !', 'success');
      } else {
        response = await axiosInstance.post('/inscriptions/', payload, headers);
        showNotification('✅ Inscription créée avec succès !', 'success');
      }

      // Redirection après 1.5s
      setTimeout(() => {
        navigate('/inscriptions');
      }, 1500);

    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      
      if (error.response) {
        console.error('📄 Status:', error.response.status);
        console.error('📄 Data:', error.response.data);
        
        if (error.response.status === 400) {
          // Validation errors
          const errorData = error.response.data;
          if (typeof errorData === 'object') {
            const fieldErrors = {};
            Object.keys(errorData).forEach(key => {
              const messages = Array.isArray(errorData[key]) ? errorData[key].join(' ') : errorData[key];
              fieldErrors[key] = messages;
            });
            setErrors(fieldErrors);
            showNotification('Erreur de validation : veuillez corriger les champs', 'error');
          } else {
            setErrors({ global: errorData });
            showNotification('Erreur de validation', 'error');
          }
        } else if (error.response.status === 401) {
          showNotification('Session expirée, veuillez vous reconnecter', 'error');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 403) {
          showNotification('Vous n\'avez pas la permission d\'effectuer cette action', 'error');
        } else if (error.response.status === 409) {
          showNotification('Cette inscription existe déjà pour cet élève et cette année', 'error');
        } else {
          showNotification(`Erreur serveur: ${error.response.data?.detail || 'Veuillez réessayer'}`, 'error');
        }
      } else if (error.request) {
        showNotification('⚠️ Vérifiez que le backend est démarré sur http://127.0.0.1:8000', 'error');
      } else {
        showNotification(`Erreur: ${error.message}`, 'error');
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // ============================================================
  // RENDU
  // ============================================================

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-base-content/70 animate-pulse">
            Chargement de l'inscription...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span className="font-medium text-sm">{notification.message}</span>
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
          EN-TÊTE
          ============================================================ */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/inscriptions')} 
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Edit className="w-6 h-6 text-primary" />
                    Modifier l'inscription
                  </>
                ) : (
                  <>
                    <Calendar className="w-6 h-6 text-primary" />
                    Nouvelle inscription
                  </>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode 
                  ? 'Mettez à jour les informations de l\'inscription' 
                  : 'Enregistrez une nouvelle inscription pour un élève'}
              </p>
            </div>
          </div>

          {isEditMode && (
            <div className="badge badge-primary gap-1 p-3 text-sm">
              <UserCheck className="w-4 h-4" />
              Édition en cours
            </div>
          )}
        </div>

        {/* ============================================================
            FORMULAIRE
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">

              {/* ============================================================
                  ALERTE D'ERREUR GLOBALE
                  ============================================================ */}
              {errors.global && (
                <div className="alert alert-error shadow-lg rounded-xl">
                  <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                  <span>{errors.global}</span>
                  <button 
                    className="btn btn-ghost btn-xs btn-circle" 
                    onClick={() => setErrors(prev => ({ ...prev, global: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* ============================================================
                  SECTION : ÉLÈVE
                  ============================================================ */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  Informations de l'élève
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Élève */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Élève <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="eleve"
                        value={formData.eleve}
                        onChange={handleChange}
                        className={`select select-bordered w-full pl-10 ${errors.eleve ? 'select-error' : ''}`}
                        disabled={isSubmitting}
                      >
                        <option value="">Sélectionner un élève</option>
                        {eleves.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.matricule || 'N/A'} - {e.prenom || ''} {e.nom || ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.eleve && (
                      <span className="text-error text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.eleve}
                      </span>
                    )}
                  </div>

                  {/* Année scolaire */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Année scolaire <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="annee_scolaire"
                        value={formData.annee_scolaire}
                        onChange={handleChange}
                        className={`select select-bordered w-full pl-10 ${errors.annee_scolaire ? 'select-error' : ''}`}
                        disabled={isSubmitting}
                      >
                        <option value="">Sélectionner</option>
                        {annees.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.libelle || `Année ${a.id}`} {a.est_active && '⭐'}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.annee_scolaire && (
                      <span className="text-error text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.annee_scolaire}
                      </span>
                    )}
                  </div>
                </div>

                {/* Informations de l'élève sélectionné */}
                {selectedEleve && (
                  <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {selectedEleve.prenom || ''} {selectedEleve.nom || ''}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span>Matricule: {selectedEleve.matricule || 'N/A'}</span>
                          {selectedEleve.telephone && <span>📞 {selectedEleve.telephone}</span>}
                          {selectedEleve.email && <span>✉️ {selectedEleve.email}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================
                  SECTION : SCOLAIRE
                  ============================================================ */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Informations scolaires
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Niveau */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Niveau <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="niveau"
                        value={formData.niveau}
                        onChange={handleChange}
                        className={`select select-bordered w-full pl-10 ${errors.niveau ? 'select-error' : ''}`}
                        disabled={isSubmitting}
                      >
                        <option value="">Sélectionner un niveau</option>
                        {niveaux.map(n => (
                          <option key={n.id} value={n.id}>{n.nom || `Niveau ${n.id}`}</option>
                        ))}
                      </select>
                    </div>
                    {errors.niveau && (
                      <span className="text-error text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.niveau}
                      </span>
                    )}
                  </div>

                  {/* Classe */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Classe <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="classe"
                        value={formData.classe}
                        onChange={handleChange}
                        className={`select select-bordered w-full pl-10 ${errors.classe ? 'select-error' : ''}`}
                        disabled={!formData.niveau || isSubmitting}
                      >
                        <option value="">
                          {!formData.niveau ? 'Sélectionnez un niveau d\'abord' : 'Sélectionner une classe'}
                        </option>
                        {filteredClasses.map(c => (
                          <option key={c.id} value={c.id}>{c.nom || `Classe ${c.id}`}</option>
                        ))}
                      </select>
                    </div>
                    {errors.classe && (
                      <span className="text-error text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.classe}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ============================================================
                  SECTION : DATES & STATUT
                  ============================================================ */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  Dates et statut
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date inscription */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Date d'inscription</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        name="date_inscription"
                        value={formData.date_inscription}
                        onChange={handleChange}
                        className="input input-bordered w-full pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Date réinscription */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Date de réinscription</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        name="date_reinscription"
                        value={formData.date_reinscription}
                        onChange={handleChange}
                        className="input input-bordered w-full pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Statut</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="statut"
                        value={formData.statut}
                        onChange={handleChange}
                        className="select select-bordered w-full pl-10"
                        disabled={isSubmitting}
                      >
                        <option value="inscrit">Inscrit</option>
                        <option value="reinscrit">Réinscrit</option>
                        <option value="transfert">Transfert</option>
                        <option value="abandon">Abandon</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================
                  SECTION : FINANCIER
                  ============================================================ */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  Informations financières
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tarif inscription */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Tarif d'inscription</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">FCFA</span>
                      <input
                        type="number"
                        name="tarif_inscription"
                        value={formData.tarif_inscription}
                        onChange={handleChange}
                        className="input input-bordered w-full pl-16"
                        step="100"
                        min="0"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Tarif mensuel */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Tarif mensuel</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">FCFA</span>
                      <input
                        type="number"
                        name="tarif_mensuel"
                        value={formData.tarif_mensuel}
                        onChange={handleChange}
                        className="input input-bordered w-full pl-16"
                        step="100"
                        min="0"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================
                  SECTION : INFORMATIONS COMPLÉMENTAIRES
                  ============================================================ */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  Informations complémentaires
                </h3>

                {/* Numéro d'acte */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Numéro d'acte</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="numero_acte"
                      value={formData.numero_acte}
                      onChange={handleChange}
                      className="input input-bordered w-full pl-10"
                      placeholder="Numéro de l'acte d'inscription"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Observations */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Observations</span>
                  </label>
                  <textarea
                    name="observations"
                    value={formData.observations}
                    onChange={handleChange}
                    className="textarea textarea-bordered w-full min-h-[100px]"
                    placeholder="Informations complémentaires, remarques, etc."
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* ============================================================
                  RÉSUMÉ DES CHAMPS OBLIGATOIRES
                  ============================================================ */}
              <div className="text-xs text-gray-400 flex items-center gap-2 pt-2 border-t border-gray-200">
                <span className="text-error">*</span>
                <span>Champs obligatoires</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span>{isEditMode ? 'Modifiez les champs nécessaires' : 'Remplissez tous les champs obligatoires'}</span>
              </div>
            </div>

            {/* ============================================================
                BOUTONS D'ACTION
                ============================================================ */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/inscriptions')}
                className="btn btn-ghost gap-2 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              
              <button
                type="submit"
                className={`btn gap-2 w-full sm:w-auto min-w-[160px] ${
                  isEditMode ? 'btn-primary' : 'btn-success'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditMode ? 'Mise à jour...' : 'Enregistrement...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ============================================================
            AIDE / ASTUCES
            ============================================================ */}
        <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-info/20 rounded-lg flex-shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-info" />
            </div>
            <div>
              <p className="text-sm font-semibold text-info">Conseils :</p>
              <ul className="text-xs text-info/80 mt-1 space-y-1">
                <li>• Sélectionnez d'abord l'élève, puis le niveau, puis la classe</li>
                <li>• Les tarifs sont en FCFA (Franc CFA)</li>
                <li>• Le numéro d'acte est facultatif mais recommandé</li>
                {isEditMode && <li>• Les modifications seront appliquées immédiatement</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscriptionForm;