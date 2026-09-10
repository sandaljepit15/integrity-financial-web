<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="text-center mb-4">
        <h3 class="fw-bold text-white">INTEGRITY FINANCIAL</h3>
        <p class="text-light opacity-75 small">Sign in to continue</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label class="form-label text-light small fw-bold">User ID</label>
          <input type="text" class="form-control custom-input" v-model="form.userId" placeholder="Masukkan ID" required />
        </div>
        
        <div class="mb-4">
          <label class="form-label text-light small fw-bold">Password</label>
          <div class="input-group">
            <input :type="showPassword ? 'text' : 'password'" class="form-control custom-input" v-model="form.password" placeholder="••••••••" required />
            <button class="btn btn-outline-light" type="button" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
            </button>
          </div>
        </div>

        <button type="submit" class="btn w-100 fw-bold btn-login text-white">
          SECURE LOGIN
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'
import MD5 from 'crypto-js/md5'

const router = useRouter()
const showPassword = ref(false)

const form = reactive({
  userId: '',
  password: ''
})

const handleLogin = async () => {
  AppAlert.loading('Mencocokkan kredensial...')
  
  try {
    const { data: user, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', form.userId)
      .single()

    if (error || !user) throw new Error('User ID tidak ditemukan!')

    const hashedInput = MD5(form.password).toString()
    if (hashedInput !== user.password) {
      throw new Error('Password yang Anda masukkan salah!')
    }

    localStorage.setItem('integrity_user', JSON.stringify(user))
    AppAlert.success('Login Berhasil!', `Selamat datang, ${user.nama}`)
    
    setTimeout(() => {
      router.push('/')
    }, 1000)

  } catch (err: any) {
    AppAlert.error('Akses Ditolak', err)
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Menggunakan variabel secondary color agar seragam */
  background: linear-gradient(135deg, var(--secondary-color) 0%, var(--secondary-hover) 100%); 
}

.login-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  padding: 2.5rem;
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.custom-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--border-light);
  color: white;
}
.custom-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--primary-color);
  color: white;
  box-shadow: none;
}
.custom-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.btn-login {
  background: var(--primary-color);
  border: none;
  padding: 0.75rem;
  transition: all 0.3s ease;
}
.btn-login:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.5);
}
</style>