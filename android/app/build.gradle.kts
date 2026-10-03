plugins {
 id("com.android.application")
 id("org.jetbrains.kotlin.android")
}
dependencies {
 implementation("androidx.webkit:webkit:1.12.1")
}
android {
 namespace="com.eirdan.client"
 compileSdk=35
 defaultConfig {
  applicationId="com.eirdan.client"
  minSdk=26
  targetSdk=35
  versionCode=1507
  versionName="0.15.7-debug"
 }
 compileOptions {
  sourceCompatibility=JavaVersion.VERSION_17
  targetCompatibility=JavaVersion.VERSION_17
 }
 kotlinOptions {
  jvmTarget="17"
 }
}
