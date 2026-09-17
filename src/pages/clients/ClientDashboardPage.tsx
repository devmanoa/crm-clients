import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, FileText, Receipt, TrendingUp, TrendingDown,
  AlertTriangle, Wallet, Copy, MailWarning,
} from 'lucide-react';
import { clientService } from '@/services/clientService';
import { formatCurrency } from '@/lib/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { DashboardStats } from '@/types/client';

// Palette catégorielle à 2 séries, validée (deutan ΔE 22.1, tritan 11.8,
// normal 27.1, contraste > 3:1 sur surface blanche). Ne pas remplacer une
// teinte sans revalider.
const SERIES_DEVIS = '#4F46E5';
const SERIES_FACTURE = '#0D9488';

const DEVIS_STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  annule: 'Annulé',
};

const FACTURE_STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  emise: 'Émise',
  payee: 'Payée',
  partiellement_payee: 'Partiellement payée',
  annulee: 'Annulée',
  en_recouvrement: 'En recouvrement',
};

function apiError(err: unknown, fallback: string): string {
  const res = (err as { response?: { data?: { error?: string } } })?.response;
  return res?.data?.error || fallback;
}

/** Montant abrégé pour les axes : 1 234 567 € -> 1,2 M€ */
function shortAmount(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M€`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} k€`;
  return `${Math.round(n)} €`;
}

function monthLabel(iso: string): string {
  const [y, m] = iso.split('-');
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'short' })
    .replace('.', '');
}

