# Adapters

This directory contains adapter modules that provide backward compatibility between the new core analysis logic and the legacy API response format.

## Purpose

During the architecture simplification, we're moving from a client-server architecture to a fully client-side implementation. The adapters ensure that existing frontend components continue to work without modification by converting the new data formats to the legacy API formats.

## Modules

### anatomyAdapter.ts

Converts `AnatomyResult` (from the new `AnatomyParser`) to `AnalyzeResponse` (legacy API format).

**Key Functions:**
- `convertAnatomyToAnalyzeResponse(anatomyResult)` - Main conversion function
- `extractComponentContent(rawText, componentType, anatomyResult)` - Helper to extract component text

**Mapping:**
- Groups detected components by type
- Calculates quality scores per component type
- Generates suggestions for missing or low-quality components
- Creates a summary of the analysis

**Component Type Mapping:**
```typescript
role → role
context → context
instruction → instruction
constraint → constraint
example → example
format → output_format
output_spec → output_format
audience → audience
tone → tone
goal → instruction
input_data → context
reference → example
constraint_negative → constraint
chain_of_thought → instruction
persona → role
```

### scoreAdapter.ts

Converts `ScoreResult` (from the new `Scorer`) to `ScoreResponse` (legacy API format).

**Key Functions:**
- `convertScoreToScoreResponse(scoreResult, promptText)` - Main conversion function
- `createEmptyScoreResponse(promptText)` - Creates empty response for error cases
- `validateScoreResponse(response)` - Validates response structure

**Mapping:**
- Converts dimension scores to component scores
- Groups dimensions by associated component type
- Extracts or generates recommendations
- Preserves overall score and grade

**Dimension to Component Mapping:**
```typescript
clarity → role
specificity → constraint
completeness → instruction
structure → output_format
effectiveness → instruction
actionability → instruction
accuracy → example
relevance → context
```

## Usage

### Anatomy Conversion

```typescript
import { convertAnatomyToAnalyzeResponse } from './adapters';
import { getAnatomyParser } from './core/anatomyParser';

const parser = getAnatomyParser();
const anatomyResult = parser.parse(promptText);
const analyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

// Use analyzeResponse with existing components
```

### Score Conversion

```typescript
import { convertScoreToScoreResponse } from './adapters';
import { Scorer } from './core/scorer';

const scorer = new Scorer();
const scoreResult = scorer.score(promptText);
const scoreResponse = convertScoreToScoreResponse(scoreResult, promptText);

// Use scoreResponse with existing components
```

## Testing

Tests are located in `__tests__/` directory:
- `anatomyAdapter.test.ts` - Tests for anatomy conversion
- `scoreAdapter.test.ts` - Tests for score conversion

Run tests:
```bash
npm test -- src/adapters/__tests__ --run
```

## Migration Path

Once all components are updated to use the new formats directly, these adapters can be removed. The migration steps are:

1. Update hooks to use adapters (current phase)
2. Update components to accept both old and new formats
3. Update components to use new formats directly
4. Remove adapters and legacy type definitions

## Backward Compatibility

The adapters ensure:
- All existing component types are represented
- Missing components have appropriate suggestions
- Quality scores are calculated consistently
- Response structure matches legacy API exactly
- No breaking changes to existing components
