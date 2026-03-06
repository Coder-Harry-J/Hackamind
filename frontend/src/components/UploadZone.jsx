import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, X, FileImage, AlertCircle } from 'lucide-react';

export default function UploadZone({ onUpload, isLoading }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    
    if (rejectedFiles && rejectedFiles.length > 0) {
      const rejected = rejectedFiles.map(r => `${r.file.name}: ${r.errors[0]?.message}`).join(', ');
      setError(`Some files were rejected: ${rejected}`);
    }

    const validFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    await onUpload(files.map(f => f.file));
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  });

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-white'}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`
            p-4 rounded-full bg-slate-100
            ${isDragActive ? 'bg-indigo-100' : ''}
          `}>
            {isDragActive ? (
              <Image className="w-10 h-10 text-indigo-500" />
            ) : (
              <Upload className="w-10 h-10 text-slate-400" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-slate-700">
              {isDragActive ? 'Drop your images here' : 'Drag & drop product images'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              or click to browse • JPEG, PNG, GIF, WebP up to 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </h3>
            <button
              onClick={() => setFiles([])}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md 
                           opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  {file.file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleUpload}
            disabled={isLoading || files.length === 0}
            className="
              px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300
              text-white font-medium rounded-lg shadow-lg shadow-indigo-200
              transition-all duration-200 flex items-center gap-2
              hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98]
            "
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FileImage className="w-5 h-5" />
                <span>Upload & Process ({files.length} images)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