/** Tuile d'indicateur. Le nombre porte le message, l'icône est secondaire. */
function StatTile({
  icon,
  label,
  value,
  hint,
  tone = 'default',
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: React.ReactNode;
  tone?: 'default' | 'warning' | 'danger';
  to?: string;
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-[--k-danger]'
      : tone === 'warning'
        ? 'text-[--k-warning]'
        : 'text-[--k-text]';

  const body = (
    <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-4 h-full">
      <div className="flex items-center gap-2 text-[--k-muted]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {hint && <div className="mt-1 text-[12px] text-[--k-muted]">{hint}</div>}
    </div>
  );

  return to ? (
    <Link to={to} className="block hover:brightness-[0.98] transition">
      {body}
    </Link>
  ) : (
    body
  );
}

/**
 * Histogramme groupé devis / factures sur 12 mois, en SVG.
 * Une seule échelle de valeur pour les deux séries — jamais deux axes Y.
 */
function MonthlyChart({ data }: { data: DashboardStats['monthly'] }) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(1, ...data.flatMap((d) => [d.devisHt, d.factureTtc]));
  // Arrondi à un palier lisible pour que la ligne haute tombe juste.
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;

  const W = 760;
  const H = 240;
  const padL = 56;
  const padB = 28;
  const padT = 8;
  const plotW = W - padL - 8;
  const plotH = H - padB - padT;

  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(14, (slot - 6) / 2);
  const y = (v: number) => padT + plotH - (v / top) * plotH;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => top * f);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Devis et factures des 12 derniers mois"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={W - 8}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--k-border)"
              strokeWidth={1}
            />
            <text
              x={padL - 8}
              y={y(t) + 4}
              textAnchor="end"
              className="fill-[--k-muted]"
              style={{ fontSize: 10 }}
            >
              {shortAmount(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x0 = padL + i * slot;
          const cx = x0 + slot / 2;
          const isHover = hover === i;
          return (
            <g key={d.month}>
              {/* Cible de survol plus large que les barres. */}
              <rect
                x={x0}
                y={padT}
                width={slot}
                height={plotH}
                fill={isHover ? 'var(--k-surface-2)' : 'transparent'}
                opacity={isHover ? 0.6 : 1}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <rect
                x={cx - barW - 1}
                y={y(d.devisHt)}
                width={barW}
                height={Math.max(0, plotH + padT - y(d.devisHt))}
                rx={4}
                fill={SERIES_DEVIS}
                pointerEvents="none"
              />
              <rect
                x={cx + 1}
                y={y(d.factureTtc)}
                width={barW}
                height={Math.max(0, plotH + padT - y(d.factureTtc))}
                rx={4}
                fill={SERIES_FACTURE}
                pointerEvents="none"
              />
              <text
                x={cx}
                y={H - 8}
                textAnchor="middle"
                className="fill-[--k-muted]"
                style={{ fontSize: 10 }}
              >
                {monthLabel(d.month)}
              </text>
            </g>
          );
        })}

        <line x1={padL} x2={W - 8} y1={y(0)} y2={y(0)} stroke="var(--k-muted)" strokeWidth={1} />
      </svg>

      {hover !== null && data[hover] && (
        <div className="absolute top-0 right-0 rounded-xl border border-[--k-border] bg-[--k-surface] shadow-lg px-3 py-2 text-[12px] pointer-events-none">
          <p className="font-medium text-[--k-text] mb-1">
            {new Date(`${data[hover].month}-01`).toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="flex items-center gap-2 text-[--k-muted]">
            <span className="w-2 h-2 rounded-full" style={{ background: SERIES_DEVIS }} />
            Devis <span className="text-[--k-text] tabular-nums">{formatCurrency(data[hover].devisHt)}</span>
          </p>
          <p className="flex items-center gap-2 text-[--k-muted]">
            <span className="w-2 h-2 rounded-full" style={{ background: SERIES_FACTURE }} />
            Factures <span className="text-[--k-text] tabular-nums">{formatCurrency(data[hover].factureTtc)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/** Répartition en barres horizontales, triée par valeur décroissante. */
function StatusBars({
  entries,
  labels,
  color,
  format,
}: {
  entries: [string, { count: number; totalHt?: number; totalTtc?: number }][];
  labels: Record<string, string>;
  color: string;
  format: (e: { count: number; totalHt?: number; totalTtc?: number }) => string;
}) {
  const max = Math.max(1, ...entries.map(([, v]) => v.count));

  if (entries.length === 0) {
    return <p className="text-[13px] text-[--k-muted]">Aucune donnée.</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map(([status, v]) => (
        <li key={status}>
          <div className="flex items-baseline justify-between gap-2 text-[12px]">
            <span className="text-[--k-text]">{labels[status] ?? status}</span>
            <span className="text-[--k-muted] tabular-nums shrink-0">
              {v.count} · {format(v)}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[--k-surface-2] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(v.count / max) * 100}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ClientDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    clientService
      .getDashboardStats()
      .then((res) => {
        if (!cancelled) setStats(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(apiError(err, 'Impossible de charger le tableau de bord'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-[--k-danger]">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const { clients, devis, factures, monthly, topClients, bySector } = stats;
  const growth = clients.newThisMonth - clients.newPrevMonth;

  const devisEntries = Object.entries(devis.byStatus).sort((a, b) => b[1].count - a[1].count);
  const factureEntries = Object.entries(factures.byStatus).sort((a, b) => b[1].count - a[1].count);
  const maxSector = Math.max(1, ...bySector.map((s) => s.clientCount));
  const maxTop = Math.max(1, ...topClients.map((c) => c.totalTtc));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[--k-text]">Tableau de bord clients</h1>
        <p className="text-[13px] text-[--k-muted] mt-0.5">
          Vue d'ensemble du portefeuille et de l'activité commerciale
        </p>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          icon={<Users className="w-4 h-4" />}
          label="Clients actifs"
          value={clients.total.toLocaleString('fr-FR')}
          to="/clients"
          hint={
            <span className="flex items-center gap-1">
              {growth >= 0 ? (
                <TrendingUp className="w-3 h-3 text-[--k-success]" />
              ) : (
                <TrendingDown className="w-3 h-3 text-[--k-danger]" />
              )}
              {clients.newThisMonth} ce mois-ci
              <span className="text-[--k-muted]">
                ({growth >= 0 ? '+' : ''}
                {growth} vs mois dernier)
              </span>
            </span>
          }
        />
        <StatTile
          icon={<Receipt className="w-4 h-4" />}
          label="CA facturé"
          value={formatCurrency(factures.revenue)}
          hint="Factures payées et partiellement payées"
        />
        <StatTile
          icon={<Wallet className="w-4 h-4" />}
          label="Restant dû"
          value={formatCurrency(factures.outstanding)}
          tone={factures.outstanding > 0 ? 'warning' : 'default'}
          hint="Sur factures émises, partielles et en recouvrement"
        />
        <StatTile
          icon={<FileText className="w-4 h-4" />}
          label="Conversion devis"
          value={devis.conversionRate === null ? '—' : `${devis.conversionRate} %`}
          hint={
            devis.conversionRate === null
              ? 'Aucun devis tranché'
              : `Acceptés sur devis tranchés · ${formatCurrency(devis.pendingAmount)} en attente`
          }
        />
      </div>

      {/* Alertes : uniquement si elles ont une valeur */}
      {(factures.overdueCount > 0 || clients.withoutEmail > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {factures.overdueCount > 0 && (
            <StatTile
              icon={<AlertTriangle className="w-4 h-4" />}
              label="Factures en recouvrement"
              value={String(factures.overdueCount)}
              tone="danger"
              hint="À traiter en priorité"
            />
          )}
          {clients.withoutEmail > 0 && (
            <StatTile
              icon={<MailWarning className="w-4 h-4" />}
              label="Clients sans email"
              value={clients.withoutEmail.toLocaleString('fr-FR')}
              tone="warning"
              hint="Fiches à compléter"
            />
          )}
        </div>
      )}

      {/* Activité sur 12 mois */}
      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-[14px] font-semibold text-[--k-text]">Activité sur 12 mois</h2>
          <div className="flex items-center gap-4 text-[12px] text-[--k-muted]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SERIES_DEVIS }} />
              Devis (HT)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SERIES_FACTURE }} />
              Factures (TTC)
            </span>
          </div>
        </div>
        {monthly.length === 0 ? (
          <p className="text-[13px] text-[--k-muted]">Aucune donnée sur la période.</p>
        ) : (
          <MonthlyChart data={monthly} />
        )}
      </div>

      {/* Répartitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-4">
          <h2 className="text-[14px] font-semibold text-[--k-text] mb-3">
            Devis par statut
            <span className="ml-2 text-[12px] font-normal text-[--k-muted]">{devis.total} au total</span>
          </h2>
          <StatusBars
            entries={devisEntries}
            labels={DEVIS_STATUS_LABELS}
            color={SERIES_DEVIS}
            format={(v) => formatCurrency(v.totalHt ?? 0)}
          />
        </div>

        <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-4">
          <h2 className="text-[14px] font-semibold text-[--k-text] mb-3">
            Factures par statut
            <span className="ml-2 text-[12px] font-normal text-[--k-muted]">
              {factures.total} au total
            </span>
          </h2>
          <StatusBars
            entries={factureEntries}
            labels={FACTURE_STATUS_LABELS}
            color={SERIES_FACTURE}
            format={(v) => formatCurrency(v.totalTtc ?? 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top clients */}
        <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-4">
          <h2 className="text-[14px] font-semibold text-[--k-text] mb-3">
            Top 10 clients par CA facturé
          </h2>
          {topClients.length === 0 ? (
            <p className="text-[13px] text-[--k-muted]">Aucune facture enregistrée.</p>
          ) : (
            <ol className="space-y-2">
              {topClients.map((c, i) => (
                <li key={c.id}>
                  <div className="flex items-baseline justify-between gap-2 text-[12px]">
                    <Link
                      to={`/clients/${c.id}`}
                      className="truncate text-[--k-text] hover:text-[--k-primary] hover:underline"
                    >
                      <span className="text-[--k-muted] tabular-nums mr-1.5">{i + 1}.</span>
                      {c.label}
                    </Link>
                    <span className="text-[--k-muted] tabular-nums shrink-0">
                      {formatCurrency(c.totalTtc)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[--k-surface-2] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.totalTtc / maxTop) * 100}%`, background: SERIES_FACTURE }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Secteurs */}
        <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-[--k-text]">Secteurs d'activité</h2>
            <Link to="/settings/sectors" className="text-[12px] text-[--k-primary] hover:underline">
              Gérer
            </Link>
          </div>
          {bySector.length === 0 ? (
            <p className="text-[13px] text-[--k-muted]">Aucun secteur rattaché à un client.</p>
          ) : (
            <ul className="space-y-2">
              {bySector.map((s) => (
                <li key={s.id}>
                  <div className="flex items-baseline justify-between gap-2 text-[12px]">
                    <span className="truncate text-[--k-text]">{s.nom}</span>
                    <span className="text-[--k-muted] tabular-nums shrink-0">{s.clientCount}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[--k-surface-2] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(s.clientCount / maxSector) * 100}%`,
                        background: SERIES_DEVIS,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Composition du portefeuille */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile
          icon={<Building2 className="w-4 h-4" />}
          label="Professionnels"
          value={clients.corporations.toLocaleString('fr-FR')}
          hint={`${Math.round((clients.corporations / Math.max(1, clients.total)) * 100)} % du portefeuille`}
        />
        <StatTile
          icon={<Users className="w-4 h-4" />}
          label="Particuliers"
          value={clients.persons.toLocaleString('fr-FR')}
          hint={`${Math.round((clients.persons / Math.max(1, clients.total)) * 100)} % du portefeuille`}
        />
        <StatTile
          icon={<Copy className="w-4 h-4" />}
          label="Clients qualifiés"
          value={clients.qualified.toLocaleString('fr-FR')}
          to="/clients/duplicates"
          hint="Voir aussi les doublons à traiter"
        />
      </div>
    </div>
  );
}
