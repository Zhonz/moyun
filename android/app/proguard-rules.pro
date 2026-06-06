# 墨韵AI ProGuard 优化规则

# 保持 Capacitor 核心类
-keep class com.getcapacitor.** { *; }
-keep class com.inkverse.app.** { *; }

# WebView 优化
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 保持 AndroidX 类
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# 移除日志
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# 优化 JavaScript 交互
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 保持原生方法
-keepclasseswithmembernames class * {
    native <methods>;
}

# 保持枚举
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# 保持 Parcelable
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# 资源压缩
-repackageclasses ''
-allowaccessmodification
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*