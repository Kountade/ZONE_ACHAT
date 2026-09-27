// src/components/inscriptions/EleveForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Save, X, ArrowLeft, CheckCircle, AlertCircle,
  User, Mail, Phone, Calendar, UserPlus,
  School, Users, Heart, Activity, AlertTriangle,
  UserCheck, Briefcase, PhoneCall, Home,
  GraduationCap, Clock, Stethoscope, Droplet,
  FileText, UserRound, PhoneForwarded, Award,
  Edit, RefreshCw
} from 'lucide-react';

const EleveForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // ============================================================
  // CHAMPS DU FORMULAIRE
  // ============================================================
  const [formData, setFormData] = useState({
    // ---- 7 CHAMPS ESSENTIELS (Inscription rapide) ----
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: 'M',
    telephone: '',
    email: '',
    niveau: '',
    classe: '',
    annee_scolaire: '',
    date_inscription: new Date().toISOString().split('T')[0],
    statut: 'actif',
    
    // ---- CHAMPS SECONDAIRES (À compléter plus tard) ----
    lieu_naissance: '',
    nationalite: 'Sénégalaise',
    adresse: '',
    nom_pere: '',
    profession_pere: '',
    telephone_pere: '',
    nom_mere: '',
    profession_mere: '',
    telephone_mere: '',
    nom_tuteur: '',
    profession_tuteur: '',
    telephone_tuteur: '',
    situation_familiale: 'pere',
    groupe_sanguin: '',
    allergie: '',
    maladie: '',
    personne_a_contacter: '',
    telephone_urgence: '',
    observations: '',
    inscription_complete: false,
  });

  // ============================================================
  // ÉTATS
  // ============================================================
  const [niveaux, setNiveaux] = useState([]);
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('info');
  const [isQuickMode, setIsQuickMode] = useState(true);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES (sans préfixe api/)
  // ============================================================
  const loadData = async () => {
    try {
      const [niveauxRes, classesRes, anneesRes] = await Promise.all([
        axiosInstance.get('/niveaux/'),
        axiosInstance.get('/classes/'),
        axiosInstance.get('/annees-scolaires/')
      ]);
      setNiveaux(niveauxRes.data || []);
      setClasses(classesRes.data || []);
      setAnnees(anneesRes.data || []);
      
      if (!isEditMode) {
        const activeAnnee = anneesRes.data?.find(a => a.est_active);
        if (activeAnnee) {
          setFormData(prev => ({ ...prev, annee_scolaire: activeAnnee.id }));
        }
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      showNotification('Impossible de charger les données', 'error');
    }
  };

  const loadEleve = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/eleves/${id}/`);
      const e = response.data;
      setFormData({
        nom: e.nom || '',
        prenom: e.prenom || '',
        date_naissance: e.date_naissance || '',
        lieu_naissance: e.lieu_naissance || '',
        sexe: e.sexe || 'M',
        nationalite: e.nationalite || 'Sénégalaise',
        email: e.email || '',
        telephone: e.telephone || '',
        adresse: e.adresse || '',
        niveau: e.niveau || '',
        classe: e.classe || '',
        annee_scolaire: e.annee_scolaire || '',
        date_inscription: e.date_inscription || '',
        statut: e.statut || 'actif',
        nom_pere: e.nom_pere || '',
        profession_pere: e.profession_pere || '',
        telephone_pere: e.telephone_pere || '',
        nom_mere: e.nom_mere || '',
        profession_mere: e.profession_mere || '',
        telephone_mere: e.telephone_mere || '',
        nom_tuteur: e.nom_tuteur || '',
        profession_tuteur: e.profession_tuteur || '',
        telephone_tuteur: e.telephone_tuteur || '',
        situation_familiale: e.situation_familiale || 'pere',
        groupe_sanguin: e.groupe_sanguin || '',
        allergie: e.allergie || '',
        maladie: e.maladie || '',
        personne_a_contacter: e.personne_a_contacter || '',
        telephone_urgence: e.telephone_urgence || '',
        observations: e.observations || '',
        inscription_complete: e.inscription_complete || false,
      });
      
      if (e.inscription_complete) {
        setIsQuickMode(false);
      }
    } catch (error) {
      console.error('Erreur chargement élève:', error);
      if (error.response?.status === 404) {
        showNotification('Élève non trouvé', 'error');
        navigate('/eleves');
      } else {
        showNotification('Impossible de charger l\'élève', 'error');
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadData();
      await loadEleve();
    };
    init();
  }, [id]);

  // Charger les classes quand le niveau change
  useEffect(() => {
    if (formData.niveau) {
      axiosInstance.get(`/classes/?niveau=${formData.niveau}`)
        .then(res => setClasses(res.data || []))
        .catch(err => console.error('Erreur chargement classes:', err));
    }
  }, [formData.niveau]);

  // ============================================================
  // GESTION DES CHANGEMENTS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ============================================================
  // VALIDATIONS
  // ============================================================
  
  // Validation rapide (7 champs essentiels)
  const validateQuick = () => {
    const newErrors = {};
    if (!formData.nom?.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom?.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.date_naissance) newErrors.date_naissance = 'La date de naissance est requise';
    if (!formData.telephone?.trim()) newErrors.telephone = 'Le téléphone est requis';
    if (!formData.niveau) newErrors.niveau = 'Le niveau est requis';
    if (!formData.classe) newErrors.classe = 'La classe est requise';
    if (!formData.annee_scolaire) newErrors.annee_scolaire = 'L\'année scolaire est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation complète (tous les champs obligatoires)
  const validateComplete = () => {
    const newErrors = {};
    if (!formData.nom?.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom?.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.date_naissance) newErrors.date_naissance = 'La date de naissance est requise';
    if (!formData.telephone?.trim()) newErrors.telephone = 'Le téléphone est requis';
    if (!formData.niveau) newErrors.niveau = 'Le niveau est requis';
    if (!formData.classe) newErrors.classe = 'La classe est requise';
    if (!formData.annee_scolaire) newErrors.annee_scolaire = 'L\'année scolaire est requise';
    if (!formData.adresse?.trim()) newErrors.adresse = 'L\'adresse est requise';
    if (!formData.nom_pere?.trim()) newErrors.nom_pere = 'Le nom du père est requis';
    if (!formData.telephone_pere?.trim()) newErrors.telephone_pere = 'Le téléphone du père est requis';
    if (!formData.nom_mere?.trim()) newErrors.nom_mere = 'Le nom de la mère est requis';
    if (!formData.telephone_mere?.trim()) newErrors.telephone_mere = 'Le téléphone de la mère est requis';
    if (!formData.personne_a_contacter?.trim()) newErrors.personne_a_contacter = 'La personne à contacter est requise';
    if (!formData.telephone_urgence?.trim()) newErrors.telephone_urgence = 'Le téléphone d\'urgence est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // SOUMISSION RAPIDE - Enregistre et permet de compléter plus tard
  // ============================================================
  const handleSubmitQuick = async (e) => {
    e.preventDefault();
    if (!validateQuick()) {
      showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nom: formData.nom?.trim() || '',
        prenom: formData.prenom?.trim() || '',
        date_naissance: formData.date_naissance || null,
        lieu_naissance: formData.lieu_naissance || '',
        sexe: formData.sexe || 'M',
        nationalite: formData.nationalite || 'Sénégalaise',
        email: formData.email || '',
        telephone: formData.telephone?.trim() || '',
        adresse: formData.adresse || '',
        niveau: formData.niveau || null,
        classe: formData.classe || null,
        annee_scolaire: formData.annee_scolaire || null,
        date_inscription: formData.date_inscription || new Date().toISOString().split('T')[0],
        date_sortie: null,
        statut: formData.statut || 'actif',
        nom_pere: formData.nom_pere || '',
        profession_pere: formData.profession_pere || '',
        telephone_pere: formData.telephone_pere || '',
        nom_mere: formData.nom_mere || '',
        profession_mere: formData.profession_mere || '',
        telephone_mere: formData.telephone_mere || '',
        nom_tuteur: formData.nom_tuteur || '',
        profession_tuteur: formData.profession_tuteur || '',
        telephone_tuteur: formData.telephone_tuteur || '',
        situation_familiale: formData.situation_familiale || 'pere',
        groupe_sanguin: formData.groupe_sanguin || '',
        allergie: formData.allergie || '',
        maladie: formData.maladie || '',
        personne_a_contacter: formData.personne_a_contacter || '',
        telephone_urgence: formData.telephone_urgence || '',
        observations: formData.observations || '',
        inscription_complete: false,
        etablissement: 1, // À adapter selon votre configuration
      };

      console.log('📤 POST /eleves/', payload);

      let response;
      if (isEditMode) {
        response = await axiosInstance.put(`/eleves/${id}/`, payload);
        showNotification('✅ Élève mis à jour ! Vous pouvez continuer plus tard.', 'success');
      } else {
        response = await axiosInstance.post('/eleves/', payload);
        showNotification('✅ Inscription rapide réussie ! Complétez les informations plus tard.', 'success');
      }

      setTimeout(() => navigate(`/eleves/${response.data.id}`), 1500);
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      
      if (error.response) {
        console.error('📄 Status:', error.response.status);
        console.error('📄 Data:', error.response.data);
        
        if (error.response.status === 400) {
          const details = Object.values(error.response.data).flat().join(' ');
          setErrors({ global: details });
          showNotification('Erreur de validation : ' + details, 'error');
        } else if (error.response.status === 401) {
          showNotification('Session expirée, veuillez vous reconnecter', 'error');
        } else if (error.response.status === 403) {
          showNotification('Vous n\'avez pas la permission', 'error');
        } else {
          showNotification('Erreur serveur: ' + (error.response.data?.detail || 'Veuillez réessayer'), 'error');
        }
      } else if (error.request) {
        showNotification('⚠️ Vérifiez que le backend est démarré sur http://127.0.0.1:8000', 'error');
      } else {
        showNotification('Erreur: ' + error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SOUMISSION COMPLÈTE - Finalise l'inscription
  // ============================================================
  const handleSubmitComplete = async (e) => {
    e.preventDefault();
    if (!validateComplete()) {
      showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nom: formData.nom?.trim() || '',
        prenom: formData.prenom?.trim() || '',
        date_naissance: formData.date_naissance || null,
        lieu_naissance: formData.lieu_naissance || '',
        sexe: formData.sexe || 'M',
        nationalite: formData.nationalite || 'Sénégalaise',
        email: formData.email || '',
        telephone: formData.telephone?.trim() || '',
        adresse: formData.adresse || '',
        niveau: formData.niveau || null,
        classe: formData.classe || null,
        annee_scolaire: formData.annee_scolaire || null,
        date_inscription: formData.date_inscription || new Date().toISOString().split('T')[0],
        date_sortie: null,
        statut: formData.statut || 'actif',
        nom_pere: formData.nom_pere || '',
        profession_pere: formData.profession_pere || '',
        telephone_pere: formData.telephone_pere || '',
        nom_mere: formData.nom_mere || '',
        profession_mere: formData.profession_mere || '',
        telephone_mere: formData.telephone_mere || '',
        nom_tuteur: formData.nom_tuteur || '',
        profession_tuteur: formData.profession_tuteur || '',
        telephone_tuteur: formData.telephone_tuteur || '',
        situation_familiale: formData.situation_familiale || 'pere',
        groupe_sanguin: formData.groupe_sanguin || '',
        allergie: formData.allergie || '',
        maladie: formData.maladie || '',
        personne_a_contacter: formData.personne_a_contacter || '',
        telephone_urgence: formData.telephone_urgence || '',
        observations: formData.observations || '',
        inscription_complete: true,
        etablissement: 1, // À adapter selon votre configuration
      };

      console.log('📤 PUT /eleves/complete/', payload);

      let response;
      if (isEditMode) {
        // Utiliser l'action 'complete' pour finaliser
        response = await axiosInstance.put(`/eleves/${id}/complete/`, payload);
        showNotification('✅ Inscription complétée avec succès !', 'success');
      } else {
        response = await axiosInstance.post('/eleves/', payload);
        showNotification('✅ Inscription complétée avec succès !', 'success');
      }

      setTimeout(() => navigate('/eleves'), 1500);
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      
      if (error.response) {
        console.error('📄 Status:', error.response.status);
        console.error('📄 Data:', error.response.data);
        
        if (error.response.status === 400) {
          const details = Object.values(error.response.data).flat().join(' ');
          setErrors({ global: details });
          showNotification('Erreur de validation : ' + details, 'error');
        } else {
          showNotification('Erreur serveur: ' + (error.response.data?.detail || 'Veuillez réessayer'), 'error');
        }
      } else if (error.request) {
        showNotification('⚠️ Vérifiez que le backend est démarré sur http://127.0.0.1:8000', 'error');
      } else {
        showNotification('Erreur: ' + error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Choix du handler selon le mode
  const handleSubmit = isQuickMode ? handleSubmitQuick : handleSubmitComplete;

  // ============================================================
  // BASCULE ENTRE MODES
  // ============================================================
  const toggleMode = () => {
    setIsQuickMode(!isQuickMode);
  };

  // ============================================================
  // RENDU
  // ============================================================

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  const isComplete = formData.inscription_complete;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 w-full">
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          EN-TÊTE
          ============================================================ */}
      <div className="w-full mx-auto">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button onClick={() => navigate('/eleves')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isQuickMode ? 'bg-warning/10' : 'bg-success/10'}`}>
                {isQuickMode ? 
                  <UserPlus className="w-6 h-6 text-warning" /> : 
                  <CheckCircle className="w-6 h-6 text-success" />
                }
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {isEditMode ? (isComplete ? 'Fiche élève' : 'Compléter l\'inscription') : 'Nouvel élève'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isQuickMode 
                    ? '⚡ Inscription rapide (7 champs) - Complétez les détails plus tard'
                    : '📝 Formulaire complet - Finalisez l\'inscription'}
                </p>
              </div>
            </div>
          </div>

          {/* BOUTON BASCULE MODE */}
          {!isEditMode && (
            <button
              onClick={toggleMode}
              className={`btn gap-2 ${isQuickMode ? 'btn-outline' : 'btn-outline'}`}
            >
              {isQuickMode ? (
                <>
                  <Edit className="w-4 h-4" />
                  Mode complet
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Mode rapide
                </>
              )}
            </button>
          )}
          
          {/* INDICATEUR ÉDITION */}
          {isEditMode && !isComplete && (
            <div className="badge badge-warning gap-2 p-3 text-sm">
              <Clock className="w-4 h-4" />
              À compléter
            </div>
          )}
          
          {isEditMode && isComplete && (
            <div className="badge badge-success gap-2 p-3 text-sm">
              <CheckCircle className="w-4 h-4" />
              Inscription complète
            </div>
          )}
        </div>

        {/* ============================================================
            FORMULAIRE
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full">

          {/* BARRE DE PROGRESSION */}
          <div className="px-6 pt-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-gray-700">Progression :</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isQuickMode ? 'w-1/3 bg-warning' : 'w-full bg-success'
                  }`}
                />
              </div>
              <span className="font-medium text-gray-700">
                {isQuickMode ? '33%' : '100%'}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span className={!isQuickMode ? 'text-success font-bold' : ''}>
                ✅ Champs essentiels
              </span>
              <span className={isQuickMode ? 'text-gray-400' : 'text-success font-bold'}>
                {isQuickMode ? '⏳ Détails à compléter' : '✅ Inscription complète'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6">
              {/* ============================================================
                  MODE RAPIDE - 7 CHAMPS ESSENTIELS
                  ============================================================ */}
              {isQuickMode ? (
                <div className="space-y-4">
                  {/* Bandeau info */}
                  <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-warning">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">Inscription rapide</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Remplissez les 7 champs essentiels pour créer le compte. 
                      Vous pourrez compléter les détails plus tard.
                    </p>
                  </div>

                  {/* 7 CHAMPS ESSENTIELS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nom */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Nom <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleChange}
                          className={`input input-bordered w-full pl-10 ${errors.nom ? 'input-error' : ''}`}
                          placeholder="Nom de l'élève"
                          autoFocus
                        />
                      </div>
                      {errors.nom && <span className="text-error text-xs mt-1">{errors.nom}</span>}
                    </div>

                    {/* Prénom */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Prénom <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleChange}
                          className={`input input-bordered w-full pl-10 ${errors.prenom ? 'input-error' : ''}`}
                          placeholder="Prénom de l'élève"
                        />
                      </div>
                      {errors.prenom && <span className="text-error text-xs mt-1">{errors.prenom}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date naissance */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Date de naissance <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          name="date_naissance"
                          value={formData.date_naissance}
                          onChange={handleChange}
                          className={`input input-bordered w-full pl-10 ${errors.date_naissance ? 'input-error' : ''}`}
                        />
                      </div>
                      {errors.date_naissance && <span className="text-error text-xs mt-1">{errors.date_naissance}</span>}
                    </div>

                    {/* Sexe */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Sexe</span>
                      </label>
                      <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          name="sexe"
                          value={formData.sexe}
                          onChange={handleChange}
                          className="select select-bordered w-full pl-10"
                        >
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Téléphone */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Téléphone <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleChange}
                          className={`input input-bordered w-full pl-10 ${errors.telephone ? 'input-error' : ''}`}
                          placeholder="+221 77 123 45 67"
                        />
                      </div>
                      {errors.telephone && <span className="text-error text-xs mt-1">{errors.telephone}</span>}
                    </div>

                    {/* Email */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Email</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="input input-bordered w-full pl-10"
                          placeholder="email@exemple.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          className={`select select-bordered w-full pl-10 ${errors.niveau ? 'input-error' : ''}`}
                        >
                          <option value="">Sélectionner</option>
                          {niveaux.map(n => (
                            <option key={n.id} value={n.id}>{n.nom}</option>
                          ))}
                        </select>
                      </div>
                      {errors.niveau && <span className="text-error text-xs mt-1">{errors.niveau}</span>}
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
                          className={`select select-bordered w-full pl-10 ${errors.classe ? 'input-error' : ''}`}
                        >
                          <option value="">Sélectionner</option>
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.nom}</option>
                          ))}
                        </select>
                      </div>
                      {errors.classe && <span className="text-error text-xs mt-1">{errors.classe}</span>}
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
                          className={`select select-bordered w-full pl-10 ${errors.annee_scolaire ? 'input-error' : ''}`}
                        >
                          <option value="">Sélectionner</option>
                          {annees.map(a => (
                            <option key={a.id} value={a.id}>{a.libelle} {a.est_active && '⭐'}</option>
                          ))}
                        </select>
                      </div>
                      {errors.annee_scolaire && <span className="text-error text-xs mt-1">{errors.annee_scolaire}</span>}
                    </div>
                  </div>

                  {/* Date inscription cachée mais présente */}
                  <input type="hidden" name="date_inscription" value={formData.date_inscription} />
                </div>
              ) : (
                // ============================================================
                // MODE COMPLET - TOUS LES CHAMPS
                // ============================================================
                <div className="space-y-4">
                  {/* Bandeau info */}
                  <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Mode complet</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Complétez toutes les informations pour finaliser l'inscription.
                    </p>
                  </div>

                  {/* TABS */}
                  <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
                      {[
                        { id: 'info', label: 'Informations', icon: User },
                        { id: 'parents', label: 'Parents', icon: Users },
                        { id: 'medical', label: 'Médical', icon: Heart },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === tab.id
                              ? 'border-primary text-primary font-semibold'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    {/* TAB INFORMATIONS */}
                    {activeTab === 'info' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="form-control">
                            <label className="label"><span className="label-text font-semibold">Nom <span className="text-error">*</span></span></label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input type="text" name="nom" value={formData.nom} onChange={handleChange}
                                className={`input input-bordered w-full pl-10 ${errors.nom ? 'input-error' : ''}`}
                                placeholder="Nom de l'élève" />
                            </div>
                            {errors.nom && <span className="text-error text-xs mt-1">{errors.nom}</span>}
                          </div>
                          <div className="form-control">
                            <label className="label"><span className="label-text font-semibold">Prénom <span className="text-error">*</span></span></label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange}
                                className={`input input-bordered w-full pl-10 ${errors.prenom ? 'input-error' : ''}`}
                                placeholder="Prénom de l'élève" />
                            </div>
                            {errors.prenom && <span className="text-error text-xs mt-1">{errors.prenom}</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="form-control">
                            <label className="label"><span className="label-text font-semibold">Date de naissance <span className="text-error">*</span></span></label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input type="date" name="date_naissance" value={formData.date_naissance} onChange={handleChange}
                                className={`input input-bordered w-full pl-10 ${errors.date_naissance ? 'input-error' : ''}`} />
                            </div>
                            {errors.date_naissance && <span className="text-error text-xs mt-1">{errors.date_naissance}</span>}
                          </div>
                          <div className="form-control">
                            <label className="label"><span className="label-text">Lieu de naissance</span></label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input type="text" name="lieu_naissance" value={formData.lieu_naissance} onChange={handleChange}
                                className="input input-bordered w-full pl-10" placeholder="Ville de naissance" />
                            </div>
                          </div>
                          <div className="form-control">
                            <label className="label"><span className="label-text">Sexe</span></label>
                            <div className="relative">
                              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select name="sexe" value={formData.sexe} onChange={handleChange}
                                className="select select-bordered w-full pl-10">
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="form-control">
                            <label className="label"><span className="label-text">Email</span></label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input type="email" name="email" value={formData.email} onChange={handleChange}
                                className="input input-bordered w-full pl-10" placeholder="email@exemple.com" />
                            </div>
                          </div>
                          <div className="form-control">
                            <label className="label"><span className="label-text font-semibold">Téléphone <span className="text-error">*</span></span></label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input type="text" name="telephone" value={formData.telephone} onChange={handleChange}
                                className={`input input-bordered w-full pl-10 ${errors.telephone ? 'input-error' : ''}`}
                                placeholder="+221 77 123 45 67" />
                            </div>
                            {errors.telephone && <span className="text-error text-xs mt-1">{errors.telephone}</span>}
                          </div>
                          <div className="form-control">
                            <label className="label"><span className="label-text">Nationalité</span></label>
                            <div className="relative">
                              <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input type="text" name="nationalite" value={formData.nationalite} onChange={handleChange}
                                className="input input-bordered w-full pl-10" />
                            </div>
                          </div>
                        </div>

                        <div className="form-control">
                          <label className="label"><span className="label-text font-semibold">Adresse <span className="text-error">*</span></span></label>
                          <div className="relative">
                            <Home className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea name="adresse" value={formData.adresse} onChange={handleChange}
                              className={`textarea textarea-bordered w-full pl-10 ${errors.adresse ? 'textarea-error' : ''}`}
                              rows="2" placeholder="Adresse complète" />
                          </div>
                          {errors.adresse && <span className="text-error text-xs mt-1">{errors.adresse}</span>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="form-control">
                            <label className="label"><span className="label-text font-semibold">Niveau <span className="text-error">*</span></span></label>
                            <div className="relative">
                              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select name="niveau" value={formData.niveau} onChange={handleChange}
                                className={`select select-bordered w-full pl-10 ${errors.niveau ? 'input-error' : ''}`}>
                                <option value="">Sélectionner</option>
                                {niveaux.map(n => (
                                  <option key={n.id} value={n.id}>{n.nom}</option>
                                ))}
                              </select>
                            </div>
                            {errors.niveau && <span className="text-error text-xs mt-1">{errors.niveau}</span>}
                          </div>
                          <div className="form-control">
                            <label className="label"><span className="label-text font-semibold">Classe <span className="text-error">*</span></span></label>
                            <div className="relative">
                              <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select name="classe" value={formData.classe} onChange={handleChange}
                                className={`select select-bordered w-full pl-10 ${errors.classe ? 'input-error' : ''}`}>
                                <option value="">Sélectionner</option>
                                {classes.map(c => (
                                  <option key={c.id} value={c.id}>{c.nom}</option>
                                ))}
                              </select>
                            </div>
                            {errors.classe && <span className="text-error text-xs mt-1">{errors.classe}</span>}
                          </div>
                          <div className="form-control">
                            <label className="label"><span className="label-text font-semibold">Année scolaire <span className="text-error">*</span></span></label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select name="annee_scolaire" value={formData.annee_scolaire} onChange={handleChange}
                                className={`select select-bordered w-full pl-10 ${errors.annee_scolaire ? 'input-error' : ''}`}>
                                <option value="">Sélectionner</option>
                                {annees.map(a => (
                                  <option key={a.id} value={a.id}>{a.libelle} {a.est_active && '⭐'}</option>
                                ))}
                              </select>
                            </div>
                            {errors.annee_scolaire && <span className="text-error text-xs mt-1">{errors.annee_scolaire}</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="form-control">
                            <label className="label"><span className="label-text">Date d'inscription</span></label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input type="date" name="date_inscription" value={formData.date_inscription} onChange={handleChange}
                                className="input input-bordered w-full pl-10" />
                            </div>
                          </div>
                          <div className="form-control">
                            <label className="label"><span className="label-text">Statut</span></label>
                            <div className="relative">
                              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select name="statut" value={formData.statut} onChange={handleChange}
                                className="select select-bordered w-full pl-10">
                                <option value="actif">Actif</option>
                                <option value="suspendu">Suspendu</option>
                                <option value="exclu">Exclu</option>
                                <option value="transfere">Transféré</option>
                                <option value="diplome">Diplômé</option>
                                <option value="abandon">Abandon</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB PARENTS */}
                    {activeTab === 'parents' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="form-control">
                            <label className="label"><span className="label-text">Situation familiale</span></label>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select name="situation_familiale" value={formData.situation_familiale} onChange={handleChange}
                                className="select select-bordered w-full pl-10">
                                <option value="pere">Père</option>
                                <option value="mere">Mère</option>
                                <option value="tuteur">Tuteur</option>
                                <option value="autre">Autre</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Père */}
                        <div className="border-t border-gray-200 pt-4">
                          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" /> Père
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-control">
                              <label className="label"><span className="label-text font-semibold">Nom <span className="text-error">*</span></span></label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="nom_pere" value={formData.nom_pere} onChange={handleChange}
                                  className={`input input-bordered w-full pl-10 ${errors.nom_pere ? 'input-error' : ''}`}
                                  placeholder="Nom du père" />
                              </div>
                              {errors.nom_pere && <span className="text-error text-xs mt-1">{errors.nom_pere}</span>}
                            </div>
                            <div className="form-control">
                              <label className="label"><span className="label-text">Profession</span></label>
                              <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="profession_pere" value={formData.profession_pere} onChange={handleChange}
                                  className="input input-bordered w-full pl-10" placeholder="Profession" />
                              </div>
                            </div>
                            <div className="form-control">
                              <label className="label"><span className="label-text font-semibold">Téléphone <span className="text-error">*</span></span></label>
                              <div className="relative">
                                <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="telephone_pere" value={formData.telephone_pere} onChange={handleChange}
                                  className={`input input-bordered w-full pl-10 ${errors.telephone_pere ? 'input-error' : ''}`}
                                  placeholder="+221 77 123 45 67" />
                              </div>
                              {errors.telephone_pere && <span className="text-error text-xs mt-1">{errors.telephone_pere}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Mère */}
                        <div className="border-t border-gray-200 pt-4">
                          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-secondary" /> Mère
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-control">
                              <label className="label"><span className="label-text font-semibold">Nom <span className="text-error">*</span></span></label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="nom_mere" value={formData.nom_mere} onChange={handleChange}
                                  className={`input input-bordered w-full pl-10 ${errors.nom_mere ? 'input-error' : ''}`}
                                  placeholder="Nom de la mère" />
                              </div>
                              {errors.nom_mere && <span className="text-error text-xs mt-1">{errors.nom_mere}</span>}
                            </div>
                            <div className="form-control">
                              <label className="label"><span className="label-text">Profession</span></label>
                              <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="profession_mere" value={formData.profession_mere} onChange={handleChange}
                                  className="input input-bordered w-full pl-10" placeholder="Profession" />
                              </div>
                            </div>
                            <div className="form-control">
                              <label className="label"><span className="label-text font-semibold">Téléphone <span className="text-error">*</span></span></label>
                              <div className="relative">
                                <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="telephone_mere" value={formData.telephone_mere} onChange={handleChange}
                                  className={`input input-bordered w-full pl-10 ${errors.telephone_mere ? 'input-error' : ''}`}
                                  placeholder="+221 77 123 45 67" />
                              </div>
                              {errors.telephone_mere && <span className="text-error text-xs mt-1">{errors.telephone_mere}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Tuteur */}
                        <div className="border-t border-gray-200 pt-4">
                          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-accent" /> Tuteur
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-control">
                              <label className="label"><span className="label-text">Nom</span></label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="nom_tuteur" value={formData.nom_tuteur} onChange={handleChange}
                                  className="input input-bordered w-full pl-10" placeholder="Nom du tuteur" />
                              </div>
                            </div>
                            <div className="form-control">
                              <label className="label"><span className="label-text">Profession</span></label>
                              <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="profession_tuteur" value={formData.profession_tuteur} onChange={handleChange}
                                  className="input input-bordered w-full pl-10" placeholder="Profession" />
                              </div>
                            </div>
                            <div className="form-control">
                              <label className="label"><span className="label-text">Téléphone</span></label>
                              <div className="relative">
                                <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="telephone_tuteur" value={formData.telephone_tuteur} onChange={handleChange}
                                  className="input input-bordered w-full pl-10" placeholder="+221 77 123 45 67" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contact d'urgence */}
                        <div className="border-t border-gray-200 pt-4">
                          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <PhoneForwarded className="w-5 h-5 text-info" /> Contact d'urgence
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                              <label className="label"><span className="label-text font-semibold">Personne à contacter <span className="text-error">*</span></span></label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="personne_a_contacter" value={formData.personne_a_contacter} onChange={handleChange}
                                  className={`input input-bordered w-full pl-10 ${errors.personne_a_contacter ? 'input-error' : ''}`}
                                  placeholder="Nom et prénom" />
                              </div>
                              {errors.personne_a_contacter && <span className="text-error text-xs mt-1">{errors.personne_a_contacter}</span>}
                            </div>
                            <div className="form-control">
                              <label className="label"><span className="label-text font-semibold">Téléphone d'urgence <span className="text-error">*</span></span></label>
                              <div className="relative">
                                <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" name="telephone_urgence" value={formData.telephone_urgence} onChange={handleChange}
                                  className={`input input-bordered w-full pl-10 ${errors.telephone_urgence ? 'input-error' : ''}`}
                                  placeholder="+221 77 123 45 67" />
                              </div>
                              {errors.telephone_urgence && <span className="text-error text-xs mt-1">{errors.telephone_urgence}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB MÉDICAL */}
                    {activeTab === 'medical' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="form-control">
                            <label className="label"><span className="label-text">Groupe sanguin</span></label>
                            <div className="relative">
                              <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select name="groupe_sanguin" value={formData.groupe_sanguin} onChange={handleChange}
                                className="select select-bordered w-full pl-10">
                                <option value="">Non spécifié</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="form-control">
                          <label className="label"><span className="label-text flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-warning" /> Allergies
                          </span></label>
                          <div className="relative">
                            <AlertTriangle className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea name="allergie" value={formData.allergie} onChange={handleChange}
                              className="textarea textarea-bordered w-full pl-10" rows="2"
                              placeholder="Liste des allergies connues..." />
                          </div>
                        </div>

                        <div className="form-control">
                          <label className="label"><span className="label-text flex items-center gap-2">
                            <Activity className="w-4 h-4 text-error" /> Maladies chroniques
                          </span></label>
                          <div className="relative">
                            <Stethoscope className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea name="maladie" value={formData.maladie} onChange={handleChange}
                              className="textarea textarea-bordered w-full pl-10" rows="2"
                              placeholder="Maladies chroniques, traitements en cours..." />
                          </div>
                        </div>

                        <div className="form-control">
                          <label className="label"><span className="label-text flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" /> Observations générales
                          </span></label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea name="observations" value={formData.observations} onChange={handleChange}
                              className="textarea textarea-bordered w-full pl-10" rows="3"
                              placeholder="Informations complémentaires..." />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================
                  ERREURS GLOBALES
                  ============================================================ */}
              {errors.global && (
                <div className="alert alert-error shadow-lg mt-4">
                  <AlertCircle className="w-6 h-6" />
                  <span>{errors.global}</span>
                </div>
              )}
            </div>

            {/* ============================================================
                BOUTONS D'ACTION
                ============================================================ */}
            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/eleves')}
                className="btn btn-ghost gap-2"
                disabled={loading}
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="submit"
                className={`btn gap-2 min-w-[140px] ${
                  isQuickMode ? 'btn-warning' : 'btn-success'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {isEditMode ? 'Mise à jour...' : 'Enregistrement...'}
                  </>
                ) : (
                  <>
                    {isQuickMode ? (
                      <>
                        <Save className="w-4 h-4" />
                        Enregistrer et continuer
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Finaliser l'inscription
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ============================================================
            INFO - MODE RAPIDE
            ============================================================ */}
        {isQuickMode && !isEditMode && (
          <div className="mt-4 p-4 bg-warning/10 rounded-xl border border-warning/20">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-warning/20 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold text-warning">Inscription en cours</p>
                <p className="text-xs text-warning/80 mt-1">
                  L'élève a été enregistré avec succès. Vous pouvez maintenant compléter les informations
                  manquantes en cliquant sur "Modifier" depuis la liste des élèves.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            INFO - MODE COMPLET
            ============================================================ */}
        {!isQuickMode && !isEditMode && (
          <div className="mt-4 p-4 bg-success/10 rounded-xl border border-success/20">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-success/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-success">Inscription complète</p>
                <p className="text-xs text-success/80 mt-1">
                  Toutes les informations sont renseignées. L'inscription est terminée !
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EleveForm;