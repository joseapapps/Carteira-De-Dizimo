
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
  ChevronRight,
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
    const saved = localStorage.getItem('creative_wallet_data_v2');
    return saved ? JSON.parse(saved) : { transactions: [], darkMode: false, currency: 'BRL', prosperityGoal: 5000 };
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
    if (data.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      
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
    a.download = `carteira-prosperidade-backup-${new Date().toISOString().split('T')[0]}.json`;
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
        alert('Dados importados com sucesso!');
      } catch (err) {
        alert('Erro ao importar arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const clearData = () => {
    if (confirm('AVISO: Isso apagará todos os seus dados permanentemente. Deseja continuar?')) {
      setData({ transactions: [], darkMode: false, currency: 'BRL', prosperityGoal: 5000 });
      localStorage.removeItem('creative_wallet_data_v2');
      alert('Dados limpos com sucesso.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-500 overflow-x-hidden">
      {/* Dynamic background accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-purple-500 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Wallet size={24} />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Carteira De Dizimo & Prosperidade
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 text-sm">
            <Calendar size={14} />
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-2 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700">
          <div className="flex items-center gap-3 px-4 py-2 border-r border-gray-100 dark:border-gray-700">
            <Clock size={18} className="text-indigo-500" />
            <span className="font-mono text-xl font-bold dark:text-white tracking-tighter">{currentTime.toLocaleTimeString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-3 px-3">
             <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
               <DollarSign size={16} className="text-green-600 dark:text-green-400" />
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Dólar</span>
               <span className="text-sm font-bold dark:text-white">
                 {exchangeRate ? `R$ ${parseFloat(exchangeRate.bid).toFixed(2)}` : '---'}
               </span>
             </div>
          </div>
          <button 
            onClick={toggleDarkMode}
            title={data.darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all dark:text-white active:scale-90"
          >
            {data.darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6">
        {view === ViewMode.DASHBOARD && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Main Balance Card */}
              <div className="relative overflow-hidden group rounded-[40px]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 opacity-100 transition-transform duration-700 group-hover:scale-105"></div>
                {/* Decorative circles */}
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 p-10 text-white flex flex-col justify-between min-h-[300px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-indigo-100 text-xs font-bold uppercase tracking-[0.2em] mb-2 opacity-80">Saldo Total Bruto</p>
                      <h2 className="text-6xl font-black tracking-tight drop-shadow-lg">
                        R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h2>
                    </div>
                    <div className="flex flex-col items-end">
                       <button 
                        onClick={() => setShowGoalModal(true)}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/10 active:scale-95 mb-4"
                       >
                         <Target size={16} /> Meta
                       </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 mt-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 flex-1 border border-white/10 flex flex-col justify-center">
                      <p className="text-pink-100 text-[10px] uppercase font-bold mb-1 opacity-70 flex items-center gap-1">
                        <Sparkles size={10} /> Dízimo Sugerido (10%)
                      </p>
                      <p className="text-3xl font-black text-pink-200">R$ {titheValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 flex-1 border border-white/10 flex flex-col justify-center">
                      <p className="text-indigo-100 text-[10px] uppercase font-bold mb-1 opacity-70">Saldo Líquido</p>
                      <p className="text-3xl font-black text-indigo-100">R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal Progress Section */}
              <Card className="relative overflow-hidden">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Target size={14} className="text-indigo-500" /> Meta de Prosperidade
                    </h3>
                    <p className="text-2xl font-black dark:text-white">R$ {data.prosperityGoal?.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{Math.round(goalProgress)}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-4 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    style={{ width: `${goalProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Faltam R$ {(Math.max(0, (data.prosperityGoal || 0) - totalBalance)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para atingir seu objetivo.
                </p>
              </Card>

              {/* AI Insights and Future Projection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800/40 dark:to-gray-800/40 border-none flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                       <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600">
                        <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={speakAdvice} title="Ouvir conselho" className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-colors">
                          <Volume2 size={18} className="text-gray-400" />
                        </button>
                        <button onClick={loadAdvice} title="Atualizar conselho" className={`p-2 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-colors ${isAdviceLoading ? 'animate-spin' : ''}`}>
                          <RefreshCcw size={18} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2 dark:text-white">Mentor de Prosperidade</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic">
                      {isAdviceLoading ? 'Sintonizando sabedoria...' : `"${advice}"`}
                    </p>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-gray-800/40 dark:to-gray-800/40 border-none">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 w-fit mb-4">
                    <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 dark:text-white">Projeção 12 Meses</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Com base na sua média atual, em um ano você terá acumulado:</p>
                  <p className="text-3xl font-black text-green-600 dark:text-green-400 tracking-tighter">
                    R$ {futureProjection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mt-2 tracking-widest">Saldo Bruto Estimado</p>
                </Card>
              </div>
            </div>

            {/* Recent History Sidebar */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-black dark:text-white">Atividades</h3>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all active:scale-95"
                >
                  <Plus size={24} />
                </button>
              </div>
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 no-scrollbar">
                {data.transactions.length === 0 ? (
                  <div className="text-center py-24 bg-gray-100/50 dark:bg-gray-800/50 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-8">
                    <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-full mb-4">
                      <Wallet size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-400 font-bold mb-1">Tudo pronto para começar!</p>
                    <p className="text-xs text-gray-400">Clique em adicionar para registrar seu primeiro ganho.</p>
                  </div>
                ) : (
                  data.transactions.slice().reverse().slice(0, 8).map(t => (
                    <div key={t.id} className="group bg-white dark:bg-gray-800 p-5 rounded-[2rem] flex items-center gap-4 shadow-md shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all hover:scale-[1.02]">
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <TrendingUp size={20} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-black text-gray-900 dark:text-white truncate text-sm">{t.description}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-indigo-600 dark:text-indigo-400 text-base">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[9px] text-pink-500 font-bold">-{ (t.amount * 0.1).toFixed(2) }</p>
                      </div>
                    </div>
                  ))
                )}
                {data.transactions.length > 5 && (
                   <button 
                    onClick={() => setView(ViewMode.HISTORY)}
                    className="w-full py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-indigo-500 transition-colors"
                   >
                     Ver histórico completo
                   </button>
                )}
              </div>
            </div>
          </div>
        )}

        {view === ViewMode.HISTORY && (
          <div className="space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
               <h2 className="text-3xl font-black dark:text-white flex items-center gap-3">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-2xl">
                  <History className="text-indigo-600" size={24} />
                </div> 
                Transações
              </h2>
              <div className="flex gap-2">
                <button className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-indigo-600 transition-colors">
                  <Download size={20} />
                </button>
              </div>
            </div>
            
            <Card className="p-2 overflow-hidden">
              <div className="overflow-x-auto rounded-[2rem]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-50 dark:border-gray-700">
                      <th className="py-6 px-6">Data</th>
                      <th className="py-6 px-6">Descrição</th>
                      <th className="py-6 px-6">Valor Bruto</th>
                      <th className="py-6 px-6 text-pink-500">Dízimo (10%)</th>
                      <th className="py-6 px-6 text-indigo-600">Líquido</th>
                      <th className="py-6 px-6 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {data.transactions.slice().reverse().map(t => (
                      <tr key={t.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                        <td className="py-5 px-6 text-xs text-gray-500 dark:text-gray-400 font-bold">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                        <td className="py-5 px-6 font-black text-gray-900 dark:text-white">{t.description}</td>
                        <td className="py-5 px-6 font-black text-gray-900 dark:text-white">R$ {t.amount.toFixed(2)}</td>
                        <td className="py-5 px-6 font-black text-pink-600 dark:text-pink-400">R$ {(t.amount * 0.1).toFixed(2)}</td>
                        <td className="py-5 px-6 font-black text-indigo-600 dark:text-indigo-400">R$ {(t.amount * 0.9).toFixed(2)}</td>
                        <td className="py-5 px-6 text-center">
                          <button 
                            onClick={() => deleteTransaction(t.id)}
                            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.transactions.length === 0 && (
                   <div className="py-20 text-center text-gray-400 font-bold">
                      Nenhuma transação registrada.
                   </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {view === ViewMode.ANALYTICS && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black dark:text-white flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-2xl">
                <BarChart3 className="text-indigo-600" size={24} />
              </div>
              Análise de Prosperidade
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Saldo Total', val: `R$ ${totalBalance.toFixed(2)}`, color: 'border-l-indigo-500' },
                { label: 'Dízimo Total', val: `R$ ${titheValue.toFixed(2)}`, color: 'border-l-pink-500' },
                { label: 'Total Líquido', val: `R$ ${netBalance.toFixed(2)}`, color: 'border-l-green-500' },
                { label: 'Frequência', val: `${data.transactions.length} Lançamentos`, color: 'border-l-orange-500' }
              ].map((stat, i) => (
                <Card key={i} className={`border-l-8 ${stat.color} hover:scale-105 transition-transform cursor-default`}>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-2xl font-black dark:text-white tracking-tight">{stat.val}</p>
                </Card>
              ))}
            </div>

            {/* Nova Linha do Tempo Comparativa */}
            <Card className="min-h-[450px]">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="font-black text-xl dark:text-white tracking-tight">Linha do Tempo: Total vs Dízimo</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase mt-1">Comparativo mensal acumulado</p>
                </div>
                <div className="hidden md:flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="text-[10px] font-black dark:text-gray-300 uppercase tracking-widest">Recebido</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span className="text-[10px] font-black dark:text-gray-300 uppercase tracking-widest">Dízimo</span>
                  </div>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} 
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="total" name="Total Recebido" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="tithe" name="Dízimo (10%)" fill="#ec4899" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Timeline Detalhada por Mês */}
               <Card className="lg:col-span-1 space-y-6">
                 <h3 className="font-black text-xl dark:text-white tracking-tight mb-4 flex items-center gap-2">
                   <Calendar size={20} className="text-indigo-500" /> Histórico Mensal
                 </h3>
                 <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                   {monthlyData.slice().reverse().map((m, idx) => (
                     <div key={idx} className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-700 pb-6 last:pb-0">
                       <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-4 border-indigo-500 shadow-sm"></div>
                       <div className="flex justify-between items-start">
                         <div>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{m.month}</p>
                            <p className="text-lg font-black dark:text-white">R$ {m.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Dízimo</p>
                            <p className="text-sm font-black text-pink-500">R$ {m.tithe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                         </div>
                       </div>
                       <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase">
                          <ArrowUpRight size={12} />
                          <span>Líquido: R$ {m.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                     </div>
                   ))}
                   {monthlyData.length === 0 && <p className="text-center text-gray-400 py-10 font-bold">Sem dados mensais ainda.</p>}
                 </div>
               </Card>

               {/* Gráfico de Evolução de Área */}
               <Card className="lg:col-span-2 min-h-[400px]">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="font-black text-xl dark:text-white tracking-tight">Curva de Crescimento</h3>
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">Evolução</div>
                 </div>
                 <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={monthlyData}>
                       <defs>
                         <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                           <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                       <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} 
                        dy={10}
                       />
                       <YAxis hide />
                       <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                        itemStyle={{ fontWeight: 'black', fontSize: '14px' }}
                       />
                       <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#6366f1" 
                        strokeWidth={6} 
                        fillOpacity={1} 
                        fill="url(#chartGradient)" 
                        animationDuration={1500}
                       />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
               </Card>
            </div>
          </div>
        )}

        {view === ViewMode.SETTINGS && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700">
             <div className="flex items-center gap-4 mb-4">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                  <SettingsIcon size={24} />
                </div>
                <h2 className="text-3xl font-black dark:text-white">Ajustes & Backup</h2>
             </div>
             
             <Card className="space-y-8 divide-y divide-gray-50 dark:divide-gray-700">
                <div className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Download size={18} className="text-indigo-600" />
                    <h3 className="font-black text-gray-900 dark:text-white">Exportar Dados</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">Baixe um arquivo de segurança com todas as suas informações locais.</p>
                  <button 
                    onClick={exportData}
                    className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                  >
                    Exportar Backup (.json)
                  </button>
                </div>

                <div className="pt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload size={18} className="text-purple-600" />
                    <h3 className="font-black text-gray-900 dark:text-white">Importar Dados</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">Restaure transações de um arquivo de backup.</p>
                  <label className="w-full flex items-center justify-center gap-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-black py-5 rounded-3xl cursor-pointer transition-all active:scale-95">
                    Escolher Arquivo
                    <input type="file" className="hidden" accept=".json" onChange={importData} />
                  </label>
                </div>

                <div className="pt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={18} className="text-green-600" />
                    <h3 className="font-black text-gray-900 dark:text-white">Privacidade</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    Todos os seus dados financeiros são armazenados <strong>exclusivamente</strong> no seu dispositivo (LocalStorage). 
                    Nenhum dado é enviado para servidores, garantindo sua total privacidade e controle.
                  </p>
                </div>

                <div className="pt-8">
                  <button 
                    onClick={clearData}
                    className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 py-4 rounded-3xl font-black text-sm transition-all border border-dashed border-red-200 dark:border-red-900/30"
                  >
                    <Trash2 size={16} /> Limpar Todos os Dados
                  </button>
                </div>
             </Card>
          </div>
        )}
      </main>

      {/* Prosperity Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-4 dark:text-white">Definir Meta</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Qual valor total você deseja alcançar em sua jornada de prosperidade?</p>
            <div className="relative mb-8">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600">R$</span>
              <input 
                type="number" 
                value={tempGoal}
                onChange={e => setTempGoal(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-2xl p-4 pl-12 focus:ring-4 focus:ring-indigo-500/30 outline-none dark:text-white font-black text-xl"
                placeholder="0,00"
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowGoalModal(false)}
                className="flex-1 py-4 text-gray-400 font-black text-sm uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateGoal}
                className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
              >
                Salvar Meta
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Floating Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-lg animate-in zoom-in-95 duration-500 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black dark:text-white tracking-tight">Novo Recebimento</h3>
              <button onClick={() => setIsAdding(false)} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full text-gray-400 hover:text-red-500 transition-all">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Descrição do Ganho</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-2xl p-5 focus:ring-4 focus:ring-indigo-500/30 outline-none dark:text-white font-bold text-lg"
                  placeholder="Ex: Pagamento Projeto Web"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Valor (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600">R$</span>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={form.amount}
                      onChange={e => setForm({...form, amount: e.target.value})}
                      className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-2xl p-5 pl-12 focus:ring-4 focus:ring-indigo-500/30 outline-none dark:text-white font-black text-xl"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Data</label>
                  <input 
                    required
                    type="date" 
                    value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-2xl p-5 focus:ring-4 focus:ring-indigo-500/30 outline-none dark:text-white font-bold"
                  />
                </div>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl flex items-center justify-between border border-indigo-100 dark:border-indigo-900/50">
                 <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Dízimo Sugerido:</span>
                 <span className="text-lg font-black text-pink-600 dark:text-pink-400">R$ {form.amount ? (parseFloat(form.amount) * 0.1).toFixed(2) : '0,00'}</span>
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-1 transition-all mt-4 text-lg active:scale-95"
              >
                Salvar Recebimento
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Creative Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl p-2 rounded-[40px] shadow-2xl border border-white/40 dark:border-gray-800 z-50 flex items-center gap-1 w-[90%] max-w-md scale-100 transition-transform active:scale-95 origin-center">
        {[
          { id: ViewMode.DASHBOARD, icon: Wallet, label: 'Ganhos' },
          { id: ViewMode.HISTORY, icon: History, label: 'Lançamentos' },
          { id: ViewMode.ANALYTICS, icon: BarChart3, label: 'Painel' },
          { id: ViewMode.SETTINGS, icon: SettingsIcon, label: 'Ajustes' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-4 rounded-[32px] transition-all relative ${
              view === item.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 -translate-y-2' 
                : 'text-gray-400 hover:text-indigo-500'
            }`}
          >
            <item.icon size={22} className={view === item.id ? 'animate-bounce' : ''} />
            <span className="text-[9px] font-black uppercase tracking-[0.15em]">{item.label}</span>
            {view === item.id && (
               <div className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
