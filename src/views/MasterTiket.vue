<template>
  <div class="master-tiket">
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Master Tiket / Segmen</h4>
          <p class="text-muted small mb-0">Katalog tiket acara, penentuan Hak Event (Hutang EO), dan mapping ke Reseller.</p>
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
                <th width="22%" class="py-3 cursor-pointer" @click="handleSort('nama_segmen')">
                  Nama Segmen / Kelas <i class="bi ms-1" :class="sortColumn==='nama_segmen' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="20%" class="py-3 cursor-pointer" @click="handleSort('nama_eo')">
                  Event / Hak EO (Hutang) <i class="bi ms-1" :class="sortColumn==='nama_eo' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="20%" class="py-3">
                  Distribusi Reseller
                </th>
                <th width="10%" class="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedData.length === 0">
                <td colspan="6" class="text-center text-muted py-5">
                  <i class="bi bi-tags fs-2 d-block mb-2"></i> Belum ada master tiket yang didaftarkan.
                </td>
              </tr>
              <tr v-for="(item, index) in paginatedData" :key="item.id">
                <td class="text-center text-muted">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td class="fw-bold text-center text-dark">{{ item.kode_tiket }}</td>
                <td>
                  <div class="fw-bold text-primary">{{ item.nama_segmen }}</div>
                  <div class="small text-muted">Harga: Rp {{ formatNominal(item.harga_satuan) }}</div>
                </td>
                <td>
                  <div class="fw-bold text-danger text-uppercase">{{ item.nama_eo }}</div>
                  <div class="small text-muted mt-1"><span class="fw-bold text-dark">COA (K):</span> {{ item.coa_hutang }}</div>
                </td>
                <td class="text-center">
                  <span v-if="!item.resellers || item.resellers.length === 0" class="badge bg-secondary opacity-50 rounded-0">Belum didistribusikan</span>
                  <div v-else>
                    <span class="badge bg-success rounded-0 mb-1 me-1" v-for="(r, i) in item.resellers" :key="i">
                      {{ r.master_reseller.nama_reseller }}
                    </span>
                  </div>
                </td>
                <td class="text-center text-nowrap">
                  <button v-if="canEdit" class="btn btn-sm btn-light text-warning border me-1 rounded-0" @click="openEditModal(item)" title="Edit Master Tiket">
                    <i class="bi bi-pencil-square"></i>
                  </button>
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

    <!-- MODAL FORM INPUT & EDIT -->
    <div v-if="isModalOpen" class="custom-modal-overlay">
      <div v-if="activeDropdown" class="position-fixed top-0 start-0 w-100 h-100 overlay-dropdown" @click="closeAllDropdowns"></div>
      <div class="custom-modal-card card border-0 shadow-lg rounded-0 overflow-hidden" style="max-width: 900px; width: 95%; z-index: 1050;">
        <div class="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center flex-shrink-0">
          <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-tags text-primary me-2"></i> {{ isEdit ? 'Edit Master Tiket' : 'Form Master Tiket Baru' }}</h5>
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
                <label class="form-label small fw-bold">Harga Satuan (Kotor)</label>
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

          <div class="row g-4">
            <div class="col-md-6">
              <div class="bg-white p-3 rounded-0 border border-danger shadow-sm h-100">
                <h6 class="fw-bold text-danger mb-3 border-bottom border-danger pb-2"><i class="bi bi-bank me-2"></i>2. Pengakuan Hak EO (Hutang)</h6>
                
                <label class="form-label small fw-bold text-danger">Pemilik Event / EO <span class="text-danger">*</span></label>
                <select class="form-select border-danger rounded-0 mb-3" v-model="form.master_hutang_id">
                  <option value="" disabled>-- Pilih Master Hutang (EO) --</option>
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
                <small class="text-muted fst-italic mt-2 d-block" style="font-size: 0.7rem;">Pendapatan dari tiket ini akan dicatat sebagai Hutang (Kewajiban) kepada EO yang dipilih.</small>
              </div>
            </div>

            <!-- TWO-WAY EDIT: PILIH RESELLER -->
            <div class="col-md-6">
               <div class="bg-white p-3 rounded-0 border border-success shadow-sm h-100">
                <h6 class="fw-bold text-success mb-3 border-bottom border-success pb-2"><i class="bi bi-share me-2"></i>3. Distribusi Reseller</h6>
                
                <label class="form-label small fw-bold text-success">Izinkan tiket ini dijual oleh:</label>
                <div class="border rounded-0 p-2 overflow-auto custom-scrollbar" style="max-height: 160px; background-color: #f8fafc;">
                  <div v-if="listResellers.length === 0" class="text-muted small fst-italic text-center py-3">
                    Belum ada Master Reseller yang didaftarkan.
                  </div>
                  <div v-for="reseller in listResellers" :key="reseller.id" class="form-check mb-2">
                    <input class="form-check-input border-success cursor-pointer" type="checkbox" :value="reseller.id" :id="'res-'+reseller.id" v-model="form.selected_resellers">
                    <label class="form-check-label w-100 cursor-pointer text-dark small" :for="'res-'+reseller.id">
                      <strong>{{ reseller.nama_reseller }}</strong>
                    </label>
                  </div>
                </div>
                <small class="text-muted fst-italic mt-2 d-block" style="font-size: 0.7rem;">Anda bisa melewati bagian ini dan mengaturnya nanti di menu Master Reseller.</small>
              </div>
            </div>
          </div>

        </div>

        <div class="card-footer bg-white border-top text-end py-3 px-4 flex-shrink-0" style="z-index: 1040;">
          <button class="btn btn-light border fw-bold px-4 me-2 rounded-0" @click="closeModal">Batal</button>
          <button class="btn btn-primary fw-bold px-4 rounded-0" @click="saveData" :disabled="!isFormValid">
            <i class="bi" :class="isEdit ? 'bi-save' : 'bi-check-lg'"></i> {{ isEdit ? 'Simpan Perubahan' : 'Simpan Tiket & Distribusi' }}
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
const masterHutangs = ref<any[]>([])
const listResellers = ref<any[]>([])
const listCOA = ref<any[]>([])

