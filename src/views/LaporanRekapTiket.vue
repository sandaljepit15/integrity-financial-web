<template>
  <div class="laporan-rekap-tiket">
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Laporan Agregasi Penjualan Tiket</h4>
          <p class="text-muted small mb-0">Ringkasan kuantitas, nilai kotor, penyesuaian hak (Jurnal), dan Hak Bersih EO.</p>
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
              <label class="form-label small fw-bold text-dark mb-1">Periode Rekapitulasi <span class="text-danger">*</span></label>
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
          <input type="text" class="form-control rounded-0 border-start-0 border-secondary ps-0" v-model="searchTableQuery" placeholder="Cari segmen tiket...">
        </div>
      </div>

      <!-- TABEL DATA -->
      <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden mb-3">
        <div class="card-header bg-dark text-white p-2 px-3 d-flex justify-content-between align-items-center rounded-0">
          <div class="fw-bold" style="font-size: 0.9rem;"><i class="bi bi-ticket-perforated me-2"></i>Agregasi Rekap Tiket</div>
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
          <table class="table table-sm table-hover table-bordered align-middle mb-0" style="font-size: 0.8rem; min-width: 1700px;">
            <thead class="table-secondary text-center align-middle sticky-top">
              <tr>
                <th width="3%" rowspan="2" class="py-2">No</th>
                <th width="15%" rowspan="2" class="py-2">Segmen Tiket / Kategori</th>
                <th colspan="2" class="py-1 bg-warning bg-opacity-25">Saldo Awal (Netto)</th>
                <th colspan="5" class="py-1 bg-primary bg-opacity-10">Mutasi / Penambahan (Periode Terfilter)</th>
                <th colspan="2" class="py-1 bg-success bg-opacity-25">Saldo Akhir Terkumpul</th>
              </tr>
              <tr>
                <th width="5%" class="py-1 text-muted">Qty (Pcs)</th>
                <th width="10%" class="py-1 text-muted">Hak Bersih (Rp)</th>
                
                <th width="5%" class="py-1 text-primary">Qty Masuk</th>
                <th width="10%" class="py-1 text-primary">Nilai Kotor (Gross)</th>
                <th width="9%" class="py-1 text-success">Penambah Hak (+)</th>
                <th width="9%" class="py-1 text-danger">Pengurang Hak (-)</th>
                <th width="10%" class="py-1 text-primary fw-bold">Hak Bersih Mutasi</th>
                
                <th width="5%" class="py-1 text-success">Total Qty</th>
                <th width="10%" class="py-1 text-success">Hak Bersih Final (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading"><td colspan="11" class="text-center py-5"><div class="spinner-border spinner-border-sm me-2"></div> Menghitung agregasi tiket...</td></tr>
              <tr v-else-if="!isFilterApplied"><td colspan="11" class="text-center py-5 text-muted fst-italic">Silakan atur periode dan klik "Tarik Laporan" untuk memuat data.</td></tr>
              <tr v-else-if="filteredReportData.length === 0"><td colspan="11" class="text-center py-5 text-muted fst-italic">Tidak ada segmen tiket yang cocok dengan pencarian Anda.</td></tr>
              
              <tr v-for="(item, index) in filteredReportData" :key="item.id" :class="{'bg-light': index % 2 !== 0}">
                <td class="text-center text-muted">{{ index + 1 }}</td>
                <td class="fw-bold text-dark">{{ item.nama }}</td>
                
                <!-- SALDO AWAL -->
                <td class="text-center fw-bold text-muted">{{ formatNominal(item.awalQty) }}</td>
                <td class="text-end fw-bold text-muted">Rp {{ formatNominal(item.awalNetto) }}</td>
                
                <!-- MUTASI PERIODE INI -->
                <td class="text-center fw-bold text-primary">{{ formatNominal(item.mutasiQty) }}</td>
                <td class="text-end fw-bold text-primary">Rp {{ formatNominal(item.mutasiKotor) }}</td>
                <td class="text-end fw-bold text-success">{{ item.mutasiTambah > 0 ? '+ Rp ' + formatNominal(item.mutasiTambah) : '-' }}</td>
                <td class="text-end fw-bold text-danger">{{ item.mutasiKurang > 0 ? '- Rp ' + formatNominal(item.mutasiKurang) : '-' }}</td>
                <td class="text-end fw-bold text-primary bg-primary bg-opacity-10">Rp {{ formatNominal(item.mutasiNetto) }}</td>
                
                <!-- SALDO AKHIR -->
                <td class="text-center fw-bold text-success bg-success bg-opacity-10">{{ formatNominal(item.akhirQty) }}</td>
                <td class="text-end fw-bold text-success bg-success bg-opacity-10 fs-6">Rp {{ formatNominal(item.akhirNetto) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="!isLoading && filteredReportData.length > 0" class="table-dark fw-bold">
              <tr>
                <td colspan="2" class="text-end py-2 pe-3 text-uppercase">TOTAL PENJUALAN :</td>
                <td class="text-center py-2 text-white">{{ formatNominal(totals.awalQty) }}</td>
                <td class="text-end py-2 text-white">Rp {{ formatNominal(totals.awalNetto) }}</td>
                
                <td class="text-center py-2 text-info">{{ formatNominal(totals.mutasiQty) }}</td>
                <td class="text-end py-2 text-info">Rp {{ formatNominal(totals.mutasiKotor) }}</td>
                <td class="text-end py-2 text-success">+ Rp {{ formatNominal(totals.mutasiTambah) }}</td>
                <td class="text-end py-2 text-danger">- Rp {{ formatNominal(totals.mutasiKurang) }}</td>
                <td class="text-end py-2 text-info">Rp {{ formatNominal(totals.mutasiNetto) }}</td>
                
                <td class="text-center py-2 text-warning fs-6">{{ formatNominal(totals.akhirQty) }}</td>
                <td class="text-end py-2 text-warning fs-6">Rp {{ formatNominal(totals.akhirNetto) }}</td>
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
                AGREGASI PENJUALAN TIKET
              </h4>
            </td>
          </tr>
        </table>

        <!-- PARAMETER FILTER YANG DIPAKAI -->
        <div class="mb-3 p-2 border border-dark text-dark" style="font-size: 9pt;">
           <div class="fw-bold mb-1 border-bottom border-dark pb-1 text-uppercase">Parameter Laporan:</div>
           <div class="row g-1 mt-1">
             <div class="col-12"><strong>Periode Mutasi:</strong> {{ formatDateStr(filters.startDate) }} s/d {{ formatDateStr(filters.endDate) }}</div>
             <div class="col-12" v-if="searchTableQuery"><strong>Pencarian Klien:</strong> "{{ searchTableQuery }}"</div>
           </div>
        </div>

        <table class="w-100 table-print table-bordered border-dark text-dark mb-4">
          <thead class="text-center fw-bold bg-light" style="font-size: 8pt;">
            <tr>
              <th width="3%" rowspan="2" class="p-1 align-middle">No</th>
              <th width="19%" rowspan="2" class="p-1 align-middle">Kategori Tiket</th>
              <th colspan="2" class="p-1">Saldo Awal</th>
              <th colspan="5" class="p-1">Mutasi Penambahan</th>
              <th colspan="2" class="p-1">Saldo Akhir</th>
            </tr>
            <tr>
              <th width="5%" class="p-1">Qty</th>
              <th width="9%" class="p-1">Netto (Rp)</th>
              
              <th width="5%" class="p-1">Qty</th>
              <th width="9%" class="p-1">Gross (Rp)</th>
              <th width="9%" class="p-1">Tambah (+)</th>
              <th width="9%" class="p-1">Kurang (-)</th>
              <th width="9%" class="p-1">Netto (Rp)</th>
              
              <th width="5%" class="p-1">Qty</th>
              <th width="9%" class="p-1">Netto (Rp)</th>
            </tr>
          </thead>
          <tbody style="font-size: 7.5pt;">
            <tr v-for="(item, idx) in filteredReportData" :key="idx">
              <td class="text-center p-1">{{ idx + 1 }}</td>
              <td class="p-1 fw-bold">{{ item.nama }}</td>
              
              <td class="text-center p-1">{{ formatNominal(item.awalQty) }}</td>
              <td class="p-1 text-end">{{ formatNominal(item.awalNetto) }}</td>
              
              <td class="text-center p-1">{{ formatNominal(item.mutasiQty) }}</td>
              <td class="p-1 text-end">{{ formatNominal(item.mutasiKotor) }}</td>
              <td class="p-1 text-end">{{ formatNominal(item.mutasiTambah) }}</td>
              <td class="p-1 text-end">{{ formatNominal(item.mutasiKurang) }}</td>
              <td class="p-1 text-end fw-bold">{{ formatNominal(item.mutasiNetto) }}</td>
              
              <td class="text-center p-1 fw-bold">{{ formatNominal(item.akhirQty) }}</td>
              <td class="p-1 text-end fw-bold">{{ formatNominal(item.akhirNetto) }}</td>
            </tr>
            <tr class="fw-bold bg-light" style="font-size: 8pt;">
              <td colspan="2" class="text-end p-2 pe-3 text-uppercase">TOTAL :</td>
              <td class="p-1 text-center">{{ formatNominal(totals.awalQty) }}</td>
              <td class="p-1 text-end">{{ formatNominal(totals.awalNetto) }}</td>
              
              <td class="p-1 text-center">{{ formatNominal(totals.mutasiQty) }}</td>
              <td class="p-1 text-end">{{ formatNominal(totals.mutasiKotor) }}</td>
              <td class="p-1 text-end">{{ formatNominal(totals.mutasiTambah) }}</td>
              <td class="p-1 text-end">{{ formatNominal(totals.mutasiKurang) }}</td>
              <td class="p-1 text-end">{{ formatNominal(totals.mutasiNetto) }}</td>
              
              <td class="p-1 text-center">{{ formatNominal(totals.akhirQty) }}</td>
              <td class="p-1 text-end">{{ formatNominal(totals.akhirNetto) }}</td>
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
})

const fetchCompanyProfile = async () => { try { const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single(); if (data) company.value = data } catch (err) {} }

const unlockFilters = () => { isFilterApplied.value = false }

const fetchData = async () => {
  if (!filters.value.startDate || !filters.value.endDate) return AppAlert.error('Validasi', 'Tanggal wajib diisi.')
  
  isLoading.value = true
  reportData.value = []
  searchTableQuery.value = ''
  AppAlert.loading('Mengumpulkan data rekap tiket...')

  try {
    const { data, error } = await supabase.from('rekap_tiket')
      .select('master_tiket_id, mutasi_qty, mutasi_kotor, netto_hutang, detail_penyesuaian, tanggal_rekap, master:master_tiket(nama_segmen)')
      .lte('tanggal_rekap', filters.value.endDate)

    if (error) throw error

    const map = new Map()
    ;(data || []).forEach((t: any) => {
      const id = t.master_tiket_id
      if (!map.has(id)) {
        map.set(id, { 
            id, nama: t.master?.nama_segmen || 'Unknown', 
            awalQty: 0, awalNetto: 0, 
            mutasiQty: 0, mutasiKotor: 0, mutasiTambah: 0, mutasiKurang: 0, mutasiNetto: 0, 
            akhirQty: 0, akhirNetto: 0 
        })
      }
      
      const row = map.get(id)
      const isBefore = t.tanggal_rekap < filters.value.startDate

      // Ekstrak data dari kolom JSON detail_penyesuaian
      let penambah = 0
      let pengurang = 0
      if (t.detail_penyesuaian && Array.isArray(t.detail_penyesuaian)) {
          t.detail_penyesuaian.forEach((adj: any) => {
              if (adj.dampak === 'penambah') penambah += Number(adj.nominal_calculated || 0)
              if (adj.dampak === 'pengurang') pengurang += Number(adj.nominal_calculated || 0)
          })
      }

      const mutasiNetto = Number(t.netto_hutang || 0)
      const mutasiQty = Number(t.mutasi_qty || 0)

      if (isBefore) {
        row.awalQty += mutasiQty
        row.awalNetto += mutasiNetto
      } else {
        row.mutasiQty += mutasiQty
        row.mutasiKotor += Number(t.mutasi_kotor || 0)
        row.mutasiTambah += penambah
        row.mutasiKurang += pengurang
        row.mutasiNetto += mutasiNetto
      }

      row.akhirQty = row.awalQty + row.mutasiQty
      row.akhirNetto = row.awalNetto + row.mutasiNetto
    })

    // Hanya tampilkan baris yang ada transaksinya
    reportData.value = Array.from(map.values()).filter(r => r.awalQty !== 0 || r.mutasiQty !== 0 || r.akhirQty !== 0)
    
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
    acc.awalQty += curr.awalQty; acc.awalNetto += curr.awalNetto;
    acc.mutasiQty += curr.mutasiQty; acc.mutasiKotor += curr.mutasiKotor;
    acc.mutasiTambah += curr.mutasiTambah; acc.mutasiKurang += curr.mutasiKurang; acc.mutasiNetto += curr.mutasiNetto;
    acc.akhirQty += curr.akhirQty; acc.akhirNetto += curr.akhirNetto;
    return acc
  }, { awalQty: 0, awalNetto: 0, mutasiQty: 0, mutasiKotor: 0, mutasiTambah: 0, mutasiKurang: 0, mutasiNetto: 0, akhirQty: 0, akhirNetto: 0 })
})

