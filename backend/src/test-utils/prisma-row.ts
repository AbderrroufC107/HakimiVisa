/**
 * A spec fixture only carries the columns the code under test actually reads,
 * but Prisma's row types are total, so handing a partial fixture to
 * `mockResolvedValue` does not type-check. `row()` marks that narrowing as
 * deliberate in one place instead of scattering `as any` through every spec —
 * and keeps the fixture itself typed, so a renamed column is still caught.
 */
export const row = <T>(fixture: T): never => fixture as never;
