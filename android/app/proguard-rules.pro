# Capacitor Core & Native Bridge (Targeted rules for R8 full mode optimization)
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin {
    public <init>(...);
    @com.getcapacitor.PluginMethod public *;
}
-keep class * extends com.getcapacitor.BridgeActivity {
    public <init>(...);
}
-keep class com.getcapacitor.Bridge { *; }
-keep class com.getcapacitor.JSObject { *; }
-keep class com.getcapacitor.JSArray { *; }
-keep class com.getcapacitor.PluginCall { *; }
-keep class com.getcapacitor.PluginResult { *; }

# Google Auth & Play Services
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.ApiException { *; }
-keep class com.codetrixstudio.capacitor.googleauth.** { *; }

# Biometric Auth & Contacts
-dontwarn com.aparajita.capacitor.biometricauth.**
-keep class com.aparajita.capacitor.biometricauth.** { *; }
-keep class com.getcapacitor.community.contacts.** { *; }

# General Reflection, Annotations & Serialization
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes *Annotation*
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-keepnames class com.fasterxml.jackson.** { *; }
