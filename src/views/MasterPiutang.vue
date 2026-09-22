<template>
  <div class="master-piutang">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold text-dark mb-0">Master Piutang (Perjanjian)</h4>
        <p class="text-muted small mb-0">Wadah data kontrak/perjanjian piutang sebelum penerbitan invoice</p>
      </div>
      <button v-if="canCreate" class="btn btn-primary fw-bold px-4 shadow-sm" @click="openAddModal">
        <i class="bi bi-plus-lg me-2"></i> Tambah Perjanjian
      </button>
    </div>

    <!-- TABEL DATA -->
    <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
      <div class="table-responsive" style="min-height: 400px;">
        <table class="table table-striped table-hover table-bordered align-middle mb-0" style="min-width: 1200px;">
          <thead class="table-dark text-center align-middle">
            <tr>
              <th width="4%" class="py-3">No</th>
              <th width="16%" class="py-3">Pihak Lawan (Klien)</th>
              <th width="18%" class="py-3">No. Perjanjian / Tgl</th>
              <th width="15%" class="py-3">Total Tagihan</th>
              <th width="15%" class="py-3">Total Terbayar</th>
              <th width="15%" class="py-3">Sisa Piutang</th>
              <th width="12%" class="py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="masterPiutangs.length === 0">
              <td colspan="7" class="text-center text-muted py-5">
                <i class="bi bi-file-earmark-text fs-2 d-block mb-2"></i> Belum ada data perjanjian piutang.
              </td>
            </tr>
            
            <tr v-for="(item, index) in masterPiutangs" :key="item.id">
              <td class="text-center text-muted">{{ index + 1 }}</td>
              <td class="fw-bold text-dark">{{ item.pihak_lawan_nama || 'Tidak diketahui' }}</td>
              <td>
                <span class="badge bg-light text-dark border border-secondary mb-1">{{ item.nomor_perjanjian }}</span>
                <div class="small text-muted"><i class="bi bi-calendar-event me-1"></i> {{ formatDate(item.tanggal_mulai) }}</div>
              </td>
              <td class="text-end fw-bold text-primary">{{ formatRupiah(item.total_tagihan) }}</td>
              <td class="text-end fw-bold text-success">{{ formatRupiah(item.total_terbayar) }}</td>
              <td class="text-end fw-bold" :class="item.sisa_tagihan > 0 ? 'text-danger' : 'text-muted'">
                {{ formatRupiah(item.sisa_tagihan) }}
              </td>
              <td class="text-center text-nowrap">
                <button v-if="canUpdate" class="btn btn-sm btn-light text-primary border me-1 shadow-sm" @click="openEditModal(item)" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button v-if="!canUpdate" class="btn btn-sm btn-light text-secondary border me-1 shadow-sm" @click="openViewModal(item)" title="Lihat Detail">
                  <i class="bi bi-eye"></i>
                </button>
                <button v-if="canDelete" class="btn btn-sm btn-light text-danger border shadow-sm" @click="deleteData(item.id, item.nomor_perjanjian)" title="Hapus">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL FORM -->
    <div v-if="isModalOpen" class="custom-modal-overlay">
      <div class="custom-modal-card card border-0 shadow-lg rounded-4 overflow-hidden" :class="(isEditMode || isReadOnlyMode) ? 'modal-wide' : 'modal-normal'">
        
        <div class="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold mb-0 text-dark">
            <i class="bi" :class="isReadOnlyMode ? 'bi-info-circle text-info' : 'bi-file-earmark-text-fill text-primary'"></i> 
            <span class="ms-2">
              {{ isReadOnlyMode ? 'Detail Perjanjian' : (isEditMode ? 'Edit Perjanjian' : 'Tambah Perjanjian') }}
            </span>
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="row g-0">
          <div :class="(isEditMode || isReadOnlyMode) ? 'col-md-7 border-end' : 'col-12'">
            <div class="card-body p-4 max-h-600 overflow-auto custom-scrollbar">
              
              <div v-if="isReadOnlyMode" class="alert alert-secondary small py-2 d-flex align-items-center mb-3">
                <i class="bi bi-lock-fill me-2"></i> Mode Read-Only. Anda tidak berhak mengubah data ini.
              </div>

              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label small fw-bold">Pihak Lawan (Klien/Mitra) <span v-if="!isReadOnlyMode" class="text-danger">*</span></label>
                  <select class="form-select" v-model="form.pihak_lawan_id" :disabled="isReadOnlyMode || isEditMode">
                    <option value="" disabled>-- Pilih Pihak Lawan --</option>
                    <option v-for="mitra in pihakLawans" :key="mitra.id" :value="mitra.id">
                      {{ mitra.nama }}
                    </option>
                  </select>
                </div>
              </div>

              <hr class="text-muted opacity-25 my-4">

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Nomor Perjanjian <span v-if="!isReadOnlyMode" class="text-danger">*</span></label>
                  <input type="text" class="form-control" v-model="form.nomor_perjanjian" placeholder="Contoh: KONTRAK/2026/001" :disabled="isReadOnlyMode">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Tanggal Mulai <span v-if="!isReadOnlyMode" class="text-danger">*</span></label>
                  <input type="date" class="form-control" v-model="form.tanggal_mulai" :disabled="isReadOnlyMode">
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold">Keterangan Tambahan</label>
                  <textarea class="form-control" v-model="form.keterangan" rows="3" placeholder="Deskripsi singkat mengenai piutang ini..." :disabled="isReadOnlyMode"></textarea>
                </div>
              </div>

            </div>
            
            <div class="card-footer bg-white border-top text-end py-3 px-4">
              <button class="btn btn-light border fw-bold px-4" :class="!isReadOnlyMode ? 'me-2' : ''" @click="closeModal">
                {{ isReadOnlyMode ? 'Tutup' : 'Batal' }}
              </button>
              <button v-if="!isReadOnlyMode" class="btn btn-primary fw-bold px-4" @click="saveData">
                <i class="bi bi-save me-1"></i> Simpan
              </button>
            </div>
          </div>

          <!-- RIWAYAT LOG -->
          <div v-if="isEditMode || isReadOnlyMode" class="col-md-5 bg-light">
            <div class="p-4 h-100 d-flex flex-column">
              <h6 class="fw-bold text-dark mb-3 border-bottom pb-2">
                <i class="bi bi-clock-history me-1"></i> Riwayat Perubahan
              </h6>
              
              <div class="max-h-500 overflow-auto custom-scrollbar pe-2 flex-grow-1">
                <div v-if="histories.length === 0" class="text-center text-muted mt-5">
                  <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary opacity-50"></i>
                  <small>Belum ada perubahan tercatat.</small>
                </div>

                <div class="timeline" v-else>
                  <div class="timeline-item mb-3 p-3 bg-white border rounded shadow-sm" v-for="h in histories" :key="h.id">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 text-uppercase" style="font-size: 0.7rem;">
                        {{ h.kolom_diubah }}
                      </span>
                      <small class="text-muted" style="font-size: 0.7rem;">{{ formatDateTime(h.waktu_ubah) }}</small>
                    </div>
                    
                    <div class="d-flex align-items-center mb-2">
                      <div class="w-50 pe-2 text-danger text-break"><del style="font-size: 0.8rem;">{{ h.nilai_lama || '(Kosong)' }}</del></div>
                      <div class="text-muted"><i class="bi bi-arrow-right"></i></div>
                      <div class="w-50 ps-2 text-success fw-bold text-break"><span style="font-size: 0.8rem;">{{ h.nilai_baru || '(Kosong)' }}</span></div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'
