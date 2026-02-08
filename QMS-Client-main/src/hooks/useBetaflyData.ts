import { useEffect, useRef, useState } from "react";

export interface BetaflyDevice {
  port: string;
  attitude?: { roll: number; pitch: number; yaw: number };
  altitude?: { estAlt: number; vario: number };
  analog?: { amperage: number; vbat?: number; rssi?: number };
  timestamp?: number;
}

export function useBetaflyData(socketKey: number) {
  const [devices, setDevices] = useState<BetaflyDevice[]>([]);
  const [deviceHighlight, setDeviceHighlight] = useState<{ [key: string]: "green" | "red" }>({});
  const [checking, setChecking] = useState(false);

  const devicesRef = useRef<BetaflyDevice[]>([]);
  const timeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const checkTimer = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8090");


    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

     const incomingDevices: BetaflyDevice[] = Array.isArray(data.devices)
          ? data.devices
          : data.port
          ? [data]
          : [];

        if (incomingDevices.length > 0) {
          setDevices((prev) => {
            const updated = [...prev];

            incomingDevices.forEach((incoming) => {
              const idx = updated.findIndex((d) => d.port === incoming.port);
              if (idx >= 0) {
                updated[idx] = incoming;
              } else {
                updated.push(incoming);
              }


              if (timeouts.current[incoming.port]) {
                clearTimeout(timeouts.current[incoming.port]);
              }


              timeouts.current[incoming.port] = setTimeout(() => {
                setDevices((current) =>
                  current.filter((d) => d.port !== incoming.port)
                );
              }, 2000);
            });

            devicesRef.current = updated;
            return updated;
          });
        }

      } catch (err) {
        console.error("Ошибка парсинга WS:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("Ошибка WebSocket:", err);
    };

    return () => {
      ws.close();
      Object.values(timeouts.current).forEach(clearTimeout);

    };
  }, [socketKey]);


  const startChecking = () => {
    if (checking === true) return;

    setChecking(true);
    setDeviceHighlight({});
    if (checkTimer.current) clearTimeout(checkTimer.current);


    checkTimer.current = setTimeout(() => {
            const latestDevices = devicesRef.current;

      setDeviceHighlight(() => {
        const result: { [key: string]: "green" | "red" } = {};
        latestDevices.forEach((d) => {
          const hasDataAttitude =
            (d.attitude?.roll ?? 0) !== 0 ||
            (d.attitude?.pitch ?? 0) !== 0 ||
            (d.attitude?.yaw ?? 0) !== 0;

          const hasDataAnalog = (d.analog?.amperage ?? 0) !== 0;
          const hasDataAltitude = (d.altitude?.estAlt ?? 0) !== 0;

          const hasData = hasDataAttitude && hasDataAnalog && hasDataAltitude;
          result[d.port] = hasData ? "green" : "red";

          console.log(`Port ${d.port} → hasData=${hasData}`);
        });
        return result;
      });
      setChecking(false);
    }, 5000);
  };


  const resetDeviceHiglicht = () => setDeviceHighlight({})


  return { devices, deviceHighlight, startChecking, resetDeviceHiglicht };
}
