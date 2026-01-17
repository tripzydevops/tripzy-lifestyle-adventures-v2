import React from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Globe,
  Brain,
  User,
  Scale,
  PenTool,
} from "lucide-react";

interface AgentStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "waiting" | "active" | "done";
}

interface AgentChecklistProps {
  steps: AgentStep[];
}

const AgentChecklist: React.FC<AgentChecklistProps> = ({ steps }) => {
  return (
    <div className="bg-navy-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-gold font-serif font-bold text-lg mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5" />
        Neural Council Activity
      </h3>
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-4 transition-all duration-500 ${
              step.status === "active" ? "translate-x-2" : ""
            }`}
          >
            {/* Status Icon */}
            <div className="shrink-0">
              {step.status === "done" && (
                <CheckCircle2 className="w-6 h-6 text-green-400 animate-fade-in" />
              )}
              {step.status === "active" && (
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
              )}
              {step.status === "waiting" && (
                <Circle className="w-6 h-6 text-white/10" />
              )}
            </div>

            {/* Label & Context Icon */}
            <div
              className={`flex items-center gap-3 ${
                step.status === "waiting" ? "opacity-30" : "opacity-100"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  step.status === "active"
                    ? "bg-gold/20 text-gold"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                {step.icon}
              </div>
              <span
                className={`font-medium ${
                  step.status === "active" ? "text-white" : "text-slate-300"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentChecklist;
