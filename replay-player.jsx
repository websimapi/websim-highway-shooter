import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@websim/remotion/player";
import { ReplayComposition } from "replay-composition";
function showReplay(container, replayData) {
  container.innerHTML = "";
  if (!replayData || !replayData.frames || replayData.frames.length < 2) {
    container.innerHTML = '<p style="color: white; text-align: center;">No replay available</p>';
    return null;
  }
  const firstFrameTime = replayData.frames[0].time;
  const lastFrameTime = replayData.frames[replayData.frames.length - 1].time;
  const duration = lastFrameTime - firstFrameTime;
  if (duration <= 0) {
    container.innerHTML = '<p style="color: white; text-align: center;">Replay data is corrupted.</p>';
    return null;
  }
  const fps = 30;
  const durationInFrames = Math.ceil(duration / 1e3 * fps);
  const adjustedReplayData = {
    ...replayData,
    frames: replayData.frames.map((f) => ({ ...f, time: f.time - firstFrameTime })),
    events: replayData.events.map((e) => ({ ...e, time: e.time - firstFrameTime }))
  };
  const root = createRoot(container);
  root.render(
    /* @__PURE__ */ jsxDEV(
      Player,
      {
        component: ReplayComposition,
        durationInFrames,
        fps,
        compositionWidth: 540,
        compositionHeight: 960,
        controls: true,
        loop: true,
        inputProps: { replayData: adjustedReplayData },
        style: { width: "100%" }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 37,
        columnNumber: 9
      },
      this
    )
  );
  return root;
}
export {
  showReplay
};
