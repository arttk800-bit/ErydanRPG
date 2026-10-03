package com.eirdan.client
import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
class MainActivity:Activity(){
 @SuppressLint("SetJavaScriptEnabled")
 override fun onCreate(b:Bundle?){super.onCreate(b);val w=WebView(this);w.settings.javaScriptEnabled=true;w.settings.domStorageEnabled=true;w.settings.allowFileAccess=true;w.webViewClient=WebViewClient();w.webChromeClient=WebChromeClient();setContentView(w);w.loadUrl("file:///android_asset/game/ui/index.html")}
 override fun onBackPressed(){val w=findViewById<WebView>(android.R.id.content)?.rootView as? WebView;if(w?.canGoBack()==true)w.goBack() else super.onBackPressed()}
}