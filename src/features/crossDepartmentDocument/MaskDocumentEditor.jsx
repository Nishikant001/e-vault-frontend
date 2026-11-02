// src/features/crossDepartmentDocument/MaskDocumentEditor.jsx
//
// Rewritten masking editor.
//
// Fixes vs. the previous version:
//
// 1. PDFs are no longer shown inside a native-browser <iframe>. The
//    iframe had its own zoom/scroll/margins that never matched the
//    normalized (0-1) coordinates we stored, so a mask drawn on-screen
//    landed somewhere else once the backend redrew it on the real PDF
//    page ("masking kahin ho raha hai, show kahin ho raha hai").
//    Every page is now rendered with pdfjs-dist onto our own <canvas>,
//    so the interactive drawing canvas is pixel-for-pixel the same
//    size as the page it overlays.
//
// 2. Every stroke/box used to be hard-coded to `page: 1`, so multi-page
//    PDFs were never actually supported - drawing on page 2 silently
//    masked page 1 on the server. There is now a real page thumbnail
//    rail + Prev/Next navigation, and every mask remembers the exact
//    page it was drawn on.
//
// 3. Only a freehand pen tool existed. A Box (rectangle) tool has been
//    added alongside it - this matches the "rect" mask shape the
//    backend (crossDepartmentDocumentService.maskShare) already knows
//    how to flatten.
//
// 4. Because masks are now correctly tagged per page, confirming only
//    ever sends the pages that actually have a mask on them - pages
//    the user never touched never appear in the payload, so the
//    backend never touches them.

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// NOTE: this component receives a prop literally called `document`
// (the DMS document record), which shadows the global `window.document`
// inside this file. Capture the real DOM document once, at module
// scope, before that shadowing can happen.
const domDocument = globalThis.document;

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;


const DEFAULT_COLOR = "#000000";
const DEFAULT_STROKE_WIDTH = 12;
const MAX_PAGE_WIDTH = 900;
const THUMBNAIL_WIDTH = 96;
const MIN_BOX_SIZE = 0.004; // ignore accidental taps/clicks


function getShareId(share) {
  return (
    share?.shareId ||
    share?.id ||
    share?.temporaryShareId ||
    null
  );
}


function getDocumentName(document, share) {
  return (
    share?.documentName ||
    share?.fileName ||
    document?.fileName ||
    document?.filename ||
    document?.name ||
    document?.documentName ||
    document?.title ||
    "Selected Document"
  );
}


function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}


function makeId() {
  return `mask_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}


/*
 * Convert a browser pointer position into normalized coordinates
 * (0-1) relative to the element the pointer is over.
 *
 * Because the drawing canvas is now sized to exactly match the
 * rendered page (see renderCurrentPage), this fraction means exactly
 * the same thing on screen as it does on the real PDF page/image the
 * backend later draws on.
 */
function getNormalizedPoint(event, element) {
  const rect = element.getBoundingClientRect();

  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
  };
}


function getDisplayPoint(point, width, height) {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}


export default function MaskDocumentEditor({
  request,
  document,
  share,

  /*
   * Parent should provide a safe preview source for the temporary
   * copy only.
   *
   * IMPORTANT:
   * This must not be the original DMS document URL if that URL
   * exposes the original document.
   */
  previewUrl,

  /*
   * Optional preview type: "pdf" | "image".
   * If not provided, the component attempts to detect it.
   */
  previewType,

  /*
   * Called when owner confirms masks.
   *
   * Receives:
   * { request, document, share, masks, preview }
   *
   * `masks` only contains entries for pages the user actually drew
   * on - untouched pages are never included.
   */
  onConfirm,

  onCancel,
}) {
  const stageWrapperRef = useRef(null);
  const pageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const imageElRef = useRef(null);

  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const currentBoxRef = useRef(null);

  const [masks, setMasks] = useState([]);

  const [tool, setTool] = useState("pen"); // "pen" | "box"
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);

  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [thumbnails, setThumbnails] = useState([]);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);


  const shareId = getShareId(share);


  // ==========================================================
  // DETECT PREVIEW TYPE
  // ==========================================================

  const resolvedPreviewType =
    previewType ||
    (previewUrl && /\.pdf(?:\?|$)/i.test(previewUrl) ? "pdf" : "image");


  // ==========================================================
  // LOAD PDF DOCUMENT (pdfjs)
  // ==========================================================

  useEffect(() => {
    if (resolvedPreviewType !== "pdf" || !previewUrl) {
      pdfDocRef.current?.destroy?.();
      pdfDocRef.current = null;
      setNumPages(1);
      setCurrentPage(1);
      setThumbnails([]);
      return undefined;
    }

    let cancelled = false;

    setPdfLoading(true);
    setPdfError("");
    setThumbnails([]);
    setCurrentPage(1);

    (async () => {
      try {
        const response = await fetch(previewUrl);
        const data = await response.arrayBuffer();

        const doc = await pdfjsLib.getDocument({ data }).promise;

        if (cancelled) {
          doc.destroy();
          return;
        }

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
      } catch (err) {
        if (!cancelled) {
          setPdfError("Unable to load this PDF for masking.");
        }
      } finally {
        if (!cancelled) {
          setPdfLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      pdfDocRef.current?.destroy?.();
      pdfDocRef.current = null;
    };
  }, [previewUrl, resolvedPreviewType]);


  // ==========================================================
  // GENERATE PAGE THUMBNAILS (PDF only)
  // ==========================================================

  useEffect(() => {
    if (resolvedPreviewType !== "pdf" || !pdfDocRef.current || !numPages) {
      return undefined;
    }

    let cancelled = false;
    const doc = pdfDocRef.current;

    (async () => {
      for (let pageNumber = 1; pageNumber <= numPages; pageNumber += 1) {
        if (cancelled) return;

        try {
          const page = await doc.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = THUMBNAIL_WIDTH / baseViewport.width;
          const viewport = page.getViewport({ scale });

          const canvas = domDocument.createElement("canvas");
          canvas.width = Math.max(1, Math.round(viewport.width));
          canvas.height = Math.max(1, Math.round(viewport.height));

          const context = canvas.getContext("2d");
          await page.render({ canvasContext: context, viewport }).promise;

          if (cancelled) return;

          const dataUrl = canvas.toDataURL("image/png");

          setThumbnails((previous) => {
            const next = previous.slice();
            next[pageNumber - 1] = { pageNumber, dataUrl };
            return next;
          });
        } catch {
          // A single bad page shouldn't break the rest of the rail.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [numPages, resolvedPreviewType]);


  // ==========================================================
  // REDRAW ALL MASKS FOR THE CURRENT PAGE
  // ==========================================================

  const redrawCanvas = useCallback(() => {
    const canvas = maskCanvasRef.current;

    if (!canvas || !canvas.width || !canvas.height) {
      return;
    }

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    masks
      .filter((mask) => mask.page === currentPage)
      .forEach((mask) => drawMask(context, canvas, mask));
  }, [masks, currentPage]);


  function drawMask(context, canvas, mask) {
    if (mask.type === "rect") {
      const topLeft = getDisplayPoint(
        { x: mask.x, y: mask.y },
        canvas.width,
        canvas.height
      );

      const size = getDisplayPoint(
        { x: mask.width, y: mask.height },
        canvas.width,
        canvas.height
      );

      context.save();
      context.fillStyle = mask.color;
      context.fillRect(topLeft.x, topLeft.y, size.x, size.y);
      context.restore();
      return;
    }

    if (!mask.points || mask.points.length === 0) {
      return;
    }

    context.save();
    context.strokeStyle = mask.color;
    context.lineWidth = mask.strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();

    const firstPoint = getDisplayPoint(
      mask.points[0],
      canvas.width,
      canvas.height
    );
    context.moveTo(firstPoint.x, firstPoint.y);

    mask.points.slice(1).forEach((point) => {
      const displayPoint = getDisplayPoint(point, canvas.width, canvas.height);
      context.lineTo(displayPoint.x, displayPoint.y);
    });

    context.stroke();
    context.restore();
  }


  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);


  // ==========================================================
  // RENDER CURRENT PDF PAGE INTO pageCanvasRef + SIZE maskCanvasRef
  // ==========================================================

  const renderCurrentPage = useCallback(async () => {
    if (
      resolvedPreviewType !== "pdf" ||
      !pdfDocRef.current ||
      !pageCanvasRef.current ||
      !maskCanvasRef.current
    ) {
      return;
    }

    try {
      renderTaskRef.current?.cancel?.();

      const page = await pdfDocRef.current.getPage(currentPage);

      const containerWidth =
        stageWrapperRef.current?.clientWidth || MAX_PAGE_WIDTH;

      const baseViewport = page.getViewport({ scale: 1 });
      const targetWidth = Math.min(containerWidth, MAX_PAGE_WIDTH);
      const scale = targetWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const dpr = window.devicePixelRatio || 1;

      const pageCanvas = pageCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;

      const cssWidth = Math.round(viewport.width);
      const cssHeight = Math.round(viewport.height);

      [pageCanvas, maskCanvas].forEach((canvas) => {
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
      });

      const context = pageCanvas.getContext("2d");
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const renderTask = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      redrawCanvas();
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") {
        setPdfError("Unable to render this page.");
      }
    }
  }, [currentPage, resolvedPreviewType, redrawCanvas]);


  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);


  useEffect(() => {
    const container = stageWrapperRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(() => {
      renderCurrentPage();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [renderCurrentPage]);


  // ==========================================================
  // SIZE THE MASK CANVAS FOR IMAGE PREVIEWS
  // ==========================================================

  const syncImageCanvasSize = useCallback(() => {
    if (resolvedPreviewType === "pdf") return;

    const image = imageElRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!image || !maskCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = image.clientWidth;
    const cssHeight = image.clientHeight;

    if (!cssWidth || !cssHeight) return;

    maskCanvas.style.width = `${cssWidth}px`;
    maskCanvas.style.height = `${cssHeight}px`;
    maskCanvas.width = Math.round(cssWidth * dpr);
    maskCanvas.height = Math.round(cssHeight * dpr);

    redrawCanvas();
  }, [resolvedPreviewType, redrawCanvas]);


  useEffect(() => {
    if (resolvedPreviewType === "pdf") return undefined;

    syncImageCanvasSize();

    window.addEventListener("resize", syncImageCanvasSize);
    return () => window.removeEventListener("resize", syncImageCanvasSize);
  }, [resolvedPreviewType, syncImageCanvasSize]);


  // ==========================================================
  // LIVE PREVIEW WHILE DRAWING
  // ==========================================================

  const drawLivePreview = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    redrawCanvas();
    const context = canvas.getContext("2d");

    if (tool === "box" && currentBoxRef.current) {
      const box = currentBoxRef.current;
      const x = Math.min(box.start.x, box.end.x);
      const y = Math.min(box.start.y, box.end.y);
      const width = Math.abs(box.end.x - box.start.x);
      const height = Math.abs(box.end.y - box.start.y);

      const topLeft = getDisplayPoint({ x, y }, canvas.width, canvas.height);
      const size = getDisplayPoint({ x: width, y: height }, canvas.width, canvas.height);

      context.save();
      context.globalAlpha = 0.55;
      context.fillStyle = box.color;
      context.fillRect(topLeft.x, topLeft.y, size.x, size.y);
      context.globalAlpha = 1;
      context.strokeStyle = box.color;
      context.setLineDash([6, 4]);
      context.strokeRect(topLeft.x, topLeft.y, size.x, size.y);
      context.restore();
      return;
    }

    if (currentStrokeRef.current) {
      drawMask(context, canvas, currentStrokeRef.current);
    }
  };


  // ==========================================================
  // POINTER HANDLERS
  // ==========================================================

  const handlePointerDown = (event) => {
    const canvas = maskCanvasRef.current;
    if (!canvas || confirming || pdfLoading) return;

    event.preventDefault();

    const point = getNormalizedPoint(event, canvas);
    drawingRef.current = true;

    if (tool === "box") {
      currentBoxRef.current = {
        page: currentPage,
        type: "rect",
        color: currentColor,
        start: point,
        end: point,
      };
    } else {
      currentStrokeRef.current = {
        page: currentPage,
        type: "freehand",
        color: currentColor,
        strokeWidth: Number(strokeWidth),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        points: [point],
      };
    }

    canvas.setPointerCapture?.(event.pointerId);
  };


  const handlePointerMove = (event) => {
    if (!drawingRef.current) return;

    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    event.preventDefault();

    const point = getNormalizedPoint(event, canvas);

    if (tool === "box" && currentBoxRef.current) {
      currentBoxRef.current = { ...currentBoxRef.current, end: point };
    } else if (currentStrokeRef.current) {
      currentStrokeRef.current = {
        ...currentStrokeRef.current,
        points: [...currentStrokeRef.current.points, point],
      };
    }

    drawLivePreview();
  };


  const finishStroke = (event) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if (tool === "box" && currentBoxRef.current) {
      const box = currentBoxRef.current;
      currentBoxRef.current = null;

      const x = Math.min(box.start.x, box.end.x);
      const y = Math.min(box.start.y, box.end.y);
      const width = Math.abs(box.end.x - box.start.x);
      const height = Math.abs(box.end.y - box.start.y);

      const canvas = maskCanvasRef.current;

      if (width >= MIN_BOX_SIZE && height >= MIN_BOX_SIZE) {
        setMasks((previous) => [
          ...previous,
          {
            id: makeId(),
            page: box.page,
            type: "rect",
            color: box.color,
            x,
            y,
            width,
            height,
            canvasWidth: canvas?.width,
            canvasHeight: canvas?.height,
          },
        ]);
      } else {
        redrawCanvas();
      }
    } else if (currentStrokeRef.current) {
      const completedStroke = currentStrokeRef.current;
      currentStrokeRef.current = null;

      if (completedStroke.points.length >= 2) {
        setMasks((previous) => [
          ...previous,
          { ...completedStroke, id: makeId() },
        ]);
      } else {
        redrawCanvas();
      }
    }

    if (event?.pointerId !== undefined) {
      maskCanvasRef.current?.releasePointerCapture?.(event.pointerId);
    }
  };


  // ==========================================================
  // UNDO / CLEAR / RESET (scoped to the page you're looking at,
  // so undo never silently removes a mask from a different page)
  // ==========================================================

  const masksOnCurrentPage = masks.filter((mask) => mask.page === currentPage);
  const pagesWithMasks = Array.from(new Set(masks.map((mask) => mask.page))).sort(
    (a, b) => a - b
  );

  const handleUndo = () => {
    if (confirming) return;

    setMasks((previous) => {
      for (let i = previous.length - 1; i >= 0; i -= 1) {
        if (previous[i].page === currentPage) {
          const next = previous.slice();
          next.splice(i, 1);
          return next;
        }
      }
      return previous;
    });
  };

  const handleClearPage = () => {
    if (confirming) return;

    setMasks((previous) => previous.filter((mask) => mask.page !== currentPage));
    currentStrokeRef.current = null;
    currentBoxRef.current = null;
    drawingRef.current = false;
  };

  const handleReset = () => {
    if (confirming) return;

    setMasks([]);
    setCurrentColor(DEFAULT_COLOR);
    setStrokeWidth(DEFAULT_STROKE_WIDTH);
    setTool("pen");
    currentStrokeRef.current = null;
    currentBoxRef.current = null;
    drawingRef.current = false;
  };

  const goToPage = (pageNumber) => {
    if (confirming) return;
    if (pageNumber < 1 || pageNumber > numPages) return;
    setCurrentPage(pageNumber);
  };


  // ==========================================================
  // CONFIRM MASKS
  //
  // `masks` only ever contains entries for pages the user actually
  // drew on - a page nobody touched never shows up here, so the
  // backend only ever gets the pages that changed.
  // ==========================================================

  const handleConfirm = async () => {
    if (!shareId) {
      setError("The temporary document share could not be identified.");
      return;
    }

    if (!masks.length) {
      setError("Please draw at least one mask before confirming.");
      return;
    }

    if (!onConfirm) {
      setError("Mask confirmation is not available.");
      return;
    }

    try {
      setConfirming(true);
      setError("");

      const canvas = maskCanvasRef.current;

      await onConfirm({
        request,
        document,
        share,
        masks,
        preview: {
          type: resolvedPreviewType,
          coordinateSpace: "normalized",
          width: canvas?.width || 0,
          height: canvas?.height || 0,
          pagesChanged: pagesWithMasks,
        },
      });
    } catch (err) {
      setError(
        err?.payload?.message ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to confirm document masking."
      );
    } finally {
      setConfirming(false);
    }
  };


  return (
    <div className="w-full space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Mask Document
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Draw or box over sensitive information before sending the
            temporary shared copy.
          </p>
        </div>

        <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {getDocumentName(document, share)}
        </div>
      </div>


      {/* ERROR */}

      {(error || pdfError) && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          {error || pdfError}
        </div>
      )}


      {/* SECURITY MESSAGE */}

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        <p className="font-semibold">Original document protection</p>
        <p className="mt-1">
          Masking applies only to the temporary shared copy. The
          original DMS document will not be modified.
        </p>
      </div>


      {/* TOOLBAR */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div className="flex flex-wrap items-end gap-4">

            {/* TOOL SELECTOR */}

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Tool
              </label>

              <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => setTool("pen")}
                  className={`px-3 py-2 text-sm font-medium transition ${
                    tool === "pen"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  ✏️ Pen
                </button>
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => setTool("box")}
                  className={`border-l border-gray-300 px-3 py-2 text-sm font-medium transition dark:border-gray-600 ${
                    tool === "box"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  ▭ Box
                </button>
              </div>
            </div>

            {/* MASK COLOR */}

            <div>
              <label
                htmlFor="mask-color"
                className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Mask Color
              </label>

              <div className="flex items-center gap-2">
                <input
                  id="mask-color"
                  type="color"
                  value={currentColor}
                  disabled={confirming}
                  onChange={(event) => setCurrentColor(event.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-gray-300 bg-white p-1 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {currentColor}
                </span>
              </div>
            </div>

            {/* STROKE SIZE (pen only) */}

            {tool === "pen" && (
              <div className="min-w-52">
                <label
                  htmlFor="stroke-size"
                  className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  Stroke Size: {strokeWidth}px
                </label>
                <input
                  id="stroke-size"
                  type="range"
                  min="4"
                  max="60"
                  step="1"
                  value={strokeWidth}
                  disabled={confirming}
                  onChange={(event) => setStrokeWidth(Number(event.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* EDIT ACTIONS */}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={confirming || masksOnCurrentPage.length === 0}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={handleClearPage}
              disabled={confirming || masksOnCurrentPage.length === 0}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-400"
            >
              Clear Page
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={confirming || masks.length === 0}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>


      {/* PREVIEW */}

      <div className="rounded-xl border border-gray-200 bg-gray-100 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-950">

        {!previewUrl && (
          <div className="flex min-h-96 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            Temporary document preview is not available.
          </div>
        )}

        {previewUrl && (
          <div className="flex flex-col gap-4 md:flex-row">

            {/* PAGE THUMBNAIL RAIL (PDF, multi-page only) */}

            {resolvedPreviewType === "pdf" && numPages > 1 && (
              <div className="flex max-h-[70vh] w-24 shrink-0 flex-col gap-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
                {Array.from({ length: numPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  const thumb = thumbnails[index];
                  const hasMask = masks.some((mask) => mask.page === pageNumber);

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => goToPage(pageNumber)}
                      className={`relative rounded-md border-2 p-1 transition ${
                        pageNumber === currentPage
                          ? "border-blue-500"
                          : "border-transparent hover:border-gray-300"
                      }`}
                      title={`Page ${pageNumber}`}
                    >
                      {thumb ? (
                        <img
                          src={thumb.dataUrl}
                          alt={`Page ${pageNumber}`}
                          className="w-full rounded"
                        />
                      ) : (
                        <div className="flex h-16 w-full items-center justify-center rounded bg-gray-100 text-[10px] text-gray-400 dark:bg-gray-800">
                          ...
                        </div>
                      )}

                      <span className="mt-1 block text-center text-[11px] text-gray-500 dark:text-gray-400">
                        {pageNumber}
                      </span>

                      {hasMask && (
                        <span
                          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"
                          title="This page has a mask"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* MAIN STAGE */}

            <div className="flex-1">

              {resolvedPreviewType === "pdf" && numPages > 1 && (
                <div className="mb-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={confirming || currentPage <= 1}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Page {currentPage} / {numPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={confirming || currentPage >= numPages}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Next →
                  </button>
                </div>
              )}

              <div
                ref={stageWrapperRef}
                className="relative mx-auto flex items-center justify-center overflow-auto rounded-lg bg-white shadow-sm"
                style={{ minHeight: "50vh" }}
              >

                {resolvedPreviewType === "pdf" && pdfLoading && (
                  <div className="flex min-h-96 w-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    Loading document...
                  </div>
                )}

                {resolvedPreviewType === "pdf" && !pdfLoading && (
                  <div className="relative inline-block">
                    <canvas ref={pageCanvasRef} className="block" />
                    <canvas
                      ref={maskCanvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={finishStroke}
                      onPointerCancel={finishStroke}
                      onPointerLeave={(event) => {
                        if (drawingRef.current) finishStroke(event);
                      }}
                      className="absolute inset-0 z-10 touch-none cursor-crosshair"
                      style={{ touchAction: "none" }}
                    />
                  </div>
                )}

                {resolvedPreviewType !== "pdf" && (
                  <div className="relative inline-block">
                    <img
                      ref={imageElRef}
                      src={previewUrl}
                      alt="Temporary document preview"
                      onLoad={syncImageCanvasSize}
                      className="pointer-events-none block h-auto max-w-full select-none"
                      draggable="false"
                    />
                    <canvas
                      ref={maskCanvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={finishStroke}
                      onPointerCancel={finishStroke}
                      onPointerLeave={(event) => {
                        if (drawingRef.current) finishStroke(event);
                      }}
                      className="absolute inset-0 z-10 touch-none cursor-crosshair"
                      style={{ touchAction: "none" }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


      {/* MASK COUNT */}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {masksOnCurrentPage.length}{" "}
        {masksOnCurrentPage.length === 1 ? "mask" : "masks"} on this page
        {" · "}
        {masks.length} total{" "}
        {pagesWithMasks.length > 0 &&
          `across page${pagesWithMasks.length > 1 ? "s" : ""} ${pagesWithMasks.join(", ")}`}
      </p>


      {/* ACTIONS */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming || !shareId || !previewUrl || masks.length === 0}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {confirming ? "Confirming..." : "Preview Masked Copy"}
        </button>
      </div>

    </div>
  );
}