import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import DynamicView from '../views/DynamicView.vue' // Wajib import ini
import Profile from '../views/Profile.vue' 

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: DashboardLayout,
    children: [
      {
        path: '', 
        name: 'Dashboard',
        component: Home
      },
      // ROUTER SAPU JAGAT (Otomatis memanggil semua menu berdasarkan ID)
      {
        path: 'menu/:id', 
        name: 'DynamicMenu',
        component: DynamicView
      },
      {
        path: 'profile', 
        name: 'Profile',
        component: Profile
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from) => {
  const isAuthenticated = localStorage.getItem('integrity_user')
  
  if (to.name !== 'Login' && !isAuthenticated) {
    return { name: 'Login' }
  } else if (to.name === 'Login' && isAuthenticated) {
    return { name: 'Dashboard' }
  }
  
})

export default router