import React from "react";

interface TimelineEvent {
  date: string;
  title: string;
  desc?: string;
  color?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => (
  <div className="relative pl-6">
    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-asvo-border" />
    {events.map((ev, i) => (
      <div key={i} className="relative mb-4 last:mb-0">
        <div
          className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-asvo-surface-2"
          style={{ backgroundColor: ev.color || "#2DD4A8" }}
        />
        <div className="text-[10px] text-asvo-text-dim mb-0.5">{ev.date}</div>
        <div className="text-[13px] font-medium text-asvo-text">{ev.title}</div>
        {ev.desc && <div className="text-xs text-asvo-text-mid mt-0.5">{ev.desc}</div>}
      </div>
    ))}
  </div>
);

export default Timeline;
