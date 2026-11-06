<template>
  <div class="master-reseller">
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Master Reseller / Agen</h4>
          <p class="text-muted small mb-0">Manajemen jalur distribusi tiket, penentuan Akun Piutang (Hak Pendapatan), dan alokasi tiket.</p>
        </div>
        <button v-if="canCreate" class="btn btn-primary fw-bold px-4 shadow-sm rounded-0" @click="openAddModal">
          <i class="bi bi-plus-lg me-2"></i> Tambah Reseller
        </button>
      </div>

      <!-- FILTER & PENCARIAN -->
      <div class="d-flex mb-3 gap-2 align-items-center">
        <select class="form-select form-select-sm w-auto rounded-0 border-secondary" v-model="searchColumn">
          <option value="semua">Semua Kolom</option>
          <option value="kode_reseller">Kode Reseller</option>
          <option value="nama_reseller">Nama Reseller</option>
          <option value="nama_pihak">Pihak Master Piutang</option>
        </select>
        <div class="input-group input-group-sm w-25">
          <span class="input-group-text rounded-0 bg-white border-secondary"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control rounded-0 border-start-0 border-secondary ps-0" v-model="searchTableQuery" placeholder="Cari reseller...">
        </div>
      </div>

      <!-- TABEL DATA -->
      <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden">
        <div class="table-responsive" style="min-height: 440px;">
          <table class="table table-sm table-striped table-hover table-bordered align-middle mb-0" style="font-size: 0.85rem;">
            <thead class="table-dark text-center align-middle">
              <tr>
                <th width="5%" class="py-3">No</th>
                <th width="15%" class="py-3 cursor-pointer" @click="handleSort('kode_reseller')">
                  Kode Reseller <i class="bi ms-1" :class="sortColumn==='kode_reseller' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="20%" class="py-3 cursor-pointer" @click="handleSort('nama_reseller')">
                  Nama Reseller / Agen <i class="bi ms-1" :class="sortColumn==='nama_reseller' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="25%" class="py-3 cursor-pointer" @click="handleSort('nama_pihak')">
                  Akun & Pihak Piutang <i class="bi ms-1" :class="sortColumn==='nama_pihak' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="25%" class="py-3">
                  Akses Jualan Tiket (Segmen)
                </th>
                <th width="10%" class="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedData.length === 0">
                <td colspan="6" class="text-center text-muted py-5">
                  <i class="bi bi-shop fs-2 d-block mb-2"></i> Belum ada reseller tiket yang didaftarkan.
                </td>
              </tr>
              <tr v-for="(item, index) in paginatedData" :key="item.id">
                <td class="text-center text-muted">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td class="fw-bold text-center text-dark">{{ item.kode_reseller }}</td>
                <td class="fw-bold text-success">{{ item.nama_reseller }}</td>
                <td>
                  <div class="fw-bold text-primary text-uppercase">{{ item.nama_pihak }}</div>
                  <div class="small text-muted mt-1"><span class="fw-bold text-dark">COA (D):</span> {{ item.coa_piutang }}</div>
                </td>
                <td class="text-center">
                  <span v-if="!item.tikets || item.tikets.length === 0" class="badge bg-secondary opacity-50 rounded-0">Belum ada alokasi tiket</span>
                  <div v-else class="d-flex flex-wrap justify-content-center gap-1">
                    <span class="badge bg-primary rounded-0" v-for="(t, i) in item.tikets" :key="i">
                      {{ t.master_tiket.nama_segmen }}
                    </span>
                  </div>
                </td>
                <td class="text-center text-nowrap">
                  <button v-if="canEdit" class="btn btn-sm btn-light text-warning border me-1 rounded-0" @click="openEditModal(item)" title="Edit Reseller">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button v-if="canDelete" class="btn btn-sm btn-light text-danger border rounded-0" @click="deleteData(item.id, item.nama_reseller)" title="Hapus Reseller">
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
          <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-shop text-success me-2"></i> {{ isEdit ? 'Edit Data Reseller' : 'Pendaftaran Reseller Baru' }}</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="card-body p-4 modal-body-scroll custom-scrollbar bg-light bg-opacity-50">
          <div class="bg-white p-3 rounded-0 border shadow-sm mb-4">
            <h6 class="fw-bold mb-3 border-bottom pb-2">1. Identitas Reseller / Agen</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label small fw-bold">Kode Reseller</label>
                <input type="text" class="form-control fw-bold bg-light rounded-0" v-model="form.kode_reseller" readonly>
              </div>
              <div class="col-md-8">
                <label class="form-label small fw-bold">Nama Reseller / Agen <span class="text-danger">*</span></label>
                <input type="text" class="form-control rounded-0" v-model="form.nama_reseller" placeholder="Cth: BEM FH, Lynk.id, Kios X...">
              </div>
              <div class="col-md-12">
                <label class="form-label small fw-bold">Keterangan Tambahan</label>
                <input type="text" class="form-control rounded-0" v-model="form.keterangan" placeholder="Keterangan internal...">
              </div>
            </div>
          </div>

          <div class="row g-4">
            <div class="col-md-6">
              <div class="bg-white p-3 rounded-0 border border-primary shadow-sm h-100">
                <h6 class="fw-bold text-primary mb-3 border-bottom border-primary pb-2"><i class="bi bi-wallet2 me-2"></i>2. Pengakuan Hak (Piutang)</h6>
                
                <label class="form-label small fw-bold text-primary">Master Pihak Lawan (Piutang) <span class="text-danger">*</span></label>
                <select class="form-select border-primary rounded-0 mb-3" v-model="form.master_piutang_id">
                  <option value="" disabled>-- Pilih Master Piutang (Pihak Penagihan) --</option>
                  <option v-for="mp in masterPiutangs" :key="mp.id" :value="mp.id">{{ mp.pihak_lawan?.nama }}</option>
                </select>

                <label class="form-label small fw-bold text-muted">Akun Penampung Piutang (DEBET) <span class="text-danger">*</span></label>
                <div class="position-relative dropdown-container">
                  <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0" @click="toggleDropdown('coa_piutang')">
                    <span class="text-truncate" :class="{'text-muted': !form.coa_piutang}">{{ getCoaLabel(form.coa_piutang) || 'Pilih COA Piutang...' }}</span>
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
                <small class="text-muted fst-italic mt-2 d-block" style="font-size: 0.7rem;">Uang yang ada di reseller ini akan dianggap sebagai "Piutang" sampai mereka menyetorkannya ke Kas/Bank Anda.</small>
              </div>
            </div>

            <!-- TWO-WAY EDIT: PILIH TIKET -->
            <div class="col-md-6">
               <div class="bg-white p-3 rounded-0 border border-success shadow-sm h-100">
                <h6 class="fw-bold text-success mb-3 border-bottom border-success pb-2"><i class="bi bi-tags me-2"></i>3. Hak Akses Jualan Tiket</h6>
                
                <label class="form-label small fw-bold text-success">Tiket yang boleh dijual oleh reseller ini:</label>
                <div class="border rounded-0 p-2 overflow-auto custom-scrollbar" style="max-height: 160px; background-color: #f8fafc;">
                  <div v-if="listTikets.length === 0" class="text-muted small fst-italic text-center py-3">
                    Belum ada Master Tiket yang didaftarkan.
                  </div>
                  <div v-for="tiket in listTikets" :key="tiket.id" class="form-check mb-2">
                    <input class="form-check-input border-success cursor-pointer" type="checkbox" :value="tiket.id" :id="'tkt-'+tiket.id" v-model="form.selected_tikets">
                    <label class="form-check-label w-100 cursor-pointer text-dark small" :for="'tkt-'+tiket.id">
                      <strong>{{ tiket.nama_segmen }}</strong> 
                      <span class="text-muted ms-1">({{ tiket.kode_tiket }})</span>
                    </label>
                  </div>
                </div>
                <small class="text-muted fst-italic mt-2 d-block" style="font-size: 0.7rem;">Daftar ini digunakan untuk membatasi tiket apa saja yang muncul saat Anda membuat Rekap Tiket untuk reseller ini.</small>
              </div>
            </div>
          </div>

        </div>

        <div class="card-footer bg-white border-top text-end py-3 px-4 flex-shrink-0" style="z-index: 1040;">
          <button class="btn btn-light border fw-bold px-4 me-2 rounded-0" @click="closeModal">Batal</button>
          <button class="btn btn-primary fw-bold px-4 rounded-0" @click="saveData" :disabled="!isFormValid">
            <i class="bi" :class="isEdit ? 'bi-save' : 'bi-check-lg'"></i> {{ isEdit ? 'Simpan Perubahan' : 'Simpan Reseller Baru' }}
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

