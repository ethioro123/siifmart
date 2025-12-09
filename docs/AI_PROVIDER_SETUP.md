# AI Provider Setup Guide

SIIFMART now supports multiple AI providers for the AI Assistant feature. Choose the one that works best for you!

## 🤖 Available Providers

### 1. **Offline Mode** (Default)
- ✅ **No API key required**
- ✅ Works immediately
- ⚠️ Limited to basic navigation commands only
- Best for: Testing the app without AI features

### 2. **OpenRouter** (Recommended)
- ✅ **Free tier**: 50 requests/day, 20/minute
- ✅ Access to 25+ free models
- ✅ Good variety of models
- 🔗 Get API key: https://openrouter.ai/keys

**How to get OpenRouter API key:**
1. Visit https://openrouter.ai
2. Sign up with email or GitHub
3. Go to Keys section
4. Create a new API key
5. Copy and paste into SIIFMART Settings > Integrations

### 3. **Hugging Face**
- ✅ **Free inference API**
- ✅ No credit card required
- ✅ Good for experimentation
- 🔗 Get token: https://huggingface.co/settings/tokens

**How to get Hugging Face token:**
1. Visit https://huggingface.co
2. Create a free account
3. Go to Settings > Access Tokens
4. Create a new token (Read access is enough)
5. Copy and paste into SIIFMART Settings > Integrations

### 4. **Groq**
- ✅ **Ultra-fast LPU inference**
- ✅ 100% free tier
- ✅ Best for speed (0.2s responses)
- ⚠️ Currently not accepting new signups (check back later)
- 🔗 Get API key: https://console.groq.com/keys

**How to get Groq API key (when available):**
1. Visit https://console.groq.com
2. Sign up for free account
3. Go to API Keys section
4. Create a new API key
5. Copy and paste into SIIFMART Settings > Integrations

## 📝 How to Configure

1. **Open Settings**
   - Click on Settings in the sidebar
   - Navigate to the "Integrations" tab

2. **Select AI Provider**
   - Choose your preferred provider from the dropdown
   - Options: Offline, OpenRouter, Hugging Face, or Groq

3. **Add API Key**
   - Paste your API key in the input field
   - Click "Get Free Key" button for quick access to provider's website
   - Keys are stored locally in your browser

4. **Verify Status**
   - Check the status indicator at the bottom
   - Green = Ready, Gray = Not Configured

## 🔒 Security

- All API keys are stored **locally** in your browser's localStorage
- Keys are **never sent to our servers**
- Keys are only used to communicate directly with your chosen AI provider
- You can change or remove keys anytime in Settings

## 💡 Tips

- **Start with Offline Mode** to test the app
- **OpenRouter** is recommended for most users (good balance of features and limits)
- **Groq** is fastest but may have signup restrictions
- **Hugging Face** is great if you want to experiment with open-source models

## 🆘 Troubleshooting

**AI not responding?**
- Check that you've selected a provider (not Offline Mode)
- Verify your API key is correct
- Check the status indicator shows "READY"
- Try switching to a different provider

**Hit rate limits?**
- OpenRouter: 50 requests/day limit
- Try switching to a different provider
- Wait 24 hours for limits to reset

**Provider not working?**
- Verify your API key is valid
- Check provider's status page
- Try the "Get Free Key" button to get a new key
- Switch to Offline Mode as fallback

## 📚 Features by Mode

| Feature | Offline | OpenRouter | Hugging Face | Groq |
|---------|---------|------------|--------------|------|
| Basic Navigation | ✅ | ✅ | ✅ | ✅ |
| Smart Q&A | ❌ | ✅ | ✅ | ✅ |
| Command Interpretation | ❌ | ✅ | ✅ | ✅ |
| Context Awareness | ❌ | ✅ | ✅ | ✅ |
| Speed | N/A | Medium | Slow | Ultra-Fast |
| Daily Limit | Unlimited | 50 | Varies | Generous |

## 🚀 Getting Started

1. **Quick Start** (No signup): Use Offline Mode
2. **Best Experience** (5 min setup): Get OpenRouter API key
3. **Maximum Speed** (When available): Get Groq API key

---

**Need help?** Open the AI Assistant and type "help" for guidance!
