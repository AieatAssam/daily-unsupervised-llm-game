# Game Folder Structure

Each game is organized in its own date-based folder for easy navigation and maintenance.

## Folder Organization

```
games/
├── 2026-02-15/              # First game (Feb 15, 2026)
│   ├── game.jsx            # React game code
│   ├── game.test.js        # Automated tests
│   └── preview.png         # Preview image (1200x630px)
│
├── 2026-02-16/              # Second game (Feb 16, 2026)
│   ├── game.jsx
│   ├── game.test.js
│   └── preview.png
│
└── 2026-02-17/              # Third game (Feb 17, 2026)
    ├── game.jsx
    ├── game.test.js
    └── preview.png
```

## Why Date-Based Folders?

✅ **Organization**: Each day's game is self-contained  
✅ **Easy Navigation**: Browse by date chronologically  
✅ **Clean Structure**: All related files together  
✅ **Git-Friendly**: Clear commit history per day  
✅ **Scalability**: Works for years of daily games  

## File Naming Convention

**Folder Name**: `YYYY-MM-DD` (ISO 8601 date format)
- Example: `2026-02-15` for February 15, 2026

**Files Inside** (always the same names):
- `game.jsx` - The game code
- `game.test.js` - The test suite
- `preview.png` - The preview image

## Registry Reference

Each folder is referenced in `games-registry.json`:

```json
{
  "id": "2026-02-15",
  "name": "Neon Stack",
  "date": "2026-02-15",
  "folder": "games/2026-02-15",
  "file": "games/2026-02-15/game.jsx",
  "preview": "games/2026-02-15/preview.png",
  ...
}
```

## Benefits

1. **Chronological Browsing**: Easy to see games in order
2. **Version Control**: Each day is a clean commit
3. **Testing**: Playwright finds tests in date folders
4. **Deployment**: All assets bundled by date
5. **Maintenance**: Easy to find and update specific games

## Example: February 15, 2026

```
games/2026-02-15/
├── game.jsx         (800 lines of React JSX)
├── game.test.js     (6 automated tests)
└── preview.png      (vibrant mid-game screenshot)
```

**URL in browser**: `/games/2026-02-15/game.jsx`  
**Test command**: `npx playwright test games/2026-02-15/game.test.js`  
**Preview URL**: `/games/2026-02-15/preview.png`

## Migration from Flat Structure

If you're moving from a flat file structure:

**Old** (flat):
```
games/
  2026-02-15-neon-stack.jsx
  2026-02-15-neon-stack.test.js
previews/
  2026-02-15-neon-stack.png
```

**New** (folders):
```
games/
  2026-02-15/
    game.jsx
    game.test.js
    preview.png
```

This structure is cleaner and scales better for hundreds of games!
