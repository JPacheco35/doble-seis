/**
 * useRoundLog.ts
 *
 * custom hook for managing persistent, auto-synced game event log.
 *
 * - stores all in-game events (plays, knocks, scores, system messages) in state
 * - persists to localStorage across page refreshes
 * - prevent duplicate log entries on reconnect
 * - maintains round boundaries (some logs (ie. scores) presist between rounds)
 * - 50 log entries maximum (this should rarely matter in games)
 *
 * this event log is the source of truth for game history shown in the RoundLog component.
 * /src/components/gameui/RoundLog/RoundLog.tsx
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Domino, LogEntry } from '../types/gameTypes.ts';

/**
 * Determines which log entries should be preserved between rounds.
 *
 * when the round is over, only keep a couple types of logs, wipe the rest
 * - round start markers (for visual clairity)
 * - final scores and tally (keep track of score over time)
 *
 *
 * @param entry - log entry to evaluate
 * @returns true if entry should be kept between rounds, false to discard
 * @example
 * shouldKeepBetweenRounds({ type: 'system', text: 'Round 1 started' }) // true (keep)
 * shouldKeepBetweenRounds({ type: 'play', text: 'Player1 played...' })  // false (wipe)
 */
function shouldKeepBetweenRounds(entry: LogEntry) {
  // Regex to detect compact score format: "X-Y [WINNING-TEAM] Team" or "X-Y [LOSING-TEAM]"
  const isCompactScoreSnapshot =
    /^\d+-\d+ (Blue Team|Red Team)$/.test(entry.text) ||
    /^\d+-\d+ Team [12]$/.test(entry.text);

  // Check: only roundStart (system) logs, and round ended (score) logs return true
  return (
    (entry.type === 'system' && entry.text.includes('started')) ||
    (entry.type === 'score' &&
      (entry.text.startsWith('Round ended — tally') || isCompactScoreSnapshot))
  );
}


/**
 * Hook for managing the game round log with localStorage persistence.
 *
 * keeps chronological log of all game events and handles:
 * - state management
 * - persistence between refreshes
 * - prevents duplicate entries on reconnect
 * - maintains round boundaries (some logs (ie. scores) presist between rounds)
 *
 * tracks refs to prevent duplicate additions during reconnects:
 * A socket reconnect will resend events, but we check if we've seen this
 * specific play+side+moveNumber combination before and skip if so.
 *
 * @param logStorageKey - localStorage key to persist log under (e.g., "game_log_room123")
 *
 * @returns object with log state, functions, and internal refs
 *
 * @returns {LogEntry[]} log: current log entries (newest --> oldest) (50 max)
 *
 * @returns {Function} addLog: adds a new log entry: addLog(text, type, domino?, outcome?, isFreeKnock?, player?)
 * @returns {Function} clearRoundLog: clears play events but keeps score/system messages
 *
 * @returns {MutableRefObject} logEntriesRef: synced ref to current log (for access without re-renders)
 * @returns {MutableRefObject} lastDominoLogKeyRef: dedup key for last domino played (internal use)
 * @returns {MutableRefObject} lastRoundStartLogKeyRef: last round start marker (for future use)
 *
 * @example
 * const { log, addLog, clearRoundLog } = useRoundLog('game_log_room_123');
 *
 * adding a new log
 * addLog('Player1 played 3-5', 'play', {left:3, right:5}, undefined, false, 'Player1');
 *
 * adding a knock log
 * addLog('Player2 knocked', 'knock', undefined, 'lose', false, 'Player2');
 *
 * clearing log at end of round
 * clearRoundLog();
 */

