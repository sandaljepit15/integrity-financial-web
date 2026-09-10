<template>
  <div class="profile-page">
    <div class="mb-4">
      <h4 class="fw-bold text-dark mb-0">Pengaturan Profil</h4>
      <p class="text-muted small mb-0">Kelola keamanan akun Anda</p>
    </div>

    <div class="row align-items-start">
      <!-- PANEL KIRI: INFO USER (READ-ONLY) -->
      <div class="col-md-4 mb-4">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-body text-center p-5">
            <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 90px; height: 90px; font-size: 2.5rem;">
              <i class="bi bi-person-fill"></i>
            </div>
            <h5 class="fw-bold mb-1 text-dark">{{ currentUser?.nama || 'Pengguna' }}</h5>
            <p class="text-muted mb-3">{{ currentUser?.jabatan || currentUser?.user_id || 'Administrator' }}</p>
            <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill">
              <i class="bi bi-check-circle-fill me-1"></i> Akun Aktif
            </span>
          </div>
        </div>
      </div>

      <!-- PANEL KANAN: UBAH PASSWORD -->
      <div class="col-md-8">
        <div class="card border-0 shadow-sm rounded-4">
          <div class="card-header bg-white border-bottom p-4">
            <h6 class="fw-bold mb-0 text-dark">
              <i class="bi bi-shield-lock me-2 text-primary"></i> Ganti Password
            </h6>
          </div>
          <div class="card-body p-4">
            <div class="row g-3">
              
              <div class="col-12">
                <label class="form-label small fw-bold text-muted">Password Baru</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><i class="bi bi-key text-muted"></i></span>
                  <input :type="showPassword ? 'text' : 'password'" class="form-control border-start-0 ps-0" v-model="form.newPassword" placeholder="Masukkan password baru">
                </div>
              </div>

              <div class="col-12">
                <label class="form-label small fw-bold text-muted">Konfirmasi Password Baru</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><i class="bi bi-key-fill text-muted"></i></span>
                  <input :type="showPassword ? 'text' : 'password'" class="form-control border-start-0 ps-0" v-model="form.confirmPassword" placeholder="Ulangi password baru">
                </div>
              </div>

              <div class="col-12 mt-2">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="showPass" v-model="showPassword">
                  <label class="form-check-label small text-muted" for="showPass">
                    Tampilkan Password
                  </label>
                </div>
              </div>

            </div>
          </div>
          <div class="card-footer bg-light border-top text-end py-3 px-4">
            <button class="btn btn-primary fw-bold px-4" @click="changePassword" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-save me-2"></i> Simpan Password
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'
import Swal from 'sweetalert2'
// 1. IMPORT MD5 (Sama persis dengan Login.vue)
import MD5 from 'crypto-js/md5'

const currentUser = ref<any>(null)
const isLoading = ref(false)
const showPassword = ref(false)

const form = ref({
  newPassword: '',
  confirmPassword: ''
})

onMounted(() => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) {
    currentUser.value = JSON.parse(userData)
  }
})

const changePassword = async () => {
  // 1. Validasi Input
  if (!form.value.newPassword || !form.value.confirmPassword) {
    AppAlert.error('Validasi Gagal', 'Semua kolom password wajib diisi.')
    return
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    AppAlert.error('Validasi Gagal', 'Konfirmasi password tidak cocok dengan password baru.')
    return
  }

  if (form.value.newPassword.length < 6) {
    AppAlert.error('Validasi Gagal', 'Password minimal harus 6 karakter.')
    return
  }

  // 2. Konfirmasi User
  const result = await Swal.fire({
    title: 'Ganti Password?',
    text: "Anda akan mengubah password untuk akun ini.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Ubah!',
    cancelButtonText: 'Batal'
  })

  if (!result.isConfirmed) return

  isLoading.value = true
  AppAlert.loading('Menyimpan password baru...')
  
  try {
    // 3. HASHING MENGGUNAKAN MD5 SEKARANG
    const hashedPassword = MD5(form.value.newPassword).toString()

    // 4. Update ke database Supabase
    const { error } = await supabase
      .from('app_users')
      .update({ password: hashedPassword })
      .eq('user_id', currentUser.value.user_id)

    if (error) throw error

    AppAlert.success('Berhasil!', 'Password akun Anda berhasil diperbarui.')
    
    // Reset Form
    form.value.newPassword = ''
    form.value.confirmPassword = ''
    showPassword.value = false

  } catch (err) {
    AppAlert.error('Gagal Menyimpan', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.form-control:focus {
  border-color: #cbd5e1;
  box-shadow: none;
}
.input-group-text {
  border-color: #cbd5e1;
}
.form-control {
  border-color: #cbd5e1;
}
</style>