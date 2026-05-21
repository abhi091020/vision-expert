// import { useState, useEffect, useRef, useCallback } from "react";
// import { WS_URL } from "../api/client";

// /**
//  * useWebSocketStream
//  *
//  * Connects to ws://<host>:8000/ws/video
//  * Parses the binary protocol:
//  *   BYTES 0-3   : uint32 big-endian = N (JSON length)
//  *   BYTES 4..N+3: UTF-8 JSON        = { mode, detections }
//  *   BYTES N+4.. : Raw JPEG bytes    = video frame
//  *
//  * Returns:
//  *   frameUrl   — blob URL for the latest JPEG frame (revoked automatically)
//  *   mode       — current detection mode string (e.g. "FIRE", "COUNTING")
//  *   detections — raw detections object for the current mode
//  *   connected  — WebSocket connection status
//  */
// export function useWebSocketStream(active = true) {
//   const [frameUrl, setFrameUrl] = useState(null);
//   const [mode, setMode] = useState(null);
//   const [detections, setDetections] = useState(null);
//   const [connected, setConnected] = useState(false);

//   const wsRef = useRef(null);
//   const prevUrlRef = useRef(null);
//   const reconnectRef = useRef(null);
//   const activeRef = useRef(active);
//   activeRef.current = active;

//   const connect = useCallback(() => {
//     if (wsRef.current) return; // already connecting / open

//     const ws = new WebSocket(`${WS_URL}/ws/video`);
//     ws.binaryType = "arraybuffer";
//     wsRef.current = ws;

//     ws.onopen = () => {
//       setConnected(true);
//       clearTimeout(reconnectRef.current);
//     };

//     ws.onmessage = (event) => {
//       try {
//         const buf = event.data; // ArrayBuffer
//         const view = new DataView(buf);
//         const metaLen = view.getUint32(0, false); // big-endian uint32

//         const metaJSON = new TextDecoder().decode(buf.slice(4, 4 + metaLen));
//         const meta = JSON.parse(metaJSON); // { mode, detections }

//         // ── Video frame ───────────────────────────────────
//         const imgBytes = buf.slice(4 + metaLen);
//         if (imgBytes.byteLength > 0) {
//           const blob = new Blob([imgBytes], { type: "image/jpeg" });
//           const newUrl = URL.createObjectURL(blob);

//           // Revoke the previous blob URL to avoid memory leaks
//           if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
//           prevUrlRef.current = newUrl;
//           setFrameUrl(newUrl);
//         }

//         // ── Detection metadata ────────────────────────────
//         setMode(meta.mode ?? null);
//         setDetections(meta.detections ?? null);
//       } catch (err) {
//         console.error("[WS] Failed to parse message:", err);
//       }
//     };

//     ws.onclose = () => {
//       setConnected(false);
//       wsRef.current = null;

//       if (activeRef.current) {
//         reconnectRef.current = setTimeout(connect, 2000); // auto-reconnect
//       }
//     };

//     ws.onerror = () => {
//       ws.close(); // triggers onclose → reconnect
//     };
//   }, []); // stable ref, no deps needed

//   useEffect(() => {
//     if (!active) {
//       // Clean up if disabled externally
//       clearTimeout(reconnectRef.current);
//       if (wsRef.current) {
//         wsRef.current.onclose = null; // prevent reconnect loop
//         wsRef.current.close();
//         wsRef.current = null;
//       }
//       if (prevUrlRef.current) {
//         URL.revokeObjectURL(prevUrlRef.current);
//         prevUrlRef.current = null;
//       }
//       setConnected(false);
//       setFrameUrl(null);
//       setMode(null);
//       setDetections(null);
//       return;
//     }

//     connect();

//     return () => {
//       clearTimeout(reconnectRef.current);
//       if (wsRef.current) {
//         wsRef.current.onclose = null; // prevent reconnect on unmount
//         wsRef.current.close();
//         wsRef.current = null;
//       }
//       if (prevUrlRef.current) {
//         URL.revokeObjectURL(prevUrlRef.current);
//         prevUrlRef.current = null;
//       }
//     };
//   }, [active, connect]);

//   return { frameUrl, mode, detections, connected };
// }
import { useState, useEffect, useRef, useCallback } from "react";
import { WS_URL } from "../api/client";

export function useWebSocketStream(active = true) {
  const [frameUrl, setFrameUrl] = useState(null);
  const [mode, setMode] = useState(null);
  const [detections, setDetections] = useState(null);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const prevUrlRef = useRef(null);
  const reconnectRef = useRef(null);
  const activeRef = useRef(active);
  const mountedRef = useRef(false); // ✅ track mount state
  activeRef.current = active;

  const connect = useCallback(() => {
    if (!mountedRef.current) return; // ✅ don't connect if unmounted
    if (wsRef.current) return;

    const ws = new WebSocket(`${WS_URL}/ws/video`);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      } // ✅ unmounted by the time it opened
      setConnected(true);
      clearTimeout(reconnectRef.current);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const buf = event.data;
        const view = new DataView(buf);
        const metaLen = view.getUint32(0, false);

        const metaJSON = new TextDecoder().decode(buf.slice(4, 4 + metaLen));
        const meta = JSON.parse(metaJSON);

        const imgBytes = buf.slice(4 + metaLen);
        if (imgBytes.byteLength > 0) {
          const blob = new Blob([imgBytes], { type: "image/jpeg" });
          const newUrl = URL.createObjectURL(blob);
          if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
          prevUrlRef.current = newUrl;
          setFrameUrl(newUrl);
        }

        setMode(meta.mode ?? null);
        setDetections(meta.detections ?? null);
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!mountedRef.current) return; // ✅ don't reconnect if unmounted
      setConnected(false);
      if (activeRef.current) {
        reconnectRef.current = setTimeout(connect, 2000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (!active) {
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
      setConnected(false);
      setFrameUrl(null);
      setMode(null);
      setDetections(null);
      return;
    }

    mountedRef.current = true; // ✅ mark as mounted
    connect();

    return () => {
      mountedRef.current = false; // ✅ mark as unmounted before cleanup
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, [active, connect]);

  return { frameUrl, mode, detections, connected };
}
