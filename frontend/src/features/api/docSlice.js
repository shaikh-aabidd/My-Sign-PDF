import { apiSlice } from "./apiSlice";

export const docsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadDocument: builder.mutation({
      query: (formData) => ({
        url: "/docs",
        method: "POST",
        body: formData,
        // DO NOT SET HEADERS - let browser set multipart/form-data
      }),
      invalidatesTags: [{ type: "Document", id: "LIST" }],
    }),

    listDocuments: builder.query({
      query: () => "/docs",
      providesTags: (result = [], error) => [
        { type: "Document", id: "LIST" },
        ...result.data.map((doc) => ({ type: "Document", id: doc._id })),
      ],
    }),

    // Get document metadata (not the file itself)
    getDocument: builder.query({
      query: (id) => ({
        url: `/docs/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Document", id }],
    }),

    // RECOMMENDED: Get accessible URL for PDF (best for digital signature apps)
    getDocumentUrl: builder.query({
      query: (id) => ({
        url: `/docs/${id}/url`,
        method: "GET",
      }),
      transformResponse: (response) => {
        // Extract the URL from the API response
        return response.data.url;
      },
      providesTags: (result, error, id) => [{ type: "DocumentUrl", id }],
    }),

    // Option 1: Stream PDF through your server (proxy method)
    getDocumentFile: builder.query({
      query: (id) => ({
        url: `/docs/${id}/file`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch PDF file: ${response.status} ${errorText}`);
          }
          
          // Check if response is actually a PDF
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('Response is not a PDF file');
          }
          
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        },
      }),
      providesTags: (result, error, id) => [{ type: "DocumentFile", id }],
    }),

    // Option 2: Get PDF file using direct URL (more efficient)
    getDocumentFileFromUrl: builder.query({
      queryFn: async (id, { dispatch }) => {
        try {
          // First get the accessible URL
          const urlResponse = await dispatch(
            docsApi.endpoints.getDocumentUrl.initiate(id)
          ).unwrap();
          
          // Then fetch the PDF from the URL
          const pdfResponse = await fetch(urlResponse);
          
          if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
          }
          
          const blob = await pdfResponse.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          return { data: objectUrl };
        } catch (error) {
          return { error: error.message };
        }
      },
      providesTags: (result, error, id) => [{ type: "DocumentFileFromUrl", id }],
    }),

    // Option 3: Simple redirect (opens PDF in new tab/window)
    redirectToDocument: builder.mutation({
      query: (id) => ({
        url: `/docs/${id}/redirect`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error('Failed to redirect to PDF');
          }
          
          // For redirect, we just return the response URL
          return response.url;
        },
      }),
      invalidatesTags: [],
    }),

    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/docs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Document", id },
        { type: "Document", id: "LIST" },
        { type: "DocumentFile", id },
        { type: "DocumentUrl", id },
        { type: "DocumentFileFromUrl", id },
      ],
    }),

     updateSignedDocument: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/docs/${id}/signed`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        // invalidate this document’s metadata & list
        { type: "Document", id },
        { type: "Document", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useUploadDocumentMutation,
  useListDocumentsQuery,
  useGetDocumentQuery,
  useGetDocumentUrlQuery,
  useGetDocumentFileQuery,
  useGetDocumentFileFromUrlQuery,
  useRedirectToDocumentMutation,
  useDeleteDocumentMutation,
  useUpdateSignedDocumentMutation,
} = docsApi;

// Helper function to clean up object URLs (prevent memory leaks)
export const cleanupObjectUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

// Custom hook for PDF handling with cleanup
export const usePdfViewer = (documentId) => {
  const [pdfUrl, setPdfUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Get the accessible URL (recommended approach)
  const { data: directUrl, isLoading: urlLoading, error: urlError } = useGetDocumentUrlQuery(documentId, {
    skip: !documentId,
  });

  React.useEffect(() => {
    if (directUrl) {
      setPdfUrl(directUrl);
      setLoading(false);
      setError(null);
    }
  }, [directUrl]);

  React.useEffect(() => {
    if (urlError) {
      setError(urlError);
      setLoading(false);
    }
  }, [urlError]);

  React.useEffect(() => {
    setLoading(urlLoading);
  }, [urlLoading]);

  // Cleanup function
  const cleanup = React.useCallback(() => {
    if (pdfUrl) {
      cleanupObjectUrl(pdfUrl);
      setPdfUrl(null);
    }
  }, [pdfUrl]);

  return {
    pdfUrl,
    loading,
    error,
    cleanup,
  };
};