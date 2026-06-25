/**
 * Adapters - Type compatibility layer between new core logic and legacy API format
 * 
 * These adapters ensure backward compatibility with existing frontend components
 * by converting new AnatomyResult and ScoreResult formats to the legacy API formats.
 */

export {
  convertAnatomyToAnalyzeResponse,
  extractComponentContent,
} from './anatomyAdapter';

export {
  convertScoreToScoreResponse,
  createEmptyScoreResponse,
  validateScoreResponse,
} from './scoreAdapter';