const isModalOpen = ref(false)
const currentUser = ref<any>(null)
const activeDropdown = ref<string | null>(null)
const searchQuery = ref('') 

// EDIT STATE
const isEdit = ref(false)
const currentEditId = ref('')

const form = ref<any>({
  kode_tiket: '', nama_segmen: '', master_hutang_id: '',
  coa_hutang: '', harga_satuan: 0, keterangan: '',
  selected_resellers: [] // Berisi array ID Reseller
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
              item.nama_eo?.toLowerCase().includes(q))
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
  return form.value.nama_segmen && form.value.master_hutang_id && form.value.coa_hutang
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

const formatNominal = (angka: number) => { if (angka === undefined || angka === null) return '0'; return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka) }
const parseRupiah = (val: string) => { if (!val) return 0; const parsed = Number(val.replace(/[^0-9]/g, '')); return isNaN(parsed) ? 0 : parsed }
const formatInputRupiah = (val: number | string) => { if (!val || val === 0 || val === '0') return ''; return new Intl.NumberFormat('id-ID').format(Number(val)) }

const fetchDropdowns = async () => {
  try {
    const { data: mhData } = await supabase.from('master_hutang').select('id, nomor_perjanjian, pihak_lawan(id, nama)')
    masterHutangs.value = mhData || []
    
    // Ambil Data Reseller
    const { data: resData } = await supabase.from('master_reseller').select('id, nama_reseller')
    listResellers.value = resData || []

    // PERBAIKAN: Filter ke sifat 'D' (Detail) agar akun Header tidak ikut muncul
    const { data: coaData } = await supabase.from('coas').select('*').eq('sifat', 'D').order('coa_code', { ascending: true })
    listCOA.value = coaData || []
  } catch (err) {
    console.error(err)
  }
}

