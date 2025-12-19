import React, { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import SignatureCanvas from "react-signature-canvas";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, rgb } from "pdf-lib";
import html2canvas from "html2canvas";
import { Button } from "../components";
import {
  useGetDocumentQuery,
  useUpdateSignedDocumentMutation,
} from "../features/api/docSlice";
import { useSaveSignatureMutation } from "../features/api/signatureSlice";
import {
  setPdfData,
  addSignaturePlacement,
  removeSignaturePlacement,
  clearSignaturePlacements,
} from "../features/pdf/pdfSlice";

// Import CSS files for react-pdf
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import "../../public/pdf.worker.min.mjs";

const SignPdfPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Local state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isSignatureMode, setIsSignatureMode] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Refs
  const signatureCanvasRef = useRef(null);
  const pdfContainerRef = useRef(null);

  // Redux state
  const { signaturePlacements } = useSelector((state) => state.pdf);

  // API queries
  const {
    data: document,
    isLoading: docLoading,
    error: docError,
  } = useGetDocumentQuery(id);
  const [saveSignatureMutation, { isLoading: isSavingSignature }] =
    useSaveSignatureMutation();
  const [updateSignedDocument, { isLoading, UpdateError }] =
    useUpdateSignedDocumentMutation();
  // Load PDF when document data is available
  useEffect(() => {
    if (document?.data?.url) {
      loadPdf(document.data.url);
    }
  }, [document]);

  // Load PDF function
  const loadPdf = async (url) => {
    try {
      setLoading(true);
      setError(null);

      // Store the URL for later re-fetching
      setPdfUrl(url);

      // Fetch PDF from URL with proper headers
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load PDF: ${response.status} ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();

      // Validate that we actually got a PDF
      if (arrayBuffer.byteLength === 0) {
        throw new Error("PDF file is empty");
      }

      // Store the ArrayBuffer directly without copying
      setPdfFile(arrayBuffer);

      // Store in Redux with a copy if needed
      dispatch(
        setPdfData({
          url: url,
          documentId: id,
        })
      );
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // PDF load success handler
  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log("PDF loaded successfully:", numPages, "pages");
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  };

  // PDF load error handler with worker fallback
  const onDocumentLoadError = (error) => {
    console.error("PDF load error:", error);

    if (error.message?.includes("does not match the Worker version")) {
      console.log("Worker version mismatch detected, trying fallback...");
      pdfjs.GlobalWorkerOptions.workerSrc = "";

      if (pdfUrl) {
        setTimeout(() => {
          loadPdf(pdfUrl);
        }, 100);
      }
      return;
    }

    if (error.name === "InvalidPDFException") {
      setError("Invalid PDF file format");
    } else if (error.name === "MissingPDFException") {
      setError("PDF file not found");
    } else if (error.name === "UnexpectedResponseException") {
      setError("Failed to fetch PDF file");
    } else if (error.message?.includes("worker")) {
      setError("PDF worker failed to load. Retrying without worker...");
    } else {
      setError(
        "Failed to load PDF document: " + (error.message || "Unknown error")
      );
    }
  };

  // Clear signature canvas
  const clearSignature = useCallback(() => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
    setSignatureData(null);
  }, []);

  // Save signature from canvas
  const saveSignature = useCallback(() => {
    if (signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current.getCanvas();
      const signatureDataURL = canvas.toDataURL("image/png");
      setSignatureData(signatureDataURL);
      setIsSignatureMode(false);
    }
  }, []);

  // Handle click on PDF to place signature
  const handlePdfClick = useCallback(
    (event) => {
      if (!signatureData || !isSignatureMode) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const placement = {
        id: Date.now(),
        x: x,
        y: y,
        page: pageNumber,
        signature: signatureData,
        width: 150,
        height: 60,
      };

      dispatch(addSignaturePlacement(placement));
      setIsSignatureMode(false);
    },
    [signatureData, isSignatureMode, pageNumber, dispatch]
  );

  // Remove signature placement
  const removeSignature = useCallback(
    (placementId) => {
      dispatch(removeSignaturePlacement(placementId));
    },
    [dispatch]
  );

  // Fetch fresh PDF data for signing
  const fetchFreshPdfData = async () => {
    if (!pdfUrl) {
      throw new Error("PDF URL not available");
    }

    console.log("Fetching fresh PDF data from:", pdfUrl);

    const response = await fetch(pdfUrl, {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch PDF: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength === 0) {
      throw new Error("PDF file is empty");
    }

    return arrayBuffer;
  };

  // Convert data URL to Blob
  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Save signature to backend using RTK Query
  const saveSignatureToBackend = async (placement) => {
    try {
      // Convert signature data URL to blob
      const signatureBlob = dataURLtoBlob(placement.signature);

      // Call the mutation
      const result = await saveSignatureMutation({
        documentId: id,
        x: placement.x,
        y: placement.y,
        page: placement.page,
        status: "signed", // Mark as completed since PDF is being generated
        reason: "Document signed and PDF generated",
        signatureFile: signatureBlob,
      }).unwrap();

      console.log("Signature saved successfully:", result);
      return result;
    } catch (error) {
      console.error("Error saving signature:", error);
      throw error;
    }
  };

  // Generate final PDF with signatures
  const generateSignedPdf = useCallback(async () => {
    if (signaturePlacements.length === 0) {
      setError("No signatures to add");
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setError(null);
      console.log("Starting PDF generation...");

      // Save all signatures to backend first
      console.log("Saving signatures to backend...");
      const savePromises = signaturePlacements.map((placement) =>
        saveSignatureToBackend(placement)
      );

      try {
        await Promise.all(savePromises);
        console.log("All signatures saved to backend successfully");
      } catch (saveError) {
        console.error("Error saving signatures:", saveError);
        setError("Failed to save signatures: " + saveError.message);
        return;
      }

      // Always fetch fresh PDF data to avoid detached ArrayBuffer issues
      const pdfBuffer = await fetchFreshPdfData();

      console.log("Fresh PDF data fetched, size:", pdfBuffer.byteLength);

      // Load the PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();

      console.log("PDF loaded successfully, pages:", pages.length);

      // Add signatures to each page
      for (const placement of signaturePlacements) {
        const page = pages[placement.page - 1];
        if (!page) {
          console.warn(`Page ${placement.page} not found, skipping signature`);
          continue;
        }

        try {
          // Convert signature data URL to bytes
          const base64Data = placement.signature.split(",")[1];
          if (!base64Data) {
            throw new Error("Invalid signature data");
          }

          const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
            c.charCodeAt(0)
          );

          // Embed the signature image
          const signatureImage = await pdfDoc.embedPng(imageBytes);
          const { width, height } = page.getSize();

          // Calculate position (flip Y coordinate for PDF coordinate system)
          const x = placement.x;
          const y = height - placement.y - placement.height;

          console.log(
            `Adding signature at position: x=${x}, y=${y}, page=${placement.page}`
          );

          // Draw signature on page
          page.drawImage(signatureImage, {
            x: x,
            y: y,
            width: placement.width,
            height: placement.height,
          });
        } catch (imageError) {
          console.error("Error processing signature:", imageError);
          throw new Error(`Failed to add signature: ${imageError.message}`);
        }
      }

      console.log("All signatures added, saving PDF...");

      // Save the PDF
      const pdfBytes = await pdfDoc.save();

      console.log("PDF saved successfully, size:", pdfBytes.length);

      // Create download link - ensure we're in browser environment
      if (typeof window !== "undefined" && window.document) {
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        // Create temporary link and trigger download
        const link = window.document.createElement("a");
        link.href = url;
        link.download = `signed_${document?.data?.filename || "document.pdf"}`;

        // Append to body, click, and clean up
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);

        // Clean up the object URL
        URL.revokeObjectURL(url);

        console.log("Download initiated successfully");

        // Clear signature placements after successful generation
        dispatch(clearSignaturePlacements());

        //update file
        const signedBlob = new Blob([pdfBytes], { type: "application/pdf" });
        // If your mutation truly needs a File:
        const signedFile = new File([signedBlob], document.data.filename, {
          type: "application/pdf",
        });
        console.log("doid",document._id)
        await updateSignedDocument({
          id,
          file: signedFile,
        }).unwrap();
        // Show success message

        alert(
          "PDF signed successfully! Signatures have been saved to the database."
        );
      } else {
        throw new Error("Document download not available in this environment");
      }
    } catch (err) {
      console.error("Error generating signed PDF:", err);
      setError("Failed to generate signed PDF: " + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [signaturePlacements, document, pdfUrl, id, dispatch]);

  // Navigation functions
  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  // Retry loading PDF
  const retryLoadPdf = () => {
    if (pdfUrl) {
      loadPdf(pdfUrl);
    }
  };

  // Loading state
  if (docLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading PDF...</div>
      </div>
    );
  }

  // Error state with retry option
  if (docError || error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-500 text-center mb-4">
          <p className="text-lg font-semibold">Error loading PDF</p>
          <p className="text-sm">{docError?.message || error}</p>
        </div>
        <Button onClick={retryLoadPdf} className="mt-4">
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Sign PDF Document</h1>
        <p className="text-gray-600">{document?.data?.filename}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Viewer */}
        <div className="lg:col-span-2">
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <Button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="mr-2"
                >
                  Previous
                </Button>
                <span className="mx-2">
                  Page {pageNumber} of {numPages}
                </span>
                <Button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="ml-2"
                >
                  Next
                </Button>
              </div>

              <Button
                onClick={() => setIsSignatureMode(!isSignatureMode)}
                className={isSignatureMode ? "bg-red-500" : "bg-blue-500"}
                disabled={!signatureData}
              >
                {isSignatureMode ? "Cancel Placement" : "Place Signature"}
              </Button>
            </div>

            <div
              ref={pdfContainerRef}
              className="relative border"
              onClick={handlePdfClick}
              style={{ cursor: isSignatureMode ? "crosshair" : "default" }}
            >
              {pdfFile && (
                <Document
                  file={pdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex justify-center items-center h-64">
                      Loading PDF...
                    </div>
                  }
                  error={
                    <div className="flex justify-center items-center h-64 text-red-500">
                      Failed to load PDF
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="flex justify-center items-center h-64">
                        Loading page...
                      </div>
                    }
                    error={
                      <div className="flex justify-center items-center h-64 text-red-500">
                        Failed to load page
                      </div>
                    }
                  />
                </Document>
              )}

              {/* Render signature placements for current page */}
              {signaturePlacements
                .filter((placement) => placement.page === pageNumber)
                .map((placement) => (
                  <div
                    key={placement.id}
                    className="absolute border-2 border-blue-500 bg-white bg-opacity-80"
                    style={{
                      left: placement.x,
                      top: placement.y,
                      width: placement.width,
                      height: placement.height,
                    }}
                  >
                    <img
                      src={placement.signature}
                      alt="Signature"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={() => removeSignature(placement.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Signature Panel */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-4 bg-white">
            <h2 className="text-xl font-bold mb-4">Signature</h2>

            {!signatureData ? (
              <div>
                <p className="mb-4">Draw your signature below:</p>
                <div className="border rounded">
                  <SignatureCanvas
                    ref={signatureCanvasRef}
                    penColor="black"
                    canvasProps={{
                      width: 300,
                      height: 150,
                      className: "signature-canvas",
                    }}
                  />
                </div>
                <div className="mt-4 space-x-2">
                  <Button onClick={saveSignature}>Save Signature</Button>
                  <Button onClick={clearSignature} variant="outline">
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-4">Your signature:</p>
                <img
                  src={signatureData}
                  alt="Your signature"
                  className="border rounded w-full h-32 object-contain bg-gray-50"
                />
                <div className="mt-4 space-x-2">
                  <Button onClick={() => setSignatureData(null)}>
                    Change Signature
                  </Button>
                </div>
              </div>
            )}

            {signatureData && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">
                  Click on the PDF to place your signature
                </p>
                <Button
                  onClick={generateSignedPdf}
                  className="w-full"
                  disabled={
                    signaturePlacements.length === 0 ||
                    isGeneratingPdf ||
                    isSavingSignature
                  }
                >
                  {isGeneratingPdf
                    ? "Generating PDF..."
                    : isSavingSignature
                    ? "Saving Signatures..."
                    : "Download Signed PDF"}
                </Button>

                {(isGeneratingPdf || isSavingSignature) && (
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    {isSavingSignature
                      ? "Saving signatures to database..."
                      : "Generating PDF..."}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignPdfPage;
