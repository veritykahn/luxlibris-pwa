// pages/_app.js
import { AuthProvider } from '../contexts/AuthContext';
import { TimerProvider } from '../contexts/TimerContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <TimerProvider>
        <Component {...pageProps} />
      </TimerProvider>
    </AuthProvider>
  );
}