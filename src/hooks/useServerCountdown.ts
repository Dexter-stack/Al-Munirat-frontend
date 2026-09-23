import { useEffect, useRef, useState } from "react";

/**
 * Countdown driven by the server clock, not the device clock
 * (API_CONTRACT.md §9 "Timer authority"). `serverTime` and `endsAt` are
 * absolute ISO timestamps from the backend; the offset between the
 * server's clock and this device's clock is captured once and used to
 * project "now" for every subsequent tick, so a wrong local clock never
 * changes the countdown.
 */
export function useServerCountdown(serverTime: string | null, endsAt: string | null, onExpire?: () => void) {
  const offsetRef = useRef(0);
  const expiredRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!serverTime) return;
    offsetRef.current = new Date(serverTime).getTime() - Date.now();
    expiredRef.current = false;
  }, [serverTime]);

  useEffect(() => {
    if (!endsAt) return;

    function tick() {
      const projectedServerNow = Date.now() + offsetRef.current;
      const remaining = new Date(endsAt as string).getTime() - projectedServerNow;
      setRemainingMs(Math.max(0, remaining));
      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt]);

  const totalSeconds = remainingMs === null ? null : Math.floor(remainingMs / 1000);
  const minutes = totalSeconds === null ? "--" : String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = totalSeconds === null ? "--" : String(totalSeconds % 60).padStart(2, "0");

  return { remainingMs, label: `${minutes}:${seconds}` };
}
