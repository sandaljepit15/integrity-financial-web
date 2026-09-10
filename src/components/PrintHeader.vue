<template>
  <div class="print-header d-none d-print-block pb-3 mb-4 border-bottom border-2 border-dark" v-if="company">
    <div class="d-flex align-items-center">
      <img :src="company.logo_url" alt="Logo" style="height: 60px; margin-right: 15px;">
      <div>
        <h3 class="fw-bold mb-0" style="color: #0f172a;">{{ company.nama }}</h3>
        <p class="mb-0 text-muted" style="font-size: 0.9rem;">{{ company.alamat }}</p>
        <p class="mb-0 text-muted" style="font-size: 0.9rem;">Email: {{ company.email }} | Telp: {{ company.telepon }}</p>
      </div>
    </div>
    <div class="text-center mt-4">
      <h4 class="fw-bold text-uppercase mb-1">{{ judul }}</h4>
      <p class="mb-0 fw-bold">Periode: {{ periode }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'

// Mendefinisikan properti yang akan dilempar dari halaman laporan
defineProps<{
  judul: string
  periode: string
}>()

const company = ref<any>(null)

// Komponen ini akan mencari data perusahaannya sendiri!
onMounted(async () => {
  try {
    const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single()
    company.value = data
  } catch (err) {
    console.error('Gagal memuat profil perusahaan', err)
  }
})
</script>