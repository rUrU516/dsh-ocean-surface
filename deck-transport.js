/** Pure geometry shared by the deck's pointer gesture; no DOM, timers or settings. */
export function deckPointInRect(x, y, rect) {
  return !!rect && [x, y, rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
    && rect.width > 0 && rect.height > 0
    && x >= rect.left && x <= rect.left + rect.width
    && y >= rect.top && y <= rect.top + rect.height;
}

export function deckDragDistance(start, current) {
  if (!start || !current || ![start.x, start.y, current.x, current.y].every(Number.isFinite)) return 0;
  return Math.hypot(current.x - start.x, current.y - start.y);
}

/** Center-to-center travel in viewport CSS pixels, with a bounded physical size. */
export function deckInsertionPlan(fromRect, toRect, reducedMotion = false) {
  const valid = rect => !!rect && [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
    && rect.width > 0 && rect.height > 0;
  if (!valid(fromRect) || !valid(toRect)) return { dx: 0, dy: 0, scale: 1, duration: 0 };
  return {
    dx: toRect.left + toRect.width / 2 - fromRect.left - fromRect.width / 2,
    dy: toRect.top + toRect.height / 2 - fromRect.top - fromRect.height / 2,
    scale: Math.max(.15, Math.min(1.4, toRect.width / fromRect.width)),
    duration: reducedMotion ? 0 : 650,
  };
}
