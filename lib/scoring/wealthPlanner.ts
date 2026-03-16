export type RiskLevel = "low" | "balanced" | "aggressive";

export interface FounderProfile {
  hoursPerWeek: number;
  monthlyCapital: number;
  riskLevel: RiskLevel;
  targetMonthlyIncome: number;
  skillTags: string[];
  existingAudience: number;
  automationReadiness: number;
}

export interface OpportunityBlueprint {
  id: string;
  name: string;
  category: string;
  summary: string;
  minimumCapital: number;
  minimumHours: number;
  risk: RiskLevel;
  mobileFirst: boolean;
  requiredSkills: string[];
  scoreWeights: {
    speed: number;
    margin: number;
    automation: number;
    distribution: number;
    moat: number;
  };
  actions: string[];
}

export interface RankedOpportunity extends OpportunityBlueprint {
  score: number;
  scoreBreakdown: {
    fit: number;
    capitalEfficiency: number;
    riskAlignment: number;
    timeAlignment: number;
    weightedPotential: number;
  };
  thirtyDayTarget: string;
}

const blueprints: OpportunityBlueprint[] = [
  {
    id: "micro-saas-agent",
    name: "Pocket Ops Agent SaaS",
    category: "AI Product",
    summary: "Launch a narrow AI workflow app sold as a monthly mobile-first subscription.",
    minimumCapital: 40,
    minimumHours: 8,
    risk: "balanced",
    mobileFirst: true,
    requiredSkills: ["automation", "ai", "product"],
    scoreWeights: {
      speed: 7,
      margin: 9,
      automation: 10,
      distribution: 6,
      moat: 8,
    },
    actions: [
      "Ship a one-screen MVP that removes one painful manual workflow.",
      "Offer a 7-day onboarding sprint with ROI proof screenshot.",
      "Install in-app referral loop with reward credits.",
    ],
  },
  {
    id: "creator-licensing-engine",
    name: "Creator Asset Licensing Engine",
    category: "Digital Assets",
    summary: "Build reusable templates, prompts, and automations licensed to niche operators.",
    minimumCapital: 0,
    minimumHours: 6,
    risk: "low",
    mobileFirst: true,
    requiredSkills: ["design", "copywriting", "ai"],
    scoreWeights: {
      speed: 9,
      margin: 8,
      automation: 7,
      distribution: 7,
      moat: 6,
    },
    actions: [
      "Package 5 high-conversion assets for one niche audience.",
      "Publish proof-of-use reels and CTA to a checkout link.",
      "Automate buyer onboarding with a chat-based delivery bot.",
    ],
  },
  {
    id: "service-retainer-factory",
    name: "AI Service Retainer Factory",
    category: "Hybrid Service",
    summary: "Sell recurring operator services, then automate delivery into productized playbooks.",
    minimumCapital: 20,
    minimumHours: 10,
    risk: "low",
    mobileFirst: true,
    requiredSkills: ["sales", "operations", "automation"],
    scoreWeights: {
      speed: 10,
      margin: 7,
      automation: 8,
      distribution: 8,
      moat: 7,
    },
    actions: [
      "DM 30 ICP prospects with a single quantified offer.",
      "Close first client with weekly KPI-based reporting.",
      "Convert repeated tasks into SOP + automation blocks.",
    ],
  },
  {
    id: "deal-radar-arbitrage",
    name: "Deal Radar Arbitrage",
    category: "Market Intelligence",
    summary: "Track undervalued products/services and broker deals with automated matching.",
    minimumCapital: 30,
    minimumHours: 5,
    risk: "aggressive",
    mobileFirst: true,
    requiredSkills: ["research", "sales", "analytics"],
    scoreWeights: {
      speed: 8,
      margin: 8,
      automation: 6,
      distribution: 9,
      moat: 8,
    },
    actions: [
      "Build niche watchlists with alert thresholds.",
      "Broker 3 matches between buyers and undervalued inventory.",
      "Capture spread and reinvest profits into automation.",
    ],
  },
];

const riskDistance = (founderRisk: RiskLevel, opportunityRisk: RiskLevel) => {
  const order: RiskLevel[] = ["low", "balanced", "aggressive"];
  return Math.abs(order.indexOf(founderRisk) - order.indexOf(opportunityRisk));
};

export const buildOpportunityPlan = (profile: FounderProfile): RankedOpportunity[] => {
  return blueprints
    .map((item) => {
      const matchedSkills = item.requiredSkills.filter((skill) => profile.skillTags.includes(skill));
      const fit = Math.round((matchedSkills.length / item.requiredSkills.length) * 100);
      const capitalEfficiency = Math.max(
        0,
        Math.min(100, Math.round((profile.monthlyCapital / Math.max(item.minimumCapital, 1)) * 60 + 40))
      );
      const riskAlignment = Math.max(0, 100 - riskDistance(profile.riskLevel, item.risk) * 35);
      const timeAlignment = Math.max(
        0,
        Math.min(100, Math.round((profile.hoursPerWeek / item.minimumHours) * 65 + 35))
      );

      const weightedPotential = Math.round(
        (item.scoreWeights.speed * timeAlignment +
          item.scoreWeights.margin * capitalEfficiency +
          item.scoreWeights.automation * profile.automationReadiness +
          item.scoreWeights.distribution * Math.min(100, profile.existingAudience / 20 + 30) +
          item.scoreWeights.moat * fit) /
          40
      );

      const score = Math.round(
        fit * 0.28 +
          capitalEfficiency * 0.17 +
          riskAlignment * 0.2 +
          timeAlignment * 0.15 +
          weightedPotential * 0.2
      );

      return {
        ...item,
        score,
        scoreBreakdown: {
          fit,
          capitalEfficiency,
          riskAlignment,
          timeAlignment,
          weightedPotential,
        },
        thirtyDayTarget: generateThirtyDayTarget(item, profile, score),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

const generateThirtyDayTarget = (opportunity: OpportunityBlueprint, profile: FounderProfile, score: number) => {
  const baselineRevenue = Math.max(300, Math.round((profile.targetMonthlyIncome * score) / 140));
  const confidenceBand = Math.round((100 - Math.abs(score - 78)) / 2);
  return `Projected month-1 revenue: $${baselineRevenue.toLocaleString()} at ${Math.max(
    35,
    confidenceBand
  )}% confidence if you execute weekly actions.`;
};

export const buildDailyExecutionLoop = (profile: FounderProfile, topOpportunity: RankedOpportunity) => {
  const deepWorkMinutes = Math.min(180, Math.max(45, Math.round((profile.hoursPerWeek * 60) / 7)));
  return [
    `Signal Scan (${Math.round(deepWorkMinutes * 0.2)} min): check demand, objections, and pricing shifts.`,
    `Asset Build (${Math.round(deepWorkMinutes * 0.5)} min): ship one monetizable deliverable for ${topOpportunity.name}.`,
    `Distribution Sprint (${Math.round(deepWorkMinutes * 0.3)} min): publish, pitch, or outreach to 15+ buyers.`,
  ];
};