import Swal from 'sweetalert2'

const masterPiutangs = ref<any[]>([])
const pihakLawans = ref<any[]>([])
const histories = ref<any[]>([])

const isModalOpen = ref(false)
const isEditMode = ref(false)
const isReadOnlyMode = ref(false)
const currentUser = ref<any>(null)

const form = ref<any>({ id: '', pihak_lawan_id: '', nomor_perjanjian: '', tanggal_mulai: '', keterangan: '' })
let originalFormData: any = {}

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) currentUser.value = JSON.parse(userData)
  await fetchDropdowns()
  await fetchData()
})

const canCreate = computed(() => currentUser.value?.can_create === true)
const canUpdate = computed(() => currentUser.value?.can_update === true)
const canDelete = computed(() => currentUser.value?.can_delete === true)

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const formatRupiah = (angka: number) => {
  if (!angka) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
}

const fetchDropdowns = async () => {
  try {
    const { data } = await supabase.from('pihak_lawan').select('id, nama').order('nama', { ascending: true })
    pihakLawans.value = data || []
  } catch (err) {}
}

const fetchData = async () => {
  AppAlert.loading('Memuat data...')
  try {
    const { data, error } = await supabase.from('v_master_piutang').select('*').order('tanggal_mulai', { ascending: false })
    if (error) throw error
    masterPiutangs.value = data || []
    AppAlert.close()
  } catch (err) { AppAlert.error('Gagal memuat data', err) }
}

