import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

function ErrorBoundary() {
  const [err, setErr] = React.useState(null);
  React.useEffect(() => {
    const handler = (e) => {
      setErr(e.reason?.message || e.message || '应用出错');
      console.error(e);
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', handler);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', handler);
    };
  }, []);
  if (err) {
    return (
      <div style={{padding:32,textAlign:'center',color:'#f87171'}}>
        <h2>⚠ 应用错误</h2>
        <p>{err}</p>
        <button onClick={() => setErr(null)} style={{marginTop:16,padding:'10px 20px',borderRadius:8,background:'#4ade80',color:'#000',border:'none',fontSize:14,cursor:'pointer'}}>重试</button>
      </div>
    );
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary />
  </React.StrictMode>
);