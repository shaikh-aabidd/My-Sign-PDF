import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useListDocumentsQuery } from '../features/api/docSlice';
import { useGetSignaturesQuery } from '../features/api/signatureSlice'; // Add this import
import { Loader } from '../components';
import { FileText, Calendar, HardDrive, CheckCircle, Clock, XCircle, Eye, PenTool, Filter, X } from 'lucide-react';

export default function ProfilePage() {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'signed', 'pending', 'no-signatures'
  
  // Fetch user's documents
  const { data, error, isLoading, refetch } = useListDocumentsQuery();

  // Fetch signatures for all documents
  const documents = data?.data || [];
  const documentIds = documents.map(doc => doc._id);
  
  // Use multiple signature queries for each document
  const signatureQueries = documentIds.map(docId => 
    useGetSignaturesQuery(docId, { skip: !docId })
  );

  // Create a map of document signatures
  const documentSignatures = useMemo(() => {
    const sigMap = {};
    documentIds.forEach((docId, index) => {
      const queryResult = signatureQueries[index];
      if (queryResult?.data?.data) {
        sigMap[docId] = queryResult.data.data;
      } else {
        sigMap[docId] = [];
      }
    });
    return sigMap;
  }, [documentIds, signatureQueries]);

  // Check if any signature queries are loading
  const signaturesLoading = signatureQueries.some(query => query.isLoading);

  // Error retry handler
  const handleRetry = () => {
    refetch();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'signed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get progress percentage
  const getProgressPercentage = (signed, total) => {
    if (!total || total === 0) return 0;
    return Math.round((signed / total) * 100);
  };

  // Calculate document statistics
  const documentStats = useMemo(() => {
    if (!documents.length) return { total: 0, signed: 0, pending: 0, noSignatures: 0, totalPendingSignatures: 0 };
    
    const signedDocs = documents.filter(doc => {
      const signatures = documentSignatures[doc._id] || [];
      return signatures.some(s => s.status === 'signed');
    });

    const pendingDocs = documents.filter(doc => {
      const signatures = documentSignatures[doc._id] || [];
      return signatures.some(s => s.status === 'pending') && !signatures.some(s => s.status === 'signed');
    });

    const noSignatureDocs = documents.filter(doc => {
      const signatures = documentSignatures[doc._id] || [];
      return signatures.length === 0;
    });

    const totalPendingSignatures = documents.reduce((acc, doc) => {
      const signatures = documentSignatures[doc._id] || [];
      return acc + signatures.filter(s => s.status === 'pending').length;
    }, 0);

    return {
      total: documents.length,
      signed: signedDocs.length,
      pending: pendingDocs.length,
      noSignatures: noSignatureDocs.length,
      totalPendingSignatures
    };
  }, [documents, documentSignatures]);

  // Filter documents based on active filter
  const filteredDocuments = useMemo(() => {
    if (!documents.length) return [];
    
    switch (activeFilter) {
      case 'signed':
        return documents.filter(doc => {
          const signatures = documentSignatures[doc._id] || [];
          return signatures.some(s => s.status === 'signed');
        });
      case 'pending':
        return documents.filter(doc => {
          const signatures = documentSignatures[doc._id] || [];
          return signatures.some(s => s.status === 'pending') && !signatures.some(s => s.status === 'signed');
        });
      case 'no-signatures':
        return documents.filter(doc => {
          const signatures = documentSignatures[doc._id] || [];
          return signatures.length === 0;
        });
      default:
        return documents;
    }
  }, [documents, documentSignatures, activeFilter]);

  // Loading state
  if (isLoading || signaturesLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Loading your documents...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Failed to Load Documents</h2>
          <p className="text-red-600 mb-4">
            {error?.data?.message || error?.message || 'An unexpected error occurred. Please try again later.'}
          </p>
          <button
            onClick={handleRetry}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Documents Yet</h2>
          <p className="text-gray-600 mb-6">
            Upload your first document to get started with digital signing.
          </p>
          <Link
            to="/upload"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <FileText className="h-5 w-5" />
            Upload Document
          </Link>
        </div>
      </div>
    );
  }

  const filterOptions = [
    { key: 'all', label: 'All Documents', count: documentStats.total },
    { key: 'signed', label: 'Signed Documents', count: documentStats.signed },
    { key: 'pending', label: 'Pending Signatures', count: documentStats.pending },
    { key: 'no-signatures', label: 'No Signatures', count: documentStats.noSignatures }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Documents</h1>
        <p className="text-gray-600">
          Manage and track your digital signature documents
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documentStats.total}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveFilter('signed')}
        >
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Signed Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documentStats.signed}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveFilter('pending')}
        >
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documentStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pending Signatures</p>
              <p className="text-2xl font-bold text-gray-900">{documentStats.totalPendingSignatures}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>
          {filterOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setActiveFilter(option.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === option.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="ml-2 p-1 text-gray-500 hover:text-gray-700"
              title="Clear filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map(doc => {
          const signatures = documentSignatures[doc._id] || [];
          const total = signatures.length;
          const signed = signatures.filter(s => s.status === 'signed').length;
          const pending = signatures.filter(s => s.status === 'pending').length;
          const rejected = signatures.filter(s => s.status === 'rejected').length;
          const progressPercentage = getProgressPercentage(signed, total);

          return (
            <div key={doc._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="p-6">
                {/* Document Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate" title={doc.filename}>
                      {doc.filename}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(doc.uploadedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-4 w-4" />
                        {doc.fileSizeFormatted || formatFileSize(doc.fileSize)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {total > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Signature Progress</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Signature Status */}
                {total > 0 ? (
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">Signed</span>
                      </div>
                      <span className="font-medium text-green-600">{signed}/{total}</span>
                    </div>
                    
                    {pending > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-gray-700">Pending</span>
                        </div>
                        <span className="font-medium text-yellow-600">{pending}</span>
                      </div>
                    )}
                    
                    {rejected > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-gray-700">Rejected</span>
                        </div>
                        <span className="font-medium text-red-600">{rejected}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-6 text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">No signatures required</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to={`/sign-pdf/${doc._id}`}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2.5 px-4 hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <PenTool className="h-4 w-4" />
                    Sign
                  </Link>
                  <Link
                    to={`/view-pdf/${doc._id}`}
                    className="flex items-center justify-center gap-2 text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-lg py-2.5 px-4 transition-colors text-sm font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty Filter Results */}
      {filteredDocuments.length === 0 && activeFilter !== 'all' && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Documents Found</h2>
          <p className="text-gray-600 mb-6">
            No documents match the current filter criteria.
          </p>
          <button
            onClick={() => setActiveFilter('all')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Show All Documents
          </button>
        </div>
      )}
    </div>
  );
}