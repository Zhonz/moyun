package com.inkverse.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.content.Intent;
import android.content.Context;
import android.os.Build;

@CapacitorPlugin(name = "BackgroundGenerator")
public class BackgroundGeneratorPlugin extends Plugin {

    private boolean isRunning = false;

    @PluginMethod
    public void start(PluginCall call) {
        String title = call.getString("title", "墨韵AI");
        String content = call.getString("content", "正在生成小说...");

        Context context = getContext();
        Intent serviceIntent = new Intent(context, BackgroundGeneratorService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("content", content);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            isRunning = true;

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("启动服务失败: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, BackgroundGeneratorService.class);

        try {
            context.stopService(serviceIntent);
            isRunning = false;

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("停止服务失败: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isActive(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("active", isRunning);
        call.resolve(ret);
    }
}
