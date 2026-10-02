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


import EtablissementSettings from './components/settings/EtablissementSettings';
  


// Modules Logistique/Catégories
import Categories from './components/logistique/Categories';
import CategoryForm from './components/logistique/CategoryForm';
import CategoryDetails from './components/logistique/CategoryDetails';

// Modules Produits
import ProductsList from './components/logistique/ProductsList';
import ProductForm from './components/logistique/ProductForm';
import ProductDetails from './components/logistique/ProductDetails';
import UnitesMesure from './components/logistique/UnitesMesure';
import UniteMesureForm from './components/logistique/UniteMesureForm';

// Modules Stocks
import StocksList from './components/logistique/StocksList';
import LotsList from './components/logistique/LotsList';
import AddStockManual from './components/inventaire/AddStockManual';
import MouvementsStock from './components/logistique/MouvementsStock';


import EntrepotForm from './components/logistique/EntrepotForm';
import Entrepots from './components/logistique/Entrepots';
import EntrepotDetails from './components/logistique/EntrepotDetails';
import Transferts from './components/logistique/Transferts';
import TransfertForm from './components/logistique/TransfertForm';
import TransfertDetails from './components/logistique/TransfertDetails';


// Modules Fournisseurs
import FournisseursList from './components/achatsfournisseurs/FournisseursList';
import FournisseursForm from './components/achatsfournisseurs/FournisseursForm';
import FournisseursDetails from './components/achatsfournisseurs/FournisseursDetails';

// Modules Commandes
import CommandesList from './components/achatsfournisseurs/CommandesList';
import CommandeForm from './components/achatsfournisseurs/CommandeForm';
import CommandeDetails from './components/achatsfournisseurs/CommandeDetails';
import CommandePdf from './components/achatsfournisseurs/CommandePdf';
import ReceptionsList from './components/achatsfournisseurs/ReceptionsList';
import ReceptionForm from './components/achatsfournisseurs/ReceptionForm';
import ReceptionDetails from './components/achatsfournisseurs/ReceptionDetails';
import ReceptionPdf from './components/achatsfournisseurs/ReceptionPdf';



import PurchaseAlerts from './components/achatsfournisseurs/PurchaseAlerts';


















// Dans vos routes :



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
             
               
      


  <Route path="/company-config" element={<EtablissementSettings />} />
 
               
       {/* ==================== PRODUITS ==================== */}

        ,       <Route path="/categories" element={<Categories />} />
                <Route path="/categories/nouveau" element={<CategoryForm />} />
                <Route path="/categories/:id/modifier" element={<CategoryForm />} />
                <Route path="/categories/:id" element={<CategoryDetails />} />
                <Route path="/produits" element={<ProductsList />} />
                <Route path="/produits/nouveau" element={<ProductForm />} />
                <Route path="/produits/:id/modifier" element={<ProductForm />} />
                <Route path="/produits/:id" element={<ProductDetails />} />

                <Route path="/stocks" element={<StocksList />} />
                <Route path="/lots" element={<LotsList />} />

                <Route path="/unites-mesure" element={<UnitesMesure />} />
                <Route path="/unites-mesure/nouveau" element={<UniteMesureForm />} />
                <Route path="/unites-mesure/:id/modifier" element={<UniteMesureForm />} />

                <Route path="/add-stock-manual" element={<AddStockManual />} />
                <Route path="/mouvements-stock" element={<MouvementsStock />} />

                  <Route path="/entrepots" element={<Entrepots />} />
                <Route path="/entrepots/nouveau" element={<EntrepotForm />} />
                <Route path="/entrepots/:id/modifier" element={<EntrepotForm />} />
                <Route path="/entrepots/:id" element={<EntrepotDetails />} />

                <Route path="/transferts" element={<Transferts />} />
                <Route path="/transferts/nouveau" element={<TransfertForm />} />
                <Route path="/transferts/:id" element={<TransfertDetails />} />


                
            

                {/* ==================== ACHATS & FOURNISSEURS ==================== */}
                <Route path="/fournisseurs" element={<FournisseursList />} />
                <Route path="/fournisseurs/nouveau" element={<FournisseursForm />} />
                <Route path="/fournisseurs/:id/modifier" element={<FournisseursForm />} />
                <Route path="/fournisseurs/:id" element={<FournisseursDetails />} />

                {/* Commandes fournisseurs */}
                <Route path="/commandes-fournisseurs" element={<CommandesList />} />
                <Route path="/commandes-fournisseurs/nouveau" element={<CommandeForm />} />
                <Route path="/commandes-fournisseurs/:id/modifier" element={<CommandeForm />} />
                <Route path="/commandes-fournisseurs/:id" element={<CommandeDetails />} />
                <Route path="/commandes-fournisseurs/:id/pdf" element={<CommandePdf />} />

                <Route path="/receptions" element={<ReceptionsList />} />
                <Route path="/receptions/nouveau" element={<ReceptionForm />} />
                <Route path="/receptions/:id" element={<ReceptionDetails />} />
                <Route path="/receptions/:id/pdf" element={<ReceptionPdf />} />

                <Route path="/purchase-alerts" element={<PurchaseAlerts />} />
                
             
      



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