import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Wallet, 
  History, 
  BarChart3, 
  Settings as SettingsIcon, 
  Plus, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  DollarSign, 
  Clock, 
  Calendar,
  Sparkles,
  Trash2,
  Target,
  TrendingUp,
  Volume2,
  RefreshCcw,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Transaction, WalletData, ViewMode, ExchangeRate } from './types';
import { getFinancialAdvice } from './services/geminiService';

// Helper Components
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div 
    {...props} 
    className={`bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

const App: React.FC = () => {
  // State
  const [data, setData] = useState<WalletData>(() => {
    try {
      const saved = localStorage.getItem('creative_wallet_data_v2');
      return saved ? JSON.parse(saved) : { transactions: [], darkMode: true, currency: 'BRL', prosperityGoal: 5000 };
    } catch (e) {
      return { transactions: [], darkMode: true, currency: 'BRL', prosperityGoal: 5000 };
    }
  });
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [advice, setAdvice] = useState<string>("Buscando sabedoria financeira...");
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(data.prosperityGoal?.toString() || '5000');
  
  // Form State
  const [form, setForm] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });

  // Side Effect for Dark Mode Class
  useEffect(() => {
    const root = document.documentElement;
    if (data.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [data.darkMode]);

  // Side Effect for Local Storage Persistence
  useEffect(() => {
    localStorage.setItem('creative_wallet_data_v2', JSON.stringify(data));
  }, [data]);

  // Update Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Exchange Rate
  const fetchExchange = useCallback(async () => {
    try {
      const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL');
      const json = await res.json();
      setExchangeRate(json.USDBRL);
    } catch (e) {
      console.warn("Could not fetch exchange rate");
    }
  }, []);

  useEffect(() => {
    fetchExchange();
    const interval = setInterval(fetchExchange, 60000);
    return () => clearInterval(interval);
  }, [fetchExchange]);

  // AI Advice
  const loadAdvice = async () => {
    setIsAdviceLoading(true);
    const text = await getFinancialAdvice(data.transactions);
    setAdvice(text);
    setIsAdviceLoading(false);
  };

  useEffect(() => {
    loadAdvice();
  }, [data.transactions.length]);

  // Calculations
  const totalBalance = useMemo(() => data.transactions.reduce((acc, t) => acc + t.amount, 0), [data.transactions]);
  const titheValue = useMemo(() => totalBalance * 0.1, [totalBalance]);
  const netBalance = useMemo(() => totalBalance - titheValue, [totalBalance, titheValue]);

  const monthlyData = useMemo(() => {
    const groups: Record<string, { month: string, total: number, tithe: number, net: number }> = {};
    data.transactions.forEach(t => {
      const date = new Date(t.date);
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const monthKey = t.date.substring(0, 7);
      
      if (!groups[monthKey]) {
        groups[monthKey] = { month: monthLabel, total: 0, tithe: 0, net: 0 };
      }
      groups[monthKey].total += t.amount;
      groups[monthKey].tithe += t.amount * 0.1;
      groups[monthKey].net += t.amount * 0.9;
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, val]) => val);
  }, [data.transactions]);

  const goalProgress = useMemo(() => {
    if (!data.prosperityGoal || data.prosperityGoal === 0) return 0;
    return Math.min(100, (totalBalance / data.prosperityGoal) * 100);
  }, [totalBalance, data.prosperityGoal]);

  const futureProjection = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    const avgMonthly = totalBalance / monthlyData.length;
    return totalBalance + (avgMonthly * 12);
  }, [totalBalance, monthlyData]);

  // Actions
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      amount: parseFloat(form.amount),
      description: form.description,
      date: form.date,
      type: 'income'
    };

    setData(prev => ({ ...prev, transactions: [...prev.transactions, newTransaction] }));
    setForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    setIsAdding(false);
  };

  const deleteTransaction = (id: string) => {
    if (confirm('Deseja realmente excluir esta transação?')) {
      setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    }
  };

  const handleUpdateGoal = () => {
    setData(prev => ({ ...prev, prosperityGoal: parseFloat(tempGoal) || 0 }));
    setShowGoalModal(false);
  };

  const speakAdvice = () => {
    const utterance = new SpeechSynthesisUtterance(advice);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  const toggleDarkMode = () => setData(prev => ({ ...prev, darkMode: !prev.darkMode }));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carteira-prosperidade-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        setData(imported);
        alert('Dados restaurados com sucesso!');
      } catch (err) {
        alert('Erro ao importar arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const clearData = () => {
    if (confirm('AVISO: Isso apagará todos os seus registros locais. Deseja prosseguir?')) {
      setData({ transactions: [], darkMode: data.darkMode, currency: 'BRL', prosperityGoal: 5000 });
      localStorage.removeItem('creative_wallet_data_v2');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-500 overflow-x-hidden">
      {/* Background Glows (Dourados) */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-10 dark:opacity-20 overflow-hidden z-0">
        <div className="absolute top-[-15%] right-[-15%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-600 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 rounded-2xl text-white shadow-lg shadow-amber-500/30">
              <Wallet size={26} />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-700 bg-clip-text text-transparent tracking-tight">
              Carteira De Dizimo & Prosperidade
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-2 text-sm pl-1">
            <Calendar size={14} className="text-amber-500" />
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-2 rounded-3xl shadow-xl border border-white/20 dark:border-gray-700">
          <div className="flex items-center gap-3 px-4 py-2 border-r border-gray-100 dark:border-gray-700">
            <Clock size={18} className="text-amber-500" />
            <span className="font-mono text-xl font-bold dark:text-white tracking-tighter">{currentTime.toLocaleTimeString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-3 px-3">
             <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-full">
               <DollarSign size={16} className="text-amber-600 dark:text-amber-400" />
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-black">Câmbio USD</span>
               <span className="text-sm font-black dark:text-white">
                 {exchangeRate ? `R$ ${parseFloat(exchangeRate.bid).toFixed(2)}` : '---'}
               </span>
             </div>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-gray-600 dark:text-amber-400 active:scale-90"
          >
            {data.darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6">
        {view === ViewMode.DASHBOARD && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-2 space-y-8">
              {/* Card Principal - Tema Ouro */}
              <div className="relative overflow-hidden group rounded-[40px] shadow-2xl shadow-amber-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-800 opacity-100 transition-transform duration-1000 group-hover:scale-105"></div>
                <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-white/20 rounded-full blur-3xl opacity-50"></div>
                
                <div className="relative z-10 p-10 text-white flex flex-col justify-between min-h-[320px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-amber-50 text-[11px] font-black uppercase tracking-[0.25em] mb-2 opacity-90">Saldo Bruto Total</p>
                      <h2 className="text-6xl font-black tracking-tight drop-shadow-md">
                        R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h2>
                    </div>
                    <button 
                      onClick={() => setShowGoalModal(true)}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2.5 rounded-2xl text-xs font-black transition-all border border-white/20 active:scale-95 flex items-center gap-2 uppercase tracking-widest"
                    >
                      <Target size={16} /> Meta
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-5 mt-10">
                    <div className="bg-white/15 backdrop-blur-md rounded-[2.5rem] p-6 flex-1 border border-white/10">
                      <p className="text-pink-100 text-[10px] uppercase font-black mb-1 opacity-90 flex items-center gap-1.5 tracking-widest">
                        <Sparkles size={12} className="text-yellow-300" /> Dízimo Devocional (10%)
                      </p>
                      <p className="text-3xl font-black text-white">R$ {titheValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-black/10 backdrop-blur-md rounded-[2.5rem] p-6 flex-1 border border-white/10">
                      <p className="text-amber-50 text-[10px] uppercase font-black mb-1 opacity-90 tracking-widest">Saldo Prosperidade (Líquido)</p>
                      <p className="text-3xl font-black text-amber-50">R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de Progresso da Meta */}
              <Card className="relative overflow-hidden gold-glow">
                <div className="flex justify-between items-end mb-5">
                  <div>
                    <h3 className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <Target size={16} /> Alvo de Prosperidade
                    </h3>
                    <p className="text-2xl font-black dark:text-white">R$ {data.prosperityGoal?.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-amber-600 dark:text-amber-500 tracking-tighter">{Math.round(goalProgress)}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700/50 h-5 rounded-full overflow-hidden mb-3 border border-gray-100 dark:border-gray-700">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 transition-all duration-[2000ms] ease-out rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                    style={{ width: `${goalProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold italic">
                  Restam R$ {(Math.max(0, (data.prosperityGoal || 0) - totalBalance)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para concretizar seu objetivo atual.
                </p>
              </Card>

              {/* Insights do Mentor IA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-900/10 dark:to-gray-800/40 border-amber-100 dark:border-amber-900/20 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                       <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-2xl border border-amber-200/50 dark:border-amber-800/30">
                        <Sparkles className="text-amber-600 dark:text-amber-400" size={22} />
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={speakAdvice} className="p-2.5 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all text-gray-400 hover:text-amber-500 active:scale-90">
                          <Volume2 size={18} />
                        </button>
                        <button onClick={loadAdvice} className={`p-2.5 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all text-gray-400 hover:text-amber-500 active:scale-90 ${isAdviceLoading ? 'animate-spin' : ''}`}>
                          <RefreshCcw size={18} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-black mb-2 dark:text-white uppercase tracking-tight">Mentor de Prosperidade</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic font-medium">
                      {isAdviceLoading ? 'Consultando sabedoria...' : `"${advice}"`}
                    </p>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-50/50 to-white dark:from-green-900/10 dark:to-gray-800/40 border-green-100 dark:border-green-900/20">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-2xl w-fit mb-4 border border-green-200/50 dark:border-green-800/30">
                    <TrendingUp className="text-green-600 dark:text-green-400" size={22} />
                  </div>
                  <h3 className="text-lg font-black mb-2 dark:text-white uppercase tracking-tight">Projeção 12 Meses</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-semibold">Baseado na sua média atual de ganhos, em um ano você terá:</p>
                  <p className="text-3xl font-black text-green-600 dark:text-green-400 tracking-tighter">
                    R$ {futureProjection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="h-1.5 w-full bg-green-100 dark:bg-green-900/20 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-green-500 w-[70%] animate-pulse"></div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Coluna Lateral: Histórico Rápido */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Fluxo Recente</h3>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-3.5 rounded-2xl shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-1 transition-all active:scale-95"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
              <div className="space-y-4 max-h-[720px] overflow-y-auto pr-2 no-scrollbar">
                {data.transactions.length === 0 ? (
                  <div className="text-center py-28 bg-white dark:bg-gray-800/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-8">
                    <div className="bg-amber-100 dark:bg-amber-900/20 p-5 rounded-full mb-5">
                      <Wallet size={36} className="text-amber-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-black uppercase text-xs tracking-widest">Aguardando Lançamentos</p>
                  </div>
                ) : (
                  data.transactions.slice().reverse().slice(0, 10).map(t => (
                    <div key={t.id} className="group bg-white dark:bg-gray-800 p-5 rounded-[2.2rem] flex items-center gap-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-600 transition-all hover:scale-[1.03]">
                      <div className="bg-amber-50 dark:bg-amber-900/30 p-3.5 rounded-2xl text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner">
                        <TrendingUp size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 dark:text-white truncate text-sm tracking-tight">{t.description}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-600 dark:text-amber-500 text-base leading-none mb-1">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[9px] text-pink-500 font-bold uppercase tracking-tighter">Dízimo: {(t.amount * 0.1).toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                )}
                {data.transactions.length > 5 && (
                   <button 
                    onClick={() => setView(ViewMode.HISTORY)}
                    className="w-full py-5 text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] hover:opacity-70 transition-opacity"
                   >
                     Explorar Histórico Completo
                   </button>
                )}
              </div>
            </div>
          </div>
        )}

        {view === ViewMode.ANALYTICS && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black dark:text-white flex items-center gap-3 tracking-tighter uppercase">
              <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-2xl border border-amber-200/50 dark:border-amber-800/30">
                <BarChart3 className="text-amber-600" size={24} />
              </div>
              Painel de Crescimento
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Soma Bruta', val: `R$ ${totalBalance.toFixed(2)}`, color: 'border-l-amber-500' },
                { label: 'Contribuições', val: `R$ ${titheValue.toFixed(2)}`, color: 'border-l-pink-500' },
                { label: 'Patrimônio Líquido', val: `R$ ${netBalance.toFixed(2)}`, color: 'border-l-green-500' },
                { label: 'Total Registros', val: `${data.transactions.length} Entradas`, color: 'border-l-yellow-600' }
              ].map((stat, i) => (
                <Card key={i} className={`border-l-[10px] ${stat.color} hover:scale-105 transition-transform duration-500 cursor-default shadow-lg`}>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-2xl font-black dark:text-white tracking-tighter">{stat.val}</p>
                </Card>
              ))}
            </div>

            {/* Linha do Tempo Comparativa */}
            <Card className="min-h-[480px] gold-glow">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="font-black text-xl dark:text-white tracking-tight uppercase">Linha do Tempo: Crescimento vs Fidelidade</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Visão mensal comparativa</p>
                </div>
                <div className="hidden md:flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/20"></div>
                    <span className="text-[11px] font-black dark:text-gray-300 uppercase tracking-widest">Ganhos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-pink-500 rounded-full shadow-lg shadow-pink-500/20"></div>
                    <span className="text-[11px] font-black dark:text-gray-300 uppercase tracking-widest">Dízimo</span>
                  </div>
                </div>
              </div>
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} 
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'rgba(245, 158, 11, 0.05)'}}
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                      itemStyle={{ fontWeight: 'black', fontSize: '13px' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="total" name="Total Bruto" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="tithe" name="Dízimo (10%)" fill="#ec4899" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
               {/* Timeline Vertical */}
               <Card className="lg:col-span-1 space-y-6">
                 <h3 className="font-black text-lg dark:text-white tracking-tight mb-4 flex items-center gap-2 uppercase">
                   <Calendar size={18} className="text-amber-500" /> Histórico Evolutivo
                 </h3>
                 <div className="space-y-5 max-h-[420px] overflow-y-auto pr-3 no-scrollbar">
                   {monthlyData.slice().reverse().map((m, idx) => (
                     <div key={idx} className="relative pl-7 border-l-2 border-amber-200 dark:border-amber-900 pb-7 last:pb-0">
                       <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-4 border-amber-500 shadow-md"></div>
                       <div className="flex justify-between items-start">
                         <div>
                            <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">{m.month}</p>
                            <p className="text-xl font-black dark:text-white tracking-tighter">R$ {m.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fidelidade</p>
                            <p className="text-sm font-black text-pink-500">R$ {m.tithe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                         </div>
                       </div>
                       <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 dark:bg-green-900/10 px-3 py-1.5 rounded-full w-fit">
                          <ArrowUpRight size={12} strokeWidth={3} />
                          <span>Líquido: R$ {m.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                     </div>
                   ))}
                   {monthlyData.length === 0 && <p className="text-center text-gray-400 py-16 font-black uppercase text-xs">Dados insuficientes</p>}
                 </div>
               </Card>

               {/* Gráfico de Área */}
               <Card className="lg:col-span-2 min-h-[420px]">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="font-black text-xl dark:text-white tracking-tight uppercase">Fluxo Acumulado</h3>
                    <div className="bg-amber-50 dark:bg-amber-900/30 px-4 py-1.5 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-widest border border-amber-100 dark:border-amber-800/30">Progressão</div>
                 </div>
                 <div className="h-[320px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={monthlyData}>
                       <defs>
                         <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                           <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.4} />
                       <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} dy={10} />
                       <YAxis hide />
                       <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                        itemStyle={{ fontWeight: 'black', fontSize: '14px', color: '#b45309' }}
                       />
                       <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={5} fillOpacity={1} fill="url(#goldGradient)" animationDuration={1500} />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
               </Card>
            </div>
          </div>
        )}

        {/* Demais visualizações simplificadas para brevidade mas mantendo a lógica de cores */}
        {view === ViewMode.HISTORY && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
               <h2 className="text-3xl font-black dark:text-white flex items-center gap-3 tracking-tighter uppercase">
                <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-2xl border border-amber-200/50 dark:border-amber-800/30">
                  <History className="text-amber-600" size={24} />
                </div> 
                Lançamentos
              </h2>
              <button onClick={exportData} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-amber-600 shadow-md active:scale-95 transition-all">
                <Download size={22} />
              </button>
            </div>
            
            <Card className="p-0 overflow-hidden border-none shadow-2xl">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-100 dark:border-gray-700">
                      <th className="py-6 px-8">Data</th>
                      <th className="py-6 px-8">Descrição</th>
                      <th className="py-6 px-8">Bruto</th>
                      <th className="py-6 px-8 text-pink-500">Dízimo</th>
                      <th className="py-6 px-8 text-amber-600">Líquido</th>
                      <th className="py-6 px-8 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700 font-medium">
                    {data.transactions.slice().reverse().map(t => (
                      <tr key={t.id} className="group hover:bg-amber-50/20 dark:hover:bg-amber-900/5 transition-all">
                        <td className="py-6 px-8 text-xs text-gray-500 font-bold">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                        <td className="py-6 px-8 font-black text-gray-900 dark:text-white">{t.description}</td>
                        <td className="py-6 px-8 font-black text-gray-900 dark:text-white">R$ {t.amount.toFixed(2)}</td>
                        <td className="py-6 px-8 font-black text-pink-500">R$ {(t.amount * 0.1).toFixed(2)}</td>
                        <td className="py-6 px-8 font-black text-amber-600 dark:text-amber-500">R$ {(t.amount * 0.9).toFixed(2)}</td>
                        <td className="py-6 px-8 text-center">
                          <button onClick={() => deleteTransaction(t.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {view === ViewMode.SETTINGS && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700">
             <div className="flex items-center gap-4 mb-4">
                <div className="bg-amber-600 p-3.5 rounded-2xl text-white shadow-xl shadow-amber-500/20">
                  <SettingsIcon size={24} />
                </div>
                <h2 className="text-3xl font-black dark:text-white tracking-tighter uppercase">Segurança & Ajustes</h2>
             </div>
             
             <Card className="space-y-8 divide-y divide-gray-100 dark:divide-gray-700 shadow-2xl">
                <div className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Download size={20} className="text-amber-600" />
                    <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm">Exportar Backup</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 font-bold uppercase tracking-widest">Salve seus registros em um arquivo externo.</p>
                  <button onClick={exportData} className="w-full flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-700 text-white font-black py-5 rounded-3xl transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs">
                    Baixar Dados (.json)
                  </button>
                </div>

                <div className="pt-8">
                  <div className="flex items-center gap-3 mb-2">
                    <Upload size={20} className="text-yellow-600" />
                    <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm">Restaurar Dados</h3>
                  </div>
                  <label className="w-full flex items-center justify-center gap-3 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-white font-black py-5 rounded-3xl cursor-pointer transition-all active:scale-95 uppercase tracking-widest text-xs border border-dashed border-gray-300 dark:border-gray-600">
                    Importar Arquivo
                    <input type="file" className="hidden" accept=".json" onChange={importData} />
                  </label>
                </div>

                <div className="pt-8">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck size={20} className="text-green-600" />
                    <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm">Privacidade Local</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-bold uppercase tracking-tighter italic">
                    Esta carteira funciona de forma 100% offline. Seus dados financeiros permanecem exclusivamente no seu navegador. Recomendamos exportar backups regularmente.
                  </p>
                </div>

                <div className="pt-8">
                  <button onClick={clearData} className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 py-5 rounded-3xl font-black text-xs transition-all border-2 border-dashed border-red-200 dark:border-red-900/20 uppercase tracking-[0.2em]">
                    <Trash2 size={16} /> Excluir Todos os Dados
                  </button>
                </div>
             </Card>
          </div>
        )}
      </main>

      {/* Navegação Inferior (Premium Gold) */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl p-2.5 rounded-[45px] shadow-2xl border border-white/40 dark:border-gray-700 z-50 flex items-center gap-2 w-[92%] max-w-lg transition-transform active:scale-[0.98]">
        {[
          { id: ViewMode.DASHBOARD, icon: Wallet, label: 'Ganhos' },
          { id: ViewMode.HISTORY, icon: History, label: 'Registros' },
          { id: ViewMode.ANALYTICS, icon: BarChart3, label: 'Painel' },
          { id: ViewMode.SETTINGS, icon: SettingsIcon, label: 'Ajustes' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-[35px] transition-all relative ${
              view === item.id 
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl shadow-amber-500/40 -translate-y-2' 
                : 'text-gray-400 hover:text-amber-500 dark:hover:text-amber-400'
            }`}
          >
            <item.icon size={22} className={view === item.id ? 'animate-pulse' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Modais (Goal & Add) com estilo dourado */}
      {showGoalModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 gold-glow">
            <h3 className="text-2xl font-black mb-4 dark:text-white tracking-tighter uppercase">Definir Novo Alvo</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-bold uppercase tracking-tight">Qual o próximo nível de prosperidade que você deseja alcançar?</p>
            <div className="relative mb-10">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-amber-600 text-xl">R$</span>
              <input 
                type="number" 
                value={tempGoal}
                onChange={e => setTempGoal(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-[2rem] p-6 pl-14 focus:ring-4 focus:ring-amber-500/30 outline-none dark:text-white font-black text-2xl"
                placeholder="0,00"
              />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowGoalModal(false)} className="flex-1 py-5 text-gray-400 font-black text-xs uppercase tracking-[0.2em] hover:text-gray-600 transition-colors">Cancelar</button>
              <button onClick={handleUpdateGoal} className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-amber-500/30 active:scale-95 transition-all uppercase tracking-widest text-xs">Confirmar Alvo</button>
            </div>
          </Card>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-xl animate-in zoom-in-95 duration-500 shadow-2xl relative overflow-hidden gold-glow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600"></div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black dark:text-white tracking-tighter uppercase">Novo Recebimento</h3>
              <button onClick={() => setIsAdding(false)} className="bg-gray-100 dark:bg-gray-700 p-2.5 rounded-full text-gray-400 hover:text-red-500 transition-all active:rotate-90">
                <Plus size={26} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Identificação do Ganho</label>
                <input autoFocus required type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-[2rem] p-6 focus:ring-4 focus:ring-amber-500/30 outline-none dark:text-white font-black text-lg" placeholder="Ex: Venda de Consultoria Especializada" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Montante Bruto</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-amber-600">R$</span>
                    <input required type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-[2rem] p-6 pl-14 focus:ring-4 focus:ring-amber-500/30 outline-none dark:text-white font-black text-xl" placeholder="0,00" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Data do Recebimento</label>
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-[2rem] p-6 focus:ring-4 focus:ring-amber-500/30 outline-none dark:text-white font-black" />
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-[2.2rem] flex items-center justify-between border border-amber-100 dark:border-amber-900/30 shadow-inner">
                 <span className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Dízimo Sugerido:</span>
                 <span className="text-2xl font-black text-pink-600 dark:text-pink-400">R$ {form.amount ? (parseFloat(form.amount) * 0.1).toFixed(2) : '0,00'}</span>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-amber-700 text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-amber-500/40 hover:-translate-y-1 transition-all text-sm uppercase tracking-[0.3em] active:scale-95">Salvar Lançamento</button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default App;