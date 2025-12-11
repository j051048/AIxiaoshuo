import React, { useState, useEffect, useRef } from 'react';
import { CreatorStep, Message, Language, NovelSettings } from './types';
import { sendMessageToGemini, updateConfig, testApiConnection } from './services/geminiService';
import StepIndicator from './components/StepIndicator';
import ChatBubble from './components/ChatBubble';
import { INITIAL_GREETING_EN, INITIAL_GREETING_ZH, UI_TEXT } from './constants';
import { nanoid } from 'nanoid';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<CreatorStep>(CreatorStep.Configuration);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<string>(''); // For the UI bubble
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Settings & Lang States
  const [language, setLanguage] = useState<Language>('zh'); 
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://vip.apiyi.com/');

  // Novel Settings State (Customizable Params)
  const [novelSettings, setNovelSettings] = useState<NovelSettings>({
    targetAudience: '22-35岁女性',
    totalWordCount: '50万',
    chapterWordCount: '2300'
  });

  // Edit Value Modal State
  const [editValueModal, setEditValueModal] = useState<{
    isOpen: boolean;
    key: keyof NovelSettings | null;
    value: string;
  }>({ isOpen: false, key: null, value: '' });

  // Test Connection States
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = UI_TEXT[language];

  // Initialize Chat
  useEffect(() => {
    // Update default settings based on language if initial load
    if (language === 'en') {
        setNovelSettings({
            targetAudience: '22-35F',
            totalWordCount: '500k',
            chapterWordCount: '2300'
        });
    }

    const initialMsg: Message = {
      id: nanoid(),
      role: 'model',
      content: language === 'en' ? INITIAL_GREETING_EN : INITIAL_GREETING_ZH,
      timestamp: Date.now(),
      step: CreatorStep.Configuration
    };
    setMessages([initialMsg]);
    
    // Initialize with default if provided
    updateConfig('', 'https://vip.apiyi.com/');
  }, []); // Run once on mount

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;

    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: nanoid(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      step: currentStep
    };

    setMessages(prev => [...prev, userMsg]);
    
    // Only clear input if we sent the input text (not an override)
    if (!overrideText) {
      setInput('');
    }
    
    setIsLoading(true);

    // Determine expected model for UI immediately
    const expectedModel = currentStep >= 8 ? 'DeepSeek-V3.2-Exp-thinking' : 'deepseek-r1-0528';
    setActiveModel(expectedModel);

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      // Inject current settings into system context so the AI respects them
      const settingsContext = `
      [System Config: 
       Target Audience: ${novelSettings.targetAudience}, 
       Total Words: ${novelSettings.totalWordCount}, 
       Chapter Words: ${novelSettings.chapterWordCount}
      ]`;
      
      const systemContextLang = language === 'zh' 
        ? `\n\n[System: 当前阶段 ${currentStep}。请注意：必须严格全中文回复，禁止包含英文（除非是必要的代码或不可翻译的术语）。${settingsContext}]`
        : `\n\n[System: Current Step ${currentStep}. ${settingsContext}]`;
      
      const promptWithContext = `${textToSend} ${systemContextLang}`;
      
      // Pass step to service to select correct model
      // Note: The service uses gemini-2.5-flash by default. 
      // sendMessageToGemini returns a string directly.
      const responseText = await sendMessageToGemini(promptWithContext);
      
      const aiMsg: Message = {
        id: nanoid(),
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
        step: currentStep
      };

      setMessages(prev => [...prev, aiMsg]);
      
      const match = responseText.match(/Step\s+(\d+)/i);
      if (match && match[1]) {
        const detectedStep = parseInt(match[1], 10);
        if (detectedStep >= 1 && detectedStep <= 9 && detectedStep !== currentStep) {
           setCurrentStep(detectedStep as CreatorStep);
        }
      }

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: nanoid(),
        role: 'system',
        content: language === 'zh' ? "抱歉，遇到网络错误，请重试。" : "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setActiveModel('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExport = () => {
    const text = messages.map(m => `[${m.role.toUpperCase()}] (${new Date(m.timestamp).toLocaleString()}):\n${m.content}\n\n`).join('---');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Novel_History_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTestConnection = async () => {
    if (!apiKey) return;
    setIsTesting(true);
    setTestStatus('idle');
    const success = await testApiConnection(apiKey, baseUrl);
    setIsTesting(false);
    setTestStatus(success ? 'success' : 'failed');
    if (success) setTimeout(() => setTestStatus('idle'), 3000);
  };

  const handleSaveSettings = () => {
    updateConfig(apiKey, baseUrl);
    setShowSettings(false);
    setMessages(prev => [...prev, {
      id: nanoid(),
      role: 'system',
      content: language === 'zh' ? "配置已更新。" : "Configuration updated.",
      timestamp: Date.now()
    }]);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  // --- Novel Settings Edit Logic ---

  const openEditModal = (key: keyof NovelSettings) => {
    setEditValueModal({
      isOpen: true,
      key,
      value: novelSettings[key]
    });
  };

  const handleSaveValue = () => {
    if (editValueModal.key) {
      setNovelSettings(prev => ({
        ...prev,
        [editValueModal.key!]: editValueModal.value
      }));
      setEditValueModal({ isOpen: false, key: null, value: '' });

      const keyLabel = t[editValueModal.key]; 
      const msg = language === 'zh' 
        ? `[系统更新] ${keyLabel} 已修改为: ${editValueModal.value}`
        : `[System Update] ${keyLabel} changed to: ${editValueModal.value}`;
      
      setMessages(prev => [...prev, {
        id: nanoid(),
        role: 'system',
        content: msg,
        timestamp: Date.now()
      }]);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc] font-sans text-slate-800">
      
      <StepIndicator 
        currentStep={currentStep} 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        setStep={(s) => setCurrentStep(s)}
        language={language}
        settings={novelSettings}
        onEditSetting={openEditModal}
      />

      <div className="flex-1 flex flex-col h-full relative">
        {/* Header - Glassmorphism */}
        <header className="h-16 absolute top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm flex items-center justify-between px-4 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
               <div className="flex flex-col">
                 <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent tracking-tight">AI Novelist</h1>
                 <div className="flex items-center gap-2 lg:hidden">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {t.step} {currentStep}
                    </span>
                 </div>
               </div>
               
               {/* Thinking Bubble */}
               {isLoading && activeModel && (
                 <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                   <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                   <span className="font-semibold tracking-wide">
                     {language === 'zh' 
                       ? `正在调用 ${activeModel} 进行思考...` 
                       : `Calling ${activeModel} for thinking...`
                     }
                   </span>
                 </div>
               )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
               onClick={toggleLanguage}
               className="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-600 hover:text-primary hover:bg-slate-100 rounded-full transition-all"
               title="Switch Language"
            >
               {t.toggleLang}
            </button>

            <button
               onClick={() => setShowSettings(true)}
               className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-100 rounded-full transition-all relative z-40"
               title={t.settings}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button 
              onClick={handleExport}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-primary transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>{t.export}</span>
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto pt-20 pb-4 px-4 md:px-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            
            {/* Mobile Thinking Indicator (shown in chat area instead of header for better visibility on small screens) */}
            {isLoading && activeModel && (
              <div className="md:hidden flex justify-center mb-4">
                 <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] px-3 py-1.5 rounded-full shadow-sm">
                   <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                   <span>{activeModel}</span>
                 </div>
              </div>
            )}
            
            {isLoading && (
               <div className="flex justify-start w-full">
                 <div className="bg-white border border-slate-100 rounded-3xl rounded-tl-sm p-5 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area - Redesigned with Flex for Continue Button */}
        <footer className="shrink-0 p-4 md:p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-20">
          <div className="max-w-3xl mx-auto flex items-end gap-3">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                className="w-full relative bg-white border border-slate-200 rounded-3xl pl-6 pr-14 py-5 text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none shadow-lg shadow-slate-200/50 min-h-[80px] transition-all"
                rows={1}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                className={`
                  absolute right-3 bottom-3 p-3 rounded-2xl transition-all duration-300 shadow-sm
                  ${input.trim() 
                    ? 'bg-primary text-white hover:bg-indigo-600 hover:scale-105 hover:shadow-primary/30' 
                    : 'bg-slate-100 text-slate-300'
                  }
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>

            {/* Continue / Start Button */}
            <button
              onClick={() => handleSendMessage(language === 'zh' ? "开始" : "Start")}
              disabled={isLoading}
              className={`
                flex flex-col items-center justify-center gap-1 w-16 md:w-20 py-4 md:py-3 rounded-2xl border transition-all shadow-sm
                ${isLoading 
                  ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 hover:shadow-md'
                }
              `}
              title={t.continue}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-bold leading-none hidden md:block">{t.continue}</span>
            </button>
          </div>
          <div className="text-center mt-3 flex justify-center items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
               {t.deepSeekMode} • {t.step} {currentStep} / 9
            </p>
          </div>
        </footer>
      </div>

      {/* Settings Modal - API Config - Increased Z-Index */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 md:p-8 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-slate-800">{t.settings}</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.apiKey}</label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.baseUrl}</label>
                <input 
                  type="text" 
                  value={baseUrl} 
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://generativelanguage.googleapis.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Test Connection Section */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500 font-medium px-2">
                  {testStatus === 'success' && <span className="text-green-600 flex items-center gap-1">✓ {t.testSuccess}</span>}
                  {testStatus === 'failed' && <span className="text-red-500 flex items-center gap-1">✕ {t.testFailed}</span>}
                  {testStatus === 'idle' && !isTesting && <span>Check Connectivity</span>}
                  {isTesting && <span>{t.testing}</span>}
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || !apiKey}
                  className="text-xs font-bold text-primary hover:bg-white border border-transparent hover:border-slate-200 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  {t.testConn}
                </button>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSaveSettings}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-indigo-600 shadow-lg shadow-indigo-200 transition-all hover:translate-y-[-1px]"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Value Modal - Single Value */}
      {editValueModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 md:p-8 transform transition-all scale-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {t.editTitle}: {editValueModal.key && t[editValueModal.key]}
            </h3>
            
            <div className="mb-6">
               <input 
                  type="text" 
                  value={editValueModal.value}
                  onChange={(e) => setEditValueModal(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  autoFocus
               />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setEditValueModal({ isOpen: false, key: null, value: '' })}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSaveValue}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-indigo-600 shadow-md transition-all"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;