import { useRef, useState, useCallback, useEffect } from 'react';

export function useTimer() {
  const workerRef = useRef(null);
  const [remaining, setRemaining] = useState(0);  // ms
  const [total, setTotal] = useState(0);          // ms (for ring progress)
  const [state, setState] = useState('idle');     // idle | running | paused | done

  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../worker/timer.worker.js', import.meta.url), { type: 'module' });
      workerRef.current.onmessage = (e) => {
        const { type, remaining: r } = e.data;
        if (type === 'tick') {
          setRemaining(r);
        } else if (type === 'done') {
          setRemaining(0);
          setState('done');
        } else if (type === 'paused' || type === 'stopped') {
          setRemaining(r);
        }
      };
    }
  }, []);

  const start = useCallback((durationSec) => {
    initWorker();
    const durMs = durationSec * 1000;
    setTotal(durMs);
    setRemaining(durMs);
    setState('running');
    workerRef.current.postMessage({ type: 'start', duration: durationSec });
  }, [initWorker]);

  const pause = useCallback(() => {
    if (workerRef.current && state === 'running') {
      workerRef.current.postMessage({ type: 'pause' });
      setState('paused');
    }
  }, [state]);

  const resume = useCallback(() => {
    if (workerRef.current && state === 'paused') {
      workerRef.current.postMessage({ type: 'resume', remaining });
      setState('running');
    }
  }, [state, remaining]);

  const stop = useCallback(() => {
    if (workerRef.current && (state === 'running' || state === 'paused')) {
      workerRef.current.postMessage({ type: 'stop' });
      setState('idle');
      setRemaining(0);
      setTotal(0);
    }
  }, [state]);

  const resetDone = useCallback(() => {
    setState('idle');
    setRemaining(0);
    setTotal(0);
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const progress = total > 0 ? remaining / total : 1;

  return { remaining, total, progress, state, start, pause, resume, stop, resetDone };
}