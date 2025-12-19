import { apiSlice } from "./apiSlice";

export const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (documentId) => `/audit/${documentId}`,
      providesTags: (result = [], error, documentId) => [
        { type: 'Audit', id: documentId }
      ],
    }),
  }),
});

export const {
  useGetAuditLogsQuery,
} = auditApi;