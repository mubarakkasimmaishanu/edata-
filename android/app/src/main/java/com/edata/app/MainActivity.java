package com.eDATA.app;

import android.os.Bundle;
import android.view.View;
import android.os.Build;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Disable edge-to-edge / immersive mode so the WebView
        // does NOT render behind the Android status bar.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        // Dark status bar background matching the app theme (#0f172a)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(android.graphics.Color.parseColor("#0f172a"));
        }
    }
}
