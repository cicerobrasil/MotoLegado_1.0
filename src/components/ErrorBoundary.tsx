import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MotoLegado ErrorBoundary caught an error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  private handleClearDataAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-slate-900 border-2 border-orange-500/60 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto text-orange-500 shadow-lg">
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                MOTO<span className="text-orange-500">LEGADO</span>
              </h1>
              <p className="text-slate-300 text-sm font-medium">
                Ocorreu uma pequena instabilidade ao carregar a interface. Clique abaixo para restabelecer a conexão.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-black/50 rounded-xl border border-slate-800 text-xs text-orange-300 font-mono text-left overflow-x-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/30 active:scale-95"
              >
                <RotateCcw size={16} />
                <span>Recarregar MotoLegado</span>
              </button>

              <button
                onClick={this.handleClearDataAndReload}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Home size={14} />
                <span>Limpar Cache & Reiniciar</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
