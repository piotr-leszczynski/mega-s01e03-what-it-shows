<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { alsoIn, mergedInto, problemsOf, type Problem } from '#lib/kb/problems';

  // `issues`: the issue filed for each problem, by number, in `repo`. `status`: where each one stands.
  let {
    ticket,
    repo,
    issues,
    status = {},
  }: { ticket: number; repo: string; issues: Partial<Record<Problem, number>>; status?: Partial<Record<Problem, string>> } =
    $props();

  const rows = $derived((reports as Report[]).filter((r) => r.mergedInto === ticket).length);
  const merged = $derived(mergedInto(reports as Report[], ticket));
  const problems = $derived(problemsOf(merged, tenantOf, notes.oneDayMove));
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ({rows} rows in the export, some twice) ·
  <strong>{problems.length}</strong>
  {problems.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>tagged as</th><th>tenants</th><th>seen</th><th>issue</th><th>status</th></tr>
  </thead>
  <tbody>
    {#each problems as p (p.problem)}
      {@const issue = issues[p.problem]}
      <tr>
        <td><code>{p.problem}</code></td>
        <td>{p.reports.length}</td>
        <td class="small">{list(p.channels)}</td>
        <td class="small">{list(p.taggedAs)}</td>
        <td>{p.tenants}</td>
        <td class="small">{p.firstSeen} → {p.lastSeen}</td>
        <td>{#if issue}<a href="{repo}/issues/{issue}">#{issue}</a>{:else}<span class="none">no issue</span>{/if}</td>
        <td class="small">{status[p.problem] ?? ''}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each problems as p (p.problem)}
  {#each Object.entries(alsoIn(p, problems)) as [other, n] (other)}
    {#if p.reports.length < problems.find((o) => o.problem === other)!.reports.length}
      <p class="small">{n} <code>{p.problem}</code> reports are also counted under <code>{other}</code>, where the desk filed them.</p>
    {/if}
  {/each}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
