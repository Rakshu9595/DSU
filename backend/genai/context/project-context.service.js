
const PROJECT_CONFIG = Object.freeze({
  name: "VisionTwin",

  description:
    "An intelligent energy-efficiency platform using computer vision, appliance context, a digital twin, and generative AI to identify potential energy waste and suggest ways to reduce energy consumption and carbon emissions.",

  goals: [
    "Detect and classify visible energy-consuming appliances using computer vision.",
    "Estimate energy consumption when appliance power ratings and usage hours are available.",
    "Represent rooms and appliances in a 3D digital twin.",
    "Identify potential energy-saving opportunities.",
    "Generate actionable energy-efficiency recommendations.",
    "Create sustainability summaries and reports."
  ],

  constraints: {
    iotEnabled: false,
    realTimePowerMeasurementAvailable: false,
    actualEnergyReadingsAvailableByDefault: false,
    automaticApplianceControlEnabled: false
  },

  technology: {
    backend: "Node.js",
    serverFramework: "Express",
    moduleSystem: "ES modules",
    genAIProvider: "Groq",
    computerVision: "YOLO-based appliance detection",
    digitalTwin: "Three.js"
  },

  energyRules: [
    "Never describe estimated consumption as measured consumption.",
    "Do not invent appliance power ratings, usage hours, tariffs, or emissions factors.",
    "Calculate estimated energy in kWh only when the required inputs are available.",
    "Calculate estimated electricity cost only when a tariff is provided.",
    "Calculate estimated carbon emissions only when an emissions factor is provided.",
    "Explain important assumptions behind energy calculations."
  ],

  recommendationRules: [
    "Prioritize practical and low-cost energy-saving actions.",
    "Explain why each recommendation may help.",
    "Use supplied evidence to support recommendations.",
    "Do not claim guaranteed energy or carbon savings.",
    "Clearly state when additional information is required.",
    "Do not claim to switch appliances on or off automatically."
  ]
});

/**
 * Returns a copy of the project configuration.
 */
export function getProjectContext() {
  return structuredClone(PROJECT_CONFIG);
}

/**
 * Returns a concise project description for AI prompts.
 */
export function formatProjectContext() {
  const project = PROJECT_CONFIG;

  return [
    `PROJECT: ${project.name}`,
    "",
    "DESCRIPTION:",
    project.description,
    "",
    "PROJECT GOALS:",
    ...project.goals.map((goal, index) => `${index + 1}. ${goal}`),
    "",
    "TECHNOLOGY STACK:",
    ...Object.entries(project.technology).map(
      ([key, value]) => `${key}: ${value}`
    ),
    "",
    "SYSTEM CONSTRAINTS:",
    `IoT enabled: ${project.constraints.iotEnabled}`,
    `Real-time power measurement available: ${project.constraints.realTimePowerMeasurementAvailable}`,
    `Actual energy readings available by default: ${project.constraints.actualEnergyReadingsAvailableByDefault}`,
    `Automatic appliance control enabled: ${project.constraints.automaticApplianceControlEnabled}`,
    "",
    "ENERGY CALCULATION RULES:",
    ...project.energyRules.map((rule) => `- ${rule}`),
    "",
    "RECOMMENDATION RULES:",
    ...project.recommendationRules.map((rule) => `- ${rule}`)
  ].join("\n");
}

/**
 * Creates a project-aware system prompt for the GenAI service.
 */
export function createProjectSystemPrompt() {
  return [
    `You are the GenAI assistant for ${PROJECT_CONFIG.name}.`,
    formatProjectContext(),
    "",
    "Follow the project constraints and rules in every response.",
    "Separate known facts, assumptions, estimates, and missing information.",
    "Never imply that a feature is implemented unless its availability is confirmed."
  ].join("\n");
}

export default getProjectContext;
