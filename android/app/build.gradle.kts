plugins { id("com.android.application") }
android {
 namespace="com.eirdan.client"
 compileSdk=35
 defaultConfig {
  applicationId="com.eirdan.client"
  minSdk=26
  targetSdk=35
  versionCode=1501
  versionName="0.15.1-debug"
 }
 sourceSets {
  getByName("main") {
   assets.srcDirs("../../game")
  }
 }
}
