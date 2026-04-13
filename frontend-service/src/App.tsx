interface Prediction {
  department: string;
  confidence: number;
}

interface AiResponse {
  top_prediction: Prediction;
  all_predictions: Prediction[];
}

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Upload, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const App: React.FC = () => {
  const [result, setResult] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      // Ensure your Spring Boot server is running!
      const response = await axios.post<AiResponse>(
        'http://localhost:8080/api/resumes/upload', 
        formData
      );
      setResult(response.data);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to connect to the Java Backend. Check CORS settings!");
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'application/pdf': ['.pdf']},
    multiple: false
  });

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <FileText size={32} color="#2563eb" />
        <h1 style={{ marginLeft: '12px' }}>Resume AI Classifier</h1>
      </header>
      
      <main>
        <div {...getRootProps()} style={isDragActive ? activeDropzoneStyle : dropzoneStyle}>
          <input {...getInputProps()} />
          {loading ? (
            <Loader2 className="animate-spin" size={40} color="#2563eb" />
          ) : (
            <Upload size={40} color={isDragActive ? "#2563eb" : "#666"} />
          )}
          <p>{isDragActive ? "Release to drop..." : "Drag & drop resume PDF here, or click to browse"}</p>
        </div>

        {loading && <p style={{ textAlign: 'center' }}>Processing with mDeBERTa Model...</p>}

        {result && (
          <div style={resultCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <CheckCircle color="#10b981" style={{ marginRight: '8px' }} />
              <h2 style={{ margin: 0 }}>Classification Result</h2>
            </div>
            
            <div style={infoRow}>
              <span>Predicted Department:</span>
              <strong>{result.top_prediction.department}</strong>
            </div>
            
            <div style={infoRow}>
              <span>Confidence Score:</span>
              <span style={badgeStyle}>
                {(result.top_prediction.confidence * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- Simple Inline Styles for Quick Testing ---
const containerStyle: React.CSSProperties = { maxWidth: '800px', margin: '0 auto', padding: '40px', fontFamily: 'Inter, system-ui, sans-serif' };
const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', marginBottom: '32px' };
const dropzoneStyle: React.CSSProperties = { border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '60px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'all 0.2s' };
const activeDropzoneStyle: React.CSSProperties = { ...dropzoneStyle, borderColor: '#2563eb', backgroundColor: '#eff6ff' };
const resultCardStyle: React.CSSProperties = { marginTop: '32px', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };
const infoRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' };
const badgeStyle: React.CSSProperties = { backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '999px', fontWeight: 'bold' };

export default App;