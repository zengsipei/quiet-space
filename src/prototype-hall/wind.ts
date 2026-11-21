import { mulberry32 } from "../lib/rng";

type WindGraph = { context: AudioContext; source: AudioBufferSourceNode; volume: GainNode };

export const createWind = () => {
  let graph: WindGraph | undefined;
  let desired = false;
  let disposed = false;
  let pending = Promise.resolve();
  const initialize = () => {
    const audio = new AudioContext({ latencyHint: "playback" });
    try {
      const buffer = audio.createBuffer(1, audio.sampleRate * 12, audio.sampleRate);
      const samples = buffer.getChannelData(0);
      const random = mulberry32(724);
      let smoothed = 0;
      for (let index = 0; index < samples.length; index += 1) {
        const phase = index / samples.length;
        smoothed = smoothed * 0.97 + (random() * 2 - 1) * 0.03;
        const breeze = 0.65 + 0.2 * Math.sin(phase * Math.PI * 2) + 0.15 * Math.sin(phase * Math.PI * 6);
        const edge = Math.min(1, index / 960, (samples.length - index - 1) / 960);
        samples[index] = smoothed * 3 * breeze * edge;
      }
      const noise = audio.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const lowpass = audio.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 750;
      const highpass = audio.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 65;
      const gain = audio.createGain();
      gain.gain.value = 0;
      noise.connect(lowpass).connect(highpass).connect(gain).connect(audio.destination);
      noise.start();
      return { context: audio, source: noise, volume: gain };
    } catch (error) {
      void audio.close().catch(() => {});
      throw error;
    }
  };
  const reconcile = async () => {
    if (disposed) return;
    if (!desired || document.hidden) {
      if (graph?.context.state === "running") {
        const { context, volume } = graph;
        volume.gain.cancelScheduledValues(context.currentTime);
        if (document.hidden) {
          volume.gain.value = 0;
          await context.suspend();
          return;
        }
        volume.gain.setTargetAtTime(0, context.currentTime, 0.03);
        await new Promise<void>((done) => window.setTimeout(done, 120));
        if (!desired || document.hidden) await context.suspend();
      }
      return;
    }
    graph ??= initialize();
    const { context, volume } = graph;
    await context.resume();
    if (!desired || document.hidden || disposed) return;
    volume.gain.cancelScheduledValues(context.currentTime);
    volume.gain.setTargetAtTime(0.16, context.currentTime, 0.18);
  };
  return {
    setEnabled: (enabled: boolean) => {
      desired = enabled;
      pending = pending.catch(() => {}).then(reconcile);
      return pending;
    },
    dispose: () => {
      disposed = true;
      desired = false;
      if (graph) {
        graph.volume.gain.value = 0;
        graph.source.stop();
        void graph.context.close().catch(() => {});
      }
    },
  };
};
