package com.siifmart.app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    
    // Web App URL Configuration
    // For real device: Use your computer's IP address on same WiFi network
    // For emulator: Use http://10.0.2.2:3000
    // For production: Use your deployed URL
    private val webAppUrl = "http://192.168.0.241:3000" // Local development
    // private val webAppUrl = "http://10.0.2.2:3000" // Android Emulator
    // private val webAppUrl = "https://siifmart-app.vercel.app" // Production URL

    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Set dark theme
        setTheme(R.style.Theme_SIIFMART_Dark)
        
        setContentView(R.layout.activity_main)
        
        // Configure window for immersive experience
        setupWindow()
        
        // Initialize views
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        
        // Configure WebView
        setupWebView()
        
        // Load the web app
        loadWebApp()
    }
    
    private fun setupWindow() {
        // Enable edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        // Set status bar and navigation bar colors
        window.statusBarColor = getColor(R.color.cyber_black)
        window.navigationBarColor = getColor(R.color.cyber_black)
        
        // Make status bar icons light (for dark background)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
        
        // Keep screen on (useful for PDA operations)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
    
    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    private fun setupWebView() {
        val webSettings = webView.settings
        
        // Enable JavaScript
        webSettings.javaScriptEnabled = true
        
        // Add Native Bridge Interface
        webView.addJavascriptInterface(WebAppInterface(this, webView), "AndroidNative")
        
        // Enable DOM storage
        webSettings.domStorageEnabled = true
        
        // Enable database storage
        webSettings.databaseEnabled = true
        
        // Enable file access
        webSettings.allowFileAccess = true
        webSettings.allowContentAccess = true
        
        // Enable mixed content (if needed)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        
        // Enable zoom controls (useful for PDA)
        webSettings.setSupportZoom(true)
        webSettings.builtInZoomControls = true
        webSettings.displayZoomControls = false // Hide zoom controls UI
        
        // Cache settings - Modern caching strategy
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT
        
        // User agent (optional: customize for mobile)
        webSettings.userAgentString = webSettings.userAgentString + " SIIFMART-Android-Native/1.0"
        
        // Enable file access from file URLs (needed for barcode generation)
        webSettings.allowFileAccessFromFileURLs = true
        webSettings.allowUniversalAccessFromFileURLs = true
        
        // Enable media playback without user gesture (for barcode generation)
        webSettings.mediaPlaybackRequiresUserGesture = false
        
        // Enable hardware acceleration for better rendering
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        }
        
        // Set WebViewClient to handle page navigation
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                
                // Inject CSS for mobile optimization (PDA mode)
                injectMobileOptimizations()
            }
            
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    // Don't show toast on error, show a nice error page or retry
                    // showError("Connection Error: ${error?.description}")
                }
            }
        }
        
        // Set WebChromeClient for progress updates and console logging
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }
            
            // Log console messages for debugging (especially barcode generation errors)
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    android.util.Log.d(
                        "WebView Console",
                        "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}"
                    )
                }
                return true
            }
        }
    }

    /**
     * Native Interface for JavaScript to call Android methods
     * Usage in JS: window.AndroidNative.showToast("Hello")
     */
    class WebAppInterface(private val mContext: Context, private val webView: WebView) {
        @JavascriptInterface
        fun showToast(toast: String) {
            Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show()
        }

        @JavascriptInterface
        fun vibrate(milliseconds: Long) {
            val v = mContext.getSystemService(Context.VIBRATOR_SERVICE) as android.os.Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(android.os.VibrationEffect.createOneShot(milliseconds, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(milliseconds)
            }
        }
        
        @JavascriptInterface
        fun getDeviceId(): String {
            return android.provider.Settings.Secure.getString(mContext.contentResolver, android.provider.Settings.Secure.ANDROID_ID)
        }
        
        /**
         * Native Print Function - Opens Android Print Dialog
         * Call from JavaScript: window.AndroidNative.printDocument("Document Title")
         */
        @JavascriptInterface
        fun printDocument(documentName: String) {
            (mContext as? AppCompatActivity)?.runOnUiThread {
                try {
                    // Create print adapter from WebView
                    val printAdapter: android.print.PrintDocumentAdapter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        webView.createPrintDocumentAdapter(documentName)
                    } else {
                        @Suppress("DEPRECATION")
                        webView.createPrintDocumentAdapter()
                    }
                    
                    // Get print manager
                    val printManager = mContext.getSystemService(Context.PRINT_SERVICE) as android.print.PrintManager
                    
                    // Create print attributes for 4x6 label
                    val printAttributes = android.print.PrintAttributes.Builder()
                        .setMediaSize(android.print.PrintAttributes.MediaSize.NA_INDEX_4X6)
                        .setResolution(android.print.PrintAttributes.Resolution("label", "Label", 203, 203))
                        .setMinMargins(android.print.PrintAttributes.Margins.NO_MARGINS)
                        .build()
                    
                    // Start print job
                    printManager.print(
                        documentName,
                        printAdapter,
                        printAttributes
                    )
                    
                    Toast.makeText(mContext, "Opening print dialog...", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    android.util.Log.e("Print Error", "Failed to print: ${e.message}")
                    Toast.makeText(mContext, "Print error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
        
        /**
         * Check if printing is available
         */
        @JavascriptInterface
        fun isPrintingAvailable(): Boolean {
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT
        }
    }
    
    private fun injectMobileOptimizations() {
        val js = """
            (function() {
                // Add mobile class to body for PDA mode
                document.body.classList.add('mobile-app', 'pda-mode');
                
                // Expose native capability flag
                window.isNativeApp = true;
                
                // Optimize touch targets
                const style = document.createElement('style');
                style.textContent = `
                    .mobile-app button, .mobile-app a, .mobile-app input {
                        min-height: 44px;
                        min-width: 44px;
                    }
                    .pda-mode .cyber-primary {
                        touch-action: manipulation;
                    }
                    /* Hide scrollbars in native app */
                    ::-webkit-scrollbar {
                        width: 4px;
                    }
                `;
                document.head.appendChild(style);
            })();
        """.trimIndent()
        
        webView.evaluateJavascript(js, null)
    }
    
    private fun loadWebApp() {
        webView.loadUrl(webAppUrl)
    }
    
    // ... (rest of the file)
    
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
        } else {
            @Suppress("DEPRECATION")
            connectivityManager.activeNetworkInfo?.isConnected == true
        }
    }
    
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
    
    // Handle back button
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
    
    // Handle lifecycle
    override fun onPause() {
        super.onPause()
        webView.onPause()
    }
    
    override fun onResume() {
        super.onResume()
        webView.onResume()
    }
    
    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}

