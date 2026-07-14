export interface TaxonomyTag {
  id: string
  sourceId?: string
  label: string
  aliases: string[]
  description: string
  explicit: boolean
  weight: number
  category?: string
  subcategory?: string
  triggerWords?: string[]
}

export interface TaxonomyCategory {
  id: string
  name: string
  icon?: string
  children?: TaxonomyCategory[]
  tags?: TaxonomyTag[]
}

export interface SelectedTag extends TaxonomyTag {
  selectedAt: number
  customWeight?: number
}

export interface PromptTemplate {
  id: string
  name: string
  selections: SelectedTag[]
  customText: string
  model: SupportedModel
  createdAt: number
  updatedAt: number
  version?: number
  parentId?: string
  tags?: string[]
  // Extended template fields
  tagIds?: string[]                                              // taxonomy IDs resolved at apply-time
  slots?: TemplateSlot[]                                        // slot-based structure
  modelParams?: Partial<Record<SupportedModel, Partial<ModelParameters>>>  // per-model params
  isUserTemplate?: boolean
  isBuiltIn?: boolean
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  icon?: string
  description?: string
  category?: string
  isFavorite?: boolean
  lastOpenedAt?: number
  source?: 'composer' | 'template' | 'manual' | 'import' | 'formatter' | 'variation' | 'enhance' | 'restore'
  formatterProfileId?: string
  variables?: PromptVariable[]
  coverImageDataUrl?: string
}

export type ContentVisibility = 'filtered' | 'all'
export type WorkspaceDepth = 'simple' | 'studio'
export type WorkspaceView = 'home' | 'craft' | 'analyze' | 'library'
export type PromptDimension = 'subject' | 'setting' | 'lighting' | 'composition' | 'style'
export type FormatFamily = 'natural-language' | 'tag-list' | 'midjourney-params' | 'structured-instruction' | 'custom'
export type StorageDurability = 'persistent' | 'best-effort' | 'unavailable' | 'denied'
export type LocalAIProviderId = 'ollama' | 'lmstudio' | 'openai-compatible' | 'anthropic-compatible'
export type DraftPersistenceState = 'saving' | 'saved' | 'best-effort' | 'error'
export type EnhancementGoal = 'preserve-intent' | 'more-visual' | 'lighting' | 'composition' | 'concise'
export type FeatureIntegrity = 'complete' | 'partial' | 'simulated' | 'misleading' | 'unreachable'

export type AnalysisIntent = 'recreate' | 'art-direction'
export type AnalysisEvidence = 'observed' | 'inferred'
export type AnalysisScope = 'scene' | 'direction' | 'both'
export type VisualDimension =
  | 'subject'
  | 'setting'
  | 'composition'
  | 'camera'
  | 'lighting'
  | 'color'
  | 'medium'
  | 'material'
  | 'texture'
  | 'mood'
  | 'era'
  | 'typography'
  | 'motion'

export interface VisualObservation {
  id: string
  dimension: VisualDimension
  text: string
  evidence: AnalysisEvidence
  scope: AnalysisScope
  included: boolean
}

export interface PaletteSwatch {
  hex: string
  prominence: number
  name: string
  role: 'ground' | 'dominant' | 'support' | 'accent' | 'deepest'
  included: boolean
}

export interface ImageAnalysis {
  schemaVersion: 2
  literalDescription: string
  creativeRead: string
  selectedIntent: AnalysisIntent
  observations: VisualObservation[]
  palette: PaletteSwatch[]
  provenance: {
    provider: LocalAIProviderId
    model: string
    analyzedAt: number
  }
}

export interface AIEnhancementRequest {
  authoredText: string
  ingredients: Array<{ label: string; dimension?: string; weight?: number }>
  goal: EnhancementGoal
  formatFamily?: FormatFamily
  formatGuidance?: string
}

export interface AIEnhancementResult {
  text: string
  provider: LocalAIProviderId
  model: string
  goal: EnhancementGoal
  completedAt: number
}

export interface LocalModelCapabilities {
  text: boolean
  vision: boolean
}

export interface InspirationAsset {
  id: string
  src: string
  srcSet: string
  width: number
  height: number
  alt: string
  territory: string
  promptSeed: string
  tagIds: string[]
  palette: string[]
  mood?: string
  composition?: string
  source: 'muse-original'
}

