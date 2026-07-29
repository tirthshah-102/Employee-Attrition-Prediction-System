import React from 'react';
import { 
  GitBranch, 
  SearchCode, 
  Settings, 
  MessageSquareCode, 
  ShieldCheck, 
  BellRing
} from 'lucide-react';

interface FeatureItem {
  icon: React.ComponentType<any>;
  title: string;
  codeLabel: string;
  description: string;
}

const features: FeatureItem[] = [
  {
    icon: GitBranch,
    title: 'Automatic Employee Data Sync',
    codeLabel: 'Data Integration',
    description: 'Auto-syncs activity metrics across performance, attendance, and feedback APIs (such as BambooHR, Slack, O365, and Jira) to build a unified employee experience model.'
  },
  {
    icon: SearchCode,
    title: 'AI Risk Driver Analysis',
    codeLabel: 'Risk Analysis Engine',
    description: 'Bypasses black-box prediction. Uses mathematical Shapley value computations to explain the precise triggers behind every risk assessment (e.g., workload vs. salary stagnation).'
  },
  {
    icon: Settings,
    title: 'Custom Action Plans',
    codeLabel: 'Action Plan Generator',
    description: 'Dynamically structures action plans, aligning them directly with the identified drivers of friction. Recommends training tracks, mentor pairings, or compensation adjustments.'
  },
  {
    icon: MessageSquareCode,
    title: 'AI Summary Reports',
    codeLabel: 'Report Compiler',
    description: 'Packages statistical tables and data trails into professional natural language briefs. Summarizes findings and recommendations for rapid executive and HR leadership evaluation.'
  },
  {
    icon: ShieldCheck,
    title: 'Secure Data Protection',
    codeLabel: 'Security Encryption',
    description: 'Designed with role-based access control (RBAC) and data protection at its core. Empowers HR teams to safely handle employee activity telemetry with full audit transparency.'
  },
  {
    icon: BellRing,
    title: 'Smart Risk Alerts',
    codeLabel: 'Alert Dispatcher',
    description: 'Triggers automated, instant notifications to HR dashboards or internal systems immediately when employee attrition risk indices cross configured thresholds.'
  }
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 border-b border-border-primary/60 bg-primary-bg">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 rounded text-xs font-mono tracking-wider text-accent-blue uppercase mb-4">
            <Settings className="w-3.5 h-3.5" />
            <span>Platform Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            System Capabilities
          </h2>
          <p className="text-slate-400 text-sm">
            AttriSense AI pairs modern predictive modeling with multi-agent orchestration to transition HR teams from reactive retention tactics to proactive, data-supported operations.
          </p>
        </div>

        {/* 12-Column Tactical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const IconComponent = feature.icon;
            
            return (
              <div 
                key={i} 
                className="bg-secondary-bg/50 border border-border-primary/60 p-6 rounded flex flex-col justify-between transition-all duration-300 hover:border-accent-blue/55 group"
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between border-b border-border-primary/60/50 pb-4 mb-5">
                    <span className="font-mono text-[9px] text-accent-blue tracking-widest uppercase">
                      {feature.codeLabel}
                    </span>
                    <div className="p-1.5 rounded border border-border-primary/60 bg-secondary-bg/80 text-slate-400 group-hover:text-accent-blue group-hover:border-accent-blue/30 transition-all duration-300">
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="font-bold text-base text-white mb-2.5 group-hover:text-accent-blue transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-sans">
                    {feature.description}
                  </p>
                </div>

                {/* Sub-label */}
                <div className="mt-6 pt-3 border-t border-border-primary/60/30 flex items-center justify-between font-mono text-[9px] text-slate-600">
                  <span>Role: HR Admin</span>
                  <span>Security: Verified</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
