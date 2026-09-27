// src/components/evaluations/ReleveNotes.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, X, Search,
  User, IdCard, Calendar, BookOpen, FileText,
  Printer, Download, RefreshCw, School, Gauge
} from 'lucide-react';

const ReleveNotes = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const [userRole, setUserRole] = useState(null);
  const [currentEleve, setCurrentEleve] = useState(null);
  const isEleve = userRole === 'eleve';

  const [releve, setReleve] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [classes, setClasses] = useState([]);

  const [classeId, setClasseId] = useState('');
  const [eleveId, setEleveId] = useState(id || '');
  const [periodeId, setPeriodeId] = useState('');

  const [loadingNotes, setLoadingNotes] = useState(false);
  const [searchEleve, setSearchEleve] = useState('');

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showMessage = (texte, type = 'success') => {
    setMessage(texte);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('User');
      return userData ? JSON.parse(userData) : null;
    } catch { return null; }
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

        const user = getCurrentUser();
        const role = user?.role || null;
        setUserRole(role);

        const headers = { headers: { Authorization: `Token ${token}` } };

        // 1. Périodes
        const periodesRes = await axiosInstance.get('/periodes/', headers);
        let periodesData = [];
        if (Array.isArray(periodesRes.data)) periodesData = periodesRes.data;
        else if (periodesRes.data?.results) periodesData = periodesRes.data.results;
        setPeriodes(periodesData);

        // ============================================================
        // MODE ÉLÈVE
        // ============================================================
        if (role === 'eleve') {
          const eleve = await fetchMonProfilEleve(headers);

          if (eleve) {
            setCurrentEleve(eleve);
            setEleveId(eleve.id);

            if (periodesData.length > 0) {
              setPeriodeId(periodesData[0].id);
              await loadReleve(eleve.id, periodesData[0].id, true);
            }
          } else {
            setError("Aucune fiche élève n'est associée à votre compte");
          }

          setLoading(false);
          return;
        }

        // ============================================================
        // MODE ADMIN / ENSEIGNANT
        // ============================================================
        const classesRes = await axiosInstance.get('/classes/?actif=true', headers);
        let classesData = [];
        if (Array.isArray(classesRes.data)) classesData = classesRes.data;
        else if (classesRes.data?.results) classesData = classesRes.data.results;
        setClasses(classesData);

        if (id) {
          setEleveId(id);
          if (periodesData.length > 0) {
            setPeriodeId(periodesData[0].id);
            await loadReleve(id, periodesData[0].id, false);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError('Erreur de chargement des données');
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // ============================================================
  // ⭐ /eleves/me/ EN PRIORITÉ
  // ============================================================
  const fetchMonProfilEleve = async (headers) => {
    try {
      const res = await axiosInstance.get('/eleves/me/', headers);
      if (res.data?.id) return res.data;
    } catch (e) { /* fallback */ }

    try {
      const res = await axiosInstance.get('/eleves/', headers);
      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.results) data = res.data.results;
      if (data.length > 0) return data[0];
    } catch (e) { /* ignore */ }

    return null;
  };

  // ============================================================
  // CHARGEMENT ÉLÈVES PAR CLASSE (admin uniquement)
  // ============================================================
  const loadElevesByClasse = async (classeIdParam) => {
    if (!classeIdParam) {
      setEleves([]);
      setEleveId('');
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      const res = await axiosInstance.get(
        `/eleves/?classe=${classeIdParam}&statut=actif`,
        headers
      );

      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.results) data = res.data.results;

      setEleves(data);
      setEleveId('');

      if (data.length === 0) {
        showMessage('Aucun élève trouvé dans cette classe', 'info');
      }
    } catch (err) {
      console.error('❌ Erreur chargement élèves:', err);
      setEleves([]);
    }
  };

  // ============================================================
  // CHARGEMENT RELEVÉ
  // ⭐ /notes/?eleve=<id> TOUJOURS (filtre côté serveur)
  // ============================================================
  const loadReleve = async (eleveIdParam, periodeIdParam, isEleveMode = false) => {
    if (!eleveIdParam || !periodeIdParam) {
      showMessage('Veuillez sélectionner un élève et une période', 'info');
      return;
    }

    setLoadingNotes(true);
    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      // ⭐ TOUJOURS filtrer par eleve (le backend peut ne pas filtrer seul)
      const notesRes = await axiosInstance.get(
        `/notes/?eleve=${eleveIdParam}`,
        headers
      );

      let notes = [];
      if (Array.isArray(notesRes.data)) notes = notesRes.data;
      else if (notesRes.data?.results) notes = notesRes.data.results;

      if (notes.length === 0) {
        setReleve(null);
        showMessage('Aucune note trouvée pour cet élève', 'info');
        setLoadingNotes(false);
        return;
      }

      // Infos élève
      const eleveRes = await axiosInstance.get(
        isEleveMode ? '/eleves/me/' : `/eleves/${eleveIdParam}/`,
        headers
      );
      const eleve = eleveRes.data;

      // Évaluations de la période
      const evalRes = await axiosInstance.get(
        `/evaluations/?periode=${periodeIdParam}`,
        headers
      );
      let evalData = [];
      if (Array.isArray(evalRes.data)) evalData = evalRes.data;
      else if (evalRes.data?.results) evalData = evalRes.data.results;

      if (evalData.length === 0) {
        setReleve(null);
        showMessage('Aucune évaluation trouvée pour cette période', 'info');
        setLoadingNotes(false);
        return;
      }

      const evaluationIds = evalData.map(e => e.id);

      // Regrouper par matière
      const matieresMap = {};
      let totalCoefficients = 0;
      let sommePonderee = 0;

      for (const note of notes) {
        // ⭐ Ne garder que les notes de cette période
        if (!evaluationIds.includes(note.evaluation)) continue;

        const evaluation = evalData.find(e => e.id === note.evaluation);
        if (!evaluation) continue;

        const matiereId = evaluation.matiere;
        const matiereNom = evaluation.matiere_nom || 'Inconnue';
        const coef = evaluation.coefficient || 1;

        if (!matieresMap[matiereId]) {
          matieresMap[matiereId] = {
            matiere_id: matiereId,
            matiere: matiereNom,
            coefficient: coef,
            notes: [],
            somme: 0,
            count: 0
          };
        }

        if (note.note !== null && note.note !== undefined) {
          matieresMap[matiereId].notes.push({
            id: note.id,
            note: note.note,
            evaluation_titre: evaluation.titre
          });
          matieresMap[matiereId].somme += parseFloat(note.note) || 0;
          matieresMap[matiereId].count += 1;
        }
      }

      const matieresResult = Object.values(matieresMap)
        .filter(m => m.count > 0)
        .map(m => {
          const moyenne = m.somme / m.count;
          totalCoefficients += m.coefficient;
          sommePonderee += moyenne * m.coefficient;
          return {
            matiere: m.matiere,
            matiere_id: m.matiere_id,
            moyenne: moyenne,
            coefficient: m.coefficient,
            notes: m.notes
          };
        });

      if (matieresResult.length === 0) {
        setReleve(null);
        showMessage('Aucune note trouvée pour cette période', 'info');
        setLoadingNotes(false);
        return;
      }

      const moyenneGenerale = totalCoefficients > 0 ? sommePonderee / totalCoefficients : 0;

      const releveData = {
        eleve: {
          id: eleve.id,
          nom: eleve.nom_complet || `${eleve.prenom || ''} ${eleve.nom || ''}`,
          matricule: eleve.matricule || '-',
          classe: eleve.classe_nom || 'N/A'
        },
        periode: {
          id: periodeIdParam,
          libelle: periodes.find(p => p.id === parseInt(periodeIdParam))?.libelle || 'Période',
          annee: periodes.find(p => p.id === parseInt(periodeIdParam))?.annee_libelle || ''
        },
        matieres: matieresResult,
        moyenne_generale: moyenneGenerale,
        moyenne_classe: 0,
        rang: 0,
        total_coefficients: totalCoefficients
      };

      setReleve(releveData);

    } catch (err) {
      console.error('❌ Erreur chargement relevé:', err);
      if (err.response?.status === 404) {
        showMessage('Aucun relevé trouvé pour cet élève', 'info');
        setReleve(null);
      } else if (err.response?.status === 401) {
        showMessage('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showMessage('Erreur lors du chargement du relevé', 'error');
      }
    } finally {
      setLoadingNotes(false);
    }
  };

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const handleClasseChange = async (e) => {
    const value = e.target.value;
    setClasseId(value);
    setEleveId('');
    setReleve(null);

    if (value) {
      await loadElevesByClasse(value);
    } else {
      setEleves([]);
    }
  };

  const handleEleveChange = (e) => {
    const value = e.target.value;
    setEleveId(value);
    if (value && periodeId) {
      loadReleve(value, periodeId, false);
    } else {
      setReleve(null);
    }
  };

  const handlePeriodeChange = (e) => {
    const value = e.target.value;
    setPeriodeId(value);
    if (eleveId && value) {
      loadReleve(eleveId, value, isEleve);
    }
  };

  const handleRecherche = () => {
    if (!classeId) return showMessage('Veuillez sélectionner une classe', 'error');
    if (!eleveId) return showMessage('Veuillez sélectionner un élève', 'error');
    if (!periodeId) return showMessage('Veuillez sélectionner une période', 'error');
    loadReleve(eleveId, periodeId, false);
  };

  const getFilteredEleves = () => {
    if (!searchEleve) return eleves;
    const search = searchEleve.toLowerCase().trim();
    return eleves.filter(e =>
      (e.nom_complet || e.nom || e.prenom || '').toLowerCase().includes(search) ||
      (e.matricule || '').toLowerCase().includes(search)
    );
  };

  const filteredEleves = getFilteredEleves();

  const getNoteColor = (note) => {
    if (note === null || note === undefined || note === '') return 'text-gray-400';
    const val = parseFloat(note);
    if (isNaN(val)) return 'text-gray-400';
    if (val >= 16) return 'text-green-600 font-bold';
    if (val >= 12) return 'text-orange-500 font-bold';
    if (val >= 10) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  // ⭐ Badge coloré pour chaque note individuelle
  const getNoteBadgeClass = (note) => {
    if (note === null || note === undefined || note === '') {
      return 'bg-gray-100 text-gray-500';
    }
    const val = parseFloat(note);
    if (isNaN(val)) return 'bg-gray-100 text-gray-500';
    if (val >= 16) return 'bg-green-100 text-green-700 border border-green-200';
    if (val >= 12) return 'bg-orange-100 text-orange-700 border border-orange-200';
    if (val >= 10) return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    return 'bg-red-100 text-red-700 border border-red-200';
  };

  const getMention = (moyenne) => {
    if (moyenne >= 16) return { label: 'Très Bien', color: 'text-green-600' };
    if (moyenne >= 14) return { label: 'Bien', color: 'text-blue-600' };
    if (moyenne >= 12) return { label: 'Assez Bien', color: 'text-orange-500' };
    if (moyenne >= 10) return { label: 'Passable', color: 'text-yellow-600' };
    return { label: 'Non Admis', color: 'text-red-600' };
  };

  const exportCSV = () => {
    if (!releve || !releve.matieres || releve.matieres.length === 0) {
      showMessage('Aucune donnée à exporter', 'error');
      return;
    }

    const headers = ['Matière', 'Moyenne', 'Coefficient', 'Notes', 'Appréciation'];
    const rows = releve.matieres.map(m => [
      m.matiere || '-',
      m.moyenne || 0,
      m.coefficient || 1,
      (m.notes || []).map(n => n.note ?? '-').join('; '),
      getMention(m.moyenne).label
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `releve_notes_${releve.eleve?.nom || 'eleve'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePrint = () => window.print();

  // ============================================================
  // CHARGEMENT
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
  // RENDU
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {message && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 ${
          messageType === 'error'
            ? 'bg-red-50 border-red-500 text-red-700'
            : messageType === 'info'
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : 'bg-green-50 border-green-500 text-green-700'
        }`}>
          {messageType === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
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
                onClick={() => navigate(isEleve ? '/releve-notes' : '/dashboard')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                {isEleve ? 'Mon Relevé de Notes' : 'Relevé de notes'}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <Printer className="h-4 w-4" /> Imprimer
              </button>
              <button
                onClick={exportCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
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

          {/* MODE ÉLÈVE */}
          {isEleve && currentEleve && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-1">
                  <User className="h-4 w-4" /> Élève connecté
                </div>
                <p className="font-bold text-gray-800">
                  {currentEleve.nom_complet || `${currentEleve.prenom} ${currentEleve.nom}`}
                </p>
                <p className="text-xs text-gray-600 font-mono">
                  {currentEleve.matricule || '-'} • {currentEleve.classe_nom || 'Sans classe'}
                </p>
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
            </div>
          )}

          {/* MODE ADMIN / ENSEIGNANT */}
          {!isEleve && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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
                {classeId && (
                  <p className="text-xs text-gray-500 mt-1">
                    {eleves.length} élève(s) dans cette classe
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <User className="h-4 w-4" /> Élève *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchEleve}
                    onChange={(e) => setSearchEleve(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!classeId}
                  />
                </div>
                <select
                  value={eleveId}
                  onChange={handleEleveChange}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!classeId || eleves.length === 0}
                >
                  <option value="">Sélectionnez un élève</option>
                  {filteredEleves.map(eleve => (
                    <option key={eleve.id} value={eleve.id}>
                      {eleve.nom_complet || `${eleve.prenom || ''} ${eleve.nom || ''}`}
                      {eleve.matricule && ` (${eleve.matricule})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Période *
                </label>
                <div className="flex gap-2">
                  <select
                    value={periodeId}
                    onChange={handlePeriodeChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez une période</option>
                    {periodes.map(periode => (
                      <option key={periode.id} value={periode.id}>
                        {periode.libelle} {periode.annee_libelle && `- ${periode.annee_libelle}`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleRecherche}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!classeId || !eleveId || !periodeId}
                  >
                    <Search className="h-4 w-4" /> Consulter
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* CHARGEMENT */}
        {loadingNotes && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-500">Chargement du relevé...</span>
          </div>
        )}

        {/* RELEVÉ */}
        {!loadingNotes && releve && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {releve.eleve?.nom || 'Élève'}
                  </h2>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <IdCard className="h-4 w-4" />
                      {releve.eleve?.matricule || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <School className="h-4 w-4" />
                      {releve.eleve?.classe || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {releve.periode?.libelle || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {releve.moyenne_generale?.toFixed(2) || '0.00'}
                    <span className="text-sm font-normal text-gray-500"> /20</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-sm font-medium ${getMention(releve.moyenne_generale || 0).color}`}>
                      {getMention(releve.moyenne_generale || 0).label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      <BookOpen className="h-4 w-4 inline mr-1" /> Matière
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                      <Gauge className="h-4 w-4 inline mr-1" /> Moyenne
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Coef.</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Notes</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Appréciation</th>
                  </tr>
                </thead>
                <tbody>
                  {releve.matieres && releve.matieres.length > 0 ? (
                    releve.matieres.map((matiere, index) => {
                      const moyenne = matiere.moyenne || 0;
                      const mention = getMention(moyenne);

                      return (
                        <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {matiere.matiere || 'Sans nom'}
                          </td>
                          <td className={`px-4 py-3 text-center text-lg ${getNoteColor(moyenne)}`}>
                            {moyenne.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {matiere.coefficient || 1}
                          </td>

                          {/* ⭐ NOTES EN BADGES COLORÉS */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-wrap justify-center gap-1 max-w-xs mx-auto">
                              {matiere.notes && matiere.notes.length > 0 ? (
                                matiere.notes.map((note, i) => (
                                  <span
                                    key={i}
                                    className={`text-xs font-semibold px-2 py-0.5 rounded ${getNoteBadgeClass(note.note)}`}
                                    title={note.evaluation_titre || ''}
                                  >
                                    {note.note ?? '-'}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">Aucune note</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className={`text-sm ${mention.color}`}>
                              {mention.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">
                        Aucune matière trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
                {releve.matieres && releve.matieres.length > 0 && (
                  <tfoot>
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <td className="px-4 py-3 font-bold text-gray-700">Total</td>
                      <td className="px-4 py-3 text-center text-xl font-bold text-blue-600">
                        {releve.moyenne_generale?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {releve.total_coefficients || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">-</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${getMention(releve.moyenne_generale || 0).color}`}>
                          {getMention(releve.moyenne_generale || 0).label}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Nombre de matières</span>
                  <p className="font-bold text-gray-800">{releve.matieres?.length || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total coefficients</span>
                  <p className="font-bold text-gray-800">{releve.total_coefficients || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Moyenne classe</span>
                  <p className="font-bold text-blue-600">
                    {releve.moyenne_classe > 0 ? releve.moyenne_classe.toFixed(2) : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Rang</span>
                  <p className="font-bold text-purple-600">{releve.rang || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ÉTATS VIDES */}
        {!loadingNotes && !releve && isEleve && currentEleve && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Aucun relevé disponible</h3>
            <p className="text-gray-500">
              {periodeId
                ? 'Aucune note trouvée pour cette période'
                : 'Sélectionnez une période pour voir votre relevé'}
            </p>
          </div>
        )}

        {!loadingNotes && !releve && !isEleve && eleveId && periodeId && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Aucun relevé disponible</h3>
            <p className="text-gray-500">
              Aucune note trouvée pour cet élève dans cette période
            </p>
          </div>
        )}

        {!eleveId && !isEleve && classeId && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Sélectionnez un élève</h3>
          </div>
        )}

        {!classeId && !isEleve && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <School className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Sélectionnez une classe</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReleveNotes;