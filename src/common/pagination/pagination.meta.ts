import { CursorPaginationMeta, OffsetPaginationMeta } from './pagination.types';

export function offsetPaginationMeta(
  total: number,
  page: number,
  limit: number,
): OffsetPaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    mode: 'offset',
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function cursorPaginationMeta(
  limit: number,
  hasNext: boolean,
  cursor: string | null,
  nextCursor: string | null,
): CursorPaginationMeta {
  return {
    mode: 'cursor',
    limit,
    cursor,
    nextCursor,
    hasNext,
  };
}
