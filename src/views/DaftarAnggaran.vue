<template>
  <div class="daftar-anggaran">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold text-dark mb-0">Daftar Anggaran</h4>
        <p class="text-muted small mb-0">Manajemen Rencana Anggaran (Form Mode)</p>
      </div>
      <button class="btn btn-primary fw-bold px-4 shadow-sm rounded-0" @click="openAddModal">
        <i class="bi bi-plus-lg me-2"></i> Tambah Anggaran
      </button>
    </div>

    <!-- FITUR PENCARIAN -->
    <div class="d-flex mb-3 align-items-center">
      <div class="input-group input-group-sm w-25">
        <span class="input-group-text rounded-0 bg-white border-secondary"><i class="bi bi-search"></i></span>
        <input type="text" class="form-control rounded-0 border-start-0 border-secondary ps-0" v-model="searchQuery" placeholder="Cari COA atau Uraian Anggaran...">
      </div>
    </div>

    <!-- TABEL UTAMA (Bersih, Kotak, Font Kecil) -->
    <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden">
      <div class="table-responsive" style="min-height: 400px;">
        <table class="table table-sm table-striped table-hover table-bordered align-middle mb-0" style="min-width: 1200px; font-size: 0.85rem;">
          <thead class="table-dark text-center align-middle">
            <tr>
              <th width="8%" class="py-2">COA</th>
              <th width="8%" class="py-2">Induk</th>
              <th width="18%" class="py-2">Uraian</th>
              <th width="6%" class="py-2">Jenis</th>
              <th width="9%" class="py-2">Status</th>
              <th width="7%" class="py-2">Satuan</th>
              <th width="8%" class="py-2">Jumlah</th>
              <th width="11%" class="py-2">Harga Satuan</th>
              <th width="11%" class="py-2">Harga Total</th>
              <th width="8%" class="py-2">Ket.</th>
              <th width="6%" class="py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredAnggarans.length === 0">
              <td colspan="11" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-2 d-block mb-2"></i> Belum ada data anggaran.
              </td>
            </tr>
            
            <tr v-for="(item, index) in filteredAnggarans" :key="index" :class="{'bg-light fw-medium': item.status === 'H' || item.status === 'DH'}">
              <td class="fw-bold text-center">{{ item.coa_anggaran }}</td>
              <td class="text-center"><small class="text-muted">{{ item.induk || '-' }}</small></td>
              <td :style="{ paddingLeft: item.status === 'D' ? '1.5rem' : '0.5rem' }">
                {{ item.uraian }}
              </td>
              <td class="text-center">
                <span class="badge rounded-0" :class="item.jenis === 'in' ? 'bg-success' : 'bg-danger'">{{ item.jenis?.toUpperCase() }}</span>
              </td>
              <td class="text-center">
                <span class="badge bg-secondary rounded-0" v-if="item.status === 'H'">Header</span>
                <span class="badge bg-secondary rounded-0" v-else-if="item.status === 'DH'">Detail Header</span>
                <span class="badge bg-primary rounded-0" v-else>Detail</span>
              </td>
              <td class="text-center">{{ item.satuan || '-' }}</td>
              <td class="text-end">{{ formatRupiah(item.jumlah) || '-' }}</td>
              <td class="text-end">{{ formatRupiah(item.harga_satuan) }}</td>
              <td class="text-end fw-bold text-primary">{{ formatRupiah(item.harga_total) }}</td>
              <td class="text-center">
                <div class="text-truncate text-muted d-inline-block" style="max-width: 100px; font-size: 0.75rem;" :title="item.keterangan">
                  {{ item.keterangan || '-' }}
                </div>
              </td>
              <td class="text-center text-nowrap">
                <button class="btn btn-sm btn-light text-primary border me-1 rounded-0 shadow-sm" @click="openEditModal(item)" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-light text-danger border rounded-0 shadow-sm" @click="deleteRow(item.coa_anggaran, item.uraian)" title="Hapus">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL FORM SPLIT (Kiri Form, Kanan History) -->
    <div v-if="isModalOpen" class="custom-modal-overlay">
      <div class="custom-modal-card card border-0 shadow-lg rounded-0 overflow-hidden" :class="isEditMode ? 'modal-wide' : 'modal-normal'">
        
        <div class="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold mb-0 text-dark">
            <i class="bi bi-journal-text me-2 text-primary"></i> 
            {{ isEditMode ? 'Edit Anggaran' : 'Tambah Anggaran Baru' }}
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="row g-0">
          <div :class="isEditMode ? 'col-md-7 border-end' : 'col-12'">
            <div class="card-body p-4 max-h-600 overflow-auto custom-scrollbar">
              
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Kode COA <span class="text-danger">*</span></label>
                  <input type="text" class="form-control rounded-0" v-model="form.coa_anggaran" :disabled="isEditMode" placeholder="Contoh: 1.1">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Induk COA (Opsional)</label>
                  <select class="form-select rounded-0" v-model="form.induk" :disabled="form.status === 'H'">
                    <option value="">- Tanpa Induk -</option>
                    <option v-for="h in headerOptions" :key="h.coa_anggaran" :value="h.coa_anggaran">
                      {{ h.coa_anggaran }} - {{ h.uraian }}
                    </option>
                  </select>
                </div>

                <div class="col-md-12">
                  <label class="form-label small fw-bold">Nama Anggaran (Uraian) <span class="text-danger">*</span></label>
                  <input type="text" class="form-control rounded-0" v-model="form.uraian" placeholder="Masukkan nama anggaran...">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-bold">Status Akun</label>
                  <select class="form-select rounded-0" v-model="form.status" @change="recalculateFormTotal">
                    <option value="H">H (Header / Induk Besar)</option>
                    <option value="DH">DH (Detail Header / Sub Induk)</option>
                    <option value="D">D (Detail / Baris Transaksi)</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Jenis Arus</label>
                  <select class="form-select rounded-0" v-model="form.jenis">
                    <option value="in">IN (Pemasukan)</option>
                    <option value="out">OUT (Pengeluaran)</option>
                  </select>
                </div>

                <div class="col-md-4">
                  <label class="form-label small fw-bold">Satuan</label>
                  <input type="text" class="form-control rounded-0" v-model="form.satuan" placeholder="Pcs, Kg, dll" :disabled="form.status !== 'D'">
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-bold">Volume / Jumlah</label>
                  <input type="text" class="form-control text-end rounded-0" :value="formatRupiah(form.jumlah)" @input="e => onFormNumberInput('jumlah', (e.target as HTMLInputElement).value)" :disabled="form.status !== 'D'">
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-bold">Harga Satuan (Rp)</label>
                  <input type="text" class="form-control text-end rounded-0" :value="formatRupiah(form.harga_satuan)" @input="e => onFormNumberInput('harga_satuan', (e.target as HTMLInputElement).value)" :disabled="form.status !== 'D'">
                </div>

                <div class="col-md-12">
                  <div class="p-3 bg-light border rounded-0 mt-2 d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-dark">Estimasi Harga Total:</span>
                    <span class="fs-5 fw-bold text-primary">Rp {{ formatRupiah(form.harga_total) }}</span>
                  </div>
                </div>

                <div class="col-md-12">
                  <label class="form-label small fw-bold">Keterangan / Catatan</label>
                  <textarea class="form-control rounded-0" v-model="form.keterangan" rows="3" placeholder="Tambahkan deskripsi atau catatan..."></textarea>
                </div>
              </div>

            </div>
            
            <div class="card-footer bg-white border-top text-end py-3 px-4">
              <button class="btn btn-light border fw-bold me-2 px-4 rounded-0" @click="closeModal">Batal</button>
              <button class="btn btn-primary fw-bold px-4 rounded-0" @click="saveData">
                <i class="bi bi-save me-1"></i> Simpan
              </button>
            </div>
          </div>

          <!-- BAGIAN KANAN: PANEL RIWAYAT -->
          <div v-if="isEditMode" class="col-md-5 bg-light">
            <div class="p-4 h-100 d-flex flex-column">
              <h6 class="fw-bold text-dark mb-3 border-bottom pb-2">
                <i class="bi bi-clock-history me-1"></i> Riwayat Perubahan
              </h6>
              
              <div class="max-h-500 overflow-auto custom-scrollbar pe-2 flex-grow-1">
                <div v-if="histories.length === 0" class="text-center text-muted mt-5">
                  <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary opacity-50"></i>
                  <small>Belum ada perubahan.</small>
                </div>

                <div class="timeline" v-else>
                  <div class="timeline-item mb-3 p-3 bg-white border rounded-0 shadow-sm" v-for="h in histories" :key="h.id">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-0 text-uppercase" style="font-size: 0.7rem;">
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

