import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Import Global CSS Custom Properties
import './assets/main.css'

const app = createApp(App)
app.use(router)
app.mount('#app')