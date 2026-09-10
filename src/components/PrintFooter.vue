<template>
  <div class="print-footer d-none d-print-block mt-5 pt-5">
    <div class="row text-center">
      <div class="col-4 offset-8">
        <p class="mb-5">Kediri, {{ tanggalCetak }}</p>
        <p class="fw-bold text-decoration-underline mb-0">{{ currentUser?.nama || 'Administrator' }}</p>
        <p>{{ currentUser?.jabatan || 'Bagian Keuangan' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const currentUser = ref<any>(null)

onMounted(() => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) {
    currentUser.value = JSON.parse(userData)
  }
})

// Membuat format tanggal hari ini secara otomatis
const tanggalCetak = computed(() => {
  return new Date().toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  })
})
</script>