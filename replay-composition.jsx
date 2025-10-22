import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { AbsoluteFill, useCurrentFrame, Audio, Img, useVideoConfig } from "remotion";
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
const ReplayComposition = ({ replayData }) => {
  const frame = useCurrentFrame();
  const { fps, width: compWidth, height: compHeight } = useVideoConfig();
  const currentTime = frame / fps * 1e3;
  const closestFrameIndex = findClosestFrameIndex(replayData.frames, currentTime);
  const frameData = replayData.frames[closestFrameIndex];
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
    const audioSrc = replayData.audio[event.type];
    if (!audioSrc) return null;
    return /* @__PURE__ */ jsxDEV(Audio, { src: audioSrc, startFrom: 0, volume: 0.5 }, `audio-${i}-${startFrame}`, false, {
      fileName: "<stdin>",
      lineNumber: 74,
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
        lineNumber: 90,
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
        lineNumber: 98,
        columnNumber: 17
      }),
      frameData.particles.map((particle, i) => /* @__PURE__ */ jsxDEV(
        "div",
        {
          style: {
            position: "absolute",
            left: particle.x * scale,
            top: particle.y * scale,
            width: particle.size * scale,
            height: particle.size * scale,
            backgroundColor: particle.color,
            borderRadius: "50%"
          }
        },
        `particle-${i}`,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 109,
          columnNumber: 21
        }
      )),
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
            backgroundImage: `url(${replayData.assets.barrelTexture})`,
            backgroundSize: `${circumference}px ${scaledBarrelWidth}px`,
            backgroundPosition: `-${j * faceWidth}px 0`,
            transform: `rotateY(${j * (360 / 16)}deg) translateZ(${translateZ}px)`
          } }, j, false, {
            fileName: "<stdin>",
            lineNumber: 150,
            columnNumber: 41
          })) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 143,
            columnNumber: 33
          }) }, `barrel-3d-${i}`, false, {
            fileName: "<stdin>",
            lineNumber: 135,
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
            lineNumber: 164,
            columnNumber: 29
          })
        ] }, `barrel-fragment-${i}`, true, {
          fileName: "<stdin>",
          lineNumber: 134,
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
            src: replayData.assets.barrier,
            style: { width: "100%", height: "100%" }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 190,
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
          lineNumber: 194,
          columnNumber: 25
        })
      ] }, `barrier-${i}`, true, {
        fileName: "<stdin>",
        lineNumber: 183,
        columnNumber: 21
      })),
      frameData.enemies.map((enemy, i) => /* @__PURE__ */ jsxDEV("div", { style: {
        position: "absolute",
        left: enemy.x * scale,
        top: enemy.y * scale,
        width: enemy.baseWidth * enemy.scale * scale,
        height: enemy.baseHeight * enemy.scale * scale
      }, children: /* @__PURE__ */ jsxDEV(
        Img,
        {
          src: replayData.assets.enemy,
          style: { width: "100%", height: "100%" }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 218,
          columnNumber: 25
        }
      ) }, `enemy-${i}`, false, {
        fileName: "<stdin>",
        lineNumber: 211,
        columnNumber: 21
      })),
      frameData.projectiles.map((projectile, i) => /* @__PURE__ */ jsxDEV("div", { style: {
        position: "absolute",
        left: projectile.x * scale,
        top: projectile.y * scale,
        width: 10 * scale,
        height: 20 * scale
      }, children: /* @__PURE__ */ jsxDEV(
        Img,
        {
          src: replayData.assets.projectile,
          style: { width: "100%", height: "100%" }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 234,
          columnNumber: 25
        }
      ) }, `projectile-${i}`, false, {
        fileName: "<stdin>",
        lineNumber: 227,
        columnNumber: 21
      })),
      frameData.powerups.map((powerup, i) => /* @__PURE__ */ jsxDEV("div", { style: {
        position: "absolute",
        left: powerup.x * scale,
        top: powerup.y * scale,
        width: 40 * scale,
        height: 40 * scale
      }, children: /* @__PURE__ */ jsxDEV(
        Img,
        {
          src: powerup.type === "rapidFire" ? replayData.assets.rapidFire : replayData.assets.bomb,
          style: { width: "100%", height: "100%" }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 250,
          columnNumber: 25
        }
      ) }, `powerup-${i}`, false, {
        fileName: "<stdin>",
        lineNumber: 243,
        columnNumber: 21
      })),
      /* @__PURE__ */ jsxDEV("div", { style: {
        position: "absolute",
        left: frameData.player.x * scale,
        top: frameData.player.y * scale,
        width: frameData.player.width * scale,
        height: frameData.player.height * scale,
        transform: `rotate(${frameData.player.rotation}rad)`
      }, children: [
        /* @__PURE__ */ jsxDEV(
          Img,
          {
            src: replayData.assets.playerShip,
            style: { width: "100%", height: "100%" }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 266,
            columnNumber: 21
          }
        ),
        /* @__PURE__ */ jsxDEV(
          Img,
          {
            src: replayData.assets.weapon,
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
            lineNumber: 270,
            columnNumber: 21
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 258,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 82,
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
      lineNumber: 284,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 78,
    columnNumber: 9
  });
};
export {
  ReplayComposition
};
