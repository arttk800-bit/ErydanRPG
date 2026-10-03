plugins { id("com.android.application") }
android {
 namespace="com.eirdan.client"
 compileSdk=35
 defaultConfig {
  applicationId="com.eirdan.client"
  minSdk=26
  targetSdk=35
  versionCode=1502
  versionName="0.15.2-debug"
 }
 sourceSets {
  getByName("main") {
   assets.srcDirs("../../")
   assets.includes.add("game/**")
  }
 }
}
