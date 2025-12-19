import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetDocumentQuery } from '../features/api/docSlice';
import { useGetSignaturesQuery } from '../features/api/signatureSlice';
import { Loader } from '../components';
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';

// Import PDF.js statically like in your working component
import * as pdfjsLib from 'pdfjs-dist';
// import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import '../../public/pdf.worker.min.mjs'

// Set worker source
// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfViewer() {
  const { id } = useParams();
  console.log(id)
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch document details
  const { data: documentData, error: docError, isLoading: docLoading } = useGetDocumentQuery(id);
  
  // Fetch signatures for this document
  const { data: signaturesData, error: sigError, isLoading: sigLoading } = useGetSignaturesQuery(id);

  useEffect(() => {
    const loadPdf = async () => {
      if (!documentData?.data?.url) return;

      try {
        // Use the statically imported pdfjsLib
        const pdf = await pdfjsLib.getDocument(documentData.data.url).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [documentData]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      const viewport = page.getViewport({ scale, rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Render signatures for current page
      renderSignatures(context, viewport);
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  };

  const renderSignatures = (context, viewport) => {
    if (!signaturesData?.data) return;

    const signatures = signaturesData.data.filter(sig => sig.page === currentPage);
    
    signatures.forEach(signature => {
      if (signature.status === 'signed' && signature.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Convert PDF coordinates to canvas coordinates
          const x = signature.x * viewport.width;
          const y = viewport.height - (signature.y * viewport.height); // PDF coordinates are bottom-up
          
          // Draw signature image
          context.drawImage(img, x, y - 60, 120, 60); // Adjust size as needed
          
          // Draw border around signature
          context.strokeStyle = signature.status === 'signed' ? '#10b981' : '#f59e0b';
          context.lineWidth = 2;
          context.strokeRect(x, y - 60, 120, 60);
        };
        img.src = signature.imageUrl;
      } else {
        // Draw placeholder for pending/rejected signatures
        const x = signature.x * viewport.width;
        const y = viewport.height - (signature.y * viewport.height);
        
        context.fillStyle = signature.status === 'pending' ? '#fef3c7' : '#fee2e2';
        context.fillRect(x, y - 60, 120, 60);
        
        context.strokeStyle = signature.status === 'pending' ? '#f59e0b' : '#ef4444';
        context.lineWidth = 2;
        context.strokeRect(x, y - 60, 120, 60);
        
        // Add text
        context.fillStyle = signature.status === 'pending' ? '#92400e' : '#991b1b';
        context.font = '12px Arial';
        context.textAlign = 'center';
        context.fillText(
          signature.status === 'pending' ? 'Pending' : 'Rejected',
          x + 60,
          y - 30
        );
      }
    });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleDownload = () => {
    if (!documentData?.data?.url) return;

    try {
      // Check if we're in a browser environment
      if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
        console.error('Document API not available');
        // Fallback: open in new tab
        window.open(documentData.data.url, '_blank');
        return;
      }

      // Primary method: programmatic download
      const link = document.createElement('a');
      link.href = documentData.data.url;
      link.download = documentData.data.filename || 'document.pdf';
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Fallback: try window.open
      try {
        window.open(documentData.data.url, '_blank');
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        
        // Last resort: copy URL to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(documentData.data.url).then(() => {
            alert('Download failed. Document URL copied to clipboard.');
          }).catch(() => {
            alert('Download failed. Please copy this URL manually: ' + documentData.data.url);
          });
        } else {
          alert('Download failed. Please copy this URL manually: ' + documentData.data.url);
        }
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (docLoading || sigLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (docError || sigError || error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Document</h2>
          <p className="text-red-600 mb-4">
            {error || docError?.message || sigError?.message || 'Failed to load document'}
          </p>
          <Link
            to="/profile"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  const document = documentData?.data;
  const signatures = signaturesData?.data || [];
  const pageSignatures = signatures.filter(sig => sig.page === currentPage);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/profile"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Documents
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{document?.filename}</h1>
                <p className="text-sm text-gray-500">
                  {signatures.length} signature(s) • Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="Zoom Out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              
              <span className="text-sm text-gray-600 px-2">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="Zoom In"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleRotate}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="Rotate"
              >
                <RotateCw className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* PDF Viewer */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Page Navigation */}
              <div className="flex items-center justify-between p-4 border-b">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              {/* PDF Canvas */}
              <div className="p-4 flex justify-center">
                <div className="border border-gray-300 shadow-lg">
                  <canvas
                    ref={canvasRef}
                    className="block max-w-full h-auto"
                    style={{ maxHeight: '80vh' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Signatures Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Signatures</h2>
                <p className="text-sm text-gray-500">
                  {signatures.filter(s => s.status === 'signed').length} signed, {signatures.filter(s => s.status === 'pending').length} pending
                </p>
              </div>

              {/* All Signatures List */}
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {signatures.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No signatures found</p>
                  </div>
                ) : (
                  signatures.map((signature, index) => (
                    <div
                      key={signature._id}
                      className={`p-3 rounded-lg border ${
                        signature.page === currentPage ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(signature.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              Signature #{index + 1}
                            </p>
                            <span className="text-xs text-gray-500">
                              Page {signature.page}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Status: <span className={`font-medium ${
                              signature.status === 'signed' ? 'text-green-600' :
                              signature.status === 'pending' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {signature.status.charAt(0).toUpperCase() + signature.status.slice(1)}
                            </span></div>
                            
                            <div>
                              Position: ({Math.round(signature.x * 100)}, {Math.round(signature.y * 100)})
                            </div>
                            
                            {signature.createdAt && (
                              <div>
                                Created: {new Date(signature.createdAt).toLocaleDateString()}
                              </div>
                            )}
                            
                            {signature.reason && (
                              <div>
                                Reason: {signature.reason}
                              </div>
                            )}
                          </div>

                          {/* Jump to page button */}
                          {signature.page !== currentPage && (
                            <button
                              onClick={() => setCurrentPage(signature.page)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Go to page {signature.page}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Current Page Signatures */}
              {pageSignatures.length > 0 && (
                <div className="border-t p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Current Page Signatures ({pageSignatures.length})
                  </h3>
                  <div className="space-y-2">
                    {pageSignatures.map((signature, index) => (
                      <div
                        key={signature._id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                      >
                        {getStatusIcon(signature.status)}
                        <span className="text-sm text-gray-700">
                          Signature #{signatures.indexOf(signature) + 1}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          signature.status === 'signed' ? 'bg-green-100 text-green-800' :
                          signature.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {signature.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="border-t p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      {signatures.filter(s => s.status === 'signed').length}
                    </div>
                    <div className="text-xs text-gray-500">Signed</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-yellow-600">
                      {signatures.filter(s => s.status === 'pending').length}
                    </div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}