const fetchData = async () => {
  AppAlert.loading('Memuat data tiket...')
  try {
    const { data, error } = await supabase.from('master_tiket')
      .select(`
        *, 
        master_hutang(pihak_lawan(nama)),
        resellers:relasi_tiket_reseller(master_reseller(id, nama_reseller))
      `)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    tiketList.value = data.map((d: any) => ({ 
      ...d, 
      nama_eo: d.master_hutang?.pihak_lawan?.nama || '-'
    }))
    AppAlert.close()
  } catch (err) { AppAlert.error('Gagal memuat data', err) }
}

const openAddModal = () => {
  if (!canCreate.value) return
  isEdit.value = false
  currentEditId.value = ''
  
  form.value = { 
    kode_tiket: generateKodeTiket(), nama_segmen: '', master_hutang_id: '',
    coa_hutang: '', harga_satuan: 0, keterangan: '', selected_resellers: []
  }; 
  isModalOpen.value = true
}

const openEditModal = (item: any) => {
  if (!canEdit.value) return
  isEdit.value = true
  currentEditId.value = item.id
  
  // Mapping reseller yg sudah terhubung
  const rslr = item.resellers ? item.resellers.map((r:any) => r.master_reseller?.id).filter(Boolean) : []

  form.value = {
    kode_tiket: item.kode_tiket,
    nama_segmen: item.nama_segmen,
    master_hutang_id: item.master_hutang_id,
    coa_hutang: item.coa_hutang,
    harga_satuan: item.harga_satuan,
    keterangan: item.keterangan || '',
    selected_resellers: rslr
  }
  isModalOpen.value = true
}

const closeModal = () => { isModalOpen.value = false; closeAllDropdowns() }

const saveData = async () => {
  if (!isFormValid.value) return
  AppAlert.loading('Menyimpan Master Tiket...')
  try {
    const currentUsername = currentUser.value?.nama || currentUser.value?.user_id || 'System'
    const now = new Date()
    
    const payloadTiket = {
      kode_tiket: form.value.kode_tiket,
      nama_segmen: form.value.nama_segmen,
      master_hutang_id: form.value.master_hutang_id,
      coa_hutang: form.value.coa_hutang,
      harga_satuan: Number(form.value.harga_satuan),
      keterangan: form.value.keterangan
    }

    let tiketIdToRelate = currentEditId.value

    if (isEdit.value) {
        // UPDATE DATA MASTER
        const { error: errUpdate } = await supabase.from('master_tiket').update(payloadTiket).eq('id', currentEditId.value)
        if (errUpdate) throw errUpdate
    } else {
        // CREATE BARU
        const finalPayload = { ...payloadTiket, created_by: currentUsername, created_at: now.toISOString() }
        const { data: newTicket, error } = await supabase.from('master_tiket').insert([finalPayload]).select('id').single()
        if (error) throw error
        tiketIdToRelate = newTicket.id
    }

    // MANAGE RELASI (TWO-WAY BINDING)
    // 1. Hapus semua relasi reseller untuk tiket ini (biar bersih)
    await supabase.from('relasi_tiket_reseller').delete().eq('master_tiket_id', tiketIdToRelate)

    // 2. Insert relasi baru sesuai pilihan checkbox
    if (form.value.selected_resellers && form.value.selected_resellers.length > 0) {
        const relasiPayload = form.value.selected_resellers.map((resId: string) => ({
            master_tiket_id: tiketIdToRelate,
            master_reseller_id: resId
        }))
        const { error: errRelasi } = await supabase.from('relasi_tiket_reseller').insert(relasiPayload)
        if (errRelasi) throw errRelasi
    }

    AppAlert.success('Tersimpan!', 'Master Tiket dan distribusinya berhasil disimpan.')
    closeModal(); await fetchData()
  } catch (err) { AppAlert.error('Gagal Menyimpan', err) }
}

const deleteData = async (id: string, nama: string) => {
  if (!canDelete.value) return
  const result = await Swal.fire({
    title: 'Hapus Tiket?', 
    html: `Hapus Master Tiket <b>${nama}</b>?<br><small class="text-danger">Akan menghapus juga distribusinya di Reseller.</small>`,
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
</style>