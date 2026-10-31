import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface ImageLightboxState {
  isOpen: boolean;
  imageUrl: string;
  images: string[];
  currentIndex: number;
  title?: string;
  subtitle?: string;
}

interface ImageLightboxContextType {
  state: ImageLightboxState;
  openImage: (url: string, title?: string, subtitle?: string, images?: string[], initialIndex?: number) => void;
  openCarousel: (images: string[], initialIndex?: number, title?: string, subtitle?: string) => void;
  nextImage: () => void;
  prevImage: () => void;
  goToIndex: (index: number) => void;
  closeImage: () => void;
}

const ImageLightboxContext = createContext<ImageLightboxContextType | undefined>(undefined);

/**
 * Função utilitária global para abrir o popup de imagem / carrossel de qualquer lugar da aplicação
 */
export function triggerGlobalImageLightbox(
  imageUrl: string, 
  title?: string, 
  subtitle?: string,
  images?: string[],
  initialIndex?: number
) {
  if (!imageUrl && (!images || images.length === 0)) return;
  window.dispatchEvent(new CustomEvent('motolegado_open_lightbox', {
    detail: { imageUrl, title, subtitle, images, initialIndex }
  }));
}

export function ImageLightboxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImageLightboxState>({
    isOpen: false,
    imageUrl: '',
    images: [],
    currentIndex: 0,
    title: '',
    subtitle: '',
  });

  const openImage = useCallback((
    url: string, 
    title?: string, 
    subtitle?: string,
    imagesList?: string[],
    initialIndex?: number
  ) => {
    const list = Array.isArray(imagesList) && imagesList.length > 0
      ? imagesList.filter(Boolean)
      : (url ? [url] : []);

    if (list.length === 0) return;

    let targetIdx = typeof initialIndex === 'number' && initialIndex >= 0 && initialIndex < list.length
      ? initialIndex
      : list.indexOf(url);
    if (targetIdx < 0) targetIdx = 0;

    setState({
      isOpen: true,
      imageUrl: list[targetIdx] || url,
      images: list,
      currentIndex: targetIdx,
      title: title || 'Visualização da Foto',
      subtitle: subtitle || 'MotoLegado • Registro em alta resolução',
    });
  }, []);

  const openCarousel = useCallback((
    images: string[],
    initialIndex: number = 0,
    title?: string,
    subtitle?: string
  ) => {
    const valid = Array.isArray(images) ? images.filter(Boolean) : [];
    if (valid.length === 0) return;
    const safeIdx = Math.max(0, Math.min(initialIndex, valid.length - 1));
    openImage(valid[safeIdx], title, subtitle, valid, safeIdx);
  }, [openImage]);

  const goToIndex = useCallback((index: number) => {
    setState(prev => {
      if (!prev.images || prev.images.length === 0) return prev;
      const safeIndex = (index + prev.images.length) % prev.images.length;
      return {
        ...prev,
        currentIndex: safeIndex,
        imageUrl: prev.images[safeIndex]
      };
    });
  }, []);

  const nextImage = useCallback(() => {
    setState(prev => {
      if (!prev.images || prev.images.length <= 1) return prev;
      const nextIdx = (prev.currentIndex + 1) % prev.images.length;
      return {
        ...prev,
        currentIndex: nextIdx,
        imageUrl: prev.images[nextIdx]
      };
    });
  }, []);

  const prevImage = useCallback(() => {
    setState(prev => {
      if (!prev.images || prev.images.length <= 1) return prev;
      const prevIdx = (prev.currentIndex - 1 + prev.images.length) % prev.images.length;
      return {
        ...prev,
        currentIndex: prevIdx,
        imageUrl: prev.images[prevIdx]
      };
    });
  }, []);

  const closeImage = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // 1. Escuta evento global disparado por qualquer componente
  useEffect(() => {
    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ 
        imageUrl: string; 
        title?: string; 
        subtitle?: string;
        images?: string[];
        initialIndex?: number;
      }>;
      if (customEvent.detail) {
        openImage(
          customEvent.detail.imageUrl, 
          customEvent.detail.title, 
          customEvent.detail.subtitle,
          customEvent.detail.images,
          customEvent.detail.initialIndex
        );
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

  // 3. Atalhos de teclado: Esc para fechar, setas para navegar no carrossel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isOpen) return;
      if (e.key === 'Escape') {
        closeImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen, closeImage, nextImage, prevImage]);

  return (
    <ImageLightboxContext.Provider value={{ 
      state, 
      openImage, 
      openCarousel, 
      nextImage, 
      prevImage, 
      goToIndex, 
      closeImage 
    }}>
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
