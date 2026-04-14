import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, Loader2, Database, X, BarChart3, Code, Shield, Briefcase, Info, AlertCircle, History, Activity } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

// --- 1. DYNAMIC COLOR LOGIC ---
const getDynamicColor = (name: string | null) => {
  if (!name) return { main: '#94a3b8', bg: '#f1f5f9', glow: 'rgba(148, 163, 184, 0.1)' };
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360; 
  return {
    main: `hsl(${h}, 70%, 45%)`,
    bg: `hsl(${h}, 85%, 96%)`,
    glow: `hsla(${h}, 70%, 45%, 0.3)`
  };
};

// --- 2. DYNAMIC ICON COMPONENT ---
const DeptIcon = ({ dept, color, size = 16 }: { dept: string | null; color: string; size?: number }) => {
  if (!dept) return <Info size={size} color={color} />;
  const d = dept.toLowerCase();
  if (d.includes('aplikasi')) return <Code size={size} color={color} />;
  if (d.includes('siber')) return <Shield size={size} color={color} />;
  if (d.includes('pentadbiran') || d.includes('kewangan')) return <Briefcase size={size} color={color} />;
  if (d.includes('infrastruktur')) return <Database size={size} color={color} />;
  return <Info size={size} color={color} />;
};

interface ResumeEntry {
  id: number;
  fileName: string;
  predictedDepartment: string | null;
  confidenceScore: number;
  uploadedAt: string;
  allPredictionsJson: string | null;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

interface AiResponse {
  top_prediction: { department: string; confidence: number };
  all_predictions: { department: string; confidence: number }[];
}

const App: React.FC = () => {
  const [history, setHistory] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<AiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [showAbout, setShowAbout] = useState<boolean>(false); // State baru untuk Info


  const fetchHistory = async () => {
    try {
      const response = await axios.get<ResumeEntry[]>('http://localhost:8080/api/resumes');
      setHistory(response.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    const isStillProcessing = history.some(item => item.status === 'PROCESSING');
    if (isStillProcessing) {
      const interval = setInterval(() => fetchHistory(), 3000);
      return () => clearInterval(interval);
    }
  }, [history]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/resumes/upload', formData);
      setActiveTab('active');
      fetchHistory();
    } catch {
      alert("Upload gagal!");
    } finally {
      setLoading(false);
    }
  }, []);

