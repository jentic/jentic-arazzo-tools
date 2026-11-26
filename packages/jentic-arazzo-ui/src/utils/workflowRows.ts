import type { ArazzoEdge, ArazzoNode } from '../types/viewer';

interface Placement {
  node: ArazzoNode;
  lane: number;
  recovery: boolean;
}

// rank by execution order. a DFS back edge closes a loop and must not add a row.
export function workflowRows(nodes: ArazzoNode[], edges: ArazzoEdge[]): Placement[][] {
  const indexes = new Map(nodes.map((node, index) => [node.id, index]));
  const success = nodes.map(() => new Set<number>());
  const failure = nodes.map(() => new Set<number>());
  for (const edge of edges) {
    const target = indexes.get(edge.target);
    if (target === undefined) continue;
    const paths = ['sequential', 'success', 'bundled-success'].includes(edge.type ?? '')
      ? success
      : failure;
    const sources =
      edge.data && 'sources' in edge.data ? edge.data.sources.map((s) => s.nodeId) : [edge.source];
    for (const id of sources) {
      const source = indexes.get(id);
      if (source !== undefined && source !== target) paths[source].add(target);
    }
  }

  if (!success.some((targets) => targets.size > 1)) {
    return nodes.map((node) => [{ node, lane: 0, recovery: false }]);
  }

  const primary = new Set<number>([0]);
  for (const source of primary) {
    for (const target of success[source]) primary.add(target);
  }

  const parents = nodes.map(() => [] as number[]);
  const seen = new Set<number>();
  const active = new Set<number>();
  const order: number[] = [];
  const paths = success.map(
    (targets, source) =>
      new Set([...targets, ...[...failure[source]].filter((target) => !primary.has(target))]),
  );
  for (let root = 0; root < nodes.length; root++) {
    if (seen.has(root)) continue;
    const stack = [{ source: root, targets: paths[root].values() }];
    seen.add(root);
    active.add(root);
    while (stack.length) {
      const { source, targets } = stack[stack.length - 1];
      const next = targets.next();
      if (next.done) {
        stack.pop();
        active.delete(source);
        order.push(source);
        continue;
      }
      const target = next.value;
      if (active.has(target)) continue;
      parents[target].push(source);
      if (!seen.has(target)) {
        seen.add(target);
        active.add(target);
        stack.push({ source: target, targets: paths[target].values() });
      }
    }
  }

  const ranks: number[] = [];
  const lanes: number[] = [];
  const rows: number[][] = [];
  for (const index of order.reverse()) {
    if (nodes[index].type === 'end') continue;
    const rank = parents[index].reduce((max, parent) => Math.max(max, ranks[parent] + 1), 0);
    ranks[index] = rank;
    (rows[rank] ??= []).push(index);
  }
  const end = nodes.findIndex((node) => node.type === 'end');
  if (end >= 0) rows.push([end]);

  return rows.map((row) => {
    const placements: Placement[] = [];
    for (const recovery of [false, true]) {
      const group = row.filter((i) => (!primary.has(i) && i !== end) === recovery);
      // distribute siblings in document order around their parent's lane.
      const siblings = new Map<number, number[]>();
      const incoming = (index: number) =>
        parents[index].filter((p) => primary.has(p) === primary.has(index));
      for (const index of group.sort((a, b) => a - b)) {
        for (const parent of incoming(index)) {
          if (!siblings.has(parent)) siblings.set(parent, []);
          siblings.get(parent)!.push(index);
        }
      }
      const preferred = (index: number) => {
        const sources = incoming(index);
        if (!sources.length) return 0;
        return (
          sources.reduce((sum, parent) => {
            const children = siblings.get(parent)!;
            return sum + lanes[parent] + children.indexOf(index) - (children.length - 1) / 2;
          }, 0) / sources.length
        );
      };
      const sorted = group
        .map((index) => {
          const parents = incoming(index);
          const parentLane = parents.length
            ? parents.reduce((sum, p) => sum + lanes[p], 0) / parents.length
            : 0;
          return { index, parentLane, ideal: preferred(index) };
        })
        .sort((a, b) => a.parentLane - b.parentLane || a.ideal - b.ideal || a.index - b.index);
      let previous = -Infinity;
      let displacement = 0;
      for (const { index, ideal } of sorted) {
        lanes[index] = Math.max(ideal, previous + 1);
        previous = lanes[index];
        displacement += previous - ideal;
      }
      for (const { index } of sorted) {
        lanes[index] -= displacement / sorted.length;
        placements.push({ node: nodes[index], lane: lanes[index], recovery });
      }
    }
    return placements;
  });
}
