package com.eDATA.app;

import android.os.Bundle;
import android.os.Build;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Install Android 12+ SplashScreen so it transitions properly to postSplashScreenTheme
        SplashScreen.installSplashScreen(this);

        super.onCreate(savedInstanceState);

        // Configure light status bar & nav bar icons (white text/icons) on dark #0f172a background
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(false);
            insetsController.setAppearanceLightNavigationBars(false);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(android.graphics.Color.parseColor("#0f172a"));
            getWindow().setNavigationBarColor(android.graphics.Color.parseColor("#0f172a"));
        }
    }
}
