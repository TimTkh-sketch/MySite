"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: { translate?: { TranslateElement: new (c: object, id: string) => void } }
  }
}

export function GoogleTranslate() {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return
      new window.google.translate.TranslateElement(
        { pageLanguage: "ru", autoDisplay: false },
        "google_translate_element"
      )
    }
    if (!document.getElementById("gt-script")) {
      const s = document.createElement("script")
      s.id  = "gt-script"
      s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      s.async = true
      document.head.appendChild(s)
    }
  }, [])

  return <div id="google_translate_element" style={{ display: "none" }} />
}
