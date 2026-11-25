export function installFrameProbe() {
  const request = window.requestAnimationFrame.bind(window);
  const cancel = window.cancelAnimationFrame.bind(window);
  const pending = new Set();
  window.__frameProbe = { pending, frames: 0, renderedReadyMs: null };
  window.requestAnimationFrame = (callback) => {
    const identifier = request((time) => {
      pending.delete(identifier);
      window.__frameProbe.frames += 1;
      callback(time);
      if (window.__frameProbe.renderedReadyMs === null && document.querySelector("canvas")?.dataset.ready === "true") {
        window.__frameProbe.renderedReadyMs = performance.now();
      }
    });
    pending.add(identifier);
    return identifier;
  };
  window.cancelAnimationFrame = (identifier) => { pending.delete(identifier); cancel(identifier); };
}
