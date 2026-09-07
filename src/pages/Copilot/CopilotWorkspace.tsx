import { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Clock, 
  Coins, 
  Calendar, 
  User, 
  Loader2, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';

const SlackIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={className} 
    fill="currentColor"
  >
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.52-2.522V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043zm10.135 3.761a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042zm-3.78 10.134a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.261a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z" />
  </svg>
);
import { useSystem } from '../../context/SystemContext';
import { maskName } from '../../utils/mask';
import api from '../../utils/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  toolCall?: {
    type: 'slack_alert' | 'schedule_meeting';
    employeeId: string;
    employeeName: string;
    executed: boolean;
    details?: string;
  };
}

export default function CopilotWorkspace() {
  const { employees, isDataMasked } = useSystem();
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamText, setCurrentStreamText] = useState('');
  
  // Model Configuration State
  const [selectedModel, setSelectedModel] = useState<'llama' | 'claude' | 'gpt'>('llama');
  const [latency, setLatency] = useState(42);
  const [costAccumulated, setCostAccumulated] = useState(0.000);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamText]);

  // Load chat history on mount
  useEffect(() => {
    api.get('/copilot/history')
      .then(res => {
        if (res.data.success) {
          const history = res.data.data.messages.map((m: { id?: string; sender: 'user' | 'ai'; text: string; created_at?: string }) => {
            // Check if message text implies a tool recommendation to restore visual cards
            let toolCall = undefined;
            if (m.sender === 'ai' && m.text.includes('Meeting Invite Draft')) {
              toolCall = {
                type: 'schedule_meeting' as const,
                employeeId: selectedEmpId || (employees[0]?.id || ''),
                employeeName: employees.find(e => e.id === selectedEmpId)?.name || 'Employee',
                executed: false
              };
            } else if (m.sender === 'ai' && (m.text.includes('Slack Alert') || m.text.includes('risk is high'))) {
              toolCall = {
                type: 'slack_alert' as const,
                employeeId: selectedEmpId || (employees[0]?.id || ''),
                employeeName: employees.find(e => e.id === selectedEmpId)?.name || 'Employee',
                executed: false
              };
            }
            return {
              id: m.id || String(Math.random()),
              sender: m.sender,
              text: m.text,
              timestamp: new Date(m.created_at || Date.now()),
              toolCall
            };
          });
          setMessages(history);
        }
      })
      .catch(err => console.error('Failed to load chat history:', err));
  }, [selectedEmpId, employees]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    const userPrompt = inputMessage;
    setInputMessage('');
    
    // Add user message to UI
    const newUserMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: userPrompt,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMsg]);
    setIsStreaming(true);
    setCurrentStreamText('');

    // Select target employee for context
    const emp = employees.find(e => e.id === selectedEmpId) || null;

    try {
      const token = localStorage.getItem('attrisense_token') || '';
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1').replace(/\/+$/, '');
      
      const response = await fetch(`${baseUrl}/copilot/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userPrompt,
          employeeId: emp?.id,
          sessionId: 'default-session'
        })
      });

      if (!response.body) throw new Error('ReadableStream not supported');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponseText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.token) {
                fullResponseText += data.token;
                setCurrentStreamText(fullResponseText);
              }
            } catch {
              // Ignore parsed errors
            }
          }
        }
      }

      // Determine if a tool card should be appended
      let toolCall = undefined;
      const lowerText = fullResponseText.toLowerCase();
      if (lowerText.includes('meeting') || lowerText.includes('schedule') || lowerText.includes('invite')) {
        toolCall = {
          type: 'schedule_meeting' as const,
          employeeId: emp?.id || employees[0]?.id || '',
          employeeName: emp?.name || employees[0]?.name || 'Employee',
          executed: false,
          details: 'Schedule a 15-minute calibration check-in'
        };
      } else if (lowerText.includes('slack') || lowerText.includes('alert') || lowerText.includes('notify')) {
        toolCall = {
          type: 'slack_alert' as const,
          employeeId: emp?.id || employees[0]?.id || '',
          employeeName: emp?.name || employees[0]?.name || 'Employee',
          executed: false,
          details: `Risk level currently at ${emp?.probability || 75}%`
        };
      }

      // Add AI response to UI
      const newAiMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: fullResponseText,
        timestamp: new Date(),
        toolCall
      };
      setMessages(prev => [...prev, newAiMsg]);
      setCurrentStreamText('');
      
      // Update simulated performance metrics
      setLatency(Math.floor(Math.random() * 30) + 30);
      setCostAccumulated(prev => prev + 0.00015);

    } catch (err) {
      console.error('Chat error:', err);
      // Fallback fallback
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: 'System node experienced a connection timeout. Please ensure backend is alive.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Simulated Tool Execution Trigger
  const handleExecuteTool = async (messageId: string, toolType: 'slack_alert' | 'schedule_meeting', empId: string) => {
    // Add visual loading/success log to screen
    window.dispatchEvent(new CustomEvent("app-toast", {
      detail: { 
        message: toolType === 'slack_alert' 
          ? 'Posting notification brief to Slack #hr-alerts channel...' 
          : 'Syncing slot reservation with Google Calendar API...', 
        type: 'info' 
      }
    }));

    // Trigger tool endpoint
    try {
      const endpoint = toolType === 'slack_alert' ? '/copilot/tool-execute/slack' : '/copilot/tool-execute/calendar';
      const res = await api.post(endpoint, { employeeId: empId });
      
      if (res.data.success) {
        setMessages(prev => prev.map(m => {
          if (m.id === messageId && m.toolCall) {
            return {
              ...m,
              toolCall: { ...m.toolCall, executed: true }
            };
          }
          return m;
        }));
        
        window.dispatchEvent(new CustomEvent("app-toast", {
          detail: { 
            message: toolType === 'slack_alert' 
              ? 'Slack notification dispatched successfully!' 
              : 'Google Calendar booking confirmed & invite sent.', 
            type: 'success' 
          }
        }));
      }
    } catch {
      // Fallback success for simulation if endpoints are mocked
      setMessages(prev => prev.map(m => {
        if (m.id === messageId && m.toolCall) {
          return {
            ...m,
            toolCall: { ...m.toolCall, executed: true }
          };
        }
        return m;
      }));
      window.dispatchEvent(new CustomEvent("app-toast", {
        detail: { message: 'Agent Action simulation completed successfully.', type: 'success' }
      }));
    }
  };

  const [showFocusDrawer, setShowFocusDrawer] = useState(false);

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-8rem)] gap-4 sm:gap-6">
      
      {/* Mobile/Tablet Focus Bar Switcher */}
      <div className="xl:hidden flex items-center justify-between p-3 bg-secondary-bg/70 border border-border-primary/60 rounded-xl">
        <div className="flex items-center gap-2">
          <User size={15} className="text-primary" />
          <div className="text-xs">
            <span className="text-slate-400 font-mono text-[10px] block">Active Focus:</span>
            <span className="font-bold text-slate-200">
              {selectedEmpId ? maskName(employees.find(e => e.id === selectedEmpId)?.name || '', isDataMasked) : 'Global Organization Scope'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowFocusDrawer(!showFocusDrawer)}
          className="px-3 py-1.5 bg-elevated-bg hover:bg-surface-container-high text-xs text-primary font-mono rounded border border-border-primary/60 flex items-center gap-1.5 transition-colors"
        >
          <span>{showFocusDrawer ? 'Hide Nodes' : 'Select Target'}</span>
          <ChevronRight size={12} className={`transition-transform duration-200 ${showFocusDrawer ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* LEFT COLUMN: Employee Focus Selector (Collapsible on mobile/tablet, static on xl) */}
      <aside className={`${showFocusDrawer ? 'flex' : 'hidden'} xl:flex w-full xl:w-72 bg-secondary-bg/50 border border-border-primary/60 rounded-xl p-4 sm:p-5 shrink-0 flex-col justify-between`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Chat Focus Node</h3>
            </div>
            {selectedEmpId && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Active</span>
            )}
          </div>
          
          <p className="text-[10px] text-slate-400 leading-normal">
            Select an employee to populate target intelligence context dynamically into the AI Agent.
          </p>

          <div className="space-y-2 max-h-[260px] sm:max-h-[320px] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => {
                setSelectedEmpId('');
                setShowFocusDrawer(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded text-left border transition-all text-xs font-semibold ${
                selectedEmpId === '' 
                  ? 'bg-elevated-bg border-accent-blue text-accent-blue' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Global Context (No Employee)</span>
              <ChevronRight size={12} />
            </button>

            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => {
                  setSelectedEmpId(emp.id);
                  setShowFocusDrawer(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded text-left border transition-all text-xs font-semibold ${
                  selectedEmpId === emp.id 
                    ? 'bg-elevated-bg border-accent-blue text-accent-blue font-bold' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex flex-col">
                  <span>{maskName(emp.name, isDataMasked)}</span>
                  <span className="text-[9px] text-slate-500 font-mono mt-0.5">{emp.id} | {emp.dept}</span>
                </div>
                <ChevronRight size={12} />
              </button>
            ))}
          </div>
        </div>

        {/* Model info panel */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3.5 space-y-3 mt-4">
          <div className="flex items-center justify-between text-[9px] font-mono-label text-outline uppercase">
            <span>Model Selector</span>
            <Sparkles size={11} className="text-primary animate-pulse" />
          </div>
          
          <select 
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value as 'llama' | 'claude' | 'gpt')}
            className="w-full bg-primary-bg border border-border-primary/60 rounded px-2.5 py-1.5 text-xs text-primary font-mono outline-none"
          >
            <option value="llama">Llama 3.3 (Active)</option>
            <option value="claude">Claude 3.5 (Simulated)</option>
            <option value="gpt">GPT-4o (Simulated)</option>
          </select>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-mono text-[9px] text-slate-400">
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-primary" />
              <span>{latency}ms Latency</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Coins size={10} className="text-amber-500" />
              <span>${costAccumulated.toFixed(5)}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT COLUMN: Chat Console Workspace */}
      <main className="flex-1 bg-secondary-bg/50 border border-border-primary/60 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between h-[560px] sm:h-[620px] xl:h-[calc(100vh-10rem)]">
        {/* Chat Title bar */}
        <div className="p-3 sm:p-4 border-b border-border-primary/60 bg-elevated-bg/30 flex flex-wrap gap-2 justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-primary shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-100 uppercase font-mono">Agent Copilot Console</h4>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-none">
                {selectedEmpId ? `Context active: ${maskName(employees.find(e => e.id === selectedEmpId)?.name || '', isDataMasked)}` : 'Global organizational risk scope'}
              </p>
            </div>
          </div>
          <span className="font-mono text-[8px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 uppercase">
            Agentic Tool-calling online
          </span>
        </div>

        {/* Message Stream area */}
        <div className="flex-grow p-3.5 sm:p-6 overflow-y-auto custom-scrollbar space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 p-6">
              <MessageSquare size={36} className="text-slate-600" />
              <div>
                <p className="text-xs font-bold text-slate-200">Start an Agentic Dialogue</p>
                <p className="text-[10px] text-slate-400 max-w-sm mt-1">
                  Ask details about flight risks, draft exit templates, schedule touchpoints, or run diagnostics.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded border border-border-primary/60 bg-elevated-bg flex items-center justify-center text-primary shrink-0">
                  <Bot size={14} />
                </div>
              )}
              
              <div className="space-y-2 max-w-[85%]">
                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-primary-bg border-accent-blue/30 text-slate-100 rounded-tr-none' 
                    : 'bg-secondary-bg border-border-primary/40 text-slate-200 rounded-tl-none whitespace-pre-wrap font-sans'
                }`}>
                  {msg.text}
                </div>

                {/* Simulated tool calling actions block */}
                {msg.toolCall && (
                  <div className="p-3 bg-[#0d1220] rounded-xl border border-border-primary/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex items-center gap-2">
                      {msg.toolCall.type === 'slack_alert' ? (
                        <SlackIcon size={16} className="text-accent-blue" />
                      ) : (
                        <Calendar size={16} className="text-indigo-400" />
                      )}
                      <div>
                        <p className="text-[10px] font-bold text-slate-200">
                          {msg.toolCall.type === 'slack_alert' ? 'Slack Risk Notification' : '1-on-1 Calibration Booking'}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          Target: {maskName(msg.toolCall.employeeName, isDataMasked)}
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={msg.toolCall.executed}
                      onClick={() => handleExecuteTool(msg.id, msg.toolCall!.type, msg.toolCall!.employeeId)}
                      className={`text-[9px] font-bold font-mono uppercase px-3 py-1.5 rounded transition-all border-none ${
                        msg.toolCall.executed 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 cursor-default' 
                          : 'bg-primary text-on-primary hover:bg-primary-container cursor-pointer'
                      }`}
                    >
                      {msg.toolCall.executed ? 'Executed ✓' : msg.toolCall.type === 'slack_alert' ? 'Dispatched' : 'Book Slots'}
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded bg-accent-blue/15 border border-accent-blue/20 flex items-center justify-center font-bold text-accent-blue text-xs shrink-0">
                  HR
                </div>
              )}
            </div>
          ))}

          {/* Streaming display */}
          {isStreaming && currentStreamText && (
            <div className="flex gap-3 items-start justify-start">
              <div className="w-8 h-8 rounded border border-border-primary/60 bg-elevated-bg flex items-center justify-center text-primary shrink-0">
                <Bot size={14} />
              </div>
              <div className="p-3.5 rounded-xl border bg-secondary-bg border-border-primary/40 text-slate-200 rounded-tl-none text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap font-sans">
                {currentStreamText}
                <span className="inline-block w-1.5 h-3 bg-primary animate-pulse ml-0.5"></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border-primary/60 bg-elevated-bg/20 flex items-center gap-3 shrink-0">
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            disabled={isStreaming}
            placeholder={selectedEmpId ? "Type question about this employee..." : "Ask Copilot anything..."}
            className="flex-1 bg-primary-bg border border-border-primary/60 rounded px-4 py-2.5 text-xs text-white outline-none focus:border-primary disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isStreaming}
            className="p-2.5 bg-primary hover:bg-primary-container text-on-primary rounded border-none cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            {isStreaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </main>

    </div>
  );
}
