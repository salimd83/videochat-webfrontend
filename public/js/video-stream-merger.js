(function (f) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }
    g.VideoStreamMerger = f();
  }
})(function () {
  var define, module, exports;
  return (function () {
    function r(e, n, t) {
      function o(i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = "function" == typeof require && require;
            if (!f && c) return c(i, !0);
            if (u) return u(i, !0);
            var a = new Error("Cannot find module '" + i + "'");
            throw ((a.code = "MODULE_NOT_FOUND"), a);
          }
          var p = (n[i] = { exports: {} });
          e[i][0].call(
            p.exports,
            function (r) {
              var n = e[i][1][r];
              return o(n || r);
            },
            p,
            p.exports,
            r,
            e,
            n,
            t
          );
        }
        return n[i].exports;
      }
      for (
        var u = "function" == typeof require && require, i = 0;
        i < t.length;
        i++
      )
        o(t[i]);
      return o;
    }
    return r;
  })()(
    {
      1: [
        function (require, module, exports) {
          "use strict";
          module.exports = VideoStreamMerger;
          function VideoStreamMerger(a) {
            if (!(this instanceof VideoStreamMerger))
              return new VideoStreamMerger(a);
            a = a || {};
            var b = window.AudioContext || window.webkitAudioContext,
              c = !!(
                b &&
                (this._audioCtx = a.audioContext || new b())
                  .createMediaStreamDestination
              ),
              d = !!document.createElement("canvas").captureStream;
            if (!(c && d)) throw new Error("Unsupported browser");
            (this.width = a.width || 640),
              (this.height = a.height || 480),
              (this.fps = a.fps || 25),
              (this.clearRect = !(a.clearRect !== void 0) || a.clearRect),
              (this._canvas = document.createElement("canvas")),
              this._canvas.setAttribute("width", this.width),
              this._canvas.setAttribute("height", this.height),
              this._canvas.setAttribute(
                "style",
                "position:fixed; left: 110%; pointer-events: none"
              ),
              (this._ctx = this._canvas.getContext("2d")),
              (this._streams = []),
              (this._frameCount = 0),
              (this._audioDestination = this._audioCtx.createMediaStreamDestination()),
              (this._videoSyncDelayNode = this._audioCtx.createDelay(5)),
              this._videoSyncDelayNode.connect(this._audioDestination),
              this._setupConstantNode(),
              (this.started = !1),
              (this.result = null),
              this._backgroundAudioHack();
          }
          (VideoStreamMerger.prototype.setOutputSize = function (a, b) {
            (this.width = a),
              (this.height = b),
              this._canvas.setAttribute("width", this.width),
              this._canvas.setAttribute("height", this.height);
          }),
            (VideoStreamMerger.prototype.getAudioContext = function () {
              return this._audioCtx;
            }),
            (VideoStreamMerger.prototype.getAudioDestination = function () {
              return this._audioDestination;
            }),
            (VideoStreamMerger.prototype.getCanvasContext = function () {
              return this._ctx;
            }),
            (VideoStreamMerger.prototype._backgroundAudioHack = function () {
              var a = this._audioCtx.createConstantSource(),
                b = this._audioCtx.createGain();
              (b.gain.value = 0.001),
                a.connect(b),
                b.connect(this._audioCtx.destination),
                a.start();
            }),
            (VideoStreamMerger.prototype._setupConstantNode = function () {
              var a = this._audioCtx.createConstantSource();
              a.start();
              var b = this._audioCtx.createGain();
              (b.gain.value = 0),
                a.connect(b),
                b.connect(this._videoSyncDelayNode);
            }),
            (VideoStreamMerger.prototype.updateIndex = function (a, b) {
              "string" == typeof a && (a = { id: a }), (b = null == b ? 0 : b);
              for (var c = 0; c < this._streams.length; c++)
                a.id === this._streams[c].id && (this._streams[c].index = b);
              this._sortStreams();
            }),
            (VideoStreamMerger.prototype._sortStreams = function () {
              this._streams = this._streams.sort(function (c, a) {
                return c.index - a.index;
              });
            }),
            (VideoStreamMerger.prototype.addMediaElement = function (a, b, c) {
              var d = this;
              if (
                ((c = c || {}),
                (c.x = c.x || 0),
                (c.y = c.y || 0),
                (c.width = c.width),
                (c.height = c.height),
                (c.mute = c.mute || c.muted || !1),
                (c.oldDraw = c.draw),
                (c.oldAudioEffect = c.audioEffect),
                (c.draw =
                  "VIDEO" === b.tagName || "IMG" === b.tagName
                    ? function (a, e, f) {
                        if (c.oldDraw) c.oldDraw(a, b, f);
                        else {
                          var g = null == c.width ? d.width : c.width,
                            h = null == c.height ? d.height : c.height;
                          a.drawImage(b, c.x, c.y, g, h), f();
                        }
                      }
                    : null),
                !c.mute)
              ) {
                var e =
                  b._mediaElementSource ||
                  this.getAudioContext().createMediaElementSource(b);
                (b._mediaElementSource = e),
                  e.connect(this.getAudioContext().destination);
                var f = this.getAudioContext().createGain();
                e.connect(f),
                  b.muted
                    ? ((b.muted = !1), (b.volume = 0.001), (f.gain.value = 1e3))
                    : (f.gain.value = 1),
                  (c.audioEffect = function (a, b) {
                    c.oldAudioEffect ? c.oldAudioEffect(f, b) : f.connect(b);
                  }),
                  (c.oldAudioEffect = null);
              }
              this.addStream(a, c);
            }),
            (VideoStreamMerger.prototype.addStream = function (a, b) {
              if ("string" == typeof a) return this._addData(a, b);
              b = b || {};
              for (
                var c = {
                    isData: !1,
                    x: b.x || 0,
                    y: b.y || 0,
                    width: b.width,
                    height: b.height,
                    draw: b.draw || null,
                    mute: b.mute || b.muted || !1,
                    audioEffect: b.audioEffect || null,
                    index: null == b.index ? 0 : b.index,
                    hasVideo: 0 < a.getVideoTracks().length,
                  },
                  d = null,
                  e = 0;
                e < this._streams.length;
                e++
              )
                this._streams[e].id === a.id && (d = this._streams[e].element);
              d ||
                ((d = document.createElement("video")),
                (d.autoplay = !0),
                (d.muted = !0),
                (d.srcObject = a),
                d.setAttribute(
                  "style",
                  "position:fixed; left: 0px; top:0px; pointer-events: none; opacity:0;"
                ),
                document.body.appendChild(d),
                !c.mute &&
                  ((c.audioSource = this._audioCtx.createMediaStreamSource(a)),
                  (c.audioOutput = this._audioCtx.createGain()),
                  (c.audioOutput.gain.value = 1),
                  c.audioEffect
                    ? c.audioEffect(c.audioSource, c.audioOutput)
                    : c.audioSource.connect(c.audioOutput),
                  c.audioOutput.connect(this._videoSyncDelayNode))),
                (c.element = d),
                (c.id = a.id || null),
                this._streams.push(c),
                this._sortStreams();
            }),
            (VideoStreamMerger.prototype.removeStream = function (a) {
              "string" == typeof a && (a = { id: a });
              for (var b, c = 0; c < this._streams.length; c++)
                (b = this._streams[c]),
                  a.id === b.id &&
                    (b.audioSource && (b.audioSource = null),
                    b.audioOutput &&
                      (b.audioOutput.disconnect(this._videoSyncDelayNode),
                      (b.audioOutput = null)),
                    b.element && b.element.remove(),
                    (this._streams[c] = null),
                    this._streams.splice(c, 1),
                    c--);
            }),
            (VideoStreamMerger.prototype._addData = function (a, b) {
              b = b || {};
              var c = {};
              (c.isData = !0),
                (c.draw = b.draw || null),
                (c.audioEffect = b.audioEffect || null),
                (c.id = a),
                (c.element = null),
                (c.index = null == b.index ? 0 : b.index),
                c.audioEffect &&
                  ((c.audioOutput = this._audioCtx.createGain()),
                  (c.audioOutput.gain.value = 1),
                  c.audioEffect(null, c.audioOutput),
                  c.audioOutput.connect(this._videoSyncDelayNode)),
                this._streams.push(c),
                this._sortStreams();
            }),
            (VideoStreamMerger.prototype._requestAnimationFrame = function (a) {
              var b = !1,
                c = setInterval(function () {
                  !b && document.hidden && ((b = !0), clearInterval(c), a());
                }, 1e3 / this.fps);
              requestAnimationFrame(function () {
                b || ((b = !0), clearInterval(c), a());
              });
            }),
            (VideoStreamMerger.prototype.start = function () {
              (this.started = !0),
                this._requestAnimationFrame(this._draw.bind(this)),
                (this.result = this._canvas.captureStream(this.fps));
              var a = this.result.getAudioTracks()[0];
              a && this.result.removeTrack(a);
              var b = this._audioDestination.stream.getAudioTracks();
              this.result.addTrack(b[0]);
            }),
            (VideoStreamMerger.prototype._updateAudioDelay = function (a) {
              this._videoSyncDelayNode.delayTime.setValueAtTime(
                a / 1e3,
                this._audioCtx.currentTime
              );
            }),
            (VideoStreamMerger.prototype._draw = function () {
              var a = this;
              if (this.started) {
                this._frameCount++;
                var b = null;
                0 == this._frameCount % 60 && (b = performance.now());
                var c = this._streams.length,
                  d = function () {
                    if ((c--, 0 >= c)) {
                      if (0 == a._frameCount % 60) {
                        var d = performance.now();
                        a._updateAudioDelay(d - b);
                      }
                      a._requestAnimationFrame(a._draw.bind(a));
                    }
                  };
                this.clearRect &&
                  this._ctx.clearRect(0, 0, this.width, this.height),
                  this._streams.forEach(function (b) {
                    if (b.draw) b.draw(a._ctx, b.element, d);
                    else if (!b.isData && b.hasVideo) {
                      var c = null == b.width ? a.width : b.width,
                        e = null == b.height ? a.height : b.height;
                      a._ctx.drawImage(b.element, b.x, b.y, c, e), d();
                    } else d();
                  }),
                  0 === this._streams.length && d();
              }
            }),
            (VideoStreamMerger.prototype.destroy = function () {
              (this.started = !1),
                (this._canvas = null),
                (this._ctx = null),
                this._streams.forEach(function (a) {
                  a.element && a.element.remove();
                }),
                (this._streams = []),
                this._audioCtx.close(),
                (this._audioCtx = null),
                (this._audioDestination = null),
                (this._videoSyncDelayNode = null),
                this.result.getTracks().forEach(function (a) {
                  a.stop();
                }),
                (this.result = null);
            });
        },
        {},
      ],
    },
    {},
    [1]
  )(1);
});
