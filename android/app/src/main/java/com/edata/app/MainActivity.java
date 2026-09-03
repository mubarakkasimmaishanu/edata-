package com.eDATA.app;

import android.os.Bundle;
import android.os.Build;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Disable edge-to-edge content overlap so the WebView
        // does NOT render behind the Android system bars.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        // Modern WindowInsetsControllerCompat for status bar appearance
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(false);
        }

        // For Android versions prior to Android 15 (API 35), set background color
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && Build.VERSION.SDK_INT < 35) {
            getWindow().setStatusBarColor(android.graphics.Color.parseColor("#0f172a"));
        }
    }
}
