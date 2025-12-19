import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pdfUrl: null,
  pdfData: {
    filename: null,
    documentId: null,
    uploadedAt: null
  },
  signaturePlacements: [],
  currentSignature: null,
  isProcessing: false
};

const pdfSlice = createSlice({
  name: 'pdf',
  initialState,
  reducers: {
    setPdfData: (state, action) => {
      state.pdfUrl = action.payload.url;
      state.pdfData = {
        filename: action.payload.filename,
        documentId: action.payload.documentId,
        uploadedAt: new Date().toISOString()
      };
    },
    
    setCurrentSignature: (state, action) => {
      state.currentSignature = action.payload;
    },
    
    addSignaturePlacement: (state, action) => {
      state.signaturePlacements.push(action.payload);
    },
    
    removeSignaturePlacement: (state, action) => {
      state.signaturePlacements = state.signaturePlacements.filter(
        placement => placement.id !== action.payload
      );
    },
    
    updateSignaturePlacement: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.signaturePlacements.findIndex(p => p.id === id);
      if (index !== -1) {
        state.signaturePlacements[index] = { ...state.signaturePlacements[index], ...updates };
      }
    },
    
    clearSignaturePlacements: (state) => {
      state.signaturePlacements = [];
    },
    
    setProcessing: (state, action) => {
      state.isProcessing = action.payload;
    },
    
    resetPdfState: (state) => {
      return initialState;
    }
  }
});

export const {
  setPdfData,
  setCurrentSignature,
  addSignaturePlacement,
  removeSignaturePlacement,
  updateSignaturePlacement,
  clearSignaturePlacements,
  setProcessing,
  resetPdfState
} = pdfSlice.actions;

export default pdfSlice.reducer;

// Selectors
export const selectPdfData = (state) => state.pdf.pdfData;
export const selectSignaturePlacements = (state) => state.pdf.signaturePlacements;
export const selectCurrentSignature = (state) => state.pdf.currentSignature;
export const selectIsProcessing = (state) => state.pdf.isProcessing;