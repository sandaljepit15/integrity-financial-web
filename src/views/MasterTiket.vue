<template>
  <div class="master-tiket">
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Master Tiket / Segmen</h4>
          <p class="text-muted small mb-0">Katalog segmen tiket untuk pusat relasi Platform (Piutang) dan EO (Hutang).</p>
        </div>
        <button v-if="canCreate" class="btn btn-primary fw-bold px-4 shadow-sm rounded-0" @click="openAddModal">
          <i class="bi bi-plus-lg me-2"></i> Tambah Segmen Tiket
        </button>
      </div>

      <!-- FILTER & PENCARIAN -->
      <div class="d-flex mb-3 gap-2 align-items-center">
        <select class="form-select form-select-sm w-auto rounded-0 border-secondary" v-model="searchColumn">
          <option value="semua">Semua Kolom</option>
          <option value="kode_tiket">Kode Tiket</option>
          <option value="nama_segmen">Nama Segmen / Batch</option>
          <option value="nama_eo">Event / EO</option>
          <option value="nama_platform">Platform (Vendor)</option>
        </select>
        <div class="input-group input-group-sm w-25">
          <span class="input-group-text rounded-0 bg-white border-secondary"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control rounded-0 border-start-0 border-secondary ps-0" v-model="searchTableQuery" placeholder="Cari tiket...">
        </div>
      </div>

      <!-- TABEL DATA -->
      <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden">
        <div class="table-responsive" style="min-height: 440px;">
          <table class="table table-sm table-striped table-hover table-bordered align-middle mb-0" style="font-size: 0.85rem;">
            <thead class="table-dark text-center align-middle">
              <tr>
                <th width="5%" class="py-3">No</th>
                <th width="15%" class="py-3 cursor-pointer" @click="handleSort('kode_tiket')">
                  Kode Tiket <i class="bi ms-1" :class="sortColumn==='kode_tiket' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="20%" class="py-3 cursor-pointer" @click="handleSort('nama_segmen')">
                  Nama Segmen / Kelas <i class="bi ms-1" :class="sortColumn==='nama_segmen' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="18%" class="py-3 cursor-pointer" @click="handleSort('nama_platform')">
                  Platform (Piutang) <i class="bi ms-1" :class="sortColumn==='nama_platform' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="18%" class="py-3 cursor-pointer" @click="handleSort('nama_eo')">
                  Event / EO (Hutang) <i class="bi ms-1" :class="sortColumn==='nama_eo' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="14%" class="py-3">Pemetaan COA Default</th>
                <th width="10%" class="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedData.length === 0">
                <td colspan="7" class="text-center text-muted py-5">Belum ada master tiket yang didaftarkan.</td>
              </tr>
              <tr v-for="(item, index) in paginatedData" :key="item.id">
                <td class="text-center text-muted">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td class="fw-bold text-center text-dark">{{ item.kode_tiket }}</td>
                <td class="fw-bold text-primary">{{ item.nama_segmen }}<br><small class="text-muted fw-normal">Rp {{ formatNominal(item.harga_satuan) }}</small></td>
                <td>{{ item.nama_platform }}</td>
                <td>{{ item.nama_eo }}</td>
                <td>
                  <div class="small"><span class="fw-bold text-primary">D:</span> {{ item.coa_piutang }}</div>
                  <div class="small"><span class="fw-bold text-danger">K:</span> {{ item.coa_hutang }}</div>
                </td>
                <td class="text-center text-nowrap">
                  <!-- TOMBOL HISTORI EDIT -->
                  <button class="btn btn-sm btn-light text-info border me-1 rounded-0" @click="openHistoryModal(item)" title="Riwayat Edit Master">
                    <i class="bi bi-clock-history"></i>
                  </button>
                  <!-- TOMBOL EDIT -->
                  <button v-if="canEdit" class="btn btn-sm btn-light text-warning border me-1 rounded-0" @click="openEditModal(item)" title="Edit Master Tiket">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <!-- TOMBOL HAPUS -->
                  <button v-if="canDelete" class="btn btn-sm btn-light text-danger border rounded-0" @click="deleteData(item.id, item.nama_segmen)" title="Hapus Master Tiket">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- PAGINATION -->
        <div class="d-flex justify-content-between align-items-center p-3 bg-light border-top">
          <div class="text-muted fw-bold" style="font-size: 0.85rem;">
            Tampil {{ sortedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, sortedData.length) }} dari {{ sortedData.length }} data
          </div>
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary rounded-0 fw-bold" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
            <button class="btn btn-sm btn-outline-secondary rounded-0 fw-bold" disabled>Hal {{ currentPage }} / {{ totalPages || 1 }}</button>
            <button class="btn btn-sm btn-outline-secondary rounded-0 fw-bold" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage++">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL HISTORI EDIT -->
    <div v-if="isHistoryModalOpen" class="custom-modal-overlay">
      <div class="custom-modal-card card border-0 shadow-lg rounded-0 overflow-hidden" style="max-width: 800px; width: 95%; z-index: 1060;">
        <div class="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center flex-shrink-0">
          <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-clock-history text-info me-2"></i> Riwayat Perubahan Data: {{ currentHistoryCode }}</h5>
          <button type="button" class="btn-close" @click="closeHistoryModal"></button>
        </div>
        <div class="card-body p-4 modal-body-scroll custom-scrollbar bg-light bg-opacity-50">
          <div v-if="historyLoading" class="text-center py-5 text-muted">
            <div class="spinner-border spinner-border-sm text-info me-2" role="status"></div> Memuat histori...
          </div>
          <div v-else-if="historyData.length === 0" class="text-center py-5 text-muted fst-italic">
            <i class="bi bi-folder-x fs-1 d-block mb-2 text-secondary opacity-50"></i> Belum ada riwayat perubahan (Edit) untuk Master Tiket ini.
          </div>
          <div v-else class="timeline">
            <div v-for="log in historyData" :key="log.id" class="card rounded-0 shadow-sm border border-secondary mb-3">
              <div class="card-header bg-white border-bottom p-2 px-3 d-flex justify-content-between align-items-center">
                <div class="fw-bold text-dark" style="font-size: 0.85rem;"><i class="bi bi-person-circle me-1 text-primary"></i> {{ log.edited_by }}</div>
                <div class="text-muted small"><i class="bi bi-calendar-check me-1"></i> {{ formatDateTime(log.edited_at) }}</div>
              </div>
              <div class="card-body p-3">
                <div class="mb-3">
                  <span class="badge bg-danger rounded-0 me-2">Alasan Ubah:</span> 
                  <span class="fst-italic text-dark" style="font-size: 0.9rem;">"{{ log.alasan }}"</span>
                </div>
                
                <div class="row g-2">
                  <div class="col-6">
                    <div class="fw-bold text-muted border-bottom mb-1" style="font-size: 0.75rem;">SEBELUM DIUBAH (DATA LAMA):</div>
                    <div class="bg-light p-2 rounded-0 border text-muted" style="font-size: 0.8rem;">
                      <div class="fw-bold text-danger">{{ log.data_lama.nama_segmen }}</div>
                      <div>Harga: Rp {{ formatNominal(log.data_lama.harga_satuan) }}</div>
                      <!-- PERBAIKAN TAMPILAN HISTORI RELASI -->
                      <div class="mt-1 pt-1 border-top border-secondary opacity-75">
                        <span class="d-block text-truncate" title="Platform">P: {{ log.data_lama.nama_platform || '-' }}</span>
                        <span class="d-block text-truncate" title="EO">E: {{ log.data_lama.nama_eo || '-' }}</span>
                      </div>
                      <div class="mt-1 pt-1 border-top border-secondary opacity-75">
                        D: {{ log.data_lama.coa_piutang }} <br> K: {{ log.data_lama.coa_hutang }}
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="fw-bold text-muted border-bottom mb-1" style="font-size: 0.75rem;">SETELAH DIUBAH (DATA BARU):</div>
                    <div class="bg-light p-2 rounded-0 border border-success" style="font-size: 0.8rem;">
                      <div class="fw-bold text-success">{{ log.data_baru.nama_segmen }}</div>
                      <div class="text-dark">Harga: Rp {{ formatNominal(log.data_baru.harga_satuan) }}</div>
                      <!-- PERBAIKAN TAMPILAN HISTORI RELASI -->
                      <div class="mt-1 pt-1 border-top border-secondary text-dark">
                        <span class="d-block text-truncate" title="Platform">P: {{ log.data_baru.nama_platform || '-' }}</span>
                        <span class="d-block text-truncate" title="EO">E: {{ log.data_baru.nama_eo || '-' }}</span>
                      </div>
                      <div class="mt-1 pt-1 border-top border-secondary text-dark">
                        D: {{ log.data_baru.coa_piutang }} <br> K: {{ log.data_baru.coa_hutang }}
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

    <!-- MODAL FORM INPUT & EDIT -->
    <div v-if="isModalOpen" class="custom-modal-overlay">
      <div v-if="activeDropdown" class="position-fixed top-0 start-0 w-100 h-100 overlay-dropdown" @click="closeAllDropdowns"></div>
      <div class="custom-modal-card card border-0 shadow-lg rounded-0 overflow-hidden" style="max-width: 900px; width: 95%; z-index: 1050;">
        <div class="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center flex-shrink-0">
          <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-tags text-primary me-2"></i> {{ isEdit ? 'Edit Master Tiket' : 'Form Master Tiket' }}</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="card-body p-4 modal-body-scroll custom-scrollbar bg-light bg-opacity-50">
          <div class="bg-white p-3 rounded-0 border shadow-sm mb-4">
            <h6 class="fw-bold mb-3 border-bottom pb-2">1. Identitas Tiket / Segmen</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label small fw-bold">Kode Tiket</label>
                <input type="text" class="form-control fw-bold bg-light rounded-0" v-model="form.kode_tiket" readonly>
              </div>
              <div class="col-md-8">
                <label class="form-label small fw-bold">Nama Segmen / Batch Tiket <span class="text-danger">*</span></label>
                <input type="text" class="form-control rounded-0" v-model="form.nama_segmen" placeholder="Cth: VIP Day 1, Presale Batch 2...">
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Harga Satuan (Opsional)</label>
                <div class="input-group">
                  <span class="input-group-text rounded-0 bg-light">Rp</span>
                  <input type="text" class="form-control text-end rounded-0 fw-bold" :value="formatInputRupiah(form.harga_satuan)" @input="(e) => handleInput('harga_satuan', e)" placeholder="0">
                </div>
              </div>
              <div class="col-md-8">
                <label class="form-label small fw-bold">Keterangan Tambahan</label>
                <input type="text" class="form-control rounded-0" v-model="form.keterangan" placeholder="Keterangan internal...">
              </div>
            </div>
          </div>

          <div class="bg-white p-3 rounded-0 border shadow-sm mb-4">
            <h6 class="fw-bold mb-3 border-bottom pb-2">2. Pusat Relasi Akuntansi & Partner</h6>
            <div class="row g-3">
              <div class="col-md-6 border-end">
                <label class="form-label small fw-bold text-primary">Platform Penjual / Mutasi (Piutang) <span class="text-danger">*</span></label>
                <select class="form-select border-primary rounded-0 mb-3" v-model="form.master_piutang_id">
                  <option value="" disabled>-- Pilih Master Piutang --</option>
                  <option v-for="mp in masterPiutangs" :key="mp.id" :value="mp.id">{{ mp.pihak_lawan?.nama }}</option>
                </select>

                <label class="form-label small fw-bold text-muted">Akun Default Mutasi (DEBET) <span class="text-danger">*</span></label>
                <div class="position-relative dropdown-container">
                  <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0" @click="toggleDropdown('coa_piutang')">
                    <span class="text-truncate" :class="{'text-muted': !form.coa_piutang}">{{ getCoaLabel(form.coa_piutang) || 'Pilih COA...' }}</span>
                  </div>
                  <div v-if="activeDropdown === 'coa_piutang'" class="position-absolute w-100 bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu">
                    <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Cari COA..." v-model="searchQuery" @click.stop>
                    <div class="list-group list-group-flush">
                      <button v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click="selectCoa('coa_piutang', coa.coa_code)">
                        <span class="fw-bold text-primary">{{ coa.coa_code }}</span> - {{ coa.nama }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label small fw-bold text-danger">Pemilik Event / EO (Hutang) <span class="text-danger">*</span></label>
                <select class="form-select border-danger rounded-0 mb-3" v-model="form.master_hutang_id">
                  <option value="" disabled>-- Pilih Master Hutang --</option>
                  <option v-for="mh in masterHutangs" :key="mh.id" :value="mh.id">{{ mh.pihak_lawan?.nama }}</option>
                </select>

                <label class="form-label small fw-bold text-muted">Akun Default Hak EO (KREDIT) <span class="text-danger">*</span></label>
                <div class="position-relative dropdown-container">
                  <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0" @click="toggleDropdown('coa_hutang')">
                    <span class="text-truncate" :class="{'text-muted': !form.coa_hutang}">{{ getCoaLabel(form.coa_hutang) || 'Pilih COA...' }}</span>
                  </div>
                  <div v-if="activeDropdown === 'coa_hutang'" class="position-absolute w-100 bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu">
                    <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Cari COA..." v-model="searchQuery" @click.stop>
                    <div class="list-group list-group-flush">
                      <button v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click="selectCoa('coa_hutang', coa.coa_code)">
                        <span class="fw-bold text-danger">{{ coa.coa_code }}</span> - {{ coa.nama }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- INPUT ALASAN EDIT (HANYA MUNCUL SAAT EDIT) -->
          <div class="bg-white p-3 rounded-0 border border-danger shadow-sm" v-if="isEdit">
            <label class="form-label small fw-bold text-danger"><i class="bi bi-exclamation-triangle me-1"></i> Alasan Perubahan Data (Log Audit) <span class="text-danger">*</span></label>
            <input type="text" class="form-control rounded-0 border-danger" v-model="alasanEdit" placeholder="Wajib diisi. Mengapa master tiket ini diubah?">
            <small class="text-muted mt-1 d-block">Data lama akan dipindahkan ke tabel history_edit secara otomatis.</small>
          </div>

        </div>

        <div class="card-footer bg-white border-top text-end py-3 px-4 flex-shrink-0" style="z-index: 1040;">
          <button class="btn btn-light border fw-bold px-4 me-2 rounded-0" @click="closeModal">Batal</button>
          <button class="btn btn-primary fw-bold px-4 rounded-0" @click="saveData" :disabled="!isFormValid">
            <i class="bi" :class="isEdit ? 'bi-save' : 'bi-plus-lg'"></i> {{ isEdit ? 'Simpan Perubahan' : 'Simpan Tiket Baru' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'
import Swal from 'sweetalert2'

const tiketList = ref<any[]>([])
const masterPiutangs = ref<any[]>([])
const masterHutangs = ref<any[]>([])
const listCOA = ref<any[]>([])

const isModalOpen = ref(false)
const currentUser = ref<any>(null)
const activeDropdown = ref<string | null>(null)
const searchQuery = ref('') 

// EDIT STATE
const isEdit = ref(false)
const currentEditId = ref('')
const alasanEdit = ref('')

// HISTORY MODAL STATE
const isHistoryModalOpen = ref(false)
const historyData = ref<any[]>([])
const historyLoading = ref(false)
const currentHistoryCode = ref('')

const form = ref<any>({
  kode_tiket: '', nama_segmen: '', master_piutang_id: '', master_hutang_id: '',
  coa_piutang: '', coa_hutang: '', harga_satuan: 0, keterangan: ''
})

// FILTER & PAGINATION
const searchTableQuery = ref('')
const searchColumn = ref('semua')
const sortColumn = ref('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const itemsPerPage = 10

watch(searchTableQuery, () => { currentPage.value = 1 })
watch(searchColumn, () => { currentPage.value = 1 })

const filteredData = computed(() => {
  if (!searchTableQuery.value) return tiketList.value
  const q = searchTableQuery.value.toLowerCase()
  return tiketList.value.filter(item => {
    if (searchColumn.value === 'semua') {
      return (item.kode_tiket?.toLowerCase().includes(q) ||
              item.nama_segmen?.toLowerCase().includes(q) ||
              item.nama_eo?.toLowerCase().includes(q) ||
              item.nama_platform?.toLowerCase().includes(q))
    } else {
      return item[searchColumn.value]?.toString().toLowerCase().includes(q)
    }
  })
})

const sortedData = computed(() => {
  const data = [...filteredData.value]
  data.sort((a, b) => {
    let valA = a[sortColumn.value] || ''
    let valB = b[sortColumn.value] || ''
    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()

    if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1
    if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
  return data
})

const totalPages = computed(() => Math.ceil(sortedData.value.length / itemsPerPage))
const paginatedData = computed(() => sortedData.value.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage))

const handleSort = (col: string) => {
  if (sortColumn.value === col) { sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc' } 
  else { sortColumn.value = col; sortDirection.value = 'asc' }
  currentPage.value = 1
}

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) currentUser.value = JSON.parse(userData)
  await fetchDropdowns()
  await fetchData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })

const canCreate = computed(() => currentUser.value?.can_create === true)
const canEdit = computed(() => currentUser.value?.can_update === true || currentUser.value?.can_edit === true || currentUser.value?.can_create === true)
const canDelete = computed(() => currentUser.value?.can_delete === true)

const generateKodeTiket = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let uniqCode = ''
  for (let i = 0; i < 5; i++) uniqCode += chars.charAt(Math.floor(Math.random() * chars.length))
  return `TK-${uniqCode}`
}

const isFormValid = computed(() => {
  const baseValid = form.value.nama_segmen && form.value.master_piutang_id && form.value.coa_piutang && 
                    form.value.master_hutang_id && form.value.coa_hutang
  if(isEdit.value) return baseValid && alasanEdit.value.trim() !== ''
  return baseValid
})

const handleInput = (field: string, e: Event) => {
  const target = e.target as HTMLInputElement | null
  if (target) form.value[field] = parseRupiah(target.value)
}

const handleClickOutside = (event: MouseEvent) => { const target = event.target as HTMLElement; if (!target.closest('.dropdown-container')) closeAllDropdowns() }
const toggleDropdown = (id: string) => {
  if (activeDropdown.value === id) closeAllDropdowns()
  else {
    activeDropdown.value = id; searchQuery.value = ''
    nextTick(() => { const input = document.querySelector('.custom-dropdown-menu input') as HTMLInputElement; if (input) input.focus() })
  }
}
const closeAllDropdowns = () => { activeDropdown.value = null; searchQuery.value = '' }

const filteredCOA = computed(() => {
  if (!searchQuery.value) return listCOA.value
  const q = searchQuery.value.toLowerCase()
  return listCOA.value.filter(c => c.coa_code.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q))
})

const getCoaLabel = (code: string) => {
  if (!code) return ''
  const c = listCOA.value.find(x => x.coa_code === code)
  return c ? `${c.coa_code} - ${c.nama}` : code
}

const selectCoa = (field: string, code: string) => { form.value[field] = code; closeAllDropdowns() }

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'; const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const formatNominal = (angka: number) => { if (angka === undefined || angka === null) return '0'; return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka) }
const parseRupiah = (val: string) => { if (!val) return 0; const parsed = Number(val.replace(/[^0-9]/g, '')); return isNaN(parsed) ? 0 : parsed }
const formatInputRupiah = (val: number | string) => { if (!val || val === 0 || val === '0') return ''; return new Intl.NumberFormat('id-ID').format(Number(val)) }

const fetchDropdowns = async () => {
  try {
    const { data: mpData } = await supabase.from('master_piutang').select('id, nomor_perjanjian, pihak_lawan(id, nama)')
    masterPiutangs.value = mpData || []
    
    const { data: mhData } = await supabase.from('master_hutang').select('id, nomor_perjanjian, pihak_lawan(id, nama)')
    masterHutangs.value = mhData || []
    
    const { data: coaData } = await supabase.from('coas').select('*').eq('sifat', 'D').order('coa_code', { ascending: true })
    listCOA.value = coaData || []
  } catch (err) {
    console.error(err)
  }
}

const fetchData = async () => {
  AppAlert.loading('Memuat data...')
  try {
    const { data, error } = await supabase.from('master_tiket')
      .select(`*, master_hutang(pihak_lawan(nama)), master_piutang(pihak_lawan(nama))`)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    tiketList.value = data.map((d: any) => ({ 
      ...d, 
      nama_eo: d.master_hutang?.pihak_lawan?.nama || '-',
      nama_platform: d.master_piutang?.pihak_lawan?.nama || '-'
    }))
    AppAlert.close()
  } catch (err) { AppAlert.error('Gagal memuat data', err) }
}

const openAddModal = () => {
  if (!canCreate.value) return
  isEdit.value = false
  currentEditId.value = ''
  alasanEdit.value = ''
  
  form.value = { 
    kode_tiket: generateKodeTiket(), nama_segmen: '', master_piutang_id: '', master_hutang_id: '',
    coa_piutang: '', coa_hutang: '', harga_satuan: 0, keterangan: ''
  }; 
  isModalOpen.value = true
}

const openEditModal = (item: any) => {
  if (!canEdit.value) return
  isEdit.value = true
  currentEditId.value = item.id
  alasanEdit.value = ''
  
  form.value = {
    kode_tiket: item.kode_tiket,
    nama_segmen: item.nama_segmen,
    master_piutang_id: item.master_piutang_id,
    master_hutang_id: item.master_hutang_id,
    coa_piutang: item.coa_piutang,
    coa_hutang: item.coa_hutang,
    harga_satuan: item.harga_satuan,
    keterangan: item.keterangan || ''
  }
  isModalOpen.value = true
}

const closeModal = () => { isModalOpen.value = false; closeAllDropdowns() }

const openHistoryModal = async (item: any) => {
  isHistoryModalOpen.value = true
  historyLoading.value = true
  currentHistoryCode.value = item.kode_tiket

  try {
    const { data, error } = await supabase.from('history_edit')
      .select('*')
      .eq('nama_modul', 'MASTER_TIKET')
      .eq('data_id', item.kode_tiket)
      .order('edited_at', { ascending: false })
    
    if (error) throw error
    historyData.value = data || []
  } catch (err: any) {
    AppAlert.error('Gagal', err.message || 'Gagal menarik histori')
  } finally {
    historyLoading.value = false
  }
}

const closeHistoryModal = () => {
  isHistoryModalOpen.value = false
  historyData.value = []
}

const saveData = async () => {
  if (!isFormValid.value) return
  AppAlert.loading('Menyimpan Master Tiket...')
  try {
    const currentUsername = currentUser.value?.nama || currentUser.value?.user_id || 'System'
    const now = new Date()
    
    const payload = {
      kode_tiket: form.value.kode_tiket,
      nama_segmen: form.value.nama_segmen,
      master_piutang_id: form.value.master_piutang_id,
      master_hutang_id: form.value.master_hutang_id,
      coa_piutang: form.value.coa_piutang,
      coa_hutang: form.value.coa_hutang,
      harga_satuan: Number(form.value.harga_satuan),
      keterangan: form.value.keterangan
    }

    if (isEdit.value) {
        // AMBIL DATA LAMA UNTUK LOG HISTORY
        const oldRecord = tiketList.value.find(t => t.id === currentEditId.value)

        // Cari string nama platform dan nama eo untuk data baru agar rapi di history
        const mp = masterPiutangs.value.find(m => m.id === form.value.master_piutang_id)
        const mh = masterHutangs.value.find(m => m.id === form.value.master_hutang_id)

        const dataBaruLog = {
            ...payload,
            nama_platform: mp?.pihak_lawan?.nama || '-',
            nama_eo: mh?.pihak_lawan?.nama || '-'
        }
        
        // UPDATE DATA MASTER
        const { error: errUpdate } = await supabase.from('master_tiket').update(payload).eq('id', currentEditId.value)
        if (errUpdate) throw errUpdate
        
        // INSERT KE HISTORY EDIT
        await supabase.from('history_edit').insert([{
            nama_modul: 'MASTER_TIKET',
            data_id: form.value.kode_tiket,
            data_lama: oldRecord,
            data_baru: dataBaruLog, // Simpan payload yang sudah di-inject nama relasi
            alasan: alasanEdit.value,
            edited_by: currentUsername,
            edited_at: now.toISOString()
        }])
        
        AppAlert.success('Tersimpan!', 'Perubahan Master Tiket berhasil disimpan dan dicatat.')
    } else {
        // CREATE BARU
        const finalPayload = { ...payload, created_by: currentUsername, created_at: now.toISOString() }
        const { error } = await supabase.from('master_tiket').insert([finalPayload])
        if (error) throw error
        AppAlert.success('Sukses!', 'Master tiket baru berhasil didaftarkan.')
    }

    closeModal(); await fetchData()
  } catch (err) { AppAlert.error('Gagal Menyimpan', err) }
}

const deleteData = async (id: string, nama: string) => {
  if (!canDelete.value) return
  const result = await Swal.fire({
    title: 'Hapus Tiket?', 
    html: `Hapus Master Tiket <b>${nama}</b>?<br><small class="text-danger">Akan ditolak jika tiket ini sudah memiliki histori rekapitulasi.</small>`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444'
  })
  if (result.isConfirmed) {
    AppAlert.loading('Menghapus...')
    try {
      const { error } = await supabase.from('master_tiket').delete().eq('id', id)
      if (error) throw error
      AppAlert.success('Dihapus!', 'Data berhasil dihapus.'); await fetchData()
    } catch (err: any) { AppAlert.error('Gagal', err.message || err) }
  }
}
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.dropdown-container { z-index: 1056; }
.custom-dropdown-menu { max-height: 250px; overflow-y: auto; z-index: 1060; }
.table-visible-overflow { overflow: visible !important; }
.custom-modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
  background-color: rgba(15, 23, 42, 0.6); display: flex; 
  align-items: center; justify-content: center; z-index: 1050; 
}
.custom-modal-card { max-height: 95vh; display: flex; flex-direction: column; }
.modal-body-scroll { flex: 1 1 auto; overflow-y: auto; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
.timeline { position: relative; }
</style>