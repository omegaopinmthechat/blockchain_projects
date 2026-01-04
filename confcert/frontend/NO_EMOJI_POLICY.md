# No Emoji Policy

## Project Rule: NO EMOJIS IN UI

This project **strictly prohibits** the use of emojis in any user-facing interface.

### Reasoning
1. **Professionalism**: Blockchain and financial applications require a professional appearance
2. **Accessibility**: Emojis can cause rendering issues across different platforms and browsers
3. **Clarity**: Text-based indicators are clearer and more universal
4. **Localization**: Emojis may have different meanings in different cultures

### Implementation Guidelines

#### ❌ NEVER DO THIS:
```javascript
<h1>🏠 Blockchain Rental Agreement</h1>
<p>✅ Success!</p>
<p>❌ Error occurred</p>
<span>⏳ Loading...</span>
```

#### ✅ ALWAYS DO THIS:
```javascript
<h1>Blockchain Rental Agreement</h1>
<p>SUCCESS: Operation completed!</p>
<p>ERROR: Operation failed</p>
<span>Loading...</span>
```

### Status Indicators
Use **text prefixes** and **color coding** instead of emojis:

- **Success**: `"SUCCESS:"` + green background
- **Error**: `"ERROR:"` + red background  
- **Warning**: `"WARNING:"` + amber/yellow background
- **Info**: `"INFO:"` + blue background
- **Loading**: `"Loading..."` + spinner icon (Lucide React)

### Icon Usage
Use **Lucide React icons** for visual elements:
```javascript
import { Home, DollarSign, Shield, Clock, CheckCircle } from "lucide-react";

<Home className="w-6 h-6" />
<DollarSign className="w-5 h-5" />
```

### Status Detection
When checking status in code, use text patterns:
```javascript
// ✅ Correct
status.includes("SUCCESS")
status.includes("ERROR")

// ❌ Wrong
status.includes("✅")
status.includes("❌")
```

### Enforcement
- All pull requests must be reviewed for emoji usage
- CI/CD should flag emoji characters in JSX/TSX files
- Use linting rules to detect emoji unicode characters

---

**Last Updated**: January 4, 2026  
**Applies To**: All frontend components, pages, and UI elements