export default function useRoundLog(logStorageKey: string) {
  // State variables, re-renders on change
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logsHydrated, setLogsHydrated] = useState(false);

  // Ref variables - presists across renders without triggering updates
  const logEntriesRef = useRef<LogEntry[]>([]);
  const lastDominoLogKeyRef = useRef('');
  const logCounterRef = useRef(0);
  const lastRoundStartLogKeyRef = useRef('');

  /**
   * Effect 1: Initialize log from localStorage on mount
   * runs once when component mounts to restore preexisting log from localStorage (if any)
   */
  useEffect(() => {
    setLogsHydrated(false);

    let restoredLog: LogEntry[] = [];
    try {
      // fetch the data in localStorage if it exists
      const raw = localStorage.getItem(logStorageKey);
      if (raw) {
        // parse presisted log data
        const parsed = JSON.parse(raw) as {
          log?: LogEntry[];
          logCounter?: number;
          lastDominoLogKey?: string;
        };

        // restore the log data, 50 entries max
        if (Array.isArray(parsed.log)) restoredLog = parsed.log.slice(0, 50);
        logCounterRef.current =
          typeof parsed.logCounter === 'number' ? parsed.logCounter : 0;
        lastDominoLogKeyRef.current = parsed.lastDominoLogKey ?? '';
      }

      // Otherwise: no log to restore, fill with empty values
      else {
        logCounterRef.current = 0;
        lastDominoLogKeyRef.current = '';
      }
    } catch {
      // if there is some kind of error, fill with empty values (don't block gameplay)
      logCounterRef.current = 0;
      lastDominoLogKeyRef.current = '';
    }

    // reset round start tracking on reload
    lastRoundStartLogKeyRef.current = '';

    // update State and mark as hydrated
    setLog(restoredLog);
    setLogsHydrated(true);
  }, [logStorageKey]);

  /**
   * Effect 2: Save log to localStorage whenever it is updated
   * waits for hydration to complete (if applicable) before syncing to avoid overwriting old data
   */
  useEffect(() => {
    // dont sync untill hydration is done (if applicable)
    if (!logsHydrated) return;

    // write current log state into localStorage
    try {
      localStorage.setItem(
        logStorageKey,
        JSON.stringify({
          log,
          logCounter: logCounterRef.current,
          lastDominoLogKey: lastDominoLogKeyRef.current,
        }),
      );
    } catch {
      // if for some reason, localStorage write fails (e.g., quota exceeded), ignore the error and continue gameplay without persistence
      // Ignore storage write failures; gameplay should continue.
    }
  }, [log, logStorageKey, logsHydrated]);

  /**
   * Effect 3: Keep ref in sync with state
   * allows Game.tsx to access current log via ref without subscription
   * (useful in socket event listeners that don't re-render)
   */
  useEffect(() => {
    logEntriesRef.current = log;
  }, [log]);

  /**
   * Callback: Add a single log entry
   *
   * creates a new entry with unique id and put it at the front of the log
   * max 50 entries (get rid of oldest ones first)
   *
   * use this from socket event listeners: addLog('text', 'type', domino?, outcome?, isFreeKnock?, player?)
   */
  const addLog = useCallback(
    (
      text: string,
      type: LogEntry['type'],
      domino?: Domino,
      outcome?: LogEntry['outcome'],
      isFreeKnock?: boolean,
      player?: string,
    ) => {
      // increment counter so each log entry has unique id
      logCounterRef.current += 1;
      const id = logCounterRef.current;

      // put the new entry at the front, only keep the first 49 after it (50 max)
      setLog((prev) => [
        { id, text, type, player, domino, outcome, isFreeKnock },
        ...prev.slice(0, 49),
      ]);
    },
    [],
  );

  /**
   * Callback: Clear play events but keep round markers
   *
   * at the end of a round, clear the appropriate logs
   * score snapshots and round start messages are NOT to be wiped
   */
  const clearRoundLog = useCallback(() => {
    // reset dedup trackers for the next round (logs should be clear)
    lastDominoLogKeyRef.current = '';
    lastRoundStartLogKeyRef.current = '';

    // Keep only score/system logs, remove all others
    setLog((prev) => prev.filter(shouldKeepBetweenRounds).slice(0, 50));
  }, []);

  return {
    log,
    addLog,
    clearRoundLog,
    logEntriesRef,
    lastDominoLogKeyRef,
    lastRoundStartLogKeyRef,
  };
}

