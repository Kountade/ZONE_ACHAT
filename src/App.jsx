// App.jsx - Version avec Site Web + ERP Scolaire
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';

// ============ COMPOSANTS SITE WEB (Pages Publiques) ============
import HomePage from './components/site/HomePage';
import AboutPage from './components/site/AboutPage';
import ProgrammesPage from './components/site/ProgrammesPage';
import ContactPage from './components/site/ContactPage';
import BlogPage from './components/site/BlogPage';
import BlogDetail from './components/site/BlogDetail';
import GalleryPage from './components/site/GalleryPage';
import EventsPage from './components/site/EventsPage';
import AdmissionsPage from './components/site/AdmissionsPage';
import TeamPage from './components/site/TeamPage';

// ============ COMPOSANTS AUTHENTIFICATION ============
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import PasswordResetRequest from './components/auth/PasswordResetRequest';
import PasswordReset from './components/auth/PasswordReset';

// ============ COMPOSANTS ERP ADMIN ============
import Navbar from './components/Navbar';
import ProtectedRoute from './components/common/ProtectedRoutes';
import DashboardGlobal from './components/dashboard/DashboardGlobal';

  import EtablissementSettings from './components/settings/EtablissementSettings';
  import AnneeScolaireManager from './components/settings/AnneeScolaireManager';

import GestionNiveaux from './components/academic/GestionNiveaux';
import GestionNiveauForm from './components/academic/GestionNiveauForm';

import GestionMatieres from './components/academic/GestionMatieres';
import GestionMatieresForm from './components/academic/GestionMatieresForm';
import GestionMatieresDetail from './components/academic/GestionMatieresDetail';

import GestionSalles from './components/academic/GestionSalles';
import GestionSallesForm from './components/academic/GestionSallesForm';

import GestionClasses from './components/academic/GestionClasses';
import GestionClassesForm from './components/academic/GestionClassesForm';
import GestionClassesDetail from './components/academic/GestionClassesDetail';
import GestionClassesPDF from './components/academic/GestionClassesPdf';

import GestionCours from './components/academic/GestionCours';
import GestionCoursForm from './components/academic/GestionCoursForm';

import GestionProfesseurs from './components/academic/GestionProfesseurs';
import GestionProfesseursForm from './components/academic/GestionProfesseursForm';

import EmploiDuTemps from './components/academic/EmploiDuTemps';
import EmploiDuTempsPdf from './components/academic/EmploiDuTempsPdf';
import EmploiDuTempsAjustable from './components/academic/EmploiDuTempsAjustable';
import EmploiDuTempsAnnuel from './components/academic/EmploiDuTempsAnnuel';

import EmploiDuTempsProfesseur from './components/academic/EmploiDuTempsProfesseur';

// Dans votre fichier de routes
import Eleves from './components/inscriptions/Eleves';
import EleveForm from './components/inscriptions/EleveForm';
import EleveDetail from './components/inscriptions/EleveDetail';
import ElevePdf from './components/inscriptions/ElevePDF';
import InscriptionDetail from './components/inscriptions/InscriptionDetail';


import Semestres from './components/evaluations/Semestres';
import SemestreForm from './components/evaluations/SemestreForm';
import SemestreDetail from './components/evaluations/SemestreDetail';
import SemestrePDF from './components/evaluations/SemestrePDF';
import TypesEvaluation from './components/evaluations/TypesEvaluation';
import TypeEvaluationForm from './components/evaluations/TypeEvaluationForm';
import EvaluationsList from './components/evaluations/EvaluationsList';
import EvaluationForm from './components/evaluations/EvaluationForm';
import EvaluationDetail from './components/evaluations/EvaluationDetail';







import NotesList from './components/evaluations/NotesList';
import NoteForm from './components/evaluations/NoteForm';

import ReleveNotes from './components/evaluations/ReleveNotes';

import MoyennesMatieres from './components/evaluations/MoyennesMatieres';


import Bulletins from './components/evaluations/Bulletins';
import BulletinPDF from './components/evaluations/BulletinPDF';
import MoyennesGenerales from './components/evaluations/MoyennesGenerales';
import MoyennesGeneralesPdf from './components/evaluations/MoyennesGeneralesPdf';
import Classement from './components/evaluations/Classement';
import ClassementPdf from './components/evaluations/ClassementPdf';

