<template>
  <div class="pengaturan-perusahaan">
    <div class="mb-4">
      <h4 class="fw-bold text-dark mb-0">Profil Organisasi / Perusahaan</h4>
      <p class="text-muted small mb-0">Atur Kop Surat, Nama, Alamat, dan Logo untuk dokumen cetak beserta rekam jejaknya.</p>
    </div>

    <div class="row g-4">
      
      <!-- BAGIAN KIRI: FORM PENGATURAN -->
      <div class="col-md-7">
        <div class="card border-0 shadow-sm rounded-4 h-100">
          <div class="card-header bg-white border-bottom p-4">
            <h6 class="fw-bold mb-0 text-dark"><i class="bi bi-building me-2 text-primary"></i> Identitas Cetak</h6>
          </div>
          
          <div class="card-body p-4">
            
            <div v-if="!canUpdate" class="alert alert-secondary small py-2 d-flex align-items-center mb-4">
              <i class="bi bi-lock-fill me-2"></i> Mode Read-Only. Anda tidak berhak mengubah konfigurasi ini.
            </div>

            <div class="row g-3">
              <div class="col-12">
                <label class="form-label small fw-bold">Nama Instansi Utama <span v-if="canUpdate" class="text-danger">*</span></label>
                <input type="text" class="form-control" v-model="form.nama" placeholder="Contoh: PT. Maju Jaya" :disabled="!canUpdate">
              </div>

              <!-- KEMBALINYA KOLOM SUB NAMA -->
              <div class="col-12">
                <label class="form-label small fw-bold">Sub-Nama / Unit Kerja (Opsional)</label>
                <input type="text" class="form-control" v-model="form.sub_nama" placeholder="Contoh: Divisi Keuangan / Kepanitiaan..." :disabled="!canUpdate">
              </div>

              <div class="col-12">
                <label class="form-label small fw-bold">Alamat Lengkap Kantor <span v-if="canUpdate" class="text-danger">*</span></label>
                <textarea class="form-control" v-model="form.alamat" rows="2" placeholder="Jalan, Kota, Kode Pos" :disabled="!canUpdate"></textarea>
              </div>

              <div class="col-md-6">
                <label class="form-label small fw-bold">Email</label>
                <input type="email" class="form-control" v-model="form.email" placeholder="Contoh: info@perusahaan.com" :disabled="!canUpdate">
              </div>

              <div class="col-md-6">
                <label class="form-label small fw-bold">Nomor Telepon</label>
                <input type="text" class="form-control" v-model="form.telepon" placeholder="Contoh: (021) 1234567" :disabled="!canUpdate">
              </div>

              <div class="col-12">
                <label class="form-label small fw-bold">Upload Logo (Maks. 500KB)</label>
                <input type="file" class="form-control" accept="image/png, image/jpeg, image/jpg" @change="handleFileUpload" :disabled="!canUpdate">
                <small class="text-muted" style="font-size:0.7rem">Format: JPG, PNG. Gambar akan disimpan dalam database.</small>
              </div>
            </div>
            
            <div v-if="form.logo_url" class="mt-4 p-3 bg-light rounded text-center border position-relative">
              <span class="small text-muted d-block mb-2">Preview Logo Saat Ini:</span>
              <img :src="form.logo_url" alt="Preview Logo" style="max-height: 80px; max-width: 100%; object-fit: contain;">
              
              <button v-if="canUpdate" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" @click="form.logo_url = ''" title="Hapus Logo">
                <i class="bi bi-trash"></i>
              </button>
            </div>

          </div>

          <div v-if="canUpdate" class="card-footer bg-light border-top text-end py-3 px-4">
            <button class="btn btn-primary fw-bold px-4" @click="saveData">
              <i class="bi bi-save me-2"></i> Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>

      <!-- BAGIAN KANAN: PANEL RIWAYAT LOG -->
      <div class="col-md-5">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-light">
          <div class="card-header bg-transparent border-bottom p-4">
            <h6 class="fw-bold mb-0 text-dark">
              <i class="bi bi-clock-history me-2 text-primary"></i> Riwayat Perubahan
            </h6>
          </div>
          
          <div class="card-body p-4" style="max-height: 550px; overflow-y: auto;">
            
            <div v-if="histories.length === 0" class="text-center text-muted mt-5">
              <i class="bi bi-shield-check fs-1 d-block mb-2 text-success opacity-50"></i>
              <small>Belum ada rekaman perubahan konfigurasi.</small>
            </div>

            <div class="timeline" v-else>
              <div class="timeline-item mb-3 p-3 bg-white border rounded shadow-sm" v-for="h in histories" :key="h.id">
                
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 text-uppercase" style="font-size: 0.7rem;">
                    {{ formatNamaKolom(h.kolom_diubah) }}
                  </span>
                  <small class="text-muted" style="font-size: 0.7rem;">{{ formatDateTime(h.waktu_ubah) }}</small>
                </div>
                
                <div class="d-flex align-items-center mb-2">
                  <div class="w-50 pe-2 text-danger text-break text-truncate" title="Nilai Lama">
                    <del style="font-size: 0.8rem;">
                      {{ h.kolom_diubah === 'logo_url' ? (h.nilai_lama ? '[Gambar Lama]' : '(Kosong)') : (h.nilai_lama || '(Kosong)') }}
                    </del>
                  </div>
                  <div class="text-muted"><i class="bi bi-arrow-right"></i></div>
                  <div class="w-50 ps-2 text-success fw-bold text-break text-truncate" title="Nilai Baru">
                    <span style="font-size: 0.8rem;">
                       {{ h.kolom_diubah === 'logo_url' ? (h.nilai_baru ? '[Gambar Baru]' : '(Kosong)') : (h.nilai_baru || '(Kosong)') }}
                    </span>
                  </div>
                </div>

                <div class="text-end mt-2 pt-2 border-top">
                  <small class="text-muted" style="font-size: 0.7rem;">Oleh: <span class="fw-bold text-dark">{{ h.diubah_oleh }}</span></small>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'

