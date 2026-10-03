package com.eirdan.client
import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import org.json.JSONObject
class MainActivity:Activity(){
 private lateinit var web:WebView
 private val io=Executors.newSingleThreadExecutor()
 private val rawBase="https://raw.githubusercontent.com/arttk800-bit/ErydanRPG/main/game/"
 private val manifestUrl=rawBase+"client/update-manifest.json"
 @SuppressLint("SetJavaScriptEnabled")
 override fun onCreate(b:Bundle?){
  super.onCreate(b)
  web=WebView(this)
  web.settings.javaScriptEnabled=true;web.settings.domStorageEnabled=true
  web.settings.allowFileAccess=true;web.settings.allowContentAccess=true
  web.settings.allowFileAccessFromFileURLs=true;web.settings.allowUniversalAccessFromFileURLs=true
  web.webViewClient=WebViewClient();web.webChromeClient=WebChromeClient()
  web.addJavascriptInterface(JsBridge(),"EirdanNative");setContentView(web)
  loadPackaged();refreshGameInBackground()
 }
 private fun loadPackaged(){web.loadUrl("file:///android_asset/game/ui/index.html")}
 private fun get(url:String):ByteArray{val c=URL(url).openConnection() as HttpURLConnection;c.connectTimeout=7000;c.readTimeout=12000;c.useCaches=false;c.setRequestProperty("User-Agent","Eirdan-Android/0.15");try{if(c.responseCode !in 200..299)throw IllegalStateException("HTTP "+c.responseCode);return c.inputStream.use{it.readBytes()}}finally{c.disconnect()}}
 private fun refreshGameInBackground(){io.execute{try{
   val manifest=JSONObject(String(get(manifestUrl),Charsets.UTF_8));if(manifest.optInt("schema")!=1)return@execute
   val root=File(filesDir,"game-update"),staging=File(filesDir,"game-update.tmp");staging.deleteRecursively();staging.mkdirs()
   val files=manifest.getJSONArray("files")
   for(i in 0 until files.length()){val path=files.getJSONObject(i).getString("path");if(path.contains("..")||path.startsWith("/"))throw IllegalArgumentException("unsafe path");val out=File(staging,path);out.parentFile?.mkdirs();out.writeBytes(get(rawBase+path))}
   val entry=File(staging,manifest.getString("entry"));if(!entry.isFile)throw IllegalStateException("missing entry")
   val backup=File(filesDir,"game-update.old");backup.deleteRecursively();if(root.exists())root.renameTo(backup)
   if(!staging.renameTo(root)){if(backup.exists())backup.renameTo(root);throw IllegalStateException("install failed")};backup.deleteRecursively()
  }catch(_:Exception){} }}
 override fun onDestroy(){io.shutdownNow();super.onDestroy()}
 override fun onBackPressed(){if(::web.isInitialized&&web.canGoBack())web.goBack() else super.onBackPressed()}
}
