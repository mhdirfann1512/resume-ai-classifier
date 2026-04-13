import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, Loader2, Database, X, BarChart3, Code, Shield, Briefcase, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

// --- 1. DYNAMIC COLOR LOGIC ---
const getDynamicColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360; 
  return {
    main: `hsl(${h}, 70%, 45%)`,
    bg: `hsl(${h}, 85%, 96%)`,
    glow: `hsla(${h}, 70%, 45%, 0.2)` // Warna untuk efek glow
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
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>Resume Classifier AI</h1>
        </div>
        <div style={statusBadge}>mDeBERTa-v3</div>
      </header>
      
      <main>
        {/* Upload Card with Glow & Lift */}
        <section style={{ marginBottom: '40px' }}>
          <div 
            {...getRootProps()} 
            style={isDragActive ? activeDropzoneStyle : dropzoneStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(37, 99, 235, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <input {...getInputProps()} />
            <div style={{ marginBottom: '16px', transition: 'transform 0.3s ease' }}>
              {loading ? (
                <Loader2 
                  className="animate-spin-slow" 
                  size={56} 
                  color="#2563eb" 
                  style={{ animation: 'spin 1s linear infinite' }} // Kita paksa pusing kat sini!
                />
              ) : (
                <Upload size={56} color="#94a3b8" />
              )}
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Muat Naik & Analisis</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Heret resume PDF anda ke sini untuk klasifikasi automatik.</p>
          </div>
        </section>

        {/* Table Section */}
        <section>
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>NAMA FAIL</th>
                  <th style={thStyle}>KEPUTUSAN AI</th>
                  <th style={thStyle}>KEYAKINAN</th>
                  <th style={thStyle}>TARIKH</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const colors = getDynamicColor(item.predictedDepartment);
                  return (
                    <tr 
                      key={item.id} 
                      style={trStyle} 
                      onClick={() => viewDetails(item)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.transform = 'scale(1.005)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <td style={tdStyle}>{item.fileName}</td>
                      <td style={tdStyle}>
                        <span style={{
                          backgroundColor: colors.bg,
                          color: colors.main,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: `1px solid ${colors.main}33`,
                          boxShadow: `0 2px 4px ${colors.glow}`
                        }}>
                          {item.predictedDepartment}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ width: '40px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px' }}>
                              <div style={{ width: `${item.confidenceScore * 100}%`, height: '100%', backgroundColor: colors.main, borderRadius: '2px' }} />
                           </div>
                           <strong>{(item.confidenceScore * 100).toFixed(1)}%</strong>
                        </div>
                      </td>
                      <td style={tdStyle}>{new Date(item.uploadedAt).toLocaleDateString('ms-MY')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* --- MODAL WITH 3D POP EFFECT --- */}
      {selectedResult && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '10px' }}>
                   <BarChart3 color="#2563eb" size={20} />
                </div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Analisis Terperinci</h2>
              </div>
              <button onClick={() => setSelectedResult(null)} style={closeBtn}><X size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedResult.all_predictions.map((pred, index) => {
                const colors = getDynamicColor(pred.department);
                return (
                  <div key={index} style={{ padding: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <DeptIcon dept={pred.department} color={colors.main} size={18} />
                        <span style={{ fontWeight: index === 0 ? 700 : 500, color: '#1e293b' }}>{pred.department}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: colors.main }}>{(pred.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                      <div style={{ 
                        width: `${pred.confidence * 100}%`, 
                        height: '100%', 
                        backgroundColor: colors.main, 
                        transition: 'width 1s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
                        boxShadow: `2px 0 8px ${colors.glow}`
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={() => setSelectedResult(null)} 
              style={confirmBtn}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Faham & Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES WITH TRANSITIONS ---
const containerStyle: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', padding: '60px 20px', fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', color: '#0f172a' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' };
const logoIconStyle: React.CSSProperties = { backgroundColor: '#2563eb', padding: '10px', borderRadius: '12px', marginRight: '16px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' };
const statusBadge: React.CSSProperties = { backgroundColor: '#f0f9ff', color: '#0369a1', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid #bae6fd' };

const dropzoneStyle: React.CSSProperties = { 
  border: '2px dashed #e2e8f0', borderRadius: '24px', padding: '60px', textAlign: 'center', 
  cursor: 'pointer', backgroundColor: '#fff', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
};
const activeDropzoneStyle: React.CSSProperties = { ...dropzoneStyle, borderColor: '#2563eb', backgroundColor: '#eff6ff' };

const tableContainer: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '20px', fontSize: '12px', color: '#64748b', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '20px', fontSize: '14px', borderBottom: '1px solid #f1f5f9' };
const trStyle: React.CSSProperties = { cursor: 'pointer', transition: 'all 0.2s ease' };

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, animation: 'fadeIn 0.3s ease' };
const modalContent: React.CSSProperties = { backgroundColor: 'white', padding: '40px', borderRadius: '28px', width: '480px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' };
const closeBtn: React.CSSProperties = { border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.2s' };
const confirmBtn: React.CSSProperties = { marginTop: '40px', width: '100%', padding: '16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' };

export default App;