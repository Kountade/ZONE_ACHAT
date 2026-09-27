// src/components/gestion/GestionCoursForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Save, X, Calendar, RefreshCw, ArrowLeft,
  CheckCircle, AlertCircle, BookOpen, User,
  Clock, MapPin, GraduationCap, School,
  Repeat, CalendarDays, Clock3, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const GestionCoursForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    matiere: '',
    enseignant: '',
    classe: '',
    salle: '',
    annee_scolaire: '',
    jour: 'lundi',
    heure_debut: '08:00',
    heure_fin: '09:00',
    type_cours: 'cours',
    est_recurrent: true,
    date_specifique: '',
    semaines: [],
    raison_ajustement: ''
  });

  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [classes, setClasses] = useState([]);
  const [salles, setSalles] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [conflits, setConflits] = useState({ salle: [], enseignant: [] });
  const [verifierConflits, setVerifierConflits] = useState(false);

  const JOURS = [
    { value: 'lundi', label: 'Lundi' },
    { value: 'mardi', label: 'Mardi' },
    { value: 'mercredi', label: 'Mercredi' },
    { value: 'jeudi', label: 'Jeudi' },
    { value: 'vendredi', label: 'Vendredi' },
    { value: 'samedi', label: 'Samedi' },
  ];

  const TYPES_COURS = [
    { value: 'cours', label: 'Cours magistral' },
    { value: 'td', label: 'Travaux dirigés' },
    { value: 'tp', label: 'Travaux pratiques' },
  ];

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Charger les données initiales
  const loadData = async () => {
    try {
      const [
        matieresRes,
        enseignantsRes,
        classesRes,
        sallesRes,
        anneesRes
      ] = await Promise.all([
        axiosInstance.get('/matieres/'),
        axiosInstance.get('/professeurs/'),
        axiosInstance.get('/classes/'),
        axiosInstance.get('/salles/'),
        axiosInstance.get('/annees-scolaires/')
      ]);

      setMatieres(Array.isArray(matieresRes.data) ? matieresRes.data : []);
      setEnseignants(Array.isArray(enseignantsRes.data) ? enseignantsRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setSalles(Array.isArray(sallesRes.data) ? sallesRes.data : []);
      setAnnees(Array.isArray(anneesRes.data) ? anneesRes.data : []);

      // Si année active, la sélectionner par défaut
      const activeAnnee = anneesRes.data?.find(a => a.est_active);
      if (activeAnnee && !isEditMode) {
        setFormData(prev => ({ ...prev, annee_scolaire: activeAnnee.id }));
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      showNotification('Impossible de charger les données', 'error');
    }
  };

  // Charger un cours existant
  const loadCours = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/cours/${id}/`);
      const cours = response.data;
      setFormData({
        matiere: cours.matiere || '',
        enseignant: cours.enseignant || '',
        classe: cours.classe || '',
        salle: cours.salle || '',
        annee_scolaire: cours.annee_scolaire || '',
        jour: cours.jour || 'lundi',
        heure_debut: cours.heure_debut || '08:00',
        heure_fin: cours.heure_fin || '09:00',
        type_cours: cours.type_cours || 'cours',
        est_recurrent: cours.est_recurrent !== undefined ? cours.est_recurrent : true,
        date_specifique: cours.date_specifique || '',
        semaines: cours.semaines || [],
        raison_ajustement: cours.raison_ajustement || ''
      });
    } catch (error) {
      console.error('Erreur chargement cours:', error);
      if (error.response?.status === 404) {
        showNotification('Cours non trouvé', 'error');
        navigate('/cours');
      } else {
        showNotification('Impossible de charger le cours', 'error');
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadData();
      await loadCours();
    };
    init();
  }, [id]);

  // Vérification des conflits
  const checkConflits = async () => {
    if (!formData.jour || !formData.heure_debut || !formData.heure_fin) return;

    try {
      const params = new URLSearchParams({
        jour: formData.jour,
        heure_debut: formData.heure_debut,
        heure_fin: formData.heure_fin,
        date: formData.est_recurrent ? '' : formData.date_specifique
      });

      if (formData.salle) params.append('salle', formData.salle);
      if (formData.enseignant) params.append('enseignant', formData.enseignant);

      const response = await axiosInstance.get(`/cours/conflits/?${params.toString()}`);
      setConflits(response.data);
    } catch (error) {
      console.error('Erreur vérification conflits:', error);
    }
  };

  useEffect(() => {
    if (verifierConflits) {
      checkConflits();
    }
  }, [formData.jour, formData.heure_debut, formData.heure_fin, formData.salle, formData.enseignant]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setVerifierConflits(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.matiere) newErrors.matiere = 'La matière est requise';
    if (!formData.enseignant) newErrors.enseignant = 'L\'enseignant est requis';
    if (!formData.classe) newErrors.classe = 'La classe est requise';
    if (!formData.salle) newErrors.salle = 'La salle est requise';
    if (!formData.annee_scolaire) newErrors.annee_scolaire = 'L\'année scolaire est requise';
    if (!formData.jour) newErrors.jour = 'Le jour est requis';
    if (!formData.heure_debut) newErrors.heure_debut = 'L\'heure de début est requise';
    if (!formData.heure_fin) newErrors.heure_fin = 'L\'heure de fin est requise';
    
    if (formData.heure_debut && formData.heure_fin && formData.heure_debut >= formData.heure_fin) {
      newErrors.heure_fin = 'L\'heure de fin doit être après l\'heure de début';
    }

    if (!formData.est_recurrent && !formData.date_specifique) {
      newErrors.date_specifique = 'La date spécifique est requise pour un cours non récurrent';
    }

    // Vérifier les conflits
    if (conflits.nb_conflits_salle > 0) {
      newErrors.salle = 'Cette salle est déjà occupée à ce créneau';
    }
    if (conflits.nb_conflits_enseignant > 0) {
      newErrors.enseignant = 'Cet enseignant est déjà occupé à ce créneau';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showNotification('Veuillez corriger les erreurs', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        matiere: parseInt(formData.matiere),
        enseignant: parseInt(formData.enseignant),
        classe: parseInt(formData.classe),
        salle: parseInt(formData.salle),
        annee_scolaire: parseInt(formData.annee_scolaire),
        jour: formData.jour,
        heure_debut: formData.heure_debut,
        heure_fin: formData.heure_fin,
        type_cours: formData.type_cours,
        est_recurrent: formData.est_recurrent,
        date_specifique: formData.est_recurrent ? null : formData.date_specifique,
        semaines: formData.semaines || [],
        raison_ajustement: formData.raison_ajustement || ''
      };

      if (isEditMode) {
        await axiosInstance.put(`/cours/${id}/`, payload);
        showNotification('Cours modifié avec succès', 'success');
      } else {
        await axiosInstance.post('/cours/', payload);
        showNotification('Cours créé avec succès', 'success');
      }

      setTimeout(() => navigate('/cours'), 1500);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      if (error.response?.status === 400) {
        const details = Object.values(error.response.data).flat().join(' ');
        setErrors({ global: details });
        showNotification('Erreur de validation : ' + details, 'error');
      } else if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission', 'error');
      } else if (error.response?.status === 409) {
        showNotification('Conflit de planning : cette salle ou cet enseignant est déjà occupé à ce créneau', 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 w-full">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full mx-auto">
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/cours')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {isEditMode ? 'Modifier le cours' : 'Nouveau cours'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-1">
              {isEditMode ? 'Modifiez les informations du cours' : 'Planifiez un nouveau cours'}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Erreur globale */}
              {errors.global && (
                <div className="alert alert-error shadow-lg">
                  <AlertCircle className="w-6 h-6" />
                  <span>{errors.global}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matière */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Matière <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="matiere"
                      value={formData.matiere}
                      onChange={handleChange}
                      className={`select select-bordered w-full pl-10 ${errors.matiere ? 'input-error' : ''}`}
                    >
                      <option value="">Sélectionner une matière</option>
                      {matieres.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nom} ({m.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.matiere && <span className="text-error text-xs mt-1">{errors.matiere}</span>}
                </div>

                {/* Enseignant */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Enseignant <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="enseignant"
                      value={formData.enseignant}
                      onChange={handleChange}
                      className={`select select-bordered w-full pl-10 ${errors.enseignant ? 'input-error' : ''}`}
                    >
                      <option value="">Sélectionner un enseignant</option>
                      {enseignants.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.nom_complet || `${e.prenom} ${e.nom}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.enseignant && <span className="text-error text-xs mt-1">{errors.enseignant}</span>}
                  {conflits.nb_conflits_enseignant > 0 && (
                    <span className="text-warning text-xs mt-1">
                      ⚠️ {conflits.nb_conflits_enseignant} conflit(s) trouvé(s) pour cet enseignant
                    </span>
                  )}
                </div>

                {/* Classe */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Classe <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="classe"
                      value={formData.classe}
                      onChange={handleChange}
                      className={`select select-bordered w-full pl-10 ${errors.classe ? 'input-error' : ''}`}
                    >
                      <option value="">Sélectionner une classe</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.classe && <span className="text-error text-xs mt-1">{errors.classe}</span>}
                </div>

                {/* Salle */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Salle <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="salle"
                      value={formData.salle}
                      onChange={handleChange}
                      className={`select select-bordered w-full pl-10 ${errors.salle ? 'input-error' : ''}`}
                    >
                      <option value="">Sélectionner une salle</option>
                      {salles.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nom} (Capacité: {s.capacite})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.salle && <span className="text-error text-xs mt-1">{errors.salle}</span>}
                  {conflits.nb_conflits_salle > 0 && (
                    <span className="text-warning text-xs mt-1">
                      ⚠️ {conflits.nb_conflits_salle} conflit(s) trouvé(s) pour cette salle
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Jour */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Jour <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="jour"
                      value={formData.jour}
                      onChange={handleChange}
                      className={`select select-bordered w-full pl-10 ${errors.jour ? 'input-error' : ''}`}
                    >
                      {JOURS.map(j => (
                        <option key={j.value} value={j.value}>{j.label}</option>
                      ))}
                    </select>
                  </div>
                  {errors.jour && <span className="text-error text-xs mt-1">{errors.jour}</span>}
                </div>

                {/* Heure début */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Heure début <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      name="heure_debut"
                      value={formData.heure_debut}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-10 ${errors.heure_debut ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors.heure_debut && <span className="text-error text-xs mt-1">{errors.heure_debut}</span>}
                </div>

                {/* Heure fin */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Heure fin <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      name="heure_fin"
                      value={formData.heure_fin}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-10 ${errors.heure_fin ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors.heure_fin && <span className="text-error text-xs mt-1">{errors.heure_fin}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type de cours */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Type de cours
                    </span>
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="type_cours"
                      value={formData.type_cours}
                      onChange={handleChange}
                      className="select select-bordered w-full pl-10"
                    >
                      {TYPES_COURS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Année scolaire */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Année scolaire <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="annee_scolaire"
                      value={formData.annee_scolaire}
                      onChange={handleChange}
                      className={`select select-bordered w-full pl-10 ${errors.annee_scolaire ? 'input-error' : ''}`}
                    >
                      <option value="">Sélectionner une année</option>
                      {annees.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.libelle} {a.est_active && '⭐ (Active)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.annee_scolaire && <span className="text-error text-xs mt-1">{errors.annee_scolaire}</span>}
                </div>
              </div>

              {/* Récurrence */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    name="est_recurrent"
                    checked={formData.est_recurrent}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    Cours récurrent (chaque semaine)
                  </span>
                </label>
              </div>

              {/* Date spécifique (si non récurrent) */}
              {!formData.est_recurrent && (
                <div className="form-control animate-fadeIn">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Date spécifique <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      name="date_specifique"
                      value={formData.date_specifique}
                      onChange={handleChange}
                      className={`input input-bordered w-full pl-10 ${errors.date_specifique ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors.date_specifique && <span className="text-error text-xs mt-1">{errors.date_specifique}</span>}
                  <span className="text-xs text-gray-400 mt-1">Date précise du cours (utilisé si le cours n'est pas récurrent)</span>
                </div>
              )}

              {/* Raison d'ajustement */}
              {isEditMode && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">
                      Raison de l'ajustement
                    </span>
                  </label>
                  <textarea
                    name="raison_ajustement"
                    value={formData.raison_ajustement}
                    onChange={handleChange}
                    className="textarea textarea-bordered w-full"
                    placeholder="Si vous modifiez un cours récurrent, indiquez la raison..."
                    rows="2"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/cours')}
                className="btn btn-ghost gap-2"
                disabled={loading}
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 min-w-[120px]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {isEditMode ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'Modifier' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information supplémentaire pour l'édition */}
        {isEditMode && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Information</p>
                <p className="text-xs text-blue-600 mt-1">
                  La modification d'un cours peut affecter l'emploi du temps des enseignants, classes et salles.
                  Vérifiez les conflits de planning avant de valider.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Légende */}
        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500">
            <span className="text-error">*</span> Champs obligatoires
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GestionCoursForm;