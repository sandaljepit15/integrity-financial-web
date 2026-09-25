<template>
  <div class="laporan-rekap-piutang">
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Laporan Rekapitulasi Piutang</h4>
          <p class="text-muted small mb-0">Ringkasan saldo awal, penambahan, dan pelunasan piutang per klien/platform.</p>
        </div>
        <div>
          <button v-if="isFilterApplied" class="btn btn-warning fw-bold px-3 me-2 rounded-0 shadow-sm" @click="unlockFilters">
            <i class="bi bi-unlock-fill"></i> Buka Kunci Filter
          </button>
          <button class="btn btn-primary fw-bold px-4 rounded-0 shadow-sm" @click="fetchData" :disabled="isFilterApplied">
            <i class="bi bi-funnel-fill me-2"></i> Tarik Laporan
          </button>
        </div>
      </div>

      <!-- KOTAK FILTER -->
      <div class="card border border-secondary shadow-sm rounded-0 mb-4" :class="isFilterApplied ? 'bg-secondary bg-opacity-10' : 'bg-light bg-opacity-50'">
        <div class="card-body p-3 position-relative">
          <div v-if="isFilterApplied" class="position-absolute top-0 end-0 mt-2 me-3"><span class="badge bg-success shadow-sm"><i class="bi bi-lock-fill me-1"></i> Terkunci</span></div>
          <div class="row g-3 align-items-end">
            <div class="col-md-5">
              <label class="form-label small fw-bold text-dark mb-1">Periode Laporan <span class="text-danger">*</span></label>
              <div class="input-group input-group-sm">
                <input type="date" class="form-control rounded-0 border-secondary fw-bold" v-model="filters.startDate" :disabled="isFilterApplied">
                <span class="input-group-text border-secondary bg-white">s/d</span>
                <input type="date" class="form-control rounded-0 border-secondary fw-bold" v-model="filters.endDate" :disabled="isFilterApplied">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FILTER KLIEN TERTAMPIL -->
      <div class="d-flex mb-3 align-items-center" v-if="reportData.length > 0">
        <div class="input-group input-group-sm w-25">
          <span class="input-group-text rounded-0 bg-white border-secondary"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control rounded-0 border-start-0 border-secondary ps-0" v-model="searchTableQuery" placeholder="Cari nama pihak piutang...">
        </div>
      </div>

      <!-- TABEL DATA -->
      <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden mb-3">
        <div class="card-header bg-dark text-white p-2 px-3 d-flex justify-content-between align-items-center rounded-0">
          <div class="fw-bold" style="font-size: 0.9rem;"><i class="bi bi-journal-arrow-down me-2"></i>Rekapitulasi Saldo Piutang (Tagihan)</div>
          <div>
            <button class="btn btn-sm btn-success fw-bold rounded-0 py-0 me-2" @click="exportToExcel" :disabled="filteredReportData.length === 0">
              <i class="bi bi-file-earmark-excel me-1"></i> Export Excel
            </button>
            <button class="btn btn-sm btn-light fw-bold rounded-0 py-0" @click="printLaporan" :disabled="filteredReportData.length === 0">
              <i class="bi bi-printer me-1"></i> Cetak Laporan
            </button>
          </div>
        </div>
        <div class="table-responsive" style="max-height: 60vh;">
          <table class="table table-sm table-hover table-bordered align-middle mb-0" style="font-size: 0.85rem;">
            <thead class="table-secondary text-center align-middle sticky-top">
              <tr>
                <th width="5%" class="py-2">No</th>
                <th width="25%" class="py-2">Pihak Piutang (Debitur)</th>
                <th width="17%" class="py-2">Saldo Awal</th>
                <th width="17%" class="py-2 text-primary">Piutang Baru (+)</th>
                <th width="17%" class="py-2 text-success">Pelunasan Masuk (-)</th>
                <th width="19%" class="py-2">Saldo Akhir</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading"><td colspan="6" class="text-center py-5"><div class="spinner-border spinner-border-sm me-2"></div> Menghitung agregasi...</td></tr>
              <tr v-else-if="reportData.length === 0"><td colspan="6" class="text-center py-5 text-muted fst-italic">Silakan atur periode dan klik "Tarik Laporan" untuk memuat data.</td></tr>
              <tr v-else-if="filteredReportData.length === 0"><td colspan="6" class="text-center py-5 text-muted fst-italic">Tidak ada entitas yang cocok dengan pencarian Anda.</td></tr>
              
              <tr v-for="(item, index) in filteredReportData" :key="item.id" :class="{'bg-light': index % 2 !== 0}">
                <td class="text-center text-muted">{{ index + 1 }}</td>
                <td class="fw-bold text-dark">{{ item.nama }}</td>
                <td class="text-end fw-bold text-muted">Rp {{ formatNominal(item.awal) }}</td>
                <td class="text-end fw-bold text-primary">Rp {{ formatNominal(item.tambah) }}</td>
                <td class="text-end fw-bold text-success">Rp {{ formatNominal(item.kurang) }}</td>
                <td class="text-end fw-bold text-danger bg-light bg-opacity-50">Rp {{ formatNominal(item.akhir) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="!isLoading && filteredReportData.length > 0" class="table-dark fw-bold">
              <tr>
                <td colspan="2" class="text-end py-2 pe-3 text-uppercase">TOTAL KESELURUHAN :</td>
                <td class="text-end py-2 text-white">Rp {{ formatNominal(totals.awal) }}</td>
                <td class="text-end py-2 text-primary">Rp {{ formatNominal(totals.tambah) }}</td>
                <td class="text-end py-2 text-success">Rp {{ formatNominal(totals.kurang) }}</td>
                <td class="text-end py-2 text-warning fs-6">Rp {{ formatNominal(totals.akhir) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- AREA CETAK KHUSUS LAPORAN PDF -->
    <div id="print-area" v-if="filteredReportData.length > 0">
      <div class="print-container">
        <!-- HEADER KOP SURAT -->
        <table class="w-100 table-print border-0 mb-4">
          <tr>
            <td width="70%" class="p-0 border-0 align-middle">
              <div class="d-flex align-items-center">
                <img v-if="company.logo_url" :src="company.logo_url" alt="Logo" style="max-height: 55px; margin-right: 15px;">
                <div>
                  <h4 class="mb-0 fw-bold text-dark text-uppercase" style="font-size: 12pt; letter-spacing: 1px;">{{ company.nama || 'NAMA INSTANSI' }}</h4>
                  <div v-if="company.sub_nama" style="font-size: 10pt; font-weight: bold; margin-bottom: 2px;">{{ company.sub_nama }}</div>
                  <div style="font-size: 9pt; margin-bottom: 2px;">{{ company.alamat || 'Alamat Instansi' }}</div>
                </div>
              </div>
            </td>
            <td width="30%" class="text-end border-0 align-bottom pb-1">
              <h4 class="mb-0 fw-bold text-dark text-uppercase" style="font-size: 14pt; border-bottom: 2px solid black; display: inline-block;">
                REKAPITULASI PIUTANG
              </h4>
            </td>
          </tr>
        </table>

        <!-- PARAMETER FILTER YANG DIPAKAI -->
        <div class="mb-3 p-2 border border-dark text-dark" style="font-size: 9pt;">
           <div class="fw-bold mb-1 border-bottom border-dark pb-1 text-uppercase">Parameter Laporan:</div>
           <div class="row g-1 mt-1">
             <div class="col-12"><strong>Periode:</strong> {{ formatDateStr(filters.startDate) }} s/d {{ formatDateStr(filters.endDate) }}</div>
             <div class="col-12" v-if="searchTableQuery"><strong>Pencarian:</strong> "{{ searchTableQuery }}"</div>
           </div>
        </div>

        <table class="w-100 table-print table-bordered border-dark text-dark mb-4">
          <thead class="text-center fw-bold bg-light" style="font-size: 9pt;">
            <tr>
              <th width="5%" class="p-1">No</th>
              <th width="25%" class="p-1">Pihak Piutang (Debitur)</th>
              <th width="17%" class="p-1">Saldo Awal</th>
              <th width="17%" class="p-1">Piutang Baru (+)</th>
              <th width="17%" class="p-1">Pelunasan (-)</th>
              <th width="19%" class="p-1">Saldo Akhir</th>
            </tr>
          </thead>
          <tbody style="font-size: 8.5pt;">
            <tr v-for="(item, idx) in filteredReportData" :key="idx">
              <td class="text-center p-1">{{ idx + 1 }}</td>
              <td class="p-1 fw-bold">{{ item.nama }}</td>
              <td class="p-1 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(item.awal) }}</span></div></td>
              <td class="p-1 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(item.tambah) }}</span></div></td>
              <td class="p-1 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(item.kurang) }}</span></div></td>
              <td class="p-1 text-end fw-bold"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(item.akhir) }}</span></div></td>
            </tr>
            <tr class="fw-bold bg-light" style="font-size: 9.5pt;">
              <td colspan="2" class="text-end p-2 pe-3 text-uppercase">TOTAL KESELURUHAN :</td>
              <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(totals.awal) }}</span></div></td>
              <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(totals.tambah) }}</span></div></td>
              <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(totals.kurang) }}</span></div></td>
              <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(totals.akhir) }}</span></div></td>
            </tr>
          </tbody>
        </table>

        <!-- FOOTER TANDA TANGAN -->
        <div class="d-flex justify-content-between align-items-end mt-5 text-dark" style="page-break-inside: avoid;">
          <div style="font-size: 9pt; padding-bottom: 5px;">
            <div><span class="fw-bold d-inline-block" style="width: 70px;">Dicetak</span> : {{ currentUser?.nama || 'System' }}</div>
            <div><span class="fw-bold d-inline-block" style="width: 70px;">Tgl. Cetak</span> : {{ formatDateTime(new Date().toISOString()) }}</div>
          </div>
          <div style="width: 60%;" class="text-end">
            <table class="table-print table-bordered border-dark text-center ms-auto mb-0" style="width: 100%; font-size: 9pt;">
              <thead class="fw-bold bg-light">
                <tr><th class="p-1" width="33%">Dibuat</th><th class="p-1" width="33%">Diperiksa</th><th class="p-1" width="33%">Diketahui</th></tr>
              </thead>
              <tbody><tr><td style="height: 60px;"></td><td></td><td></td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'

