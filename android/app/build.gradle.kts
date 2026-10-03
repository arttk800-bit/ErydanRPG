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
  versionCode=1506
  versionName="0.15.6-debug"
 }
 compileOptions {
  sourceCompatibility=JavaVersion.VERSION_17
  targetCompatibility=JavaVersion.VERSION_17
 }
 kotlinOptions {
  jvmTarget="17"
 }
}
