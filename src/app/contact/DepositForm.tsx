'use client';

import { useEffect, useRef, useState } from 'react';
import { Magnetic } from '@/components/ui/Magnetic';
import { SITE } from '@/data/site';
import s from './contact.module.css';

const CLASSES = [
  'Biological',
  'Linguistic',
  'Civic',
  'Technical',
  'Astronomical',
  'Material',
  'Other',
];

type Errors = Partial<Record<'name' | 'email' | 'kind' | 'body', string>>;

/**
 * The deposit proposal.
 *
 * There is no server behind this site, and a form that silently
 * pretends to submit is worse than no form at all. This one validates
 * properly and then hands a fully composed message to the visitor's own
 * mail client — so the button does exactly what it says, and the
 * visitor keeps a copy of what they sent.
 */
export function DepositForm() {
  const [values, setValues] = useState({
    name: '',
    org: '',
    email: '',
    kind: '',
    body: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState(false);
  const sentRef = useRef<HTMLDivElement>(null);

  const validate = (v: typeof values): Errors => {
    const e: Errors = {};
    if (!v.name.trim()) e.name = 'Required';
    if (!v.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Not a valid address';
    if (!v.kind) e.kind = 'Choose a class';
    if (v.body.trim().length < 24) e.body = 'Tell us what it is — 24 characters minimum';
    return e;
  };

  const set = (k: keyof typeof values) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...values, [k]: ev.target.value };
    setValues(next);
    if (touched[k]) setErrors(validate(next));
  };

  const blur = (k: string) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate(values));
  };

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(values);
    setErrors(e);
    setTouched({ name: true, email: true, kind: true, body: true });
    if (Object.keys(e).length) {
      // Send focus to the first problem rather than leaving the visitor
      // to hunt for it. Driven off the computed errors, not the DOM:
      // the invalid attributes are not painted until React re-renders,
      // so querying for them here would always come back empty.
      const order: (keyof Errors)[] = ['name', 'email', 'kind', 'body'];
      const firstBad = order.find((k) => e[k]);
      if (firstBad) document.getElementById(`f-${firstBad}`)?.focus();
      return;
    }

    const subject = `Deposit proposal — ${values.kind} — ${values.name}`;
    const lines = [
      `Name: ${values.name}`,
      values.org ? `Organisation: ${values.org}` : null,
      `Email: ${values.email}`,
      `Class: ${values.kind}`,
      '',
      values.body,
      '',
      '— Submitted via chronolith.institute',
    ].filter(Boolean);

    window.location.href = `mailto:${SITE.contact.deposit}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(lines.join('\n'))}`;
    setSent(true);
  };

  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  if (sent) {
    return (
      <div className={s.sent} ref={sentRef} tabIndex={-1} role="status">
        <span className="u-meta">Proposal composed</span>
        <p className={s.sentTitle}>Your mail client should now be open.</p>
        <p style={{ color: 'var(--fg-muted)', lineHeight: 1.6 }}>
          If nothing happened, send the proposal directly to{' '}
          <a className={s.aLink} href={`mailto:${SITE.contact.deposit}`} data-cursor="link">
            {SITE.contact.deposit}
          </a>
          . The selection committee sits four times a year; every proposal receives a
          written answer, including the ones we turn down.
        </p>
        <button
          type="button"
          className={s.submit}
          data-cursor="link"
          onClick={() => setSent(false)}
        >
          Write another
        </button>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate>
      <div className={s.row2}>
        <div className={s.field} data-invalid={!!errors.name}>
          <label className={`${s.label} u-meta`} htmlFor="f-name">
            <span>Name</span>
            <span className={s.error}>{errors.name}</span>
          </label>
          <input
            id="f-name"
            className={s.input}
            value={values.name}
            onChange={set('name')}
            onBlur={blur('name')}
            aria-invalid={!!errors.name}
            autoComplete="name"
            placeholder="Who is proposing"
          />
        </div>

        <div className={s.field}>
          <label className={`${s.label} u-meta`} htmlFor="f-org">
            <span>Organisation</span>
            <span className="u-meta" style={{ opacity: 0.5 }}>
              Optional
            </span>
          </label>
          <input
            id="f-org"
            className={s.input}
            value={values.org}
            onChange={set('org')}
            autoComplete="organization"
            placeholder="If any"
          />
        </div>
      </div>

      <div className={s.row2}>
        <div className={s.field} data-invalid={!!errors.email}>
          <label className={`${s.label} u-meta`} htmlFor="f-email">
            <span>Email</span>
            <span className={s.error}>{errors.email}</span>
          </label>
          <input
            id="f-email"
            type="email"
            className={s.input}
            value={values.email}
            onChange={set('email')}
            onBlur={blur('email')}
            aria-invalid={!!errors.email}
            autoComplete="email"
            placeholder="Where the answer goes"
          />
        </div>

        <div className={s.field} data-invalid={!!errors.kind}>
          <label className={`${s.label} u-meta`} htmlFor="f-kind">
            <span>Class</span>
            <span className={s.error}>{errors.kind}</span>
          </label>
          <select
            id="f-kind"
            className={s.select}
            value={values.kind}
            onChange={set('kind')}
            onBlur={blur('kind')}
            aria-invalid={!!errors.kind}
          >
            <option value="">Select</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={s.field} data-invalid={!!errors.body}>
        <label className={`${s.label} u-meta`} htmlFor="f-body">
          <span>What is it, and why can it not be reconstructed?</span>
          <span className={s.error}>{errors.body}</span>
        </label>
        <textarea
          id="f-body"
          className={s.textarea}
          rows={5}
          value={values.body}
          onChange={set('body')}
          onBlur={blur('body')}
          aria-invalid={!!errors.body}
          placeholder="The second half of that question is the one the committee actually reads."
        />
      </div>

      <Magnetic strength={12} field={100}>
        <button type="submit" className={s.submit} data-cursor="link">
          <span>Submit proposal</span>
          <span className={s.submitArrow} aria-hidden="true">
            →
          </span>
        </button>
      </Magnetic>
    </form>
  );
}
