export function sampleCharacterPixels(canvas) {
  return new Promise((done) => {
    requestAnimationFrame(() => {
      const context = canvas.getContext("webgl2");
      if (!context) { done({ colors: 0, signature: "no-webgl" }); return; }
      const colors = [];
      const buffer = new Uint8Array(canvas.width * canvas.height * 4);
      context.readPixels(0, 0, canvas.width, canvas.height, context.RGBA, context.UNSIGNED_BYTE, buffer);
      let peak = 0;
      for (let row = 1; row <= 24; row += 1) {
        for (let column = 1; column <= 32; column += 1) {
          const offset = (Math.floor(canvas.height * row / 25) * canvas.width + Math.floor(canvas.width * column / 33)) * 4;
          const pixel = buffer.subarray(offset, offset + 4);
          peak = Math.max(peak, pixel[0], pixel[1], pixel[2]);
          colors.push(Array.from(pixel.subarray(0, 3), (value) => Math.floor(value / 8)).join(","));
        }
      }
      done({ width: canvas.width, height: canvas.height, colors: new Set(colors).size, peak, signature: colors.join(";") });
    });
  });
}