const anggarans = ref<any[]>([])
const currentUser = ref<any>(null)
const isModalOpen = ref(false)
const isEditMode = ref(false)
const histories = ref<any[]>([])

const searchQuery = ref('') // STATE PENCARIAN BARU

const form = ref<any>({ coa_anggaran: '', induk: '', uraian: '', jenis: 'out', status: 'D', satuan: '', jumlah: 0, harga_satuan: 0, harga_total: 0, keterangan: '' })
let originalFormData: any = {}

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) currentUser.value = JSON.parse(userData)
  await fetchAnggaran()
})

const headerOptions = computed(() => anggarans.value.filter(a => a.status === 'H' || a.status === 'DH'))

// COMPUTED UNTUK PENCARIAN DATA
const filteredAnggarans = computed(() => {
  if (!searchQuery.value) return anggarans.value
  const q = searchQuery.value.toLowerCase()
  return anggarans.value.filter(a => 
    a.coa_anggaran.toLowerCase().includes(q) || 
    a.uraian.toLowerCase().includes(q)
  )
})

const formatRupiah = (angka: number | string) => {
  if (angka === 0 || angka === '0') return '0'
  if (!angka) return ''
  return new Intl.NumberFormat('id-ID').format(Number(angka))
}
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fetchAnggaran = async () => {
  AppAlert.loading('Memuat data anggaran...')
  try {
    const { data, error } = await supabase.from('anggaran').select('*').order('coa_anggaran', { ascending: true })
    if (error) throw error
    anggarans.value = data || []
    updateHeaderTotals() 
    AppAlert.close()
  } catch (err) {
    AppAlert.error('Gagal memuat', err)
  }
}

