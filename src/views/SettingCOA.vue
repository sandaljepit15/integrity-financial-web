<template>
  <div class="setting-coa">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold text-dark mb-0">Daftar Akun (COA)</h4>
        <p class="text-muted small mb-0">Manajemen Chart of Accounts & Pengaturan Sistem</p>
      </div>
      <button class="btn btn-primary fw-bold px-4 shadow-sm" @click="openAddModal">
        <i class="bi bi-plus-lg me-2"></i> Tambah COA
      </button>
    </div>

    <!-- PENGATURAN AKUN SISTEM (SYSTEM ACCOUNTS) -->
    <div class="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-primary bg-opacity-10 border-start border-primary border-4">
      <div class="row align-items-center">
        <div class="col-md-7">
          <h6 class="fw-bold text-primary mb-1"><i class="bi bi-gear-fill me-2"></i>Pengaturan Akun Sistem (System Accounts)</h6>
          <p class="small text-muted mb-0">Tentukan akun Ekuitas penampung untuk <b>Laba / Rugi Tahun Berjalan</b> di Neraca.</p>
        </div>
        <div class="col-md-5 d-flex gap-2">
          <select class="form-select border-primary" v-model="companyLabaRugiCoa">
            <option value="" disabled>-- Pilih Akun Penampung Laba Rugi --</option>
            <!-- Hanya tampilkan COA kelompok 3 (Ekuitas) yang bersifat Detail (D) -->
            <option v-for="coa in listCoaEkuitas" :key="coa.coa_code" :value="coa.coa_code">
              {{ coa.coa_code }} - {{ coa.nama }}
            </option>
          </select>
          <button class="btn btn-primary fw-bold px-4" @click="saveSystemAccounts">
            <i class="bi bi-save"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- TABEL UTAMA -->
    <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
      <div class="table-responsive" style="min-height: 400px;">
        <table class="table table-striped table-hover table-bordered align-middle mb-0" style="min-width: 900px;">
          <thead class="table-dark text-center align-middle">
            <tr>
              <th width="5%" class="py-3">No</th>
              <th width="15%" class="py-3">COA</th>
              <th width="35%" class="py-3">Nama Akun</th>
              <th width="10%" class="py-3">Sifat</th>
              <th width="20%" class="py-3">Jenis / Kelompok</th>
              <th width="15%" class="py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="coas.length === 0">
              <td colspan="6" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-2 d-block mb-2"></i> Belum ada data COA.
              </td>
            </tr>
            
            <tr v-for="(item, index) in coas" :key="item.coa_code">
              <td class="text-center text-muted">{{ index + 1 }}</td>
              <td class="fw-bold text-center text-dark">{{ item.coa_code }}</td>
              
              <!-- Indentasi untuk membedakan Header dan Detail -->
              <td :style="{ paddingLeft: item.sifat === 'D' ? '2.5rem' : '1rem' }" :class="{'fw-bold text-dark': item.sifat !== 'D'}">
                {{ item.nama }}
              </td>
              
              <td class="text-center">
                <span class="badge" :class="item.sifat === 'H' ? 'bg-dark' : (item.sifat === 'DH' ? 'bg-secondary' : 'bg-primary')">
                  {{ item.sifat }}
                </span>
              </td>
              
              <td class="text-center fw-medium">{{ formatKelompok(item.kelompok) }}</td>
              
              <td class="text-center text-nowrap">
                <button class="btn btn-sm btn-light text-primary border me-1 shadow-sm" @click="openEditModal(item)" title="Edit COA">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-light text-danger border shadow-sm" @click="deleteCOA(item.coa_code, item.nama)" title="Hapus COA">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL FORM COA -->
    <div v-if="isModalOpen" class="custom-modal-overlay">
      <div class="custom-modal-card card border-0 shadow-lg rounded-4 overflow-hidden">
        
        <div class="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold mb-0 text-dark">
            <i class="bi bi-journal-check me-2 text-primary"></i> 
            {{ isEditMode ? 'Edit COA' : 'Tambah COA Baru' }}
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="card-body p-4 max-h-500 overflow-auto custom-scrollbar">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label small fw-bold">Jenis / Kelompok Akun</label>
              <select v-model="form.kelompok" class="form-select">
                <!-- VALUE SUDAH DIPERBAIKI HANYA MENYIMPAN ANGKA SAJA -->
                <option value="1">1 - Aset</option>
                <option value="2">2 - Kewajiban</option>
                <option value="3">3 - Ekuitas</option>
                <option value="4">4 - Pendapatan</option>
                <option value="5">5 - Beban</option>
              </select>
            </div>
            
            <div class="col-12">
              <label class="form-label small fw-bold">Kode COA <span class="text-danger">*</span></label>
              <input type="text" class="form-control" v-model="form.coa_code" :disabled="isEditMode" placeholder="Contoh: 1.1">
              <small v-if="isEditMode" class="text-danger mt-1 d-block" style="font-size: 0.75rem;">*Kode COA tidak dapat diubah setelah dibuat.</small>
            </div>

            <div class="col-12">
              <label class="form-label small fw-bold">Nama Akun <span class="text-danger">*</span></label>
              <input type="text" class="form-control" v-model="form.nama" placeholder="Contoh: Kas Kecil">
            </div>

            <div class="col-12">
              <label class="form-label small fw-bold">Sifat Akun</label>
              <select class="form-select" v-model="form.sifat">
                <option value="H">H (Header / Induk Besar)</option>
                <option value="DH">DH (Detail Header / Sub Induk)</option>
                <option value="D">D (Detail / Baris Transaksi)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="card-footer bg-light border-top text-end py-3 px-4">
          <button class="btn btn-light border fw-bold me-2 px-4" @click="closeModal">Batal</button>
          <button class="btn btn-primary fw-bold px-4" @click="saveCOA">
            <i class="bi bi-save me-1"></i> Simpan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'
