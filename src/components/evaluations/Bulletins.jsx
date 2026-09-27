// src/components/evaluations/Bulletins.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, X, Search,
  RefreshCw, FileText, Printer, School, User,
  Calendar, BookOpen, Gauge, Award, Star,
  IdCard, Users, FileCheck, File as FileIcon
} from 'lucide-react';

const Bulletins = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // ⭐ Rôle utilisateur
  const [userRole, setUserRole] = useState(null);
  const [currentEleve, setCurrentEleve] = useState(null);
  const isEleve = userRole === 'eleve';

  // Données
  const [bulletin, setBulletin] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [eleveId, setEleveId] = useState(id || '');
  const [periodeId, setPeriodeId] = useState('');
  const [classeId, setClasseId] = useState('');

  // Filtres
  const [searchEleve, setSearchEleve] = useState('');
  const [loadingBulletin, setLoadingBulletin] = useState(false);

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showMessage = (texte, type = 'success') => {
    setMessage(texte);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // ============================================================
  // ⭐ RÉCUPÉRER L'UTILISATEUR CONNECTÉ
  // ============================================================
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

        // 2. Matières
        const matieresRes = await axiosInstance.get('/matieres/', headers);
        let matieresData = [];
        if (Array.isArray(matieresRes.data)) matieresData = matieresRes.data;
        else if (matieresRes.data?.results) matieresData = matieresRes.data.results;
        setMatieres(matieresData);

        // ============================================================
        // ⭐ MODE ÉLÈVE
        // ============================================================
        if (role === 'eleve') {
          const eleve = await fetchMonProfilEleve(headers);

          if (eleve) {
            setCurrentEleve(eleve);
            setEleveId(eleve.id);

            if (periodesData.length > 0) {
              setPeriodeId(periodesData[0].id);
              await loadBulletin(eleve.id, periodesData[0].id, true);
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
            await loadBulletin(id, periodesData[0].id, false);
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
  // ⭐ RÉCUPÉRER LA FICHE ÉLÈVE — /eleves/me/ en priorité
  // ============================================================
  const fetchMonProfilEleve = async (headers) => {
    // Méthode 1 : /eleves/me/ (endpoint canonique)
    try {
      const res = await axiosInstance.get('/eleves/me/', headers);
      if (res.data?.id) {
        return res.data;
      }
    } catch (e) {
      // /eleves/me/ indisponible → fallback
    }

    // Méthode 2 : /eleves/ (déjà filtré par user côté backend)
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
  // CHARGEMENT ÉLÈVES PAR CLASSE (mode admin uniquement)
  // ============================================================
  const loadElevesByClasse = async (classeIdParam) => {
    if (!classeIdParam) {
      setEleves([]);
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
      setBulletin(null);

      if (data.length === 0) {
        showMessage('Aucun élève trouvé dans cette classe', 'info');
      }
    } catch (err) {
      console.error('❌ Erreur chargement élèves:', err);
      setEleves([]);
    }
  };

  // ============================================================
  // CHARGEMENT DU BULLETIN
  // ⭐ isEleveMode : true si c'est un élève connecté
  // ============================================================
  const loadBulletin = async (eleveIdParam, periodeIdParam, isEleveMode = false) => {
    if (!eleveIdParam || !periodeIdParam) {
      showMessage('Veuillez sélectionner un élève et une période', 'info');
      return;
    }

    setLoadingBulletin(true);
    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      // Infos élève
      const eleveRes = await axiosInstance.get(`/eleves/${eleveIdParam}/`, headers);
      const eleve = eleveRes.data;

      // Notes — pour un élève, le backend filtre automatiquement
      const notesRes = await axiosInstance.get(
        isEleveMode ? '/notes/' : `/notes/?eleve=${eleveIdParam}`,
        headers
      );
      let notesData = [];
      if (Array.isArray(notesRes.data)) notesData = notesRes.data;
      else if (notesRes.data?.results) notesData = notesRes.data.results;

      if (notesData.length === 0) {
        setBulletin(null);
        showMessage('Aucune note trouvée pour cet élève', 'info');
        setLoadingBulletin(false);
        return;
      }

      // Évaluations — pour un élève, le backend filtre automatiquement
      const evalRes = await axiosInstance.get(
        isEleveMode
          ? `/evaluations/?periode=${periodeIdParam}`
          : `/evaluations/?periode=${periodeIdParam}`,
        headers
      );
      let evalData = [];
      if (Array.isArray(evalRes.data)) evalData = evalRes.data;
      else if (evalRes.data?.results) evalData = evalRes.data.results;

      if (evalData.length === 0) {
        setBulletin(null);
        showMessage('Aucune évaluation trouvée pour cette période', 'info');
        setLoadingBulletin(false);
        return;
      }

      const evaluationIds = evalData.map(e => e.id);
      const notesPeriode = notesData.filter(n => evaluationIds.includes(n.evaluation));

      if (notesPeriode.length === 0) {
        setBulletin(null);
        showMessage('Aucune note trouvée pour cette période', 'info');
        setLoadingBulletin(false);
        return;
      }

      // Regrouper par matière
      const matieresNotes = {};
      for (const note of notesPeriode) {
        const evaluation = evalData.find(e => e.id === note.evaluation);
        if (!evaluation) continue;

        const matiereId = evaluation.matiere;
        const matiereNom = evaluation.matiere_nom || 'Inconnue';

        if (!matieresNotes[matiereId]) {
          matieresNotes[matiereId] = {
            matiere_id: matiereId,
            matiere_nom: matiereNom,
            notes: [],
            evaluations: []
          };
        }

        if (note.note !== null && note.note !== undefined) {
          matieresNotes[matiereId].notes.push(parseFloat(note.note) || 0);
          matieresNotes[matiereId].evaluations.push({
            id: note.id,
            note: note.note,
            evaluation_id: note.evaluation,
            evaluation_titre: evaluation.titre
          });
        }
      }

      // Moyennes par matière
      const matieresResult = [];
      let totalCoefficients = 0;
      let sommePonderee = 0;

      for (const [matiereId, data] of Object.entries(matieresNotes)) {
        if (data.notes.length > 0) {
          const somme = data.notes.reduce((a, b) => a + b, 0);
          const moyenne = somme / data.notes.length;

          let coefficient = 1;
          try {
            const matiereNiveauRes = await axiosInstance.get(
              `/matieres/${matiereId}/coefficient_par_niveau/?niveau=${eleve.niveau}`,
              headers
            );
            if (matiereNiveauRes.data?.coefficient) {
              coefficient = matiereNiveauRes.data.coefficient;
            }
          } catch (e) {
            coefficient = 1;
          }

          matieresResult.push({
            matiere: data.matiere_nom,
            matiere_id: parseInt(matiereId),
            moyenne: moyenne,
            coefficient: coefficient,
            nombre_evaluations: data.notes.length,
            notes_detail: data.evaluations,
            rang: 0
          });

          totalCoefficients += coefficient;
          sommePonderee += moyenne * coefficient;
        }
      }

      const moyenneGenerale = totalCoefficients > 0 ? sommePonderee / totalCoefficients : 0;

      matieresResult.sort((a, b) => b.moyenne - a.moyenne);
      matieresResult.forEach((item, index) => {
        item.rang = index + 1;
      });

      // ⭐ Moyenne classe + rang : uniquement en mode admin/enseignant
      let moyenneClasse = 0;
      let rang = 0;
      let totalEleves = 0;

      if (!isEleveMode) {
        try {
          const classeElevesRes = await axiosInstance.get(
            `/eleves/?classe=${eleve.classe}&statut=actif`,
            headers
          );
          let classeEleves = [];
          if (Array.isArray(classeElevesRes.data)) classeEleves = classeElevesRes.data;
          else if (classeElevesRes.data?.results) classeEleves = classeElevesRes.data.results;

          totalEleves = classeEleves.length;

          const moyennesClasse = [];
          for (const eleveClasse of classeEleves) {
            if (eleveClasse.id === parseInt(eleveIdParam)) continue;

            try {
              const notesClasseRes = await axiosInstance.get(
                `/notes/?eleve=${eleveClasse.id}`,
                headers
              );
              let notesClasse = [];
              if (Array.isArray(notesClasseRes.data)) notesClasse = notesClasseRes.data;
              else if (notesClasseRes.data?.results) notesClasse = notesClasseRes.data.results;

              const notesClassePeriode = notesClasse.filter(
                n => evaluationIds.includes(n.evaluation)
              );
              if (notesClassePeriode.length > 0) {
                const notesValides = notesClassePeriode.filter(
                  n => n.note !== null && n.note !== undefined
                );
                if (notesValides.length > 0) {
                  const sum = notesValides.reduce(
                    (s, n) => s + (parseFloat(n.note) || 0), 0
                  );
                  moyennesClasse.push(sum / notesValides.length);
                }
              }
            } catch (e) { /* ignore */ }
          }

          if (moyennesClasse.length > 0) {
            const sumClasse = moyennesClasse.reduce((a, b) => a + b, 0);
            moyenneClasse = sumClasse / moyennesClasse.length;
          }

          const toutesMoyennes = [...moyennesClasse, moyenneGenerale];
          toutesMoyennes.sort((a, b) => b - a);
          rang = toutesMoyennes.indexOf(moyenneGenerale) + 1;
        } catch (e) {
          console.warn('Impossible de calculer le rang:', e);
        }
      }

      const bulletinData = {
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
        moyenne_classe: moyenneClasse,
        rang: rang,
        total_eleves: totalEleves,
        total_coefficients: totalCoefficients,
        appreciation: getAppreciation(moyenneGenerale)
      };

      setBulletin(bulletinData);
      showMessage('Bulletin chargé avec succès', 'success');

    } catch (err) {
      console.error('❌ Erreur chargement bulletin:', err);
      if (err.response?.status === 401) {
        showMessage('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showMessage('Erreur lors du chargement du bulletin', 'error');
        setBulletin(null);
      }
    } finally {
      setLoadingBulletin(false);
    }
  };

  const getAppreciation = (moyenne) => {
    if (moyenne >= 16) return 'Excellent travail, continuez avec cette détermination !';
    if (moyenne >= 14) return 'Très bon travail, gardez cette dynamique positive.';
    if (moyenne >= 12) return 'Bon travail, quelques efforts supplémentaires vous permettront de progresser.';
    if (moyenne >= 10) return 'Travail satisfaisant, plus de rigueur et de régularité sont nécessaires.';
    return 'Des efforts supplémentaires sont nécessaires pour atteindre les objectifs.';
  };

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const handleClasseChange = async (e) => {
    const value = e.target.value;
    setClasseId(value);
    setEleveId('');
    setBulletin(null);

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
      loadBulletin(value, periodeId, false);
    } else {
      setBulletin(null);
    }
  };

  const handlePeriodeChange = (e) => {
    const value = e.target.value;
    setPeriodeId(value);
    if (eleveId && value) {
      loadBulletin(eleveId, value, isEleve);
    }
  };

  const handleRecherche = () => {
    if (!classeId) return showMessage('Veuillez sélectionner une classe', 'error');
    if (!eleveId) return showMessage('Veuillez sélectionner un élève', 'error');
    if (!periodeId) return showMessage('Veuillez sélectionner une période', 'error');
    loadBulletin(eleveId, periodeId, false);
  };

  const goToPDF = () => {
    if (!eleveId || !periodeId) {
      showMessage("Veuillez d'abord sélectionner un élève et une période", 'error');
      return;
    }
    navigate(`/bulletins/${eleveId}/pdf?eleve=${eleveId}&periode=${periodeId}`);
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
    if (moyenne >= 16) return { label: 'Très Bien', color: 'text-green-600', icon: Star };
    if (moyenne >= 14) return { label: 'Bien', color: 'text-blue-600', icon: Award };
    if (moyenne >= 12) return { label: 'Assez Bien', color: 'text-orange-500', icon: CheckCircle2 };
    if (moyenne >= 10) return { label: 'Passable', color: 'text-yellow-600', icon: CheckCircle2 };
    return { label: 'Non Admis', color: 'text-red-600', icon: AlertCircle };
  };

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
  // RENDU PRINCIPAL
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
                onClick={() => navigate('/dashboard')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <FileCheck className="h-6 w-6 text-blue-600" />
                {isEleve ? 'Mes Bulletins' : 'Bulletins scolaires'}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <Printer className="h-4 w-4" /> Imprimer
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
                    onClick={goToPDF}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                    disabled={!eleveId || !periodeId}
                  >
                    <FileIcon className="h-4 w-4" /> PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE ADMIN / ENSEIGNANT */}
          {!isEleve && (
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

              <div className="flex items-end gap-2">
                <button
                  onClick={handleRecherche}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!classeId || !eleveId || !periodeId}
                >
                  <Search className="h-4 w-4" /> Consulter
                </button>
                <button
                  onClick={goToPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                  disabled={!eleveId || !periodeId}
                >
                  <FileIcon className="h-4 w-4" /> PDF
                </button>
              </div>

            </div>
          )}

        </div>

        {/* CHARGEMENT */}
        {loadingBulletin && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-500">Chargement du bulletin...</span>
          </div>
        )}

        {/* BULLETIN */}
        {!loadingBulletin && bulletin && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {bulletin.eleve?.nom || 'Élève'}
                  </h2>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <IdCard className="h-4 w-4" />
                      {bulletin.eleve?.matricule || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <School className="h-4 w-4" />
                      {bulletin.eleve?.classe || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {bulletin.periode?.libelle || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {bulletin.moyenne_generale?.toFixed(2) || '0.00'}
                    <span className="text-sm font-normal text-gray-500"> /20</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {(() => {
                      const mention = getMention(bulletin.moyenne_generale || 0);
                      const Icon = mention.icon;
                      return (
                        <span className={`text-sm font-medium ${mention.color} flex items-center gap-1`}>
                          <Icon className="h-4 w-4" /> {mention.label}
                        </span>
                      );
                    })()}
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
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Rang</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Appréciation</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletin.matieres && bulletin.matieres.length > 0 ? (
                    bulletin.matieres.map((matiere, index) => {
                      const moyenne = matiere.moyenne || 0;
                      const mention = getMention(moyenne);
                      const Icon = mention.icon;
                      return (
                        <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {matiere.matiere || 'Sans nom'}
                          </td>
                          <td className={`px-4 py-3 text-center text-lg ${getMoyenneColor(moyenne)}`}>
                            {moyenne.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {matiere.coefficient || 1}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-medium text-gray-600">
                              {matiere.rang ? `#${matiere.rang}` : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm flex items-center gap-1 ${mention.color}`}>
                              <Icon className="h-3 w-3" /> {mention.label}
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
                {bulletin.matieres && bulletin.matieres.length > 0 && (
                  <tfoot>
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <td className="px-4 py-3 font-bold text-gray-700">Total</td>
                      <td className="px-4 py-3 text-center text-xl font-bold text-blue-600">
                        {bulletin.moyenne_generale?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {bulletin.total_coefficients || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-gray-600">
                          {bulletin.rang ? `#${bulletin.rang}` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const mention = getMention(bulletin.moyenne_generale || 0);
                          const Icon = mention.icon;
                          return (
                            <span className={`text-sm font-medium flex items-center gap-1 ${mention.color}`}>
                              <Icon className="h-4 w-4" /> {mention.label}
                            </span>
                          );
                        })()}
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
                  <p className="font-bold text-gray-800">{bulletin.matieres?.length || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total coefficients</span>
                  <p className="font-bold text-gray-800">{bulletin.total_coefficients || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Moyenne classe</span>
                  <p className="font-bold text-blue-600">
                    {bulletin.moyenne_classe > 0
                      ? bulletin.moyenne_classe.toFixed(2)
                      : (isEleve ? 'N/A' : 'N/A')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Rang / {bulletin.total_eleves || 'N/A'}</span>
                  <p className="font-bold text-purple-600">
                    {bulletin.rang
                      ? `${bulletin.rang} / ${bulletin.total_eleves || '?'}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {bulletin.appreciation && (
              <div className="border-t border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Appréciation générale
                </h3>
                <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                  "{bulletin.appreciation}"
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-400">
                Bulletin généré le {new Date().toLocaleDateString('fr-FR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
              <button
                onClick={goToPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm"
              >
                <FileIcon className="h-4 w-4" /> Voir en PDF
              </button>
            </div>
          </div>
        )}

        {/* ÉTATS VIDES */}
        {!loadingBulletin && !bulletin && isEleve && currentEleve && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Aucun bulletin disponible</h3>
            <p className="text-gray-500">
              {periodeId
                ? 'Aucune note trouvée pour cette période'
                : 'Sélectionnez une période pour voir votre bulletin'}
            </p>
          </div>
        )}

        {!loadingBulletin && !bulletin && !isEleve && eleveId && periodeId && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Aucun bulletin disponible</h3>
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

export default Bulletins;