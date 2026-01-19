import { useState } from 'react'

function PDFUpload({ onUpload, uploadedFiles = [] }) {
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(file)
    } else {
      alert('Only PDF files are allowed')
      e.target.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file')
      return
    }

    await onUpload(selectedFile)
    setSelectedFile(null)
    document.getElementById('pdfUpload').value = ''
  }

  return (
    <div className="pdf-upload-section">
      <h3>Upload Answer PDF (Optional)</h3>
      <p className="help-text">You can upload scanned answer sheets or handwritten work</p>
      
      <div className="upload-controls">
        <input
          type="file"
          id="pdfUpload"
          accept=".pdf"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          className="btn-secondary"
          onClick={handleUpload}
          disabled={!selectedFile}
        >
          📎 Upload PDF
        </button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="uploaded-file-item">
              <div className="file-info">
                <div className="file-name">📄 {file.filename}</div>
                <div className="file-size">{(file.file_size / 1024).toFixed(2)} KB</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PDFUpload
