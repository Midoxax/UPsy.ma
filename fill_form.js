/**
 * Playwright script to fill the Soleterre form for Mehdi FELJI
 * Run: node fill_form.js
 *
 * FIRST RUN: Set INSPECT_ONLY=true to screenshot the form before filling
 * Then set INSPECT_ONLY=false to actually fill it
 */

const { chromium } = require('playwright');

const FORM_URL = 'https://soleterre.dinoapp.io/forms/f4361379-0cfa-4c20-9338-b4b209258488';
const INSPECT_ONLY = process.env.INSPECT_ONLY === 'true';
const HEADLESS = process.env.HEADLESS === 'true';

// ─── DATA from CSV ──────────────────────────────────────────────────────────
const sessions = [
  // ── Jan 2025 ──
  { etablissement: 'Rabat Mohamed V',  date: '06/01/2025', filiere: 'Électricité Automobile',                                                                nbBenef: 24,  realise: true,  theme: 'CULTIVER L\'OPTIMISME 1' },
  { etablissement: 'Salé Tabriquet',   date: '07/01/2025', filiere: 'Electricité et photovoltaïque & Maintenance + Horticulture et aménagement paysager',    nbBenef: 30,  realise: true,  theme: 'CULTIVER L\'OPTIMISME 1' },
  { etablissement: 'Salé Tabriquet',   date: '08/01/2025', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé et soins aux personnes âgées',        nbBenef: 46,  realise: true,  theme: 'CULTIVER L\'OPTIMISME 1' },
  // ── Jan 2026 ──
  { etablissement: 'Rabat Mohamed V',  date: '12/01/2026', filiere: 'Coiffure Femme',                                                                         nbBenef: 32,  realise: true,  theme: 'CULTIVER L\'OPTIMISME 1' },
  { etablissement: 'Rabat Mohamed V',  date: '13/01/2026', filiere: 'electricité automobile',                                                                  nbBenef: 32,  realise: true,  theme: 'CULTIVER L\'OPTIMISME 2' },
  { etablissement: 'Salé Tabriquet',   date: '14/01/2026', filiere: '',                                                                                        nbBenef: null,realise: false, raison: 'jour férier nouvel an amazigh' },
  { etablissement: 'Salé Tabriquet',   date: '15/01/2026', filiere: 'Menuiserie Aluminium + Economie circulaire + & Santé et soins aux personnes âgées',       nbBenef: 38,  realise: true,  theme: 'CULTIVER L\'OPTIMISME 2' },
  { etablissement: 'Rabat Mohamed V',  date: '19/01/2026', filiere: 'coiffure femme + reparation telephone',                                                   nbBenef: 20,  realise: true,  theme: 'CULTIVER L\'OPTIMISME 2' },
  { etablissement: 'Rabat Mohamed V',  date: '20/01/2026', filiere: '',                                                                                        nbBenef: null,realise: false, raison: 'l\'etablissement maintien les examens regionaux, avec les normalisées, on peut pas assurés les séances' },
  { etablissement: 'Salé Tabriquet',   date: '21/01/2026', filiere: '',                                                                                        nbBenef: null,realise: false, raison: 'l\'etablissement maintien les examens regionaux, avec les normalisées, on peut pas assurés les séances' },
  { etablissement: 'Salé Tabriquet',   date: '22/01/2026', filiere: '',                                                                                        nbBenef: null,realise: false, raison: 'l\'etablissement maintien les examens regionaux, avec les normalisées, on peut pas assurés les séances' },
  { etablissement: 'Rabat Mohamed V',  date: '23/01/2026', filiere: '',                                                                                        nbBenef: null,realise: false, raison: 'l\'etablissement maintien les examens regionaux, avec les normalisées, on peut pas assurés les séances' },
  // ── Feb 2026 ──
  { etablissement: 'Rabat Mohamed V',  date: '03/02/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 24, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '03/02/2026', filiere: 'Coiffure Femme',                           nbBenef: 10, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '04/02/2026', filiere: 'Mécanique automobile',                     nbBenef: 26, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '04/02/2026', filiere: 'Electricité auto + logistique',            nbBenef: 21, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '05/02/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: 14, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '05/02/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: 10, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '06/02/2026', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé environnementale', nbBenef: 16, realise: true, theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '06/02/2026', filiere: 'Soin des personnes âgées',                 nbBenef: 25, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '09/02/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 20, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '09/02/2026', filiere: 'Coiffure Femme',                           nbBenef: 5,  realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '10/02/2026', filiere: 'Mécanique automobile',                     nbBenef: 20, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '10/02/2026', filiere: 'Electricité auto + logistique',            nbBenef: 24, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '11/02/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: 18, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '11/02/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: 12, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '12/02/2026', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé environnementale', nbBenef: 14, realise: true, theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '12/02/2026', filiere: 'Soin des personnes âgées',                 nbBenef: 25, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '16/02/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 18, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '16/02/2026', filiere: 'Coiffure Femme',                           nbBenef: 8,  realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '17/02/2026', filiere: 'Mécanique automobile',                     nbBenef: 19, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '17/02/2026', filiere: 'Electricité auto + logistique',            nbBenef: 21, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '18/02/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: 15, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '18/02/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: 11, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '19/02/2026', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé environnementale', nbBenef: 13, realise: true, theme: 'Cultiver le Positivisme, Compétences sociales de base + adaptation Ramadan' },
  { etablissement: 'Salé Tabriquet',   date: '19/02/2026', filiere: 'Soin des personnes âgées',                 nbBenef: 22, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base + adaptation Ramadan' },
  // ── Feb 2026 Harcèlement ──
  { etablissement: 'Rabat Mohamed V',  date: '23/02/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 17, realise: true,  theme: 'Atelier thématique Harcelement' },
  { etablissement: 'Rabat Mohamed V',  date: '23/02/2026', filiere: 'Coiffure Femme',                           nbBenef: 12, realise: true,  theme: 'Atelier thématique Harcelement' },
  { etablissement: 'Rabat Mohamed V',  date: '24/02/2026', filiere: 'Mécanique automobile',                     nbBenef: 18, realise: true,  theme: 'Atelier thématique Harcelement' },
  { etablissement: 'Rabat Mohamed V',  date: '24/02/2026', filiere: 'Electricité auto + logistique',            nbBenef: 20, realise: true,  theme: 'Atelier thématique Harcelement' },
  { etablissement: 'Salé Tabriquet',   date: '25/02/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: 14, realise: true,  theme: 'Atelier thématique Harcelement' },
  { etablissement: 'Salé Tabriquet',   date: '25/02/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: 10, realise: true,  theme: 'Atelier thématique Harcelement' },
  { etablissement: 'Salé Tabriquet',   date: '26/02/2026', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé environnementale', nbBenef: 12, realise: true, theme: 'Atelier thématique Harcelement' },
  { etablissement: 'Salé Tabriquet',   date: '26/02/2026', filiere: 'Soin des personnes âgées',                 nbBenef: 21, realise: true,  theme: 'Atelier thématique Harcelement' },
  // ── Mar 2026 ──
  { etablissement: 'Rabat Mohamed V',  date: '02/03/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 12, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '02/03/2026', filiere: 'Coiffure Femme',                           nbBenef: 10, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '03/03/2026', filiere: 'Mécanique automobile',                     nbBenef: 14, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '03/03/2026', filiere: 'Electricité auto + logistique',            nbBenef: 16, realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Salé Tabriquet',   date: '04/03/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: null, realise: false, raison: 'les beneficiaire sont en période de stage' },
  { etablissement: 'Salé Tabriquet',   date: '04/03/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: null, realise: false, raison: 'les beneficiaire sont en période de stage' },
  { etablissement: 'Salé Tabriquet',   date: '05/03/2026', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé environnementale', nbBenef: null, realise: false, raison: 'les beneficiaire sont en période de stage' },
  { etablissement: 'Salé Tabriquet',   date: '05/03/2026', filiere: 'Soin des personnes âgées',                 nbBenef: null, realise: false, raison: 'les beneficiaire sont en période de stage' },
  { etablissement: 'Rabat Mohamed V',  date: '09/03/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: null, realise: false, raison: 'Arrêt Maladie' },
  { etablissement: 'Rabat Mohamed V',  date: '09/03/2026', filiere: 'Coiffure Femme',                           nbBenef: null, realise: false, raison: 'Arrêt Maladie' },
  { etablissement: 'Rabat Mohamed V',  date: '10/03/2026', filiere: 'Mécanique automobile',                     nbBenef: null, realise: false, raison: 'Arrêt Maladie' },
  { etablissement: 'Rabat Mohamed V',  date: '10/03/2026', filiere: 'Electricité auto + logistique',            nbBenef: null, realise: false, raison: 'Arrêt Maladie' },
  { etablissement: 'Salé Tabriquet',   date: '11/03/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: null, realise: false, raison: 'Arrêt Maladie' },
  { etablissement: 'Salé Tabriquet',   date: '11/03/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: null, realise: false, raison: 'Arrêt Maladie' },
  { etablissement: 'Salé Tabriquet',   date: '12/03/2026', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé environnementale', nbBenef: null, realise: false, raison: 'Arrêt Maladie' },
  { etablissement: 'Salé Tabriquet',   date: '12/03/2026', filiere: 'Soin des personnes âgées',                 nbBenef: null, realise: false, raison: 'Arrêt Maladie' },
  { etablissement: 'Rabat Mohamed V',  date: '17/03/2026', filiere: 'Mécanique automobile',                     nbBenef: 8,   realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '17/03/2026', filiere: 'Electricité auto + logistique',            nbBenef: 10,  realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '23/03/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 14,  realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '23/03/2026', filiere: 'Coiffure Femme',                           nbBenef: 11,  realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '24/03/2026', filiere: 'Mécanique automobile',                     nbBenef: 12,  realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '24/03/2026', filiere: 'Electricité auto + logistique',            nbBenef: 11,  realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '30/03/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 13,  realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '30/03/2026', filiere: 'Coiffure Femme',                           nbBenef: 8,   realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '31/03/2026', filiere: 'Mécanique automobile',                     nbBenef: 12,  realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  { etablissement: 'Rabat Mohamed V',  date: '31/03/2026', filiere: 'Electricité auto + logistique',            nbBenef: 9,   realise: true,  theme: 'Cultiver le Positivisme, Compétences sociales de base' },
  // ── Apr 2026 ──
  { etablissement: 'Rabat Mohamed V',  date: '06/04/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 13, realise: true,  theme: 'Inciter le changement & dépasser le bloquage' },
  { etablissement: 'Rabat Mohamed V',  date: '06/04/2026', filiere: 'Coiffure Femme',                           nbBenef: 11, realise: true,  theme: 'Inciter le changement & dépasser le bloquage' },
  { etablissement: 'Rabat Mohamed V',  date: '07/04/2026', filiere: 'Mécanique automobile',                     nbBenef: 9,  realise: true,  theme: 'Inciter le changement & dépasser le bloquage' },
  { etablissement: 'Rabat Mohamed V',  date: '07/04/2026', filiere: 'Electricité auto + logistique',            nbBenef: 12, realise: true,  theme: 'Inciter le changement & dépasser le bloquage' },
  { etablissement: 'Rabat Mohamed V',  date: '13/04/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 12, realise: true,  theme: 'Atelier Thématique Addiction' },
  { etablissement: 'Rabat Mohamed V',  date: '13/04/2026', filiere: 'Coiffure Femme',                           nbBenef: 11, realise: true,  theme: 'Atelier Thématique Addiction' },
  { etablissement: 'Rabat Mohamed V',  date: '13/04/2026', filiere: 'Mécanique automobile',                     nbBenef: 13, realise: true,  theme: 'Atelier Thématique Addiction' },
  { etablissement: 'Rabat Mohamed V',  date: '13/04/2026', filiere: 'Electricité auto + logistique',            nbBenef: 10, realise: true,  theme: 'Atelier Thématique Addiction' },
  { etablissement: 'Salé Tabriquet',   date: '15/04/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: 12, realise: true,  theme: 'Atelier Thématique Addiction' },
  { etablissement: 'Salé Tabriquet',   date: '15/04/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: 8,  realise: true,  theme: 'Atelier Thématique Addiction' },
  { etablissement: 'Salé Tabriquet',   date: '16/04/2026', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé environnementale', nbBenef: 18, realise: true, theme: 'Atelier Thématique Addiction' },
  { etablissement: 'Salé Tabriquet',   date: '17/04/2026', filiere: 'Soin des personnes âgées',                 nbBenef: 24, realise: true,  theme: 'Atelier Thématique Addiction et revision atelier harsselement' },
  { etablissement: 'Rabat Mohamed V',  date: '20/04/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 9,  realise: true,  theme: 'Atelier Thématique Addiction et revision atelier harsselement' },
  { etablissement: 'Rabat Mohamed V',  date: '20/04/2026', filiere: 'Coiffure Femme',                           nbBenef: 6,  realise: true,  theme: 'Atelier Thématique Addiction et revision atelier harsselement' },
  { etablissement: 'Rabat Mohamed V',  date: '21/04/2026', filiere: 'Mécanique automobile',                     nbBenef: 9,  realise: true,  theme: 'Atelier Thématique Addiction et revision atelier harsselement' },
  { etablissement: 'Rabat Mohamed V',  date: '21/04/2026', filiere: 'Electricité auto + logistique',            nbBenef: 8,  realise: true,  theme: 'Atelier Thématique Addiction et revision atelier harsselement' },
  { etablissement: 'Salé Tabriquet',   date: '22/04/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: 6,  realise: true,  theme: 'Atelier Thématique Addiction et revision atelier harsselement' },
  { etablissement: 'Salé Tabriquet',   date: '22/04/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: 3,  realise: true,  theme: 'Atelier Thématique Addiction et revision atelier harsselement' },
  { etablissement: 'Salé Tabriquet',   date: '23/04/2026', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé environnementale', nbBenef: 12, realise: true, theme: 'Atelier Thématique Addiction et revision atelier harsselement' },
  { etablissement: 'Salé Tabriquet',   date: '24/04/2026', filiere: 'Soin des personnes âgées',                 nbBenef: 7,  realise: true,  theme: 'Atelier Thématique Addiction et revision atelier harsselement' },
  { etablissement: 'Rabat Mohamed V',  date: '27/04/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 8,  realise: true,  theme: 'Connaitre une émotion et savoir la typologer et la gérer' },
  { etablissement: 'Rabat Mohamed V',  date: '27/04/2026', filiere: 'Coiffure Femme',                           nbBenef: 7,  realise: true,  theme: 'Connaitre une émotion et savoir la typologer et la gérer' },
  { etablissement: 'Rabat Mohamed V',  date: '28/04/2026', filiere: 'Mécanique automobile',                     nbBenef: 5,  realise: true,  theme: 'Connaitre une émotion et savoir la typologer et la gérer' },
  { etablissement: 'Rabat Mohamed V',  date: '28/04/2026', filiere: 'Electricité auto + logistique',            nbBenef: 6,  realise: true,  theme: 'Connaitre une émotion et savoir la typologer et la gérer' },
  { etablissement: 'Salé Tabriquet',   date: '28/04/2026', filiere: 'Entreprenariat et montage des projets',    nbBenef: 26, realise: true,  theme: 'Entreprenariat et montage des projets, les compétences transversales chez un entrepreneur et les softs skills' },
  { etablissement: 'Salé Tabriquet',   date: '28/04/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: 7,  realise: true,  theme: 'les compétences émotionnels' },
  { etablissement: 'Salé Tabriquet',   date: '28/04/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: 4,  realise: true,  theme: 'les compétences émotionnels' },
  // ── May 2026 ──
  { etablissement: 'Salé Tabriquet',   date: '01/05/2026', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé environnementale', nbBenef: 3,  realise: true, theme: 'les compétences émotionnels' },
  { etablissement: 'Salé Tabriquet',   date: '02/05/2026', filiere: 'Soin des personnes âgées',                 nbBenef: 17, realise: true,  theme: 'les compétences émotionnels et savoir gérer ses émotions' },
  { etablissement: 'Salé Tabriquet',   date: '03/05/2026', filiere: 'Soin des personnes âgées - Nouveau groupe Avec projet green Bina', nbBenef: 18, realise: true, theme: 'introduction au projet, le projet de vie et le well being en definition' },
  { etablissement: 'Rabat Mohamed V',  date: '11/05/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 3,  realise: true,  theme: 'Passastion MHL Questionnaire, atelier Émotions, gestions des émotions et régulation émotionnel' },
  { etablissement: 'Rabat Mohamed V',  date: '11/05/2026', filiere: 'Coiffure Femme',                           nbBenef: 7,  realise: true,  theme: 'Passastion MHL Questionnaire, atelier Émotions, gestions des émotions et régulation émotionnel' },
  { etablissement: 'Rabat Mohamed V',  date: '12/05/2026', filiere: 'Mécanique automobile',                     nbBenef: 5,  realise: true,  theme: 'Passastion MHL Questionnaire, atelier Émotions, gestions des émotions et régulation émotionnel' },
  { etablissement: 'Rabat Mohamed V',  date: '12/05/2026', filiere: 'Electricité auto + logistique',            nbBenef: 5,  realise: true,  theme: 'Passastion MHL Questionnaire, atelier Émotions, gestions des émotions et régulation émotionnel' },
  { etablissement: 'Salé Tabriquet',   date: '13/05/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: 4,  realise: true,  theme: 'Passastion MHL Questionnaire, atelier Émotions, gestions des émotions et régulation émotionnel' },
  { etablissement: 'Salé Tabriquet',   date: '13/05/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: 8,  realise: true,  theme: 'Passastion MHL Questionnaire, atelier Émotions, gestions des émotions et régulation émotionnel' },
  { etablissement: 'Salé Tabriquet',   date: '14/05/2026', filiere: 'Menuiserie Aluminium + Economie circulaire & Santé environnementale', nbBenef: 7, realise: true, theme: 'Passastion MHL Questionnaire, atelier Émotions, gestions des émotions et régulation émotionnel' },
  { etablissement: 'Salé Tabriquet',   date: '15/05/2026', filiere: 'Soin des personnes âgées',                 nbBenef: 14, realise: true,  theme: 'Passastion MHL Questionnaire, atelier Émotions, gestions des émotions et régulation émotionnel' },
  { etablissement: 'Salé Tabriquet',   date: '15/05/2026', filiere: 'Soin des personnes âgées Nouveau groupe',  nbBenef: 11, realise: true,  theme: 'Passastion MHL Questionnaire, atelier Émotions, gestions des émotions et régulation émotionnel' },
  { etablissement: 'Rabat Mohamed V',  date: '18/05/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 5,  realise: true,  theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Rabat Mohamed V',  date: '18/05/2026', filiere: 'Coiffure Femme',                           nbBenef: 7,  realise: true,  theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Rabat Mohamed V',  date: '19/05/2026', filiere: 'Mécanique automobile',                     nbBenef: 4,  realise: true,  theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Rabat Mohamed V',  date: '19/05/2026', filiere: 'Electricité auto + logistique',            nbBenef: 4,  realise: true,  theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Salé Tabriquet',   date: '20/05/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: 3,  realise: true,  theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Salé Tabriquet',   date: '20/05/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: 5,  realise: true,  theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Salé Tabriquet',   date: '21/05/2026', filiere: 'Menuiserie Aluminium',                     nbBenef: 4,  realise: true,  theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Salé Tabriquet',   date: '21/05/2026', filiere: 'Economie circulaire & Santé environnementale', nbBenef: 5, realise: true, theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Salé Tabriquet',   date: '22/05/2026', filiere: 'Soin des personnes âgées',                 nbBenef: 9,  realise: true,  theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Salé Tabriquet',   date: '22/05/2026', filiere: 'Soin des personnes âgées Nouveau groupe',  nbBenef: 8,  realise: true,  theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Rabat Mohamed V',  date: '25/05/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 3,  realise: true,  theme: 'atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Rabat Mohamed V',  date: '25/05/2026', filiere: 'Coiffure Femme',                           nbBenef: 4,  realise: true,  theme: 'atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Rabat Mohamed V',  date: '26/05/2026', filiere: 'Mécanique automobile',                     nbBenef: 2,  realise: true,  theme: 'atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Rabat Mohamed V',  date: '26/05/2026', filiere: 'Electricité auto + logistique',            nbBenef: 2,  realise: true,  theme: 'atelier thématique régulation émotionnel et compétences' },
  // ── Jun 2026 ──
  { etablissement: 'Rabat Mohamed V',  date: '01/06/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 4,  realise: true,  theme: 'Atelier thématique developpement identitaite + atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Rabat Mohamed V',  date: '01/06/2026', filiere: 'Coiffure Femme',                           nbBenef: 6,  realise: true,  theme: 'Atelier thématique developpement identitaite + atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Rabat Mohamed V',  date: '02/06/2026', filiere: 'Mécanique automobile',                     nbBenef: 3,  realise: true,  theme: 'Atelier thématique developpement identitaite + atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Rabat Mohamed V',  date: '02/06/2026', filiere: 'Electricité auto + logistique',            nbBenef: 3,  realise: true,  theme: 'Atelier thématique developpement identitaite + atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Salé Tabriquet',   date: '03/06/2026', filiere: 'Electricité et photovoltaïque',            nbBenef: 7,  realise: true,  theme: 'atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Salé Tabriquet',   date: '03/06/2026', filiere: 'Horticulture et aménagement paysager',     nbBenef: 8,  realise: true,  theme: 'atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Salé Tabriquet',   date: '04/06/2026', filiere: 'Menuiserie Aluminium',                     nbBenef: 7,  realise: true,  theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Salé Tabriquet',   date: '04/06/2026', filiere: 'Economie circulaire & Santé environnementale', nbBenef: 5, realise: true, theme: 'Atelier thématique developpement identitaite' },
  { etablissement: 'Salé Tabriquet',   date: '05/06/2026', filiere: 'Soin des personnes âgées',                 nbBenef: 20, realise: true,  theme: 'atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Salé Tabriquet',   date: '05/06/2026', filiere: 'Soin des personnes âgées Nouveau groupe',  nbBenef: 8,  realise: true,  theme: 'atelier thématique régulation émotionnel et compétences' },
  { etablissement: 'Rabat Mohamed V',  date: '08/06/2026', filiere: 'Maintenance Tél et Caméra',                nbBenef: 6,  realise: true,  theme: 'les compétences émotionnels et savoir gérer ses émotions (simulation examens)' },
  { etablissement: 'Rabat Mohamed V',  date: '08/06/2026', filiere: 'Coiffure Femme',                           nbBenef: 12, realise: true,  theme: 'les compétences émotionnels et savoir gérer ses émotions (simulation examens)' },
  { etablissement: 'Rabat Mohamed V',  date: '09/06/2026', filiere: 'Mécanique automobile',                     nbBenef: 4,  realise: true,  theme: 'les compétences émotionnels et savoir gérer ses émotions (simulation examens)' },
  { etablissement: 'Rabat Mohamed V',  date: '09/06/2026', filiere: 'Electricité auto + logistique',            nbBenef: 5,  realise: true,  theme: 'les compétences émotionnels et savoir gérer ses émotions (simulation examens)' },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
async function tryFill(page, selector, value) {
  try {
    const el = await page.$(selector);
    if (!el) return false;
    await el.fill(String(value));
    return true;
  } catch { return false; }
}

async function trySelect(page, selector, value) {
  try {
    const el = await page.$(selector);
    if (!el) return false;
    await el.selectOption({ label: value });
    return true;
  } catch {
    try {
      await page.selectOption(selector, { value });
      return true;
    } catch { return false; }
  }
}

async function tryClick(page, selector) {
  try {
    await page.click(selector, { timeout: 3000 });
    return true;
  } catch { return false; }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Opening form...');
  await page.goto(FORM_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: 'form_screenshot_initial.png', fullPage: true });
  console.log('Screenshot saved: form_screenshot_initial.png');

  if (INSPECT_ONLY) {
    // Print all field info so we can map them
    const fields = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('input, select, textarea, label'));
      return all.map(el => ({
        tag: el.tagName,
        type: el.getAttribute('type'),
        name: el.getAttribute('name'),
        id: el.getAttribute('id'),
        placeholder: el.getAttribute('placeholder'),
        text: el.innerText?.substring(0, 60),
        class: el.className?.substring(0, 80)
      }));
    });
    console.log('\n=== FORM FIELDS ===');
    console.log(JSON.stringify(fields, null, 2));
    await browser.close();
    return;
  }

  // ── Actual filling logic ──
  // NOTE: Field selectors below are GUESSES — update them after INSPECT_ONLY run
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    console.log(`\n[${i + 1}/${sessions.length}] ${s.date} | ${s.etablissement} | ${s.filiere}`);

    // Try to add a new row / click "Add" button if form is multi-row
    const addBtn = await page.$('button:has-text("Ajouter"), button:has-text("Add"), [data-action="add"]');
    if (addBtn) await addBtn.click();
    await page.waitForTimeout(500);

    // Fill etablissement — try multiple selector patterns
    const etabFilled =
      await tryFill(page, `input[name*="etablissement"]:last-of-type`, s.etablissement) ||
      await tryFill(page, `input[placeholder*="établissement" i]:last-of-type`, s.etablissement) ||
      await trySelect(page, `select[name*="etablissement"]:last-of-type`, s.etablissement);

    // Fill date
    const dateFilled =
      await tryFill(page, `input[type="date"]:last-of-type`, s.date.split('/').reverse().join('-')) ||
      await tryFill(page, `input[name*="date"]:last-of-type`, s.date) ||
      await tryFill(page, `input[placeholder*="date" i]:last-of-type`, s.date);

    // Fill filiere
    const filiereFilled =
      await tryFill(page, `input[name*="filiere"]:last-of-type`, s.filiere) ||
      await tryFill(page, `input[placeholder*="filière" i]:last-of-type`, s.filiere);

    // Fill nombre beneficiaires
    if (s.nbBenef) {
      await tryFill(page, `input[name*="nombre"]:last-of-type`, s.nbBenef) ||
      await tryFill(page, `input[name*="benef"]:last-of-type`, s.nbBenef);
    }

    // Fill realise (yes/no radio or checkbox)
    if (s.realise) {
      await tryClick(page, `input[value="Oui"]:last-of-type`) ||
      await tryClick(page, `label:has-text("Oui"):last-of-type`);
    } else {
      await tryClick(page, `input[value="Non"]:last-of-type`) ||
      await tryClick(page, `label:has-text("Non"):last-of-type`);
    }

    // Fill raison or theme
    if (!s.realise && s.raison) {
      await tryFill(page, `input[name*="raison"]:last-of-type`, s.raison) ||
      await tryFill(page, `textarea[name*="raison"]:last-of-type`, s.raison);
    }
    if (s.realise && s.theme) {
      await tryFill(page, `input[name*="theme"]:last-of-type`, s.theme) ||
      await tryFill(page, `textarea[name*="theme"]:last-of-type`, s.theme);
    }

    console.log(`  etab:${etabFilled} date:${dateFilled} filiere:${filiereFilled}`);
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: 'form_screenshot_filled.png', fullPage: true });
  console.log('\nDone! Screenshot: form_screenshot_filled.png');

  // Uncomment to submit:
  // await page.click('button[type="submit"], button:has-text("Soumettre"), button:has-text("Submit")');
  // await page.waitForTimeout(2000);
  // await page.screenshot({ path: 'form_submitted.png' });

  await browser.close();
})();
