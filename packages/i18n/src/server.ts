import i18next from './index'
import { resources } from './resources'

if (!i18next.isInitialized) {
  void i18next.init({
    resources,
    fallbackLng: 'en',
    lng: 'en',
  })
}

export default i18next
