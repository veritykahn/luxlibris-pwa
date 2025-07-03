// pages/splash.js - LIMITED TO FIRST-TIME FLOWS ONLY
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';

export default function Splash() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [navigated, setNavigated] = useState(false);
  const { user, userProfile, loading, getDashboardUrl, isAuthenticated } = useAuth();

  useEffect(() => {
    // CRITICAL: If user is already authenticated, immediately redirect to dashboard
    // This prevents authenticated users from getting stuck on splash page
    if (!loading && isAuthenticated && userProfile) {
      console.log('✅ Authenticated user on splash page, redirecting to dashboard');
      router.push(getDashboardUrl());
      return;
    }

    // Auto-navigate after 6 seconds (matching your Flutter timing)
    const timer = setTimeout(() => {
      if (!navigated) {
        navigateAfterDelay();
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [loading, isAuthenticated, userProfile, navigated, router, getDashboardUrl]);

  const navigateAfterDelay = async () => {
    if (navigated) return;
    setNavigated(true);

    try {
      // Get userType from URL parameters for first-time flows
      const urlParams = new URLSearchParams(window.location.search);
      const userType = urlParams.get('type');
      
      console.log('🔍 SPLASH DEBUG (First-time flow):');
      console.log('URL params:', urlParams.toString());
      console.log('userType from URL:', userType);
      console.log('User auth state:', { user: !!user, userProfile, loading });
      
      // If user is authenticated, use their actual profile (should not happen due to useEffect above)
      if (!loading && user && userProfile) {
        console.log('✅ User is authenticated, redirecting to dashboard');
        router.push(getDashboardUrl());
        return;
      }
      
      // Handle URL-based routing for NEW/UNAUTHENTICATED users only
      if (userType === 'school-admin') {
        console.log('✅ Going to admin onboarding (first-time)');
        router.push('/admin/school-onboarding');
      } else if (userType === 'student') {
        console.log('✅ Going to student flow (first-time)');
        // Check legal acceptance first
        const hasAcceptedLegal = localStorage.getItem('hasAcceptedLegal') === 'true';
        if (!hasAcceptedLegal) {
          router.push('/legal?type=student');
        } else {
          // New student - go to onboarding (should not have existing data)
          router.push('/student-onboarding');
        }
      } else {
        console.log('❌ No specific userType, going to role selector');
        router.push('/role-selector');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      router.push('/role-selector');
    }
  };

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('Video autoplay failed:', error);
        // Fallback: show static image or continue without video
      });
    }
  };

  // Allow tap to skip
  const handleScreenTap = () => {
    if (!navigated) {
      navigateAfterDelay();
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{
        backgroundColor: '#FFFCF5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #ADD4EA30',
            borderTop: '3px solid #ADD4EA',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#223848' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show nothing (redirect will happen)
  if (isAuthenticated && userProfile) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Lux Libris - Welcome</title>
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div 
        onClick={handleScreenTap}
        style={{
          backgroundColor: '#FFFCF5',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Video Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Video Element */}
          <video
            ref={videoRef}
            onLoadedData={handleVideoLoaded}
            onCanPlayThrough={handleVideoLoaded}
            muted
            playsInline
            style={{
              maxWidth: '100%',
              maxHeight: '100vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              opacity: isVideoLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease'
            }}
          >
            <source src="/animations/dove_flutter.mp4" type="video/mp4" />
            {/* Fallback for browsers that don't support video */}
            Your browser does not support the video tag.
          </video>

          {/* Loading Indicator (shown while video loads) */}
          {!isVideoLoaded && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* Lux Libris Logo/Text */}
              <div style={{
                textAlign: 'center'
              }}>
                <h1 style={{
                  fontFamily: 'Didot, serif',
                  fontSize: '36px',
                  color: '#223848',
                  margin: '0 0 8px 0',
                  letterSpacing: '2px'
                }}>
                  Lux Libris
                </h1>
                <p style={{
                  color: '#556B7A',
                  fontSize: '16px',
                  margin: 0,
                  letterSpacing: '1px'
                }}>
                  Illuminating the World Through Stories
                </p>
              </div>

              {/* Loading Animation */}
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #ADD4EA30',
                borderTop: '3px solid #ADD4EA',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />

              {/* Tap to Continue Hint */}
              <p style={{
                color: '#556B7A',
                fontSize: '14px',
                margin: '20px 0 0 0',
                opacity: 0.7
              }}>
                Tap anywhere to continue
              </p>
            </div>
          )}

          {/* Skip Button (appears after video loads) */}
          <button
            onClick={handleScreenTap}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #ADD4EA',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              color: '#223848',
              cursor: 'pointer',
              opacity: isVideoLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            Skip
          </button>
        </div>

        {/* CSS for loading animation */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* PWA-friendly video styles */
          video::-webkit-media-controls {
            display: none !important;
          }
          
          video::-webkit-media-controls-panel {
            display: none !important;
          }
          
          video::-webkit-media-controls-play-button {
            display: none !important;
          }
          
          video::-webkit-media-controls-start-playback-button {
            display: none !important;
          }
        `}</style>
      </div>
    </>
  );
}