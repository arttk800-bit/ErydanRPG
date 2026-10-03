plugins {
 id("com.android.application")
 id("org.jetbrains.kotlin.android")
}
android {
 namespace="com.eirdan.client"
 compileSdk=35
 defaultConfig {
  applicationId="com.eirdan.client"
  minSdk=26
  targetSdk=35
  versionCode=1509
  versionName="0.15.9-shell"
 }
 compileOptions {
  sourceCompatibility=JavaVersion.VERSION_17
  targetCompatibility=JavaVersion.VERSION_17
 }
 kotlinOptions {
  jvmTarget="17"
 }
}