const printLaporan = async () => {
  await nextTick()
  setTimeout(() => window.print(), 400)
}

const exportToExcel = () => {
  let tsvContent = `AGREGASI PENJUALAN TIKET\nPeriode Mutasi: ${filters.value.startDate} s/d ${filters.value.endDate}\n\n`
  tsvContent += "No\tKategori Tiket\tAwal Qty (Pcs)\tAwal Netto Hak (Rp)\tMutasi Qty Masuk (Pcs)\tMutasi Kotor (Gross)\tPenambah Hak (+)\tPengurang Hak (-)\tMutasi Hak Bersih (Netto)\tAkhir Total Qty (Pcs)\tAkhir Netto Final (Rp)\n"
  
  filteredReportData.value.forEach((item, index) => { 
      tsvContent += `${index + 1}\t${item.nama}\t${item.awalQty}\t${item.awalNetto}\t${item.mutasiQty}\t${item.mutasiKotor}\t${item.mutasiTambah}\t${item.mutasiKurang}\t${item.mutasiNetto}\t${item.akhirQty}\t${item.akhirNetto}\n` 
  })
  
  tsvContent += `\n\tTOTAL KESELURUHAN\t${totals.value.awalQty}\t${totals.value.awalNetto}\t${totals.value.mutasiQty}\t${totals.value.mutasiKotor}\t${totals.value.mutasiTambah}\t${totals.value.mutasiKurang}\t${totals.value.mutasiNetto}\t${totals.value.akhirQty}\t${totals.value.akhirNetto}\n`

  const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob)
  link.setAttribute("download", `Rekap_Tiket_${filters.value.startDate}.xls`)
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
  @page { margin: 10mm; size: landscape; } /* Harus landscape karena tabel sangat lebar */
  .table-print { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  .table-print th, .table-print td { border: 1px solid black !important; color: black !important; padding: 4px 6px !important; }
  .bg-light { background-color: #e9ecef !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .text-dark { color: black !important; }
}
</style>