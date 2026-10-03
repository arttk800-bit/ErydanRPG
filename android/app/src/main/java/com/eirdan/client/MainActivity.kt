package com.eirdan.client
import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity:Activity(){
 private lateinit var web:WebView
 private val gameUrl="https://arttk800-bit.github.io/ErydanRPG/game/ui/index.html"

 @SuppressLint("SetJavaScriptEnabled")
 override fun onCreate(b:Bundle?){
  super.onCreate(b)
  web=WebView(this)
  web.settings.javaScriptEnabled=true
  web.settings.domStorageEnabled=true
  web.settings.allowFileAccess=false
  web.settings.allowContentAccess=false
  web.webChromeClient=WebChromeClient()
  web.webViewClient=object:WebViewClient(){
   override fun shouldOverrideUrlLoading(view:WebView?,request:WebResourceRequest?)=false
  }
  web.addJavascriptInterface(JsBridge(this),"EirdanNative")
  setContentView(web)
  if(b==null)web.loadUrl(gameUrl)
 }
 fun reloadGame(){runOnUiThread{web.clearCache(true);web.loadUrl(gameUrl+"?reload="+System.currentTimeMillis())}}
 fun gameStatus():String="{\"mode\":\"remote\",\"source\":\"github\",\"url\":\"$gameUrl\"}"
 override fun onBackPressed(){if(::web.isInitialized&&web.canGoBack())web.goBack() else super.onBackPressed()}
}
