# Data Module

This directory contains static data and constants used throughout the application. All data is stored locally as TypeScript modules, eliminating the need for backend API calls.

## Files

### `templates.ts`
Professional prompt templates organized by category. Includes helper functions for filtering and searching templates.

**Exports:**
- `templates`: Array of all available templates
- `getTemplateCategories()`: Get all unique categories
- `getTemplatesByCategory(category)`: Filter templates by category
- `searchTemplates(query)`: Search templates by name or description
- `getTemplateById(id)`: Get a specific template by ID

### `components.ts`
Detailed information about each prompt anatomy component, including descriptions, best practices, and examples.

**Exports:**
- `componentInfo`: Array of all component information
- `getComponentInfo(id)`: Get info for a specific component
- `getAllComponentIds()`: Get all component IDs
- `getComponentsByImportance()`: Get components sorted by importance

### `constants.ts`
Visual styling constants for prompt components.

**Exports:**
- `COMPONENT_COLORS`: Color mapping for each component type
- `COMPONENT_LABELS`: Display labels for each component type

### `index.ts`
Barrel export file that re-exports all data modules for convenient importing.

## Usage

```typescript
// Import templates
import { templates, searchTemplates } from '@/data';

// Import component info
import { componentInfo, getComponentInfo } from '@/data';

// Import constants
import { COMPONENT_COLORS, COMPONENT_LABELS } from '@/data';
```

## Migration Notes

This data was previously served by the backend API at `/api/templates` and `/api/components`. It has been converted to static TypeScript modules as part of the architecture simplification (Task 7.1 and 7.2).

The constants `COMPONENT_COLORS` and `COMPONENT_LABELS` were moved from `api/types.ts` to this directory as they represent static data rather than API types (Task 8.4).
