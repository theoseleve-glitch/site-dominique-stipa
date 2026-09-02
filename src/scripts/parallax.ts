let frame = 0;
let items: { el: HTMLElement; speed: number }[] = [];

function update(): void {
  frame = 0;
  const vh = window.innerHeight;
  for (const { el, speed } of items) {
    const rect = el.getBoundingClientRect();
    const progress = (rect.top + rect.height / 2 - vh / 2) / vh; // -1 .. 1 around center
    const offset = Math.max(-1, Math.min(1, progress)) * speed * -100;
    el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
  }
}

function onScroll(): void {
  if (!frame) frame = requestAnimationFrame(update);
}

export function initParallax(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  items = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]')).map((el) => ({
    el,
    speed: Number(el.dataset.parallax) || 0.15,
  }));
  window.removeEventListener('scroll', onScroll);
  if (items.length === 0) return;
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}
