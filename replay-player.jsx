import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@websim/remotion/player";
import { ReplayComposition } from "replay-composition";
function arrayBufferToDataURL(buffer, mimeType) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}
function showReplay(container, replayData) {
  container.innerHTML = '<p style="color: white; text-align: center;">Loading Replay...</p>';
  if (!replayData || !replayData.frames || replayData.frames.length < 2) {
    container.innerHTML = '<p style="color: white; text-align: center;">No replay available</p>';
    return null;
  }
  const assetUrls = {};
  for (const key in replayData.assets) {
    const buffer = replayData.assets[key];
    assetUrls[key] = arrayBufferToDataURL(buffer, "image/png");
  }
  const audioUrls = {};
  for (const key in replayData.audio) {
    const buffer = replayData.audio[key];
    audioUrls[key] = arrayBufferToDataURL(buffer, "audio/mpeg");
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
    frames: void 0,
    // remove original frames
    compressedFrames: replayData.compressedFrames,
    // add compressed frames
    events: replayData.events.map((e) => ({ ...e, time: e.time - firstFrameTime })),
    // We no longer need the buffers, we pass the URLs
    assets: void 0,
    audio: void 0
  };
  const cleanup = () => {
  };
  container.innerHTML = "";
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
        downloadButton: "div",
        inputProps: { replayData: adjustedReplayData, assetUrls: { ...assetUrls, ...audioUrls } },
        style: { width: "100%" }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 70,
        columnNumber: 9
      },
      this
    )
  );
  const originalUnmount = root.unmount;
  root.unmount = () => {
    cleanup();
    originalUnmount();
  };
  return root;
}
export {
  showReplay
};
