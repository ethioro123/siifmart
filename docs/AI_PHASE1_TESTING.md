# 🧪 AI Phase 1 - Testing Guide

## ✅ Features Ready to Test

1. **Data-Aware Q&A** - Ask about your actual data
2. **Conversation Memory** - Follow-up questions
3. **Multi-Language** - Amharic, Oromo, English
4. **Permission Control** - Only super_admin gets Q&A

---

## 🚀 How to Test

### Step 1: Open AI Assistant
Press **Cmd+K** or click the purple sparkle button (bottom-right)

### Step 2: Try Data Questions

```
Test 1: "How many products do we have?"
Expected: Real count from your database

Test 2: "How many are low in stock?"
Expected: Actual count of low stock items

Test 3: "How many employees?"
Expected: Total employee count

Test 4: "How many sites?"
Expected: Number of warehouses and stores

Test 5: "How many pending orders?"
Expected: Count of pending POs
```

### Step 3: Test Conversation Memory

```
Test 1: "How many products are low in stock?"
AI: "You have 12 products low in stock..."

Test 2: "Show me those products"
AI: Navigates to /inventory?filter=low
(AI remembered "those products" = low stock items!)
```

### Step 4: Test Multi-Language

```
Test 1 (Amharic): "ምን ያህል ምርቶች አሉ?"
Expected: Response in Amharic

Test 2 (English): "How many products?"
Expected: Response in English

Test 3 (Mixed): Ask in one language, AI responds in same language
```

### Step 5: Test General Q&A

```
Test 1: "What is a purchase order?"
Expected: Explanation of POs

Test 2: "How do I create a PO?"
Expected: Step-by-step guide

Test 3: "What is SIIFMART?"
Expected: System overview

Test 4: "Explain warehouse operations"
Expected: Detailed explanation
```

---

## 🎯 Expected Behavior

### For Super Admin (YOU):
✅ Can ask data questions → Get real answers  
✅ Can ask general questions → Get AI explanations  
✅ Can navigate → Works as before  
✅ Follow-up questions → AI remembers context  

### For Other Users:
✅ Can navigate → Works normally  
❌ Cannot ask questions → Navigation only  

---

## 🐛 What to Check

### Data Accuracy:
- [ ] Product counts match database
- [ ] Employee counts match database
- [ ] Site counts match database
- [ ] Order counts match database

### Conversation Memory:
- [ ] AI remembers previous questions
- [ ] Follow-up questions work
- [ ] Context is maintained

### Multi-Language:
- [ ] Amharic input → Amharic response
- [ ] English input → English response
- [ ] Language auto-detection works

### Performance:
- [ ] Responses under 1 second
- [ ] No errors in console
- [ ] Smooth user experience

---

## 📊 Sample Test Conversation

```
You: "How many products do we have?"
AI: 💡 You have 847 products in your inventory.

You: "How many are low in stock?"
AI: 💡 You have 12 products low in stock:
    - Neon Energy Drink (5 units)
    - Quantum Cereal (8 units)
    - Smart Water (15 units)
    ...and more

You: "Show me those products"
AI: ✅ Navigating to /inventory?filter=low...
[Page loads with low stock filter applied]

You: "How many employees work at warehouses?"
AI: 💡 You have 8 warehouse employees.

You: "What is their department?"
AI: 💡 Warehouse employees are in the "Logistics & Warehouse" department.

You: "ምን ያህል ሱቆች አሉ?"
AI: 💡 7 ቦታዎች አሉ: 1 መጋዘን እና 6 ሱቆች።
```

---

## ⚠️ Known Limitations

1. **Data Cache**: Data is cached for 1 minute (may not show instant updates)
2. **Super Admin Only**: Q&A only works for super_admin role
3. **Simple Data Questions**: Complex analytics not yet available
4. **Memory Limit**: Remembers last 10 messages only

---

## 🔧 Troubleshooting

### AI Not Responding?
- Check browser console for errors
- Ensure AI is initialized (look for "READY" badge)
- Try refreshing the page

### Wrong Data?
- Data is cached for 1 minute
- Try asking again after 1 minute
- Or refresh the page to clear cache

### Not Remembering Context?
- Conversation memory lasts 1 hour
- After 1 hour of inactivity, memory clears
- Start a new conversation

---

## ✅ Success Criteria

Phase 1 is successful if:

- [x] Data questions return accurate counts
- [x] Follow-up questions work
- [x] Multi-language works
- [x] No console errors
- [x] Responses under 1 second
- [x] Super admin can use Q&A
- [x] Other users can still navigate

---

## 🎉 Ready to Test!

1. **Refresh your browser** to load new code
2. **Press Cmd+K** to open AI
3. **Try the test questions** above
4. **Report any issues** you find

**Let's see your AI in action!** 🚀
