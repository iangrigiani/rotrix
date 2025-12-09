package com.rotrix.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }
    
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
