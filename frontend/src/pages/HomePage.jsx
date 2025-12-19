import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useUploadDocumentMutation } from '../features/api/docSlice';
import { Button } from '../components';

function HomePage() {
  const navigate = useNavigate();
  const { handleSubmit, reset } = useForm();
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();
  const [uploadError, setUploadError] = React.useState('');
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);

  // Handle file selection (both click and drag)
  const handleFileSelect = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadError('');
      } else {
        setUploadError('Please select a PDF file');
        setSelectedFile(null);
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const onSubmit = async (data) => {
    setUploadError('');
    console.log("Selected file:", selectedFile);
    
    // Check if file is selected using selectedFile state
    if (!selectedFile) {
      setUploadError('Please select your PDF first');
      return;
    }

     try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      let entryCount = 0;
      for (let [key, value] of formData.entries()) {
        console.log(`Entry ${entryCount}: ${key}:`, value);
        entryCount++;
      }
      
      // Test with a simple string to see if FormData is working
      const testFormData = new FormData();
      testFormData.append('test', 'hello');
      for (let [key, value] of testFormData.entries()) {
        console.log(`Test entry: ${key}:`, value);
      }

      const res = await uploadDocument(formData).unwrap();
      if (res?.data?._id) {
        navigate(`/sign-pdf/${res.data._id}`);
      }
    } catch (err) {
      setUploadError(err.data?.message || 'Failed to upload PDF');
    } finally {
      reset();
      setSelectedFile(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Upload Your PDF</h1>
        <p className="text-gray-600 mb-6">Drag and drop or choose a PDF file to sign</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div
            className={`block w-full cursor-pointer border-2 border-dashed p-10 rounded-lg transition ${
              isDragOver 
                ? 'border-indigo-600 bg-indigo-100' 
                : 'border-indigo-400 hover:bg-indigo-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file').click()}
          >
            <input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="text-green-600">
                <p className="font-medium">✓ Selected: {selectedFile.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-indigo-600">
                <p className="font-medium">
                  {isDragOver ? 'Drop your PDF here' : 'Click or drag your PDF here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">PDF files only</p>
              </div>
            )}
          </div>

          {/* Display upload error */}
          {uploadError && <p className="text-red-500 text-sm mt-3">{uploadError}</p>}

          <Button
            type="submit"
            className="mt-6 w-full py-3 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Continue to Sign PDF'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default HomePage;