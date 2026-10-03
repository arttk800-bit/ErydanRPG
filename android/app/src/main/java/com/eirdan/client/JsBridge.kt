package com.eirdan.client
import android.webkit.JavascriptInterface
class JsBridge(private val activity:MainActivity,private val version:String="0.15.8-shell"){
 @JavascriptInterface fun clientVersion():String=version
 @JavascriptInterface fun platform():String="android"
 @JavascriptInterface fun gameStatus():String=activity.gameStatus()
 @JavascriptInterface fun reloadGame(){activity.reloadGame()}
}