  const viewDetails = (item: ResumeEntry) => {
    if (item.status !== 'COMPLETED') return;
    if (item.allPredictionsJson) {
      setSelectedResult({
        top_prediction: { department: item.predictedDepartment || '', confidence: item.confidenceScore },
        all_predictions: JSON.parse(item.allPredictionsJson)
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, accept: {'application/pdf': ['.pdf']}, multiple: false 
  });

  const activeTasks = history.filter(item => item.status === 'PROCESSING');
  const completedTasks = history.filter(item => item.status !== 'PROCESSING');

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={logoIconStyle}><FileText size={24} color="white" /></div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>Resume Classifier AI</h1>
          
          <button 
            onClick={() => setShowAbout(true)} 
            style={infoBtnStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
          >
            <Info size={20} color="#2563eb" />
          </button>
        </div>
        <div style={statusBadge}>mDeBERTa-v3</div>
      </header>
      
      <main style={{ 
        filter: (showAbout || selectedResult) ? 'blur(8px)' : 'none', 
        transition: 'filter 0.3s ease',
        pointerEvents: (showAbout || selectedResult) ? 'none' : 'auto'
      }}>
        {/* SECTION 1: UPLOAD AREA WITH GLOW & LIFT */}
        <section style={{ marginBottom: '40px' }}>
          <div 
            {...getRootProps()} 
            style={isDragActive ? activeDropzoneStyle : dropzoneStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(37, 99, 235, 0.25)';
              e.currentTarget.style.borderColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <input {...getInputProps()} />
            <div style={{ marginBottom: '20px', transition: 'transform 0.3s ease' }}>
              {loading ? (
                <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={64} color="#2563eb" />
              ) : (
                <Upload size={64} color={isDragActive ? "#2563eb" : "#94a3b8"} />
              )}
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 700 }}>Analisis Resume Baru</h3>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Hantar PDF anda ke sini untuk klasifikasi AI automatik.</p>
          </div>
        </section>

        {/* SECTION 2: TAB NAVIGATION WITH INTERACTION */}
        <div style={tabBar}>
          <button 
            onClick={() => setActiveTab('active')} 
            style={activeTab === 'active' ? activeTabBtn : inactiveTabBtn}
            onMouseEnter={(e) => {
               if (activeTab !== 'active') e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
               if (activeTab !== 'active') e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
          >
            <Activity size={18} />
            Active Processing
            {activeTasks.length > 0 && <span style={badgeCount}>{activeTasks.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            style={activeTab === 'history' ? activeTabBtn : inactiveTabBtn}
            onMouseEnter={(e) => {
                if (activeTab !== 'history') e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
                if (activeTab !== 'history') e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
          >
            <History size={18} />
            History Records
          </button>
        </div>

        {/* SECTION 3: TABLE WITH ROW HOVER & CLICK EFFECT */}
        <section>
          <div style={tableContainer}><table style={tableStyle}>
              <thead>
                <tr>
                  {/* Kita set lebar column secara spesifik kat sini */}
                  <th style={{ ...thStyle, width: '30%' }}>FILE NAME</th>
                  <th style={{ ...thStyle, width: '40%' }}>STATUS / RESULT</th>
                  <th style={{ ...thStyle, width: '15%' }}>CONFIDENCE</th>
                  <th style={{ ...thStyle, width: '15%' }}>UPLOADED AT</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'active' ? activeTasks : completedTasks).map((item) => {
                  const colors = getDynamicColor(item.predictedDepartment);
                  return (
                    <tr 
                      key={item.id} 
                      style={trStyle} 
                      onClick={() => viewDetails(item)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.transform = 'scale(1.005)';
                        e.currentTarget.style.zIndex = '10';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.zIndex = '1';
                      }}
                    >
                      {/* FILE NAME: Letak title supaya bila hover nampak nama penuh */}
                      <td style={{ ...tdStyle, fontWeight: 500 }} title={item.fileName}>
                        {item.fileName}
                      </td>

                      {/* STATUS/RESULT: Sekarang ruang lebih luas, takkan wrap ke bawah */}
                      <td style={tdStyle}>
                        {item.status === 'PROCESSING' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
                            <Loader2 style={{ animation: 'spin 1.5s linear infinite' }} size={16} />
                            <span style={{ fontWeight: 600 }}>Analyzing...</span>
                          </div>
                        ) : item.status === 'FAILED' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                            <AlertCircle size={16} />
                            <span style={{ fontWeight: 600 }}>Gagal</span>
                          </div>
                        ) : (
                          <span style={{ 
                            ...badgeStyle, 
                            //display: 'inline-block', // Pastikan badge tak pecah
                            backgroundColor: colors.bg, 
                            color: colors.main, 
                            border: `1px solid ${colors.main}33`,
                            boxShadow: `0 2px 8px ${colors.glow}`
                          }}>
                            {item.predictedDepartment}
                          </span>
                        )}
                      </td>

                      <td style={tdStyle}>
                         {item.status === 'COMPLETED' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                               <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '2px', flexShrink: 0 }}>
                                  <div style={{ width: `${item.confidenceScore * 100}%`, height: '100%', background: colors.main, borderRadius: '2px' }} />
                               </div>
                               <strong style={{ fontSize: '12px' }}>{(item.confidenceScore * 100).toFixed(1)}%</strong>
                            </div>
                         ) : '-'}
                      </td>

                      <td style={{ ...tdStyle, color: '#64748b' }}>
                        {new Date(item.uploadedAt).toLocaleString('ms-MY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
                {(activeTab === 'active' ? activeTasks : completedTasks).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>
                      <Database size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                      <p>Tiada rekod {activeTab === 'active' ? 'yang aktif' : 'dalam sejarah'}.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

            {/* MODAL ABOUT / INFO */}
      {showAbout && (
        <div style={modalOverlay} onClick={() => setShowAbout(false)}>
          <div style={aboutModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', backgroundColor: '#eff6ff', borderRadius: '14px' }}>
                   <Database color="#2563eb" size={22} />
                </div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Mengenai Sistem</h2>
              </div>
              <button onClick={() => setShowAbout(false)} style={closeBtn}><X size={20}/></button>
            </div>
            <div style={aboutTextStyle}>
              <p><strong>Resume Classifier AI</strong> adalah aplikasi pintar untuk pengisihan resume secara automatik menggunakan model <strong>NLP mDeBERTa-v3</strong>.</p>
              <p>Ia menganalisis teks dalam PDF untuk meramalkan jabatan yang paling sesuai berdasarkan kemahiran dan pengalaman calon.</p>
              <p>Sistem ini menyokong pemprosesan <em>asynchronous</em>, membolehkan anda memuat naik banyak resume serentak tanpa perlu menunggu setiap satu selesai.</p>
            </div>
            <button onClick={() => setShowAbout(false)} style={confirmBtn}>Faham & Teruskan</button>
          </div>
        </div>
      )}

      {/* MODAL WITH GLASSMORPHISM & SLIDE EFFECT */}
      {selectedResult && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '12px' }}>
                  <BarChart3 size={22} color="#2563eb" />
                </div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Result Analysis</h2>
              </div>
              <button 
                onClick={() => setSelectedResult(null)} 
                style={closeBtn}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={20}/>
              </button>
            </div>
            
            {/* TAMBAHKAN DIV WRAPPER INI UNTUK SCROLL */}
            <div style={predictionListContainer}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingRight: '8px' }}>
                {selectedResult.all_predictions.map((pred, i) => {
                  const c = getDynamicColor(pred.department);
                  return (
                    <div key={i} style={{ animation: `slideIn 0.3s ease forwards ${i * 0.1}s`, opacity: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <DeptIcon dept={pred.department} color={c.main} size={20} />
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{pred.department}</span>
                        </div>
                        <strong style={{ fontSize: '15px', color: c.main }}>{(pred.confidence * 100).toFixed(1)}%</strong>
                      </div>
                      <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                        <div style={{ 
                          width: `${pred.confidence * 100}%`, 
                          height: '100%', 
                          background: c.main,
                          boxShadow: `0 0 12px ${c.glow}`,
                          transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={() => setSelectedResult(null)} 
              style={confirmBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Faham & Tutup
            </button>
          </div>
        </div>
      )}
      
      {/* CSS For Animations */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(-10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

// --- UPDATED STYLES ---
const containerStyle: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', padding: '60px 20px', fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0f172a' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' };
const logoIconStyle: React.CSSProperties = { backgroundColor: '#2563eb', padding: '12px', borderRadius: '14px', marginRight: '16px', boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.4)' };
const statusBadge: React.CSSProperties = { backgroundColor: '#f0f9ff', color: '#0369a1', padding: '8px 18px', borderRadius: '24px', fontSize: '12px', fontWeight: 800, border: '1px solid #bae6fd' };
const infoBtnStyle: React.CSSProperties = { border: 'none', background: '#eff6ff', padding: '8px', borderRadius: '12px', marginLeft: '12px',cursor: 'pointer', transition: 'all 0.3s ease' };
const predictionListContainer: React.CSSProperties = {
  maxHeight: '350px', // Hadkan ketinggian (boleh adjust ikut suka)
  overflowY: 'auto',   // Aktifkan scroll bila content lebih had
  paddingRight: '4px', // Ruang sikit untuk scrollbar tak rapat sangat dengan content
  marginRight: '-4px', // Offset padding balik
  scrollbarWidth: 'thin', // Untuk browser macam Firefox
};

const dropzoneStyle: React.CSSProperties = { border: '2px dashed #e2e8f0', borderRadius: '28px', padding: '60px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#fff', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'};
const activeDropzoneStyle: React.CSSProperties = { ...dropzoneStyle, borderColor: '#2563eb', backgroundColor: '#eff6ff', transform: 'scale(1.02)' };

const tabBar: React.CSSProperties = { display: 'flex', gap: '12px', marginBottom: '24px', padding: '6px', background: '#f8fafc', borderRadius: '16px', width: 'fit-content' };
const baseTabBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px', transition: 'all 0.3s ease' };
const activeTabBtn: React.CSSProperties = { ...baseTabBtn, backgroundColor: '#fff', color: '#2563eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const inactiveTabBtn: React.CSSProperties = { ...baseTabBtn, backgroundColor: 'transparent', color: '#64748b' };
const badgeCount: React.CSSProperties = { backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', marginLeft: '6px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)' };

// --- UPDATED TABLE STYLES ---
const tableContainer: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse',tableLayout: 'fixed' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '20px', fontSize: '11px', color: '#64748b', backgroundColor: '#f8fafc', fontWeight: 800, letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' };
const tdStyle: React.CSSProperties = { padding: '20px', fontSize: '14px', borderBottom: '1px solid #f1f5f9',};
const trStyle: React.CSSProperties = { cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' };
const badgeStyle: React.CSSProperties = { padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, transition: 'all 0.3s ease' };

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, animation: 'fadeIn 0.3s ease' };
const modalContent: React.CSSProperties = { backgroundColor: 'white', padding: '40px', borderRadius: '32px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' };
const aboutModalContent: React.CSSProperties = { ...modalContent, width: '550px' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' };
const closeBtn: React.CSSProperties = { border: 'none', background: '#f1f5f9', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' };
const confirmBtn: React.CSSProperties = { marginTop: '40px', width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '18px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', transition: 'all 0.3s' };
const aboutTextStyle: React.CSSProperties = { fontSize: '16px', lineHeight: '1.7', color: '#475569' };

export default App;