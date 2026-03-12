# Project Structure

This document outlines the organized structure of the Advanced Database System project.

## Folder Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Generic UI components (buttons, cards, etc.)
│   ├── layout/          # Layout components (header, sidebar, navigation)
│   └── game/            # Game-specific components
├── pages/               # Page components (Store, Library, Friends)
├── assets/              # Static assets
│   ├── images/          # Image files
│   └── icons/           # Icon files
├── hooks/               # Custom React hooks
├── utils/               # Utility functions and helpers
├── services/            # API calls and external services
├── types/               # TypeScript type definitions
├── styles/              # Global styles and CSS modules
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Component Organization

### Layout Components (`src/components/layout/`)
- `Header.tsx` - Main application header with search and user info
- `Sidebar.tsx` - Desktop navigation sidebar
- `MobileNav.tsx` - Mobile navigation bar

### UI Components (`src/components/ui/`)
- `FriendCard.tsx` - Card component for displaying friends

### Game Components (`src/components/game/`)
- `GameCard.tsx` - Card component for displaying games in store
- `LibraryItem.tsx` - Component for games in user's library

### Pages (`src/pages/`)
- `Store.tsx` - Game store page
- `Library.tsx` - User's game library
- `Friends.tsx` - Friends management page

## Types (`src/types/`)
- Centralized TypeScript type definitions for consistent typing across the application

## Services (`src/services/`)
- `api.ts` - API calls and data fetching functions

## Hooks (`src/hooks/`)
- `useGlitchEffect.ts` - Custom hook for glitch visual effects

## Utils (`src/utils/`)
- Common utility functions for formatting, calculations, etc.

## Path Aliases

The project uses Vite path aliases for cleaner imports:

```typescript
'@' → './src'
'@components' → './src/components'
'@pages' → './src/pages'
'@types' → './src/types'
'@services' → './src/services'
'@hooks' → './src/hooks'
'@utils' → './src/utils'
'@assets' → './src/assets'
```

## Benefits of This Structure

1. **Scalability**: Easy to add new pages, components, and features
2. **Maintainability**: Clear separation of concerns
3. **Reusability**: Components can be easily reused across different pages
4. **Type Safety**: Centralized type definitions ensure consistency
5. **Clean Imports**: Path aliases make imports more readable
6. **Modularity**: Each piece has a specific responsibility

## Adding New Features

### Adding a New Page
1. Create the page component in `src/pages/`
2. Add route handling in `App.tsx`
3. Update navigation components if needed

### Adding New Components
1. Place in appropriate subfolder under `src/components/`
2. Export from the component file
3. Import where needed using path aliases

### Adding New Types
1. Add to `src/types/index.ts`
2. Export for use across the application