package com.eirdan.client
import android.app.Activity
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
class MainActivity:Activity(){override fun onCreate(b:Bundle?){super.onCreate(b);val w=WebView(this);w.settings.javaScriptEnabled=true;w.settings.domStorageEnabled=true;w.webViewClient=WebViewClient();setContentView(w);w.loadUrl("file:///android_asset/game/index.html")}}