const company = ref<any>({}) 
const currentUser = ref<any>(null)
const reportData = ref<any[]>([])
const listPihak = ref<any[]>([]) 
const isLoading = ref(false)
const isFilterApplied = ref(false)
const searchTableQuery = ref('')

const filters = ref({ startDate: '', endDate: '' })

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) currentUser.value = JSON.parse(userData)
  
  const today = new Date().toISOString().slice(0,10)
  filters.value.startDate = today
  filters.value.endDate = today
  
  await fetchCompanyProfile()
  await fetchMasterPihak()
})

const fetchCompanyProfile = async () => { try { const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single(); if (data) company.value = data } catch (err) {} }

const fetchMasterPihak = async () => {
  try {
    const { data } = await supabase.from('pihak_lawan').select('id, nama')
    listPihak.value = data || []
  } catch (err) {
    console.error('Gagal memuat master pihak lawan')
  }
}

const unlockFilters = () => { isFilterApplied.value = false }

const fetchData = async () => {
  if (!filters.value.startDate || !filters.value.endDate) return AppAlert.error('Validasi', 'Tanggal wajib diisi.')
  
  isLoading.value = true
  reportData.value = []
  searchTableQuery.value = ''
  AppAlert.loading('Mengumpulkan data piutang...')

  try {
    const { data: masterData, error: errMaster } = await supabase.from('master_piutang').select('id, pihak_lawan(nama)')
    if (errMaster) throw errMaster
    const masterMap = new Map()
    ;(masterData || []).forEach((m: any) => masterMap.set(m.id, m.pihak_lawan?.nama || 'Unknown'))

    const { data: tagihanData, error: errTagihan } = await supabase.from('tagihan_piutang').select('master_piutang_id, jumlah_tagihan, tanggal_tagihan').lte('tanggal_tagihan', filters.value.endDate)
    if (errTagihan) throw errTagihan

    const { data: bayarData, error: errBayar } = await supabase.from('pembayaran_piutang').select('jumlah_bayar, tanggal_pembayaran, tagihan_piutang(master_piutang_id)').lte('tanggal_pembayaran', filters.value.endDate)
    if (errBayar) throw errBayar

    const calcMap = new Map()
    const getRow = (id: string) => {
      if (!calcMap.has(id)) { calcMap.set(id, { id, nama: masterMap.get(id) || 'Unknown', awal: 0, tambah: 0, kurang: 0, akhir: 0 }) }
      return calcMap.get(id)
    }

    ;(tagihanData || []).forEach((t: any) => {
      if (!t.master_piutang_id) return
      const row = getRow(t.master_piutang_id)
      if (t.tanggal_tagihan < filters.value.startDate) row.awal += Number(t.jumlah_tagihan)
      else row.tambah += Number(t.jumlah_tagihan)
    })

    ;(bayarData || []).forEach((p: any) => {
      const masterId = p.tagihan_piutang?.master_piutang_id
      if (!masterId) return
      const row = getRow(masterId)
      if (p.tanggal_pembayaran < filters.value.startDate) row.awal -= Number(p.jumlah_bayar)
      else row.kurang += Number(p.jumlah_bayar)
    })

    reportData.value = Array.from(calcMap.values()).map(r => {
      r.akhir = r.awal + r.tambah - r.kurang
      return r
    }).filter(r => r.awal !== 0 || r.tambah !== 0 || r.kurang !== 0 || r.akhir !== 0)

    isFilterApplied.value = true
    AppAlert.close()
  } catch (err: any) {
    AppAlert.error('Gagal', err.message)
  } finally {
    isLoading.value = false
  }
}

