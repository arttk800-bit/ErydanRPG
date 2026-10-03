package com.eirdan.client

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import java.net.HttpURLConnection
import java.net.URL

class MainActivity:Activity(){
 private lateinit var web:WebView
 private val rawBase="https://raw.githubusercontent.com/arttk800-bit/ErydanRPG/main/game"

 @SuppressLint("SetJavaScriptEnabled")
 override fun onCreate(b:Bundle?){
  super.onCreate(b)
  web=WebView(this)
  web.settings.javaScriptEnabled=true
  web.settings.domStorageEnabled=true
  web.settings.allowFileAccess=false
  web.settings.allowContentAccess=false
  web.webChromeClient=WebChromeClient()
  web.webViewClient=WebViewClient()
  web.addJavascriptInterface(JsBridge(this),"EirdanNative")
  setContentView(web)
  if(b==null) loadRemoteGame()
 }

 private fun fetch(url:String,stamp:Long):String{
  val sep=if(url.contains("?"))"&" else "?"
  val c=(URL(url+sep+"eirdan="+stamp).openConnection() as HttpURLConnection).apply{
   connectTimeout=15000
   readTimeout=15000
   requestMethod="GET"
   useCaches=false
   setRequestProperty("Cache-Control","no-cache, no-store, max-age=0")
   setRequestProperty("Pragma","no-cache")
  }
  if(c.responseCode !in 200..299) throw IllegalStateException("HTTP "+c.responseCode+" for "+url)
  val out=c.inputStream.bufferedReader(Charsets.UTF_8).use{it.readText()}
  c.disconnect()
  return out
 }

 private fun latestBuild(stamp:Long):String=try{
  val json=fetch("https://api.github.com/repos/arttk800-bit/ErydanRPG/commits/main",stamp)
  Regex("\\\"sha\\\"\\s*:\\s*\\\"([0-9a-f]{7,40})\\\"").find(json)?.groupValues?.get(1)?.take(7) ?: "unknown"
 }catch(_:Exception){"unknown"}

 private fun loadRemoteGame(){
  Thread{
   try{
    val stamp=System.currentTimeMillis()
    var html=fetch("$rawBase/ui/index.html",stamp)
    var constants=fetch("$rawBase/alpha14p/data/constants.js",stamp)
    var rng=fetch("$rawBase/alpha14p/core/rng.js",stamp)
    var game=fetch("$rawBase/ui/migration-base.js",stamp)

    constants=constants.replace(Regex("(?m)^export\\s+"),"")
    rng=rng.replace(Regex("(?m)^export\\s+"),"")
    game=game.replace(Regex("(?m)^import\\s+.*?;\\s*$"),"")
    val build=latestBuild(stamp)
    val inline="<script>window.EIRDAN_BUILD=\\\"$build\\\";"+constants+"\\n"+rng+"\\n"+game+"\\n</script>"
    html=html.replace(Regex("<script>window\\.EIRDAN_BUILD=.*?</script>\\s*<script type=\\\"module\\\" src=\\\"\\./migration-base\\.js[^\\\"]*\\\"></script>"),inline)
    html=html.replace("alpha14p migration base","BUILD $build · RAW")
    runOnUiThread{
     web.clearCache(true)
     web.loadDataWithBaseURL("https://raw.githubusercontent.com/arttk800-bit/ErydanRPG/main/game/ui/",html,"text/html","UTF-8",null)
    }
   }catch(e:Exception){
    val msg=e.toString().replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
    runOnUiThread{web.loadDataWithBaseURL(null,"<html><body style='background:#090d0c;color:#eee;font-family:sans-serif;padding:24px'><h2>Eirdan</h2><p>Не удалось загрузить актуальную игру.</p><pre>$msg</pre></body></html>","text/html","UTF-8",null)}
   }
  }.start()
 }

 fun reloadGame(){runOnUiThread{web.stopLoading();loadRemoteGame()}}
 fun gameStatus():String="{\\\"mode\\\":\\\"remote-bundle\\\",\\\"source\\\":\\\"github-raw-main\\\"}"
 override fun onBackPressed(){if(::web.isInitialized&&web.canGoBack())web.goBack() else super.onBackPressed()}
}
