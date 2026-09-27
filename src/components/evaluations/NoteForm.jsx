// src/components/evaluations/NoteForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle, X, Save,
  GraduationCap, User, ClipboardList, Calendar,
  BookOpen, Tag, Users, Check, UserX, RotateCw,
  Gauge, UserRound, Search, Download, Printer,
  ChevronLeft, ChevronRight, Plus, Filter, Layers,
  School, TrendingUp, UserCheck, FileSpreadsheet,
  AlertTriangle, UserMinus, CheckCheck
} from 'lucide-react';

const NoteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Données
  const [niveaux, setNiveaux] = useState([]);
  const [classes, setClasses] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [notes, setNotes] = useState([]);
  const [evaluation, setEvaluation] = useState(null);

  // Sélections en cascade
  const [niveauId, setNiveauId] = useState('');
  const [classeId, setClasseId] = useState('');
  const [evaluationId, setEvaluationId] = useState('');

  // États UI
  const [notesModifiees, setNotesModifiees] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [searchEleve, setSearchEleve] = useState('');
  const [showAbsents, setShowAbsents] = useState(false);
  const [showNonNotes, setShowNonNotes] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [stats, setStats] = useState({
    total: 0, notesSaisies: 0, notesManquantes: 0,
    presents: 0, absents: 0, moyenne: 0, max: 0, min: 0
  });

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showMessage = (texte, type = 'success') => {
    setMessage(texte);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
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

        const niveauxData = await fetchAllPages('/niveaux/', headers);
        setNiveaux(niveauxData);

        if (id) {
          setEvaluationId(id);
          const evalDetail = await axiosInstance.get(`/evaluations/${id}/`, headers);
          setEvaluation(evalDetail.data);

          if (evalDetail.data.niveau) {
            setNiveauId(evalDetail.data.niveau);
            await loadClassesByNiveau(evalDetail.data.niveau, headers);
            await loadEvaluationsByNiveau(evalDetail.data.niveau, headers);

            const classeRes = await axiosInstance.get(
              `/classes/?niveau=${evalDetail.data.niveau}&actif=true`,
              headers
            );
            let classeData = [];
            if (Array.isArray(classeRes.data)) classeData = classeRes.data;
            else if (classeRes.data?.results) classeData = classeRes.data.results;

            if (classeData.length > 0) {
              setClasseId(classeData[0].id);
              await loadEleves(classeData[0].id, headers);
            }
          }

          await loadNotes(id, headers);
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
  // CHARGEMENTS EN CASCADE
  // ============================================================
  const loadClassesByNiveau = async (niveauIdParam, headersParam = null) => {
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

  const loadEvaluationsByNiveau = async (niveauIdParam) => {
    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(
        `/evaluations/?niveau=${niveauIdParam}`,
        headers
      );

      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.results) data = res.data.results;

      setEvaluations(data);
    } catch (err) {
      console.error('❌ Erreur évaluations:', err);
      setEvaluations([]);
    }
  };

  const loadEleves = async (classeIdParam, headersParam = null) => {
    try {
      const token = localStorage.getItem('Token');
      const headers = headersParam || { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(
        `/eleves/?classe=${classeIdParam}`,
        headers
      );

      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.results) data = res.data.results;

      setEleves(data);
      setCurrentPage(1);
      updateStats(data, notes);
    } catch (err) {
      console.error('❌ Erreur élèves:', err);
      setEleves([]);
    }
  };

  const loadNotes = async (evaluationIdParam, headersParam = null) => {
    try {
      const token = localStorage.getItem('Token');
      const headers = headersParam || { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(
        `/notes/?evaluation=${evaluationIdParam}`,
        headers
      );

      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.results) data = res.data.results;

      setNotes(data);
      updateStats(eleves, data);
    } catch (err) {
      console.error('❌ Erreur notes:', err);
    }
  };

  // ============================================================
  // STATISTIQUES
  // ============================================================
  const updateStats = (elevesList = eleves, notesList = notes) => {
    const total = elevesList.length;
    const notesValides = notesList.filter(n => n.note !== null && n.note !== '' && n.note !== undefined);
    const notesSaisies = notesValides.length;
    const notesManquantes = total - notesSaisies;
    const presents = notesList.filter(n => n.est_present).length;
    const absents = notesList.filter(n => n.est_absente).length;

    let moyenne = 0, max = 0, min = 0;
    if (notesValides.length > 0) {
      const notesValues = notesValides.map(n => parseFloat(n.note) || 0);
      const sum = notesValues.reduce((a, b) => a + b, 0);
      moyenne = sum / notesValues.length;
      max = Math.max(...notesValues);
      min = Math.min(...notesValues);
    }

    setStats({
      total, notesSaisies, notesManquantes,
      presents, absents,
      moyenne: moyenne || 0, max: max || 0, min: min || 0
    });
  };

  // ============================================================
  // GESTIONNAIRES EN CASCADE
  // ============================================================
  const handleNiveauChange = async (e) => {
    const value = e.target.value;
    setNiveauId(value);

    setClasses([]);
    setEvaluations([]);
    setClasseId('');
    setEvaluationId('');
    setEvaluation(null);
    setEleves([]);
    setNotes([]);
    setNotesModifiees({});
    setStats({ total: 0, notesSaisies: 0, notesManquantes: 0, presents: 0, absents: 0, moyenne: 0, max: 0, min: 0 });

    if (value) {
      await Promise.all([
        loadClassesByNiveau(value),
        loadEvaluationsByNiveau(value)
      ]);
    }
  };

  const handleClasseChange = async (e) => {
    const value = e.target.value;
    setClasseId(value);
    setEleves([]);
    setNotes([]);
    setNotesModifiees({});
    setStats({ total: 0, notesSaisies: 0, notesManquantes: 0, presents: 0, absents: 0, moyenne: 0, max: 0, min: 0 });

    if (value) {
      await loadEleves(value);
      if (evaluationId) {
        await loadNotes(evaluationId);
      }
    }
  };

  const handleEvaluationChange = async (e) => {
    const value = e.target.value;
    setEvaluationId(value);
    setNotes([]);
    setNotesModifiees({});
    setEvaluation(null);

    if (value) {
      try {
        const token = localStorage.getItem('Token');
        const headers = { headers: { Authorization: `Token ${token}` } };
        const evalDetail = await axiosInstance.get(`/evaluations/${value}/`, headers);
        setEvaluation(evalDetail.data);
        await loadNotes(value);
      } catch (err) {
        console.error('❌ Erreur chargement évaluation:', err);
      }
    }
  };

  // ============================================================
  // GESTION DES NOTES
  // ============================================================
  const handleNoteChange = (eleveId, field, value) => {
    setNotesModifiees(prev => ({
      ...prev,
      [eleveId]: {
        ...prev[eleveId],
        [field]: value
      }
    }));
  };

  const getNoteValue = (eleveId, field) => {
    if (notesModifiees[eleveId] && notesModifiees[eleveId][field] !== undefined) {
      return notesModifiees[eleveId][field];
    }
    const noteExistante = notes.find(n => n.eleve === eleveId);
    if (noteExistante) {
      return noteExistante[field] !== undefined && noteExistante[field] !== null
        ? noteExistante[field]
        : '';
    }
    return '';
  };

  // ============================================================
  // ⭐ MARQUER TOUS PRÉSENTS / ABSENTS
  // ============================================================
  const handleMarkAllPresent = () => {
    if (eleves.length === 0) return;
    const nouveaux = { ...notesModifiees };
    eleves.forEach(eleve => {
      nouveaux[eleve.id] = {
        ...nouveaux[eleve.id],
        est_present: true,
        est_absente: false
      };
    });
    setNotesModifiees(nouveaux);
    showNotification(`✅ ${eleves.length} élève(s) marqué(s) présent(s)`, 'success');
  };

  const handleMarkAllAbsent = () => {
    if (eleves.length === 0) return;
    if (!window.confirm(`Marquer TOUS les ${eleves.length} élèves comme ABSENTS ?`)) return;
    const nouveaux = { ...notesModifiees };
    eleves.forEach(eleve => {
      nouveaux[eleve.id] = {
        ...nouveaux[eleve.id],
        est_present: false,
        est_absente: true
      };
    });
    setNotesModifiees(nouveaux);
    showNotification(`⚠️ ${eleves.length} élève(s) marqué(s) absent(s)`, 'info');
  };

  // ============================================================
  // ⭐ REMPLIR TOUTES LES NOTES
  // ============================================================
  const handleFillAllNotes = () => {
    if (eleves.length === 0) return;
    const maxNote = evaluation?.note_sur || 20;
    const defaultNote = prompt(`Entrez la note par défaut (sur ${maxNote}):`, '10');
    if (defaultNote === null || defaultNote === '') return;

    const val = parseFloat(defaultNote);
    if (isNaN(val) || val < 0 || val > maxNote) {
      showNotification('Valeur invalide', 'error');
      return;
    }

    const nouveaux = { ...notesModifiees };
    let count = 0;
    eleves.forEach(eleve => {
      const estAbsent = getNoteValue(eleve.id, 'est_absente') ||
                       (nouveaux[eleve.id]?.est_absente);
      if (!estAbsent) {
        nouveaux[eleve.id] = {
          ...nouveaux[eleve.id],
          note: val
        };
        count++;
      }
    });
    setNotesModifiees(nouveaux);
    showNotification(`✅ Note ${val}/${maxNote} appliquée à ${count} élève(s)`, 'success');
  };

  // ============================================================
  // FILTRES & PAGINATION
  // ============================================================
  const getFilteredEleves = () => {
    let filtered = [...eleves];

    if (searchEleve) {
      const search = searchEleve.toLowerCase().trim();
      filtered = filtered.filter(e =>
        (e.nom_complet || e.nom || e.prenom || '').toLowerCase().includes(search) ||
        (e.matricule || '').toLowerCase().includes(search)
      );
    }

    if (showAbsents) {
      filtered = filtered.filter(e => getNoteValue(e.id, 'est_absente'));
    }

    if (showNonNotes) {
      filtered = filtered.filter(e => {
        const note = getNoteValue(e.id, 'note');
        return note === '' || note === null || note === undefined;
      });
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
  }, [searchEleve, showAbsents, showNonNotes]);

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!evaluationId) return showMessage('Veuillez sélectionner une évaluation', 'error');
    if (!classeId) return showMessage('Veuillez sélectionner une classe', 'error');

    setSubmitting(true);

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      };

      const notesData = [];
      const notesToDelete = [];

      eleves.forEach(eleve => {
        const note = getNoteValue(eleve.id, 'note');
        const observation = getNoteValue(eleve.id, 'observation');
        const estPresent = getNoteValue(eleve.id, 'est_present') !== undefined
          ? getNoteValue(eleve.id, 'est_present')
          : true;
        const estAbsent = getNoteValue(eleve.id, 'est_absente') || false;
        const motifAbsence = getNoteValue(eleve.id, 'motif_absence') || '';

        const noteExistante = notes.find(n => n.eleve === eleve.id);

        if (noteExistante && (note === '' || note === null || note === undefined)) {
          notesToDelete.push(noteExistante.id);
          return;
        }

        if (note === '' || note === null || note === undefined) {
          // Créer quand même une note pour marquer la présence
          if (estPresent && !estAbsent) {
            notesData.push({
              evaluation: parseInt(evaluationId),
              eleve: eleve.id,
              note: null,
              observation: observation || '',
              est_present: estPresent,
              est_absente: estAbsent,
              motif_absence: motifAbsence,
              ...(noteExistante ? { id: noteExistante.id } : {})
            });
          }
          return;
        }

        const noteData = {
          evaluation: parseInt(evaluationId),
          eleve: eleve.id,
          note: parseFloat(note) || 0,
          observation: observation || '',
          est_present: estPresent,
          est_absente: estAbsent,
          motif_absence: motifAbsence
        };

        if (noteExistante) {
          noteData.id = noteExistante.id;
        }

        notesData.push(noteData);
      });

      for (const noteId of notesToDelete) {
        await axiosInstance.delete(`/notes/${noteId}/`, { headers });
      }

      for (const noteData of notesData) {
        if (noteData.id) {
          await axiosInstance.put(`/notes/${noteData.id}/`, noteData, { headers });
        } else {
          await axiosInstance.post('/notes/', noteData, { headers });
        }
      }

      showNotification(`✅ ${notesData.length} note(s) enregistrée(s)`, 'success');
      await loadNotes(evaluationId);
      setNotesModifiees({});

    } catch (err) {
      console.error('❌ Erreur:', err);
      showNotification('Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const exportCSV = () => {
    if (eleves.length === 0) return;

    const csvHeaders = ['N°', 'Élève', 'Matricule', 'Note', 'Observation', 'Présent', 'Absent'];
    const rows = eleves.map((eleve, index) => {
      const note = getNoteValue(eleve.id, 'note');
      const observation = getNoteValue(eleve.id, 'observation');
      const estPresent = getNoteValue(eleve.id, 'est_present') !== undefined
        ? getNoteValue(eleve.id, 'est_present')
        : true;
      const estAbsent = getNoteValue(eleve.id, 'est_absente') || false;
      return [
        index + 1,
        eleve.nom_complet || `${eleve.prenom} ${eleve.nom}`,
        eleve.matricule || '-',
        note || '',
        observation || '',
        estPresent ? 'Oui' : 'Non',
        estAbsent ? 'Oui' : 'Non'
      ];
    });

    const csvContent = [csvHeaders, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `notes_${evaluation?.titre || 'evaluation'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showNotification('Export CSV réussi', 'success');
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
            Chargement des données...
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
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-3 gap-2"
          >
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

      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
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
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL STATISTIQUES
          ============================================================ */}
      {showStats && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Statistiques des notes
              </h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowStats(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="stat bg-primary/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Total élèves</div>
                <div className="stat-value text-2xl font-bold text-primary">{stats.total}</div>
              </div>
              <div className="stat bg-success/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Notés</div>
                <div className="stat-value text-2xl font-bold text-success">{stats.notesSaisies}</div>
              </div>
              <div className="stat bg-warning/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Non notés</div>
                <div className="stat-value text-2xl font-bold text-warning">{stats.notesManquantes}</div>
              </div>
              <div className="stat bg-info/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Moyenne</div>
                <div className="stat-value text-2xl font-bold text-info">{stats.moyenne.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                  <UserCheck className="w-4 h-4" /> Présents
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.presents}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
                  <UserMinus className="w-4 h-4" /> Absents
                </div>
                <p className="text-2xl font-bold text-red-600">{stats.absents}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-purple-700 font-semibold mb-1">
                  <Gauge className="w-4 h-4" /> Min / Max
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.min.toFixed(1)} / {stats.max.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setShowStats(false)}>Fermer</button>
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
                <Gauge className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">
                {isEditing ? 'Gestion des notes' : 'Saisie des notes'}
              </h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              {evaluation ? evaluation.titre : 'Sélectionnez niveau, classe et évaluation'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {eleves.length > 0 && (
              <button
                onClick={() => setShowStats(true)}
                className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                Stats
              </button>
            )}
            <button
              onClick={exportCSV}
              disabled={eleves.length === 0}
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => navigate('/notes')}
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          SÉLECTION EN CASCADE
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          Sélection en cascade
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. NIVEAU */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-500" />
              Niveau *
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
              <p className="text-xs text-gray-500 mt-1">
                {classes.length} classe(s) • {evaluations.length} évaluation(s)
              </p>
            )}
          </div>

          {/* 2. CLASSE */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
              <School className="h-4 w-4 text-gray-500" />
              Classe *
            </label>
            <select
              value={classeId}
              onChange={handleClasseChange}
              className="select select-bordered w-full focus:border-primary"
              disabled={!niveauId || classes.length === 0}
              required
            >
              <option value="">
                {!niveauId
                  ? 'Sélectionnez d\'abord un niveau'
                  : classes.length === 0
                  ? 'Aucune classe pour ce niveau'
                  : 'Sélectionnez une classe'}
              </option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>{classe.nom}</option>
              ))}
            </select>
            {classeId && (
              <p className="text-xs text-gray-500 mt-1">{eleves.length} élève(s)</p>
            )}
          </div>

          {/* 3. ÉVALUATION */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gray-500" />
              Évaluation *
            </label>
            <select
              value={evaluationId}
              onChange={handleEvaluationChange}
              className="select select-bordered w-full focus:border-primary"
              disabled={!niveauId || evaluations.length === 0}
              required
            >
              <option value="">
                {!niveauId
                  ? 'Sélectionnez d\'abord un niveau'
                  : evaluations.length === 0
                  ? 'Aucune évaluation pour ce niveau'
                  : 'Sélectionnez une évaluation'}
              </option>
              {evaluations.map(evalItem => (
                <option key={evalItem.id} value={evalItem.id}>
                  {evalItem.titre} - {evalItem.matiere_nom || 'Sans matière'}
                </option>
              ))}
            </select>
            {evaluationId && evaluation && (
              <p className="text-xs text-gray-500 mt-1">
                {evaluation.type_nom || ''} • Note sur {evaluation.note_sur || 20}
              </p>
            )}
          </div>
        </div>

        {/* Indicateur progression */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
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
          <div className={`flex items-center gap-1.5 text-xs ${evaluationId ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${evaluationId ? 'bg-green-100' : 'bg-gray-100'}`}>
              {evaluationId ? <Check className="w-3 h-3" /> : '3'}
            </div>
            Évaluation
          </div>
        </div>
      </div>

      {/* ============================================================
          INFOS ÉVALUATION
          ============================================================ */}
      {evaluation && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <BookOpen className="w-3 h-3" /> Matière
            </div>
            <p className="font-bold text-primary">{evaluation.matiere_nom || 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Tag className="w-3 h-3" /> Type
            </div>
            <p className="font-bold text-primary">{evaluation.type_nom || 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Gauge className="w-3 h-3" /> Note sur
            </div>
            <p className="font-bold text-primary">{evaluation.note_sur || 20}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Calendar className="w-3 h-3" /> Date
            </div>
            <p className="font-bold text-primary">{evaluation.date_evaluation || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* ============================================================
          CARTES STATISTIQUES RAPIDES
          ============================================================ */}
      {eleves.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
                  <p className="text-xs text-gray-500 font-medium uppercase">Notés</p>
                  <p className="text-xl font-bold text-success">{stats.notesSaisies}</p>
                </div>
                <CheckCircle className="w-7 h-7 text-success/20" />
              </div>
            </div>
          </div>
          <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Non notés</p>
                  <p className="text-xl font-bold text-warning">{stats.notesManquantes}</p>
                </div>
                <AlertTriangle className="w-7 h-7 text-warning/20" />
              </div>
            </div>
          </div>
          <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Présents</p>
                  <p className="text-xl font-bold text-green-600">{stats.presents}</p>
                </div>
                <UserCheck className="w-7 h-7 text-green-600/20" />
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
                  <p className="text-xs text-gray-500 font-medium uppercase">Moyenne</p>
                  <p className="text-xl font-bold text-info">{stats.moyenne.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-7 h-7 text-info/20" />
              </div>
            </div>
          </div>
          <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Min/Max</p>
                  <p className="text-xl font-bold text-purple-600">
                    {stats.min.toFixed(0)}/{stats.max.toFixed(0)}
                  </p>
                </div>
                <Gauge className="w-7 h-7 text-purple-600/20" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          ACTIONS RAPIDES
          ============================================================ */}
      {eleves.length > 0 && evaluationId && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCheck className="h-4 w-4 text-primary" />
            Actions rapides
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="btn btn-sm bg-success hover:bg-success/90 text-white gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Tous présents ({eleves.length})
            </button>
            <button
              type="button"
              onClick={handleMarkAllAbsent}
              className="btn btn-sm btn-outline btn-error gap-2"
            >
              <UserMinus className="w-4 h-4" />
              Tous absents
            </button>
            <button
              type="button"
              onClick={handleFillAllNotes}
              className="btn btn-sm btn-outline gap-2"
            >
              <Plus className="w-4 h-4" />
              Remplir toutes les notes
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          TABLEAU DES ÉLÈVES
          ============================================================ */}
      {eleves.length > 0 && evaluationId ? (
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
                        checked={showNonNotes}
                        onChange={(e) => setShowNonNotes(e.target.checked)}
                        className="checkbox checkbox-sm checkbox-primary"
                      />
                      Non notés
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
                  <th className="py-3 font-semibold">N°</th>
                  <th className="py-3 font-semibold">Élève</th>
                  <th className="py-3 font-semibold">Matricule</th>
                  <th className="py-3 text-center font-semibold">
                    Note / {evaluation?.note_sur || 20}
                  </th>
                  <th className="py-3 font-semibold">Observations</th>
                  <th className="py-3 text-center font-semibold text-success">
                    <UserCheck className="w-4 h-4 inline" /> Présent
                  </th>
                  <th className="py-3 text-center font-semibold text-error">
                    <UserX className="w-4 h-4 inline" /> Absent
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEleves.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserRound className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Aucun élève ne correspond aux filtres</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEleves.map((eleve, index) => {
                    const noteValue = getNoteValue(eleve.id, 'note');
                    const observation = getNoteValue(eleve.id, 'observation');
                    const estPresent = getNoteValue(eleve.id, 'est_present') !== undefined
                      ? getNoteValue(eleve.id, 'est_present')
                      : true;
                    const estAbsent = getNoteValue(eleve.id, 'est_absente') || false;

                    let noteColor = '';
                    let noteBg = '';
                    if (noteValue !== '' && noteValue !== null && noteValue !== undefined) {
                      const val = parseFloat(noteValue);
                      const max = evaluation?.note_sur || 20;
                      if (val >= max * 0.8) {
                        noteColor = 'text-green-600';
                        noteBg = 'bg-green-50';
                      } else if (val >= max * 0.5) {
                        noteColor = 'text-orange-500';
                        noteBg = 'bg-orange-50';
                      } else {
                        noteColor = 'text-red-600';
                        noteBg = 'bg-red-50';
                      }
                    }

                    return (
                      <tr
                        key={eleve.id}
                        className={`border-t hover:bg-gray-50 transition ${estAbsent ? 'bg-red-50/40' : ''}`}
                      >
                        <td className="text-sm text-gray-500">{startIndex + index + 1}</td>
                        <td className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className={`w-3.5 h-3.5 ${eleve.sexe === 'M' ? 'text-blue-500' : 'text-pink-500'}`} />
                            </div>
                            {eleve.nom_complet || `${eleve.prenom || ''} ${eleve.nom || ''}`}
                            {estAbsent && (
                              <span className="badge badge-error badge-xs">Absent</span>
                            )}
                          </div>
                        </td>
                        <td className="text-sm text-gray-500 font-mono">{eleve.matricule || '-'}</td>
                        <td className="text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={evaluation?.note_sur || 20}
                            value={noteValue}
                            onChange={(e) => handleNoteChange(eleve.id, 'note', e.target.value)}
                            className={`input input-bordered input-sm w-24 text-center font-semibold ${noteColor} ${noteBg}`}
                            placeholder="-"
                            disabled={estAbsent}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={observation || ''}
                            onChange={(e) => handleNoteChange(eleve.id, 'observation', e.target.value)}
                            className="input input-bordered input-sm w-full"
                            placeholder="Observation..."
                            disabled={estAbsent}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={estPresent}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              handleNoteChange(eleve.id, 'est_present', checked);
                              if (checked) {
                                handleNoteChange(eleve.id, 'est_absente', false);
                              }
                            }}
                            className="checkbox checkbox-success"
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={estAbsent}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              handleNoteChange(eleve.id, 'est_absente', checked);
                              if (checked) {
                                handleNoteChange(eleve.id, 'est_present', false);
                                handleNoteChange(eleve.id, 'note', '');
                              }
                            }}
                            className="checkbox checkbox-error"
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
              {!niveauId
                ? 'Sélectionnez un niveau'
                : classes.length === 0
                ? 'Aucune classe pour ce niveau'
                : !classeId
                ? 'Sélectionnez une classe'
                : eleves.length === 0
                ? 'Aucun élève dans cette classe'
                : !evaluationId
                ? 'Sélectionnez une évaluation'
                : 'Prêt'}
            </h3>
            <p className="text-gray-500">
              {!niveauId
                ? 'Commencez par choisir un niveau'
                : classes.length === 0
                ? 'Aucune classe n\'est définie pour ce niveau'
                : !classeId
                ? 'Choisissez une classe pour voir les élèves'
                : eleves.length === 0
                ? 'Aucun élève inscrit dans cette classe'
                : !evaluationId
                ? 'Choisissez une évaluation pour saisir les notes'
                : ''}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================
          BOUTONS ENREGISTREMENT
          ============================================================ */}
      {eleves.length > 0 && evaluationId && (
        <div className="sticky bottom-4 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-500">
              {stats.notesSaisies} / {stats.total} note(s) saisie(s)
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/notes')}
                className="btn btn-outline gap-2"
              >
                <X className="h-4 w-4" /> Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
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
                    Enregistrer les notes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteForm;