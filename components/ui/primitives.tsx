"use client";

import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="app-page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="app-lead">{description}</p>
      </div>
      {actions ? <div className="app-header-actions">{actions}</div> : null}
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  return <span className={`status-chip status-${status.toLowerCase()}`}>{status.replaceAll("_", " ")}</span>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="app-panel empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}

export function Banner({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "error" | "ok";
  children: React.ReactNode;
}) {
  return <div className={`app-banner tone-${tone}`}>{children}</div>;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="app-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: string },
) {
  const { href, ...rest } = props;
  if (href) {
    return (
      <Link className="primary-btn" href={href}>
        {props.children}
      </Link>
    );
  }
  return <button className="primary-btn" {...rest} />;
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className="secondary-btn" type={props.type ?? "button"} {...props} />;
}

export function DataSource({ label }: { label: "on-chain" | "off-chain" | "estimate" | "ai" }) {
  return <span className={`source-tag source-${label}`}>{label}</span>;
}
