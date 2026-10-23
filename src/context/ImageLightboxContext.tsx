import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface ImageLightboxState {
  isOpen: boolean;
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

interface ImageLightboxContextType {
  state: ImageLightboxState;
  openImage: (url: string, title?: string, subtitle?: string) => void;
  closeImage: () => void;
}

const ImageLightboxContext = createContext<ImageLightboxContextType | undefined>(undefined);

/**
 * Função utilitária global para abrir o popup de imagem de qualquer lugar da aplicação
 */
export function triggerGlobalImageLightbox(imageUrl: string, title?: string, subtitle?: string) {
  if (!imageUrl) return;
  window.dispatchEvent(new CustomEvent('motolegado_open_lightbox', {
    detail: { imageUrl, title, subtitle }
  }));
}

export function ImageLightboxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImageLightboxState>({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: '',
  });

  const openImage = useCallback((url: string, title?: string, subtitle?: string) => {
    if (!url) return;
    setState({
      isOpen: true,
      imageUrl: url,
      title: title || 'Visualização da Foto',
      subtitle: subtitle || 'MotoLegado • Registro em alta resolução',
    });
  }, []);

  const closeImage = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // 1. Escuta evento global disparado por qualquer componente
  useEffect(() => {
    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ imageUrl: string; title?: string; subtitle?: string }>;
      if (customEvent.detail?.imageUrl) {
        openImage(customEvent.detail.imageUrl, customEvent.detail.title, customEvent.detail.subtitle);
      }
    };

    window.addEventListener('motolegado_open_lightbox', handleCustomOpen);
    return () => window.removeEventListener('motolegado_open_lightbox', handleCustomOpen);
  }, [openImage]);

  // 2. Interceptor inteligente em nível de documento para cliques em imagens de cards, fotos, logos e motos
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Se for uma tag <img>
      if (target.tagName.toLowerCase() === 'img') {
        const img = target as HTMLImageElement;

        // Ignora imagens explicitamente marcadas com data-no-lightbox
        if (img.getAttribute('data-no-lightbox') === 'true' || img.closest('[data-no-lightbox="true"]')) {
          return;
        }

        // Ignora ícones minúsculos e logos de menos de 38px
        const rect = img.getBoundingClientRect();
        if ((rect.width > 0 && rect.width < 38) || (rect.height > 0 && rect.height < 38)) {
          return;
        }

        // Ignora se for o avatar dentro do botão dropdown do topo da barra de navegação
        if (img.closest('[data-tour="navbar-profile"]')) {
          return;
        }

        const src = img.currentSrc || img.src || img.getAttribute('src');
        if (!src || src.startsWith('data:image/svg+xml') && src.length < 300) {
          // Ignora SVGs inline decorativos vazios
          return;
        }

        // Extrai título amigável baseado no alt, título ou card pai
        const alt = img.alt || img.title || img.getAttribute('aria-label');
        const cardParent = img.closest('[data-card-title], .bento-card, .partner-card, article');
        const parentTitle = cardParent?.getAttribute('data-card-title') || cardParent?.querySelector('h2, h3, h4')?.textContent?.trim();

        const displayTitle = alt && alt.length > 2 
          ? alt 
          : (parentTitle ? `${parentTitle}` : 'Registro Fotográfico');

        const displaySubtitle = parentTitle && parentTitle !== alt 
          ? parentTitle 
          : 'Clique ou use a roda do mouse para ampliar';

        // Previne navegação indesejada caso o clique seja na imagem dentro de um card com link
        e.stopPropagation();

        openImage(src, displayTitle, displaySubtitle);
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => document.removeEventListener('click', handleDocumentClick, { capture: true });
  }, [openImage]);

  // 3. Atalho de tecla Esc para fechar o popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen, closeImage]);

  return (
    <ImageLightboxContext.Provider value={{ state, openImage, closeImage }}>
      {children}
    </ImageLightboxContext.Provider>
  );
}

export function useImageLightbox() {
  const context = useContext(ImageLightboxContext);
  if (!context) {
    throw new Error('useImageLightbox deve ser utilizado dentro de ImageLightboxProvider');
  }
  return context;
}

export default ImageLightboxContext;