// Dans votre fichier de routes (App.jsx)


import TypesAbsence from './components/absences/TypesAbsence';
import TypeAbsenceForm from './components/absences/TypeAbsenceForm';
import Absences from './components/absences/Absences';
import AbsenceForm from './components/absences/AbsenceForm';
import Appels from './components/absences/Appels';
import AppelForm from './components/absences/AppelForm';
import AppelDetail from './components/absences/AppelDetail';
import AbsencesProfesseurs from './components/absences/AbsencesProfesseurs';
import AbsenceProfesseurForm from './components/absences/AbsenceProfesseurForm';





import EditeurBulletins from './pages/EditeurBulletins';
import EditeurConvocations from './pages/EditeurConvocations';





// Routes pour les élèves
import EleveInscriptions from './components/inscriptions/EleveInscriptions';
import InscriptionForm from './components/inscriptions/InscriptionForm';
import InscriptionPdf from './components/inscriptions/InscriptionPdf';
import GestionClassesPdf from './components/academic/GestionClassesPdf';

import NiveauxTarifs from './components/comptabilite/NiveauxTarifs';
import NiveauxTarifForm from './components/comptabilite/NiveauxTarifForm';

import ComptesClients from './components/comptabilite/ComptesClients';
import CompteClientDetail from './components/comptabilite/CompteClientDetail';
import CompteClientTransactions from './components/comptabilite/CompteClientTransactions';
import TransactionCreate from './components/comptabilite/TransactionCreate';
import Transactions from './components/comptabilite/Transactions';
import TransactionForm from './components/comptabilite/TransactionForm';
import TransactionDetail from './components/comptabilite/TransactionDetail';

import Caisses from './components/comptabilite/Caisses';
import CaisseForm from './components/comptabilite/CaisseForm';
import CaisseDetail from './components/comptabilite/CaisseDetail';

import PlanComptable from './components/comptabilite/PlanComptable';
import PlanComptableForm from './components/comptabilite/PlanComptableForm';
import PlanComptableDetail from './components/comptabilite/PlanComptableDetail';

import Echeances from './components/comptabilite/Echeances';
import EcheanceForm from './components/comptabilite/EcheanceForm';
import EcheanceDetail from './components/comptabilite/EcheanceDetail';

import Categories from './components/publicsite/Categories';
import CategoryForm from './components/publicsite/CategoryForm';
import CategoryDetail from './components/publicsite/CategoryDetail';

import Articles from './components/publicsite/Articles';
import ArticleForm from './components/publicsite/ArticleForm';
import ArticleDetail from './components/publicsite/ArticleDetail';

import GalerieListe from './components/publicsite/GalerieListe';
import GalerieForm from './components/publicsite/GalerieForm';
import Partenaires from './components/publicsite/Partenaires';
import PartenaireForm from './components/publicsite/PartenaireForm';
import Temoignages from './components/publicsite/Temoignages';
import TemoignageForm from './components/publicsite/TemoignageForm';

import Programmes from './components/publicsite/Programmes';
import ProgrammeForm from './components/publicsite/ProgrammeForm';
import ProgrammeDetail from './components/publicsite/ProgrammeDetail';






















import Utilisateurs from './components/users/Utilisateurs';
import UtilisateurForm from './components/users/UtilisateurForm';
import UtilisateurDetail from './components/users/UtilisateurDetail';
import Profile from './components/users/Profile';


// Dans vos routes :

 {/* Pages d'authentification 
// ============ PARAMÈTRES ============
import Utilisateurs from './components/parametres/Utilisateurs';
import Roles from './components/parametres/Roles';
import SystemSettings from './components/parametres/SystemSettings';
import AuditLog from './components/parametres/AuditLog';
import Notifications from './components/parametres/Notifications';
import DocumentTemplates from './components/parametres/DocumentTemplates';
import Backups from './components/parametres/Backups'; */}
 {/* Pages d'authentification 
// ============ PROFIL ============
import Profile from './components/profile/Profile';
import MyNotifications from './components/profile/MyNotifications';
import MyPreferences from './components/profile/MyPreferences';
import Support from './components/profile/Support';*/}

