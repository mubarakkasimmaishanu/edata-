# Capacitor Core & Native Bridge
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.BridgeActivity { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
    @com.getcapacitor.annotation.PermissionCallback *;
    @com.getcapacitor.annotation.ActivityCallback *;
}

# Capacitor Community & Official Plugins
-keep class com.aparajita.capacitor.biometricauth.** { *; }
-dontwarn com.aparajita.capacitor.biometricauth.**
-keep class com.getcapacitor.community.contacts.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-keep class org.apache.cordova.** { *; }

# Google Auth, Firebase & Play Services
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.ApiException { *; }
-keep class com.google.firebase.** { *; }
-keep class com.codetrixstudio.capacitor.googleauth.** { *; }
-keep class com.eDATA.app.** { *; }

# General Reflection, Annotations & Serialization
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes *Annotation*
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-keepnames class com.fasterxml.jackson.** { *; }
