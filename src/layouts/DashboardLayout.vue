<template>
  <div class="app-layout">
    <!-- SIDEBAR -->
    <aside class="sidebar" :class="{ 'sidebar-closed': !isSidebarOpen }">
      <div class="sidebar-header">
        <h5 class="m-0 fw-bold text-white text-truncate" v-if="isSidebarOpen">INTEGRITY</h5>
        <i class="bi bi-wallet2 text-white fs-4" v-else></i>
      </div>
      
      <div class="sidebar-menu custom-scrollbar">
        <div v-for="parent in menuHierarchy" :key="parent.menu_id">
          <!-- Kategori Induk -->
          <div class="menu-category" v-if="isSidebarOpen">{{ parent.label }}</div>
          
          <!-- Sub Menu / Form -->
          <router-link 
            v-for="child in parent.children" 
            :key="child.menu_id" 
            :to="`/menu/${child.menu_id}`" 
            class="menu-item"
            active-class="active"
          >
            <i class="bi bi-record-circle"></i>
            <span v-if="isSidebarOpen">{{ child.label }}</span>
          </router-link>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="main-content">
      
      <!-- TOPBAR -->
      <header class="topbar justify-content-between">
        
        <!-- Tombol Toggle Sidebar (Kiri) -->
        <button class="btn btn-link text-dark fs-4 p-0" @click="isSidebarOpen = !isSidebarOpen">
          <i class="bi bi-list"></i>
        </button>

        <!-- Profil & Logout Dropdown (Kanan) -->
        <div class="position-relative">
          
          <!-- Lapisan transparan untuk menutup menu saat area di luar menu diklik -->
          <div 
            v-if="showProfileMenu" 
            class="position-fixed top-0 start-0 w-100 h-100" 
            style="z-index: 99;" 
            @click="showProfileMenu = false">
          </div>

          <!-- Tombol Ikon Profil -->
          <button 
            class="btn btn-light rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center border" 
            style="width: 40px; height: 40px; z-index: 100; position: relative;" 
            @click="showProfileMenu = !showProfileMenu"
          >
            <i class="bi bi-person-fill fs-5" style="color: var(--primary-color);"></i>
          </button>

          <!-- SATU DROPDOWN GABUNGAN YANG BERSIH -->
          <div v-if="showProfileMenu" class="profile-dropdown shadow-lg rounded-3 bg-white border">
            
            <!-- Bagian Atas: Info User -->
            <div class="px-4 py-4 bg-light rounded-top-3 border-bottom text-center">
              <div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 shadow-sm" style="width: 55px; height: 55px; font-size: 1.5rem;">
                <i class="bi bi-person"></i>
              </div>
              <h6 class="mb-0 fw-bold text-dark text-truncate">{{ currentUser?.nama }}</h6>
              <span class="badge bg-secondary mt-1">{{ currentUser?.jabatan || currentUser?.user_id }}</span>
            </div>
            
            <!-- Bagian Bawah: Tombol Aksi -->
            <div class="p-2">
              
              <router-link 
                to="/profile" 
                class="btn btn-light border-0 w-100 text-start fw-medium d-flex align-items-center gap-2 mb-2 px-3 py-2" 
                @click="showProfileMenu = false"
              >
                <i class="bi bi-person-gear text-primary"></i> Pengaturan Profil
              </router-link>

              <button class="btn btn-outline-danger w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2" @click="handleLogout">
                <i class="bi bi-power"></i> Keluar Sistem
              </button>
              
            </div>
          </div>
          
        </div>
      </header>
      
      <!-- AREA KERJA (Tempat komponen halaman lain dirender) -->
      <div class="content-area">
        <router-view></router-view>
      </div>
      
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'

const router = useRouter()
const isSidebarOpen = ref(true)
const showProfileMenu = ref(false)
const currentUser = ref<any>(null)
const menuHierarchy = ref<any[]>([])

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (!userData) {
    router.push('/login')
    return
  }
  
  const parsedUser = JSON.parse(userData)
  currentUser.value = parsedUser

  // Sinkronisasi diam-diam (Silent Sync) agar data selalu fresh
  try {
    const { data: freshUser, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', parsedUser.user_id)
      .single()

    if (!error && freshUser) {
      currentUser.value = freshUser
      localStorage.setItem('integrity_user', JSON.stringify(freshUser))
    }
  } catch (err) {
    console.error('Gagal sinkronisasi data user:', err)
  }

  // Tarik daftar menu setelah mendapatkan profil user
  await fetchDynamicMenus()
})

const fetchDynamicMenus = async () => {
  try {
    let allowedMenuIds = currentUser.value.menu_id 
    
    // Jika bentuknya string JSON (misal "[1,2,3]"), maka parse dulu
    if (typeof allowedMenuIds === 'string') {
      allowedMenuIds = JSON.parse(allowedMenuIds)
    }
    
    if (!allowedMenuIds || allowedMenuIds.length === 0) {
      return
    }

    // Tarik hanya menu yang berhak diakses, susun berdasarkan urutan
    const { data: allowedMenus, error } = await supabase
      .from('menus')
      .select('*')
      .in('menu_id', allowedMenuIds)
      .order('urutan', { ascending: true }) 

    if (error) throw error

    // Pisahkan menjadi Induk dan Anak
    const parentMenus = allowedMenus.filter(m => m.is_parent)
    const hierarchy = parentMenus.map(parent => {
      return {
        ...parent,
        children: allowedMenus.filter(m => !m.is_parent && m.parent_id === parent.menu_id)
      }
    })

    menuHierarchy.value = hierarchy

  } catch (err) {
    console.error('Gagal memuat menu', err)
  }
}

const handleLogout = () => {
  localStorage.removeItem('integrity_user')
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-app);
}

/* SIDEBAR DARK BLUE ELEGANT */
.sidebar {
  background: var(--secondary-color);
  width: 260px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 4px 0 10px rgba(0,0,0,0.1);
  z-index: 10;
}
.sidebar.sidebar-closed {
  width: 70px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-menu {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 10px; }

.menu-category {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  padding: 1rem 1.5rem 0.5rem;
  letter-spacing: 1px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: var(--text-light);
  text-decoration: none;
  transition: all 0.2s;
  gap: 1rem;
}
.sidebar-closed .menu-item {
  justify-content: center;
  padding: 0.75rem 0;
}
.menu-item:hover, .menu-item.active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--primary-color);
  border-right: 3px solid var(--primary-color);
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: 60px;
  background: var(--bg-card);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  z-index: 5;
}

/* DROPDOWN PROFIL STYLING */
.profile-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  width: 260px; /* Sedikit diperlebar agar rapi */
  z-index: 100;
  animation: dropDownAnim 0.2s ease-out forwards;
}

@keyframes dropDownAnim {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.content-area {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background-color: #f8f9fa; /* Warna latar aplikasi yang lembut */
}
</style>