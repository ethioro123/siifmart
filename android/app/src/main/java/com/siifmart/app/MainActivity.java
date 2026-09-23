package com.siifmart.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fit system windows at native window level
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setStatusBarColor(Color.parseColor("#151D18"));
        getWindow().setNavigationBarColor(Color.parseColor("#151D18"));

        // Fallback: If WebView is still placed behind status bar, adjust layout topMargin
        View decorView = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            int statusBarHeight = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            adjustWebViewMargin(statusBarHeight);
            return windowInsets;
        });

        decorView.post(() -> adjustWebViewMargin(getStatusBarHeight()));
    }

    @Override
    public void onResume() {
        super.onResume();
        adjustWebViewMargin(getStatusBarHeight());
    }

    private int getStatusBarHeight() {
        int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        return resourceId > 0 ? getResources().getDimensionPixelSize(resourceId) : 0;
    }

    private void adjustWebViewMargin(int statusBarHeight) {
        if (statusBarHeight <= 0 || getBridge() == null || getBridge().getWebView() == null) return;
        WebView webView = getBridge().getWebView();
        ViewGroup.LayoutParams lp = webView.getLayoutParams();
        if (lp instanceof ViewGroup.MarginLayoutParams) {
            ViewGroup.MarginLayoutParams mlp = (ViewGroup.MarginLayoutParams) lp;
            int[] locationOnScreen = new int[2];
            webView.getLocationOnScreen(locationOnScreen);
            // If the WebView's physical screen Y coordinate is under the status bar, offset it
            if (locationOnScreen[1] < statusBarHeight) {
                int neededMargin = statusBarHeight - locationOnScreen[1];
                if (mlp.topMargin != neededMargin) {
                    mlp.topMargin = neededMargin;
                    webView.setLayoutParams(mlp);
                }
            }
        }
    }
}
