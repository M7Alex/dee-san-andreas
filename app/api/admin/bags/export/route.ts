export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb } from '@/lib/github-db'

export async function GET(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { db } = await readDb()
  const isFullAccess = session.role === 'superadmin' || session.role === 'admin'
  const bag = db.bags.find((b: { id: string; ownerId: string }) => b.id === id && (isFullAccess || b.ownerId === session.userId))
  if (!bag) return NextResponse.json({ error: 'BAG introuvable' }, { status: 404 })

  try {
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      Header, Footer, HeadingLevel, AlignmentType, BorderStyle, WidthType,
      ShadingType, LevelFormat, TabStopType, TabStopPosition, PageNumber,
    } = await import('docx')

    const NAVY = '0D1B3E', GOLD = 'C9A227', RED = 'C0392B'
    const GREY = '6B6B6B', BLACK = '1A1A1A', AMBER = '8B6914'
    const WHITE = 'FFFFFF', LGREY = 'F5F5F5', MGREY = 'E8E8E8'
    const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 1134
    const CW = PAGE_W - MARGIN * 2

    const bThin = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' }
    const borders = { top: bThin, bottom: bThin, left: bThin, right: bThin }
    const cm = { top: 80, bottom: 80, left: 120, right: 120 }

    function cb(key: string): string {
      return (bag as Record<string, unknown>).checkboxes && ((bag as Record<string, unknown>).checkboxes as Record<string, boolean>)[key] ? '☑' : '☐'
    }

    function p(text: string, opts: { bold?: boolean; color?: string; sz?: number; before?: number; after?: number; align?: string; italic?: boolean } = {}) {
      return new Paragraph({
        alignment: opts.align as AlignmentType | undefined,
        spacing: { before: opts.before ?? 40, after: opts.after ?? 40 },
        children: [new TextRun({ text, bold: opts.bold, italic: opts.italic, color: opts.color ?? BLACK, size: opts.sz ?? 20, font: 'Arial' })]
      })
    }

    function pPh(text: string) { return p(text, { color: AMBER, italic: true }) }
    function pBody(text: string) { return p(text, { color: BLACK }) }

    function h1(text: string) {
      return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 },
        children: [new TextRun({ text, bold: true, size: 28, color: NAVY, font: 'Arial' })] })
    }
    function h2(text: string) {
      return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 },
        children: [new TextRun({ text, bold: true, size: 22, color: GOLD, font: 'Arial' })] })
    }
    function h3(text: string) {
      return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 },
        children: [new TextRun({ text, bold: true, size: 20, color: NAVY, font: 'Arial' })] })
    }
    function blank() { return new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun('')] }) }

    function bullet(text: string) {
      return new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, font: 'Arial', size: 20, color: BLACK })] })
    }

    function fieldRow(label: string, value: string, lw = 3200) {
      return new TableRow({ children: [
        new TableCell({ borders, margins: cm, width: { size: lw, type: WidthType.DXA }, shading: { fill: LGREY, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, font: 'Arial', color: BLACK })] })] }),
        new TableCell({ borders, margins: cm, width: { size: CW - lw, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: value || '[ — ]', size: 18, font: 'Arial', color: value ? BLACK : AMBER })] })] }),
      ]})
    }

    function hdrRow(cols: { text: string; w: number }[]) {
      return new TableRow({ tableHeader: true, children: cols.map(({ text, w }) =>
        new TableCell({ borders, margins: cm, width: { size: w, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, color: WHITE, font: 'Arial' })] })] }))
      })
    }

    function dRow(cells: { text: string; w: number; bold?: boolean; color?: string; bg?: string }[]) {
      return new TableRow({ children: cells.map(({ text, w, bold, color, bg }) =>
        new TableCell({ borders, margins: cm, width: { size: w, type: WidthType.DXA }, shading: { fill: bg ?? WHITE, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: text || '[ — ]', bold, size: 18, font: 'Arial', color: color ?? BLACK })] })] }))
      })
    }

    function noteBox(label: string, content: string) {
      return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [1200, CW - 1200],
        rows: [new TableRow({ children: [
          new TableCell({ borders, margins: cm, width: { size: 1200, type: WidthType.DXA }, shading: { fill: GOLD, type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, font: 'Arial', color: WHITE })] })] }),
          new TableCell({ borders, margins: cm, width: { size: CW - 1200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: content, size: 18, font: 'Arial', color: BLACK })] })] }),
        ]})]
      })
    }

    const ba = bag as Record<string, unknown>
    const bx = (ba.checkboxes ?? {}) as Record<string, boolean>
    const v = (k: string, fb = '') => (ba[k] as string) || fb

    // FOOTER commun
    function makeFooter() {
      return new Footer({ children: [new Paragraph({
        children: [
          new TextRun({ text: v('refDossier', '[ Référence dossier BAG-AAAA-XXX ]'), size: 16, color: GREY, font: 'Arial' }),
          new TextRun({ text: '\t© DOF — Document interne\tPage ', size: 16, color: GREY, font: 'Arial' }),
          new PageNumber({ children: [] }),
        ],
        tabStops: [
          { type: TabStopType.CENTER, position: Math.floor(TabStopPosition.MAX / 2) },
          { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
        ]
      })] })
    }

    function makeHeader(subtitle = '') {
      return new Header({ children: [new Paragraph({ children: [
        new TextRun({ text: subtitle || "B.A.G. — Bilan d'Audit Global  |  Department of Finance — San Andreas  |  CONFIDENTIEL", size: 16, color: GREY, font: 'Arial', italic: true })
      ] })] })
    }

    const pageProps = { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN + 200, left: MARGIN } }

    // ── PAGE DE GARDE ──────────────────────────────────────────────────────
    const coverChildren = [
      blank(), blank(), blank(), blank(),
      p('GOVERNMENT OF SAN ANDREAS', { bold: true, color: GREY, sz: 24, align: AlignmentType.CENTER }),
      p('DEPARTMENT OF FINANCE', { bold: true, color: NAVY, sz: 26, align: AlignmentType.CENTER }),
      p('Pôle Finance & Économie', { color: GOLD, sz: 22, align: AlignmentType.CENTER }),
      blank(), blank(),
      p('B.A.G.', { bold: true, color: NAVY, sz: 56, align: AlignmentType.CENTER }),
      p("Bilan d'Audit Global", { color: GOLD, sz: 28, align: AlignmentType.CENTER }),
      blank(), blank(),
      p('⚠  DOCUMENT CONFIDENTIEL — Usage interne DOF exclusivement', { bold: true, color: RED, sz: 18, align: AlignmentType.CENTER }),
      blank(), blank(), blank(),
      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [3200, CW - 3200],
        rows: [
          new TableRow({ children: [new TableCell({ columnSpan: 2, borders, margins: { top: 160, bottom: 160, left: 200, right: 200 }, width: { size: CW, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ENTREPRISE AUDITÉE', bold: true, size: 18, color: GOLD, font: 'Arial' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v('entreprise', "[ Nom de l'Entreprise ]"), bold: true, size: 28, color: WHITE, font: 'Arial' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Secteur : ${v('secteur', "[ Pôle / Secteur d'activité ]")}`, size: 18, color: GOLD, font: 'Arial' })] }),
          ]})]}),
          fieldRow('Contrôleur fiscal', v('cfNom') ? `${v('cfNom')} — Département des Finances` : '[ Nom Prénom ] — Département des Finances'),
          fieldRow("Date de l'audit", v('dateAudit', '[ JJ/MM/AAAA ]')),
          fieldRow('Période contrôlée', v('periodeControlee', "3 dernières semaines d'activité")),
          fieldRow('Type de contrôle', `${cb('ctrlRoutine')} Routine   ${cb('ctrlAnomalie')} Suite à anomalie   ${cb('ctrlReprise')} Reprise`),
          fieldRow('État financier', `${cb('etatStable')} Stable   ${cb('etatMoyen')} Moyen   ${cb('etatMauvais')} Mauvais`),
          fieldRow('Référence dossier', v('refDossier', '[ BAG-AAAA-XXX ]')),
        ]
      }),
    ]

    // ── CORPS (Sections I à IV + Signature) ────────────────────────────────
    const bodyChildren = [
      // SECTION I
      h1('I. Cadre Juridique & Contexte de l\'Audit'),
      h2('◆  1.1 Identification du gestionnaire'),
      pBody("Ce paragraphe doit poser le cadre juridique et historique de l'audit. Mentionnez l'identité du gestionnaire, la date du contrôle et le contexte de l'audit (reprise d'entreprise, contrôle de routine ou suite à une anomalie). L'objectif est de définir si la direction est expérimentée ou nouvelle, et de préciser l'état de la transition administrative. On y note également la transparence et la coopération du patron lors des échanges."),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [3200, CW - 3200], rows: [
        fieldRow('Identité patron / co-patron', v('idGestionnaire', '[ Nom, Prénom, titre ]')),
        fieldRow('Date de prise de fonction', v('datePriseFonction', '[ JJ/MM/AAAA ]')),
        fieldRow("Contexte de l'audit", v('contexteAudit', '[ Routine / Anomalie / Reprise ]')),
      ]}),
      h2('◆  1.2 Transparence & coopération'),
      noteBox('NOTE', "Indiquez ici la qualité de la coopération du patron lors de l'entretien et de la remise des documents. Cette évaluation sera prise en compte dans la qualification finale."),
      p(`${cb('coopTotale')} Totale   ${cb('coopPartielle')} Partielle   ${cb('coopRefus')} Refus`, { color: BLACK }),
      v('cooperationNote') ? pBody(v('cooperationNote')) : pPh('[ Évaluation de la coopération — Totale / Partielle / Refus ]'),
      v('observationsComportement') ? pBody(v('observationsComportement')) : pPh("[ Observations comportementales — Points clés de l'échange oral ]"),

      // SECTION II
      h1('II. Analyse Opérationnelle'),
      h2('◆  2.1 Situation du personnel'),
      pBody("Détaillez la situation RH de l'établissement : effectifs stables, départs récents, campagne de recrutement en cours. Évaluez la capacité de l'entreprise à maintenir un service de qualité avec les ressources humaines actuelles."),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [3200, CW - 3200], rows: [
        fieldRow('Effectif actuel', v('effectifActuel', '[ Nombre de salariés ]')),
        fieldRow('Stabilité des équipes', `${cb('stableEquipes')} Stable   ${cb('turnover')} Turnover élevé   ${cb('recrutement')} Recrutement en cours`),
        fieldRow('Postes vacants', v('postesVacants', '[ Oui / Non — préciser ]')),
      ]}),
      h2("◆  2.2 Capacité d'exploitation"),
      pBody("Précisez les horaires d'ouverture, la présence en ville, la maîtrise des stocks et le flux de clientèle. Indiquez si l'entreprise est dépendante de contrats externes ou si elle jouit d'une autonomie commerciale."),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [3200, CW - 3200], rows: [
        fieldRow("Horaires d'ouverture", v('horaireOuverture', '[ Jours / Plages horaires ]')),
        fieldRow('Maîtrise des stocks', `${cb('stockBonne')} Bonne   ${cb('stockMoyenne')} Moyenne   ${cb('stockInsuffisante')} Insuffisante`),
        fieldRow('Flux de clientèle', `${cb('fluxRegulier')} Régulier   ${cb('fluxIrregulier')} Irrégulier   ${cb('fluxFaible')} Faible`),
        fieldRow('Modèle économique', `${cb('modPassage')} Clientèle de passage   ${cb('modContrats')} Contrats   ${cb('modMixte')} Mixte`),
        fieldRow('Dépendance externe', `${cb('depAutonome')} Autonome   ${cb('depPartielle')} Partiellement dépendante   ${cb('depTres')} Très dépendante`),
      ]}),
      h2('◆  2.3 Difficultés opérationnelles identifiées'),
      pBody("Listez les difficultés évoquées par le patron lors de l'entretien ou identifiées lors de l'investigation."),
      v('diffOp1') ? pBody(v('diffOp1')) : pPh('[ Principale difficulté #1 — Manque personnel / Zone géo / Concurrence / Baisse fréquentation / Autre ]'),
      v('diffOp2') ? pBody(v('diffOp2')) : pPh('[ Principale difficulté #2 — (si applicable) ]'),
      v('diffOp3') ? pBody(v('diffOp3')) : pPh('[ Principale difficulté #3 — (si applicable) ]'),

      // SECTION III
      h1('III. Bilan Comptable & Décisionnel'),
      h2('◆  3.1 État de la trésorerie'),
      pBody("Ce paragraphe est le cœur du B.A.G. Mentionnez impérativement le montant exact de la trésorerie au jour de l'audit. Vous analysez ensuite la viabilité de ce solde face aux charges à venir (achats de stocks, salaires). Enfin, vous formulez vos conclusions : l'entreprise est-elle stable ou précaire ?"),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [2600, 1800, 1600, 1719, 1919], rows: [
        hdrRow([{ text: 'Indicateur', w: 2600 }, { text: 'Valeur constatée', w: 1800 }, { text: 'Référence DOF', w: 1600 }, { text: 'Écart', w: 1719 }, { text: 'Statut', w: 1919 }]),
        dRow([{ text: 'Trésorerie déclarée', w: 2600, bold: true }, { text: v('tresorerieDeclaree', '[ Montant $ ]'), w: 1800 }, { text: '—', w: 1600 }, { text: '—', w: 1719 }, { text: `${cb('tresOK')} OK  ${bx.tresOK ? '☐' : '☑'} KO`, w: 1919 }]),
        dRow([{ text: 'Trésorerie réelle', w: 2600, bold: true }, { text: v('tresorerieReelle', '[ Montant $ ]'), w: 1800 }, { text: '—', w: 1600 }, { text: v('ecartTreso', '[ $ ]'), w: 1719 }, { text: '☐ OK  ☐ KO', w: 1919 }]),
        dRow([{ text: 'Solde après frais', w: 2600, bold: true }, { text: v('soldeApresFrags', '[ Montant $ ]'), w: 1800 }, { text: '—', w: 1600 }, { text: '—', w: 1719 }, { text: '☐ OK  ☐ KO', w: 1919 }]),
        dRow([{ text: 'Impôt dû (estimé)', w: 2600, bold: true }, { text: v('impotDu', '[ Montant $ ]'), w: 1800 }, { text: v('tauxRef', '[ Taux% ]'), w: 1600 }, { text: '[ $ ]', w: 1719 }, { text: '☐ OK  ☐ KO', w: 1919 }]),
      ]}),

      h2('◆  3.2 Vérification des déclarations fiscales'),
      pBody("Indiquez si les déclarations des 3 dernières semaines sont conformes, en retard ou manquantes. Notez les anomalies détectées et les montants concernés."),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [1800, 1800, 1800, 1800, 2438], rows: [
        hdrRow([{ text: 'Semaine', w: 1800 }, { text: 'Déclaration reçue', w: 1800 }, { text: 'Paiement reçu', w: 1800 }, { text: 'Justificatifs', w: 1800 }, { text: 'Anomalie', w: 2438 }]),
        dRow([{ text: 'Semaine S-3', w: 1800, bold: true }, { text: `${cb('s3Decl')} Oui  ${bx.s3Decl ? '☐' : '☑'} Non`, w: 1800 }, { text: `${cb('s3Paie')} Oui  ${bx.s3Paie ? '☐' : '☑'} Non`, w: 1800 }, { text: `${cb('s3Just')} Oui  ${bx.s3Just ? '☐' : '☑'} Non`, w: 1800 }, { text: v('s3Anomalie', '[ Préciser ]'), w: 2438 }]),
        dRow([{ text: 'Semaine S-2', w: 1800, bold: true }, { text: `${cb('s2Decl')} Oui  ${bx.s2Decl ? '☐' : '☑'} Non`, w: 1800 }, { text: `${cb('s2Paie')} Oui  ${bx.s2Paie ? '☐' : '☑'} Non`, w: 1800 }, { text: `${cb('s2Just')} Oui  ${bx.s2Just ? '☐' : '☑'} Non`, w: 1800 }, { text: v('s2Anomalie', '[ Préciser ]'), w: 2438 }]),
        dRow([{ text: 'Semaine S-1', w: 1800, bold: true }, { text: `${cb('s1Decl')} Oui  ${bx.s1Decl ? '☐' : '☑'} Non`, w: 1800 }, { text: `${cb('s1Paie')} Oui  ${bx.s1Paie ? '☐' : '☑'} Non`, w: 1800 }, { text: `${cb('s1Just')} Oui  ${bx.s1Just ? '☐' : '☑'} Non`, w: 1800 }, { text: v('s1Anomalie', '[ Préciser ]'), w: 2438 }]),
      ]}),

      h2('◆  3.3 Qualification de la situation fiscale'),
      pBody('Cochez la case applicable et détaillez ci-dessous.'),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [2200, 4000, 3438], rows: [
        hdrRow([{ text: 'Qualification', w: 2200 }, { text: 'Description', w: 4000 }, { text: 'Action requise', w: 3438 }]),
        dRow([{ text: `${cb('casSImple')}  CAS SIMPLE`, w: 2200, bold: true }, { text: 'Erreurs mineures / déductions non justifiées', w: 4000 }, { text: 'Convocation + redressement', w: 3438 }]),
        dRow([{ text: `${cb('casGrave')}  CAS GRAVE`, w: 2200, bold: true, color: RED }, { text: 'Dissimulation / faux en écriture / récidive', w: 4000 }, { text: 'Ouverture dossier Fraude Fiscale', w: 3438 }]),
        dRow([{ text: `${cb('conformite')}  CONFORMITÉ`, w: 2200, bold: true, color: '1F7A4D' }, { text: 'Aucune anomalie détectée', w: 4000 }, { text: 'Document de clôture favorable', w: 3438 }]),
      ]}),
      v('detailAnomalie') ? pBody(v('detailAnomalie')) : pPh("[ Détail des anomalies — Description précise, calcul des écarts, pièces à l'appui (cf. Annexe B) ]"),

      // SECTION IV
      h1('IV. Préconisations & Conclusions'),
      h2('◆  4.1 Analyse de viabilité'),
      pBody("Formulez vos conclusions sur la viabilité de l'entreprise. L'entreprise est-elle stable, précaire, ou en situation critique ?"),
      v('conclusionViabilite') ? pBody(v('conclusionViabilite')) : pPh('[ Conclusion de viabilité — Stable / Précaire / Critique — Justification ]'),

      h2('◆  4.2 Préconisations officielles'),
      pBody("Listez ici les mesures recommandées par le contrôleur. Ces préconisations seront soumises au DOF/Co-DOF pour validation."),
      p('Mesures applicables :', { bold: true, color: NAVY }),
      bullet(`${cb('redressement')}  Redressement fiscal — Montant : ${v('montantRedressement', '[ $ ]')}`),
      bullet(`${cb('amende')}  Amende pour retard — Montant : ${v('montantAmende', '[ $ ]')} — Détail : cf. Annexe A`),
      bullet(`${cb('exoneration')}  Exonération fiscale — Durée : ${v('dureeExoneration', '[ X semaines ]')} — Motif : ${v('motifExoneration', '[ ]')}`),
      bullet(`${cb('subvFonctionnement')}  Subvention de fonctionnement — Montant demandé : ${v('montantSubvFonct', '[ $ ]')}`),
      bullet(`${cb('subvUrgence')}  Subvention d'urgence — Montant demandé : ${v('montantSubvUrgence', '[ $ ]')}`),
      bullet(`${cb('aideRH')}  Aide au recrutement / formation`),
      bullet(`${cb('fermeture')}  Fermeture administrative — Motif : [ ]`),
      bullet(`${cb('fraude')}  Transmission dossier pour Fraude Fiscale`),
      bullet(`☐  Autre : [ Préciser ]`),
      ...(v('preconisationsDetail') ? [pBody(v('preconisationsDetail'))] : []),

      h2('◆  4.3 Résumé pour la direction'),
      pBody("Rédigez ici le résumé court (2 lignes maximum) destiné au post Discord DOF :"),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [CW], rows: [new TableRow({ children: [
        new TableCell({ borders, margins: { top: 120, bottom: 120, left: 160, right: 160 }, width: { size: CW, type: WidthType.DXA }, shading: { fill: LGREY, type: ShadingType.CLEAR },
          children: v('resumeDiscord')
            ? v('resumeDiscord').split('\n').filter(Boolean).map((line: string) => new Paragraph({ children: [new TextRun({ text: line, size: 18, font: 'Arial', color: BLACK })] }))
            : [
                new Paragraph({ children: [new TextRun({ text: `Entreprise : ${v('entreprise', '[ Nom ]')}`, size: 18, font: 'Arial', color: AMBER })] }),
                new Paragraph({ children: [new TextRun({ text: 'État financier : [ Stable / Moyen / Mauvais ]', size: 18, font: 'Arial', color: AMBER })] }),
                new Paragraph({ children: [new TextRun({ text: 'Situation : [ bref résumé 1-2 lignes max ]', size: 18, font: 'Arial', color: AMBER })] }),
                new Paragraph({ children: [new TextRun({ text: 'Subvention reçue : [ montant / × ]', size: 18, font: 'Arial', color: AMBER })] }),
              ]
        })
      ]})]
      }),

      // SIGNATURE
      h2('◆  Certification & Signature'),
      pBody("Je soussigné(e), certifie sur l'honneur l'exactitude des informations contenues dans le présent rapport."),
      blank(),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [3200, CW - 3200], rows: [
        fieldRow('Fait à Los Santos, le', v('dateFait', '[ JJ/MM/AAAA ]')),
        fieldRow('Contrôleur fiscal', v('nomCF', '[ NOM PRÉNOM ]')),
        new TableRow({ children: [
          new TableCell({ borders, margins: cm, width: { size: 3200, type: WidthType.DXA }, shading: { fill: LGREY, type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Signature', bold: true, size: 18, font: 'Arial', color: BLACK })] })] }),
          new TableCell({ borders, margins: { top: 400, bottom: 400, left: 120, right: 120 }, width: { size: CW - 3200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ' ', size: 18, font: 'Arial' })] })] }),
        ]}),
        fieldRow('Validé par (DOF)', v('nomDOF', '[ NOM PRÉNOM — Co-DOF / DOF ]')),
      ]}),
    ]

    // ── ANNEXE A ───────────────────────────────────────────────────────────
    const annexeAChildren = [
      p('ANNEXE A', { bold: true, color: GOLD, sz: 24, align: AlignmentType.CENTER }),
      h1('Expertise Comptable & Conseil Entreprise'),
      pBody("Cette annexe est destinée au Conseiller en Entreprise ou au Contrôleur Fiscal souhaitant approfondir l'analyse économique de la structure."),

      h2('◆  A.1 Analyse du modèle économique'),
      h3('Sources de revenus'),
      v('sourceRevenuPrincipal') ? pBody(v('sourceRevenuPrincipal')) : pPh('[ Source principale de revenus — Contrats / Clientèle de passage / Services spécifiques ]'),
      v('sourceRevenuSecondaire') ? pBody(v('sourceRevenuSecondaire')) : pPh('[ Sources secondaires — Partenariats / Contrats inter-entreprises ]'),
      v('dependanceTiers') ? pBody(v('dependanceTiers')) : pPh('[ Dépendance à des tiers — Fournisseurs clés / Clients majeurs ]'),

      h3('Structure des charges'),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [2800, 1800, 2000, CW - 6600], rows: [
        hdrRow([{ text: 'Poste de charge', w: 2800 }, { text: 'Montant estimé', w: 1800 }, { text: 'Fréquence', w: 2000 }, { text: 'Commentaire', w: CW - 6600 }]),
        dRow([{ text: 'Achats stocks / matières', w: 2800, bold: true }, { text: v('chargesStocks', '[ $ ]'), w: 1800 }, { text: 'Hebdomadaire', w: 2000 }, { text: '[ Note ]', w: CW - 6600 }]),
        dRow([{ text: 'Salaires & primes', w: 2800, bold: true }, { text: v('chargesSalaires', '[ $ ]'), w: 1800 }, { text: 'Hebdomadaire', w: 2000 }, { text: '[ Note ]', w: CW - 6600 }]),
        dRow([{ text: 'Charges opérationnelles', w: 2800, bold: true }, { text: v('chargesOp', '[ $ ]'), w: 1800 }, { text: 'Hebdomadaire', w: 2000 }, { text: '[ Note ]', w: CW - 6600 }]),
        dRow([{ text: 'Impôts & taxes', w: 2800, bold: true }, { text: v('chargesImpots', '[ $ ]'), w: 1800 }, { text: 'Hebdomadaire', w: 2000 }, { text: '[ Note ]', w: CW - 6600 }]),
        dRow([{ text: 'Autres charges', w: 2800, bold: true }, { text: v('chargesAutres', '[ $ ]'), w: 1800 }, { text: 'Ponctuelle', w: 2000 }, { text: '[ Note ]', w: CW - 6600 }]),
        new TableRow({ children: [
          new TableCell({ borders, margins: cm, width: { size: 2800, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL CHARGES ESTIMÉES', bold: true, size: 18, color: WHITE, font: 'Arial' })] })] }),
          new TableCell({ borders, margins: cm, width: { size: 1800, type: WidthType.DXA }, shading: { fill: GOLD, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: '[ $ ]', bold: true, size: 18, color: WHITE, font: 'Arial' })] })] }),
          new TableCell({ columnSpan: 2, borders, margins: cm, width: { size: CW - 4600, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: '—', size: 18, color: WHITE, font: 'Arial' })] })] }),
        ]}),
      ]}),

      h2('◆  A.2 Calcul des amendes applicables'),
      pBody('Barème DOF en vigueur — Sanctions automatiques en cas de non-respect des délais :'),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [3400, 1600, 2000, CW - 7000], rows: [
        hdrRow([{ text: "Type d'infraction", w: 3400 }, { text: 'Barème', w: 1600 }, { text: 'Montant calculé', w: 2000 }, { text: 'Justification', w: CW - 7000 }]),
        dRow([{ text: 'Retard déclaration (Évènementiel/LTD/Restauration)', w: 3400 }, { text: '700 $ / heure', w: 1600 }, { text: v('montantAmRetardEvt', '[ $ ]'), w: 2000 }, { text: v('calcAmRetardEvt', '[ Calcul ]'), w: CW - 7000 }]),
        dRow([{ text: 'Retard déclaration (Production/Utilitaire/Politique)', w: 3400 }, { text: '2 000 $ / heure', w: 1600 }, { text: v('montantAmRetardProd', '[ $ ]'), w: 2000 }, { text: v('calcAmRetardProd', '[ Calcul ]'), w: CW - 7000 }]),
        dRow([{ text: 'Retard paiement impôts < 24h', w: 3400 }, { text: '+2% du solde', w: 1600 }, { text: v('montantAmRetard24h', '[ $ ]'), w: 2000 }, { text: '[ Calcul ]', w: CW - 7000 }]),
        dRow([{ text: 'Retard paiement impôts 24-48h', w: 3400 }, { text: '+5% du solde', w: 1600 }, { text: v('montantAmRetard48h', '[ $ ]'), w: 2000 }, { text: '[ Calcul ]', w: CW - 7000 }]),
        dRow([{ text: 'Retard paiement impôts 48-72h', w: 3400 }, { text: '+10% du solde', w: 1600 }, { text: v('montantAmRetard72h', '[ $ ]'), w: 2000 }, { text: '[ Calcul ]', w: CW - 7000 }]),
        dRow([{ text: 'Document manquant', w: 3400 }, { text: '2% du solde', w: 1600 }, { text: v('montantAmDocManquant', '[ $ ]'), w: 2000 }, { text: '[ Calcul ]', w: CW - 7000 }]),
        dRow([{ text: 'Déduction non justifiée', w: 3400 }, { text: '6% du solde', w: 1600 }, { text: v('montantAmDeductNonJust', '[ $ ]'), w: 2000 }, { text: '[ Calcul ]', w: CW - 7000 }]),
        new TableRow({ children: [
          new TableCell({ borders, margins: cm, width: { size: 3400, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL AMENDES À RECOUVRIR', bold: true, size: 18, color: WHITE, font: 'Arial' })] })] }),
          new TableCell({ borders, margins: cm, width: { size: 1600, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: '—', size: 18, color: WHITE, font: 'Arial' })] })] }),
          new TableCell({ borders, margins: cm, width: { size: 2000, type: WidthType.DXA }, shading: { fill: GOLD, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: v('totalAmendes', '[ $ ]'), bold: true, size: 18, color: WHITE, font: 'Arial' })] })] }),
          new TableCell({ borders, margins: cm, width: { size: CW - 7000, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: '—', size: 18, color: WHITE, font: 'Arial' })] })] }),
        ]}),
      ]}),

      h2('◆  A.3 Analyse des subventions'),
      pBody('En cas de demande de subvention, complétez cette section pour instruire le dossier :'),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [2800, 1400, 1400, 1800, CW - 7400], rows: [
        hdrRow([{ text: 'Type de subvention', w: 2800 }, { text: 'Demandée', w: 1400 }, { text: 'Montant', w: 1400 }, { text: 'Motif', w: 1800 }, { text: 'Avis contrôleur', w: CW - 7400 }]),
        dRow([{ text: 'Fonctionnement (trésorerie)', w: 2800 }, { text: `${cb('subvFonctionnement')} Oui  ${bx.subvFonctionnement ? '☐' : '☑'} Non`, w: 1400 }, { text: v('montantSubvFonct', '[ $ ]'), w: 1400 }, { text: '[ ]', w: 1800 }, { text: '☐ Favorable  ☐ Défavorable', w: CW - 7400 }]),
        dRow([{ text: 'Événementielle (projet)', w: 2800 }, { text: '☐ Oui  ☐ Non', w: 1400 }, { text: v('montantSubvEvt', '[ $ ]'), w: 1400 }, { text: v('motifSubvEvt', '[ ]'), w: 1800 }, { text: '☐ Favorable  ☐ Défavorable', w: CW - 7400 }]),
        dRow([{ text: 'Investissement (équipement)', w: 2800 }, { text: '☐ Oui  ☐ Non', w: 1400 }, { text: v('montantSubvInvest', '[ $ ]'), w: 1400 }, { text: v('motifSubvInvest', '[ ]'), w: 1800 }, { text: '☐ Favorable  ☐ Défavorable', w: CW - 7400 }]),
        dRow([{ text: "Urgence (difficultés majeures)", w: 2800 }, { text: `${cb('subvUrgence')} Oui  ${bx.subvUrgence ? '☐' : '☑'} Non`, w: 1400 }, { text: v('montantSubvUrgence', '[ $ ]'), w: 1400 }, { text: '[ ]', w: 1800 }, { text: '☐ Favorable  ☐ Défavorable', w: CW - 7400 }]),
        dRow([{ text: 'Formation', w: 2800 }, { text: '☐ Oui  ☐ Non', w: 1400 }, { text: v('montantSubvFormation', '[ $ ]'), w: 1400 }, { text: v('motifSubvFormation', '[ ]'), w: 1800 }, { text: '☐ Favorable  ☐ Défavorable', w: CW - 7400 }]),
      ]}),

      h2('◆  A.4 Recommandations stratégiques du conseiller'),
      pBody("Section libre — À remplir par le Conseiller en Entreprise pour formuler des recommandations opérationnelles à l'issue de l'analyse :"),
      v('recourtTerme') ? pBody(v('recourtTerme')) : pPh('[ Recommandation #1 — Court terme (cette semaine) ]'),
      v('recoMoyenTerme') ? pBody(v('recoMoyenTerme')) : pPh('[ Recommandation #2 — Moyen terme (2-3 semaines) ]'),
      v('recoLongTerme') ? pBody(v('recoLongTerme')) : pPh('[ Recommandation #3 — Long terme / Expansion ]'),
      v('pointsAttention') ? pBody(v('pointsAttention')) : pPh('[ Points d\'attention spécifiques — Risques identifiés ]'),

      h2("◆  A.5 Trame entretien B.A.G. — Rappel conducteur"),
      pBody("Points à aborder obligatoirement lors de l'entretien :"),
      bullet('Présentation de l\'agent : "Bonjour, je suis [Nom], contrôleur fiscal au Department of Finance."'),
      bullet('Vérification identité : Patron / Co-patron / Gérant'),
      bullet('Trésorerie : Montant exact en banque — noter précisément'),
      bullet('Ressenti : Santé financière — Confortable / Tendue ?'),
      bullet('Modèle économique : Clientèle de passage ou contrats ?'),
      bullet('Écoulement des stocks : Facilement ? Difficultés ?'),
      bullet('Difficultés : Manque personnel / Zone géo / Concurrence ?'),
      bullet('Déclarations fiscales : Procédure comprise ? Retards ?'),
      bullet('Aide gouvernementale : Besoin de subvention ?'),
      bullet('RH : Besoin aide recrutement ou formation managers ?'),
      bullet('Ouverture : Questions du patron pour le Gouvernement ?'),
      bullet("Clôture : Informer qu'un B.A.G. sera rédigé et transmis au DOF"),
    ]

    // ── ANNEXE B ───────────────────────────────────────────────────────────
    const pjItems = [
      { ref: 'PJ-01', desc: 'Relevé bancaire S-3 — Avant/Après frais', date: v('pj01date', '[ Date ]'), ck: 'pj01' },
      { ref: 'PJ-02', desc: 'Relevé bancaire S-2 — Avant/Après frais', date: v('pj02date', '[ Date ]'), ck: 'pj02' },
      { ref: 'PJ-03', desc: 'Relevé bancaire S-1 — Avant/Après frais', date: v('pj03date', '[ Date ]'), ck: 'pj03' },
      { ref: 'PJ-04', desc: 'Capture paiement impôts S-3', date: v('pj04date', '[ Date ]'), ck: 'pj04' },
      { ref: 'PJ-05', desc: 'Capture paiement impôts S-2', date: v('pj05date', '[ Date ]'), ck: 'pj05' },
      { ref: 'PJ-06', desc: 'Capture paiement impôts S-1', date: v('pj06date', '[ Date ]'), ck: 'pj06' },
      { ref: 'PJ-07', desc: v('pj07desc', 'Capture anomalie #1 — [ Description ]'), date: v('pj07date', '[ Date ]'), ck: 'pj07' },
      { ref: 'PJ-08', desc: v('pj08desc', 'Capture anomalie #2 — [ Description ]'), date: v('pj08date', '[ Date ]'), ck: 'pj08' },
      { ref: 'PJ-09', desc: 'Réponse écrite du patron', date: v('pj09date', '[ Date ]'), ck: 'pj09' },
      { ref: 'PJ-10', desc: v('pj10desc', '[ Autre document ]'), date: v('pj10date', '[ Date ]'), ck: 'pj10' },
    ]

    const annexeBChildren = [
      p('ANNEXE B', { bold: true, color: GOLD, sz: 24, align: AlignmentType.CENTER }),
      h1('Pièces Jointes, Documents & Captures d\'Écran'),
      pBody("Cette annexe regroupe l'ensemble des preuves documentaires collectées lors du contrôle fiscal. Chaque pièce doit être référencée dans l'index ci-dessous avant d'être insérée dans les zones dédiées."),
      noteBox('IMPORTANT', "Tout document inséré dans cette annexe constitue une pièce officielle du dossier de contrôle fiscal. Assurez-vous de l'authenticité et de la lisibilité de chaque document."),
      h2('◆  B.1 Index des pièces jointes'),
      new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [1200, 4800, 1600, CW - 7600], rows: [
        hdrRow([{ text: 'Réf.', w: 1200 }, { text: 'Nature du document', w: 4800 }, { text: 'Date', w: 1600 }, { text: 'Statut', w: CW - 7600 }]),
        ...pjItems.map(({ ref, desc, date, ck }) => dRow([
          { text: ref, w: 1200, bold: true, color: GOLD },
          { text: desc, w: 4800 },
          { text: date, w: 1600 },
          { text: `${cb(ck)} Reçu  ${bx[ck] ? '☐' : '☑'} Manquant`, w: CW - 7600 },
        ]))
      ]}),
      blank(),
      ...['PJ-01', 'PJ-02', 'PJ-03', 'PJ-04'].flatMap(ref => [
        h3(`Zone d'insertion — Pièce ${ref}`),
        new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [CW], rows: [new TableRow({ children: [
          new TableCell({ borders, margins: { top: 400, bottom: 400, left: 200, right: 200 }, width: { size: CW, type: WidthType.DXA }, shading: { fill: 'F8F8F8', type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `📎  Insérer ici la capture / le document — ${ref}`, size: 18, font: 'Arial', color: GREY })] })] })
        ]})] }),
        blank(),
      ]),
      h3('Zones supplémentaires — Pièces PJ-05 à PJ-10'),
      pBody("Dupliquez les zones ci-dessus pour ajouter d'autres pièces. Veillez à mettre à jour l'index B.1 à chaque ajout."),
      pPh('[ Zone libre — Pièces additionnelles à insérer ici ]'),
      blank(), blank(),
      p('Department of Finance — Government of San Andreas', { color: GREY, sz: 18, align: AlignmentType.CENTER }),
      p('Document confidentiel — Usage interne exclusif', { color: GREY, sz: 16, align: AlignmentType.CENTER }),
    ]

    // ── ASSEMBLAGE FINAL ────────────────────────────────────────────────────
    const doc = new Document({
      numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
      styles: {
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 28, bold: true, color: NAVY }, paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
          { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 22, bold: true, color: GOLD }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
          { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 20, bold: true, color: NAVY }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
        ]
      },
      sections: [
        { properties: { page: pageProps }, headers: { default: makeHeader() }, footers: { default: makeFooter() }, children: coverChildren },
        { properties: { page: pageProps }, headers: { default: makeHeader() }, footers: { default: makeFooter() }, children: bodyChildren as Paragraph[] },
        { properties: { page: pageProps }, headers: { default: makeHeader("B.A.G. — Annexes  |  Department of Finance — San Andreas  |  CONFIDENTIEL") }, footers: { default: makeFooter() }, children: [...annexeAChildren, ...annexeBChildren] as Paragraph[] },
      ]
    })

    const buffer = await Packer.toBuffer(doc)
    const rawName = v('entreprise').replace(/[^a-zA-Z0-9]/g, '_') || 'Document'
    const dateStr = v('dateAudit').replace(/\//g, '-') || new Date().toISOString().split('T')[0]

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="BAG_${rawName}_${dateStr}.docx"`,
        'Cache-Control': 'no-cache',
      }
    })
  } catch (err) {
    console.error('Export BAG error:', err)
    return NextResponse.json({ error: `Erreur: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
  }
}
