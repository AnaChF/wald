import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import db from '../db/index';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const canopyReportRouter = Router();

function safeJSON<T>(v: string | null | undefined, fallback: T): T {
  if (v == null) return fallback;
  try { return JSON.parse(v) as T; } catch { return fallback; }
}

function hr(doc: PDFKit.PDFDocument) {
  doc.moveDown(0.5)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke('rgba(45,96,72,0.4)')
    .moveDown(0.5);
}

function sectionHead(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(1)
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor('#1C1C1C')
    .text(text);
  hr(doc);
}

function label(doc: PDFKit.PDFDocument, text: string) {
  doc.font('Courier').fontSize(8).fillColor('#6B6B6B').text(text.toUpperCase());
}

function body(doc: PDFKit.PDFDocument, text: string) {
  doc.font('Helvetica').fontSize(10).fillColor('#1C1C1C').text(text || '—', { lineGap: 3 });
}

function mono(doc: PDFKit.PDFDocument, text: string) {
  doc.font('Courier').fontSize(9).fillColor('#2D6048').text(text);
}

// GET /api/canopy/session/:id/report  — returns PDF
canopyReportRouter.get('/canopy/session/:id/report', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const shareToken = req.query.share_token as string | undefined;

  const session = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id').get({ id }) as
    Record<string, unknown> | undefined;
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  if (
    session.visibility !== 'shared' &&
    session.user_id !== req.userId &&
    !(shareToken && shareToken === session.share_token)
  ) { res.status(403).json({ error: 'Access denied' }); return; }

  const signals = db.prepare('SELECT * FROM canopy_signals WHERE session_id = @id ORDER BY created_at ASC').all({ id }) as
    Record<string, unknown>[];
  const scenarios = db.prepare('SELECT * FROM canopy_scenarios WHERE session_id = @id ORDER BY created_at ASC').all({ id }) as
    Record<string, unknown>[];
  const forecast = db.prepare(
    'SELECT * FROM canopy_forecasts WHERE session_id = @id ORDER BY created_at DESC LIMIT 1'
  ).get({ id }) as Record<string, unknown> | undefined;

  const milestones = safeJSON<Array<Record<string, unknown>>>(forecast?.milestones as string, []);
  const seeds = safeJSON<Array<Record<string, unknown>>>(forecast?.harvest_tree_seeds as string, []);
  const cla = safeJSON<Record<string, unknown>>(session.brick_seed as string, null);
  const triangle = safeJSON<Record<string, unknown>>(session.audit_result_seed as string, null);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="canopy-report-${id.slice(0, 8)}.pdf"`,
  );

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: `Canopy™ Report — ${(session.title as string) ?? 'Session'}`,
      Author: 'Canopy™ · Wald™ ecosystem',
    },
  });

  doc.pipe(res);

  // ─── Cover ───────────────────────────────────────────────────────────────────────────
  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor('#1C1C1C')
    .text('Canopy™', { align: 'left' })
    .moveDown(0.3)
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#6B6B6B')
    .text('Strategic Foresight Report · Wald™ ecosystem')
    .moveDown(1.5)
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#1C1C1C')
    .text((session.title as string) || 'Untitled session')
    .moveDown(0.5);

  if (session.foresight_question) {
    doc.font('Helvetica-Oblique').fontSize(12).fillColor('#3A3A3A')
      .text(`“${session.foresight_question as string}”`, { lineGap: 4 })
      .moveDown(0.5);
  }

  doc.font('Courier').fontSize(8).fillColor('#9B9B9B')
    .text(`Session ${id} · Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  if (session.centre_description) {
    doc.moveDown(0.4).font('Helvetica').fontSize(9).fillColor('#6B6B6B')
      .text(`Centre: ${session.centre_description as string}`);
  }

  hr(doc);

  // ─── 1. Signal Database ───────────────────────────────────────────────────────────────
  sectionHead(doc, '1. Signal Database');
  doc.font('Courier').fontSize(8).fillColor('#6B6B6B')
    .text(`${signals.length} signal${signals.length !== 1 ? 's' : ''} recorded`);
  doc.moveDown(0.5);

  if (signals.length > 0) {
    for (const sig of signals) {
      doc.font('Helvetica').fontSize(10).fillColor('#1C1C1C')
        .text(sig.text as string, { continued: false });
      const meta = [
        sig.logic_type, sig.strength, sig.cw_class ? `${sig.cw_class as string}-intension` : null,
        sig.domain, sig.futures_cone_layer,
      ].filter(Boolean).join(' · ');
      if (meta) {
        doc.font('Courier').fontSize(8).fillColor('#2D6048').text(meta).moveDown(0.4);
      } else {
        doc.moveDown(0.4);
      }
    }
  } else {
    body(doc, 'No signals recorded.');
  }

  // ─── 2. Futures Triangle ──────────────────────────────────────────────────────────
  const ft = (triangle as any)?.futures_triangle;
  if (ft) {
    sectionHead(doc, '2. Futures Triangle Report');
    for (const [panel, items] of [['Push', ft.push], ['Weight', ft.weight], ['Pull', ft.pull]] as [string, string[]][]) {
      if (items?.length) {
        label(doc, panel);
        for (const item of items) body(doc, `• ${item}`);
        doc.moveDown(0.5);
      }
    }
    if (ft.tensions?.length) {
      label(doc, 'Tensions identified');
      for (const t of ft.tensions as Array<Record<string, unknown>>) {
        body(doc, `${t.type as string} [${t.magnitude as string}]: ${t.description as string}`);
      }
    }
  }

  // ─── 3. Narrative Inventory (CLA) ───────────────────────────────────────────────────
  if (cla) {
    sectionHead(doc, '3. Narrative Inventory (Depth Lens)');
    for (const [level, key] of [['Litany', 'litany'], ['Systemic', 'systemic'], ['Worldview', 'worldview'], ['Metaphor / Deep Story', 'metaphor']] as [string, string][]) {
      if ((cla as any)[key]) {
        label(doc, level);
        body(doc, (cla as any)[key] as string);
        doc.moveDown(0.5);
      }
    }
    if ((cla as any).centre_attributions?.length) {
      label(doc, 'Centre attributions');
      for (const ca of (cla as any).centre_attributions as Array<Record<string, unknown>>) {
        body(doc, `${ca.name as string}${ca.role ? ` — ${ca.role as string}` : ''}`);
      }
    }
  }

  // ─── 4. Scenarios ──────────────────────────────────────────────────────────────────────
  if (scenarios.length > 0) {
    sectionHead(doc, '4. Scenarios');
    for (const sc of scenarios) {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#1C1C1C')
        .text(sc.title as string);

      const certBadge = (sc.consistency_certified && sc.iia_pass)
        ? 'CERTIFIED'
        : 'DRAFT';
      mono(doc, certBadge);
      if (sc.arrow_failure_flag) mono(doc, 'arrow: flagged');
      doc.moveDown(0.5);

      if (sc.narrative) {
        body(doc, sc.narrative as string);
        doc.moveDown(0.5);
      }

      const claIncast = safeJSON<Record<string, unknown>>(sc.cla_incast as string, null);
      if (claIncast) {
        label(doc, 'CLA Incast');
        for (const [k, v] of Object.entries(claIncast)) {
          if (typeof v === 'string' && v) {
            doc.font('Courier').fontSize(8).fillColor('#6B6B6B').text(k.toUpperCase(), { continued: true })
              .font('Helvetica').fontSize(9).fillColor('#1C1C1C').text(`  ${v}`);
          }
        }
        doc.moveDown(0.5);
      }

      const cwMap = safeJSON<Record<string, unknown>>(sc.cw_map as string, null);
      if (cwMap) {
        const wEls = (cwMap.w_elements as Array<Record<string, unknown>>) ?? [];
        const cEls = (cwMap.c_elements as Array<Record<string, unknown>>) ?? [];
        if (wEls.length + cEls.length > 0) {
          label(doc, 'C/W Map');
          for (const el of wEls) {
            doc.font('Helvetica').fontSize(9).fillColor('#2D6048')
              .text(`W  ${el.text as string} [${((el.confidence as number) * 100).toFixed(0)}%]`);
          }
          for (const el of cEls) {
            doc.font('Helvetica').fontSize(9).fillColor('#C17E3A')
              .text(`C  ${el.text as string} [${((el.confidence as number) * 100).toFixed(0)}%]`);
          }
        }
      }
    }
  }

  // ─── 5. Backcasting Forecast ───────────────────────────────────────────────────────
  if (milestones.length > 0) {
    doc.addPage();
    sectionHead(doc, '5. Backcasting Forecast');
    doc.font('Courier').fontSize(8).fillColor('#6B6B6B')
      .text(`${forecast?.time_horizon_years ?? '?'}-year horizon`);
    doc.moveDown(0.5);

    for (const m of milestones) {
      const isEarliest = (safeJSON<string[]>(forecast?.earliest_decisions as string, [])).includes(m.id as string);
      doc.font('Courier').fontSize(8)
        .fillColor(isEarliest ? '#D4A843' : '#2D6048')
        .text(`+${m.year_offset as number}y  ${(m.type as string).toUpperCase()}${isEarliest ? '  ◆ earliest decision' : ''}`);
      doc.font('Helvetica').fontSize(10).fillColor('#1C1C1C')
        .text(m.description as string, { indent: 16, lineGap: 2 })
        .moveDown(0.4);
    }
  }

  // ─── 6. Harvest Tree Seeds ──────────────────────────────────────────────────────────
  if (seeds.length > 0) {
    doc.moveDown(1);
    sectionHead(doc, '6. Harvest Tree Seeds');
    const byLayer: Record<string, Array<Record<string, unknown>>> = {};
    for (const s of seeds) {
      const layer = (s.layer as string) ?? 'unassigned';
      (byLayer[layer] ??= []).push(s);
    }
    for (const layer of ['roots', 'trunk', 'branches', 'leaves', 'fruits']) {
      if (byLayer[layer]?.length) {
        label(doc, layer);
        for (const s of byLayer[layer]) body(doc, s.text as string);
        doc.moveDown(0.4);
      }
    }
  }

  // ─── Footer ─────────────────────────────────────────────────────────────────────────
  doc.moveDown(2)
    .font('Courier').fontSize(7).fillColor('#AAAAAA')
    .text('Canopy™ · Part of the Wald™ ecosystem · CC BY-NC-SA 4.0 INTL', { align: 'center' });

  doc.end();
});

// GET /api/canopy/session/:id/report.json  — programmatic JSON access
canopyReportRouter.get('/canopy/session/:id/report.json', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const session = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id').get({ id }) as
    Record<string, unknown> | undefined;
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  const signals = db.prepare('SELECT * FROM canopy_signals WHERE session_id = @id').all({ id }) as Record<string, unknown>[];
  const scenarios = db.prepare('SELECT * FROM canopy_scenarios WHERE session_id = @id').all({ id }) as Record<string, unknown>[];
  const forecast = db.prepare(
    'SELECT * FROM canopy_forecasts WHERE session_id = @id ORDER BY created_at DESC LIMIT 1'
  ).get({ id }) as Record<string, unknown> | undefined;
  res.json({ data: { session, signals, scenarios, forecast } });
});