const updateHeaderTotals = () => {
  anggarans.value.forEach(parent => {
    if (parent.status === 'H' || parent.status === 'DH') {
      const children = anggarans.value.filter(child => child.induk === parent.coa_anggaran)
      parent.harga_total = children.reduce((sum, child) => sum + Number(child.harga_total || 0), 0)
    }
  })
}

const openAddModal = () => {
  isEditMode.value = false
  form.value = { coa_anggaran: '', induk: '', uraian: '', jenis: 'out', status: 'D', satuan: '', jumlah: 0, harga_satuan: 0, harga_total: 0, keterangan: '' }
  isModalOpen.value = true
}

const openEditModal = async (item: any) => {
  isEditMode.value = true
  form.value = { ...item }
  originalFormData = { ...item }
  isModalOpen.value = true
  
  try {
    const { data } = await supabase.from('anggaran_history').select('*').eq('coa_anggaran', item.coa_anggaran).order('waktu_ubah', { ascending: false })
    histories.value = data || []
  } catch (err) { console.error('Gagal tarik histori', err) }
}

const closeModal = () => {
  isModalOpen.value = false
  histories.value = []
}

const onFormNumberInput = (field: string, val: string) => {
  const numericStr = val.replace(/[^0-9]/g, '')
  form.value[field] = parseInt(numericStr, 10) || 0
  recalculateFormTotal()
}

