<template>
  <div class="laporan-posisi">
    <!-- AREA KONTROL (Tidak akan ikut ter-print) -->
    <div class="d-print-none card border-0 shadow-sm rounded-3 p-4 mb-4">
      <h4 class="fw-bold text-dark mb-4">Kertas Kerja / Posisi Keuangan</h4>
      
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label small fw-bold">Dari Tanggal</label>
          <input type="date" class="form-control" v-model="filters.startDate" />
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold">Sampai Tanggal</label>
          <input type="date" class="form-control" v-model="filters.endDate" />
        </div>
        <div class="col-md-6 d-flex gap-2">
          <button class="btn btn-primary fw-bold px-4" @click="generateReport">
            <i class="bi bi-search me-1"></i> Tampilkan
          </button>
          <button class="btn btn-success fw-bold px-3" @click="exportToExcel" :disabled="reportData.length === 0">
            <i class="bi bi-file-earmark-excel me-1"></i> Excel
          </button>
          <button class="btn btn-danger fw-bold px-3" @click="printPDF" :disabled="reportData.length === 0">
            <i class="bi bi-file-earmark-pdf me-1"></i> Print / PDF
          </button>
        </div>
      </div>
    </div>

    <!-- AREA LAPORAN (Bagian ini yang akan di-print/PDF) -->
    <div id="printable-area" class="card border-0 shadow-sm rounded-3 bg-white" v-if="reportData.length > 0">
      
      <div class="card-body p-0 p-print-0">
        
        <!-- AREA KOP SURAT (Dinamis & Seragam dengan Tagihan, hanya tampil saat Print) -->
        <div class="d-none d-print-block mb-3 mt-2">
          <table class="w-100 table-print table-bordered border-dark mb-3">
            <tr>
              <td class="p-2 align-middle">
                <div class="d-flex align-items-center">
                  <img v-if="company.logo_url" :src="company.logo_url" alt="Logo" style="max-height: 45px; margin-right: 15px;">
                  <div>
                    <h5 class="mb-0 fw-bold text-dark text-uppercase" style="font-size: 11pt;">{{ company.nama || 'NAMA INSTANSI' }}</h5>
                    
                    <!-- SUB NAMA -->
                    <div v-if="company.sub_nama" style="font-size: 8pt; font-weight: bold; margin-bottom: 2px;">
                      {{ company.sub_nama }}
                    </div>
                    
                    <!-- ALAMAT & KONTAK -->
                    <div style="font-size: 8pt; margin-bottom: 2px;">{{ company.alamat || 'Alamat Instansi' }}</div>
                    <div style="font-size: 8pt;" v-if="company.telepon || company.email">
                      <span v-if="company.telepon">Telp: {{ company.telepon }}</span>
                      <span v-if="company.telepon && company.email"> | </span>
                      <span v-if="company.email">Email: {{ company.email }}</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </table>
          
          <div class="text-center mb-3 mt-3">
            <h5 class="fw-bold text-uppercase text-dark mb-1" style="font-size: 11pt; letter-spacing: 1px;">Laporan Posisi Keuangan</h5>
            <div class="text-dark" style="font-size: 9pt;">Periode: {{ formatDate(filters.startDate) }} s/d {{ formatDate(filters.endDate) }}</div>
          </div>
        </div>

        <!-- TABEL DATA -->
        <div class="table-responsive">
          <table class="table table-striped table-bordered table-hover mb-0 align-middle table-print" id="report-table">
            <thead class="table-dark text-center align-middle">
              <tr>
                <th rowspan="2" width="10%">Kode COA</th>
                <th rowspan="2" width="30%">Nama Akun</th>
                <th rowspan="2" width="15%">Saldo Awal</th>
                <th colspan="2" width="30%">Mutasi Periode Ini</th>
                <th rowspan="2" width="15%">Saldo Akhir</th>
              </tr>
              <tr>
                <th>Debet</th>
                <th>Kredit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in reportData" :key="item.coa_code" :class="{'fw-bold': item.sifat === 'H' || item.sifat === 'DH'}">
                <td class="text-center">{{ item.coa_code }}</td>
                <td :style="{ paddingLeft: item.sifat === 'D' ? '2rem' : '0.5rem' }">{{ item.nama }}</td>
                <td class="text-end">
                  <div class="d-flex justify-content-between px-1"><span>Rp</span> <span>{{ formatNominal(item.saldoAwal) }}</span></div>
                </td>
                <td class="text-end">
                  <div class="d-flex justify-content-between px-1"><span>Rp</span> <span>{{ formatNominal(item.mutasiDebet) }}</span></div>
                </td>
                <td class="text-end">
                  <div class="d-flex justify-content-between px-1"><span>Rp</span> <span>{{ formatNominal(item.mutasiKredit) }}</span></div>
                </td>
                <td class="text-end">
                  <div class="d-flex justify-content-between px-1"><span>Rp</span> <span>{{ formatNominal(item.saldoAkhir) }}</span></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- FOOTER TTD TERINTEGRASI -->
        <div class="d-none d-print-block mt-4">
          <p class="fst-italic fw-bold text-center mb-2" style="font-size: 8pt;">
            *Laporan dinyatakan sah apabila telah di stamp (cap) dan ttd oleh petugas yang berwenang.
          </p>
          <div class="d-flex justify-content-end">
            <table class="table-print table-bordered border-dark text-center" style="width: 50%; font-size: 9pt;">
              <thead class="fw-bold bg-light">
                <tr><th class="p-1" width="33%">Dibuat</th><th class="p-1" width="33%">Diperiksa</th><th class="p-1" width="33%">Disetujui</th></tr>
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
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'
import * as XLSX from 'xlsx'

