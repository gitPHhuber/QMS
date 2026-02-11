import React from "react";
import { Check } from "lucide-react";

interface Step {
  label: string;
  done?: boolean;
  active?: boolean;
  subtitle?: string;
}

interface WorkflowStepsProps {
  steps: Step[];
  circleSize?: number;
}

const WorkflowSteps: React.FC<WorkflowStepsProps> = ({ steps, circleSize = 36 }) => {
  return (
    <div className="flex items-start justify-center">
      {steps.map((step, idx) => {
        const isDone = !!step.done;
        const isActive = !!step.active;
        const isFuture = !isDone && !isActive;

        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center" style={{ minWidth: circleSize + 16 }}>
              <div
                className={`flex items-center justify-center rounded-full border-2 text-xs font-bold ${
                  isDone
                    ? "bg-asvo-accent text-asvo-surface border-asvo-accent"
                    : isActive
                    ? "bg-asvo-accent-dim text-asvo-accent border-asvo-accent"
                    : "bg-asvo-surface text-asvo-text-dim border-asvo-border"
                }`}
                style={{ width: circleSize, height: circleSize }}
              >
                {isDone ? <Check size={circleSize * 0.4} /> : idx + 1}
              </div>
              <span
                className={`text-[10px] mt-1 text-center leading-tight ${
                  isDone || isActive ? "text-asvo-accent" : "text-asvo-text-dim"
                }`}
              >
                {step.label}
              </span>
              {step.subtitle && (
                <span className="text-[9px] text-asvo-text-dim text-center">{step.subtitle}</span>
              )}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-[2px] w-5 mt-[${circleSize / 2}px] self-start ${
                  isDone ? "bg-asvo-accent" : "bg-asvo-border"
                }`}
                style={{ marginTop: circleSize / 2 - 1 }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default WorkflowSteps;
