import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { AbsoluteFill, useCurrentFrame, Audio, Img, useVideoConfig } from "remotion";
import * as fflate from "fflate";
let decompressedFramesCache = null;
function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
const getDecompressedFrames = (compressedFramesBase64) => {
  if (decompressedFramesCache) {
    return decompressedFramesCache;
  }
  const compressedFrames = base64ToArrayBuffer(compressedFramesBase64);
  const framesData = fflate.decompressSync(new Uint8Array(compressedFrames));
  const framesString = fflate.strFromU8(framesData);
  decompressedFramesCache = JSON.parse(framesString);
  return decompressedFramesCache;
};
const findClosestFrameIndex = (frames, targetTime) => {
  let low = 0;
  let high = frames.length - 1;
  if (targetTime <= frames[0].time) return 0;
  if (targetTime >= frames[high].time) return high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midTime = frames[mid].time;
    if (midTime === targetTime) {
      return mid;
    }
    if (targetTime < midTime) {
      if (mid > 0 && targetTime > frames[mid - 1].time) {
        const diff1 = targetTime - frames[mid - 1].time;
        const diff2 = midTime - targetTime;
        return diff1 <= diff2 ? mid - 1 : mid;
      }
      high = mid - 1;
    } else {
      if (mid < frames.length - 1 && targetTime < frames[mid + 1].time) {
        const diff1 = targetTime - midTime;
        const diff2 = frames[mid + 1].time - targetTime;
        return diff1 < diff2 ? mid : mid + 1;
      }
      low = mid + 1;
    }
  }
  return low;
};
const ReplayComposition = ({ replayData, assetUrls }) => {
  const frame = useCurrentFrame();
  const { fps, width: compWidth, height: compHeight } = useVideoConfig();
  const currentTime = frame / fps * 1e3;
  const frames = getDecompressedFrames(replayData.compressedFrames);
  const closestFrameIndex = findClosestFrameIndex(frames, currentTime);
  const frameData = frames[closestFrameIndex];
  if (!frameData) return null;
  const gameWidth = replayData.width;
  const gameHeight = replayData.height;
  const scale = Math.min(compWidth / gameWidth, compHeight / gameHeight);
  const scaledWidth = gameWidth * scale;
  const scaledHeight = gameHeight * scale;
  const offsetX = (compWidth - scaledWidth) / 2;
  const offsetY = (compHeight - scaledHeight) / 2;
  const audioElements = replayData.events.map((event, i) => {
    const startFrame = Math.floor(event.time / 1e3 * fps);
    if (frame < startFrame || frame > startFrame + fps / 2) return null;
    const audioSrc = assetUrls[event.type];
    if (!audioSrc) return null;
    return /* @__PURE__ */ jsxDEV(Audio, { src: audioSrc, startFrom: 0, volume: 0.5 }, `audio-${i}-${startFrame}`, false, {
      fileName: "<stdin>",
      lineNumber: 102,
      columnNumber: 16
    });
  }).filter(Boolean);
  return /* @__PURE__ */ jsxDEV(AbsoluteFill, { style: { backgroundColor: "#283747" }, children: [
    audioElements,
    /* @__PURE__ */ jsxDEV(AbsoluteFill, { style: {
      left: offsetX,
      top: offsetY,
      width: scaledWidth,
      height: scaledHeight
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: {
        position: "absolute",
        left: "33.33%",
        top: 0,
        width: Math.max(1, 4 * scale),
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.3)"
      } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 118,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        position: "absolute",
        left: "66.66%",
        top: 0,
        width: Math.max(1, 4 * scale),
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.3)"
      } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 126,
        columnNumber: 17
      }),
      frameData.barrels.map((barrel, i) => {
        const scaledBarrelWidth = barrel.width * scale;
        const scaledBarrelHeight = barrel.height * scale;
        const radius = scaledBarrelHeight / 2;
        const circumference = 2 * Math.PI * radius;
        const faceWidth = circumference / 16;
        const translateZ = Math.cos(2 * Math.PI / 32) * radius;
        return /* @__PURE__ */ jsxDEV(React.Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            position: "absolute",
            left: barrel.x * scale,
            top: barrel.y * scale,
            width: scaledBarrelWidth,
            height: scaledBarrelHeight,
            transformStyle: "preserve-3d"
          }, children: /* @__PURE__ */ jsxDEV("div", { style: {
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transform: `rotateX(${-barrel.rotation}rad) rotateZ(-90deg)`
          }, children: Array.from({ length: 16 }).map((_, j) => /* @__PURE__ */ jsxDEV("div", { style: {
            position: "absolute",
            width: faceWidth,
            height: scaledBarrelWidth,
            left: radius - faceWidth / 2,
            top: (scaledBarrelHeight - scaledBarrelWidth) / 2,
            backgroundImage: `url(${assetUrls.barrelTexture})`,
            backgroundSize: `${circumference}px ${scaledBarrelWidth}px`,
            backgroundPosition: `-${j * faceWidth}px 0`,
            transform: `rotateY(${j * (360 / 16)}deg) translateZ(${translateZ}px)`
          } }, j, false, {
            fileName: "<stdin>",
            lineNumber: 178,
            columnNumber: 41
          })) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 171,
            columnNumber: 33
          }) }, `barrel-3d-${i}`, false, {
            fileName: "<stdin>",
            lineNumber: 163,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            position: "absolute",
            left: (barrel.x + barrel.width / 2) * scale,
            top: (barrel.y + barrel.height / 2) * scale,
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: 32 * scale,
            fontWeight: "bold",
            textShadow: `0 0 ${4 * scale}px black`,
            zIndex: 10
          }, children: barrel.health }, `barrel-health-${i}`, false, {
            fileName: "<stdin>",
            lineNumber: 192,
            columnNumber: 29
          })
        ] }, `barrel-fragment-${i}`, true, {
          fileName: "<stdin>",
          lineNumber: 162,
          columnNumber: 25
        });
      }),
      frameData.barriers.map((barrier, i) => /* @__PURE__ */ jsxDEV("div", { style: {
        position: "absolute",
        left: barrier.x * scale,
        top: barrier.y * scale,
        width: barrier.width * scale,
        height: barrier.height * scale
      }, children: [
        /* @__PURE__ */ jsxDEV(
          Img,
          {
            src: assetUrls.barrier,
            style: { width: "100%", height: "100%" }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 218,
            columnNumber: 25
          }
        ),
        /* @__PURE__ */ jsxDEV("div", { style: {
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          fontSize: 24 * scale,
          fontWeight: "bold",
          textShadow: `0 0 ${4 * scale}px black`
        }, children: barrier.health }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 222,
          columnNumber: 25
        })
      ] }, `barrier-${i}`, true, {
        fileName: "<stdin>",
        lineNumber: 211,
        columnNumber: 21
      })),
      frameData.enemies.map((enemy, i) => {
        const baseWidth = replayData.config.enemy.baseWidth;
        const baseHeight = replayData.config.enemy.baseHeight;
        return /* @__PURE__ */ jsxDEV("div", { style: {
          position: "absolute",
          left: enemy.x * scale,
          top: enemy.y * scale,
          width: baseWidth * enemy.scale * scale,
          height: baseHeight * enemy.scale * scale
        }, children: /* @__PURE__ */ jsxDEV(
          Img,
          {
            src: enemy.type === "red" ? assetUrls.redEnemy : assetUrls.enemy,
            style: { width: "100%", height: "100%" }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 249,
            columnNumber: 29
          }
        ) }, `enemy-${i}`, false, {
          fileName: "<stdin>",
          lineNumber: 242,
          columnNumber: 25
        });
      }),
      frameData.projectiles.map((projectile, i) => /* @__PURE__ */ jsxDEV("div", { style: {
        position: "absolute",
        left: projectile.x * scale,
        top: projectile.y * scale,
        width: replayData.config.projectile.width * scale,
        height: replayData.config.projectile.height * scale
      }, children: /* @__PURE__ */ jsxDEV(
        Img,
        {
          src: assetUrls.projectile,
          style: { width: "100%", height: "100%" }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 266,
          columnNumber: 25
        }
      ) }, `projectile-${i}`, false, {
        fileName: "<stdin>",
        lineNumber: 259,
        columnNumber: 21
      })),
      frameData.powerups.map((powerup, i) => /* @__PURE__ */ jsxDEV("div", { style: {
        position: "absolute",
        left: powerup.x * scale,
        top: powerup.y * scale,
        width: replayData.config.powerup.width * scale,
        height: replayData.config.powerup.height * scale
      }, children: /* @__PURE__ */ jsxDEV(
        Img,
        {
          src: powerup.type === "rapidFire" ? assetUrls.rapidFire : assetUrls.bomb,
          style: { width: "100%", height: "100%" }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 282,
          columnNumber: 25
        }
      ) }, `powerup-${i}`, false, {
        fileName: "<stdin>",
        lineNumber: 275,
        columnNumber: 21
      })),
      /* @__PURE__ */ jsxDEV("div", { style: {
        position: "absolute",
        left: frameData.player.x * scale,
        top: frameData.player.y * scale,
        width: replayData.config.player.width * scale,
        height: replayData.config.player.height * scale,
        transform: `rotate(${frameData.player.rotation}rad)`
      }, children: [
        /* @__PURE__ */ jsxDEV(
          Img,
          {
            src: assetUrls.playerShip,
            style: { width: "100%", height: "100%" }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 298,
            columnNumber: 21
          }
        ),
        /* @__PURE__ */ jsxDEV(
          Img,
          {
            src: assetUrls.weapon,
            style: {
              position: "absolute",
              top: "5%",
              left: "10%",
              width: "80%",
              height: "80%"
            }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 302,
            columnNumber: 21
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 290,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 110,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV(AbsoluteFill, { style: {
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      color: "white",
      textShadow: "0 0 8px black",
      zIndex: 20
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: {
        fontSize: 48,
        fontWeight: "bold"
      }, children: [
        "Score: ",
        frameData.score
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 323,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        marginTop: "10px"
      }, children: Array.from({ length: frameData.bombCount }).map((_, i) => /* @__PURE__ */ jsxDEV(
        Img,
        {
          src: assetUrls.bomb,
          style: {
            width: 50,
            height: 50,
            marginRight: "8px"
          }
        },
        `bomb-ui-${i}`,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 336,
          columnNumber: 25
        }
      )) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 329,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 316,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { style: {
      position: "absolute",
      bottom: 20,
      right: 20,
      color: "rgba(255, 255, 255, 0.5)",
      fontSize: 24,
      fontWeight: "bold",
      fontFamily: "Arial, sans-serif",
      textTransform: "uppercase"
    }, children: "Instant Replay" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 350,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 106,
    columnNumber: 9
  });
};
export {
  ReplayComposition
};
