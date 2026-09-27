// src/components/absences/AbsenceProfesseurForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  User,
  Calendar,
  Clock,
  FileText,
  UserCog,
  RefreshCw,
  Filter,
  BookOpen,
  UserCheck,
  School,
  Layers
} from 'lucide-react';

const AbsenceProfesseurForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Données
  const [professeurs, setProfesseurs] = useState([]);
  const [typesAbsence, setTypesAbsence] = useState([]);
  const [tousLesCours, setTousLesCours] = useState([]);
  const [coursByClasse, setCoursByClasse] = useState([]);
  const [classes, setClasses] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [classesByNiveau, setClassesByNiveau] = useState([]);
  const [professeurRemplacant, setProfesseurRemplacant] = useState([]);

  // Filtres
  const [niveauId, setNiveauId] = useState('');
  const [classeId, setClasseId] = useState('');

  // Formulaire
  const [formData, setFormData] = useState({
    professeur: '',
    date_absence: new Date().toISOString().split('T')[0],
    heure_debut: '',
    heure_fin: '',
    type_absence: '',
    statut: 'en_attente',
    motif: '',
    est_remplace: false,
    professeur_remplacant: '',
    cours_concernes: []
  });

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showMessage = (texte, type = 'success') => {
    setMessage(texte);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
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

        // 1. Charger les niveaux
        try {
          const niveauxRes = await axiosInstance.get('/niveaux/', headers);
          let niveauxData = [];
          if (Array.isArray(niveauxRes.data)) {
            niveauxData = niveauxRes.data;
          } else if (niveauxRes.data?.results) {
            niveauxData = niveauxRes.data.results;
          }
          setNiveaux(niveauxData);
        } catch (e) {
          console.warn('Impossible de charger les niveaux:', e);
        }

        // 2. Charger les classes
        try {
          const classesRes = await axiosInstance.get('/classes/?actif=true', headers);
          let classesData = [];
          if (Array.isArray(classesRes.data)) {
            classesData = classesRes.data;
          } else if (classesRes.data?.results) {
            classesData = classesRes.data.results;
          }
          setClasses(classesData);
        } catch (e) {
          console.warn('Impossible de charger les classes:', e);
        }

        // 3. Charger les professeurs
        try {
          const profRes = await axiosInstance.get('/professeurs/?est_actif=true', headers);
          let profData = [];
          if (Array.isArray(profRes.data)) {
            profData = profRes.data;
          } else if (profRes.data?.results) {
            profData = profRes.data.results;
          }
          setProfesseurs(profData);
          setProfesseurRemplacant(profData);
        } catch (e) {
          console.warn('Impossible de charger les professeurs:', e);
        }

        // 4. Charger les types d'absence
        try {
          const typesRes = await axiosInstance.get('/types-absence/?est_actif=true', headers);
          let typesData = [];
          if (Array.isArray(typesRes.data)) {
            typesData = typesRes.data;
          } else if (typesRes.data?.results) {
            typesData = typesRes.data.results;
          }
          setTypesAbsence(typesData);
        } catch (e) {
          console.warn('Impossible de charger les types d\'absence:', e);
        }

        // 5. Charger TOUS les cours
        try {
          const coursRes = await axiosInstance.get('/cours/', headers);
          let coursData = [];
          if (Array.isArray(coursRes.data)) {
            coursData = coursRes.data;
          } else if (coursRes.data?.results) {
            coursData = coursRes.data.results;
          }
          setTousLesCours(coursData);
        } catch (e) {
          console.warn('Impossible de charger les cours:', e);
        }

        // 6. Si édition, charger l'absence
        if (id) {
          try {
            const absenceRes = await axiosInstance.get(`/absences-professeurs/${id}/`, headers);
            const data = absenceRes.data;
            setFormData({
              professeur: data.professeur || '',
              date_absence: data.date_absence || '',
              heure_debut: data.heure_debut || '',
              heure_fin: data.heure_fin || '',
              type_absence: data.type_absence || '',
              statut: data.statut || 'en_attente',
              motif: data.motif || '',
              est_remplace: data.est_remplace || false,
              professeur_remplacant: data.professeur_remplacant || '',
              cours_concernes: data.cours_concernes || []
            });

            // Charger la classe du cours si des cours sont sélectionnés
            if (data.cours_concernes && data.cours_concernes.length > 0) {
              const premierCours = data.cours_concernes[0];
              const coursDetail = await axiosInstance.get(`/cours/${premierCours}/`, headers);
              if (coursDetail.data && coursDetail.data.classe) {
                const classeDetail = await axiosInstance.get(`/classes/${coursDetail.data.classe}/`, headers);
                if (classeDetail.data && classeDetail.data.niveau) {
                  setNiveauId(classeDetail.data.niveau);
                  await loadClassesByNiveau(classeDetail.data.niveau);
                  setClasseId(coursDetail.data.classe);
                  await loadCoursByClasse(coursDetail.data.classe);
                }
              }
            }
          } catch (e) {
            console.warn('Impossible de charger l\'absence:', e);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur de chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // ============================================================
  // CHARGEMENT DES CLASSES PAR NIVEAU
  // ============================================================
  const loadClassesByNiveau = async (niveauId) => {
    if (!niveauId) {
      setClassesByNiveau([]);
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(`/classes/?niveau=${niveauId}&actif=true`, headers);
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }
      setClassesByNiveau(data);
    } catch (err) {
      console.error('Erreur chargement classes par niveau:', err);
      setClassesByNiveau([]);
    }
  };

  // ============================================================
  // CHARGEMENT DES COURS PAR CLASSE
  // ============================================================
  const loadCoursByClasse = (classeId) => {
    if (!classeId) {
      setCoursByClasse([]);
      return;
    }

    const classeIdInt = parseInt(classeId);
    const coursFiltres = tousLesCours.filter(c => {
      if (!c.classe) return false;
      return parseInt(c.classe) === classeIdInt;
    });
    
    setCoursByClasse(coursFiltres);
  };

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const handleNiveauChange = async (e) => {
    const value = e.target.value;
    setNiveauId(value);
    setClasseId('');
    setCoursByClasse([]);
    setFormData(prev => ({ ...prev, cours_concernes: [] }));
    
    if (value) {
      await loadClassesByNiveau(value);
    }
  };

  const handleClasseChange = async (e) => {
    const value = e.target.value;
    setClasseId(value);
    setFormData(prev => ({ ...prev, cours_concernes: [] }));
    
    if (value) {
      loadCoursByClasse(value);
    } else {
      setCoursByClasse([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ============================================================
  // ✅ GESTIONNAIRE COURS - AVEC HEURES AUTOMATIQUES
  // ============================================================
  const handleCoursChange = (e) => {
    const options = e.target.options;
    const selected = [];
    let heureDebut = '';
    let heureFin = '';

    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        const coursId = parseInt(options[i].value);
        selected.push(coursId);
        
        // Récupérer les heures du premier cours sélectionné
        if (selected.length === 1) {
          const cours = tousLesCours.find(c => c.id === coursId);
          if (cours) {
            heureDebut = cours.heure_debut || '';
            heureFin = cours.heure_fin || '';
          }
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      cours_concernes: selected,
      heure_debut: selected.length > 0 ? heureDebut : '',
      heure_fin: selected.length > 0 ? heureFin : ''
    }));
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.professeur) {
      showMessage('Veuillez sélectionner un professeur', 'error');
      return;
    }

    if (!formData.date_absence) {
      showMessage('Veuillez sélectionner une date', 'error');
      return;
    }

    if (!formData.motif) {
      showMessage('Veuillez saisir un motif', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const dataToSend = {
        ...formData,
        professeur: parseInt(formData.professeur),
        type_absence: formData.type_absence ? parseInt(formData.type_absence) : null,
        professeur_remplacant: formData.professeur_remplacant ? parseInt(formData.professeur_remplacant) : null,
        cours_concernes: formData.cours_concernes.map(id => parseInt(id))
      };

      if (isEditing) {
        await axiosInstance.put(`/absences-professeurs/${id}/`, dataToSend, headers);
        showMessage('Absence modifiée avec succès', 'success');
      } else {
        await axiosInstance.post('/absences-professeurs/', dataToSend, headers);
        showMessage('Absence enregistrée avec succès', 'success');
      }

      setTimeout(() => navigate('/absences-professeurs'), 1500);

    } catch (err) {
      console.error('Erreur:', err);
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
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Chargement...</p>
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
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-600">Erreur</h3>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Message de notification */}
      {message && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 ${
          messageType === 'error'
            ? 'bg-red-50 border-red-500 text-red-700'
            : 'bg-green-50 border-green-500 text-green-700'
        }`}>
          {messageType === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          <span className="font-medium">{message}</span>
          <button
            onClick={() => setMessage('')}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="w-full bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/absences-professeurs')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <UserCog className="h-6 w-6 text-blue-600" />
                {isEditing ? 'Modifier une absence' : 'Nouvelle absence professeur'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Sélection du professeur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Professeur *
              </label>
              <select
                name="professeur"
                value={formData.professeur}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionnez un professeur</option>
                {professeurs.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nom_complet || prof.nom || prof.prenom} - {prof.matricule || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ NIVEAU ET CLASSE POUR FILTRER LES COURS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Layers className="h-4 w-4 inline mr-1" />
                  Niveau
                </label>
                <select
                  value={niveauId}
                  onChange={handleNiveauChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez un niveau</option>
                  {niveaux.map(niveau => (
                    <option key={niveau.id} value={niveau.id}>
                      {niveau.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <School className="h-4 w-4 inline mr-1" />
                  Classe
                </label>
                <select
                  value={classeId}
                  onChange={handleClasseChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!niveauId}
                >
                  <option value="">Sélectionnez une classe</option>
                  {classesByNiveau.map(classe => (
                    <option key={classe.id} value={classe.id}>
                      {classe.nom}
                    </option>
                  ))}
                </select>
                {classeId && (
                  <p className="text-xs text-gray-500 mt-1">
                    {coursByClasse.length} cours dans cette classe
                  </p>
                )}
              </div>
            </div>

            {/* Date et heure */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  name="date_absence"
                  value={formData.date_absence}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Heure début
                </label>
                <input
                  type="time"
                  name="heure_debut"
                  value={formData.heure_debut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  readOnly={formData.cours_concernes.length > 0}
                />
                {formData.cours_concernes.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">✓ Auto-rempli depuis le cours</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Heure fin
                </label>
                <input
                  type="time"
                  name="heure_fin"
                  value={formData.heure_fin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  readOnly={formData.cours_concernes.length > 0}
                />
                {formData.cours_concernes.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">✓ Auto-rempli depuis le cours</p>
                )}
              </div>
            </div>

            {/* Type d'absence et statut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Type d'absence
                </label>
                <select
                  name="type_absence"
                  value={formData.type_absence}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez un type</option>
                  {typesAbsence.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.nom} {type.est_justifie ? '(Justifié)' : '(Non justifié)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Filter className="h-4 w-4 inline mr-1" />
                  Statut
                </label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en_attente">En attente</option>
                  <option value="approuvee">Approuvée</option>
                  <option value="refusee">Refusée</option>
                </select>
              </div>
            </div>

            {/* Motif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Motif *
              </label>
              <textarea
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Décrivez le motif de l'absence..."
                required
              />
            </div>

            {/* Remplacement */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  name="est_remplace"
                  checked={formData.est_remplace}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Ce professeur est remplacé
                </label>
              </div>

              {formData.est_remplace && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <UserCheck className="h-4 w-4 inline mr-1" />
                    Professeur remplaçant
                  </label>
                  <select
                    name="professeur_remplacant"
                    value={formData.professeur_remplacant}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez un remplaçant</option>
                    {professeurRemplacant
                      .filter(p => p.id !== parseInt(formData.professeur))
                      .map(prof => (
                        <option key={prof.id} value={prof.id}>
                          {prof.nom_complet || prof.nom || prof.prenom}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* ✅ Cours concernés - FILTRÉ PAR CLASSE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <BookOpen className="h-4 w-4 inline mr-1" />
                Cours concernés
              </label>
              <select
                multiple
                name="cours_concernes"
                value={formData.cours_concernes}
                onChange={handleCoursChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                disabled={!classeId || coursByClasse.length === 0}
              >
                {coursByClasse
                  .filter(c => c.enseignant === parseInt(formData.professeur) || !formData.professeur)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.matiere_nom || 'Sans matière'} - {c.jour || ''} 
                      {c.heure_debut ? ` (${c.heure_debut.substring(0,5)} - ${c.heure_fin ? c.heure_fin.substring(0,5) : ''})` : ''}
                    </option>
                  ))}
              </select>
              {classeId && coursByClasse.length === 0 && (
                <p className="text-xs text-yellow-600 mt-1">Aucun cours pour cette classe</p>
              )}
              {!classeId && (
                <p className="text-xs text-gray-500 mt-1">Sélectionnez une classe pour voir les cours</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs cours
              </p>
              {formData.cours_concernes.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {formData.cours_concernes.length} cours sélectionné(s)
                </p>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/absences-professeurs')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? 'Modifier' : 'Enregistrer'}
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AbsenceProfesseurForm;