<template>
  <component :is="asyncComponent" v-if="asyncComponent" />
  <div v-else class="d-flex justify-content-center align-items-center" style="min-height: 60vh;">
    <div class="text-center">
      <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
      <h6 class="text-muted fw-bold">Memuat Antarmuka...</h6>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'

const route = useRoute()
const router = useRouter()
const asyncComponent = shallowRef<any>(null)

watch(() => route.params.id, async (newId) => {
  if (!newId) return
  
  asyncComponent.value = null 
  
  // 1. PENGAMANAN GANDA: Pastikan ID yang diketik di URL memang ada di array hak akses user
  const userData = localStorage.getItem('integrity_user')
  if (userData) {
    const user = JSON.parse(userData)
    let allowedIds = user.menu_id
    if (typeof allowedIds === 'string') allowedIds = JSON.parse(allowedIds)
    
    // Jika ID ini tidak ada di daftar akses user, tendang ke halaman depan!
    if (!allowedIds.includes(Number(newId))) {
      AppAlert.error('Akses Ditolak', 'Anda tidak memiliki hak untuk mengakses halaman ini.')
      router.push('/')
      return
    }
  }

  // 2. Tarik komponen dari database (hanya jika lolos pengamanan di atas)
  try {
    const { data, error } = await supabase
      .from('menus')
      .select('komponen')
      .eq('menu_id', newId)
      .single()

    if (error) throw error

    if (data && data.komponen) {
      asyncComponent.value = defineAsyncComponent(() => import(`../views/${data.komponen}.vue`))
    } else {
      console.error('Nama komponen kosong di database untuk menu_id:', newId)
    }
  } catch (err) {
    console.error('Gagal memuat komponen dinamis', err)
  }
}, { immediate: true })
</script>