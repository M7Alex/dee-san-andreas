export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb } from '@/lib/github-db'

// Export DOCX via docx library (installée via npm)
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
  const bag = db.bags.find(b => b.id === id && (isFullAccess || b.ownerId === session.userId))
  if (!bag) return NextResponse.json({ error: 'BAG introuvable' }, { status: 404 })

  try {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
            HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
            VerticalAlign, LevelFormat } = await import('docx')

    const NAVY = '0D1B2A', GOLD = 'C9A84C', WHITE = 'FFFFFF', GREY = 'F2F2F2'
    const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
    const borders = { top: border, bottom: border, left: border, right: border }
    const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 }
    const cw = 9026 // A4 content width

    function cb(key: string) { return bag.checkboxes[key as keyof typeof bag.checkboxes] ? '☑' : '☐' }
    function para(text: string, opts: { bold?: boolean; color?: string; sz?: number; before?: number; after?: number } = {}) {
      return new Paragraph({
        spacing: { before: opts.before ?? 60, after: opts.after ?? 60 },
        children: [new TextRun({ text, bold: opts.bold, color: opts.color ?? '000000', size: opts.sz ?? 20, font: 'Arial' })]
      })
    }
    function fieldRow(label: string, value: string) {
      return new TableRow({ children: [
        new TableCell({ borders, margins: cellMargins, width: { size: 3000, type: WidthType.DXA },
          shading: { fill: GREY, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, font: 'Arial' })] })] }),
        new TableCell({ borders, margins: cellMargins, width: { size: cw - 3000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: value || '—', size: 18, font: 'Arial' })] })] }),
      ]})
    }
    function section(title: string) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280, after: 120 },
        children: [new TextRun({ text: title, bold: true, size: 26, color: NAVY, font: 'Arial' })]
      })
    }
    function subsection(title: string) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 80 },
        children: [new TextRun({ text: title, bold: true, size: 22, color: '333333', font: 'Arial' })]
      })
    }

    const doc = new Document({
      numbering: { config: [
        { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•',
            alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
      ]},
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
        children: [
          // ── HEADER ──
          para('GOVERNMENT OF SAN ANDREAS', { bold: true, color: NAVY, sz: 28, before: 0 }),
          para('DEPARTMENT OF FINANCE — Pôle Finance & Économie', { bold: true, color: NAVY, sz: 22 }),
          para('B.A.G. — Bilan d\'Audit Global', { bold: true, sz: 28, color: GOLD }),
          para('⚠  DOCUMENT CONFIDENTIEL — Usage interne DOF exclusivement', { sz: 16, color: '888888' }),
          new Paragraph({ spacing: { before: 200 } }),

          // ── FICHE D'IDENTIFICATION ──
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [3000, cw - 3000], rows: [
            fieldRow('Entreprise auditée', bag.entreprise + (bag.secteur ? ` — ${bag.secteur}` : '')),
            fieldRow('Réf. dossier', bag.refDossier || `BAG-${new Date().getFullYear()}-XXX`),
            fieldRow('Contrôleur fiscal', bag.cfNom),
            fieldRow("Date de l'audit", bag.dateAudit),
            fieldRow('Période contrôlée', bag.periodeControlee),
            fieldRow('Type de contrôle', `${cb('ctrlRoutine')} Routine   ${cb('ctrlAnomalie')} Anomalie   ${cb('ctrlReprise')} Reprise`),
            fieldRow('État financier', `${cb('etatStable')} Stable   ${cb('etatMoyen')} Moyen   ${cb('etatMauvais')} Mauvais`),
          ]}),
          new Paragraph({ spacing: { before: 300 } }),

          // ── SECTION I ──
          section('I. Cadre Juridique & Contexte de l\'Audit'),
          subsection('◆  1.1 Identification du gestionnaire'),
          para('Cadre juridique et historique de l\'audit :'),
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [3000, cw - 3000], rows: [fieldRow('Identité patron/co-patron', bag.idGestionnaire)] }),
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [3000, cw - 3000], rows: [
            fieldRow('Date de prise de fonction', bag.datePriseFonction),
            fieldRow("Contexte de l'audit", bag.contexteAudit),
          ]}),
          para(bag.idGestionnaire ? '' : '[ À compléter — identité et contexte ]', { color: '888888', sz: 18 }),

          subsection('◆  1.2 Transparence & coopération'),
          para(`Coopération : ${cb('coopTotale')} Totale   ${cb('coopPartielle')} Partielle   ${cb('coopRefus')} Refus`),
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [3000, cw - 3000], rows: [
            fieldRow('Note de coopération', bag.cooperationNote),
            fieldRow('Observations comportementales', bag.observationsComportement),
          ]}),

          // ── SECTION II ──
          section('II. Analyse Opérationnelle'),
          subsection('◆  2.1 Situation du personnel'),
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [3000, cw - 3000], rows: [
            fieldRow('Effectif actuel', bag.effectifActuel),
            fieldRow('Stabilité', `${cb('stableEquipes')} Stable   ${cb('turnover')} Turnover   ${cb('recrutement')} Recrutement`),
            fieldRow('Postes vacants', bag.postesVacants),
          ]}),

          subsection('◆  2.2 Capacité d\'exploitation'),
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [3000, cw - 3000], rows: [
            fieldRow("Horaires d'ouverture", bag.horaireOuverture),
            fieldRow('Maîtrise des stocks', `${cb('stockBonne')} Bonne   ${cb('stockMoyenne')} Moyenne   ${cb('stockInsuffisante')} Insuffisante`),
            fieldRow('Flux de clientèle', `${cb('fluxRegulier')} Régulier   ${cb('fluxIrregulier')} Irrégulier   ${cb('fluxFaible')} Faible`),
            fieldRow('Modèle économique', `${cb('modPassage')} Passage   ${cb('modContrats')} Contrats   ${cb('modMixte')} Mixte`),
            fieldRow('Dépendance externe', `${cb('depAutonome')} Autonome   ${cb('depPartielle')} Partielle   ${cb('depTres')} Très dépendante`),
          ]}),

          subsection('◆  2.3 Difficultés opérationnelles'),
          ...[bag.diffOp1, bag.diffOp2, bag.diffOp3].filter(Boolean).map(d =>
            new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: d, font: 'Arial', size: 18 })] })
          ),

          // ── SECTION III ──
          section('III. Bilan Comptable & Décisionnel'),
          subsection('◆  3.1 État de la trésorerie'),
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [2800, 1800, 1500, 1426, 1500], rows: [
            new TableRow({ children: ['Indicateur','Valeur constatée','Réf. DOF','Écart','Statut'].map((h, i) =>
              new TableCell({ borders, margins: cellMargins, width: { size: [2800,1800,1500,1426,1500][i], type: WidthType.DXA },
                shading: { fill: NAVY, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: WHITE, size: 18, font: 'Arial' })] })]
              }))
            }),
            new TableRow({ children: [
              new TableCell({ borders, margins: cellMargins, width: { size: 2800, type: WidthType.DXA }, children: [para('Trésorerie déclarée', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1800, type: WidthType.DXA }, children: [para(bag.tresorerieDeclaree || '—', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1500, type: WidthType.DXA }, children: [para('—', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1426, type: WidthType.DXA }, children: [para('—', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1500, type: WidthType.DXA }, children: [para(`${cb('tresOK')} OK  ${cb('tresKO')} KO`, { sz: 18 })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders, margins: cellMargins, width: { size: 2800, type: WidthType.DXA }, children: [para('Trésorerie réelle', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1800, type: WidthType.DXA }, children: [para(bag.tresorerieReelle || '—', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1500, type: WidthType.DXA }, children: [para('—', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1426, type: WidthType.DXA }, children: [para(bag.ecartTreso || '—', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1500, type: WidthType.DXA }, children: [para('—', { sz: 18 })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders, margins: cellMargins, width: { size: 2800, type: WidthType.DXA }, children: [para('Impôt dû (estimé)', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1800, type: WidthType.DXA }, children: [para(bag.impotDu || '—', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1500, type: WidthType.DXA }, children: [para(bag.tauxRef || '—', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1426, type: WidthType.DXA }, children: [para('—', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 1500, type: WidthType.DXA }, children: [para('—', { sz: 18 })] }),
            ]}),
          ]}),

          subsection('◆  3.2 Vérification des déclarations'),
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [1600, 1800, 1800, 1800, 2026], rows: [
            new TableRow({ children: ['Semaine','Déclaration','Paiement','Justificatifs','Anomalie'].map((h, i) =>
              new TableCell({ borders, margins: cellMargins, width: { size: [1600,1800,1800,1800,2026][i], type: WidthType.DXA },
                shading: { fill: NAVY, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: WHITE, size: 18, font: 'Arial' })] })]
              }))
            }),
            ...(['S-3','S-2','S-1'] as const).map((s, i) => {
              const keys = [['s3Decl','s3Paie','s3Just'],['s2Decl','s2Paie','s2Just'],['s1Decl','s1Paie','s1Just']][i]
              const anomalie = [bag.s3Anomalie, bag.s2Anomalie, bag.s1Anomalie][i]
              return new TableRow({ children: [
                new TableCell({ borders, margins: cellMargins, width: { size: 1600, type: WidthType.DXA }, children: [para(`Semaine ${s}`, { bold: true, sz: 18 })] }),
                new TableCell({ borders, margins: cellMargins, width: { size: 1800, type: WidthType.DXA }, children: [para(`${cb(keys[0])} Oui  ${bag.checkboxes[keys[0] as keyof typeof bag.checkboxes] ? '' : '☑'} Non`, { sz: 18 })] }),
                new TableCell({ borders, margins: cellMargins, width: { size: 1800, type: WidthType.DXA }, children: [para(`${cb(keys[1])} Oui  ${bag.checkboxes[keys[1] as keyof typeof bag.checkboxes] ? '' : '☑'} Non`, { sz: 18 })] }),
                new TableCell({ borders, margins: cellMargins, width: { size: 1800, type: WidthType.DXA }, children: [para(`${cb(keys[2])} Oui  ${bag.checkboxes[keys[2] as keyof typeof bag.checkboxes] ? '' : '☑'} Non`, { sz: 18 })] }),
                new TableCell({ borders, margins: cellMargins, width: { size: 2026, type: WidthType.DXA }, children: [para(anomalie || '—', { sz: 18 })] }),
              ]})
            }),
          ]}),

          subsection('◆  3.3 Qualification de la situation fiscale'),
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [2000, 4000, 3026], rows: [
            new TableRow({ children: ['Qualification','Description','Action'].map((h, i) =>
              new TableCell({ borders, margins: cellMargins, width: { size: [2000,4000,3026][i], type: WidthType.DXA },
                shading: { fill: NAVY, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: WHITE, size: 18, font: 'Arial' })] })]
              }))
            }),
            new TableRow({ children: [
              new TableCell({ borders, margins: cellMargins, width: { size: 2000, type: WidthType.DXA }, children: [para(`${cb('casSImple')} CAS SIMPLE`, { sz: 18, bold: true })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 4000, type: WidthType.DXA }, children: [para('Erreurs mineures / déductions non justifiées', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 3026, type: WidthType.DXA }, children: [para('Convocation + redressement', { sz: 18 })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders, margins: cellMargins, width: { size: 2000, type: WidthType.DXA }, children: [para(`${cb('casGrave')} CAS GRAVE`, { sz: 18, bold: true, color: 'CC0000' })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 4000, type: WidthType.DXA }, children: [para('Dissimulation / faux en écriture / récidive', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 3026, type: WidthType.DXA }, children: [para('Ouverture dossier Fraude Fiscale', { sz: 18 })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders, margins: cellMargins, width: { size: 2000, type: WidthType.DXA }, children: [para(`${cb('conformite')} CONFORMITÉ`, { sz: 18, bold: true, color: '1F7A4D' })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 4000, type: WidthType.DXA }, children: [para('Aucune anomalie détectée', { sz: 18 })] }),
              new TableCell({ borders, margins: cellMargins, width: { size: 3026, type: WidthType.DXA }, children: [para('Document de clôture favorable', { sz: 18 })] }),
            ]}),
          ]}),
          para(bag.detailAnomalie ? `Détail des anomalies : ${bag.detailAnomalie}` : '', { sz: 18 }),

          // ── SECTION IV ──
          section('IV. Préconisations & Conclusions'),
          subsection('◆  4.1 Analyse de viabilité'),
          para(bag.conclusionViabilite || '[ À compléter ]', { sz: 18 }),

          subsection('◆  4.2 Préconisations officielles'),
          para('Mesures applicables :'),
          ...[
            [`${cb('redressement')} Redressement fiscal`, bag.montantRedressement ? `Montant : ${bag.montantRedressement}$` : ''],
            [`${cb('amende')} Amende pour retard`, bag.montantAmende ? `Montant : ${bag.montantAmende}$` : ''],
            [`${cb('exoneration')} Exonération fiscale`, [bag.dureeExoneration, bag.motifExoneration].filter(Boolean).join(' — ')],
            [`${cb('subvFonctionnement')} Subvention fonctionnement`, bag.montantSubvFonct ? `Montant : ${bag.montantSubvFonct}$` : ''],
            [`${cb('subvUrgence')} Subvention urgence`, bag.montantSubvUrgence ? `Montant : ${bag.montantSubvUrgence}$` : ''],
            [`${cb('aideRH')} Aide au recrutement / formation`, ''],
            [`${cb('fermeture')} Fermeture administrative`, ''],
            [`${cb('fraude')} Transmission dossier Fraude Fiscale`, ''],
            [bag.autrePreco ? `☑ Autre : ${bag.autrePreco}` : `${cb('redressement')} Autre`, ''],
          ].map(([lbl, detail]) => new Paragraph({
            numbering: { reference: 'bullets', level: 0 },
            children: [new TextRun({ text: detail ? `${lbl} — ${detail}` : lbl, font: 'Arial', size: 18 })]
          })),
          para(bag.preconisationsDetail || '', { sz: 18 }),

          subsection('◆  4.3 Résumé pour la direction'),
          para(bag.resumeDiscord || '[ Résumé 2 lignes pour Discord ]', { sz: 18 }),

          // ── SIGNATURE ──
          new Paragraph({ spacing: { before: 400 } }),
          para('Je soussigné(e), certifie sur l\'honneur l\'exactitude des informations contenues dans le présent rapport.', { sz: 18 }),
          new Paragraph({ spacing: { before: 80 } }),
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [2500, cw - 2500], rows: [
            fieldRow('Fait à Los Santos, le', bag.dateFait || '—'),
            fieldRow('Contrôleur fiscal', bag.nomCF || '—'),
            fieldRow('Validé par (DOF)', bag.nomDOF || '—'),
          ]}),

          // ── ANNEXE A ──
          section('ANNEXE A — Expertise Comptable & Conseil Entreprise'),
          subsection('◆  A.2 Calcul des amendes applicables'),
          new Table({ width: { size: cw, type: WidthType.DXA }, columnWidths: [3500, 1500, 2000, 2026], rows: [
            new TableRow({ children: ['Type infraction','Barème','Montant calculé','Justification'].map((h, i) =>
              new TableCell({ borders, margins: cellMargins, width: { size: [3500,1500,2000,2026][i], type: WidthType.DXA },
                shading: { fill: NAVY, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: WHITE, size: 18, font: 'Arial' })] })]
              }))
            }),
            ...[
              ['Retard décl. (Évèn./LTD/Resto)', '700$/h', bag.montantAmRetardEvt, bag.calcAmRetardEvt],
              ['Retard décl. (Prod./Util./Pol.)', '2 000$/h', bag.montantAmRetardProd, bag.calcAmRetardProd],
              ['Retard paiement < 24h', '+2%', bag.montantAmRetard24h, ''],
              ['Retard paiement 24-48h', '+5%', bag.montantAmRetard48h, ''],
              ['Retard paiement 48-72h', '+10%', bag.montantAmRetard72h, ''],
              ['Document manquant', '2%', bag.montantAmDocManquant, ''],
              ['Déduction non justifiée', '6%', bag.montantAmDeductNonJust, ''],
              ['TOTAL AMENDES', '—', bag.totalAmendes, '—'],
            ].map(([type, bareme, montant, just]) =>
              new TableRow({ children: [
                new TableCell({ borders, margins: cellMargins, width: { size: 3500, type: WidthType.DXA }, children: [para(type, { sz: 18, bold: type === 'TOTAL AMENDES' })] }),
                new TableCell({ borders, margins: cellMargins, width: { size: 1500, type: WidthType.DXA }, children: [para(bareme, { sz: 18 })] }),
                new TableCell({ borders, margins: cellMargins, width: { size: 2000, type: WidthType.DXA }, children: [para(montant || '—', { sz: 18 })] }),
                new TableCell({ borders, margins: cellMargins, width: { size: 2026, type: WidthType.DXA }, children: [para(just || '—', { sz: 18 })] }),
              ]})
            ),
          ]}),

          subsection('◆  A.4 Recommandations stratégiques'),
          ...[bag.recourtTerme, bag.recoMoyenTerme, bag.recoLongTerme, bag.pointsAttention].filter(Boolean).map(r =>
            new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: r, font: 'Arial', size: 18 })] })
          ),

          // Footer confidentiel
          new Paragraph({ spacing: { before: 600 } }),
          para('Department of Finance — Government of San Andreas', { sz: 16, color: '888888' }),
          para('Document confidentiel — Usage interne exclusif', { sz: 14, color: GOLD }),
        ]
      }]
    })

    const buffer = await Packer.toBuffer(doc)
    const filename = `BAG_${bag.entreprise.replace(/[^a-zA-Z0-9]/g, '_') || 'Document'}_${bag.dateAudit || new Date().toISOString().split('T')[0]}.docx`

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      }
    })
  } catch (err) {
    console.error('Export BAG error:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du document' }, { status: 500 })
  }
}
