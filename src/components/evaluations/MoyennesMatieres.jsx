// src/components/evaluations/MoyennesMatieres.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, X, Search,
  RefreshCw, FileText, Download, School, User, Calendar,
  BookOpen, Gauge, BarChart3, Award, Star, ChevronLeft,
  ChevronRight, IdCard, TrendingUp, TrendingDown, Minus,
  Filter, Eye, ClipboardList
} from 'lucide-react';

const MoyennesMatieres = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Données
  const [moyennes, setMoyennes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [eleves, setEleves] = useState([]);

  // Filtres
  const [classeId, setClasseId] = useState('');
  const [periodeId, setPeriodeId] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Statistiques
  const [stats, setStats] = useState({
    total: 0, moyenneGenerale: 0, max: 0, min: 0,
    eleves: 0, matieres: 0
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

        // 1. Classes
        const classesRes = await axiosInstance.get('/classes/?actif=true', headers);
        let classesData = [];
        if (Array.isArray(classesRes.data)) classesData = classesRes.data;
        else if (classesRes.data?.results) classesData = classesRes.data.results;
        setClasses(classesData);
        console.log(`📚 ${classesData.length} classes chargées`);

        // 2. Périodes
        const periodesRes = await axiosInstance.get('/periodes/', headers);
        let periodesData = [];
        if (Array.isArray(periodesRes.data)) periodesData = periodesRes.data;
        else if (periodesRes.data?.results) periodesData = periodesRes.data.results;
        setPeriodes(periodesData);
        console.log(`📅 ${periodesData.length} périodes chargées`);

        // 3. Matières
        const matieresRes = await axiosInstance.get('/matieres/', headers);
        let matieresData = [];
        if (Array.isArray(matieresRes.data)) matieresData = matieresRes.data;
        else if (matieresRes.data?.results) matieresData = matieresRes.data.results;
        setMatieres(matieresData);
        console.log(`📖 ${matieresData.length} matières chargées`);

        setLoading(false);
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError('Erreur de chargement des données');
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ============================================================
  // ✅ CHARGEMENT DES MOYENNES — CORRIGÉ (sans filtre client)
  // ============================================================
  const loadMoyennes = async () => {
    if (!classeId || !periodeId) {
      setMoyennes([]);
      setTotalItems(0);
      updateStats([]);
      return;
    }

    setLoading(true);
    setMoyennes([]);

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      // ÉTAPE 1: Élèves de la classe (backend filtre déjà)
      console.log('🔍 Chargement des élèves pour la classe:', classeId);
      const elevesRes = await axiosInstance.get(
        `/eleves/?classe=${classeId}&statut=actif`,
        headers
      );

      // ✅ Extraction robuste
      let elevesData = [];
      if (Array.isArray(elevesRes.data)) {
        elevesData = elevesRes.data;
      } else if (elevesRes.data?.results) {
        elevesData = elevesRes.data.results;
      } else if (typeof elevesRes.data === 'object' && elevesRes.data !== null) {
        elevesData = Object.values(elevesRes.data).filter(item => item?.id);
      }

      console.log(`📊 ${elevesData.length} élèves reçus`);

      // ✅ PAS de filtre client — le backend filtre déjà par ?classe=X
      setEleves(elevesData);

      if (elevesData.length === 0) {
        setMoyennes([]);
        setTotalItems(0);
        updateStats([]);
        showMessage('Aucun élève dans cette classe', 'info');
        setLoading(false);
        return;
      }

      // ÉTAPE 2: Évaluations de la période
      const evalRes = await axiosInstance.get(
        `/evaluations/?periode=${periodeId}`,
        headers
      );
      let evalData = [];
      if (Array.isArray(evalRes.data)) evalData = evalRes.data;
      else if (evalRes.data?.results) evalData = evalRes.data.results;

      // Filtre optionnel par matière
      let evaluationsFiltrees = evalData;
      if (matiereId) {
        evaluationsFiltrees = evalData.filter(e => e.matiere === parseInt(matiereId));
      }

      if (evaluationsFiltrees.length === 0) {
        setMoyennes([]);
        setTotalItems(0);
        updateStats([]);
        showMessage('Aucune évaluation trouvée pour cette période', 'info');
        setLoading(false);
        return;
      }

      // ÉTAPE 3: Calcul des moyennes
      const toutesLesMoyennes = [];
      const evaluationIds = evaluationsFiltrees.map(e => e.id);

      for (const eleve of elevesData) {
        const notesRes = await axiosInstance.get(
          `/notes/?eleve=${eleve.id}`,
          headers
        );
        let notesData = [];
        if (Array.isArray(notesRes.data)) notesData = notesRes.data;
        else if (notesRes.data?.results) notesData = notesRes.data.results;

        // Filtrer par période
        const notesEleve = notesData.filter(n => evaluationIds.includes(n.evaluation));

        // Regrouper par matière
        const matieresNotes = {};
        for (const note of notesEleve) {
          const evaluation = evaluationsFiltrees.find(e => e.id === note.evaluation);
          if (!evaluation) continue;

          const matiereIdNote = evaluation.matiere;
          const matiereNom = evaluation.matiere_nom || 'Inconnue';

          if (!matieresNotes[matiereIdNote]) {
            matieresNotes[matiereIdNote] = {
              notes: [],
              matiere_nom: matiereNom,
              matiere_id: matiereIdNote,
              evaluations: []
            };
          }

          if (note.note !== null && note.note !== undefined) {
            matieresNotes[matiereIdNote].notes.push(parseFloat(note.note) || 0);
            matieresNotes[matiereIdNote].evaluations.push({
              id: note.id,
              note: note.note,
              evaluation_id: note.evaluation,
              evaluation_titre: evaluation.titre
            });
          }
        }

        // Calculer moyennes
        for (const [matiereIdNote, data] of Object.entries(matieresNotes)) {
          if (data.notes.length > 0) {
            const somme = data.notes.reduce((a, b) => a + b, 0);
            const moyenne = somme / data.notes.length;

            if (matiereId && parseInt(matiereId) !== parseInt(matiereIdNote)) {
              continue;
            }

            toutesLesMoyennes.push({
              id: `${eleve.id}-${matiereIdNote}`,
              eleve: eleve.id,
              eleve_nom: eleve.nom_complet || `${eleve.prenom || ''} ${eleve.nom || ''}` || 'Inconnu',
              eleve_matricule: eleve.matricule || '-',
              matiere: parseInt(matiereIdNote),
              matiere_nom: data.matiere_nom || 'Inconnue',
              moyenne: moyenne,
              coefficient: 1,
              nombre_evaluations: data.notes.length,
              notes_detail: data.evaluations,
              rang: 0
            });
          }
        }
      }

      // Tri
      toutesLesMoyennes.sort((a, b) => b.moyenne - a.moyenne);
      toutesLesMoyennes.forEach((item, index) => {
        item.rang = index + 1;
      });

      setMoyennes(toutesLesMoyennes);
      setTotalItems(toutesLesMoyennes.length);
      updateStats(toutesLesMoyennes);

      if (toutesLesMoyennes.length === 0) {
        showMessage('Aucune moyenne trouvée', 'info');
      } else {
        showMessage(`✅ ${toutesLesMoyennes.length} moyenne(s) chargée(s)`, 'success');
      }

    } catch (err) {
      console.error('❌ Erreur chargement moyennes:', err);
      showMessage('Erreur lors du chargement des moyennes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // STATISTIQUES
  // ============================================================
  const updateStats = (data) => {
    const notesValides = data.filter(
      m => m.moyenne !== null && m.moyenne !== undefined && m.moyenne !== ''
    );
    const total = data.length;

    let moyenneGenerale = 0, max = 0, min = 0;
    if (notesValides.length > 0) {
      const valeurs = notesValides.map(m => parseFloat(m.moyenne) || 0);
      const sum = valeurs.reduce((a, b) => a + b, 0);
      moyenneGenerale = sum / valeurs.length;
      max = Math.max(...valeurs);
      min = Math.min(...valeurs);
    }

    const elevesUniques = new Set(data.map(m => m.eleve)).size;
    const matieresUniques = new Set(data.map(m => m.matiere)).size;

    setStats({
      total: total || 0,
      moyenneGenerale: moyenneGenerale || 0,
      max: max || 0,
      min: min || 0,
      eleves: elevesUniques || 0,
      matieres: matieresUniques || 0
    });
  };

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const handleClasseChange = (e) => {
    const value = e.target.value;
    setClasseId(value);
    setCurrentPage(1);
    setMoyennes([]);
    setStats({ total: 0, moyenneGenerale: 0, max: 0, min: 0, eleves: 0, matieres: 0 });
  };

  const handlePeriodeChange = (e) => {
    const value = e.target.value;
    setPeriodeId(value);
    setCurrentPage(1);
    setMoyennes([]);
    setStats({ total: 0, moyenneGenerale: 0, max: 0, min: 0, eleves: 0, matieres: 0 });
  };

  const handleMatiereChange = (e) => {
    const value = e.target.value;
    setMatiereId(value);
    setCurrentPage(1);
  };

  const handleRecherche = () => {
    if (!classeId) {
      showMessage('Veuillez sélectionner une classe', 'error');
      return;
    }
    if (!periodeId) {
      showMessage('Veuillez sélectionner une période', 'error');
      return;
    }
    loadMoyennes();
  };

  const handleRefresh = () => {
    if (classeId && periodeId) {
      loadMoyennes();
    } else {
      showMessage('Veuillez sélectionner une classe et une période', 'info');
    }
  };

  // ============================================================
  // FILTRES & PAGINATION
  // ============================================================
  const getFilteredData = () => {
    let filtered = [...moyennes];

    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(m =>
        (m.eleve_nom || '').toLowerCase().includes(search) ||
        (m.eleve_matricule || '').toLowerCase().includes(search) ||
        (m.matiere_nom || '').toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();
  const totalFiltered = filteredData.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const exportCSV = () => {
    if (moyennes.length === 0) {
      showMessage('Aucune donnée à exporter', 'error');
      return;
    }

    const headers = ['Rang', 'Élève', 'Matricule', 'Matière', 'Moyenne', 'Nombre d\'évaluations', 'Détail notes'];
    const rows = moyennes.map(m => [
      m.rang || '-',
      m.eleve_nom || '-',
      m.eleve_matricule || '-',
      m.matiere_nom || '-',
      m.moyenne ? m.moyenne.toFixed(2) : '0.00',
      m.nombre_evaluations || 0,
      (m.notes_detail || []).map(n => `${n.evaluation_titre}: ${n.note}`).join('; ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `moyennes_matieres_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const getMoyenneColor = (moyenne) => {
    if (moyenne === null || moyenne === undefined) return 'text-gray-400';
    const val = parseFloat(moyenne);
    if (isNaN(val)) return 'text-gray-400';
    if (val >= 16) return 'text-green-600 font-bold';
    if (val >= 12) return 'text-orange-500 font-bold';
    if (val >= 10) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const getMention = (moyenne) => {
    if (moyenne >= 16) return 'Très Bien';
    if (moyenne >= 14) return 'Bien';
    if (moyenne >= 12) return 'Assez Bien';
    if (moyenne >= 10) return 'Passable';
    return 'Insuffisant';
  };

  const getTendance = (moyenne) => {
    if (moyenne >= 16) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (moyenne >= 10) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading && !classeId) {
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
  // ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-600">{error}</h3>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* NOTIFICATION */}
      {message && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 ${
          messageType === 'error'
            ? 'bg-red-50 border-red-500 text-red-700'
            : messageType === 'info'
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : 'bg-green-50 border-green-500 text-green-700'
        }`}>
          {messageType === 'error'
            ? <AlertCircle className="h-5 w-5" />
            : <CheckCircle2 className="h-5 w-5" />}
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="ml-4 text-gray-400 hover:text-gray-600">
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
                onClick={() => navigate('/dashboard')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Moyennes par matière
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" /> Actualiser
              </button>
              <button
                onClick={exportCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm disabled:opacity-50"
                disabled={moyennes.length === 0}
              >
                <Download className="h-4 w-4" /> Exporter CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-4 py-6">

        {/* FILTRES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <School className="h-4 w-4" /> Classe *
              </label>
              <select
                value={classeId}
                onChange={handleClasseChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez une classe</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom} {classe.niveau_nom ? `(${classe.niveau_nom})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Période *
              </label>
              <select
                value={periodeId}
                onChange={handlePeriodeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez une période</option>
                {periodes.map(periode => (
                  <option key={periode.id} value={periode.id}>
                    {periode.libelle} {periode.annee_libelle && `- ${periode.annee_libelle}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Matière
              </label>
              <select
                value={matiereId}
                onChange={handleMatiereChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les matières</option>
                {matieres.map(matiere => (
                  <option key={matiere.id} value={matiere.id}>
                    {matiere.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Search className="h-4 w-4" /> Recherche
              </label>
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleRecherche}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!classeId || !periodeId}
            >
              <Search className="h-4 w-4" /> Consulter les moyennes
            </button>
            {moyennes.length > 0 && (
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showStats ? 'Cacher stats' : 'Afficher stats'}
              </button>
            )}
          </div>
        </div>

        {/* STATISTIQUES */}
        {showStats && classeId && periodeId && moyennes.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</p>
              <p className="text-base sm:text-lg font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Élèves</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.eleves}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Matières</p>
              <p className="text-base sm:text-lg font-bold text-purple-600">{stats.matieres}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Moyenne</p>
              <p className="text-base sm:text-lg font-bold text-blue-600">
                {stats.moyenneGenerale.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Max</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.max.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Min</p>
              <p className="text-base sm:text-lg font-bold text-red-600">{stats.min.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* TABLEAU */}
        {classeId && periodeId ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <span className="ml-3 text-gray-500">Chargement des moyennes...</span>
              </div>
            ) : moyennes.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {!classeId ? 'Sélectionnez une classe' :
                   !periodeId ? 'Sélectionnez une période' :
                   'Aucune moyenne trouvée pour cette classe'}
                </p>
                {classeId && periodeId && (
                  <button
                    onClick={loadMoyennes}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="h-4 w-4" /> Recharger
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                          <Award className="h-4 w-4 inline mr-1" /> Rang
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                          <User className="h-4 w-4 inline mr-1" /> Élève
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">
                          <IdCard className="h-4 w-4 inline mr-1" /> Matricule
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">
                          <BookOpen className="h-4 w-4 inline mr-1" /> Matière
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                          <Gauge className="h-4 w-4 inline mr-1" /> Moyenne
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600 hidden lg:table-cell">
                          <ClipboardList className="h-4 w-4 inline mr-1" /> Évals
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden xl:table-cell">
                          Mention
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                          Tendance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item) => {
                        const moyenne = item.moyenne || 0;
                        const rang = item.rang || 0;
                        return (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-3 px-4 font-medium text-gray-700">
                              <span className="flex items-center gap-1">
                                {rang === 1 && <Star className="h-4 w-4 text-yellow-500" />}
                                {rang === 2 && <Award className="h-4 w-4 text-gray-400" />}
                                {rang === 3 && <Award className="h-4 w-4 text-amber-600" />}
                                {rang > 3 && <span className="text-sm text-gray-400">#{rang}</span>}
                                {rang <= 3 && <span className="text-sm font-bold">{rang}</span>}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-gray-800">{item.eleve_nom || 'Inconnu'}</span>
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              <span className="text-sm text-gray-500 font-mono">
                                {item.eleve_matricule || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <span className="text-sm">{item.matiere_nom || '-'}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`text-lg ${getMoyenneColor(moyenne)}`}>
                                {moyenne.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center hidden lg:table-cell">
                              <span className="text-sm text-gray-500">{item.nombre_evaluations || 0}</span>
                            </td>
                            <td className="py-3 px-4 hidden xl:table-cell">
                              <span className={`text-sm ${getMoyenneColor(moyenne)}`}>
                                {getMention(moyenne)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">{getTendance(moyenne)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {totalFiltered > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-sm text-gray-500">
                      {startIndex + 1} - {endIndex} sur {totalFiltered} résultat(s)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
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
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 border rounded transition ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <select
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
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
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">
              {!classeId ? 'Sélectionnez une classe' : 'Sélectionnez une période'}
            </h3>
            <p className="text-gray-500">
              {!classeId
                ? 'Choisissez une classe pour voir les moyennes'
                : 'Choisissez une période pour voir les moyennes'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoyennesMatieres;