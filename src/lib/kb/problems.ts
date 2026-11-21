// What a big ticket holds, problem by problem. causes.ts says which cause a report belongs to,
// and the desk counts every report there, where it is filed. The reports the desk read as a
// one-day move (desk-notes.json) are a problem of their own too: a date that moves by one day is
// not a flipped date. They get their own row and stay counted where they are filed.
import { groupByCause, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day move' | 'unplaced';

export type ProblemRow = {
  problem: Problem;
  reports: Report[];
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

function row(problem: Problem, rs: Report[]): ProblemRow {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: tally(rs.map((r) => r.channel)),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

// The reports merged into a ticket, one id one report.
export function mergedInto(all: Report[], ticket: number): Report[] {
  return uniqueById(all).filter((r) => r.mergedInto === ticket);
}

export function problemsOf(
  merged: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemRow[] {
  const rows = groupByCause(merged, tenantOf).map((g) => row(g.cause, g.reports));
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) rows.push(row('one-day move', moved));
  return rows.sort((a, b) => b.reports.length - a.reports.length);
}

// Reports in `p` that are also counted in another row.
export function alsoIn(p: ProblemRow, rows: ProblemRow[]): Record<string, number> {
  const ids = new Set(p.reports.map((r) => r.id));
  return Object.fromEntries(
    rows
      .filter((o) => o !== p)
      .map((o) => [o.problem, o.reports.filter((r) => ids.has(r.id)).length] as const)
      .filter(([, n]) => n > 0),
  );
}
