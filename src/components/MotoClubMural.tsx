import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Heart, 
  Cake, 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  ShieldCheck, 
  Clock,
  MoreVertical,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Post {
  id: string;
  author: {
    name: string;
    photo: string;
    role: string;
  };
  type: 'meeting' | 'birthday' | 'social' | 'general';
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  image?: string;
}

const MOCK_MURAL_POSTS: Post[] = [
  {
    id: '1',
    author: {
      name: 'Ricardo "Veludo"',
      photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
      role: 'Presidente'
    },
    type: 'meeting',
    content: '🚨 ATENÇÃO IRMÃOS! Bate-fica confirmado para o próximo sábado. Destino: Serra da Graciosa. Saída do ponto zero às 08:30 em ponto. Tanque cheio e união total.',
    timestamp: '2 horas atrás',
    likes: 34,
    comments: 8,
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    author: {
      name: 'Carla "Fênix"',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      role: 'Tesoureira'
    },
    type: 'social',
    content: 'Arrecadação de agasalhos para o Lar dos Idosos foi um sucesso! Conseguimos mais de 200kg de doações. Obrigado a todos que fortaleceram essa ação social.',
    timestamp: '5 horas atrás',
    likes: 56,
    comments: 12
  },
  {
    id: '3',
    author: {
      name: 'Beto "Trovoada"',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      role: 'Road Captain'
    },
    type: 'birthday',
    content: 'Hoje o ronco dos motores é em homenagem ao nosso irmão Marcos "Ninja" que completa mais um ano de asfalto! Vida longa, irmão! 🎂🏍️',
    timestamp: '8 horas atrás',
    likes: 42,
    comments: 15
  }
];

export function MotoClubMural() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(MOCK_MURAL_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  const [activeType, setActiveType] = useState<Post['type']>('general');

  const getTypeStyle = (type: Post['type']) => {
    switch (type) {
      case 'meeting': return { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Encontro' };
      case 'birthday': return { icon: Cake, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Aniversário' };
      case 'social': return { icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Ação Social' };
      default: return { icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Informativo' };
    }
  };

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    
    const newPost: Post = {
      id: Date.now().toString(),
      author: {
        name: 'Piloto Convidado',
        photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200',
        role: 'Membro Elite'
      },
      type: activeType,
      content: newPostContent,
      timestamp: 'Agora mesmo',
      likes: 0,
      comments: 0
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(`/motoclub/${id}`)}
              className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition-all text-slate-500 hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-black italic uppercase tracking-tighter shadow-sm">MURAL DA IRMANDADE</h1>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck size={14} className="text-orange-500" />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">ÁREA RESTRITA A MEMBROS</span>
              </div>
            </div>
          </div>
          
          <div className="flex -space-x-2">
            {[1,2,3,4].map(i => (
              <img 
                key={i} 
                src={`https://i.pravatar.cc/100?img=${i+10}`} 
                className="w-8 h-8 rounded-full border-2 border-slate-950 ring-2 ring-slate-900/50" 
                alt="Member" 
              />
            ))}
            <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black">+42</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Create Post Area */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-focus-within:opacity-20 transition-opacity">
            <MessageSquare size={120} className="text-orange-500" />
          </div>

          <div className="flex items-start gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-orange-600 p-1 shrink-0">
               <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover rounded-xl" alt="User" />
            </div>
            <div className="flex-1 space-y-4">
              <textarea 
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="O que está acontecendo na estrada, irmão?"
                className="w-full bg-transparent border-none text-lg font-medium placeholder:text-slate-700 outline-none resize-none h-24"
              />
              
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => setActiveType('general')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                    activeType === 'general' ? "bg-orange-600 border-orange-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"
                  )}
                >
                  <MessageSquare size={12} /> Informativo
                </button>
                <button 
                   onClick={() => setActiveType('meeting')}
                   className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                    activeType === 'meeting' ? "bg-blue-600 border-blue-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"
                  )}
                >
                  <Calendar size={12} /> Encontro
                </button>
                <button 
                   onClick={() => setActiveType('social')}
                   className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                    activeType === 'social' ? "bg-red-600 border-red-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"
                  )}
                >
                  <Heart size={12} /> Ação Social
                </button>
                <button 
                   onClick={() => setActiveType('birthday')}
                   className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                    activeType === 'birthday' ? "bg-pink-600 border-pink-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"
                  )}
                >
                  <Cake size={12} /> Aniversário
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
            <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
              <ImageIcon size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Anexar Foto</span>
            </button>
            <button 
              onClick={handlePost}
              disabled={!newPostContent.trim()}
              className="flex items-center gap-3 px-8 py-3 bg-white text-black rounded-2xl font-black italic uppercase tracking-[0.2em] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-xl"
            >
              Publicar <Send size={14} />
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-8 pb-32">
          {posts.map((post) => {
            const style = getTypeStyle(post.type);
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={post.id} 
                className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] overflow-hidden group"
              >
                {/* Post Header */}
                <div className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={post.author.photo} className="w-12 h-12 rounded-2xl object-cover shrink-0" alt={post.author.name} />
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-black italic uppercase text-white tracking-tight">{post.author.name}</h3>
                        <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[8px] font-black uppercase tracking-[0.2em] text-orange-500 italic">{post.author.role}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={10} className="text-slate-600" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">{post.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-slate-700 hover:text-white transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>

                {/* Post Content */}
                <div className="px-8 pb-8 space-y-6">
                  <div className="flex items-start gap-4">
                     <div className={cn("p-2 rounded-xl mt-1 shrink-0", style.bg, style.color)}>
                        <style.icon size={16} />
                     </div>
                     <p className="text-slate-300 font-medium leading-relaxed">
                        {post.content}
                     </p>
                  </div>
                  
                  {post.image && (
                    <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/50 aspect-video relative group/img">
                      <img src={post.image} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-[1.03]" alt="Post" />
                    </div>
                  )}

                  {/* Interaction Bar */}
                  <div className="flex items-center gap-8 pt-4">
                    <button className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors group/stat">
                      <div className="p-2 rounded-full group-hover/stat:bg-orange-500/10 transition-colors">
                        <Heart size={18} className={post.likes > 40 ? "fill-orange-500 text-orange-500" : ""} />
                      </div>
                      <span className="text-xs font-black">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors group/stat">
                      <div className="p-2 rounded-full group-hover/stat:bg-blue-500/10 transition-colors">
                        <MessageSquare size={18} />
                      </div>
                      <span className="text-xs font-black">{post.comments}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
