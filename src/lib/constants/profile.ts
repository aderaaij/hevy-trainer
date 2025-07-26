export const FOCUS_AREAS = [
  "strength",
  "hypertrophy",
  "endurance",
  "powerlifting", 
  "bodybuilding",
  "general_fitness",
  "weight_loss",
  "athletic_performance",
  "flexibility",
  "mobility"
] as const

export const COMMON_INJURIES = [
  "lower_back",
  "knee",
  "shoulder",
  "wrist",
  "ankle",
  "hip",
  "elbow",
  "neck",
  "hamstring",
  "calf"
] as const

export type FocusArea = typeof FOCUS_AREAS[number]
export type CommonInjury = typeof COMMON_INJURIES[number]