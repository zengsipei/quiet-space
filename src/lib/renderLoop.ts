export const createRenderLoop = (draw: (delta: number, elapsed: number) => void, maxDelta: number) => {
  const events = new AbortController();
  let identifier = 0;
  let previous = performance.now();
  let paused = false;
  let pageActive = true;
  const cancel = () => {
    cancelAnimationFrame(identifier);
    identifier = 0;
  };
  const schedule = () => {
    if (!paused && pageActive && !document.hidden && !identifier) identifier = requestAnimationFrame(frame);
  };
  const frame = (now: number) => {
    identifier = 0;
    if (paused || !pageActive || document.hidden) return;
    const elapsed = Math.max(0, (now - previous) / 1000);
    const delta = Math.min(elapsed, maxDelta);
    previous = now;
    draw(delta, elapsed);
    schedule();
  };
  const refresh = () => { cancel(); previous = performance.now(); schedule(); };
  document.addEventListener("visibilitychange", refresh, { signal: events.signal });
  window.addEventListener("pagehide", () => { pageActive = false; cancel(); }, { signal: events.signal });
  window.addEventListener("pageshow", () => { pageActive = true; refresh(); }, { signal: events.signal });
  schedule();
  return {
    pause: () => { paused = true; cancel(); },
    resume: () => { paused = false; refresh(); },
    dispose: () => { paused = true; cancel(); events.abort(); },
  };
};
