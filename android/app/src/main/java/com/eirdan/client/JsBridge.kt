package com.eirdan.client
import android.webkit.JavascriptInterface
class JsBridge(private val activity:MainActivity,private val version:String="0.15.0-dev"){
 @JavascriptInterface fun clientVersion():String=version
 @JavascriptInterface fun platform():String="android"
 @JavascriptInterface fun updateStatus():String=activity.updateStatus()
 @JavascriptInterface fun activateUpdate():Boolean=activity.activateUpdate()
 @JavascriptInterface fun resetToPackaged(){activity.resetToPackaged()}
}
