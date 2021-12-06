export const findNearlyAnchorElement = (start: EventTarget | Node | null, root: HTMLElement) => {
  let target = start;
  while (
    target &&
    target instanceof Node &&
    !(target instanceof HTMLAnchorElement) &&
    target !== root
  ) {
    target = target.parentElement;
  }

  return target instanceof HTMLAnchorElement ? target : null;
};