import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, XCircle, RefreshCw, Zap, Server, Clock, Terminal } from 'lucide-react';
import { clientDbService } from '../lib/dbService';
import { cn } from '../lib/utils';

interface PingResult {
  success: boolean;
  status: 'Conectado' | 'Erro de Conexão';
  query: string;
  latencyMs?: number;
  host?: string;
  database?: string;
  user?: string;
  message: string;
  result?: Array<{ ping: number; server_time?: string; current_database?: string; mysql_version?: string }>;
  error?: string;
  timestamp: string;
}

interface MySqlPingTestProps {
  className?: string;
  autoRunOnMount?: boolean;
}

export function MySqlPingTest({ className, autoRunOnMount = true }: MySqlPingTestProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [pingData, setPingData] = useState<PingResult | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const executePing = async () => {
    setIsRunning(true);
    try {
      const response = await clientDbService.status.pingSelect1();
      if (response && response.data) {
        setPingData(response.data);
      } else {
        setPingData({
          success: false,
          status: 'Erro de Conexão',
          query: 'SELECT 1 AS ping',
          message: response?.error || 'Não foi possível se comunicar com o servidor da aplicação.',
          error: response?.error || 'Falha de rede ou timeout.',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setPingData({
        success: false,
        status: 'Erro de Conexão',
        query: 'SELECT 1 AS ping',
        message: err?.message || 'Exceção ao executar SELECT 1 no banco.',
        error: err?.message || String(err),
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
      setHasRun(true);
    }
  };

  useEffect(() => {
    if (autoRunOnMount) {
      executePing();
    }
  }, [autoRunOnMount]);

  return (
    <div className={cn(
      "bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm",
      className
    )}>
      {/* Decorative background glow based on status */}
      <div className={cn(
        "absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-20",
        pingData?.status === 'Conectado' ? "bg-emerald-500" : (pingData?.status === 'Erro de Conexão' ? "bg-red-500" : "bg-amber-500")
      )} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center border transition-all shrink-0",
            pingData?.status === 'Conectado' 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : (pingData?.status === 'Erro de Conexão' 
                ? "bg-red-500/10 border-red-500/30 text-red-400" 
                : "bg-amber-500/10 border-amber-500/30 text-amber-400")
          )}>
            <Database size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black italic uppercase tracking-wider text-white">
                Teste de Conexão Hostinger MySQL
              </h3>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                mysql2
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Executa consulta direta <code className="text-amber-400 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 text-[11px]">SELECT 1</code> no banco da Hostinger
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={executePing}
          disabled={isRunning}
          className={cn(
            "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 shrink-0",
            isRunning 
              ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed" 
              : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10 hover:shadow-amber-500/20"
          )}
        >
          <RefreshCw size={14} className={cn(isRunning && "animate-spin text-slate-950")} />
          <span>{isRunning ? "Executando Query..." : "Executar SELECT 1"}</span>
        </button>
      </div>

      {/* Main Status Display */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Visual Feedback Badge */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Feedback Visual de Status
          </span>
          <div className="mt-2 flex items-center gap-2.5">
            {isRunning ? (
              <div className="flex items-center gap-2 text-amber-400 font-black text-base animate-pulse">
                <RefreshCw size={18} className="animate-spin" />
                <span>Testando Conexão...</span>
              </div>
            ) : pingData?.status === 'Conectado' ? (
              <div className="flex items-center gap-2 text-emerald-400 font-black text-base">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span>Conectado</span>
              </div>
            ) : pingData?.status === 'Erro de Conexão' ? (
              <div className="flex items-center gap-2 text-red-400 font-black text-base">
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <XCircle size={20} className="text-red-400" />
                <span>Erro de Conexão</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <Clock size={16} />
                <span>Aguardando Teste</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-2 font-mono">
            {pingData?.timestamp ? `Última verificação: ${new Date(pingData.timestamp).toLocaleTimeString('pt-BR')}` : 'Nenhum teste executado'}
          </span>
        </div>

        {/* Latência & Protocolo */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Latência da Consulta</span>
            <Zap size={12} className="text-amber-400" />
          </span>
          <div className="mt-2">
            <span className={cn(
              "text-2xl font-black font-mono",
              pingData?.latencyMs !== undefined
                ? (pingData.latencyMs < 200 ? "text-emerald-400" : pingData.latencyMs < 800 ? "text-amber-400" : "text-red-400")
                : "text-slate-600"
            )}>
              {pingData?.latencyMs !== undefined ? `${pingData.latencyMs} ms` : '—'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 font-mono">
            <Server size={11} />
            <span>Driver: mysql2/promise</span>
          </span>
        </div>

        {/* Detalhes do Alvo Hostinger */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Alvo do Banco de Dados
          </span>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Host:</span>
              <span className="text-white font-bold truncate max-w-[140px]">{pingData?.host || 'srv891.hstgr.io'}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Base:</span>
              <span className="text-amber-400 font-bold truncate max-w-[140px]">{pingData?.database || 'u342198764_motolegado'}</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 font-mono">
            Porta: 3306 (TCP)
          </span>
        </div>
      </div>

      {/* Query & Detailed Terminal View */}
      {hasRun && pingData && (
        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-900 pb-2">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Terminal size={13} className="text-amber-400" />
              Consulta Executada:
            </span>
            <span className="text-amber-400/90 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {pingData.query}
            </span>
          </div>

          <div className="text-[11px] leading-relaxed pt-1">
            <div className="flex items-start gap-2">
              <span className="text-slate-500 select-none">&gt;</span>
              <div className="flex-1">
                <span className={cn(
                  "font-bold",
                  pingData.status === 'Conectado' ? "text-emerald-400" : "text-red-400"
                )}>
                  [{pingData.status}] {pingData.message}
                </span>
                
                {pingData.result && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">// Retorno JSON da linha MySQL (SELECT 1):</span>
                    <pre className="text-emerald-300">{JSON.stringify(pingData.result, null, 2)}</pre>
                  </div>
                )}

                {pingData.error && (
                  <div className="mt-2 p-2.5 rounded-lg bg-red-950/20 border border-red-500/30 text-[11px] text-red-300">
                    <span className="text-red-400 block text-[10px] uppercase font-bold mb-0.5">Detalhe do Erro:</span>
                    <span>{pingData.error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MySqlPingTest;