const recalculateFormTotal = () => {
  if (form.value.status === 'H' || form.value.status === 'DH') {
    form.value.jumlah = 0
    form.value.harga_satuan = 0
    form.value.satuan = ''
  }
  form.value.harga_total = Number(form.value.jumlah) * Number(form.value.harga_satuan)
}

const saveData = async () => {
  if (!form.value.coa_anggaran || !form.value.uraian) {
    AppAlert.error('Validasi', 'Kode COA dan Nama Anggaran wajib diisi!')
    return
  }

  AppAlert.loading('Menyimpan...')
  try {
    const payload = {
      coa_anggaran: form.value.coa_anggaran, induk: form.value.induk || null, uraian: form.value.uraian, 
      satuan: form.value.satuan, jumlah: form.value.jumlah, harga_satuan: form.value.harga_satuan, 
      harga_total: form.value.harga_total, keterangan: form.value.keterangan, status: form.value.status, jenis: form.value.jenis
    }

    if (!isEditMode.value) {
      const { error } = await supabase.from('anggaran').insert([payload])
      if (error) throw error
      AppAlert.success('Berhasil', 'Anggaran baru ditambahkan.')
    } 
    else {
      const { error } = await supabase.from('anggaran').update(payload).eq('coa_anggaran', form.value.coa_anggaran)
      if (error) throw error

      const fieldsToTrack = ['induk', 'uraian', 'satuan', 'jumlah', 'harga_satuan', 'harga_total', 'status', 'keterangan']
      const changes = []
      for (let field of fieldsToTrack) {
        if (String(form.value[field]) !== String(originalFormData[field])) {
          changes.push({
            coa_anggaran: form.value.coa_anggaran, kolom_diubah: field,
            nilai_lama: String(originalFormData[field] || ''), nilai_baru: String(form.value[field] || ''),
            diubah_oleh: currentUser.value?.nama || 'Unknown'
          })
        }
      }
      if (changes.length > 0) await supabase.from('anggaran_history').insert(changes)
      AppAlert.success('Berhasil', 'Perubahan disimpan.')
    }

    closeModal()
    
    if (!isEditMode.value) {
      anggarans.value.push(payload)
      anggarans.value.sort((a, b) => a.coa_anggaran.localeCompare(b.coa_anggaran))
    } else {
      const index = anggarans.value.findIndex(a => a.coa_anggaran === form.value.coa_anggaran)
      if (index !== -1) anggarans.value[index] = payload
    }
    
    if (form.value.induk) {
      const parentData = anggarans.value.find(a => a.coa_anggaran === form.value.induk)
      if (parentData) {
        const children = anggarans.value.filter(c => c.induk === parentData.coa_anggaran)
        const newTotal = children.reduce((sum, c) => sum + Number(c.harga_total || 0), 0)
        parentData.harga_total = newTotal
        await supabase.from('anggaran').update({ harga_total: newTotal }).eq('coa_anggaran', parentData.coa_anggaran)
      }
    }
    updateHeaderTotals()
    
  } catch (err) {
    AppAlert.error('Gagal Menyimpan', err)
  }
}

const deleteRow = async (coa_anggaran: string, uraian: string) => {
  const result = await Swal.fire({
    title: 'Hapus Anggaran?', html: `Hapus <b>${coa_anggaran} - ${uraian}</b>?`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!'
  })
  if (result.isConfirmed) {
    AppAlert.loading('Menghapus...')
    try {
      const { error } = await supabase.from('anggaran').delete().eq('coa_anggaran', coa_anggaran)
      if (error) throw error
      AppAlert.success('Terhapus!', 'Data berhasil dihapus.')
      anggarans.value = anggarans.value.filter(a => a.coa_anggaran !== coa_anggaran)
      updateHeaderTotals() 
    } catch (err) { AppAlert.error('Gagal', err) }
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
.modal-normal { max-width: 700px; }
.modal-wide { max-width: 1100px; }

.max-h-600 { max-height: 65vh; }
.max-h-500 { max-height: 55vh; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.form-control, .form-select {
  border-radius: 0;
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