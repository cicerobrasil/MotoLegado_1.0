import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BellRing, 
  Check, 
  Trash2, 
  MapPin, 
  Navigation, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  Radio, 
  X,
  Clock,
  Compass,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RouteShareNotification, 
  fetchNotifications, 
  markNotificationAsRead, 
  clearAllNotifications, 
  getPushPermissionStatus, 
  requestPushPermission, 
  testPushNotification,
  getLocalNotifications
} from '../lib/pushNotifications';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<RouteShareNotification[]>([]);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isTesting, setIsTesting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const pilotId = profile?.id || user?.id || '';

  // Carrega permissão e notificações iniciais
  const refreshData = async () => {
    setPermission(getPushPermissionStatus());
    const list = await fetchNotifications(pilotId);
    setNotifications(list);
  };

  useEffect(() => {
    refreshData();

    // Atualiza periodicamente e escuta eventos de novas notificações
    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener('motolegado-notification-update', handleUpdate);
    const interval = setInterval(refreshData, 20000); // Polling a cada 20s

    return () => {
      window.removeEventListener('motolegado-notification-update', handleUpdate);
      clearInterval(interval);
    };
  }, [pilotId]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRequestPermission = async () => {
    const granted = await requestPushPermission();
    setPermission(getPushPermissionStatus());
    if (granted) {
      // Dispara teste imediato para confirmar ao usuário
      await testPushNotification();
    }
  };

  const handleTestPush = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTesting(true);
    try {
      await testPushNotification();
    } finally {
      setTimeout(() => setIsTesting(false), 800);
    }
  };

  const handleNotificationClick = async (notif: RouteShareNotification) => {
    await markNotificationAsRead(notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setIsOpen(false);

    // Navega para a aba de rotas com o ID do roteiro especificado
    if (notif.route_id) {
      navigate(`/routes?routeId=${encodeURIComponent(notif.route_id)}`);
    } else {
      navigate('/routes');
    }
  };

  const handleMarkAllAsRead = async () => {
    for (const notif of notifications) {
      if (!notif.read) {
        await markNotificationAsRead(notif.id);
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = async () => {
    await clearAllNotifications(pilotId);
    setNotifications([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de Sino de Notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border",
          isOpen
            ? "bg-orange-500/20 border-orange-500 text-orange-400"
            : unreadCount > 0
              ? "bg-[#00273d] border-orange-500/60 text-orange-400 shadow-md shadow-orange-500/20 hover:border-orange-500"
              : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
        )}
        title="Notificações de Roteiros Compartilhados"
        aria-label="Notificações"
      >
        {unreadCount > 0 ? (
          <BellRing size={18} className="animate-wiggle text-orange-400" />
        ) : (
          <Bell size={18} />
        )}

        {/* Badge com Contador de Não Lidas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] text-[10px] font-black font-mono leading-none rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-[#001b3d] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-[330px] sm:w-[390px] max-w-[calc(100vw-24px)] bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Compass size={17} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black italic uppercase tracking-wider text-white flex items-center gap-2">
                    Roteiros Compartilhados
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Notificações de expedições e novos trajetos
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Status Push Service Worker Banner */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80">
              {permission === 'granted' ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Push do Service Worker Ativo</span>
                  </div>
                  <button
                    onClick={handleTestPush}
                    disabled={isTesting}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border border-slate-700 active:scale-95 disabled:opacity-50"
                    title="Enviar notificação de teste agora"
                  >
                    <Radio size={12} className={isTesting ? "animate-spin text-orange-400" : "text-emerald-400"} />
                    <span>{isTesting ? "Enviando..." : "Testar Push"}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-amber-300 text-[11px]">
                    <Sparkles size={14} className="shrink-0 mt-0.5 text-amber-400" />
                    <p className="text-[10.5px] leading-tight text-slate-300">
                      Receba avisos no seu celular ou desktop quando contatos compartilharem novos roteiros.
                    </p>
                  </div>
                  <button
                    onClick={handleRequestPermission}
                    className="w-full py-2 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 transition-all cursor-pointer active:scale-95"
                  >
                    <ShieldCheck size={13} />
                    <span>Ativar Notificações Push do Sistema</span>
                  </button>
                </div>
              )}
            </div>

            {/* Lista de Notificações */}
            <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="py-10 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                    <Compass size={22} className="opacity-60" />
                  </div>
                  <p className="text-xs font-black uppercase text-slate-400">
                    Nenhum Roteiro Compartilhado
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                    Quando seus contatos compartilharem novas viagens, os alertas aparecerão instantaneamente aqui.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "p-3 rounded-2xl transition-all cursor-pointer relative group flex items-start gap-3 border",
                      notif.read
                        ? "bg-slate-900/40 border-transparent hover:bg-slate-800/50 hover:border-slate-800"
                        : "bg-gradient-to-r from-orange-500/10 via-slate-900/60 to-slate-900 border-orange-500/30 shadow-sm hover:border-orange-500/60"
                    )}
                  >
                    {/* Imagem do Roteiro ou Avatar */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-800 bg-slate-950">
                      <img
                        src={notif.route_image || notif.sender_avatar || '/favicon-32x32.png'}
                        alt={notif.route_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/favicon-32x32.png';
                        }}
                      />
                      {!notif.read && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-orange-500 border border-slate-950 shadow-sm" />
                      )}
                    </div>

                    {/* Conteúdo Textual */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase text-orange-400 truncate">
                          {notif.sender_name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono shrink-0 flex items-center gap-1">
                          <Clock size={9} />
                          {new Date(notif.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-xs font-black italic uppercase text-white truncate group-hover:text-orange-400 transition-colors">
                        {notif.route_name}
                      </h4>

                      <p className="text-[10.5px] text-slate-300 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.route_destination && (
                        <div className="flex items-center gap-1 text-[9.5px] text-slate-400 truncate pt-0.5">
                          <MapPin size={10} className="text-orange-500 shrink-0" />
                          <span className="truncate">{notif.route_destination}</span>
                          {notif.route_distance ? (
                            <span className="text-orange-400 font-mono font-bold shrink-0">
                              • ~{notif.route_distance} km
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Seta de Ação */}
                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-orange-400 shrink-0">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer com Ações */}
            {notifications.length > 0 && (
              <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[10px] font-black uppercase">
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check size={12} className="text-emerald-400" />
                  <span>Marcar Lidas</span>
                </button>

                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Limpar Todas</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationsBell;
