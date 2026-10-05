import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
  buttonClassName?: string;
  showButton?: boolean;
  returnFormat?: 'auto' | 'iso' | 'br';
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseDateParts(str?: string): { year: number; month: number; day: number } | null {
  if (!str) return null;
  const trimmed = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { year: y, month: m - 1, day: d };
    }
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { year: y, month: m - 1, day: d };
    }
  }
  return null;
}

function formatDateToIso(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function formatDateToBr(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${d}/${m}/${year}`;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  className,
  containerClassName,
  buttonClassName,
  showButton = true,
  disabled,
  placeholder = "DD/MM/AAAA",
  returnFormat = 'auto',
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determina o formato de retorno (ISO YYYY-MM-DD ou BR DD/MM/AAAA)
  const isBrFormat = useMemo(() => {
    if (returnFormat === 'br') return true;
    if (returnFormat === 'iso') return false;
    return typeof value === 'string' && value.includes('/');
  }, [returnFormat, value]);

  // Data selecionada atualmente decomposta
  const selectedDateParts = useMemo(() => parseDateParts(value), [value]);

  // Texto amigável exibido no input (sempre DD/MM/AAAA para o usuário)
  const [inputText, setInputText] = useState(() => {
    if (!value) return '';
    const parts = parseDateParts(value);
    if (parts) return formatDateToBr(parts.year, parts.month, parts.day);
    return value;
  });

  // Atualiza o texto visual sempre que o prop 'value' mudar externamente
  useEffect(() => {
    if (!value) {
      setInputText('');
      return;
    }
    const parts = parseDateParts(value);
    if (parts) {
      setInputText(formatDateToBr(parts.year, parts.month, parts.day));
    } else {
      setInputText(value);
    }
  }, [value]);

  // Mês e ano atualmente visualizados no calendário
  const [viewDate, setViewDate] = useState(() => {
    const parts = parseDateParts(value);
    if (parts) return new Date(parts.year, parts.month, 1);
    return new Date();
  });

  // Sincroniza viewDate quando o calendário é aberto
  const handleToggleCalendar = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;

    if (!isOpen) {
      const parts = parseDateParts(value);
      if (parts) {
        setViewDate(new Date(parts.year, parts.month, 1));
      } else {
        setViewDate(new Date());
      }
    }
    setIsOpen(prev => !prev);
  };

  // Fecha calendário ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navegação do calendário
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handlePrevYear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(currentYear - 1, currentMonth, 1));
  };

  const handleNextYear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(currentYear + 1, currentMonth, 1));
  };

  // Seleção de data a partir do clique no calendário
  const handleSelectDay = (day: number) => {
    const formatted = isBrFormat 
      ? formatDateToBr(currentYear, currentMonth, day) 
      : formatDateToIso(currentYear, currentMonth, day);

    onChange(formatted);
    setInputText(formatDateToBr(currentYear, currentMonth, day));
    setIsOpen(false);
  };

  // Seleciona data de hoje
  const handleSelectToday = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    const formatted = isBrFormat ? formatDateToBr(y, m, d) : formatDateToIso(y, m, d);
    onChange(formatted);
    setInputText(formatDateToBr(y, m, d));
    setViewDate(new Date(y, m, 1));
    setIsOpen(false);
  };

  // Limpa o campo
  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    setInputText('');
    setIsOpen(false);
  };

  // Digitação manual com máscara DD/MM/AAAA
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.slice(0, 8);

    let masked = raw;
    if (raw.length >= 3 && raw.length <= 4) {
      masked = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    } else if (raw.length >= 5) {
      masked = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)}`;
    }

    setInputText(masked);

    // Quando digitar a data completa válida
    if (masked.length === 10) {
      const parts = parseDateParts(masked);
      if (parts) {
        const out = isBrFormat 
          ? formatDateToBr(parts.year, parts.month, parts.day) 
          : formatDateToIso(parts.year, parts.month, parts.day);
        onChange(out);
      }
    } else if (masked.length === 0) {
      onChange('');
    }
  };

  // Grid de dias do mês
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Dom, 6 = Sáb
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    const now = new Date();
    const isTodayYear = now.getFullYear() === currentYear;
    const isTodayMonth = now.getMonth() === currentMonth;
    const todayDay = now.getDate();

    // Dias do mês anterior para completar a semana
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false
      });
    }

    // Dias do mês atual
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const isSelected = !!selectedDateParts &&
        selectedDateParts.year === currentYear &&
        selectedDateParts.month === currentMonth &&
        selectedDateParts.day === day;

      const isToday = isTodayYear && isTodayMonth && todayDay === day;

      days.push({
        day,
        isCurrentMonth: true,
        isSelected,
        isToday
      });
    }

    // Dias do próximo mês para fechar a grade (múltiplo de 7)
    const remaining = 42 - days.length;
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        days.push({
          day,
          isCurrentMonth: false,
          isSelected: false,
          isToday: false
        });
      }
    } else {
      const needed = 35 - days.length;
      for (let day = 1; day <= needed; day++) {
        days.push({
          day,
          isCurrentMonth: false,
          isSelected: false,
          isToday: false
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, selectedDateParts]);

  return (
    <div ref={containerRef} className={cn("relative group/date flex items-center select-none", containerClassName)}>
      {/* Input de texto com máscara amigável */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={inputText}
        disabled={disabled}
        placeholder={placeholder}
        onChange={handleInputChange}
        onClick={() => {
          if (!isOpen) handleToggleCalendar();
        }}
        className={cn(
          "w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-4 pl-5 pr-14 text-[13px] font-bold text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-all cursor-pointer",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
        {...rest}
      />

      {/* Botão de calendário à direita destacado (clique para abrir o popover) */}
      {showButton && (
        <button
          type="button"
          onClick={handleToggleCalendar}
          disabled={disabled}
          title="Abrir calendário"
          aria-label="Abrir calendário"
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500/25 border border-orange-500/30 active:scale-95 transition-all cursor-pointer z-10 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group-hover/date:border-orange-500/50",
            isOpen && "bg-orange-500/30 border-orange-500 text-white shadow-md shadow-orange-500/20",
            buttonClassName
          )}
        >
          <Calendar size={18} className="drop-shadow-sm transition-transform group-hover/date:scale-110 text-orange-400 group-hover/date:text-orange-300" />
        </button>
      )}

      {/* POPUP DE CALENDÁRIO ELEGANTE E 100% FUNCIONAL */}
      {isOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2.5 z-50 w-[300px] sm:w-[320px] bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Cabeçalho de Navegação de Mês e Ano */}
          <div className="flex items-center justify-between gap-1 mb-3 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevYear}
                title="Ano anterior"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} className="stroke-[3]" />
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mês anterior"
                className="p-1.5 rounded-lg text-slate-300 hover:text-orange-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="text-center font-black tracking-wide text-sm text-slate-100 flex items-center justify-center gap-1.5">
              <span className="text-orange-400">{MONTHS_PT[currentMonth]}</span>
              <span className="text-slate-400 font-bold">{currentYear}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNextMonth}
                title="Próximo mês"
                className="p-1.5 rounded-lg text-slate-300 hover:text-orange-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                onClick={handleNextYear}
                title="Próximo ano"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight size={14} className="stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAYS_PT.map((dayName, idx) => (
              <span 
                key={dayName} 
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider py-1",
                  idx === 0 || idx === 6 ? "text-orange-500/70" : "text-slate-400"
                )}
              >
                {dayName}
              </span>
            ))}
          </div>

          {/* Grade de Dias */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((item, idx) => {
              if (!item.isCurrentMonth) {
                return (
                  <span
                    key={`other-${idx}`}
                    className="h-8 flex items-center justify-center text-xs font-semibold text-slate-600/40 select-none cursor-default"
                  >
                    {item.day}
                  </span>
                );
              }

              return (
                <button
                  key={`day-${item.day}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectDay(item.day);
                  }}
                  className={cn(
                    "h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer select-none",
                    item.isSelected
                      ? "bg-orange-500 text-white font-black shadow-lg shadow-orange-500/40 scale-105 z-10 ring-2 ring-orange-400/50"
                      : item.isToday
                      ? "border border-orange-500/70 text-orange-400 hover:bg-orange-500/20 hover:text-white font-extrabold"
                      : "text-slate-200 hover:bg-slate-800 hover:text-white active:scale-95"
                  )}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Rodapé com Atalhos Rápidos */}
          <div className="flex items-center justify-between pt-3 mt-2.5 border-t border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-2.5 py-1.5 rounded-lg text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check size={13} className="stroke-[3]" /> Hoje
            </button>

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
