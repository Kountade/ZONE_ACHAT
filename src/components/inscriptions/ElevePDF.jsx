// src/components/inscriptions/ElevePdf.jsx
// Génération PDF d'un élève - Téléchargement et Impression

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  FileText, ChevronLeft, Download, Printer, Loader2,
  Wifi, WifiOff, AlertTriangle,
  User, File as FileIcon, X
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';
import jsPDF from 'jspdf';

// ========== FONCTIONS DE FORMATAGE ==========
const formatNumber = (n) => {
  const num = parseFloat(n) || 0;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatCurrency = (amt) => `${formatNumber(amt)} FCFA`;

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';

const getStatutLabel = (statut) => {
  const map = {
    actif: 'Actif',
    suspendu: 'Suspendu',
    exclu: 'Exclu',
    transfere: 'Transféré',
    diplome: 'Diplômé',
    abandon: 'Abandon'
  };
  return map[statut] || statut;
};

const getSexeLabel = (sexe) => {
  return sexe === 'M' ? 'Masculin' : 'Féminin';
};

// ========== FONCTION DE GÉNÉRATION PDF ÉLÈVE ==========
const generateElevePDF = (eleve) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const margins = { left: 15, right: 15, top: 18, bottom: 18 };
      const contentWidth = pageWidth - margins.left - margins.right;
      let y = margins.top;

      // ========== INFORMATIONS DE L'ENTREPRISE ==========
      const company = {
        name: 'SEYDI GROUP',
        address: 'Dakar, Sénégal',
        phone: '+221 33 123 45 67',
        email: 'contact@seydigroup.com',
        rccm: 'SN DKR 2023 B 123',
        capital: '10 000 000 FCFA'
      };

      // ========== DONNÉES ÉLÈVE ==========
      const matricule = eleve.matricule || `ELV-${String(eleve.id).padStart(6, '0')}`;
      const nom = eleve.nom || 'Nom non renseigné';
      const prenom = eleve.prenom || 'Prénom non renseigné';
      const statut = eleve.statut || 'actif';
      const sexe = eleve.sexe || 'M';
      const dateNaissance = eleve.date_naissance || '';
      const lieuNaissance = eleve.lieu_naissance || '';
      const nationalite = eleve.nationalite || 'Sénégalaise';
      const age = eleve.age || '';
      
      const email = eleve.email || '';
      const telephone = eleve.telephone || '';
      const adresse = eleve.adresse || '';
      
      const niveauNom = eleve.niveau_nom || '';
      const classeNom = eleve.classe_nom || '';
      const anneeScolaire = eleve.annee_scolaire_libelle || '';
      const dateInscription = eleve.date_inscription || '';
      const dateSortie = eleve.date_sortie || '';
      
      const inscriptionComplete = eleve.inscription_complete || false;
      
      // Parents
      const nomPere = eleve.nom_pere || '';
      const professionPere = eleve.profession_pere || '';
      const telephonePere = eleve.telephone_pere || '';
      
      const nomMere = eleve.nom_mere || '';
      const professionMere = eleve.profession_mere || '';
      const telephoneMere = eleve.telephone_mere || '';
      
      const nomTuteur = eleve.nom_tuteur || '';
      const professionTuteur = eleve.profession_tuteur || '';
      const telephoneTuteur = eleve.telephone_tuteur || '';
      
      const situationFamiliale = eleve.situation_familiale || 'pere';
      const situationLabels = {
        pere: 'Père',
        mere: 'Mère',
        tuteur: 'Tuteur',
        autre: 'Autre'
      };
      
      // Médical
      const groupeSanguin = eleve.groupe_sanguin || '';
      const allergie = eleve.allergie || '';
      const maladie = eleve.maladie || '';
      const personneAContacter = eleve.personne_a_contacter || '';
      const telephoneUrgence = eleve.telephone_urgence || '';
      
      // Financier
      const solde = eleve.compte_client_details?.solde || 0;
      const totalDu = eleve.situation_financiere_simple?.total_du || 0;
      const totalPaye = eleve.situation_financiere_simple?.total_paye || 0;
      const situationFinanciere = eleve.situation_financiere_simple?.situation || 'Normal';
      
      // Observations
      const observations = eleve.observations || '';

      const statutLabel = getStatutLabel(statut);
      const sexeLabel = getSexeLabel(sexe);

      // ================================================================
      // EN-TÊTE
      // ================================================================
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('SEYDI GROUP', margins.left, y + 5);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(`Capital social : ${company.capital}`, margins.left, y + 10);
      doc.text(`N° RCCM : ${company.rccm}`, margins.left, y + 14);
      doc.text(company.address.toUpperCase(), margins.left, y + 18);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('FICHE D\'ÉLÈVE', pageWidth - margins.right, y + 5, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(`N° ${matricule}`, pageWidth - margins.right, y + 10, { align: 'right' });
      doc.text(`Émis le ${formatDate(new Date().toISOString())}`, pageWidth - margins.right, y + 14, { align: 'right' });

      y += 27;
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.4);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 8;

      // ================================================================
      // GRILLE D'INFORMATIONS PRINCIPALES
      // ================================================================
      const gridY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, gridY, contentWidth, 24, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, gridY, contentWidth, 24, 2, 2, 'S');

      const colWidth = contentWidth / 4;
      const gridX1 = margins.left;
      const gridX2 = margins.left + colWidth;
      const gridX3 = margins.left + colWidth * 2;
      const gridX4 = margins.left + colWidth * 3;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      
      doc.text('NOM', gridX1 + 4, gridY + 4.5);
      doc.text('PRÉNOM', gridX2 + 4, gridY + 4.5);
      doc.text('STATUT', gridX3 + 4, gridY + 4.5);
      doc.text('SEXE', gridX4 + 4, gridY + 4.5);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text(nom, gridX1 + 4, gridY + 13);
      doc.text(prenom, gridX2 + 4, gridY + 13);
      
      const statutColor = statut === 'actif' ? [0, 150, 0] : 
                          statut === 'diplome' ? [33, 150, 243] :
                          statut === 'suspendu' ? [255, 193, 7] : [158, 158, 158];
      doc.setTextColor(statutColor[0], statutColor[1], statutColor[2]);
      doc.text(statutLabel, gridX3 + 4, gridY + 13);
      doc.setTextColor(26, 35, 126);
      doc.text(sexeLabel, gridX4 + 4, gridY + 13);

      // Deuxième ligne : matricule, inscription, âge, nationalité
      const gridY2 = gridY + 24;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, gridY2, contentWidth, 18, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, gridY2, contentWidth, 18, 2, 2, 'S');

      const gridX5 = margins.left;
      const gridX6 = margins.left + colWidth;
      const gridX7 = margins.left + colWidth * 2;
      const gridX8 = margins.left + colWidth * 3;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('MATRICULE', gridX5 + 4, gridY2 + 4.5);
      doc.text('INSCRIPTION', gridX6 + 4, gridY2 + 4.5);
      doc.text('ÂGE', gridX7 + 4, gridY2 + 4.5);
      doc.text('NATIONALITÉ', gridX8 + 4, gridY2 + 4.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(matricule, gridX5 + 4, gridY2 + 13);
      doc.text(
        inscriptionComplete ? 'Complète' : 'À compléter',
        gridX6 + 4, gridY2 + 13
      );
      doc.text(age ? `${age} ans` : '-', gridX7 + 4, gridY2 + 13);
      doc.text(nationalite, gridX8 + 4, gridY2 + 13);

      y = gridY2 + 22;

      // ================================================================
      // SECTION CONTACT
      // ================================================================
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('CONTACT', margins.left, y);
      y += 2;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 6;

      const contactY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, contactY, contentWidth, 24, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, contactY, contentWidth, 24, 2, 2, 'S');

      const contactColW = contentWidth / 3;
      const contactX1 = margins.left;
      const contactX2 = margins.left + contactColW;
      const contactX3 = margins.left + contactColW * 2;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('TÉLÉPHONE', contactX1 + 4, contactY + 4.5);
      doc.text('EMAIL', contactX2 + 4, contactY + 4.5);
      doc.text('ADRESSE', contactX3 + 4, contactY + 4.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(telephone || '-', contactX1 + 4, contactY + 13);
      doc.text(email || '-', contactX2 + 4, contactY + 13);
      
      const addrLines = doc.splitTextToSize(adresse || '-', contactColW - 8);
      doc.text(addrLines, contactX3 + 4, contactY + 9);

      y = contactY + 30;

      // ================================================================
      // SECTION SCOLAIRE
      // ================================================================
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('INFORMATIONS SCOLAIRES', margins.left, y);
      y += 2;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 6;

      const scolariteY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, scolariteY, contentWidth, 24, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, scolariteY, contentWidth, 24, 2, 2, 'S');

      const scolColW = contentWidth / 4;
      const scolX1 = margins.left;
      const scolX2 = margins.left + scolColW;
      const scolX3 = margins.left + scolColW * 2;
      const scolX4 = margins.left + scolColW * 3;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('NIVEAU', scolX1 + 4, scolariteY + 4.5);
      doc.text('CLASSE', scolX2 + 4, scolariteY + 4.5);
      doc.text('ANNÉE SCOLAIRE', scolX3 + 4, scolariteY + 4.5);
      doc.text('DATE INSCRIPTION', scolX4 + 4, scolariteY + 4.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(niveauNom || '-', scolX1 + 4, scolariteY + 13);
      doc.text(classeNom || '-', scolX2 + 4, scolariteY + 13);
      doc.text(anneeScolaire || '-', scolX3 + 4, scolariteY + 13);
      doc.text(formatDate(dateInscription), scolX4 + 4, scolariteY + 13);

      y = scolariteY + 28;

      // ================================================================
      // SECTION PARENTS
      // ================================================================
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('PARENTS / TUTEURS', margins.left, y);
      y += 2;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 6;

      const parentY = y;
      const parentColW = contentWidth / 3;
      
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, parentY, contentWidth, 45, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, parentY, contentWidth, 45, 2, 2, 'S');

      // Père
      const pX1 = margins.left;
      const pX2 = margins.left + parentColW;
      const pX3 = margins.left + parentColW * 2;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('PÈRE', pX1 + 4, parentY + 4.5);
      doc.text('MÈRE', pX2 + 4, parentY + 4.5);
      doc.text('TUTEUR', pX3 + 4, parentY + 4.5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      
      // Père
      let pereText = nomPere || '-';
      if (professionPere) pereText += ` (${professionPere})`;
      if (telephonePere) pereText += `\nTel: ${telephonePere}`;
      const pereLines = doc.splitTextToSize(pereText, parentColW - 8);
      doc.text(pereLines, pX1 + 4, parentY + 10);
      
      // Mère
      let mereText = nomMere || '-';
      if (professionMere) mereText += ` (${professionMere})`;
      if (telephoneMere) mereText += `\nTel: ${telephoneMere}`;
      const mereLines = doc.splitTextToSize(mereText, parentColW - 8);
      doc.text(mereLines, pX2 + 4, parentY + 10);
      
      // Tuteur
      let tuteurText = nomTuteur || '-';
      if (professionTuteur) tuteurText += ` (${professionTuteur})`;
      if (telephoneTuteur) tuteurText += `\nTel: ${telephoneTuteur}`;
      const tuteurLines = doc.splitTextToSize(tuteurText, parentColW - 8);
      doc.text(tuteurLines, pX3 + 4, parentY + 10);

      // Situation familiale
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('SITUATION FAMILIALE', margins.left + 4, parentY + 38);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(situationLabels[situationFamiliale] || situationFamiliale, margins.left + 4, parentY + 42);

      y = parentY + 50;

      // ================================================================
      // SECTION MÉDICAL
      // ================================================================
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('INFORMATIONS MÉDICALES', margins.left, y);
      y += 2;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 6;

      const medicalY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, medicalY, contentWidth, 30, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, medicalY, contentWidth, 30, 2, 2, 'S');

      const medColW = contentWidth / 3;
      const medX1 = margins.left;
      const medX2 = margins.left + medColW;
      const medX3 = margins.left + medColW * 2;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('GROUPE SANGUIN', medX1 + 4, medicalY + 4.5);
      doc.text('ALLERGIES', medX2 + 4, medicalY + 4.5);
      doc.text('MALADIES CHRONIQUES', medX3 + 4, medicalY + 4.5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(groupeSanguin || 'Non spécifié', medX1 + 4, medicalY + 13);
      
      const allergieLines = doc.splitTextToSize(allergie || 'Aucune', medColW - 8);
      doc.text(allergieLines, medX2 + 4, medicalY + 9);
      
      const maladieLines = doc.splitTextToSize(maladie || 'Aucune', medColW - 8);
      doc.text(maladieLines, medX3 + 4, medicalY + 9);

      y = medicalY + 35;

      // ================================================================
      // SECTION CONTACT URGENCE
      // ================================================================
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('CONTACT D\'URGENCE', margins.left, y);
      y += 2;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 6;

      const urgenceY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, urgenceY, contentWidth, 18, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, urgenceY, contentWidth, 18, 2, 2, 'S');

      const urgenceColW = contentWidth / 2;
      const urgX1 = margins.left;
      const urgX2 = margins.left + urgenceColW;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('PERSONNE À CONTACTER', urgX1 + 4, urgenceY + 4.5);
      doc.text('TÉLÉPHONE', urgX2 + 4, urgenceY + 4.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(personneAContacter || '-', urgX1 + 4, urgenceY + 13);
      doc.text(telephoneUrgence || '-', urgX2 + 4, urgenceY + 13);

      y = urgenceY + 22;

      // ================================================================
      // SECTION FINANCIÈRE
      // ================================================================
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 35, 126);
      doc.text('SITUATION FINANCIÈRE', margins.left, y);
      y += 2;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 6;

      const financeY = y;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, financeY, contentWidth, 24, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, financeY, contentWidth, 24, 2, 2, 'S');

      const finColW = contentWidth / 4;
      const finX1 = margins.left;
      const finX2 = margins.left + finColW;
      const finX3 = margins.left + finColW * 2;
      const finX4 = margins.left + finColW * 3;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 144, 156);
      doc.text('TOTAL DÛ', finX1 + 4, financeY + 4.5);
      doc.text('TOTAL PAYÉ', finX2 + 4, financeY + 4.5);
      doc.text('SOLDE', finX3 + 4, financeY + 4.5);
      doc.text('SITUATION', finX4 + 4, financeY + 4.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(totalDu), finX1 + 4, financeY + 13);
      doc.text(formatCurrency(totalPaye), finX2 + 4, financeY + 13);
      
      const soldeColor = solde > 0 ? [244, 67, 54] : [76, 175, 80];
      doc.setTextColor(soldeColor[0], soldeColor[1], soldeColor[2]);
      doc.text(formatCurrency(solde), finX3 + 4, financeY + 13);
      doc.setTextColor(33, 33, 33);
      
      const situationColor = situationFinanciere === 'Normal' ? [76, 175, 80] : [244, 67, 54];
      doc.setTextColor(situationColor[0], situationColor[1], situationColor[2]);
      doc.text(situationFinanciere, finX4 + 4, financeY + 13);
      doc.setTextColor(33, 33, 33);

      y = financeY + 28;

      // ================================================================
      // SECTION OBSERVATIONS
      // ================================================================
      if (observations) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 35, 126);
        doc.text('OBSERVATIONS', margins.left, y);
        y += 2;
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.line(margins.left, y, pageWidth - margins.right, y);
        y += 6;

        const obsY = y;
        const obsLines = doc.splitTextToSize(observations, contentWidth - 12);
        const obsHeight = Math.max(18, obsLines.length * 5 + 10);
        
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margins.left, obsY, contentWidth, obsHeight, 2, 2, 'F');
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.roundedRect(margins.left, obsY, contentWidth, obsHeight, 2, 2, 'S');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33);
        doc.text(obsLines, margins.left + 6, obsY + 6);

        y = obsY + obsHeight + 6;
      }

      // ================================================================
      // SIGNATURES
      // ================================================================
      if (y < pageHeight - margins.bottom - 40) {
        const signatureY = y + 8;
        const signatureWidth = 85;
        const signatureX1 = margins.left;
        const signatureX2 = pageWidth - margins.right - signatureWidth;

        doc.setDrawColor(66, 66, 66);
        doc.setLineWidth(0.5);
        doc.line(signatureX1, signatureY + 5, signatureX1 + signatureWidth, signatureY + 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(84, 110, 122);
        doc.text('Signature du Chef d\'établissement', signatureX1 + (signatureWidth / 2), signatureY, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 144, 156);
        doc.text('Nom et date', signatureX1 + (signatureWidth / 2), signatureY + 12, { align: 'center' });

        doc.line(signatureX2, signatureY + 5, signatureX2 + signatureWidth, signatureY + 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(84, 110, 122);
        doc.text('Signature du Parent/Tuteur', signatureX2 + (signatureWidth / 2), signatureY, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 144, 156);
        const parentSignature = nomPere || nomMere || nomTuteur || 'Parent';
        doc.text(parentSignature, signatureX2 + (signatureWidth / 2), signatureY + 12, { align: 'center' });
      }

      // ================================================================
      // PIED DE PAGE
      // ================================================================
      const footerY = pageHeight - margins.bottom - 10;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, footerY - 5, pageWidth - margins.right, footerY - 5);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 144, 156);
      doc.text('SEYDI GROUP - DAKAR, SÉNÉGAL', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Tél: ${company.phone} - Email: ${company.email}`, pageWidth / 2, footerY + 4, { align: 'center' });
      doc.text(`RCCM: ${company.rccm}`, pageWidth / 2, footerY + 8, { align: 'center' });

      // ================================================================
      // NUMÉROTATION DES PAGES
      // ================================================================
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 170);
        doc.text(`Page ${i}/${pageCount}`, pageWidth - margins.right, pageHeight - margins.bottom, { align: 'right' });
      }

      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);

    } catch (error) {
      reject(error);
    }
  });
};

// ========== COMPOSANT PRINCIPAL ==========
function ElevePdf() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [eleve, setEleve] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const iframeRef = useRef(null);

  // Surveiller la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Charger les données et générer le PDF
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Charger l'élève
        const eleveRes = await AxiosInstance.get(`/eleves/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setEleve(eleveRes.data);

        // Générer le PDF automatiquement
        await generatePDF(eleveRes.data);

      } catch (error) {
        console.error('❌ Erreur chargement:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else if (error.response?.status === 404) {
          setError('Élève non trouvé');
        } else {
          setError('Erreur lors du chargement de l\'élève');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }

    // Nettoyer l'URL blob
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [id, navigate]);

  // Générer le PDF
  const generatePDF = async (eleveData) => {
    if (!eleveData) return;
    
    setGenerating(true);
    try {
      const blob = await generateElevePDF(eleveData);

      // Créer une URL pour le blob
      const url = URL.createObjectURL(blob);
      
      // Nettoyer l'ancienne URL
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      
      setPdfBlobUrl(url);

      // Charger dans l'iframe
      if (iframeRef.current) {
        iframeRef.current.src = url;
      }

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      setError('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  // ✅ Télécharger le PDF
  const handleDownload = () => {
    if (pdfBlobUrl) {
      const link = document.createElement('a');
      const matricule = eleve?.matricule || `ELV-${String(eleve?.id || '').padStart(6, '0')}`;
      link.href = pdfBlobUrl;
      link.download = `Eleve_${matricule}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // ✅ Imprimer le PDF
  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.print();
      } catch (e) {
        // Fallback: ouvrir dans un nouvel onglet pour imprimer
        if (pdfBlobUrl) {
          const win = window.open(pdfBlobUrl, '_blank');
          win?.focus();
        }
      }
    }
  };

  // ✅ Régénérer le PDF
  const handleRegenerate = async () => {
    await generatePDF(eleve);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-base-content/60">Chargement de l'élève...</p>
        </div>
      </div>
    );
  }

  if (error || !eleve) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-lg font-medium">{error || 'Élève non trouvé'}</h3>
          <Link to="/eleves" className="btn btn-primary mt-4">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-88px)] flex flex-col bg-base-200">
      
      {/* ✅ Barre d'outils */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-base-100 border-b border-base-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/eleves/${id}`)}
            className="btn btn-ghost btn-sm btn-square"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Aperçu PDF</h1>
              <p className="text-xs text-base-content/60">
                {eleve.matricule} - {eleve.prenom} {eleve.nom}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
          
          <div className="divider divider-horizontal mx-0 h-6"></div>
          
          {/* ✅ BOUTON TÉLÉCHARGER */}
          <button
            onClick={handleDownload}
            className="btn btn-sm btn-success gap-1.5"
            disabled={!pdfBlobUrl || generating}
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>
          
          {/* ✅ BOUTON IMPRIMER */}
          <button
            onClick={handlePrint}
            className="btn btn-sm btn-primary gap-1.5"
            disabled={!pdfBlobUrl || generating}
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          
          {/* ✅ BOUTON RÉGÉNÉRER */}
          <button
            onClick={handleRegenerate}
            className="btn btn-sm btn-ghost gap-1.5"
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {generating ? 'Génération...' : 'Régénérer'}
          </button>
        </div>
      </div>

      {/* ✅ APERÇU PDF */}
      <div className="flex-1 bg-base-200 p-2 overflow-hidden">
        {generating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
              <p className="text-base-content/60">Génération du PDF en cours...</p>
            </div>
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfBlobUrl}
            className="w-full h-full rounded-lg shadow-lg border border-base-200 bg-white"
            title="Aperçu de l'élève"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
              <p className="text-base-content/60">Aucun aperçu disponible</p>
              <button
                onClick={handleRegenerate}
                className="btn btn-primary btn-sm mt-4 gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Générer le PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ElevePdf;