export interface ReferenceAssetMetadata {
  mimeType: string
  width: number
  height: number
  originalBytes: number
  thumbnailDataUrl?: string
  altText: string
  analysisStatus: 'not-analyzed' | 'analyzing' | 'analyzed' | 'unsupported' | 'error'
  analyzedBy?: { provider: LocalAIProviderId; model: string; analyzedAt: number }
  analysisError?: string
}

export interface PromptVariable {
  name: string
  defaultValue?: string
  value?: string
}

export interface FormatterProfile {
  id: string
  name: string
  family: FormatFamily
  model?: SupportedModel
  version?: string
  supportsNegative: boolean
  supportsWeighting: boolean
  triggerWordStyle: 'prefix' | 'inline' | 'none'
  parameterDefaults: ModelParameters
  template?: string
  enhancementGuidance?: string
  isBuiltIn: boolean
}

export interface DraftSnapshot {
  id: string
  createdAt: number
  source: 'idle' | 'randomize' | 'template' | 'enhance' | 'import' | 'restore' | 'manual'
  customText: string
  selectedTags: SelectedTag[]
  selectedModel: SupportedModel
  formatterProfileId: string
  parameters: ModelParameters
  variables?: PromptVariable[]
}

export interface TagSearchResult {
  tag: TaxonomyTag
  score: number
  matchedPhrase: string
  matchedField: 'label' | 'alias' | 'description'
}

export interface MuseBackupV1 {
  _schema: 'muse-backup-v1'
  exportedAt: number
  appVersion: string
  state: {
    draft: DraftSnapshot
    savedPrompts: PromptTemplate[]
    savedEntities: SavedEntity[]
    referenceImages: ReferenceImage[]
    promptVersions: Record<string, PromptVersion[]>
    draftSnapshots: DraftSnapshot[]
    formatterProfiles: FormatterProfile[]
    preferences: {
      contentVisibility: ContentVisibility
      workspaceDepth: WorkspaceDepth
      theme: 'light' | 'dark'
      pinnedTags: string[]
      recentlyUsedTags: string[]
    }
  }
}

export interface ComposerAnalysis {
  rawInput: string
  suggestions: TaxonomyTag[]
  scoredSuggestions?: TagSearchResult[]
  presentDimensions: PromptDimension[]
  missingDimensions: PromptDimension[]
}

export interface TemplateSlot {
  slotId: string
  required: boolean
  tagIds: string[]
  description?: string
}

export type ModelKind = 'natural-language' | 'tag-based' | 'midjourney'

export type SupportedModel =
  | 'midjourney'
  | 'stable-diffusion'
  | 'gpt-image'
  | 'flux'
  | 'ideogram'
  | 'qwen-image'
  | 'gemini'
  | 'illustrious'
  | 'custom'

export interface ModelConfig {
  id: SupportedModel
  name: string
  kind: ModelKind
  version: string
  promptStyle: 'prose' | 'structured-prose' | 'comma-separated' | 'midjourney-params'
  supportsNegative: boolean
  supportsWeighting: boolean
  weightFormat: (tag: string, weight: number) => string
  triggerWordStyle: 'prefix' | 'inline' | 'none'
  parameters: string[]
}

export interface ModelSyntax {
  aspectRatio: string
  style: string
  quality: string
  negative: string
  weighting: (tag: string, weight: number) => string
  lora: (loraName: string, weight: number) => string
  translatePrompt?: (prompt: string) => string
}

export type EntityKind = 'character' | 'environment' | 'style' | 'mood' | 'custom'

export interface SavedEntity {
  id: string
  name: string
  kind: EntityKind
  description?: string
  tags: SelectedTag[]
  customText: string
  model: SupportedModel
  createdAt: number
  updatedAt: number
  isFavorite: boolean
}

export interface ReferenceImage {
  id: string
  dataUrl: string
  extractedTags: ExtractedTag[]
  uploadedAt: number
  name: string
  analysis?: ImageAnalysis
  visualFeatures?: VisualFeatures
  metadata?: ReferenceAssetMetadata
}

export interface ExtractedTag {
  id: string
  label: string
  confidence: number
  source: 'clip' | 'blip' | 'manual'
}

export interface CompositionAnalysis {
  ruleOfThirds: boolean
  centerComposition: boolean
  diagonal: boolean
  symmetry: boolean
  leadingLines: boolean
  depth: 'shallow' | 'medium' | 'deep'
  framing: string
}

export interface VisualFeatures {
  similarityMatches: VisualMatch[]
  styleVector: number[]
  extractedStyles: StyleElement[]
}

export interface VisualMatch {
  imageId: string
  similarity: number
  thumbnailUrl?: string
}

