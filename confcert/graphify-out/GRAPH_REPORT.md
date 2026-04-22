# Graph Report - confcert  (2026-04-22)

## Corpus Check
- 66 files · ~313,905 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 258 nodes · 409 edges · 13 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]

## God Nodes (most connected - your core abstractions)
1. `applyUiPreferences()` - 18 edges
2. `addLog()` - 17 edges
3. `showToast()` - 13 edges
4. `saveSolFileAs()` - 10 edges
5. `saveSolFile()` - 10 edges
6. `renderExplorerTree()` - 9 edges
7. `syncExplorerRootFromFilePath()` - 9 edges
8. `compileSource()` - 9 edges
9. `getFileLabel()` - 8 edges
10. `getActiveTab()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `decodeReceiptLogs()` --calls--> `GET()`  [INFERRED]
  electron-compiler\backend\executor.js → frontend\src\app\api\releases\latest\route.js
- `getCurrentAccount()` --calls--> `Error()`  [INFERRED]
  frontend\lib\metamask.js → frontend\src\app\error.js
- `CatchAll()` --calls--> `NotFound()`  [INFERRED]
  frontend\src\app\[...not_found]\page.js → frontend\src\app\not-found.js
- `Button()` --calls--> `cn()`  [INFERRED]
  frontend\src\components\ui\button.jsx → frontend\src\lib\utils.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (37): applySidebarLayout(), applyTerminalPanelLayout(), applyUiPreferences(), changeAllFontSizesBy(), changeEditorFontSizeBy(), changeSidebarFontSizeBy(), changeTerminalFontSizeBy(), changeTerminalHeightBy() (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (30): activateTab(), addLog(), closeTabById(), copySourceToClipboard(), createTabEntry(), escapeHtml(), findOpenTabByFilePath(), getActiveTab() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.32
Nodes (15): buildEventTopicLookup(), callFunction(), coerceByType(), decodeReceiptLogs(), deployContract(), isIntegerType(), isValidAddress(), normalizeArgs() (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (6): clearAllSessions(), disconnectSession(), getRuntimeModules(), resolveRuntimeFile(), runSafely(), serializeError()

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (15): api(), clearDeployment(), clearForFreshCompile(), compileSource(), deploySource(), renderConstructorArgs(), renderContractSelect(), resetSession() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.28
Nodes (5): Error(), connectMetaMaskWallet(), getCurrentAccount(), isMobile(), openMetaMaskDeepLink()

### Community 6 - "Community 6"
Cohesion: 0.5
Nodes (7): buildEmptyRelease(), chooseInstallerAsset(), fetchFromGithubApi(), GET(), resolveViaLatestReleaseRedirect(), toAbsoluteGithubUrl(), toVersionLabel()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (2): escapeHtml(), escapeHtmlWithBreaks()

### Community 9 - "Community 9"
Cohesion: 0.6
Nodes (5): estimateBase64Size(), getFeedbackServiceUrl(), isValidEmail(), POST(), sanitizeFilename()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (2): NotFound(), CatchAll()

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (2): Button(), cn()

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (1): compileSolidity()

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (1): Home()

## Knowledge Gaps
- **Thin community `Community 7`** (7 nodes): `server.js`, `escapeHtml()`, `escapeHtmlWithBreaks()`, `estimateBase64Size()`, `isValidEmail()`, `sanitizeFilename()`, `sanitizeText()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (4 nodes): `not-found.js`, `page.js`, `NotFound()`, `CatchAll()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (4 nodes): `Button()`, `button.jsx`, `utils.js`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (3 nodes): `compiler.js`, `compiler.js`, `compileSolidity()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (3 nodes): `page.js`, `page.js`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `decodeReceiptLogs()` connect `Community 2` to `Community 6`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `GET()` connect `Community 6` to `Community 2`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `applyUiPreferences()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._