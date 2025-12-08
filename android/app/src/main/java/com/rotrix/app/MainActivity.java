package com.rotrix.app;

import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onBackPressed() {
        // Get the WebView and execute JavaScript directly
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            // Execute JavaScript to handle back button
            String jsCode = "if (window.handleBackButtonPress) { window.handleBackButtonPress(); }";
            webView.post(() -> {
                webView.evaluateJavascript(jsCode, null);
            });
        } else {
            // Fallback to default Capacitor behavior
            super.onBackPressed();
        }
    }
}
