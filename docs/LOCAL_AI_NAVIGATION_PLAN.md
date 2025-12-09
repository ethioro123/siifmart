# Local AI Navigation Assistant - Implementation Plan

## Overview
Introduce a local AI assistant that helps users navigate the SIIFMART system intelligently, providing contextual guidance, quick actions, and natural language navigation.

---

## 🎯 Goals

1. **Natural Language Navigation**: "Show me today's sales" → Navigate to Sales Dashboard
2. **Contextual Help**: AI understands user's role and current page
3. **Quick Actions**: "Create a new PO for supplier X"
4. **Smart Search**: Find products, employees, orders across the system
5. **Offline-First**: Works without internet using local AI models
6. **Privacy**: All processing happens locally, no data sent to cloud

---

## 🏗️ Architecture

### Technology Stack

#### Option 1: Ollama (Recommended for Desktop)
```bash
# Local LLM server
- Model: Llama 3.2 (3B) or Phi-3 Mini
- Size: ~2GB
- Speed: Fast on modern hardware
- Privacy: 100% local
```

#### Option 2: WebLLM (Browser-Based)
```bash
# Runs entirely in browser
- Model: Phi-2 or TinyLlama
- Size: ~1.5GB
- Speed: Good on modern browsers
- Privacy: 100% local, no server needed
```

#### Option 3: Transformers.js (Lightweight)
```bash
# Smallest footprint
- Model: DistilBERT or MiniLM
- Size: ~100MB
- Speed: Very fast
- Privacy: 100% local
- Limitation: Simpler tasks only
```

---

## 📋 Features to Implement

### Phase 1: Smart Navigation (Week 1)

#### 1.1 AI Command Palette
```typescript
// Floating AI button (bottom-right corner)
<AIAssistant />

// Keyboard shortcut: Cmd/Ctrl + K
// Voice activation: "Hey SIIF"
```

**Capabilities**:
- "Go to inventory" → Navigate to /inventory
- "Show me pending orders" → Navigate to /procurement with filter
- "Find employee John" → Navigate to /employees with search
- "Open POS" → Navigate to /pos

#### 1.2 Contextual Suggestions
```typescript
// Based on user role and current page
interface ContextualSuggestion {
  action: string;
  description: string;
  route: string;
  icon: string;
}

// Example for Warehouse Manager on Dashboard:
[
  { action: "View pending picks", route: "/wms?tab=PICK", icon: "📦" },
  { action: "Check low stock", route: "/inventory?filter=low", icon: "⚠️" },
  { action: "Assign jobs", route: "/wms?tab=DISPATCH", icon: "🎯" }
]
```

#### 1.3 Smart Search
```typescript
// Unified search across all entities
interface SearchResult {
  type: 'product' | 'employee' | 'order' | 'customer' | 'job';
  id: string;
  title: string;
  subtitle: string;
  route: string;
  relevance: number;
}

// "Find Sara" → Shows Sara Tesfaye (employee), Sara Mohammed (manager), etc.
// "Energy drink" → Shows product + recent sales + current stock
```

---

### Phase 2: Intelligent Actions (Week 2)

#### 2.1 Natural Language Commands
```typescript
// AI interprets intent and executes actions
const commands = [
  "Create PO for 100 units of SKU-001",
  "Adjust stock for product X by +50",
  "Show sales report for last week",
  "Find all expired products",
  "Assign job JOB-123 to Meron",
  "Print barcode for SKU-456"
];
```

#### 2.2 Smart Forms
```typescript
// AI pre-fills forms based on context
"Create PO for GreenFields Corp with 50 units of Neon Energy Drink"

// AI extracts:
{
  supplier: "GreenFields Corp",
  items: [
    { product: "Neon Energy Drink", quantity: 50 }
  ]
}
// Then opens PO form with pre-filled data
```

#### 2.3 Workflow Automation
```typescript
// AI suggests next steps
interface WorkflowSuggestion {
  current: string;
  next: string[];
  reason: string;
}

// Example: After receiving PO
{
  current: "PO-9001 received",
  next: [
    "Create putaway jobs",
    "Print location labels",
    "Update inventory"
  ],
  reason: "Standard receiving workflow"
}
```

---

### Phase 3: Advanced Intelligence (Week 3)

#### 3.1 Predictive Navigation
```typescript
// AI learns user patterns
interface NavigationPattern {
  userId: string;
  timeOfDay: string;
  dayOfWeek: string;
  commonRoutes: string[];
  nextLikelyRoute: string;
}

// "Every Monday at 9am, you check pending POs"
// → Proactively suggests: "View pending POs?"
```