const reportData = ref<any[]>([])
const company = ref<any>({}) 

const filters = reactive({
  startDate: '',
  endDate: ''
})

onMounted(async () => {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  filters.startDate = firstDay.toISOString().split('T')[0]
  filters.endDate = today.toISOString().split('T')[0]

  await fetchCompanyProfile()
})

const fetchCompanyProfile = async () => {
  try {
    const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single()
    if (data) company.value = data
  } catch (err) {
    console.error('Gagal memuat profil perusahaan', err)
  }
}

// FORMATTER NOMINAL UNTUK LAPORAN (Tanpa desimal)
const formatNominal = (angka: number) => {
  if (!angka) return '0'
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' }
  return new Date(dateStr).toLocaleDateString('id-ID', options)
}

const generateReport = async () => {
  if (!filters.startDate || !filters.endDate) {
    AppAlert.error('Peringatan', 'Harap isi range tanggal dengan lengkap.')
    return
  }

  AppAlert.loading('Mengkalkulasi Jurnal...')
  try {
    const { data: coas, error: errCoa } = await supabase
      .from('coas')
      .select('*')
      .order('coa_code', { ascending: true })
    if (errCoa) throw errCoa

    const { data: transactions, error: errTrx } = await supabase
      .from('transaksi')
      .select('coa_saldo, debet, kredit, tanggal_transaksi')
      .lte('tanggal_transaksi', filters.endDate)
    if (errTrx) throw errTrx

    const processedData = coas.map(coa => {
      const relatedTrx = transactions.filter(t => t.coa_saldo.startsWith(coa.coa_code))

      let saldoAwalD = 0, saldoAwalK = 0
      let mutasiD = 0, mutasiK = 0

      relatedTrx.forEach(trx => {
        if (trx.tanggal_transaksi < filters.startDate) {
          saldoAwalD += Number(trx.debet) || 0
          saldoAwalK += Number(trx.kredit) || 0
        } else {
          mutasiD += Number(trx.debet) || 0
          mutasiK += Number(trx.kredit) || 0
        }
      })

      const isDebitNormal = coa.kelompok.startsWith('1') || coa.kelompok.startsWith('5')
      const saldoAwal = isDebitNormal ? (saldoAwalD - saldoAwalK) : (saldoAwalK - saldoAwalD)
      const mutasiBersih = isDebitNormal ? (mutasiD - mutasiK) : (mutasiK - mutasiD)
      const saldoAkhir = saldoAwal + mutasiBersih

      return {
        ...coa,
        saldoAwal,
        mutasiDebet: mutasiD,
        mutasiKredit: mutasiK,
        saldoAkhir
      }
    })

    reportData.value = processedData
    AppAlert.close()
  } catch (err) {
    AppAlert.error('Gagal', err)
  }
}

const exportToExcel = () => {
  const table = document.getElementById('report-table')
  const wb = XLSX.utils.table_to_book(table, { sheet: "Posisi Keuangan" })
  XLSX.writeFile(wb, `Laporan_Posisi_Keuangan_${filters.startDate}_sd_${filters.endDate}.xlsx`)
}

// LOGIKA CETAK DENGAN JEDA RENDER
const printPDF = () => {
  setTimeout(() => {
    window.print()
  }, 400)
}
</script>

<!-- CSS Global Khusus Print (Teknik Reset Layout & Penyesuaian Komponen Bootstap) -->
<style>
@media print {
  /* 1. Sembunyikan elemen UI utama */
  .screen-only, .sidebar, .topbar, .d-print-none, aside, nav, header {
    display: none !important;
  }
  
  /* 2. Bebaskan area kontainer aplikasi (Mereset Sidebar margin) */
  .main-content, .content-area, .app-layout, body, html, #app {
    margin: 0 !important;
    padding: 0 !important;
    background-color: white !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    position: static !important;
  }

  /* 3. Tampilkan area cetak secara Absolute ke ujung kiri atas */
  #printable-area {
    display: block !important;
    width: 100% !important;
    padding: 10px !important;
    font-size: 9pt !important;
    color: black !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }

  @page { margin: 10mm; }
  
  /* Styling Tabel Laporan & Kop Surat */
  .table-print { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 9pt !important; }
  .table-print th, .table-print td { 
    border: 1px solid black !important; 
    color: black !important; 
    padding: 4px 6px !important; 
  }
  
  .bg-light { background-color: #e9ecef !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .tracking-wide { letter-spacing: 2px; }
  .text-dark { color: black !important; }

  /* OVERRIDE CLASS BOOTSTRAP KHUSUS PRINT */
  .table-dark { 
    background-color: #e9ecef !important; 
    color: black !important; 
    border-color: black !important; 
  }
  .table-dark th { 
    background-color: #e9ecef !important; 
    color: black !important; 
    border-color: black !important; 
  }
  
  /* Hilangkan zebra striping bawaan bootstrap saat print agar tinta irit */
  .table-striped > tbody > tr:nth-of-type(odd) > * { 
    --bs-table-bg-type: transparent !important; 
  }
  
  .card { border: none !important; box-shadow: none !important; }
}
</style>