function App() {
  const location = useLocation();
  
  // Routes publiques (sans Navbar)
  const publicRoutes = [
    "/", 
    "/register", 
    "/login",
    "/about",
    "/programmes",
    "/contact",
    "/blog",
    "/blog/:id",
    "/gallery",
    "/events",
    "/admissions",
    "/services"
    
  ];
  
  const noNavBar = publicRoutes.includes(location.pathname) || 
                   location.pathname.includes("password") ||
                   location.pathname.startsWith("/blog/");

  return (
    <>
      {noNavBar ? (
        // ========== ROUTES PUBLIQUES (SITE WEB) ==========
        <Routes>
          {/* Pages du site web */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/programmes" element={<ProgrammesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/admissions" element={<AdmissionsPage />} />
           <Route path="/team" element={<TeamPage />} />
          {/* Pages d'authentification */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/request/password_reset" element={<PasswordResetRequest />} />
          <Route path="/password-reset/:token" element={<PasswordReset />} />
        </Routes>
      ) : (
        // ========== ROUTES PRIVÉES (ERP ADMIN) ==========
        <Navbar
          content={
            <Routes>
              <Route element={<ProtectedRoute />}>
             
               
              <Route path="/dashboard" element={<DashboardGlobal />} />


  <Route path="/parametres-etablissement" element={<EtablissementSettings />} />
  <Route path="/annee-scolaire" element={<AnneeScolaireManager />} />

<Route path="/niveaux" element={<GestionNiveaux />} />
<Route path="/niveaux/nouveau" element={<GestionNiveauForm />} />
<Route path="/niveaux/:id/modifier" element={<GestionNiveauForm />} />
<Route path="/niveaux/:id" element={<GestionNiveauForm />} /> {/* Détails (optionnel) */}


<Route path="/matieres" element={<GestionMatieres />} />
<Route path="/matieres/nouveau" element={<GestionMatieresForm />} />
<Route path="/matieres/:id" element={<GestionMatieresDetail />} />
<Route path="/matieres/:id/modifier" element={<GestionMatieresForm />} />
                 
<Route path="/salles" element={<GestionSalles />} />
<Route path="/salles/nouveau" element={<GestionSallesForm />} />
<Route path="/salles/:id/modifier" element={<GestionSallesForm />} />
<Route path="/salles/:id" element={<GestionSallesForm />} /> 

<Route path="/classes" element={<GestionClasses />} />
<Route path="/classes/nouveau" element={<GestionClassesForm />} />
<Route path="/classes/:id/modifier" element={<GestionClassesForm />} />
<Route path="/classes/:id" element={<GestionClassesDetail />} />
<Route path="/classes/:id/pdf" element={<GestionClassesPDF />} />

<Route path="/cours" element={<GestionCours />} />
<Route path="/cours/nouveau" element={<GestionCoursForm />} />
<Route path="/cours/:id/modifier" element={<GestionCoursForm />} />



<Route path="/professeurs" element={<GestionProfesseurs />} />
<Route path="/professeurs/ajout" element={<GestionProfesseursForm />} />
<Route path="/professeurs/:id/modifier" element={<GestionProfesseursForm />} />
<Route path="/professeurs/:id" element={<GestionProfesseursForm />} />  {/* optionnel détails */}


<Route path="/emplois-temps" element={<EmploiDuTemps />} />
<Route path="/emploi-du-temps-ajustable" element={<EmploiDuTempsAjustable />} />
<Route path="/emploi-temps-annuel" element={<EmploiDuTempsAnnuel />} />
<Route path="/professeur-emploi-temps" element={<EmploiDuTempsProfesseur />} />


<Route path="/eleves" element={<Eleves />} />
<Route path="/eleves/:id" element={<EleveDetail />} />
<Route path="/eleves/:id/modifier" element={<EleveForm />} />
<Route path="/eleves/:id/pdf" element={<ElevePdf />} />
<Route path="/eleves/nouveau" element={<EleveForm />} />


 <Route path="/inscriptions" element={<EleveInscriptions />} />
  <Route path="/inscriptions/nouveau" element={<InscriptionForm />} />
  <Route path="/inscriptions/:id/modifier" element={<InscriptionForm />} />
    <Route path="/inscriptions/:id/pdf" element={<InscriptionPdf />} />
    <Route path="/inscriptions/:id" element={<InscriptionDetail />} />


{/* ============ COMPTABILITÉ ============ */}
<Route path="/niveaux-tarifs" element={<NiveauxTarifs />} />
<Route path="/niveaux-tarifs/nouveau" element={<NiveauxTarifForm />} />
<Route path="/niveaux-tarifs/modifier/:id" element={<NiveauxTarifForm />} />
<Route path="/niveaux-tarifs/:id" element={<NiveauxTarifForm />} />




                {/* Gestion Scolaire */}

                




 <Route path="/periodes" element={<Semestres />} />
  <Route path="/periodes/nouveau" element={<SemestreForm />} />
  <Route path="/periodes/:id/modifier" element={<SemestreForm />} />
    <Route path="/periodes/:id/pdf" element={<SemestrePDF />} />
    <Route path="/periodes/:id" element={<SemestreDetail />} />

{/* Types d'évaluation */}
  <Route path="/types-evaluation" element={<TypesEvaluation />} />
   <Route path="/types-evaluation/nouveau" element={<TypeEvaluationForm />} />
     <Route path="/types-evaluation/:id/modifier" element={<TypeEvaluationForm />} />

    {/*
 
  <Route path="/types-evaluation/:id" element={<TypeEvaluationForm />} />
 
  <Route path="/evaluations/:id" element={<EvaluationDetail />} />


   {/* Évaluations */}
  <Route path="/evaluations" element={<EvaluationsList />} />
  <Route path="/evaluations/:id/modifier" element={<EvaluationForm />} />
  <Route path="/evaluations/nouveau" element={<EvaluationForm />} />   
  <Route path="/evaluations/:id" element={<EvaluationDetail />} />  






<Route path="/types-absence" element={<TypesAbsence />} />
<Route path="/types-absence/nouveau" element={<TypeAbsenceForm />} />
<Route path="/types-absence/:id/modifier" element={<TypeAbsenceForm />} />
<Route path="/absences" element={<Absences />} />
<Route path="/absences/nouveau" element={<AbsenceForm />} />
<Route path="/absences/:id/modifier" element={<AbsenceForm />} />

<Route path="/appels" element={<Appels />} />
<Route path="/appels/nouveau" element={<AppelForm />} />
<Route path="/appels/:id/editer" element={<AppelForm />} />
<Route path="/appels/:id" element={<AppelDetail />} />


<Route path="/absences-professeurs" element={<AbsencesProfesseurs />} />
<Route path="/absences-professeurs/nouveau" element={<AbsenceProfesseurForm />} />
<Route path="/absences-professeurs/:id/modifier" element={<AbsenceProfesseurForm />} />
{/* Notes
 <Route path="notes" element={<NotesList />} />
<Route path="notes/saisie" element={<NoteForm />} />
<Route path="evaluations/:id/notes" element={<NoteForm />} />
*/}
<Route path="notes" element={<NotesList />} />
<Route path="/notes/saisie" element={<NoteForm />} />
 <Route path="/releve-notes/:id" element={<ReleveNotes />} />
 <Route path="/releve-notes" element={<ReleveNotes />} />
<Route path="/moyennes-matieres" element={<MoyennesMatieres />} />
<Route path="/bulletins" element={<Bulletins />} />
<Route path="/bulletins/:id" element={<Bulletins />} />
<Route path="/bulletins/:id/pdf" element={<BulletinPDF />} />




<Route path="/moyennes-generales" element={<MoyennesGenerales />} />
<Route path="/moyennes-generales/:id/pdf" element={<MoyennesGeneralesPdf />} />

<Route path="/classement" element={<Classement />} />
<Route path="/classement/:id/pdf" element={<ClassementPdf />} />











<Route path="/comptes-clients" element={<ComptesClients />} />
<Route path="/comptes-clients/:id" element={<CompteClientDetail />} />
<Route path="/comptes-clients/:id/transactions" element={<CompteClientTransactions />} />
<Route path="/comptes-clients/:id/transactions/ajouter" element={<TransactionCreate />} />
<Route path="/transactions" element={<Transactions />} />
<Route path="/transactions/nouveau" element={<TransactionForm />} />
<Route path="/transactions/:id" element={<TransactionDetail />} />




<Route path="/echeances" element={<Echeances />} />
<Route path="/echeances/nouveau" element={<EcheanceForm />} />
<Route path="/echeances/:id" element={<EcheanceDetail />} />
<Route path="/echeances/:id/modifier" element={<EcheanceForm />} />
              
                
                {/* Notes & Évaluations */}





<Route path="/caisses" element={<Caisses />} />
<Route path="/caisses/nouveau" element={<CaisseForm />} />
<Route path="/caisses/:id/modifier" element={<CaisseForm />} />
<Route path="/caisses/:id" element={<CaisseDetail />} />




<Route path="/plan-comptable" element={<PlanComptable />} />
<Route path="/plan-comptable/nouveau" element={<PlanComptableForm />} />
<Route path="/plan-comptable/:id" element={<PlanComptableDetail />} />
<Route path="/plan-comptable/:id/modifier" element={<PlanComptableForm />} />
  {/* Présences 
<Route path="/plan-comptable/nouveau" element={<PlanComptableForm />} />
<Route path="/plan-comptable/:id" element={<PlanComptableDetail />} />
<Route path="/plan-comptable/:id/modifier" element={<PlanComptableForm />} />
                
                {/* Présences 
                <Route path="/appels" element={<Appels />} />
                <Route path="/absences" element={<Absences />} />
                <Route path="/mes-absences" element={<MesAbsences />} />
                <Route path="/justifications" element={<Justifications />} />
                <Route path="/statistiques-presences" element={<StatistiquesPresences />} />
                <Route path="/retards" element={<Retards />} />*/}
                
                {/* Gestion Financière
                <Route path="/dashboard-finances" element={<DashboardFinances />} />
                <Route path="/frais-scolaires" element={<FraisScolaires />} />
                <Route path="/paiements" element={<Paiements />} />
                <Route path="/facturation" element={<Facturation />} />
                <Route path="/tresorerie" element={<Tresorerie />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/depenses" element={<Depenses />} />
                <Route path="/rapports-financiers" element={<RapportsFinanciers />} /> */}
                
      

  {/* Catégories */}
  <Route path="/categories" element={<Categories />} />
  <Route path="/categories/nouveau" element={<CategoryForm />} />
  <Route path="/categories/:id" element={<CategoryDetail />} />
  <Route path="/categories/:id/modifier" element={<CategoryForm />} />
     
           



  {/* Articles */}
  <Route path="/articles" element={<Articles />} />
  <Route path="/articles/nouveau" element={<ArticleForm />} />
  <Route path="/articles/:id" element={<ArticleDetail />} />
  <Route path="/articles/:id/modifier" element={<ArticleForm />} />


  <Route path="/galerie" element={<GalerieListe />} />
  <Route path="galerie/nouveau" element={<GalerieForm />} />
  <Route path="/galerie//:id/modifier" element={<ArticleForm />} />

<Route path="/partenaires" element={<Partenaires />} />
<Route path="/partenaires/nouveau" element={<PartenaireForm />} />
<Route path="/partenaires/:id/modifier" element={<PartenaireForm />} />

<Route path="/temoignages" element={<Temoignages />} />
<Route path="/temoignages/nouveau" element={<TemoignageForm />} />
<Route path="/temoignages/:id" element={<TemoignageForm />} />
<Route path="/temoignages/:id/modifier" element={<TemoignageForm />} />


<Route path="/programes" element={<Programmes />} />
<Route path="/programes/nouveau" element={<ProgrammeForm />} />
<Route path="/programes/:id" element={<ProgrammeDetail />} />
<Route path="/programes/:id/modifier" element={<ProgrammeForm />} />



                
<Route path="/utilisateurs" element={<Utilisateurs />} />
<Route path="/utilisateurs/:id" element={<UtilisateurDetail />} />
<Route path="/utilisateurs/:id/modifier" element={<UtilisateurForm />} />
<Route path="utilisateurs/nouveau" element={<UtilisateurForm />} />
<Route path="profile" element={<Profile />} />

<Route path="/editeur-bulletins" element={<EditeurBulletins />} />
<Route path="/editeur-convocations" element={<EditeurConvocations />} />

                {/* Profil  />*/}


              </Route>
            </Routes>
          }
        />
      )}
    </>
  );
}

export default App;