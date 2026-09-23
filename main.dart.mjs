// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      AC: Function.prototype.call.bind(DataView.prototype.getFloat64),
      AD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      AE: x0 => x0.nonce,
      AF: (x0,x1) => x0.removeAttribute(x1),
      AG: x0 => x0.offsetX,
      AH: x0 => x0.clientHeight,
      AI: x0 => x0.deref(),
      AJ: x0 => x0.rasterStartMilliseconds,
      AK: x0 => x0.body,
      B: s => printToConsole(s),
      BB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      BC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      BD: (x0,x1) => x0.go(x1),
      BE: () => globalThis.window.flutterConfiguration,
      BF: x0 => x0.isConnected,
      BG: x0 => x0.type,
      BH: x0 => x0.innerWidth,
      BI: () => globalThis.WeakRef,
      BJ: x0 => x0.imageBitmaps,
      BK: (x0,x1) => new OffscreenCanvas(x0,x1),
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: Function.prototype.call.bind(String.prototype.toLowerCase),
      CC: (t, s) => t.set(s),
      CD: (x0,x1) => x0.append(x1),
      CE: (x0,x1) => x0.attachShadow(x1),
      CF: x0 => x0.click(),
      CG: x0 => x0.hasFocus(),
      CH: x0 => x0.width,
      CI: x0 => x0.pop(),
      CJ: x0 => x0.canvasKitMaximumSurfaces,
      CK: x0 => x0.assetBase,
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (o, p, r) => o.replaceAll(p, () => r),
      DC: Function.prototype.call.bind(DataView.prototype.setFloat32),
      DD: (x0,x1) => { x0.textContent = x1 },
      DE: x0 => x0.preventDefault(),
      DF: (x0,x1) => x0.getElementsByClassName(x1),
      DG: x0 => x0.shiftKey,
      DH: x0 => x0.clientWidth,
      DI: (x0,x1) => x0.revokeObjectURL(x1),
      DJ: x0 => x0.hostElement,
      DK: x0 => x0.loader,
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (x0,x1) => x0[x1],
      EC: Function.prototype.call.bind(DataView.prototype.getFloat32),
      ED: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      EE: (x0,x1) => x0.contains(x1),
      EF: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      EG: x0 => x0.visibilityState,
      EH: (x0,x1) => x0.removeChild(x1),
      EI: (x0,x1) => { x0.src = x1 },
      EJ: x0 => x0.location,
      EK: () => globalThis._flutter,
      F: () => new Error().stack,
      FB: x0 => x0.length,
      FC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      FD: x0 => x0.parentElement,
      FE: (x0,x1) => x0.focus(x1),
      FF: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      FG: x0 => x0.disconnect(),
      FH: x0 => x0.firstChild,
      FI: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      FJ: (x0,x1) => x0.getModifierState(x1),
      G: s => JSON.stringify(s),
      GB: o => o,
      GC: Function.prototype.call.bind(DataView.prototype.getUint32),
      GD: (x0,x1) => x0.querySelectorAll(x1),
      GE: (x0,x1) => x0.closest(x1),
      GF: (x0,x1) => x0.contains(x1),
      GG: x0 => new Intl.Locale(x0),
      GH: x0 => x0.viewConstraints,
      GI: x0 => x0.naturalHeight,
      GJ: x0 => x0.metaKey,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      HC: Function.prototype.call.bind(DataView.prototype.setUint32),
      HD: x0 => x0.length,
      HE: (x0,x1) => x0.getAttribute(x1),
      HF: (s) => +s,
      HG: x0 => x0.region,
      HH: x0 => x0.hostElement,
      HI: x0 => x0.naturalWidth,
      HJ: x0 => x0.altKey,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: (x0,x1) => x0.exec(x1),
      IC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      ID: (x0,x1) => x0.item(x1),
      IE: x0 => x0.activeElement,
      IF: x0 => x0.target,
      IG: x0 => x0.script,
      IH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      II: x0 => x0.decode(),
      IJ: x0 => x0.ctrlKey,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: x0 => x0.flags,
      JC: Function.prototype.call.bind(DataView.prototype.getInt32),
      JD: x0 => x0.userAgent,
      JE: (x0,x1) => x0.add(x1),
      JF: (x0,x1) => x0.dispatchEvent(x1),
      JG: x0 => x0.language,
      JH: x0 => ({runApp: x0}),
      JI: (x0,x1) => { x0.decoding = x1 },
      JJ: x0 => x0.isComposing,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      KC: Function.prototype.call.bind(DataView.prototype.setInt32),
      KD: x0 => x0.maxTouchPoints,
      KE: x0 => x0.classList,
      KF: (x0,x1) => x0.createEvent(x1),
      KG: x0 => x0.languages,
      KH: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      KI: (x0,x1) => { x0.crossOrigin = x1 },
      KJ: x0 => x0.code,
      L: o => o === undefined,
      LB: o => o instanceof RegExp,
      LC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      LD: x0 => x0.platform,
      LE: x0 => x0.data,
      LF: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      LG: (x0,x1) => x0.observe(x1),
      LH: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      LI: (x0,x1) => x0.createObjectURL(x1),
      LJ: x0 => x0.repeat,
      M: o => String(o),
      MB: s => s.trim(),
      MC: o => o instanceof Uint16Array,
      MD: x0 => x0.navigator,
      ME: x0 => x0.scrollTop,
      MF: () => globalThis.window,
      MG: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      MH: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      MI: x0 => x0.URL,
      MJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (a, s) => a.join(s),
      NC: Function.prototype.call.bind(DataView.prototype.getUint16),
      ND: s => new Date(s * 1000).getTimezoneOffset() * 60,
      NE: (handle) => clearTimeout(handle),
      NF: x0 => x0.readText(),
      NG: x0 => new ResizeObserver(x0),
      NH: () => typeof dartUseDateNowForTicks !== "undefined",
      NI: x0 => new Blob(x0),
      NJ: x0 => x0.userAgent,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: x0 => x0.random(),
      OC: Function.prototype.call.bind(DataView.prototype.setUint16),
      OD: Date.now,
      OE: (x0,x1) => { x0.scrollTop = x1 },
      OF: x0 => x0.clipboard,
      OG: x0 => globalThis.parseFloat(x0),
      OH: () => Date.now(),
      OI: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      OJ: x0 => x0.navigator,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: () => globalThis.Math,
      PC: o => o instanceof Int16Array,
      PD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      PE: x0 => x0.tagName,
      PF: (x0,x1) => x0.writeText(x1),
      PG: (x0,x1) => x0.getComputedStyle(x1),
      PH: () => 1000 * performance.now(),
      PI: x0 => new window.ImageDecoder(x0),
      PJ: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: (x0,x1) => x0.error(x1),
      QC: Function.prototype.call.bind(DataView.prototype.getInt16),
      QD: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      QE: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      QF: x0 => x0.unlock(),
      QG: x0 => x0.documentElement,
      QH: x0 => new Uint8Array(x0),
      QI: x0 => x0.name,
      QJ: () => globalThis.window,
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: () => globalThis.console,
      RC: Function.prototype.call.bind(DataView.prototype.setInt16),
      RD: x0 => x0.style,
      RE: (x0,x1) => { x0.value = x1 },
      RF: (x0,x1) => x0.lock(x1),
      RG: x0 => x0.computedStyleMap(),
      RH: (x0,x1,x2) => x0.slice(x1,x2),
      RI: x0 => x0.repetitionCount,
      RJ: (x0,x1) => x0.getItem(x1),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: s => s.trimRight(),
      SC: o => o instanceof Uint8ClampedArray,
      SD: (x0,x1) => x0.createElement(x1),
      SE: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      SF: x0 => x0.orientation,
      SG: (x0,x1) => x0.get(x1),
      SH: (x0,x1) => x0.decode(x1),
      SI: x0 => x0.frameCount,
      SJ: x0 => x0.localStorage,
      T: x0 => new Promise(x0),
      TB: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      TC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      TD: x0 => x0.body,
      TE: (x0,x1) => { x0.value = x1 },
      TF: (x0,x1) => x0.querySelector(x1),
      TG: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      TH: (x0,x1) => x0.adoptText(x1),
      TI: x0 => x0.selectedTrack,
      TJ: (x0,x1) => x0.key(x1),
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: () => ({}),
      UC: Function.prototype.call.bind(DataView.prototype.setInt8),
      UD: x0 => x0.remove(),
      UE: x0 => x0.relatedTarget,
      UF: (x0,x1) => { x0.content = x1 },
      UG: x0 => x0.matches,
      UH: x0 => x0.first(),
      UI: x0 => x0.completed,
      UJ: x0 => x0.length,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: (o, p, v) => o[p] = v,
      VC: Function.prototype.call.bind(DataView.prototype.getInt8),
      VD: (x0,x1) => x0.getPropertyValue(x1),
      VE: x0 => x0.index,
      VF: x0 => x0.head,
      VG: (x0,x1) => x0.matchMedia(x1),
      VH: x0 => x0.next(),
      VI: x0 => x0.ready,
      VJ: (x0,x1,x2) => x0.setItem(x1,x2),
      W: x0 => new Array(x0),
      WB: () => [],
      WC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      WD: (x0,x1) => x0.warn(x1),
      WE: x0 => x0.unicode,
      WF: (x0,x1) => { x0.name = x1 },
      WG: x0 => x0.matches,
      WH: x0 => x0.current(),
      WI: x0 => x0.tracks,
      WJ: x0 => x0.releaseMediaPlayer(),
      X: o => [o],
      XB: (a, i) => a.push(i),
      XC: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      XD: x0 => x0.console,
      XE: (x0,x1) => { x0.lastIndex = x1 },
      XF: (x0,x1) => { x0.title = x1 },
      XG: x0 => x0.timeStamp,
      XH: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      XI: x0 => x0.close(),
      XJ: (x0,x1) => globalThis.newPlayerInstance(x0,x1),
      Y: (o0, o1) => [o0, o1],
      YB: b => !!b,
      YC: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      YD: (x0,x1) => { x0.id = x1 },
      YE: x0 => x0.dotAll,
      YF: () => globalThis.document,
      YG: (x0,x1) => x0.hasAttribute(x1),
      YH: x0 => x0.v8BreakIterator,
      YI: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      YJ: x0 => x0.initializeMediaPlayer(),
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: x0 => new Int8Array(x0),
      ZC: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      ZD: (x0,x1) => x0.requestAnimationFrame(x1),
      ZE: x0 => x0.ignoreCase,
      ZF: (x0,x1) => x0.vibrate(x1),
      ZG: x0 => x0.buttons,
      ZH: () => globalThis.Intl,
      ZI: (x0,x1) => x0.decode(x1),
      ZJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      aC: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      aD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      aE: x0 => x0.multiline,
      aF: (o, p) => p in o,
      aG: x0 => x0.ctrlKey,
      aH: (x0,x1) => x0.segment(x1),
      aI: x0 => x0.displayHeight,
      aJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: x0 => new Uint8Array(x0),
      bC: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      bD: x0 => x0.now(),
      bE: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      bF: x0 => x0.arrayBuffer(),
      bG: x0 => x0.y,
      bH: x0 => x0.index,
      bI: x0 => x0.displayWidth,
      bJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      c: o => o,
      cB: x0 => new Uint8ClampedArray(x0),
      cC: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      cD: x0 => x0.performance,
      cE: x0 => x0.value,
      cF: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      cG: x0 => x0.x,
      cH: x0 => x0.next(),
      cI: x0 => x0.duration,
      cJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      d: (o, p) => o[p],
      dB: x0 => new Int16Array(x0),
      dC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      dD: (x0,x1) => x0.unregister(x1),
      dE: x0 => x0.selectionDirection,
      dF: x0 => x0.status,
      dG: x0 => x0.offsetTop,
      dH: x0 => x0.value,
      dI: x0 => x0.image,
      dJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      e: () => globalThis,
      eB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      eC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      eD: () => globalThis.window.FinalizationRegistry,
      eE: x0 => x0.selectionStart,
      eF: (x0,x1) => x0.fetch(x1),
      eG: x0 => x0.scrollLeft,
      eH: x0 => x0.done,
      eI: () => globalThis.window.ImageDecoder,
      eJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: x0 => new Uint16Array(x0),
      fC: x0 => x0.history,
      fD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fE: x0 => x0.selectionEnd,
      fF: x0 => x0.content,
      fG: x0 => x0.offsetLeft,
      fH: (o, m, a) => o[m].apply(o, a),
      fI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      fJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: x0 => new Int32Array(x0),
      gC: x0 => x0.search,
      gD: x0 => new window.FinalizationRegistry(x0),
      gE: x0 => x0.value,
      gF: x0 => x0.document,
      gG: x0 => x0.offsetParent,
      gH: x0 => x0.iterator,
      gI: (a, s, e) => a.slice(s, e),
      gJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      hC: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      hD: x0 => x0.scale,
      hE: x0 => x0.selectionDirection,
      hF: x0 => x0.language,
      hG: x0 => x0.deltaMode,
      hH: () => globalThis.Symbol,
      hI: (x0,x1,x2) => x0.insertBefore(x1,x2),
      hJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      i: (string, token) => string.split(token),
      iB: x0 => new Uint32Array(x0),
      iC: x0 => x0.location,
      iD: x0 => x0.visualViewport,
      iE: x0 => x0.selectionStart,
      iF: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      iG: x0 => x0.deltaY,
      iH: (x0,x1) => new Intl.Segmenter(x0,x1),
      iI: x0 => x0.id,
      iJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      j: o => o instanceof Array,
      jB: x0 => new Float32Array(x0),
      jC: x0 => x0.pathname,
      jD: x0 => x0.devicePixelRatio,
      jE: x0 => x0.selectionEnd,
      jF: (x0,x1) => x0.prepend(x1),
      jG: x0 => x0.deltaX,
      jH: x0 => x0.Segmenter,
      jI: x0 => x0.offsetHeight,
      jJ: (o,s) => o[s],
      k: (a, i) => a[i],
      kB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      kC: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      kD: (d, digits) => d.toFixed(digits),
      kE: x0 => x0.keyCode,
      kF: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      kG: x0 => x0.wheelDeltaY,
      kH: x0 => x0.buffer,
      kI: x0 => x0.offsetWidth,
      kJ: () => Symbol("jsBoxedDartObjectProperty"),
      l: a => a.length,
      lB: x0 => new Float64Array(x0),
      lC: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      lD: x0 => x0.maxHeight,
      lE: (x0,x1) => x0.scrollIntoView(x1),
      lF: (x0,x1) => x0.querySelector(x1),
      lG: x0 => x0.wheelDeltaX,
      lH: x0 => x0.wasmMemory,
      lI: x0 => x0.stopPropagation(),
      lJ: (o,s,v) => o[s] = v,
      m: (string, times) => string.repeat(times),
      mB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      mC: o => Object.keys(o),
      mD: x0 => x0.maxWidth,
      mE: x0 => x0.multiViewEnabled,
      mF: (x0,x1) => x0.querySelectorAll(x1),
      mG: x0 => x0.key,
      mH: () => globalThis.window._flutter_skwasmInstance,
      mI: x0 => x0.disabled,
      mJ: (x0,x1) => x0.createElement(x1),
      n: (decoder, codeUnits) => decoder.decode(codeUnits),
      nB: x0 => new ArrayBuffer(x0),
      nC: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      nD: x0 => x0.minHeight,
      nE: x0 => x0.parent,
      nF: x0 => x0.tabIndex,
      nG: x0 => x0.identifier,
      nH: () => new TextDecoder(),
      nI: (x0,x1) => { x0.min = x1 },
      nJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      o: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      oB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      oC: f => f.dartFunction,
      oD: x0 => x0.minWidth,
      oE: (x0,x1) => x0.replaceWith(x1),
      oF: x0 => x0.parentNode,
      oG: x0 => x0.touches,
      oH: (a, i) => a.splice(i, 1),
      oI: (x0,x1) => { x0.max = x1 },
      oJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      p: () => new TextDecoder("utf-8", {fatal: true}),
      pB: (x0,x1,x2) => new DataView(x0,x1,x2),
      pC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      pD: x0 => x0.height,
      pE: (x0,x1) => { x0.type = x1 },
      pF: x0 => x0.clientY,
      pG: x0 => x0.pressure,
      pH: a => a.pop(),
      pI: (x0,x1) => { x0.disabled = x1 },
      pJ: (x0,x1) => x0.appendChild(x1),
      q: () => new TextDecoder("utf-8", {fatal: false}),
      qB: (o, p) => o[p],
      qC: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      qD: x0 => x0.width,
      qE: (x0,x1) => { x0.className = x1 },
      qF: x0 => x0.clientX,
      qG: x0 => x0.tiltY,
      qH: (map, o, v) => map.set(o, v),
      qI: (x0,x1) => { x0.scrollLeft = x1 },
      qJ: x0 => x0.head,
      r: s => s.trimLeft(),
      rB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      rC: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      rD: x0 => x0.screen,
      rE: (x0,x1) => { x0.tabIndex = x1 },
      rF: x0 => x0.getBoundingClientRect(),
      rG: x0 => x0.tiltX,
      rH: (map, o) => map.get(o),
      rI: (x0,x1) => { x0.spellcheck = x1 },
      rJ: (o, p, v) => o[p] = v,
      s: (l, r) => l === r,
      sB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      sC: (o, i) => o[i],
      sD: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      sE: (x0,x1) => { x0.name = x1 },
      sF: x0 => x0.bottom,
      sG: x0 => x0.pointerType,
      sH: () => new WeakMap(),
      sI: (x0,x1) => { x0.disabled = x1 },
      sJ: () => globalThis.document,
      t: s => s.toUpperCase(),
      tB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      tC: o => o.length,
      tD: (x0,x1) => x0.removeProperty(x1),
      tE: (x0,x1) => { x0.placeholder = x1 },
      tF: x0 => x0.top,
      tG: x0 => x0.pointerId,
      tH: x0 => x0.debugSkipFontRetryDelay,
      tI: (x0,x1) => x0.transferFromImageBitmap(x1),
      tJ: x0 => x0.stopPlayer(),
      u: Object.is,
      uB: o => o.byteOffset,
      uC: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      uD: (x0,x1) => x0.appendChild(x1),
      uE: (x0,x1) => { x0.autocomplete = x1 },
      uF: x0 => x0.right,
      uG: x0 => x0.getCoalescedEvents(),
      uH: (x0,x1,x2) => x0.set(x1,x2),
      uI: (x0,x1) => x0.getContext(x1),
      uJ: (x0,x1,x2,x3,x4,x5,x6) => x0.startPlayer(x1,x2,x3,x4,x5,x6),
      v: (x0,x1) => x0.test(x1),
      vB: o => o.buffer,
      vC: x0 => x0.state,
      vD: x0 => x0.debugShowSemanticsNodes,
      vE: (x0,x1) => { x0.name = x1 },
      vF: x0 => x0.left,
      vG: (x0,x1) => x0.getModifierState(x1),
      vH: x0 => x0.fontFallbackBaseUrl,
      vI: (x0,x1) => { x0.height = x1 },
      vJ: x0 => x0.length,
      w: o => o,
      wB: (b, o) => new DataView(b, o),
      wC: x0 => x0.hash,
      wD: (o, c) => o instanceof c,
      wE: (x0,x1) => { x0.placeholder = x1 },
      wF: x0 => x0.clientY,
      wG: x0 => x0.blur(),
      wH: (handle) => clearInterval(handle),
      wI: (x0,x1) => { x0.width = x1 },
      wJ: x0 => x0.getReader(),
      x: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      xB: (b, o, l) => new DataView(b, o, l),
      xC: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      xD: x0 => x0.vendor,
      xE: (x0,x1) => { x0.action = x1 },
      xF: x0 => x0.clientX,
      xG: x0 => x0.button,
      xH: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      xI: x0 => x0.height,
      xJ: x0 => x0.value,
      y: (a, i, v) => a[i] = v,
      yB: Function.prototype.call.bind(DataView.prototype.getUint8),
      yC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      yD: (x0,x1) => x0.createTextNode(x1),
      yE: (x0,x1) => { x0.method = x1 },
      yF: x0 => x0.changedTouches,
      yG: x0 => x0.innerHeight,
      yH: () => Date.now(),
      yI: x0 => x0.width,
      yJ: x0 => x0.done,
      z: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      zB: Function.prototype.call.bind(DataView.prototype.setUint8),
      zC: x0 => x0.state,
      zD: (x0,x1) => { x0.nonce = x1 },
      zE: (x0,x1) => { x0.noValidate = x1 },
      zF: x0 => x0.offsetY,
      zG: x0 => x0.height,
      zH: x0 => new WeakRef(x0),
      zI: x0 => x0.rasterEndMilliseconds,
      zJ: x0 => x0.read(),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
