import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, Loader2, Database, X, BarChart3, Code, Shield, Briefcase, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

// Interface untuk rekod dari Database
interface ResumeEntry {
  id: number;
  fileName: string;
  predictedDepartment: string;
  confidenceScore: number;
  uploadedAt: string;
  allPredictionsJson: string;
}

// Interface untuk detail AI (All Predictions)
interface Prediction {
  department: string;
  confidence: number;
}

interface AiResponse {
  top_prediction: Prediction;
  all_predictions: Prediction[];
}

const App: React.FC = () => {
  const [history, setHistory] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<AiResponse | null>(null);

  const fetchHistory = async () => {
    try {
      const response = await axios.get<ResumeEntry[]>('http://localhost:8080/api/resumes');
      setHistory(response.data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Gagal menarik history:", error);
    }
  };

  useEffect(() => { 
    fetchHistory(); 
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post<AiResponse>('http://localhost:8080/api/resumes/upload', formData);
      setSelectedResult(response.data);
      fetchHistory();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload gagal! Sila pastikan server Java & Python sedang berjalan.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fungsi untuk buka balik analisis dari table
  const viewDetails = (item: ResumeEntry) => {
    try {
      // 1. Check kalau data JSON wujud dalam DB
      if (item.allPredictionsJson) {
        const parsed: Prediction[] = JSON.parse(item.allPredictionsJson);
        setSelectedResult({
          top_prediction: { department: item.predictedDepartment, confidence: item.confidenceScore },
          all_predictions: parsed
        });
      } 
      // 2. Safety Case: Kalau rekod lama (allPredictionsJson == null)
      else {
        console.warn("Rekod lama dijumpai tanpa data JSON penuh.");
        setSelectedResult({
          top_prediction: { department: item.predictedDepartment, confidence: item.confidenceScore },
          all_predictions: [
            { department: item.predictedDepartment, confidence: item.confidenceScore },
            { department: "Data Lama (Tiada Pecahan)", confidence: 1 - item.confidenceScore }
          ]
        });
      }
    } catch (error) {
      console.error("Gagal memproses data JSON:", error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'application/pdf': ['.pdf']}, 
    multiple: false 
  });

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={logoIconStyle}><FileText size={24} color="white" /></div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Resume Classifier AI</h1>
        </div>
        <div style={statusBadge}>AI Model: mDeBERTa-v3</div>
      </header>
      
      <main>
        {/* Upload Section */}
        <section style={{ marginBottom: '40px' }}>
          <div {...getRootProps()} style={isDragActive ? activeDropzoneStyle : dropzoneStyle}>
            <input {...getInputProps()} />
            {loading ? <Loader2 className="animate-spin" size={48} color="#2563eb" /> : <Upload size={48} color="#94a3b8" />}
            <h3 style={{ margin: '16px 0 8px' }}>Muat Naik & Analisis</h3>
            <p style={{ color: '#64748b' }}>Klik mana-mana baris dalam jadual untuk lihat analisis penuh.</p>
          </div>
        </section>

        {/* Table Section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
            <Database size={20} color="#475569" />
            <h2 style={{ margin: 0, fontSize: '18px' }}>Rekod Klasifikasi</h2>
          </div>

          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>NAMA FAIL</th>
                  <th style={thStyle}>KEPUTUSAN TERTINGGI</th>
                  <th style={thStyle}>CONFIDENCE</th>
                  <th style={thStyle}>TARIKH</th>
                  <th style={thStyle}>TINDAKAN</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr 
                    key={item.id} 
                    style={trStyle} 
                    onClick={() => viewDetails(item)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={tdStyle}>{item.fileName}</td>
                    <td style={tdStyle}>
                      <span style={getBadgeStyle(item.predictedDepartment)}>
                        {item.predictedDepartment}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <strong style={{ color: item.confidenceScore > 0.7 ? '#16a34a' : '#ca8a04' }}>
                        {(item.confidenceScore * 100).toFixed(1)}%
                      </strong>
                    </td>
                    <td style={tdStyle}>
                      {new Date(item.uploadedAt).toLocaleDateString('ms-MY')}
                    </td>
                    <td style={tdStyle}>
                      <button style={viewBtn}><Info size={16} /> Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* --- MODAL ALL PREDICTIONS --- */}
      {selectedResult && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 color="#2563eb" />
                <h2 style={{ margin: 0 }}>Analisis Terperinci AI</h2>
              </div>
              <button onClick={() => setSelectedResult(null)} style={closeBtn}><X /></button>
            </div>

            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
              Berikut adalah pecahan kebarangkalian bagi jabatan tersebut:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {selectedResult.all_predictions.map((pred, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {pred.department.includes('Aplikasi') && <Code size={14} color="#2563eb" />}
                      {pred.department.includes('Siber') && <Shield size={14} color="#ef4444" />}
                      {pred.department.includes('Pentadbiran') && <Briefcase size={14} color="#f59e0b" />}
                      <span style={{ fontWeight: index === 0 ? 700 : 400 }}>{pred.department}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{(pred.confidence * 100).toFixed(2)}%</span>
                  </div>
                  <div style={progressBarBg}>
                    <div style={{ 
                      ...progressBarFill, 
                      width: `${pred.confidence * 100}%`,
                      backgroundColor: index === 0 ? '#2563eb' : '#cbd5e1'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedResult(null)} style={confirmBtn}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const containerStyle: React.CSSProperties = { maxWidth: '1100px', margin: '0 auto', padding: '40px 20px', fontFamily: '"Inter", sans-serif' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' };
const logoIconStyle: React.CSSProperties = { backgroundColor: '#2563eb', padding: '8px', borderRadius: '8px', marginRight: '12px' };
const statusBadge: React.CSSProperties = { backgroundColor: '#f0fdf4', color: '#166534', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, border: '1px solid #bbf7d0' };
const dropzoneStyle: React.CSSProperties = { border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '48px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#ffffff' };
const activeDropzoneStyle: React.CSSProperties = { ...dropzoneStyle, borderColor: '#2563eb', backgroundColor: '#eff6ff' };
const tableContainer: React.CSSProperties = { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' };
const tdStyle: React.CSSProperties = { padding: '16px', fontSize: '14px', borderBottom: '1px solid #f1f5f9' };
const trStyle: React.CSSProperties = { cursor: 'pointer', transition: 'background 0.2s' };
const viewBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#475569' };

const getBadgeStyle = (dept: string): React.CSSProperties => ({
  backgroundColor: dept.includes('Aplikasi') ? '#dbeafe' : dept.includes('Siber') ? '#fee2e2' : '#fef9c3',
  color: dept.includes('Aplikasi') ? '#1e40af' : dept.includes('Siber') ? '#991b1b' : '#854d0e',
  padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600
});

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '450px' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const closeBtn: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer' };
const progressBarBg: React.CSSProperties = { width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px' };
const progressBarFill: React.CSSProperties = { height: '100%', borderRadius: '4px', transition: 'width 0.8s' };
const confirmBtn: React.CSSProperties = { marginTop: '30px', width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' };

export default App;