import Editor from '@monaco-editor/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, Braces, Check, ChevronDown, CircleCheck, Clipboard, Code2, Copy, FileJson2, GitBranch, HelpCircle, Menu, Play, Search, ShieldCheck, Sparkles, Upload, X } from 'lucide-react'
import TreeGraph from './components/TreeGraph'
import { generateCode, type GenerationTarget } from './utils/generator'
import { buildTree, countNodes, parseJson, sampleJson, type JsonValue } from './utils/json'

type Page = 'app' | 'privacy' | 'terms' | 'disclaimer' | 'guide'

function getPage(): Page { const route = window.location.pathname.replace('/', ''); return ['privacy', 'terms', 'disclaimer', 'guide'].includes(route) ? route as Page : 'app' }
function navigate(path: string) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0, behavior: 'smooth' }) }

function Brand() { return <button className="brand" onClick={() => navigate('/')}><span><GitBranch size={16} /></span><b>json</b><i>tree</i><em>pro</em></button> }
function Header() { const [open, setOpen] = useState(false); return <header className="topbar"><Brand /><div className="local-badge"><ShieldCheck size={14} /> 100% pemrosesan lokal</div><nav className={open ? 'open' : ''}><button onClick={() => { setOpen(false); navigate('/guide') }}>Panduan</button><button onClick={() => { setOpen(false); navigate('/privacy') }}>Privasi</button><button onClick={() => { setOpen(false); navigate('/terms') }}>Ketentuan</button></nav><button className="menu-trigger" onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</button></header> }
function Footer() { return <footer className="footer"><div><Brand /><p>Visualisasi struktur data tanpa meninggalkan browser.</p></div><div className="footer-links"><button onClick={() => navigate('/privacy')}>Privasi</button><button onClick={() => navigate('/terms')}>Ketentuan</button><button onClick={() => navigate('/disclaimer')}>Disclaimer</button><button onClick={() => navigate('/guide')}>Panduan</button></div><p>Dikembangkan oleh <b>Virzan Pasa Nugraha</b> · © 2026</p></footer> }