const filteredReportData = computed(() => {
  if (!searchTableQuery.value) return reportData.value
  const q = searchTableQuery.value.toLowerCase()
  return reportData.value.filter(item => item.nama.toLowerCase().includes(q))
})

const totals = computed(() => {
  return filteredReportData.value.reduce((acc, curr) => {
    acc.awal += curr.awal; acc.tambah += curr.tambah; acc.kurang += curr.kurang; acc.akhir += curr.akhir
    return acc
  }, { awal: 0, tambah: 0, kurang: 0, akhir: 0 })
})

const printLaporan = async () => {
  await nextTick()
  setTimeout(() => window.print(), 400)
}

const exportToExcel = () => {
  let tsvContent = `REKAPITULASI PIUTANG\nPeriode: ${filters.value.startDate} s/d ${filters.value.endDate}\n\n`
  tsvContent += "No\tPihak Piutang (Debitur)\tSaldo Awal\tPiutang Baru (+)\tPelunasan Masuk (-)\tSaldo Akhir\n"
  
  filteredReportData.value.forEach((item, index) => { tsvContent += `${index + 1}\t${item.nama}\t${item.awal}\t${item.tambah}\t${item.kurang}\t${item.akhir}\n` })
  tsvContent += `\n\tTOTAL KESELURUHAN\t${totals.value.awal}\t${totals.value.tambah}\t${totals.value.kurang}\t${totals.value.akhir}\n`

  const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob)
  link.setAttribute("download", `Rekap_Piutang_${filters.value.startDate}.xls`)
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
}

const formatDateStr = (dateStr: string) => {
  if (!dateStr) return '-'; const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth()+1).padStart(2, '0')}-${d.getFullYear()}`
}
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'; const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const formatNominal = (angka: number) => { return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka || 0) }
</script>

<style scoped>
#print-area { display: none; }
</style>

<style>
@media print {
  .screen-only, .sidebar, .topbar, .d-print-none, aside, nav, header { display: none !important; }
  .main-content, .content-area, .app-layout, body, html, #app { margin: 0 !important; padding: 0 !important; background-color: white !important; width: 100% !important; max-width: 100% !important; height: auto !important; overflow: visible !important; position: static !important; }
  #print-area { display: block !important; width: 100% !important; padding: 10px !important; color: black !important; }
  @page { margin: 10mm; size: portrait; } 
  .table-print { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  .table-print th, .table-print td { border: 1px solid black !important; color: black !important; padding: 4px 6px !important; }
  .bg-light { background-color: #e9ecef !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .text-dark { color: black !important; }
}
</style>