'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { RECORDS } from '@/data/site';
import s from './register.module.css';

const PlateViewer = dynamic(
  () => import('@/components/three/PlateViewer').then((m) => m.PlateViewer),
  { ssr: false },
);

/**
 * The register.
 *
 * Hover moves the WebGL viewer to that record; click opens its detail
 * in place. Rows are real buttons with aria-expanded, so the whole
 * register is operable from the keyboard — focus drives the viewer
 * exactly the way hover does.
 */
export function RegisterList() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const plates = RECORDS.map((r) => r.plate);

  return (
    <div className={s.body}>
      <div>
        <div className={`${s.listHead} u-meta`}>
          <span>Ref</span>
          <span>Deposit</span>
          <span className={s.listHeadHide}>Volume</span>
          <span className={s.listHeadHide}>Status</span>
        </div>

        <div className={s.list}>
          {RECORDS.map((r, i) => {
            const isOpen = open === r.id;
            return (
              <div key={r.id}>
                <button
                  type="button"
                  className={s.row}
                  data-open={isOpen}
                  data-cursor="view"
                  aria-expanded={isOpen}
                  aria-controls={`detail-${r.id}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setOpen(isOpen ? null : r.id)}
                >
                  <span className={s.rowGrid}>
                    <span className="u-meta">{r.ref}</span>
                    <span>
                      <span className={s.rowTitle}>{r.title}</span>
                    </span>
                    <span className={`${s.rowHide} u-meta`}>{r.volume}</span>
                    <span className={`${s.rowHide} ${s.rowStatus} u-meta`}>
                      <span className={s.dot} data-status={r.status} aria-hidden="true" />
                      {r.status}
                    </span>
                  </span>
                  <span className={s.rowRule} aria-hidden="true" />
                </button>

                <div id={`detail-${r.id}`} className={s.detail} data-open={isOpen}>
                  <div className={s.detailInner}>
                    <div className={s.detailPad}>
                      <p className={s.detailText}>{r.summary}</p>
                      <p className={s.detailText}>{r.detail}</p>
                      <div className={`${s.detailFacts} u-meta`}>
                        <span>Class — {r.kind}</span>
                        <span>Volume — {r.volume}</span>
                        <span>Deposited — {r.deposited}</span>
                        <span>Status — {r.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <figure className={s.viewerWrap}>
        <span className={`${s.viewerCorner} u-meta`}>{RECORDS[active].ref}</span>
        <PlateViewer plates={plates} active={active} />
        <figcaption className={`${s.viewerMeta} u-meta`}>
          <span>{RECORDS[active].title}</span>
          <span>{RECORDS[active].deposited}</span>
        </figcaption>
      </figure>
    </div>
  );
}
