export const installAudioProbe = () => {
  window.__quietAudio = [];
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (destination, ...parameters) {
    const result = connect.call(this, destination, ...parameters);
    if (destination instanceof AudioDestinationNode) {
      const analyser = this.context.createAnalyser();
      analyser.fftSize = 2048;
      connect.call(this, analyser);
      window.__quietAudio.push({ context: this.context, analyser });
    }
    return result;
  };
};

export const sampleAudioOutput = () => window.__quietAudio.map(({ context, analyser }) => {
  const samples = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(samples);
  const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
  return { state: context.state, rms };
});
