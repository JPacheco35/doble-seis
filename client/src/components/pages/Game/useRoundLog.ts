// Round Log Management Helper Functions

import { useCallback, useEffect, useRef, useState } from 'react';
import { Domino, LogEntry } from '../../../types/Game.ts';

function shouldKeepBetweenRounds(entry: LogEntry) {
  const isCompactScoreSnapshot = /^\d+-\d+ (Blue Team|Red Team)$/.test(entry.text) || /^\d+-\d+ Team [12]$/.test(entry.text);

  return (
    (entry.type === 'system' && entry.text.includes('started')) ||
    (entry.type === 'score' && (
      entry.text.startsWith('Round ended — tally') ||
      isCompactScoreSnapshot
    ))
  );
}

export default function useRoundLog(logStorageKey: string) {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logsHydrated, setLogsHydrated] = useState(false);

  const logEntriesRef = useRef<LogEntry[]>([]);
  const lastDominoLogKeyRef = useRef('');
  const logCounterRef = useRef(0);
  const lastRoundStartLogKeyRef = useRef('');

  useEffect(() => {
    setLogsHydrated(false);

    let restoredLog: LogEntry[] = [];
    try {
      const raw = localStorage.getItem(logStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          log?: LogEntry[];
          logCounter?: number;
          lastDominoLogKey?: string;
        };

        if (Array.isArray(parsed.log)) restoredLog = parsed.log.slice(0, 50);
        logCounterRef.current = typeof parsed.logCounter === 'number' ? parsed.logCounter : 0;
        lastDominoLogKeyRef.current = parsed.lastDominoLogKey ?? '';
      } else {
        logCounterRef.current = 0;
        lastDominoLogKeyRef.current = '';
      }
    } catch {
      // Ignore invalid persisted log payloads.
      logCounterRef.current = 0;
      lastDominoLogKeyRef.current = '';
    }

    lastRoundStartLogKeyRef.current = '';

    setLog(restoredLog);
    setLogsHydrated(true);
  }, [logStorageKey]);

  useEffect(() => {
    if (!logsHydrated) return;
    try {
      localStorage.setItem(logStorageKey, JSON.stringify({
        log,
        logCounter: logCounterRef.current,
        lastDominoLogKey: lastDominoLogKeyRef.current,
      }));
    } catch {
      // Ignore storage write failures; gameplay should continue.
    }
  }, [log, logStorageKey, logsHydrated]);

  const addLog = useCallback((
    text: string,
    type: LogEntry['type'],
    player?: string,
    domino?: Domino,
    outcome?: LogEntry['outcome'],
    isFreeKnock?: boolean
  ) => {
    logCounterRef.current += 1;
    const id = logCounterRef.current;
    setLog(prev => [{ id, text, type, player, domino, outcome, isFreeKnock }, ...prev.slice(0, 49)]);
  }, []);

  const clearRoundLog = useCallback(() => {
    lastDominoLogKeyRef.current = '';
    lastRoundStartLogKeyRef.current = '';
    setLog(prev => prev.filter(shouldKeepBetweenRounds).slice(0, 50));
  }, []);

  useEffect(() => {
    logEntriesRef.current = log;
  }, [log]);

  return {
    log,
    addLog,
    clearRoundLog,
    logEntriesRef,
    lastDominoLogKeyRef,
    lastRoundStartLogKeyRef,
  };
}