const resellerList = ref<any[]>([])
const masterPiutangs = ref<any[]>([])
const listTikets = ref<any[]>([])
const listCOA = ref<any[]>([])

const isModalOpen = ref(false)
const currentUser = ref<any>(null)
const activeDropdown = ref<string | null>(null)
const searchQuery = ref('') 

// EDIT STATE
const isEdit = ref(false)
const currentEditId = ref('')

const form = ref<any>({
  kode_reseller: '', nama_reseller: '', master_piutang_id: '',
  coa_piutang: '', keterangan: '', selected_tikets: []
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
  if (!searchTableQuery.value) return resellerList.value
  const q = searchTableQuery.value.toLowerCase()
  return resellerList.value.filter(item => {
    if (searchColumn.value === 'semua') {
      return (item.kode_reseller?.toLowerCase().includes(q) ||
              item.nama_reseller?.toLowerCase().includes(q) ||
              item.nama_pihak?.toLowerCase().includes(q))
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

const generateKodeReseller = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let uniqCode = ''
  for (let i = 0; i < 5; i++) uniqCode += chars.charAt(Math.floor(Math.random() * chars.length))
  return `RS-${uniqCode}`
}

const isFormValid = computed(() => {
  return form.value.nama_reseller && form.value.master_piutang_id && form.value.coa_piutang
})

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

const fetchDropdowns = async () => {
  try {
    // Ambil Master Piutang
    const { data: mpData } = await supabase.from('master_piutang').select('id, nomor_perjanjian, pihak_lawan(id, nama)')
    masterPiutangs.value = mpData || []
    
    // Ambil Data Tiket (Bisa jadi kosong jika belum ada yg dibuat)
    const { data: tktData } = await supabase.from('master_tiket').select('id, kode_tiket, nama_segmen')
    listTikets.value = tktData || []

    // Ambil COA sifat = 'D' (Detail saja)
    const { data: coaData } = await supabase.from('coas').select('*').eq('sifat', 'D').order('coa_code', { ascending: true })
    listCOA.value = coaData || []
  } catch (err) {
    console.error(err)
  }
}

const fetchData = async () => {
  AppAlert.loading('Memuat data reseller...')
  try {
    const { data, error } = await supabase.from('master_reseller')
      .select(`
        *, 
        master_piutang(pihak_lawan(nama)),
        tikets:relasi_tiket_reseller(master_tiket(id, nama_segmen))
      `)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    resellerList.value = data.map((d: any) => ({ 
      ...d, 
      nama_pihak: d.master_piutang?.pihak_lawan?.nama || '-'
    }))
    AppAlert.close()
  } catch (err) { AppAlert.error('Gagal memuat data', err) }
}

const openAddModal = () => {
  if (!canCreate.value) return
  isEdit.value = false
  currentEditId.value = ''
  
  form.value = { 
    kode_reseller: generateKodeReseller(), nama_reseller: '', master_piutang_id: '',
    coa_piutang: '', keterangan: '', selected_tikets: []
  }; 
  isModalOpen.value = true
}

const openEditModal = (item: any) => {
  if (!canEdit.value) return
  isEdit.value = true
  currentEditId.value = item.id
  
  // Mapping tiket yg sudah terhubung dari Junction Table
  const tkts = item.tikets ? item.tikets.map((t:any) => t.master_tiket?.id).filter(Boolean) : []

  form.value = {
    kode_reseller: item.kode_reseller,
    nama_reseller: item.nama_reseller,
    master_piutang_id: item.master_piutang_id,
    coa_piutang: item.coa_piutang,
    keterangan: item.keterangan || '',
    selected_tikets: tkts
  }
  isModalOpen.value = true
}

const closeModal = () => { isModalOpen.value = false; closeAllDropdowns() }

const saveData = async () => {
  if (!isFormValid.value) return
  AppAlert.loading('Menyimpan Reseller...')
  try {
    const currentUsername = currentUser.value?.nama || currentUser.value?.user_id || 'System'
    const now = new Date()
    
    const payloadReseller = {
      kode_reseller: form.value.kode_reseller,
      nama_reseller: form.value.nama_reseller,
      master_piutang_id: form.value.master_piutang_id,
      coa_piutang: form.value.coa_piutang,
      keterangan: form.value.keterangan
    }

    let resellerIdToRelate = currentEditId.value

    if (isEdit.value) {
        // UPDATE DATA MASTER
        const { error: errUpdate } = await supabase.from('master_reseller').update(payloadReseller).eq('id', currentEditId.value)
        if (errUpdate) throw errUpdate
    } else {
        // CREATE BARU
        const finalPayload = { ...payloadReseller, created_by: currentUsername, created_at: now.toISOString() }
        const { data: newReseller, error } = await supabase.from('master_reseller').insert([finalPayload]).select('id').single()
        if (error) throw error
        resellerIdToRelate = newReseller.id
    }

    // MANAGE RELASI TIKET (TWO-WAY BINDING)
    // 1. Hapus semua relasi tiket untuk reseller ini (biar bersih sebelum update)
    await supabase.from('relasi_tiket_reseller').delete().eq('master_reseller_id', resellerIdToRelate)

    // 2. Insert relasi baru sesuai pilihan checkbox tiket
    if (form.value.selected_tikets && form.value.selected_tikets.length > 0) {
        const relasiPayload = form.value.selected_tikets.map((tktId: string) => ({
            master_tiket_id: tktId,
            master_reseller_id: resellerIdToRelate
        }))
        const { error: errRelasi } = await supabase.from('relasi_tiket_reseller').insert(relasiPayload)
        if (errRelasi) throw errRelasi
    }

    AppAlert.success('Tersimpan!', 'Master Reseller dan hak akses tiketnya berhasil diamankan.')
    closeModal(); await fetchData()
  } catch (err) { AppAlert.error('Gagal Menyimpan', err) }
}

const deleteData = async (id: string, nama: string) => {
  if (!canDelete.value) return
  const result = await Swal.fire({
    title: 'Hapus Reseller?', 
    html: `Hapus Reseller <b>${nama}</b>?<br><small class="text-danger">Akan menghapus juga hak aksesnya pada distribusi tiket.</small>`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444'
  })
  if (result.isConfirmed) {
    AppAlert.loading('Menghapus...')
    try {
      const { error } = await supabase.from('master_reseller').delete().eq('id', id)
      if (error) throw error
      AppAlert.success('Dihapus!', 'Data reseller berhasil dihapus.'); await fetchData()
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