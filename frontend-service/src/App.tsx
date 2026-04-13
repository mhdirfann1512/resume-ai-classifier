import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, Loader2, Database, X, BarChart3, Code, Shield, Briefcase, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

// --- 1. DYNAMIC COLOR LOGIC (Set & Forget) ---
const getDynamicColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360; 
  return {
    main: `hsl(${h}, 70%, 45%)`,   // Warna utama
    bg: `hsl(${h}, 85%, 96%)`,     // Warna latar lembut (pastel)
  };
};

// --- 2. DYNAMIC ICON COMPONENT ---
const DeptIcon = ({ dept, color, size = 16 }: { dept: string; color: string; size?: number }) => {
  if (dept.includes('Aplikasi')) return <Code size={size} color={color} />;
  if (dept.includes('Siber')) return <Shield size={size} color={color} />;
  if (dept.includes('Pentadbiran') || dept.includes('Kewangan')) return <Briefcase size={size} color={color} />;
  if (dept.includes('Infrastruktur')) return <Database size={size} color={color} />;
  return <Info size={size} color={color} />;
};

// --- INTERFACES ---
interface ResumeEntry {
  id: number;
  fileName: string;
  predictedDepartment: string;
  confidenceScore: number;
  uploadedAt: string;
  allPredictionsJson: string;
}

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

  useEffect(() => { fetchHistory(); }, []);

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
      alert("Upload gagal!");
    } finally {
      setLoading(false);
    }
  }, []);

  const viewDetails = (item: ResumeEntry) => {
    if (item.allPredictionsJson) {
      setSelectedResult({
        top_prediction: { department: item.predictedDepartment, confidence: item.confidenceScore },
        all_predictions: JSON.parse(item.allPredictionsJson)
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, accept: {'application/pdf': ['.pdf']}, multiple: false 
  });

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={logoIconStyle}><FileText size={24} color="white" /></div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Resume Classifier AI</h1>
        </div>
        <div style={statusBadge}>Auto-Styling Enabled</div>
      </header>
      
      <main>
        <section style={{ marginBottom: '40px' }}>
          <div {...getRootProps()} style={isDragActive ? activeDropzoneStyle : dropzoneStyle}>
            <input {...getInputProps()} />
            {loading ? <Loader2 className="animate-spin" size={48} color="#2563eb" /> : <Upload size={48} color="#94a3b8" />}
            <h3 style={{ margin: '16px 0 8px' }}>Muat Naik & Analisis</h3>
            <p style={{ color: '#64748b' }}>Sistem akan auto-generate warna untuk label baru.</p>
          </div>
        </section>

        <section>
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>NAMA FAIL</th>
                  <th style={thStyle}>JABATAN</th>
                  <th style={thStyle}>KEYAKINAN</th>
                  <th style={thStyle}>TARIKH</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const colors = getDynamicColor(item.predictedDepartment);
                  return (
                    <tr key={item.id} style={trStyle} onClick={() => viewDetails(item)}>
                      <td style={tdStyle}>{item.fileName}</td>
                      <td style={tdStyle}>
                        <span style={{
                          backgroundColor: colors.bg,
                          color: colors.main,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: `1px solid ${colors.main}22`
                        }}>
                          {item.predictedDepartment}
                        </span>
                      </td>
                      <td style={tdStyle}><strong>{(item.confidenceScore * 100).toFixed(1)}%</strong></td>
                      <td style={tdStyle}>{new Date(item.uploadedAt).toLocaleDateString('ms-MY')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* --- MODAL --- */}
      {selectedResult && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 color="#2563eb" />
                <h2 style={{ margin: 0 }}>Analisis Terperinci</h2>
              </div>
              <button onClick={() => setSelectedResult(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedResult.all_predictions.map((pred, index) => {
                const colors = getDynamicColor(pred.department);
                return (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DeptIcon dept={pred.department} color={colors.main} />
                        <span style={{ fontWeight: index === 0 ? 700 : 400 }}>{pred.department}</span>
                      </div>
                      <span style={{ fontWeight: 600 }}>{(pred.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${pred.confidence * 100}%`, 
                        height: '100%', 
                        backgroundColor: colors.main, 
                        transition: 'width 0.8s ease' 
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setSelectedResult(null)} style={confirmBtn}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const containerStyle: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: '"Inter", sans-serif' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' };
const logoIconStyle: React.CSSProperties = { backgroundColor: '#2563eb', padding: '8px', borderRadius: '8px' };
const statusBadge: React.CSSProperties = { backgroundColor: '#f0f9ff', color: '#0369a1', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 };
const dropzoneStyle: React.CSSProperties = { border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '40px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#fff' };
const activeDropzoneStyle: React.CSSProperties = { ...dropzoneStyle, borderColor: '#2563eb', backgroundColor: '#f8fafc' };
const tableContainer: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '16px', fontSize: '12px', color: '#64748b', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' };
const tdStyle: React.CSSProperties = { padding: '16px', fontSize: '14px', borderBottom: '1px solid #f1f5f9' };
const trStyle: React.CSSProperties = { cursor: 'pointer', transition: 'background 0.2s' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' };
const confirmBtn: React.CSSProperties = { marginTop: '30px', width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' };

export default App;