export interface StyleElement {
  name: string
  category: 'lighting' | 'color' | 'composition' | 'subject' | 'texture'
  strength: number
}

export interface DNARecipe {
  id: string
  name: string
  description: string
  tags: SelectedTag[]
  styleWeights: Record<string, number>
  negativePrompt?: string
  model: SupportedModel
  createdAt: number
  author?: string
  isPublic: boolean
  usageCount: number
}

export interface PromptVersion {
  id: string
  promptId: string
  version: number
  content: string
  negativeContent?: string
  model: SupportedModel
  formatterProfileId?: string
  parameters: ModelParameters
  createdAt: number
  notes?: string
  selectedTags: SelectedTag[]
  customText: string
}

export interface ModelParameters {
  aspectRatio?: string
  style?: string
  quality?: number
  chaos?: number
  seed?: number
  steps?: number
  cfgScale?: number
  sampler?: string
  [key: string]: string | number | undefined
}

export interface BatchGeneration {
  id: string
  name: string
  basePrompt: string
  permutations: BatchPermutation[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: number
  results?: BatchResult[]
}

export interface BatchPermutation {
  id: string
  variables: Record<string, string[]>
  generatedPrompts: string[]
}

export interface BatchResult {
  permutationId: string
  prompt: string
  output?: string
  error?: string
}

export interface CommunityPrompt {
  id: string
  author: string
  content: string
  negativeContent?: string
  model: SupportedModel
  tags: string[]
  likes: number
  copies: number
  createdAt: number
  isFeatured: boolean
}

export interface ABTest {
  id: string
  name: string
  variantA: ABVariant
  variantB: ABVariant
  metrics: ABMetrics
  status: 'running' | 'completed'
  createdAt: number
}

export interface ABVariant {
  id: string
  prompt: string
  weight: number
}

export interface ABMetrics {
  impressions: number
  clicks: number
  conversions: number
}

export interface StyleTransferMatrix {
  id: string
  name: string
  sourceStyles: string[]
  targetStyles: string[]
  compatibilityScores: number[][]
}

export interface PromptMutation {
  id: string
  originalPrompt: string
  mutations: PromptVariation[]
  selectedAt?: number
}

export interface PromptVariation {
  id: string
  content: string
  type: 'style_shift' | 'weight_adjust' | 'synonym' | 'composition' | 'negative_addition'
  confidence: number
  description: string
}

export interface PromptDiff {
  id: string
  promptA: string
  promptB: string
  differences: PromptDiffResult[]
  visualComparison?: string
}

export interface PromptDiffResult {
  type: 'added' | 'removed' | 'modified' | 'reordered'
  segment: string
  position: number
  significance: 'critical' | 'high' | 'medium' | 'low'
  tagId?: string
  category?: string
  description?: string
}

export interface NegativePromptIntelligence {
  contextAnalysis: ContextAnalysis
  suggestedNegatives: SuggestedNegative[]
  learnedPatterns: LearnedPattern[]
}

export interface ContextAnalysis {
  subject: string
  environment: string
  style: string
  detectedIssues: string[]
}

export interface SuggestedNegative {
  text: string
  reason: string
  priority: number
  category: string
}

export interface LearnedPattern {
  pattern: string
  frequency: number
  effectiveness: number
  model: SupportedModel
}

export interface PromptCompression {
  originalTokens: number
  compressedTokens: number
  strategy: 'truncation' | 'synonym' | 'aggregation' | 'hybrid'
  result: string
  preservedElements: string[]
  removedElements: string[]
}

export interface AppState {
  selectedTags: SelectedTag[]
  customText: string
  selectedModel: SupportedModel
  contentVisibility: ContentVisibility
  workspaceDepth: WorkspaceDepth
  workspaceView: WorkspaceView
  activeReferenceId: string | null
  activeCategory: string | null
  searchQuery: string
  savedPrompts: PromptTemplate[]
  referenceImages: ReferenceImage[]
  negativeIntelligence: NegativePromptIntelligence | null
  selectedFormatterProfileId: string
  customFormatterProfiles: FormatterProfile[]
  promptVariables: PromptVariable[]
  promptVersions: Record<string, PromptVersion[]>
  draftSnapshots: DraftSnapshot[]
  storageDurability: StorageDurability
  lastBackupAt: number | null
  activePromptId: string | null
  draftDirty: boolean
  draftPersistenceState: DraftPersistenceState
  lastEnhancement: AIEnhancementResult | null
  showInspiration: boolean
}