const form = ref<any>({
  nama: '', sub_nama: '', alamat: '', email: '', telepon: '', logo_url: ''
})
let originalFormData: any = {} 

const histories = ref<any[]>([])
const currentUser = ref<any>(null)

const canUpdate = computed(() => currentUser.value?.can_update === true)

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) currentUser.value = JSON.parse(userData)
  
  await fetchData()
  await fetchHistory()
})

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatNamaKolom = (kolom: string) => {
  const map: any = {
    'nama': 'Nama Instansi',
    'sub_nama': 'Sub Nama',
    'alamat': 'Alamat',
    'email': 'Email',
    'telepon': 'No. Telepon',
    'logo_url': 'Logo'
  }
  return map[kolom] || kolom
}

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]

  if (file.size > 500 * 1024) {
    AppAlert.error('Ukuran Terlalu Besar', 'Maksimal ukuran logo adalah 500 KB.')
    input.value = '' 
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.logo_url = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const fetchData = async () => {
  AppAlert.loading('Memuat pengaturan...')
  try {
    const { data, error } = await supabase.from('company_profile').select('*').eq('id', 1).single()
    if (error && error.code !== 'PGRST116') throw error
    
    if (data) {
      form.value = { ...data }
      originalFormData = { ...data } 
    }
    AppAlert.close()
  } catch (err) { AppAlert.error('Gagal memuat pengaturan', err) }
}

const fetchHistory = async () => {
  try {
    const { data } = await supabase
      .from('company_profile_history')
      .select('*')
      .eq('profile_id', 1)
      .order('waktu_ubah', { ascending: false })
    
    histories.value = data || []
  } catch (err) { console.error('Gagal tarik histori', err) }
}

const saveData = async () => {
  if (!canUpdate.value) {
    AppAlert.error('Akses Ditolak', 'Anda tidak memiliki hak untuk mengubah pengaturan sistem.')
    return
  }
  if (!form.value.nama || !form.value.alamat) {
    AppAlert.error('Validasi Gagal', 'Nama Instansi Utama dan Alamat Lengkap wajib diisi.')
    return
  }

  AppAlert.loading('Menyimpan perubahan...')
  try {
    const currentUsername = currentUser.value?.nama || currentUser.value?.user_id || 'System'
    const currentTime = new Date().toISOString()

    const payload = {
      id: 1, 
      nama: form.value.nama,
      sub_nama: form.value.sub_nama || null,
      alamat: form.value.alamat,
      email: form.value.email || null,
      telepon: form.value.telepon || null,
      logo_url: form.value.logo_url, 
      updated_by: currentUsername,
      updated_at: currentTime
    }

    const { error } = await supabase.from('company_profile').upsert(payload, { onConflict: 'id' })
    if (error) throw error

    // Deteksi History termasuk sub_nama
    const fieldsToTrack = ['nama', 'sub_nama', 'alamat', 'email', 'telepon', 'logo_url']
    const changes = []
    
    for (let field of fieldsToTrack) {
      if (String(form.value[field] || '') !== String(originalFormData[field] || '')) {
        changes.push({
          profile_id: 1,
          kolom_diubah: field,
          nilai_lama: String(originalFormData[field] || ''),
          nilai_baru: String(form.value[field] || ''),
          diubah_oleh: currentUsername,
          waktu_ubah: currentTime
        })
      }
    }
    
    if (changes.length > 0) {
      const { error: histError } = await supabase.from('company_profile_history').insert(changes)
      if (histError) console.error('Gagal simpan histori', histError)
    }

    AppAlert.success('Tersimpan!', 'Profil perusahaan berhasil diperbarui.')
    
    await fetchData()
    await fetchHistory()
    
  } catch (err) { AppAlert.error('Gagal Menyimpan', err) }
}
</script>

<style scoped>
.form-control { border-radius: 6px; border-color: #cbd5e1; }
.form-control:focus { border-color: var(--primary-color); box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.15); }
.form-control:disabled { background-color: #f1f5f9; cursor: not-allowed; }

.card-body::-webkit-scrollbar { width: 6px; }
.card-body::-webkit-scrollbar-track { background: transparent; }
.card-body::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
</style>