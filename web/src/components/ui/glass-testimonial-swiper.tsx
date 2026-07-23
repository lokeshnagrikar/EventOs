import React, { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';

// --- Component Interfaces ---
export interface Testimonial {
  id: string | number;
  initials: string;
  name: string;
  role: string;
  quote: string;
  tags: { text: string; type: 'featured' | 'default' }[];
  stats: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; text: string; }[];
  avatarGradient: string;
}

export interface TestimonialStackProps {
  testimonials: Testimonial[];
  /** How many cards to show behind the main card */
  visibleBehind?: number;
  /** Autoplay interval in milliseconds. Set to 0 to disable. */
  autoplayInterval?: number;
}

// --- The Component ---
export const TestimonialStack = ({ 
  testimonials, 
  visibleBehind = 2,
  autoplayInterval = 5000
}: TestimonialStackProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const totalCards = testimonials.length;

  const navigate = useCallback((newIndex: number) => {
    setActiveIndex((newIndex + totalCards) % totalCards);
  }, [totalCards]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    const displayOrder = (index - activeIndex + totalCards) % totalCards;
    if (displayOrder !== 0) return;
    
    setIsDragging(true);
    hasDraggedRef.current = false;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartRef.current = clientX;
    cardRefs.current[activeIndex]?.classList.add('is-dragging');
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offset = clientX - dragStartRef.current;
    setDragOffset(offset);
    if (Math.abs(offset) > 6) {
      hasDraggedRef.current = true;
    }
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    cardRefs.current[activeIndex]?.classList.remove('is-dragging');
    
    if (hasDraggedRef.current) {
      if (Math.abs(dragOffset) > 50) {
        navigate(activeIndex + (dragOffset < 0 ? 1 : -1));
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
    // Keep hasDraggedRef.current true briefly to suppress immediate click triggers on end of drag
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  }, [isDragging, dragOffset, activeIndex, navigate]);

  const handleCardClick = (index: number) => {
    if (hasDraggedRef.current) return;
    const displayOrder = (index - activeIndex + totalCards) % totalCards;
    if (displayOrder === 0) {
      // Tap active card to change to next
      navigate(activeIndex + 1);
    } else if (displayOrder <= visibleBehind) {
      // Tap stacked card behind to bring it forward
      navigate(index);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Autoplay Effect Loop (pauses when dragging or hovered for optimal UX)
  useEffect(() => {
    if (autoplayInterval <= 0 || isDragging || isHovered) return;
    
    const timer = setInterval(() => {
      navigate(activeIndex + 1);
    }, autoplayInterval);
    
    return () => clearInterval(timer);
  }, [autoplayInterval, activeIndex, isDragging, isHovered, navigate]);
  
  if (!testimonials?.length) return null;

  return (
    <section 
      className="testimonials-stack relative pb-12 w-full max-w-2xl mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {testimonials.map((testimonial, index) => {
        const isActive = index === activeIndex;
        // Calculate the card's position in the display order
        const displayOrder = (index - activeIndex + totalCards) % totalCards;

        // --- DYNAMIC STYLE CALCULATION ---
        const style: CSSProperties = {};
        if (displayOrder === 0) { // The active card
          style.transform = `translateX(${dragOffset}px)`;
          style.opacity = 1;
          style.zIndex = totalCards;
        } else if (displayOrder <= visibleBehind) { // Cards stacked behind
          const scale = 1 - 0.05 * displayOrder;
          const translateY = -1.5 * displayOrder; // in rem
          style.transform = `scale(${scale}) translateY(${translateY}rem)`;
          style.opacity = 1 - 0.25 * displayOrder;
          style.zIndex = totalCards - displayOrder;
        } else { // Cards that are out of view
          style.transform = 'scale(0) translateY(-3rem)';
          style.opacity = 0;
          style.zIndex = 0;
        }

        const tagClasses = (type: 'featured' | 'default') => type === 'featured' 
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
          : 'bg-zinc-800 text-zinc-300 border border-white/[0.04]';
          
        return (
          <div
            ref={el => cardRefs.current[index] = el}
            key={testimonial.id}
            className="testimonial-card glass-effect backdrop-blur-xl transition-all duration-300 ease-out select-none cursor-grab active:cursor-grabbing border border-white/[0.08]"
            style={style} // Apply dynamic styles here
            onMouseDown={(e) => handleDragStart(e, index)}
            onTouchStart={(e) => handleDragStart(e, index)}
            onClick={() => handleCardClick(index)}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold text-base" style={{ background: testimonial.avatarGradient }}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base md:text-lg leading-tight">{testimonial.name}</h3>
                    <p className="text-xs md:text-sm text-zinc-400 mt-1">{testimonial.role}</p>
                  </div>
                </div>
                {/* Visual quote mark indicator */}
                <span className="text-zinc-700/60 font-serif text-5xl leading-none select-none select-none">&ldquo;</span>
              </div>
              
              <blockquote className="text-zinc-200/90 leading-relaxed text-sm md:text-base mb-6">"{testimonial.quote}"</blockquote>
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-t border-white/[0.06] pt-4 gap-4">
                <div className="flex flex-wrap gap-2">
                  {testimonial.tags.map((tag, i) => (
                    <span key={i} className={['text-[10px] font-bold uppercase tracking-wider', 'px-2.5', 'py-1', 'rounded-md', tagClasses(tag.type)].join(' ')}>
                      {tag.text}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  {testimonial.stats.map((stat, i) => {
                    const IconComponent = stat.icon;
                    return (
                      <span key={i} className="flex items-center">
                        <IconComponent className="mr-1.5 h-3.5 w-3.5 text-zinc-500" />
                        {stat.text}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="pagination flex gap-2 justify-center absolute bottom-0 left-0 right-0">
        {testimonials.map((_, index) => (
          <button 
            key={index} 
            aria-label={`Go to testimonial ${index + 1}`} 
            onClick={() => navigate(index)} 
            className={`pagination-dot transition-all duration-300 ${activeIndex === index ? 'active bg-white w-5 rounded-[4px]' : 'bg-white/20'}`} 
          />
        ))}
      </div>
    </section>
  );
};
