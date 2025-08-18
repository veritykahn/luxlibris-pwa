// components/JaneAustenHelper.js
// Shared Stone Cold Jane Austen helper component for Family Battle

import { useState, useEffect } from 'react';
import { getJaneAustenQuote } from '../lib/jane-austen-system';

export default function JaneAustenHelper({ 
  show, 
  battleState, 
  winner, 
  onClose, 
  currentTheme, 
  familyBattleData 
}) {
  const [currentQuote, setCurrentQuote] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [manuallyDismissed, setManuallyDismissed] = useState(false);

  const getQuoteTypeAndImage = () => {
    const dayOfWeek = new Date().getDay();
    
    if (dayOfWeek === 0) {
      return { 
        type: 'prayerful', 
        image: '/images/jane-austen-prayerful.png',
        tagline: "Stone Cold Jane Austen's Sunday Reflection:"
      };
    }
    
    if (dayOfWeek >= 1 && dayOfWeek <= 2) {
      return { 
        type: 'encouraging', 
        image: '/images/jane-austen-encouraging.png',
        tagline: "Because Stone Cold Jane Austen sayeth so:"
      };
    }
    
    if (dayOfWeek >= 3 && dayOfWeek <= 4) {
      return { 
        type: 'battleReady', 
        image: '/images/jane-austen-battle-ready.png',
        tagline: "Because Stone Cold Jane Austen sayeth so:"
      };
    }
    
    if (dayOfWeek >= 5 && dayOfWeek <= 6) {
      return { 
        type: 'victorious', 
        image: '/images/jane-austen-victorious.png',
        tagline: "Because Stone Cold Jane Austen sayeth so:"
      };
    }
    
    return { 
      type: 'encouraging', 
      image: '/images/jane-austen-encouraging.png',
      tagline: "Because Stone Cold Jane Austen sayeth so:"
    };
  };

  useEffect(() => {
    const { type } = getQuoteTypeAndImage();
    setCurrentQuote(getJaneAustenQuote(type));
  }, [battleState, winner, familyBattleData]);

  // Enhanced visibility logic with manual dismiss
  useEffect(() => {
    if (show && !isVisible && !manuallyDismissed) {
      setIsVisible(true);
      const duration = new Date().getDay() === 0 ? 15000 : 12000;
      const timer = setTimeout(() => {
        if (!manuallyDismissed) {
          setIsVisible(false);
        }
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, isVisible, manuallyDismissed]);

  useEffect(() => {
    if (show && !manuallyDismissed) {
      const interval = setInterval(() => setIsVisible(true), 45000);
      return () => clearInterval(interval);
    }
  }, [show, manuallyDismissed]);

  if (!isVisible) return null;

  const { image, type, tagline } = getQuoteTypeAndImage();
  const isPrayerful = type === 'prayerful';

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: isPrayerful 
        ? `linear-gradient(135deg, #E6E6FA, #F0E6FF, #FFFFFF)`
        : `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
      borderRadius: '16px',
      padding: '12px 16px',
      maxWidth: '320px',
      width: '90vw',
      animation: 'slideInUp 0.5s ease-out',
      boxShadow: isPrayerful
        ? `0 8px 32px rgba(138, 43, 226, 0.2)`
        : `0 8px 32px rgba(0,0,0,0.15)`,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {!imageError ? (
          <img 
            src={image}
            alt="Stone Cold Jane Austen"
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'contain',
              filter: isPrayerful ? 'brightness(1.05)' : 'none'
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: isPrayerful ? '#E6E6FA' : currentTheme.accent,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px'
          }}>
            {isPrayerful ? '🙏' : '👩‍🎓'}
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: isPrayerful ? '#4B0082' : currentTheme.textPrimary,
          marginBottom: '6px',
          fontFamily: 'Didot, "Times New Roman", serif'
        }}>
          {tagline}
        </div>
        <div style={{
          fontSize: '11px',
          color: isPrayerful ? '#4B0082' : currentTheme.textPrimary,
          lineHeight: '1.4',
          fontStyle: isPrayerful ? 'normal' : 'italic',
          fontFamily: isPrayerful ? 'Georgia, serif' : 'Didot, "Times New Roman", serif',
          fontWeight: isPrayerful ? '500' : 'normal'
        }}>
          {isPrayerful ? (
            <span>{currentQuote}</span>
          ) : (
            <span>&quot;{currentQuote}&quot;</span>
          )}
        </div>
      </div>
      
      <button
        onClick={() => {
          setIsVisible(false);
          setManuallyDismissed(true);
          setTimeout(() => setManuallyDismissed(false), 60000); // Reset after 1 minute
        }}
        style={{
          backgroundColor: isPrayerful ? '#DDA0DD' : currentTheme.primary,
          color: isPrayerful ? '#FFFFFF' : currentTheme.textPrimary,
          border: 'none',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          cursor: 'pointer',
          flexShrink: 0,
          fontWeight: 'bold'
        }}
      >
        ✕
      </button>

      <style jsx>{`
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
}