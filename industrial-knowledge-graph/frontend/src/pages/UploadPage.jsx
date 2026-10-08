import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, File, FileText, CheckCircle, AlertTriangle, X, Loader, Network, UploadCloud, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { documentAPI } from '../services/api'

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documentId, setDocumentId] = useState(null)
  
  const [processing, setProcessing] = useState(false)
  const [processStep, setProcessStep] = useState(0)
  const [processResult, setProcessResult] = useState(null)

  const steps = [
    "Extracting text...",
    "Cleaning text...",
    "Generating embeddings...",
    "Extracting entities...",
    "Building knowledge graph..."
  ]

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0])
      setDocumentId(null)
      setProcessResult(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  })

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(10)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90))
      }, 500)

      const response = await documentAPI.upload(formData)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setDocumentId(response.id)
      toast.success('File uploaded successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleProcess = async () => {
    if (!documentId) return

    setProcessing(true)
    
    // Fake progress steps for UI feedback since actual process might take a while
    const stepInterval = setInterval(() => {
      setProcessStep(prev => prev < 4 ? prev + 1 : prev)
    }, 2000)

    try {
      const response = await documentAPI.process(documentId)
      clearInterval(stepInterval)
      setProcessStep(5)
      setProcessResult(response)
      toast.success('Document processed successfully!')
    } catch (error) {
      clearInterval(stepInterval)
      toast.error(error.message || 'Failed to process document')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Document</h1>
        <p className="text-gray-500">Upload manuals, maintenance logs, or standard operating procedures to extract knowledge.</p>
      </div>

      {!documentId && (
        <div className="card p-6">
          {!file ? (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-200 hover:border-blue-400 hover:bg-white'}`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Drag & drop a file here</h3>
              <p className="text-sm text-gray-500 mb-4">or click to select a file</p>
              <p className="text-xs text-gray-500">Supports PDF, DOCX, TXT up to 50MB</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-medium truncate max-w-[300px]">{file.name}</h4>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                {!uploading && (
                  <button onClick={() => setFile(null)} className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {uploading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-400 font-medium">Uploading...</span>
                    <span className="text-gray-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button onClick={handleUpload} className="btn btn-primary w-full sm:w-auto">
                    Upload File
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {documentId && !processResult && (
        <div className="card p-8 text-center animate-fade-in border-green-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          {!processing ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Complete!</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Your file has been saved. Next, process the document to extract entities, relationships, and build the knowledge graph.
              </p>
              <div className="flex justify-center gap-4">
                <button onClick={() => navigate('/documents')} className="btn btn-secondary">
                  Do it later
                </button>
                <button onClick={handleProcess} className="btn btn-primary px-8">
                  Process Document Now
                </button>
              </div>
            </>
          ) : (
            <div className="py-6">
              <Loader className="w-12 h-12 text-blue-500 mx-auto mb-6 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Processing Document</h3>
              
              <div className="max-w-sm mx-auto space-y-4 text-left">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center">
                    {idx < processStep ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    ) : idx === processStep ? (
                      <Loader className="w-5 h-5 text-blue-400 mr-3 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600 mr-3 flex-shrink-0"></div>
                    )}
                    <span className={idx <= processStep ? "text-gray-200" : "text-gray-600"}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {processResult && (
        <div className="card p-8 animate-fade-in border-blue-500/30">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 mb-4">
              <Network className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Complete!</h3>
            <p className="text-gray-500">Knowledge graph extracted successfully.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200">
              <div className="text-3xl font-bold text-gray-900 mb-1">{processResult.entities_count || processResult.entities || 0}</div>
              <div className="text-sm text-gray-500">Entities Found</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200">
              <div className="text-3xl font-bold text-gray-900 mb-1">{processResult.relationships_count || processResult.relationships || 0}</div>
              <div className="text-sm text-gray-500">Relationships</div>
            </div>
          </div>

          <div className="flex justify-center">
            <button onClick={() => navigate(`/documents/${documentId}`)} className="btn btn-primary flex items-center">
              View Document Details <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
