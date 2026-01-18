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
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  HandCoins,
  ReceiptText
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Transaction, WalletData, ViewMode, ExchangeRate, TithePayment } from './types';
import { getFinancialAdvice } from './services/geminiService';

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div 
    {...props} 
    className={`bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

const App: React.FC = () => {
  const [data, setData] = useState<WalletData>(() => {
    try {
      const saved = localStorage.getItem('creative_wallet_data_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.tithePayments) parsed.tithePayments = [];
        return parsed;
      }
      return { transactions: [], tithePayments: [], darkMode: true, currency: 'BRL', prosperityGoal: 5000 };
    } catch (e) {
      return { transactions: [], tithePayments: [], darkMode: true, currency: 'BRL', prosperityGoal: 5000 };
    }
  });

  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [isAddingTithe, setIsAddingTithe] = useState(false);
  const [advice, setAdvice] = useState<string>("Buscando sabedoria financeira...");
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(data.prosperityGoal?.toString() || '5000');
  
  const [incomeForm, setIncomeForm] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [titheForm, setTitheForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    const root = document.documentElement;
    if (data.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [data.darkMode]);

  useEffect(() => {
    localStorage.setItem('creative_wallet_data_v3', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
  }, [fetchExchange]);

  const loadAdvice = async () => {
    setIsAdviceLoading(true);
    const text = await getFinancialAdvice(data.transactions);
    setAdvice(text);
    setIsAdviceLoading(false);
  };

  useEffect(() => {
    loadAdvice();
  }, [data.transactions.length]);

  const totalBalance = useMemo(() => data.transactions.reduce((acc, t) => acc + t.amount, 0), [data.transactions]);
  const titheValue = useMemo(() => totalBalance * 0.1, [totalBalance]);
  const netBalance = useMemo(() => totalBalance - titheValue, [totalBalance, titheValue]);

  const monthlyData = useMemo(() => {
    const groups: Record<string, { month: string, total: number, tithe: number, net: number, isPaid: boolean }> = {};
    
    data.transactions.forEach(t => {
      const date = new Date(t.date);
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const monthKey = t.date.substring(0, 7);
      
      if (!groups[monthKey]) {
        groups[monthKey] = { month: monthLabel, total: 0, tithe: 0, net: 0, isPaid: false };
      }
      groups[monthKey].total += t.amount;
      groups[monthKey].tithe += t.amount * 0.1;
      groups[monthKey].net += t.amount * 0.9;
    });

    data.tithePayments.forEach(p => {
      const monthKey = p.date.substring(0, 7);
      if (groups[monthKey]) {
        groups[monthKey].isPaid = true;
      }
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, val]) => val);
  }, [data.transactions, data.tithePayments]);

  const goalProgress = useMemo(() => {
    if (!data.prosperityGoal || data.prosperityGoal === 0) return 0;
    return Math.min(100, (totalBalance / data.prosperityGoal) * 100);
  }, [totalBalance, data.prosperityGoal]);

  const futureProjection = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    const avgMonthly = totalBalance / monthlyData.length;
    return totalBalance + (avgMonthly * 12);
  }, [totalBalance, monthlyData]);

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeForm.amount || !incomeForm.description) return;
    
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      amount: parseFloat(incomeForm.amount),
      description: incomeForm.description,
      date: incomeForm.date,
      type: 'income',
      isTithePaid: false
    };

    setData(prev => ({ ...prev, transactions: [...prev.transactions, newTransaction] }));
    setIncomeForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    setIsAddingIncome(false);
  };

  const handleAddTithe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titheForm.amount || !titheForm.date) return;

    const newPayment: TithePayment = {
      id: crypto.randomUUID(),
      amount: parseFloat(titheForm.amount),
      date: titheForm.date
    };

    setData(prev => ({ ...prev, tithePayments: [...prev.tithePayments, newPayment] }));
    setTitheForm({ amount: '', date: new Date().toISOString().split('T')[0] });
    setIsAddingTithe(false);
    alert("Pagamento de dízimo registrado com sucesso!");
  };

  const deleteTransaction = (id: string) => {
    if (confirm('Deseja excluir este registro de ganho?')) {
      setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    }
  };

  const deleteTithePayment = (id: string) => {
    if (confirm('Deseja excluir este comprovante de pagamento de dízimo? O status do mês no Histórico Evolutivo poderá voltar a Pendente.')) {
      setData(prev => ({ ...prev, tithePayments: prev.tithePayments.filter(p => p.id !== id) }));
    }
  };

  const handleUpdateGoal = () => {
    setData(prev => ({ ...prev, prosperityGoal: parseFloat(tempGoal) || 0 }));
    setShowGoalModal(false);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wallet_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.transactions && Array.isArray(json.transactions)) {
          setData(json);
          alert('Dados importados com sucesso!');
        } else {
          alert('Formato de arquivo inválido.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const clearData = () => {
    if (confirm('Tem certeza que deseja apagar TODOS os seus dados? Esta ação é irreversível.')) {
      const resetData: WalletData = { transactions: [], tithePayments: [], darkMode: true, currency: 'BRL', prosperityGoal: 5000 };
      setData(resetData);
      localStorage.removeItem('creative_wallet_data_v3');
      alert('Todos os dados foram removidos.');
    }
  };

  const speakAdvice = () => {
    const utterance = new SpeechSynthesisUtterance(advice);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-500 overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-10 dark:opacity-20 z-0">
        <div className="absolute top-[-15%] right-[-15%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-600 rounded-full blur-[120px]"></div>
      </div>

      <header className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 rounded-2xl text-white shadow-lg">
              <Wallet size={26} />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-700 bg-clip-text text-transparent tracking-tight">
              Carteira De Dizimo & Prosperidade
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-2 text-sm pl-1 uppercase tracking-widest">
            <Calendar size={14} className="text-amber-500" />
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-2 rounded-3xl shadow-xl border border-white/20 dark:border-gray-700">
          <div className="flex items-center gap-3 px-4 py-2 border-r border-gray-100 dark:border-gray-700">
            <Clock size={18} className="text-amber-500" />
            <span className="font-mono text-xl font-bold dark:text-white">{currentTime.toLocaleTimeString('pt-BR')}</span>
          </div>
          <button 
            onClick={() => setData(prev => ({ ...prev, darkMode: !prev.darkMode }))}
            className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-amber-500 active:scale-90"
          >
            {data.darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6">
        {view === ViewMode.DASHBOARD && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-2 space-y-8">
              {/* Card de Saldo */}
              <div className="relative overflow-hidden group rounded-[40px] shadow-2xl shadow-amber-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-800 opacity-100"></div>
                <div className="relative z-10 p-10 text-white flex flex-col justify-between min-h-[320px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-amber-50 text-[11px] font-black uppercase tracking-[0.25em] mb-2 opacity-90">Patrimônio Bruto Acumulado</p>
                      <h2 className="text-6xl font-black tracking-tight drop-shadow-md">
                        R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h2>
                    </div>
                    <button onClick={() => setShowGoalModal(true)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2.5 rounded-2xl text-xs font-black transition-all border border-white/20 uppercase">
                      <Target size={16} className="inline mr-2" /> Meta
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-5 mt-10">
                    <div className="bg-white/15 backdrop-blur-md rounded-[2.5rem] p-6 flex-1 border border-white/10">
                      <p className="text-pink-100 text-[10px] uppercase font-black mb-1 opacity-90 tracking-widest">Dízimo Necessário (10%)</p>
                      <p className="text-3xl font-black text-white">R$ {titheValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-black/10 backdrop-blur-md rounded-[2.5rem] p-6 flex-1 border border-white/10">
                      <p className="text-amber-50 text-[10px] uppercase font-black mb-1 opacity-90 tracking-widest">Capital de Investimento (90%)</p>
                      <p className="text-3xl font-black text-amber-50">R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button 
                  onClick={() => setIsAddingIncome(true)}
                  className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl hover:shadow-amber-500/10 border border-gray-100 dark:border-gray-700 flex items-center justify-between group transition-all"
                 >
                   <div className="flex items-center gap-4">
                     <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                     </div>
                     <div className="text-left">
                       <p className="text-sm font-black dark:text-white uppercase tracking-tighter">Novo Ganho</p>
                       <p className="text-xs text-gray-400 font-bold">Registrar entrada bruta</p>
                     </div>
                   </div>
                   <Plus size={24} className="text-gray-300 group-hover:text-amber-500" />
                 </button>

                 <button 
                  onClick={() => setIsAddingTithe(true)}
                  className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl hover:shadow-pink-500/10 border border-gray-100 dark:border-gray-700 flex items-center justify-between group transition-all"
                 >
                   <div className="flex items-center gap-4">
                     <div className="bg-pink-100 dark:bg-pink-900/30 p-4 rounded-2xl text-pink-600 group-hover:scale-110 transition-transform">
                        <HandCoins size={24} />
                     </div>
                     <div className="text-left">
                       <p className="text-sm font-black dark:text-white uppercase tracking-tighter">Pagar Dízimo</p>
                       <p className="text-xs text-gray-400 font-bold">Marcar mês como pago</p>
                     </div>
                   </div>
                   <CheckCircle2 size={24} className="text-gray-300 group-hover:text-pink-500" />
                 </button>
              </div>

              {/* Mentor de Prosperidade & Projeção */}
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
                  <h3 className="text-lg font-black mb-2 dark:text-white uppercase tracking-tight">Projeção Anual</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-semibold">Estimativa de patrimônio em 12 meses:</p>
                  <p className="text-3xl font-black text-green-600 dark:text-green-400 tracking-tighter">
                    R$ {futureProjection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="h-1.5 w-full bg-green-100 dark:bg-green-900/20 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-green-500 w-[70%] animate-pulse"></div>
                  </div>
                </Card>
              </div>

              {/* Meta Section */}
              <Card className="gold-glow">
                <div className="flex justify-between items-end mb-5">
                  <div>
                    <h3 className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1.5">Alvo de Prosperidade</h3>
                    <p className="text-2xl font-black dark:text-white">R$ {data.prosperityGoal?.toLocaleString('pt-BR')}</p>
                  </div>
                  <span className="text-4xl font-black text-amber-600 tracking-tighter">{Math.round(goalProgress)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700/50 h-5 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-600 transition-all duration-[2000ms] shadow-[0_0_20px_rgba(245,158,11,0.4)]" style={{ width: `${goalProgress}%` }}></div>
                </div>
              </Card>
            </div>

            {/* Recent List */}
            <div className="space-y-6">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter ml-2">Últimas Atividades</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                {data.transactions.length === 0 ? (
                  <div className="text-center py-24 bg-white dark:bg-gray-800/50 rounded-[40px] flex flex-col items-center justify-center p-8">
                    <Wallet size={36} className="text-amber-400 mb-4 opacity-30" />
                    <p className="text-gray-400 font-black uppercase text-xs">Sem registros</p>
                  </div>
                ) : (
                  data.transactions.slice().reverse().slice(0, 8).map(t => (
                    <div key={t.id} className="bg-white dark:bg-gray-800 p-5 rounded-[2.2rem] flex items-center gap-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-transform">
                      <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-2xl text-amber-600">
                        <TrendingUp size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 dark:text-white truncate text-sm">{t.description}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-600 text-sm">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {view === ViewMode.ANALYTICS && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black dark:text-white flex items-center gap-3 uppercase tracking-tighter">
              <BarChart3 className="text-amber-600" size={32} /> Painel de Crescimento
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Histórico Evolutivo */}
              <Card className="lg:col-span-1 space-y-6">
                <h3 className="font-black text-lg dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <Calendar size={18} className="text-amber-500" /> Histórico Evolutivo
                </h3>
                <div className="space-y-5 max-h-[500px] overflow-y-auto pr-3 no-scrollbar">
                  {monthlyData.slice().reverse().map((m, idx) => (
                    <div key={idx} className="relative pl-7 border-l-2 border-amber-200 dark:border-amber-900 pb-7 last:pb-0">
                      <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-4 shadow-md ${m.isPaid ? 'bg-green-500 border-green-200' : 'bg-pink-500 border-pink-200'}`}></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">{m.month}</p>
                          <p className="text-xl font-black dark:text-white tracking-tighter">R$ {m.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 ${
                          m.isPaid ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-pink-50 text-pink-600 border border-pink-200'
                        }`}>
                          {m.isPaid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {m.isPaid ? 'Dízimo Pago' : 'Pendente'}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="text-gray-400">Total: R$ {m.total.toFixed(2)}</span>
                         <span className="text-pink-500">Dízimo: R$ {m.tithe.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {monthlyData.length === 0 && <p className="text-center text-gray-400 py-16 font-black uppercase text-xs tracking-widest">Aguardando dados</p>}
                </div>
              </Card>

              {/* Gráfico */}
              <Card className="lg:col-span-2 gold-glow min-h-[500px]">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="font-black text-xl dark:text-white uppercase tracking-tight">Fluxo de Prosperidade</h3>
                    <div className="bg-amber-100 dark:bg-amber-900/30 px-4 py-1.5 rounded-full text-[10px] font-black text-amber-600 border border-amber-200">Visão Geral</div>
                 </div>
                 <div className="h-[380px]">
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
                       <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} />
                       <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={5} fillOpacity={1} fill="url(#goldGradient)" animationDuration={1500} />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
              </Card>
            </div>
          </div>
        )}

        {view === ViewMode.HISTORY && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <div>
               <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                 <ReceiptText className="text-amber-500" /> Entradas de Patrimônio
               </h2>
               <Card className="p-0 overflow-hidden shadow-2xl">
                 <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                     <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                       <tr>
                         <th className="py-6 px-8">Data</th>
                         <th className="py-6 px-8">Descrição</th>
                         <th className="py-6 px-8">Valor</th>
                         <th className="py-6 px-8 text-center">Ação</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                       {data.transactions.length === 0 ? (
                         <tr><td colSpan={4} className="py-10 text-center text-gray-400 font-bold uppercase text-xs">Nenhum ganho registrado</td></tr>
                       ) : (
                         data.transactions.slice().reverse().map(t => (
                           <tr key={t.id} className="group hover:bg-amber-50/20 transition-all">
                             <td className="py-6 px-8 text-xs font-bold text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                             <td className="py-6 px-8 font-black dark:text-white">{t.description}</td>
                             <td className="py-6 px-8 font-black text-amber-600">R$ {t.amount.toFixed(2)}</td>
                             <td className="py-6 px-8 text-center">
                               <button onClick={() => deleteTransaction(t.id)} className="p-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                 <Trash2 size={18} />
                               </button>
                             </td>
                           </tr>
                         ))
                       )}
                     </tbody>
                   </table>
                 </div>
               </Card>
             </div>

             <div>
               <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                 <HandCoins className="text-pink-500" /> Comprovantes de Dízimo
               </h2>
               <Card className="p-0 overflow-hidden shadow-2xl border-pink-100 dark:border-pink-900/20">
                 <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                     <thead className="bg-pink-50 dark:bg-pink-900/10 text-[10px] uppercase font-black tracking-widest text-pink-400">
                       <tr>
                         <th className="py-6 px-8">Data Pagamento</th>
                         <th className="py-6 px-8">Mês Referência</th>
                         <th className="py-6 px-8">Valor Pago</th>
                         <th className="py-6 px-8 text-center">Ação</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                       {data.tithePayments.length === 0 ? (
                         <tr><td colSpan={4} className="py-10 text-center text-gray-400 font-bold uppercase text-xs">Nenhum pagamento registrado</td></tr>
                       ) : (
                         data.tithePayments.slice().reverse().map(p => {
                           const refDate = new Date(p.date);
                           const refMonth = refDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                           return (
                             <tr key={p.id} className="group hover:bg-pink-50/20 transition-all">
                               <td className="py-6 px-8 text-xs font-bold text-gray-500">{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                               <td className="py-6 px-8 font-black dark:text-white capitalize">{refMonth}</td>
                               <td className="py-6 px-8 font-black text-pink-600">R$ {p.amount.toFixed(2)}</td>
                               <td className="py-6 px-8 text-center">
                                 <button onClick={() => deleteTithePayment(p.id)} className="p-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                   <Trash2 size={18} />
                                 </button>
                               </td>
                             </tr>
                           );
                         })
                       )}
                     </tbody>
                   </table>
                 </div>
               </Card>
             </div>
          </div>
        )}

        {view === ViewMode.SETTINGS && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700">
             <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Configurações</h2>
             <Card className="space-y-8 divide-y divide-gray-100 dark:divide-gray-700 shadow-2xl">
                <div className="pb-2">
                  <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm mb-4">Gerenciar Dados</h3>
                  <div className="flex flex-col gap-4">
                    <button onClick={exportData} className="w-full bg-amber-600 text-white font-black py-5 rounded-3xl uppercase text-xs tracking-widest shadow-lg">Exportar Backup</button>
                    <label className="w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-white font-black py-5 rounded-3xl cursor-pointer uppercase text-xs tracking-widest border-2 border-dashed">
                      Importar Backup
                      <input type="file" className="hidden" accept=".json" onChange={importData} />
                    </label>
                  </div>
                </div>
                <div className="pt-8">
                  <button onClick={clearData} className="w-full text-red-500 font-black py-4 rounded-3xl border-2 border-dashed border-red-200 uppercase tracking-widest text-xs">Limpar Tudo</button>
                </div>
             </Card>
          </div>
        )}
      </main>

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl p-2.5 rounded-[45px] shadow-2xl border border-white/40 dark:border-gray-700 z-50 flex items-center gap-2 w-[92%] max-w-lg">
        {[
          { id: ViewMode.DASHBOARD, icon: Wallet, label: 'Início' },
          { id: ViewMode.HISTORY, icon: History, label: 'Registros' },
          { id: ViewMode.ANALYTICS, icon: BarChart3, label: 'Painel' },
          { id: ViewMode.SETTINGS, icon: SettingsIcon, label: 'Ajustes' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-[35px] transition-all relative ${
              view === item.id 
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl -translate-y-2' 
                : 'text-gray-400 hover:text-amber-500'
            }`}
          >
            <item.icon size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Modais */}
      {isAddingIncome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <Card className="w-full max-w-xl shadow-2xl relative overflow-hidden gold-glow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600"></div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Novo Recebimento</h3>
              <button onClick={() => setIsAddingIncome(false)} className="text-gray-400 hover:text-red-500 transition-all rotate-45 active:scale-90">
                <Plus size={32} />
              </button>
            </div>
            <form onSubmit={handleAddIncome} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-2">Descrição do Ganho</label>
                <input autoFocus required type="text" value={incomeForm.description} onChange={e => setIncomeForm({...incomeForm, description: e.target.value})} className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-[2rem] p-6 focus:ring-4 focus:ring-amber-500/30 outline-none dark:text-white font-black text-lg" placeholder="Ex: Salário Mensal" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-2">Valor (R$)</label>
                  <input required type="number" step="0.01" value={incomeForm.amount} onChange={e => setIncomeForm({...incomeForm, amount: e.target.value})} className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-[2rem] p-6 focus:ring-4 focus:ring-amber-500/30 outline-none dark:text-white font-black text-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-2">Data</label>
                  <input required type="date" value={incomeForm.date} onChange={e => setIncomeForm({...incomeForm, date: e.target.value})} className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-[2rem] p-6 focus:ring-4 focus:ring-amber-500/30 outline-none dark:text-white font-black" />
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-amber-700 text-white font-black py-6 rounded-[2.5rem] shadow-2xl uppercase tracking-widest text-sm">Registrar</button>
            </form>
          </Card>
        </div>
      )}

      {isAddingTithe && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <Card className="w-full max-w-xl shadow-2xl relative overflow-hidden gold-glow border-pink-100/20">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500"></div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Pagar Dízimo</h3>
              <button onClick={() => setIsAddingTithe(false)} className="text-gray-400 hover:text-red-500 transition-all rotate-45 active:scale-90">
                <Plus size={32} />
              </button>
            </div>
            <form onSubmit={handleAddTithe} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-2">Valor Pago (R$)</label>
                  <input required type="number" step="0.01" value={titheForm.amount} onChange={e => setTitheForm({...titheForm, amount: e.target.value})} className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-[2rem] p-6 focus:ring-4 focus:ring-pink-500/30 outline-none dark:text-white font-black text-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-2">Data do Pagamento</label>
                  <input required type="date" value={titheForm.date} onChange={e => setTitheForm({...titheForm, date: e.target.value})} className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-[2rem] p-6 focus:ring-4 focus:ring-pink-500/30 outline-none dark:text-white font-black" />
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-pink-700 text-white font-black py-6 rounded-[2.5rem] shadow-2xl uppercase tracking-widest text-sm">Confirmar Pagamento</button>
            </form>
          </Card>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <Card className="w-full max-w-sm shadow-2xl gold-glow">
            <h3 className="text-2xl font-black mb-4 dark:text-white uppercase">Definir Meta</h3>
            <input type="number" value={tempGoal} onChange={e => setTempGoal(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-2xl p-4 focus:ring-4 focus:ring-amber-500/30 outline-none dark:text-white font-black text-xl mb-6" />
            <div className="flex gap-4">
              <button onClick={() => setShowGoalModal(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-xs tracking-widest">Sair</button>
              <button onClick={handleUpdateGoal} className="flex-1 bg-amber-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest">Salvar</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default App;