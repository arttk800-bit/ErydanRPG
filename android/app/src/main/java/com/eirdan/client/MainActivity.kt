package com.eirdan.client
import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import java.net.HttpURLConnection
import java.net.URL

class MainActivity:Activity(){
 private lateinit var web:WebView
 private val entryUrl="https://cdn.jsdelivr.net/gh/arttk800-bit/ErydanRPG@main/game/ui/index.html"

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
  if(b==null)loadRemoteGame()
 }
 private fun loadRemoteGame(){
  Thread{
   try{
    val c=(URL(entryUrl+"?v="+System.currentTimeMillis()).openConnection() as HttpURLConnection).apply{
     connectTimeout=15000;readTimeout=15000;requestMethod="GET"
    }
    val html=c.inputStream.bufferedReader(Charsets.UTF_8).use{it.readText()}
    c.disconnect()
    runOnUiThread{web.loadDataWithBaseURL(entryUrl,html,"text/html","UTF-8",null)}
   }catch(e:Exception){
    runOnUiThread{web.loadDataWithBaseURL(null,"<html><body style='background:#090d0c;color:#eee;font-family:sans-serif;padding:24px'><h2>Eirdan</h2><p>Не удалось загрузить игру.</p><pre>"+e.toString().replace("<","&lt;")+"</pre></body></html>","text/html","UTF-8",null)}
   }
  }.start()
 }
 fun reloadGame(){runOnUiThread{web.clearCache(true);loadRemoteGame()}}
 fun gameStatus():String="{\"mode\":\"remote-html\",\"source\":\"github-cdn\",\"url\":\"$entryUrl\"}"
 override fun onBackPressed(){if(::web.isInitialized&&web.canGoBack())web.goBack() else super.onBackPressed()}
}