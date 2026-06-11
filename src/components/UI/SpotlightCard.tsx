import { useRef, ReactNode } from 'react';
import styles from '../../../styles/Home.module.css';

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
};

export const SpotlightCard = ({ children, className }: SpotlightCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div className={styles.spotlightWrapper} ref={cardRef} onMouseMove={handleMouseMove}>
      <div className={className}>
        {children}
        <div className={styles.spotlightGlow} />
      </div>
    </div>
  );
};
