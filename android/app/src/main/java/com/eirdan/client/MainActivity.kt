package com.eirdan.client
import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
class MainActivity:Activity(){
 private lateinit var web:WebView
 @SuppressLint("SetJavaScriptEnabled")
 override fun onCreate(b:Bundle?){super.onCreate(b);web=WebView(this);web.settings.javaScriptEnabled=true;web.settings.domStorageEnabled=true;web.settings.allowFileAccess=true;web.settings.allowContentAccess=true;web.webViewClient=WebViewClient();web.webChromeClient=WebChromeClient();web.addJavascriptInterface(JsBridge(),"EirdanNative");setContentView(web);web.loadUrl("file:///android_asset/game/ui/index.html")}
 override fun onBackPressed(){if(::web.isInitialized&&web.canGoBack())web.goBack() else super.onBackPressed()}
}