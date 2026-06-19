'use client'

import i18next from './index'
import { initReactI18next } from './react'
import { resources } from './resources'

void i18next.use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  lng: 'en',
})

export default i18next
