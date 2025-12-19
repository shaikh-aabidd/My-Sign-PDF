// src/features/api/signature.api.js
import { apiSlice } from "./apiSlice";

export const signatureApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Save or update a signature (multipart/form-data)
    saveSignature: builder.mutation({
      query: ({ documentId, x, y, page, status, reason, signatureFile }) => {
        const formData = new FormData();
        formData.append('documentId', documentId);
        formData.append('x', x);
        formData.append('y', y);
        formData.append('page', page);
        if (status) formData.append('status', status);
        if (reason) formData.append('reason', reason);
        formData.append('signatureImage', signatureFile);
        return {
          url: '/signatures',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { documentId }) => [
        { type: 'Signature', id: documentId }
      ],
    }),

    // Get all signatures for a document
    getSignatures: builder.query({
      query: (documentId) => `/signatures/${documentId}`,
      providesTags: (result = [], error, documentId) => [
        { type: 'Signature', id: documentId }
      ],
    }),

    // Finalize pending signatures
    finalizeSignatures: builder.mutation({
      query: (documentId) => ({
        url: '/signatures/finalize',
        method: 'POST',
        body: { documentId }
      }),
      invalidatesTags: (result, error, documentId) => [
        { type: 'Signature', id: documentId }
      ],
    }),
  }),
});

export const {
  useSaveSignatureMutation,
  useGetSignaturesQuery,
  useFinalizeSignaturesMutation,
} = signatureApi;
