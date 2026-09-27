// src/components/absences/AbsenceForm.jsx

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
  School,
  Calendar,
  Clock,
  FileText,
  UserX,
  RefreshCw,
  Filter
} from 'lucide-react';

const AbsenceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Données
  const [classes, setClasses] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [typesAbsence, setTypesAbsence] = useState([]);

  // Formulaire
  const [formData, setFormData] = useState({
    eleve: '',
    date_absence: new Date().toISOString().split('T')[0],
    heure_debut: '',
    heure_fin: '',
    type_absence: '',
    statut: 'en_attente',
    motif: '',
    cours: ''
  });

  // Filtres
  const [classeId, setClasseId] = useState('');

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

        // 1. Charger les classes
        const classesRes = await axiosInstance.get('/classes/?actif=true', headers);
        let classesData = [];
        if (Array.isArray(classesRes.data)) {
          classesData = classesRes.data;
        } else if (classesRes.data?.results) {
          classesData = classesRes.data.results;
        }
        setClasses(classesData);

        // 2. Charger les types d'absence
        try {
          const typesRes = await axiosInstance.get('/types-absence/', headers);
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

        // 3. Si édition, charger l'absence
        if (id) {
          const absenceRes = await axiosInstance.get(`/absences-eleves/${id}/`, headers);
          const data = absenceRes.data;
          setFormData({
            eleve: data.eleve || '',
            date_absence: data.date_absence || '',
            heure_debut: data.heure_debut || '',
            heure_fin: data.heure_fin || '',
            type_absence: data.type_absence || '',
            statut: data.statut || 'en_attente',
            motif: data.motif || '',
            cours: data.cours || ''
          });
          // Charger les élèves de la classe de l'élève
          if (data.eleve) {
            try {
              const eleveRes = await axiosInstance.get(`/eleves/${data.eleve}/`, headers);
              const eleve = eleveRes.data;
              if (eleve.classe) {
                setClasseId(eleve.classe);
                await loadElevesByClasse(eleve.classe);
              }
            } catch (e) {
              console.warn('Impossible de charger les détails de l\'élève:', e);
            }
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
  // CHARGEMENT DES ÉLÈVES PAR CLASSE
  // ============================================================
  const loadElevesByClasse = async (classeId) => {
    if (!classeId) {
      setEleves([]);
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(`/eleves/?classe=${classeId}&statut=actif`, headers);
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.results) {
        data = res.data.results;
      }

      const classeIdInt = parseInt(classeId);
      const elevesFiltres = data.filter(e => {
        if (!e.classe) return false;
        return parseInt(e.classe) === classeIdInt;
      });

      setEleves(elevesFiltres);
    } catch (err) {
      console.error('❌ Erreur chargement élèves:', err);
      setEleves([]);
    }
  };

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const handleClasseChange = async (e) => {
    const value = e.target.value;
    setClasseId(value);
    setFormData(prev => ({ ...prev, eleve: '' }));
    if (value) {
      await loadElevesByClasse(value);
    } else {
      setEleves([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.eleve) {
      showMessage('Veuillez sélectionner un élève', 'error');
      return;
    }

    if (!formData.date_absence) {
      showMessage('Veuillez sélectionner une date', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const dataToSend = {
        ...formData,
        eleve: parseInt(formData.eleve),
        type_absence: formData.type_absence ? parseInt(formData.type_absence) : null,
        cours: formData.cours ? parseInt(formData.cours) : null
      };

      if (isEditing) {
        await axiosInstance.put(`/absences-eleves/${id}/`, dataToSend, headers);
        showMessage('Absence modifiée avec succès', 'success');
      } else {
        await axiosInstance.post('/absences-eleves/', dataToSend, headers);
        showMessage('Absence enregistrée avec succès', 'success');
      }

      setTimeout(() => navigate('/absences'), 1500);

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
                onClick={() => navigate('/absences')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <UserX className="h-6 w-6 text-red-500" />
                {isEditing ? 'Modifier une absence' : 'Nouvelle absence'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Sélection de la classe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <School className="h-4 w-4 inline mr-1" />
                Classe
              </label>
              <select
                value={classeId}
                onChange={handleClasseChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez une classe</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                  </option>
                ))}
              </select>
              {classeId && (
                <p className="text-xs text-gray-500 mt-1">
                  {eleves.length} élève(s) dans cette classe
                </p>
              )}
            </div>

            {/* Sélection de l'élève */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Élève *
              </label>
              <select
                name="eleve"
                value={formData.eleve}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!classeId || eleves.length === 0}
                required
              >
                <option value="">Sélectionnez un élève</option>
                {eleves.map(eleve => (
                  <option key={eleve.id} value={eleve.id}>
                    {eleve.nom_complet || eleve.nom || eleve.prenom} - {eleve.matricule || ''}
                  </option>
                ))}
              </select>
              {classeId && eleves.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Aucun élève dans cette classe</p>
              )}
              {!classeId && (
                <p className="text-xs text-yellow-600 mt-1">Veuillez d'abord sélectionner une classe</p>
              )}
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
                />
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
                />
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
                      {type.nom}
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
                  <option value="justifiee">Justifiée</option>
                  <option value="non_justifiee">Non justifiée</option>
                  <option value="refusee">Refusée</option>
                </select>
              </div>
            </div>

            {/* Motif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Motif
              </label>
              <textarea
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Décrivez le motif de l'absence..."
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/absences')}
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

export default AbsenceForm;