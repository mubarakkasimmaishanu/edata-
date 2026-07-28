# Capacitor
-keep class com.getcapacitor.** { *; }
-keep  class * extends com.getcapacitor.Plugin { *; }
-keep  class * extends com.getcapacitor.BridgeActivity { *; }

# Google Auth
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.ApiException { *; }
-keep class com.codetrixstudio.capacitor.googleauth.** { *; }

# Lucide Icons (react-native or web if bundled)
# Mostly JS side, but if using native icons:
# -keep class com.lucide.** { *; }

# General
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-keepnames class com.fasterxml.jackson.** { *; }