#### 3.2 Anomaly Detection
```typescript
// AI alerts on unusual patterns
interface Anomaly {
  type: 'stock' | 'sales' | 'performance';
  severity: 'low' | 'medium' | 'high';
  message: string;
  action: string;
}

// "Stock for SKU-001 dropped 80% today - investigate?"
// "Sales at ST-001 are 50% below average - check?"
```

#### 3.3 Smart Recommendations
```typescript
// AI suggests optimizations
interface Recommendation {
  category: string;
  suggestion: string;
  impact: string;
  action: string;
}

// "Move fast-moving items to eye-level shelves"
// "Reorder SKU-123 - predicted stockout in 3 days"
// "Assign more pickers during peak hours (2-4pm)"
```

---

## 🛠️ Implementation

### Step 1: Install Dependencies

```bash
# Option 1: Ollama (Desktop)
npm install ollama

# Option 2: WebLLM (Browser)
npm install @mlc-ai/web-llm

# Option 3: Transformers.js (Lightweight)
npm install @xenova/transformers
```

### Step 2: Create AI Service

```typescript
// services/ai.service.ts
import { pipeline } from '@xenova/transformers';

class AIService {
  private model: any;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    // Load lightweight model for navigation
    this.model = await pipeline(
      'text-classification',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    );
    
    this.initialized = true;
  }

  async interpretCommand(command: string): Promise<NavigationIntent> {
    // Parse user intent
    const intent = await this.classifyIntent(command);
    
    // Map to navigation action
    return this.mapToAction(intent);
  }

  private async classifyIntent(text: string): Promise<string> {
    // Use local AI to classify intent
    const result = await this.model(text);
    return result[0].label;
  }

  private mapToAction(intent: string): NavigationIntent {
    // Map AI intent to app navigation
    const intentMap = {
      'view_inventory': { route: '/inventory', action: 'navigate' },
      'create_order': { route: '/procurement', action: 'open_modal' },
      'search_employee': { route: '/employees', action: 'search' },
      // ... more mappings
    };
    
    return intentMap[intent] || { route: '/', action: 'navigate' };
  }
}

export const aiService = new AIService();
```

### Step 3: Create AI Assistant Component

```typescript
// components/AIAssistant.tsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Mic, Send } from 'lucide-react';
import { aiService } from '../services/ai.service';
import { useNavigate } from 'react-router-dom';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize AI on mount
    aiService.initialize();
    
    // Load contextual suggestions
    loadSuggestions();
  }, []);

  const handleCommand = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const intent = await aiService.interpretCommand(input);
      
      // Execute navigation
      if (intent.action === 'navigate') {
        navigate(intent.route);
      } else if (intent.action === 'search') {
        navigate(`${intent.route}?q=${encodeURIComponent(input)}`);
      }
      
      setInput('');
      setIsOpen(false);
    } catch (error) {
      console.error('AI command failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = () => {
    // Get role-based suggestions
    const userRole = user?.role;
    const contextSuggestions = getContextualSuggestions(userRole);
    setSuggestions(contextSuggestions);
  };

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group z-50"
        title="AI Assistant (Cmd+K)"
      >
        <Sparkles className="text-white group-hover:scale-110 transition-transform" size={24} />
      </button>

      {/* AI Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold">SIIF AI Assistant</h3>
                  <p className="text-xs text-gray-400">Ask me anything or navigate anywhere</p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCommand()}
                  placeholder="Try: 'Show pending orders' or 'Find employee Sara'"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleCommand}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : <Send size={20} />}
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-6">
                <p className="text-xs text-gray-400 uppercase font-bold mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion);
                        handleCommand();
                      }}
                      className="text-left px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Close */}
            <div className="p-4 border-t border-white/10 flex justify-between items-center">
              <p className="text-xs text-gray-500">Powered by local AI • 100% private</p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getContextualSuggestions(role: string): string[] {
  const suggestions = {
    warehouse_manager: [
      'Show pending picks',
      'View low stock items',
      'Check job assignments',
      'Open WMS dashboard'
    ],
    dispatcher: [
      'Assign new job',
      'View active jobs',
      'Check employee availability',
      'Open dispatch board'
    ],
    pos: [
      'Open POS',
      'View today\'s sales',
      'Check shift summary',
      'Find customer'
    ],
    admin: [
      'View all sites',
      'Check system logs',
      'Manage employees',
      'View reports'
    ]
  };

  return suggestions[role] || [
    'Go to dashboard',
    'View inventory',
    'Check orders',
    'Find employee'
  ];
}
```

### Step 4: Add Keyboard Shortcuts