function AppTool() {
  const initial = parseJson(sampleJson)
  const jsonInput = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState(sampleJson)
  const [sourceLabel, setSourceLabel] = useState('Contoh bawaan')
  const [lastValid, setLastValid] = useState<JsonValue>(initial.value ?? {})
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [target, setTarget] = useState<GenerationTarget>('typescript')
  const [copied, setCopied] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const tree = useMemo(() => buildTree(lastValid), [lastValid])
  const nodeCount = useMemo(() => countNodes(tree), [tree])
  const generated = useMemo(() => generateCode(lastValid, target), [lastValid, target])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const result = parseJson(source)
      if (result.value !== undefined) { setLastValid(result.value); setError(null) } else setError(result.error ?? 'JSON tidak valid.')
    }, 300)
    return () => window.clearTimeout(timer)
  }, [source])

  const formatJson = () => { setSource(JSON.stringify(lastValid, null, 2)); setSourceLabel('Editor manual'); setToast('JSON terakhir yang valid telah dirapikan.') }
  const loadSample = () => { setSource(sampleJson); setSourceLabel('Contoh bawaan'); setQuery(''); setToast('Contoh JSON dimuat.') }
  const importJson = async (file: File | undefined) => {
    if (!file) return
    const isJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
    if (!isJson) { setError('Pilih file dengan ekstensi .json.'); return }
    try {
      const content = await file.text()
      const result = parseJson(content)
      if (result.value === undefined) { setError(`File ${file.name} bukan JSON valid: ${result.error ?? 'format tidak dikenali.'}`); return }
      setSource(content); setLastValid(result.value); setSourceLabel(file.name); setError(null); setQuery(''); setToast(`${file.name} berhasil dimuat secara lokal.`)
    } catch { setError('File JSON tidak dapat dibaca dari perangkat ini.') }
  }
  const copy = (content: string, message: string) => { void navigator.clipboard?.writeText(content); setCopied(message); window.setTimeout(() => setCopied(null), 1800) }
  const copyPath = (path: string) => { copy(path, `Path disalin: ${path}`) }
  const targetLabels: Record<GenerationTarget, string> = { typescript: 'TypeScript Interface', dart: 'Dart Class', go: 'Go Struct', zod: 'Zod Schema' }

  return <><Header /><main className="app-shell"><section className="hero-bar"><div><span className="eyebrow"><Sparkles size={12} /> LOCAL JSON WORKBENCH</span><h1>Struktur data, <i>jadi jelas.</i></h1><p>Tempel JSON, unggah file dari perangkat, telusuri pohonnya, lalu buat tipe kode dengan cepat. Data diproses langsung di browser Anda.</p></div><div className="hero-actions"><button className="import-json" onClick={() => jsonInput.current?.click()}><Upload size={15} /> Unggah JSON</button><input ref={jsonInput} hidden type="file" accept="application/json,.json" onChange={(event) => { void importJson(event.target.files?.[0]); event.currentTarget.value = '' }} /><button onClick={loadSample}><Play size={15} /> Muat contoh</button><button onClick={formatJson}><Braces size={15} /> Rapikan JSON</button></div></section>
    {error && <div className="error-banner"><AlertTriangle size={17} /><span><b>JSON belum valid.</b> {error} Visualisasi terakhir yang valid tetap ditampilkan.</span><button onClick={() => setError(null)}><X size={16} /></button></div>}
    {toast && <div className="toast"><CircleCheck size={15} /> {toast}</div>}
    <section className="workbench"><section className="editor-pane"><div className="pane-head"><div><span>01 / INPUT</span><h2>JSON Editor</h2></div><div className={`validation ${error ? 'invalid' : 'valid'}`}>{error ? <AlertTriangle size={13} /> : <Check size={13} />}{error ? 'Menunggu perbaikan' : 'Valid'}</div></div><div className="editor-wrap"><Editor height="100%" defaultLanguage="json" theme="vs-dark" value={source} onChange={(value) => { setSource(value ?? ''); setSourceLabel('Editor manual') }} options={{ minimap: { enabled: false }, fontSize: 13, lineHeight: 21, wordWrap: 'on', padding: { top: 16 }, scrollBeyondLastLine: false, automaticLayout: true }} /></div><div className="editor-foot"><span className="file-source"><FileJson2 size={14} /> <b>{sourceLabel}</b> · {source.length.toLocaleString('id-ID')} karakter</span><span>Debounce 300ms</span></div></section>
      <section className="graph-pane"><div className="pane-head graph-head"><div><span>02 / VISUALISASI</span><h2>Tree Graph</h2></div><span className="node-count">{nodeCount.toLocaleString('id-ID')} node</span></div><div className="graph-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari key atau value..." /><kbd>⌘ K</kbd></div><div className="graph-canvas"><TreeGraph root={tree} query={query} onCopied={copyPath} /></div><div className="graph-hint"><HelpCircle size={13} /> Klik node untuk expand/collapse · klik ganda untuk salin JSON path</div></section>
      <aside className="generator-pane"><div className="pane-head"><div><span>03 / EKSPOR</span><h2>Type Generator</h2></div><Code2 size={18} /></div><label className="select-label">Bahasa target<select value={target} onChange={(event) => setTarget(event.target.value as GenerationTarget)}>{Object.entries(targetLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><ChevronDown size={14} /></label><div className="code-box"><pre>{generated}</pre></div><button className="copy-code" onClick={() => copy(generated, 'Kode berhasil disalin ke clipboard.')}><Copy size={15} /> Salin kode</button><div className="generator-note"><ShieldCheck size={15} /><p>Generator ini berjalan lokal dan mengubah nama properti menjadi format yang sesuai target.</p></div></aside></section>
    {nodeCount > 1000 && <div className="performance-note"><AlertTriangle size={16} /><span><b>Struktur besar terdeteksi.</b> Gunakan expand/collapse dan pencarian untuk menjelajahi node secara bertahap.</span></div>}
  </main><Footer />{copied && <div className="copy-toast"><Clipboard size={14} /> {copied}</div>}</>
}

function Legal({ page }: { page: Exclude<Page, 'app'> }) {
  const docs: Record<Exclude<Page, 'app'>, { tag: string; title: string; intro: string; sections: Array<[string, string]> }> = {
    privacy: { tag: 'KEBIJAKAN PRIVASI', title: 'Data JSON tidak meninggalkan perangkat Anda.', intro: 'JSONTree Pro adalah alat client-side. Konten JSON diproses oleh browser untuk validasi, visualisasi, pencarian, dan generator kode.', sections: [['Pemrosesan lokal', 'Data tidak dikirim ke backend aplikasi. Editor, graph, dan generator kode berjalan pada browser selama sesi aktif.'], ['Minimisasi data', 'Aplikasi tidak meminta akun, token API, atau identitas untuk menjalankan fitur inti. Hindari menempelkan data rahasia yang tidak diperlukan.'], ['Perubahan layanan', 'Jika di masa depan ditambahkan analitik, sinkronisasi, atau integrasi pihak ketiga, kebijakan ini perlu diperbarui sebelum fitur tersebut digunakan.']] },
    terms: { tag: 'SYARAT & KETENTUAN', title: 'Gunakan data dan hasil kode secara bertanggung jawab.', intro: 'Anda bertanggung jawab atas hak penggunaan JSON serta pemeriksaan hasil generator sebelum dipakai dalam proyek produksi.', sections: [['Hak penggunaan', 'Pastikan Anda memiliki izin untuk membuka, menyalin, atau mengolah data yang dimasukkan ke editor.'], ['Pemeriksaan hasil', 'Type generator adalah alat bantu awal. Periksa ulang tipe, optional field, format nama, dan kebutuhan domain Anda sebelum commit.'], ['Batas penggunaan', 'Aplikasi ini disediakan sebagai utilitas lokal dan tidak menjamin hasil yang sesuai dengan seluruh kebutuhan atau standar organisasi.']] },
    disclaimer: { tag: 'DISCLAIMER', title: 'Visualisasi membantu pemahaman, bukan pengganti validasi sistem.', intro: 'Hasil tree graph dan generator kode dibuat dari struktur JSON yang tersedia pada editor terakhir yang valid.', sections: [['JSON valid saja', 'Jika JSON sementara rusak saat diketik, graph terakhir yang valid dipertahankan untuk mencegah aplikasi berhenti.'], ['Kinerja perangkat', 'Kecepatan pengolahan data besar bergantung pada ukuran JSON, kemampuan browser, memori perangkat, dan jumlah tab terbuka.'], ['Keluaran kode', 'Kode yang dihasilkan perlu diuji dalam environment proyek Anda sendiri sebelum dipakai di produksi.']] },
    guide: { tag: 'PANDUAN PENGGUNAAN', title: 'Dari JSON mentah ke struktur yang terbaca.', intro: 'Gunakan desktop untuk pengalaman split-pane dan penjelajahan graph yang paling nyaman.', sections: [['1. Tempel JSON', 'Masukkan JSON ke panel kiri. Status validasi akan diperbarui setelah jeda 300ms. Jika ada kesalahan, graph valid terakhir tetap tersedia.'], ['2. Jelajahi graph', 'Gunakan pan dan zoom pada kanvas tengah. Klik container untuk expand/collapse dan klik ganda node untuk menyalin path JSON.'], ['3. Cari node', 'Masukkan key atau value pada kolom pencarian. Node yang cocok akan mendapat sorotan warna.'], ['4. Buat kode', 'Pilih TypeScript, Dart, Go, atau Zod pada panel kanan, kemudian tekan Salin kode untuk memakai hasilnya di proyek Anda.']] },
  }
  const doc = docs[page]
  return <><Header /><main className="legal-shell"><button className="back-link" onClick={() => navigate('/')}><ArrowLeft size={16} /> Kembali ke JSONTree Pro</button><span className="eyebrow">{doc.tag}</span><h1>{doc.title}</h1><p className="legal-intro">{doc.intro}</p><div className="legal-rule" />{doc.sections.map(([heading, body], index) => <section key={heading}><span>0{index + 1}</span><div><h2>{heading}</h2><p>{body}</p></div></section>)}<div className="legal-note"><ShieldCheck size={19} /><p>Dokumen ini merupakan template informatif. Lengkapi identitas dan kontak resmi, lalu lakukan peninjauan profesional sebelum aplikasi digunakan untuk kebutuhan komersial atau organisasi.</p></div></main><Footer /></>
}

export default function App() { const [page, setPage] = useState<Page>(getPage); useEffect(() => { const listener = () => setPage(getPage()); window.addEventListener('popstate', listener); return () => window.removeEventListener('popstate', listener) }, []); return page === 'app' ? <AppTool /> : <Legal page={page} /> }
