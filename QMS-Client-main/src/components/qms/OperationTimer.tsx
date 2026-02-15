/**
 * OperationTimer.tsx — Таймер операции (секундомер)
 * Показывает HH:MM:SS с момента начала.
 * Если операция завершена — показывает итоговое время.
 * Если превышено estimatedDuration — цвет переключается на предупреждение.
 * ASVO-QMS design system
 */

import React, { useState, useEffect, useRef } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface OperationTimerProps {
  startedAt: string | null;
  completedAt?: string | null;
  estimatedDuration?: number; // minutes
}

const pad = (n: number): string => String(Math.floor(n)).padStart(2, "0");

const formatElapsed = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const OperationTimer: React.FC<OperationTimerProps> = ({
  startedAt,
  completedAt,
  estimatedDuration,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    /* Clear any existing interval */
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!startedAt) {
      setElapsed(0);
      return;
    }

    const startMs = new Date(startedAt).getTime();

    if (completedAt) {
      /* Static: operation completed */
      const endMs = new Date(completedAt).getTime();
      setElapsed(Math.max(0, (endMs - startMs) / 1000));
      return;
    }

    /* Live timer */
    const tick = () => {
      const now = Date.now();
      setElapsed(Math.max(0, (now - startMs) / 1000));
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startedAt, completedAt]);

  /* ---- Not started ---- */
  if (!startedAt) {
    return (
      <div className="flex items-center gap-1.5 text-[13px] text-asvo-text-dim">
        <Clock size={14} />
        <span className="font-mono">--:--:--</span>
      </div>
    );
  }

  /* ---- Determine color ---- */
  const elapsedMinutes = elapsed / 60;
  const isOvertime = estimatedDuration != null && elapsedMinutes > estimatedDuration;
  const isNearLimit = estimatedDuration != null && elapsedMinutes > estimatedDuration * 0.9 && !isOvertime;
  const isCompleted = !!completedAt;

  let colorClass = "text-asvo-text";
  if (isOvertime) {
    colorClass = "text-[#F06060]";
  } else if (isNearLimit) {
    colorClass = "text-[#E8A830]";
  } else if (isCompleted) {
    colorClass = "text-[#2DD4A8]";
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex items-center gap-1.5 ${colorClass}`}>
        {isOvertime ? (
          <AlertTriangle size={14} className="animate-pulse" />
        ) : (
          <Clock size={14} className={!isCompleted ? "animate-pulse" : ""} />
        )}
        <span className="font-mono text-[13px] font-semibold tabular-nums">
          {formatElapsed(elapsed)}
        </span>
      </div>

      {estimatedDuration != null && (
        <span className="text-[11px] text-asvo-text-dim ml-1">
          / {estimatedDuration < 60 ? `${estimatedDuration}м` : `${Math.floor(estimatedDuration / 60)}ч ${estimatedDuration % 60}м`}
        </span>
      )}
    </div>
  );
};

export default OperationTimer;
