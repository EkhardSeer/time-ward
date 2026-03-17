import { TimeSlice } from '../base/types/time-slice';
import { ColumnAssignment } from '../base/types/column-assignment';

/**
 * Greedy column assignment for overlapping time slices.
 *
 * Given an array of slices (already **sorted** by `startRow` ascending,
 * then `rowSpan` descending), assigns each slice to the first available
 * sub-column and determines the total number of columns in its overlap
 * cluster.
 *
 * `totalColumns` is computed at the **transitive cluster level**: if A overlaps
 * B and B overlaps C, all three share a cluster and receive the same
 * `totalColumns` even if A and C don't directly overlap. This prevents
 * inconsistent widths where some events appear wider than their neighbours.
 *
 * @returns An array of `ColumnAssignment` objects in the same order as the
 *          input slices.
 */
export function assignColumns(slices: TimeSlice[]): ColumnAssignment[] {
  const colEndRows: number[] = [];
  const colIndices: number[] = new Array(slices.length);

  // Pass 1: assign each slice to the first free sub-column
  for (let si = 0; si < slices.length; si++) {
    const { startRow, rowSpan } = slices[si];
    let col = colEndRows.findIndex((endRow) => endRow <= startRow);
    if (col === -1) col = colEndRows.length;
    colEndRows[col] = startRow + rowSpan;
    colIndices[si] = col;
  }

  // Pass 2: union-find — merge slices that directly overlap into one cluster
  const parent = Array.from({ length: slices.length }, (_, i) => i);

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]; // path halving
      x = parent[x];
    }
    return x;
  }

  for (let si = 0; si < slices.length; si++) {
    for (let sj = si + 1; sj < slices.length; sj++) {
      const { startRow: aStart, rowSpan: aSpan } = slices[si];
      const { startRow: bStart, rowSpan: bSpan } = slices[sj];
      if (aStart < bStart + bSpan && bStart < aStart + aSpan) {
        // Merge the two clusters
        const ra = find(si);
        const rb = find(sj);
        if (ra !== rb) parent[ra] = rb;
      }
    }
  }

  // Pass 3: find the highest column index within each transitive cluster
  const clusterMax = new Map<number, number>();
  for (let si = 0; si < slices.length; si++) {
    const root = find(si);
    clusterMax.set(root, Math.max(clusterMax.get(root) ?? 0, colIndices[si]));
  }

  // Pass 4: every slice in the same cluster gets the same totalColumns
  const assignments: ColumnAssignment[] = new Array(slices.length);
  for (let si = 0; si < slices.length; si++) {
    assignments[si] = {
      colIndex: colIndices[si],
      totalColumns: (clusterMax.get(find(si)) ?? 0) + 1,
    };
  }

  return assignments;
}
