
import React, { useState, useCallback, useRef } from 'react';
import { CyberShield } from './components/CyberShield';
import { Terminal } from './components/Terminal';
import { gatherOSINT, scanVulnerabilities, exploreCountryIPs, askSecurityAssistant } from './services/geminiService';
import { LogEntry, ChatMessage } from './types';

// Declare global libraries from index.html
declare const jspdf: any;
declare const html2canvas: any;

type Page = 'SCANNER' | 'OSINT' | 'IP_EXPLORER' | 'ASSISTANT';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('SCANNER');
  const [target, setTarget] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [osintResult, setOsintResult] = useState<any | null>(null);
  const [explorerResult, setExplorerResult] = useState<any | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), message, type }]);
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    
    setIsProcessing(true);
    setLogs([]);
    setProgress(15);
    
    const pInterval = setInterval(() => {
      setProgress(p => (p < 98 ? p + Math.ceil(Math.random() * 20) : p));
    }, 800);

    try {
      if (currentPage === 'SCANNER') {
        setScanResult(null);
        addLog(`SCANNER_INIT: Starting Comprehensive Vulnerability Intelligence Scan for ${target}`, 'warning');
        addLog(`Analyzing Technical Profile & TLS Config...`, 'info');
        const data = await scanVulnerabilities(target);
        setScanResult(data);
        addLog(`SCAN_COMPLETE: Full Security & Vulnerability Report Generated.`, 'success');
      } 
      else if (currentPage === 'OSINT') {
        setOsintResult(null);
        addLog(`OSINT_INIT: Harvesting Domain Identity Data for ${target}`, 'info');
        const data = await gatherOSINT(target);
        setOsintResult(data);
        addLog(`OSINT_SUCCESS: Identity Map compiled.`, 'success');
      } 
      else if (currentPage === 'IP_EXPLORER') {
        setExplorerResult(null);
        addLog(`IP_TRACE_INIT: Mapping Full Internet IP Ranges for ${target}`, 'warning');
        const data = await exploreCountryIPs(target);
        setExplorerResult(data);
        addLog(`IP_TRACE_SUCCESS: Comprehensive Network Intelligence Report compiled.`, 'success');
      }
    } catch (err) {
      addLog(`ENGINE_FATAL: Isolated request failed at core. Check API Key or Network.`, 'error');
    } finally {
      clearInterval(pInterval);
      setProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 300);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isTyping) return;

    const query = userQuery;
    setUserQuery('');
    setChatMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsTyping(true);

    try {
      // Use current scan result or osint result as context
      const context = scanResult || osintResult || explorerResult || null;
      const response = await askSecurityAssistant(query, chatMessages, context);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response || 'No response received.' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'CORE_CHAT_ERROR: Could not establish secure AI connection.' }]);
    } finally {
      setIsTyping(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    addLog("Rendering Document Fragments...", "info");

    try {
      const element = reportRef.current;
      element.style.position = 'static';
      element.style.left = '0';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#000000',
        logging: false,
      });

      element.style.position = 'absolute';
      element.style.left = '-9999px';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`C-FORCE_REPORT_${target.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      
      addLog("PDF Document Exported Successfully.", "success");
    } catch (err) {
      addLog("Export Error: Critical Failure during rendering.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to safely render strings or extract text from objects
  const renderSafe = (val: any): string => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'object') {
      if (Array.isArray(val)) return val.map(v => renderSafe(v)).join(', ');
      return val.organization || val.org || val.name || val.label || val.value || JSON.stringify(val);
    }
    return String(val);
  };

  return (
    <div className="min-h-screen flex bg-black text-zinc-300 font-rajdhani selection:bg-red-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col py-8 z-30 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="px-6 mb-12 flex flex-col items-center md:items-start">
          <CyberShield size="w-12 h-12" animate={isProcessing} />
          <div className="hidden md:block mt-6">
            <h1 className="text-2xl font-black font-orbitron neon-red tracking-tighter leading-none">C-FORCE AI</h1>
            <p className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.3em] mt-2">Cyber Intel Core</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-4 px-3">
          {[
            { id: 'SCANNER', label: 'Vuln Scan', color: 'red', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { id: 'OSINT', label: 'OSINT Unit', color: 'cyan', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7' },
            { id: 'IP_EXPLORER', label: 'IP Trace', color: 'orange', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'ASSISTANT', label: 'AI Analyst', color: 'emerald', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setCurrentPage(item.id as Page)} 
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group border ${currentPage === item.id ? `bg-${item.color}-950/10 border-${item.color}-900/50 text-${item.color}-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]` : 'bg-transparent border-transparent text-zinc-600 hover:bg-zinc-900'}`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
              <span className="hidden md:block font-orbitron text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {isProcessing && (
          <div className="absolute top-0 left-0 h-[3px] w-full z-50 overflow-hidden bg-zinc-950">
             <div className="h-full bg-red-600 shadow-[0_0_15px_#f00] transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        <header className="h-20 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-10 z-20">
          <div className="flex items-center gap-4">
             <div className={`w-3 h-3 rounded-full animate-pulse ${currentPage === 'SCANNER' ? 'bg-red-600' : (currentPage === 'OSINT' ? 'bg-cyan-500' : (currentPage === 'IP_EXPLORER' ? 'bg-orange-500' : 'bg-emerald-500'))}`}></div>
             <h2 className="font-orbitron text-[11px] font-black tracking-[0.5em] uppercase text-zinc-500">
                AI_TERMINAL::{currentPage}
             </h2>
          </div>
          {currentPage !== 'ASSISTANT' && (
            <form onSubmit={handleAction} className="flex gap-3">
              <input 
                type="text" 
                placeholder={currentPage === 'IP_EXPLORER' ? "Enter Country (e.g., Palestine)..." : "Enter Target (IP or Domain)..."}
                value={target} 
                onChange={(e) => setTarget(e.target.value)}
                className={`bg-black/60 border border-zinc-800 rounded-lg px-5 py-2.5 text-xs font-mono w-80 md:w-[450px] outline-none transition-all focus:border-${currentPage === 'SCANNER' ? 'red' : (currentPage === 'OSINT' ? 'cyan' : 'orange')}-600`}
              />
              <button type="submit" disabled={isProcessing} className={`px-8 py-2.5 rounded-lg font-orbitron text-[11px] font-black uppercase shadow-xl transition-all hover:brightness-125 ${currentPage === 'SCANNER' ? 'bg-red-600' : (currentPage === 'OSINT' ? 'bg-cyan-600' : 'bg-orange-600')}`}>
                {isProcessing ? 'SCANNING...' : 'EXECUTE'}
              </button>
            </form>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-10 cyber-grid scroll-hide relative">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-10 h-full">
            
            <div className="lg:col-span-1 flex flex-col space-y-8">
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                <h3 className={`text-[11px] font-orbitron mb-8 uppercase tracking-[0.3em] flex items-center gap-2 ${currentPage === 'SCANNER' ? 'text-red-500' : (currentPage === 'OSINT' ? 'text-cyan-500' : (currentPage === 'IP_EXPLORER' ? 'text-orange-500' : 'text-emerald-500'))}`}>
                   <div className={`w-1 h-3 ${currentPage === 'SCANNER' ? 'bg-red-500' : (currentPage === 'OSINT' ? 'bg-cyan-500' : (currentPage === 'IP_EXPLORER' ? 'bg-orange-500' : 'bg-emerald-500'))}`}></div> Unit Status
                </h3>
                <div className="space-y-6">
                   <div>
                      <p className="text-[9px] text-zinc-600 uppercase mb-2 font-black tracking-widest">Active Vector</p>
                      <p className="text-sm font-mono text-white break-all bg-black/60 p-4 rounded-xl border border-zinc-800/50">{target || 'NULL'}</p>
                   </div>
                   {((currentPage === 'SCANNER' && scanResult) || (currentPage === 'OSINT' && osintResult) || (currentPage === 'IP_EXPLORER' && explorerResult)) && (
                     <button 
                        onClick={exportPDF} 
                        disabled={isExporting}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-orbitron text-[10px] font-black uppercase py-4 rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-3"
                     >
                       {isExporting ? 'EXPORTING...' : 'DOWNLOAD AUDIT PDF'}
                     </button>
                   )}
                </div>
              </div>
              <Terminal logs={logs} />
            </div>

            <div className="lg:col-span-3 h-full flex flex-col">
              
              {/* ASSISTANT VIEW */}
              {currentPage === 'ASSISTANT' && (
                <div className="flex-1 flex flex-col bg-zinc-950/80 border border-zinc-900 rounded-[30px] shadow-2xl overflow-hidden animate-[fadeIn_0.5s]">
                  <div className="p-6 border-b border-zinc-900 bg-zinc-900/30 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-orbitron font-black text-emerald-500 uppercase tracking-tight">AI Security Analyst</h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Expert Guidance Core</p>
                    </div>
                    <div className="text-right">
                       <span className="px-3 py-1 bg-emerald-950 text-emerald-500 text-[9px] font-black rounded-full border border-emerald-900">ENCRYPTED_COMMS</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/40">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-12">
                         <CyberShield size="w-24 h-24" dark />
                         <h4 className="mt-8 text-xl font-orbitron font-bold text-emerald-500 uppercase tracking-[0.3em]">Neural Interface Ready</h4>
                         <p className="mt-4 text-xs font-mono text-zinc-400 max-w-sm">
                           Ask me about the results of your recent scan, specific CVEs, or general security best practices.
                         </p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-2xl font-mono text-xs leading-relaxed border ${
                          msg.role === 'user' 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tr-none' 
                          : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400 rounded-tl-none shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-2xl rounded-tl-none flex gap-2">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.1s]"></div>
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleChat} className="p-6 bg-zinc-900/30 border-t border-zinc-900 flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Ask the analyst..." 
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="flex-1 bg-black border border-zinc-800 rounded-xl px-5 py-4 text-xs font-mono outline-none focus:border-emerald-600 transition-all text-emerald-100"
                    />
                    <button type="submit" disabled={isTyping || !userQuery.trim()} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-orbitron text-[10px] font-black px-8 rounded-xl transition-all shadow-xl uppercase">
                      SEND
                    </button>
                  </form>
                </div>
              )}

              {/* COMPREHENSIVE SCANNER VIEW */}
              {currentPage === 'SCANNER' && scanResult && (
                <div className="space-y-8 animate-[fadeIn_0.5s]">
                   <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[30px] border-b-4 border-red-600 shadow-2xl relative overflow-hidden">
                      <div className="flex justify-between items-center relative z-10">
                         <div className="flex-1 pr-10">
                            <h3 className="text-4xl font-orbitron text-white font-black uppercase tracking-tighter">
                               VULN REPORT <span className="text-red-600">/</span> {renderSafe(scanResult.target)}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                               <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">STATUS:</p>
                               <span className={`px-3 py-0.5 rounded text-[10px] font-black uppercase border ${String(scanResult.status || '').includes('CRITICAL') || String(scanResult.status || '').includes('HIGH') ? 'bg-red-950 text-red-500 border-red-900' : 'bg-emerald-950 text-emerald-500 border-emerald-900'}`}>
                                  {renderSafe(scanResult.status)}
                               </span>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] text-zinc-600 uppercase font-black">NODE_IP</p>
                            <p className="text-xl font-mono font-black text-red-500">{renderSafe(scanResult.serverIp)}</p>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-[30px]">
                         <h4 className="text-[11px] font-black text-red-500 uppercase mb-6 tracking-widest">Technical Infrastructure</h4>
                         <div className="space-y-3">
                            <div className="flex justify-between font-mono text-sm"><span className="text-zinc-600">Hosting:</span> <span className="text-white">{renderSafe(scanResult.technicalProfile?.hosting)}</span></div>
                            <div className="flex justify-between font-mono text-sm"><span className="text-zinc-600">ISP:</span> <span className="text-white">{renderSafe(scanResult.technicalProfile?.isp)}</span></div>
                            <div className="flex justify-between font-mono text-sm"><span className="text-zinc-600">ASN:</span> <span className="text-white">{renderSafe(scanResult.technicalProfile?.asn)}</span></div>
                            <div className="flex justify-between font-mono text-sm"><span className="text-zinc-600">Server:</span> <span className="text-white">{renderSafe(scanResult.technicalProfile?.server)}</span></div>
                            <div className="flex justify-between font-mono text-sm"><span className="text-zinc-600">WAF/CDN:</span> <span className="text-emerald-500">{renderSafe(scanResult.technicalProfile?.waf)}</span></div>
                         </div>
                      </div>
                      <div className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-[30px]">
                         <h4 className="text-[11px] font-black text-red-500 uppercase mb-6 tracking-widest">Detected Stack</h4>
                         <div className="flex flex-wrap gap-2">
                            {Array.isArray(scanResult.technicalProfile?.techStack) ? scanResult.technicalProfile.techStack.map((tech: any, i: number) => (
                              <span key={i} className="px-3 py-1 bg-black/40 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400">{renderSafe(tech)}</span>
                            )) : <span className="text-zinc-600 italic">None detected</span>}
                         </div>
                         <div className="mt-6">
                            <p className="text-[10px] text-zinc-600 uppercase font-black mb-2">TLS Config</p>
                            <p className="text-xs text-zinc-400 font-mono italic">{renderSafe(scanResult.technicalProfile?.tlsConfig)}</p>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-6">
                      <h4 className="text-[11px] font-black text-zinc-500 uppercase px-4 tracking-widest flex items-center gap-3">
                         <div className="w-1 h-3 bg-red-600"></div> Intelligence Enumeration
                      </h4>
                      {Array.isArray(scanResult.vulnerabilities) && scanResult.vulnerabilities.map((v: any, i: number) => (
                        <div key={i} className="bg-zinc-900/10 border border-zinc-800/40 p-8 rounded-[30px] border-l-4 border-red-600 hover:bg-zinc-900/30 transition-all group">
                           <div className="flex justify-between items-start mb-6">
                              <div className="flex gap-3 items-center">
                                 <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase border ${String(v.severity || '').toUpperCase() === 'CRITICAL' ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.4)]' : (String(v.severity || '').toUpperCase() === 'HIGH' ? 'bg-red-950 text-red-500 border-red-900' : 'bg-zinc-950 text-zinc-500 border-zinc-800')}`}>{renderSafe(v.severity)}</span>
                                 <span className="bg-zinc-950 text-zinc-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase border border-zinc-900">{renderSafe(v.type)}</span>
                                 {v.cvss && <span className="text-[10px] font-mono text-zinc-600">CVSS: {renderSafe(v.cvss)}</span>}
                              </div>
                              <span className="text-xs text-zinc-600 font-mono">{renderSafe(v.id)}</span>
                           </div>
                           <h4 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-red-500 transition-colors">{renderSafe(v.title)}</h4>
                           <p className="text-zinc-500 text-[10px] font-mono mb-2 uppercase tracking-widest">Component: {renderSafe(v.affectedComponent)}</p>
                           <p className="text-zinc-400 text-sm mb-8 italic">{renderSafe(v.description)}</p>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-red-950/10 p-5 rounded-xl border border-red-900/20">
                                 <p className="text-[9px] text-red-500 font-black uppercase mb-2">Exploit Potential</p>
                                 <p className="text-xs text-zinc-400 font-medium leading-relaxed">{renderSafe(v.exploitInfo)}</p>
                              </div>
                              <div className="bg-emerald-950/10 p-5 rounded-xl border border-emerald-900/20">
                                 <p className="text-[9px] text-emerald-500 font-black uppercase mb-2">Remediation Steps</p>
                                 <p className="text-xs text-zinc-400 font-medium leading-relaxed">{renderSafe(v.remediation)}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {/* COMPREHENSIVE OSINT VIEW */}
              {currentPage === 'OSINT' && osintResult && (
                <div className="space-y-8 animate-[fadeIn_0.5s]">
                   <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[30px] border-b-4 border-cyan-500 shadow-2xl">
                      <div className="flex justify-between items-center">
                         <div>
                            <h3 className="text-4xl font-orbitron text-white font-black uppercase tracking-tighter">
                               OSINT REPORT <span className="text-cyan-500">/</span> {renderSafe(osintResult.target || osintResult.domainProfile?.domain)}
                            </h3>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] text-zinc-600 uppercase font-black">REGISTRAR</p>
                            <p className="text-xl font-mono font-black text-cyan-500">{renderSafe(osintResult.domainProfile?.registrar)}</p>
                         </div>
                      </div>
                   </div>

                   <div className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-[30px]">
                      <h4 className="text-[11px] font-black text-cyan-500 uppercase mb-4 tracking-widest">Executive Intelligence Summary</h4>
                      <p className="text-zinc-400 text-lg leading-relaxed Rajdhani font-medium italic">
                        "{renderSafe(osintResult.executiveSummary)}"
                      </p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-[30px]">
                         <h4 className="text-[11px] font-black text-cyan-500 uppercase mb-6 tracking-widest">Domain & Ownership</h4>
                         <div className="space-y-3">
                            <div className="flex justify-between font-mono text-sm"><span className="text-zinc-600">Created:</span> <span className="text-white">{renderSafe(osintResult.domainProfile?.creationDate)}</span></div>
                            <div className="flex justify-between font-mono text-sm"><span className="text-zinc-600">Owner:</span> <span className="text-white">{renderSafe(osintResult.domainProfile?.ownership)}</span></div>
                         </div>
                      </div>
                      <div className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-[30px]">
                         <h4 className="text-[11px] font-black text-cyan-500 uppercase mb-6 tracking-widest">Infrastructure Profile</h4>
                         <div className="space-y-3">
                            <div className="flex justify-between font-mono text-sm"><span className="text-zinc-600">IPs:</span> <span className="text-white">{renderSafe(osintResult.infrastructureProfile?.ipAddresses)}</span></div>
                            <div className="flex justify-between font-mono text-sm"><span className="text-zinc-600">Hosting:</span> <span className="text-white">{renderSafe(osintResult.infrastructureProfile?.hosting)}</span></div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* COMPREHENSIVE IP TRACE VIEW */}
              {currentPage === 'IP_EXPLORER' && explorerResult && (
                <div className="space-y-8 animate-[fadeIn_0.5s]">
                   <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[30px] border-b-4 border-orange-500 shadow-2xl relative overflow-hidden">
                      <div className="flex justify-between items-center relative z-10">
                         <div className="flex-1 pr-10">
                            <h3 className="text-4xl font-orbitron text-white font-black uppercase tracking-tighter">
                               COUNTRY NET MAP <span className="text-orange-500">/</span> {renderSafe(explorerResult.target)}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                               <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Connectivity Score:</p>
                               <span className="px-3 py-0.5 rounded text-[10px] font-black uppercase border bg-orange-950 text-orange-500 border-orange-900">
                                  {renderSafe(explorerResult.networkOverview?.connectivityScore)}
                               </span>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] text-zinc-600 uppercase font-black">RANGES_FOUND</p>
                            <p className="text-xl font-mono font-black text-orange-500">{renderSafe(explorerResult.networkOverview?.ipAllocationsCount)}</p>
                         </div>
                      </div>
                   </div>

                   {/* FULL INTERNET IP RANGES SECTION */}
                   <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[30px]">
                      <h4 className="text-[11px] font-black text-orange-500 uppercase mb-6 tracking-[0.2em] flex items-center gap-3">
                         <div className="w-2 h-2 bg-orange-500 animate-pulse"></div> PUBLIC INTERNET IP RANGES (ALL ALLOCATIONS)
                      </h4>
                      <div className="bg-black/80 rounded-2xl p-6 border border-zinc-800 shadow-inner max-h-[400px] overflow-y-auto scroll-hide custom-scrollbar">
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {Array.isArray(explorerResult.allCountryIpRanges) ? explorerResult.allCountryIpRanges.map((range: any, i: number) => (
                              <div key={i} className="bg-zinc-950 border border-zinc-900/50 p-3 rounded-lg flex items-center justify-center hover:border-orange-900 transition-colors group">
                                 <code className="text-[10px] md:text-xs font-mono text-zinc-400 group-hover:text-orange-500">{renderSafe(range)}</code>
                              </div>
                            )) : <p className="text-zinc-700 italic col-span-full">Processing allocations...</p>}
                         </div>
                         {explorerResult.allCountryIpRanges?.length === 0 && <p className="text-zinc-700 italic text-center py-10">No public CIDR ranges identified.</p>}
                      </div>
                      <div className="mt-4 flex justify-between items-center px-4">
                         <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Source: Public Internet Registries (RIR/LIR)</p>
                         <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Est. Total IPs: {renderSafe(explorerResult.networkOverview?.totalIpCount)}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-[30px]">
                         <h4 className="text-[11px] font-black text-orange-500 uppercase mb-6 tracking-widest">Major Providers</h4>
                         <div className="space-y-3">
                            {Array.isArray(explorerResult.ispProfile) ? explorerResult.ispProfile.map((isp: any, i: number) => (
                              <div key={i} className="p-3 bg-black/40 border border-zinc-800 rounded-xl">
                                 <p className="text-xs font-black text-white">{renderSafe(isp.name)}</p>
                                 <p className="text-[9px] text-zinc-500 uppercase mt-1">{renderSafe(isp.marketShare)}</p>
                              </div>
                            )) : null}
                         </div>
                      </div>
                      <div className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-[30px]">
                         <h4 className="text-[11px] font-black text-orange-500 uppercase mb-6 tracking-widest">ASN Architecture</h4>
                         <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2">
                            {Array.isArray(explorerResult.asnMapping) ? explorerResult.asnMapping.map((asn: any, i: number) => (
                              <div key={i} className="bg-black/40 border border-zinc-800/60 p-3 rounded-xl hover:border-orange-600/30 transition-all">
                                 <p className="text-sm font-mono font-black text-white">{renderSafe(asn.asn)}</p>
                                 <p className="text-[9px] text-zinc-600 uppercase mt-1 truncate">{renderSafe(asn.organization)}</p>
                              </div>
                            )) : null}
                         </div>
                      </div>
                   </div>

                   <div className="p-8 border-t border-zinc-900 mt-10 opacity-40">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-center leading-loose">
                        {renderSafe(explorerResult.disclaimer)}
                      </p>
                   </div>
                </div>
              )}

              {!scanResult && !osintResult && !explorerResult && currentPage !== 'ASSISTANT' && (
                <div className="h-[70vh] flex flex-col items-center justify-center text-center opacity-30">
                   <CyberShield size="w-32 h-32" dark />
                   <h3 className="text-4xl font-orbitron font-black uppercase tracking-[0.5em] mt-8 text-zinc-700">Awaiting Signal</h3>
                   <p className="mt-4 text-xs font-mono uppercase tracking-widest text-zinc-800">C-FORCE AI Active Modules Initialized...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PDF TEMPLATE */}
        <div ref={reportRef} className="p-16 bg-black text-white font-rajdhani" style={{ position: 'absolute', left: '-9999px', width: '1000px' }}>
          <div className={`border-b-8 ${currentPage === 'SCANNER' ? 'border-red-600' : (currentPage === 'OSINT' ? 'border-cyan-600' : 'border-orange-600')} pb-10 mb-10`}>
            <h1 className="text-7xl font-black font-orbitron mb-2 tracking-tighter">C-FORCE AI</h1>
            <p className="text-2xl font-black uppercase tracking-[0.5em] text-zinc-500">Official Infrastructure Audit :: {currentPage}</p>
            <div className="mt-10 text-right">
               <p className="text-xs font-black text-zinc-600 uppercase">Target Identity</p>
               <p className="text-4xl font-mono font-black">{target}</p>
            </div>
          </div>
          
          {currentPage === 'SCANNER' && scanResult && (
            <div className="space-y-10">
               <div className="bg-zinc-900 p-8 rounded-3xl">
                  <h2 className="text-3xl font-black text-red-600 mb-4 uppercase">Risk Assessment: {renderSafe(scanResult.status)}</h2>
                  <p className="text-xl text-zinc-400 italic mb-6">"{renderSafe(scanResult.exposureSummary)}"</p>
               </div>
               {Array.isArray(scanResult.vulnerabilities) && scanResult.vulnerabilities.map((v: any, i: number) => (
                 <div key={i} className="mb-10 bg-zinc-900/50 p-10 rounded-3xl border border-zinc-800">
                    <h2 className="text-4xl font-black mb-4 text-red-500">{renderSafe(v.title)} ({renderSafe(v.severity)})</h2>
                    <p className="text-xl text-zinc-400 italic mb-8">{renderSafe(v.description)}</p>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="p-6 bg-black rounded-2xl border border-zinc-800">
                          <p className="text-sm font-black text-red-600 uppercase mb-2">Technical Finding</p>
                          <p className="text-lg">{renderSafe(v.exploitInfo)}</p>
                       </div>
                       <div className="p-6 bg-black rounded-2xl border border-zinc-800">
                          <p className="text-sm font-black text-emerald-600 uppercase mb-2">Remediation</p>
                          <p className="text-lg">{renderSafe(v.remediation)}</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {currentPage === 'OSINT' && osintResult && (
            <div className="space-y-10">
               <div className="bg-zinc-900 p-8 rounded-3xl">
                  <h2 className="text-3xl font-black text-cyan-600 mb-4 uppercase">OSINT Executive Intelligence Summary</h2>
                  <p className="text-xl text-zinc-400 italic mb-6">"{renderSafe(osintResult.executiveSummary)}"</p>
               </div>
               <div className="bg-zinc-900/50 p-10 rounded-3xl border border-zinc-800">
                  <h2 className="text-2xl font-black text-cyan-500 mb-6 uppercase">Infrastructure & Historical Intelligence</h2>
                  <div className="p-6 bg-black rounded-2xl border border-zinc-800">
                     <p className="text-lg font-mono">IPs: {renderSafe(osintResult.infrastructureProfile?.ipAddresses)}</p>
                     <p className="text-lg italic">{renderSafe(osintResult.historicalIntelligence)}</p>
                  </div>
               </div>
            </div>
          )}

          {currentPage === 'IP_EXPLORER' && explorerResult && (
            <div className="space-y-10">
               <div className="bg-zinc-900 p-8 rounded-3xl">
                  <h2 className="text-3xl font-black text-orange-600 mb-4 uppercase">Network Intelligence Executive Summary</h2>
                  <p className="text-xl text-zinc-400 italic mb-6">"{renderSafe(explorerResult.executiveSummary)}"</p>
               </div>
               <div className="bg-zinc-900/50 p-10 rounded-3xl border border-zinc-800">
                  <h2 className="text-2xl font-black text-orange-500 mb-6 uppercase">Country Infrastructure Overview</h2>
                  <div className="p-6 bg-black rounded-2xl border border-zinc-800">
                     <p className="text-lg font-mono">Total IP Ranges (CIDR): {renderSafe(explorerResult.networkOverview?.ipAllocationsCount)}</p>
                     <p className="text-lg font-mono">Total Est. IPs: {renderSafe(explorerResult.networkOverview?.totalIpCount)}</p>
                  </div>
                  <div className="mt-8">
                     <h3 className="text-xl font-black uppercase text-zinc-400 mb-4">Allocated CIDR Blocks</h3>
                     <p className="text-xs font-mono leading-relaxed text-zinc-500">{renderSafe(explorerResult.allCountryIpRanges)}</p>
                  </div>
               </div>
            </div>
          )}

          <footer className="mt-20 border-t border-zinc-800 pt-10 text-center text-zinc-600 font-mono text-xs uppercase">
             Generated by C-Force AI Turbo Core v4.0 // Timestamp: {new Date().toLocaleString()}
          </footer>
        </div>

        <footer className="h-14 bg-zinc-950 border-t border-zinc-900 px-12 flex items-center justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-[0.5em] z-30">
           <div className="flex gap-16">
              <span className="flex items-center gap-3"><div className={`w-2 h-2 ${currentPage === 'SCANNER' ? 'bg-red-600 shadow-[0_0_10px_#f00]' : (currentPage === 'OSINT' ? 'bg-cyan-500' : (currentPage === 'IP_EXPLORER' ? 'bg-orange-500' : 'bg-emerald-500'))}`}></div> CORE_MODE: {currentPage}</span>
              <span className="flex items-center gap-3 text-zinc-800"><div className="w-2 h-2 bg-zinc-800 animate-pulse"></div> SECURE_LINK_ESTABLISHED</span>
           </div>
           <span className="text-zinc-800 font-black">C-FORCE_AI // TURBO_V4.0</span>
        </footer>
      </main>
    </div>
  );
};

export default App;
