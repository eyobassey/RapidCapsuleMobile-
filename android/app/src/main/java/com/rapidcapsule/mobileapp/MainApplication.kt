package com.rapidcapsule.mobileapp

import android.app.Application
import android.preference.PreferenceManager
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    if (com.facebook.react.BuildConfig.DEBUG) {
      // Force Metro dev server to localhost so the emulator always connects
      // correctly regardless of what IP was auto-detected last session.
      @Suppress("DEPRECATION")
      PreferenceManager.getDefaultSharedPreferences(this)
        .edit()
        .putString("debug_http_host", "localhost:8081")
        .apply()
    }
    loadReactNative(this)
  }
}
