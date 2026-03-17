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

  // Pass 2: determine the widest overlap cluster each slice belongs to
  const assignments: ColumnAssignment[] = new Array(slices.length);
  for (let si = 0; si < slices.length; si++) {
    const { startRow: sStart, rowSpan: sSpan } = slices[si];
    let maxColIndex = colIndices[si];
    for (let sj = 0; sj < slices.length; sj++) {
      const { startRow: oStart, rowSpan: oSpan } = slices[sj];
      if (oStart < sStart + sSpan && oStart + oSpan > sStart) {
        if (colIndices[sj] > maxColIndex) maxColIndex = colIndices[sj];
      }
    }
    assignments[si] = { colIndex: colIndices[si], totalColumns: maxColIndex + 1 };
  }

  return assignments;
}
