package com.eirdan.client

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity:Activity(){
 private lateinit var web:WebView
 private val gameUrl="https://arttk800-bit.github.io/ErydanRPG/game/"

 @SuppressLint("SetJavaScriptEnabled")
 override fun onCreate(b:Bundle?){
  super.onCreate(b)
  web=WebView(this)
  web.settings.javaScriptEnabled=true
  web.settings.domStorageEnabled=true
  web.settings.cacheMode=WebSettings.LOAD_DEFAULT
  web.settings.allowFileAccess=false
  web.settings.allowContentAccess=false
  web.webChromeClient=WebChromeClient()
  web.webViewClient=object:WebViewClient(){
   override fun shouldOverrideUrlLoading(view:WebView?,url:String?):Boolean{
    if(url!=null&&url.startsWith(gameUrl)){view?.loadUrl(url);return true}
    return false
   }
  }
  web.addJavascriptInterface(JsBridge(this),"EirdanNative")
  setContentView(web)
  if(b==null)web.loadUrl(gameUrl)
 }

 fun reloadGame(){runOnUiThread{web.reload()}}
 fun gameStatus():String="{\"mode\":\"web-shell\",\"source\":\"github-pages\",\"entry\":\"game/index.html\"}"
 override fun onBackPressed(){if(::web.isInitialized&&web.canGoBack())web.goBack() else super.onBackPressed()}
}