import Swal from 'sweetalert2'

const coas = ref<any[]>([])
const companyLabaRugiCoa = ref('') // Menyimpan settingan dari company_profile

const isModalOpen = ref(false)
const isEditMode = ref(false)

const form = ref({
  coa_code: '',
  nama: '',
  sifat: 'D',
  kelompok: '1' // Default value sudah disesuaikan ke angka
})

onMounted(async () => {
  await fetchSystemAccounts()
  await fetchCOA()
})

// Fungsi untuk menarik data dari tabel company_profile
const fetchSystemAccounts = async () => {
  try {
    const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single()
    if (data) {
      companyLabaRugiCoa.value = data.coa_laba_rugi_berjalan || ''
    }
  } catch (err) {
    console.error('Gagal memuat profil', err)
  }
}

// Fungsi untuk menyimpan pengaturan akun ke tabel company_profile
const saveSystemAccounts = async () => {
  if (!companyLabaRugiCoa.value) return
  AppAlert.loading('Menyimpan Pengaturan...')
  try {
    const { error } = await supabase
      .from('company_profile')
      .update({ coa_laba_rugi_berjalan: companyLabaRugiCoa.value })
      .eq('id', 1) 
      
    if (error) throw error
    AppAlert.success('Berhasil', 'Akun Laba Rugi Berjalan berhasil diperbarui.')
  } catch (err) {
    AppAlert.error('Gagal', err)
  }
}

const fetchCOA = async () => {
  AppAlert.loading('Memuat data COA...')
  try {
    const { data, error } = await supabase.from('coas').select('*').order('coa_code', { ascending: true })
    if (error) throw error
    coas.value = data || []
    AppAlert.close()
  } catch (err) {
    AppAlert.error('Gagal memuat', err)
  }
}

// Computed property untuk memfilter COA khusus kelompok 3 (Ekuitas) dan sifat D (Detail)
const listCoaEkuitas = computed(() => {
  return coas.value.filter(c => c.kelompok.toString().startsWith('3') && c.sifat === 'D')
})

// Fungsi format tampilan tabel untuk Kelompok Akun
const formatKelompok = (kode: string) => {
  const map: Record<string, string> = {
    '1': '1 - Aset',
    '2': '2 - Kewajiban',
    '3': '3 - Ekuitas',
    '4': '4 - Pendapatan',
    '5': '5 - Beban'
  }
  // Jika di database sudah terlanjur tersimpan "1 - Aset", kembalikan aslinya. Jika "1", kembalikan hasil map.
  return map[kode] || kode
}

const openAddModal = () => {
  isEditMode.value = false
  form.value = { coa_code: '', nama: '', sifat: 'D', kelompok: '1' }
  isModalOpen.value = true
}

const openEditModal = (item: any) => {
  isEditMode.value = true
  // Memastikan bahwa value yang di-load ke form select adalah angka depannya saja 
  // (berjaga-jaga jika ada data lama yang tersimpan lengkap teksnya)
  const safeKelompok = item.kelompok.toString().charAt(0) 
  
  form.value = { ...item, kelompok: safeKelompok }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveCOA = async () => {
  if (!form.value.coa_code || !form.value.nama) {
    AppAlert.error('Validasi', 'Kode COA dan Nama Akun wajib diisi!')
    return
  }

  AppAlert.loading('Menyimpan...')
  try {
    if (!isEditMode.value) {
      const { error } = await supabase.from('coas').insert([form.value])
      if (error) throw error
      AppAlert.success('Berhasil', 'COA baru ditambahkan.')
    } else {
      const { error } = await supabase.from('coas').update({
        nama: form.value.nama,
        sifat: form.value.sifat,
        kelompok: form.value.kelompok
      }).eq('coa_code', form.value.coa_code)
      
      if (error) throw error
      AppAlert.success('Berhasil', 'Perubahan disimpan.')
    }

    closeModal()
    await fetchCOA()
  } catch (err) {
    AppAlert.error('Gagal Menyimpan', err)
  }
}

const deleteCOA = async (coa_code: string, nama: string) => {
  const result = await Swal.fire({
    title: 'Hapus Akun?', 
    html: `Hapus <b>${coa_code} - ${nama}</b>?<br><small class="text-danger">Peringatan: Pastikan akun ini belum digunakan dalam transaksi.</small>`,
    icon: 'warning', 
    showCancelButton: true, 
    confirmButtonColor: '#ef4444', 
    confirmButtonText: 'Ya, Hapus!'
  })
  
  if (result.isConfirmed) {
    AppAlert.loading('Menghapus...')
    try {
      const { error } = await supabase.from('coas').delete().eq('coa_code', coa_code)
      if (error) throw error
      AppAlert.success('Terhapus!', 'COA berhasil dihapus.')
      await fetchCOA()
    } catch (err) { 
      AppAlert.error('Gagal', err) 
    }
  }
}
</script>

<style scoped>
.custom-modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
  background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); 
  display: flex; align-items: center; justify-content: center; z-index: 1050; 
  animation: fadeIn 0.2s ease-out; 
}
.custom-modal-card { 
  width: 95%; max-width: 550px; 
  animation: slideDown 0.3s ease-out; 
}

.max-h-500 { max-height: 70vh; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.form-control, .form-select {
  border-radius: 6px;
  border-color: #cbd5e1;
}
.form-control:focus, .form-select:focus {
  border-color: var(--primary-color); 
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.15);
}

.table-striped > tbody > tr:nth-of-type(odd) > * {
  --bs-table-bg-type: #f8fafc;
}
</style>