const loadHistory = async (id: string) => {
  try {
    const { data } = await supabase.from('master_piutang_history').select('*').eq('master_piutang_id', id).order('waktu_ubah', { ascending: false })
    histories.value = data || []
  } catch (err) {}
}

const openAddModal = () => {
  if (!canCreate.value) return
  isEditMode.value = false; isReadOnlyMode.value = false
  form.value = { id: '', pihak_lawan_id: '', nomor_perjanjian: '', tanggal_mulai: '', keterangan: '' }
  isModalOpen.value = true
}

const openEditModal = async (item: any) => {
  if (!canUpdate.value) return
  isEditMode.value = true; isReadOnlyMode.value = false
  form.value = { ...item }; originalFormData = { ...item }
  isModalOpen.value = true; await loadHistory(item.id)
}

const openViewModal = async (item: any) => {
  isEditMode.value = false; isReadOnlyMode.value = true
  form.value = { ...item }
  isModalOpen.value = true; await loadHistory(item.id)
}

const closeModal = () => { isModalOpen.value = false; isReadOnlyMode.value = false; histories.value = [] }

const saveData = async () => {
  if (isReadOnlyMode.value) return
  if (!form.value.pihak_lawan_id || !form.value.nomor_perjanjian || !form.value.tanggal_mulai) {
    AppAlert.error('Validasi Gagal', 'Pihak Lawan, No. Perjanjian, dan Tanggal WAJIB diisi!')
    return
  }

  AppAlert.loading('Menyimpan...')
  try {
    const currentUsername = currentUser.value?.nama || currentUser.value?.user_id || 'System'
    const currentTime = new Date().toISOString()
    const payload = {
      pihak_lawan_id: form.value.pihak_lawan_id, nomor_perjanjian: form.value.nomor_perjanjian,
      tanggal_mulai: form.value.tanggal_mulai, keterangan: form.value.keterangan || null,
      updated_by: currentUsername, updated_at: currentTime
    }

    if (!isEditMode.value) {
      const { error } = await supabase.from('master_piutang').insert([{ ...payload, created_by: currentUsername, created_at: currentTime }])
      if (error) throw error
      AppAlert.success('Berhasil', 'Master Piutang baru berhasil dibuat.')
    } 
    else {
      const { error } = await supabase.from('master_piutang').update(payload).eq('id', form.value.id)
      if (error) throw error

      const fieldsToTrack = ['nomor_perjanjian', 'tanggal_mulai', 'keterangan']
      const changes = []
      for (let field of fieldsToTrack) {
        if (String(form.value[field] || '') !== String(originalFormData[field] || '')) {
          changes.push({
            master_piutang_id: form.value.id, kolom_diubah: field,
            nilai_lama: String(originalFormData[field] || ''), nilai_baru: String(form.value[field] || ''),
            diubah_oleh: currentUsername
          })
        }
      }
      if (changes.length > 0) await supabase.from('master_piutang_history').insert(changes)
      AppAlert.success('Berhasil', 'Perubahan disimpan.')
    }
    closeModal(); await fetchData()
  } catch (err) { AppAlert.error('Gagal Menyimpan', err) }
}

const deleteData = async (id: string, no_perjanjian: string) => {
  if (!canDelete.value) return
  const result = await Swal.fire({
    title: 'Hapus Data?', 
    html: `Hapus Master Piutang <b>${no_perjanjian}</b>?<br><small class="text-danger">Seluruh invoice dan pelunasan yang terkait juga akan ikut terhapus.</small>`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!'
  })
  if (result.isConfirmed) {
    AppAlert.loading('Menghapus...')
    try {
      const { error } = await supabase.from('master_piutang').delete().eq('id', id)
      if (error) throw error
      AppAlert.success('Terhapus!', 'Data berhasil dihapus.'); await fetchData()
    } catch (err: any) { AppAlert.error('Gagal menghapus', err.message || err) }
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
  width: 95%; max-height: 90vh; 
  animation: slideDown 0.3s ease-out; 
  transition: max-width 0.3s ease; 
}
.modal-normal { max-width: 600px; }
.modal-wide { max-width: 1000px; }
.max-h-600 { max-height: 65vh; }
.max-h-500 { max-height: 55vh; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.form-control, .form-select { border-radius: 6px; border-color: #cbd5e1; }
.form-control:focus, .form-select:focus { border-color: var(--primary-color); box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.15); }
.form-control:disabled, .form-select:disabled { background-color: #f1f5f9; cursor: not-allowed; }
.table-striped > tbody > tr:nth-of-type(odd) > * { --bs-table-bg-type: #f8fafc; }
</style>