```typescript
// hooks/useAIShortcuts.ts
import { useEffect } from 'react';

export function useAIShortcuts(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}
```

### Step 5: Integrate into Layout

```typescript
// components/Layout.tsx
import { AIAssistant } from './AIAssistant';

export function Layout({ children }) {
  return (
    <div>
      {/* Existing layout */}
      {children}
      
      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
```

---

## 📊 Training Data Structure

```typescript
// data/ai-training.json
{
  "navigation": [
    {
      "intent": "view_inventory",
      "examples": [
        "show inventory",
        "view products",
        "check stock",
        "go to inventory"
      ],
      "route": "/inventory"
    },
    {
      "intent": "create_order",
      "examples": [
        "create order",
        "new purchase order",
        "make PO",
        "order from supplier"
      ],
      "route": "/procurement",
      "action": "open_modal"
    }
  ],
  "entities": {
    "products": ["SKU", "product name", "barcode"],
    "employees": ["name", "email", "employee ID"],
    "orders": ["PO number", "order ID"],
    "customers": ["name", "phone", "email"]
  }
}
```

---

## 🎨 UI/UX Design

### Floating Button States
- **Idle**: Purple gradient, pulsing glow
- **Listening**: Animated microphone icon
- **Processing**: Loading spinner
- **Success**: Checkmark animation
- **Error**: Red shake animation

### Modal Design
- **Dark theme** with glassmorphism
- **Gradient accents** (purple to pink)
- **Smooth animations** (slide up, fade in)
- **Keyboard navigation** (Tab, Enter, Esc)

---

## 🔒 Privacy & Security

1. **100% Local Processing**: No data sent to external servers
2. **No Tracking**: AI doesn't log or store queries
3. **Offline-First**: Works without internet
4. **Role-Based**: Respects user permissions
5. **Audit Trail**: Log AI actions for compliance

---

## 📈 Performance Optimization

1. **Lazy Loading**: Load AI model only when needed
2. **Caching**: Cache common queries
3. **Debouncing**: Wait for user to finish typing
4. **Web Workers**: Run AI in background thread
5. **Progressive Enhancement**: Fallback to simple search if AI unavailable

---

## 🧪 Testing Strategy

```typescript
// tests/ai-navigation.test.ts
describe('AI Navigation', () => {
  it('should navigate to inventory on "show inventory"', async () => {
    const result = await aiService.interpretCommand('show inventory');
    expect(result.route).toBe('/inventory');
  });

  it('should search employees on "find Sara"', async () => {
    const result = await aiService.interpretCommand('find Sara');
    expect(result.route).toContain('/employees');
    expect(result.action).toBe('search');
  });

  it('should respect role permissions', async () => {
    const result = await aiService.interpretCommand('view all sites', 'pos');
    expect(result.allowed).toBe(false);
  });
});
```

---

## 📅 Implementation Timeline

### Week 1: Foundation
- [ ] Set up AI service (Transformers.js)
- [ ] Create AIAssistant component
- [ ] Implement basic navigation commands
- [ ] Add keyboard shortcuts

### Week 2: Intelligence
- [ ] Add contextual suggestions
- [ ] Implement smart search
- [ ] Create training data
- [ ] Add voice input (optional)

### Week 3: Polish
- [ ] Optimize performance
- [ ] Add animations
- [ ] Write tests
- [ ] User testing & feedback

---

## 💡 Future Enhancements

1. **Voice Commands**: "Hey SIIF, show me today's sales"
2. **Multi-language**: Support Amharic, Oromo
3. **Learning**: AI learns from user patterns
4. **Proactive**: AI suggests actions before asked
5. **Integration**: Connect with external tools (email, calendar)

---

## 🎯 Success Metrics

- **Adoption**: % of users using AI assistant
- **Accuracy**: % of commands correctly interpreted
- **Speed**: Average time to complete navigation
- **Satisfaction**: User feedback score
- **Efficiency**: Reduction in clicks to complete tasks

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install @xenova/transformers

# 2. Create AI service
# Copy services/ai.service.ts

# 3. Create AI component
# Copy components/AIAssistant.tsx

# 4. Add to Layout
# Import and render <AIAssistant />

# 5. Test
npm run dev
# Press Cmd+K to open AI assistant
```

---

## 📚 Resources

- [Transformers.js Docs](https://huggingface.co/docs/transformers.js)
- [WebLLM](https://github.com/mlc-ai/web-llm)
- [Ollama](https://ollama.ai/)
- [Local AI Best Practices](https://github.com/jmorganca/ollama/blob/main/docs/best-practices.md)

---

**Ready to implement?** This will make SIIFMART incredibly intuitive and user-friendly! 🚀
