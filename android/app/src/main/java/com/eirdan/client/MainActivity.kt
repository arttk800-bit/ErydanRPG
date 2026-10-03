package com.eirdan.client
import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors
import org.json.JSONObject

class MainActivity:Activity(){
 private lateinit var web:WebView
 private val io=Executors.newSingleThreadExecutor()
 private val rawBase="https://raw.githubusercontent.com/arttk800-bit/ErydanRPG/main/game/"
 private val manifestUrl=rawBase+"client/update-manifest.json"
 private val prefs by lazy{getSharedPreferences("eirdan-update",MODE_PRIVATE)}
 private lateinit var assetLoader:WebViewAssetLoader

 @SuppressLint("SetJavaScriptEnabled")
 override fun onCreate(b:Bundle?){
  super.onCreate(b);web=WebView(this)
  web.settings.javaScriptEnabled=true;web.settings.domStorageEnabled=true
  web.settings.allowFileAccess=false;web.settings.allowContentAccess=false
  assetLoader=WebViewAssetLoader.Builder()
   .addPathHandler("/assets/",WebViewAssetLoader.AssetsPathHandler(this))
   .build()
  web.webViewClient=object:WebViewClient(){
   override fun shouldInterceptRequest(view:WebView?,request:android.webkit.WebResourceRequest?)=
    request?.url?.let{assetLoader.shouldInterceptRequest(it)} ?: super.shouldInterceptRequest(view,request)
  }
  web.webChromeClient=WebChromeClient()
  web.addJavascriptInterface(JsBridge(this),"EirdanNative");setContentView(web)
  loadLastKnownGood();refreshGameInBackground()
 }
 private fun root()=File(filesDir,"game-update")
 private fun entry(r:File)=File(r,"ui/index.html")
 private fun loadLastKnownGood(){val r=root();if(prefs.getBoolean("good",false)&&entry(r).isFile)web.loadUrl("file://"+entry(r).absolutePath)else web.loadUrl("https://appassets.androidplatform.net/assets/game/ui/index.html")}
 private fun get(url:String):ByteArray{val c=URL(url).openConnection() as HttpURLConnection;c.connectTimeout=7000;c.readTimeout=12000;c.useCaches=false;c.setRequestProperty("User-Agent","Eirdan-Android/0.15");try{if(c.responseCode !in 200..299)throw IllegalStateException("HTTP "+c.responseCode);return c.inputStream.use{it.readBytes()}}finally{c.disconnect()}}
 private fun sha256(b:ByteArray)=MessageDigest.getInstance("SHA-256").digest(b).joinToString(""){"%02x".format(it)}
 private fun refreshGameInBackground(){io.execute{try{
  val manifest=JSONObject(String(get(manifestUrl),Charsets.UTF_8));if(manifest.optInt("schema")!=1)return@execute
  val remote=manifest.getString("version");if(remote==prefs.getString("installedVersion",""))return@execute
  val staging=File(filesDir,"game-update.tmp");staging.deleteRecursively();staging.mkdirs();val files=manifest.getJSONArray("files")
  for(i in 0 until files.length()){val spec=files.getJSONObject(i);val path=spec.getString("path");if(path.contains("..")||path.startsWith("/"))throw IllegalArgumentException("unsafe path");val bytes=get(rawBase+path);if(spec.has("sha256")&&sha256(bytes)!=spec.getString("sha256"))throw IllegalStateException("checksum "+path);val out=File(staging,path);out.parentFile?.mkdirs();out.writeBytes(bytes)}
  if(!File(staging,manifest.getString("entry")).isFile)throw IllegalStateException("missing entry")
  val r=root();val backup=File(filesDir,"game-update.old");backup.deleteRecursively();if(r.exists())r.renameTo(backup)
  if(!staging.renameTo(r)){if(backup.exists())backup.renameTo(r);throw IllegalStateException("install failed")}
  prefs.edit().putString("installedVersion",remote).putBoolean("pending",true).putBoolean("good",false).apply()
 }catch(_:Exception){}}}
 fun updateStatus():String=JSONObject().put("installed",prefs.getString("installedVersion","packaged")).put("pending",prefs.getBoolean("pending",false)).toString()
 fun activateUpdate():Boolean{val r=root();if(!entry(r).isFile)return false;prefs.edit().putBoolean("good",true).putBoolean("pending",false).apply();prefs.edit().putBoolean("good",false).apply();return false}
 fun resetToPackaged(){prefs.edit().clear().apply();root().deleteRecursively();runOnUiThread{web.loadUrl("file:///android_asset/game/ui/index.html")}}
 override fun onDestroy(){io.shutdownNow();super.onDestroy()}
 override fun onBackPressed(){if(::web.isInitialized&&web.canGoBack())web.goBack() else super.onBackPressed()}
}
