import React, { useEffect, useRef } from 'react';
import '../../styles/card-effects.css';

export enum ShineEffect {
  Holo = 'holo-effect',
  Crimson = 'crimson-shine-effect',
  GalaxyHolo = 'galaxy-holo-effect',
  None = ''
}

interface InteractiveImageProps {
  imageUrl: string;
  altText: string;
  containerClassName?: string;
  cardClassName?: string;
  imageClassName?: string;
  width?: string | number;
  height?: string | number;
  effectClasses?: string;
  shineEffect?: ShineEffect;
}

const GlareCard: React.FC<InteractiveImageProps> = ({
  imageUrl,
  altText,
  containerClassName = '',
  cardClassName = '',
  imageClassName = '',
  width = '100%',
  height = '100%',
  effectClasses = 'glare-effect',
  shineEffect = ShineEffect.None,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const mouseXPercentage = x / rect.width;
      const mouseYPercentage = y / rect.height;

      const maxRotation = 15;
      const normalizedX = mouseXPercentage - 0.5;
      const normalizedY = mouseYPercentage - 0.5;

      const maxRotationFactor = maxRotation * 2;

      const finalRotateX = normalizedY * -maxRotationFactor;
      const finalRotateY = normalizedX * maxRotationFactor;

      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
      const hyp = maxDistance > 0 ? distance / maxDistance : 0;

      card.style.setProperty('--mx', `${mouseXPercentage * 100}%`);
      card.style.setProperty('--my', `${mouseYPercentage * 100}%`);
      card.style.setProperty('--rx', `${-finalRotateY}deg`);
      card.style.setProperty('--ry', `${-finalRotateX}deg`);
      card.style.setProperty('--hyp', `${hyp}`);
      card.style.setProperty('--o', '1'); // opacity
    };

    const onMouseLeave = () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--o', '0');
      card.style.setProperty('--hyp', '0');
    };

    const onMouseDown = () => card.classList.add('active');
    const onMouseUp = () => card.classList.remove('active');

    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);
    card.addEventListener('mousedown', onMouseDown);
    card.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseup', onMouseUp);


    return () => {
      card.removeEventListener('mousemove', onMouseMove);
      card.removeEventListener('mouseleave', onMouseLeave);
      card.removeEventListener('mousedown', onMouseDown);
      card.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseup', onMouseUp);

      if (card) {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--o', '0');
        card.style.setProperty('--hyp', '0');
      }
    };
  }, [imageUrl]);

  return (
    <div className={containerClassName} style={{ width, height }}>
      <div
        ref={cardRef}
        className={`card mouse-effects-enabled ${shineEffect} ${effectClasses} ${cardClassName}`.trim()}
        style={{ width: '100%', height: '100%' }}
      >
        <div className="card__translater w-full h-full">
          <div className="card__rotator w-full h-full">
            <div className="card__image-container w-full h-full">
              <img
                ref={imageRef}
                src={imageUrl}
                alt={altText}
                className={`max-w-full max-h-full object-contain ${imageClassName}`.trim()}
              />
              <div className="card__shine"></div>
              <div className="card__glare"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlareCard; 