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
      
      <!-- KOMPONEN KOP SURAT DINAMIS -->
      <PrintHeader 
        judul="Laporan Posisi Keuangan" 
        :periode="`${formatDate(filters.startDate)} s/d ${formatDate(filters.endDate)}`" 
      />

      <!-- TABEL DATA -->
      <div class="card-body p-0 p-print-0">
        <div class="table-responsive">
          <!-- DITAMBAHKAN KELAS table-striped DI SINI -->
          <table class="table table-striped table-bordered table-hover mb-0 align-middle" id="report-table">
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
                <td class="text-end">{{ formatRupiah(item.saldoAwal) }}</td>
                <td class="text-end">{{ formatRupiah(item.mutasiDebet) }}</td>
                <td class="text-end">{{ formatRupiah(item.mutasiKredit) }}</td>
                <td class="text-end">{{ formatRupiah(item.saldoAkhir) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- KOMPONEN TANDA TANGAN DINAMIS -->
      <PrintFooter />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'
import * as XLSX from 'xlsx'
import PrintHeader from '../components/PrintHeader.vue'
import PrintFooter from '../components/PrintFooter.vue'

const reportData = ref<any[]>([])
const filters = reactive({
  startDate: '',
  endDate: ''
})

onMounted(() => {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  filters.startDate = firstDay.toISOString().split('T')[0]
  filters.endDate = today.toISOString().split('T')[0]
})

const formatRupiah = (angka: number) => {
  if (!angka) return '0'
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(angka)
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

const printPDF = () => {
  window.print()
}
</script>

<style>
/* 
  Style yang tidak menggunakan 'scoped' agar berlaku global untuk cetak PDF
*/

/* Modifikasi Warna Zebra Striping */
.table-striped > tbody > tr:nth-of-type(odd) > * {
  --bs-table-bg-type: #f8fafc;
}

@media print {
  .sidebar, .topbar, .d-print-none {
    display: none !important;
  }
  
  .main-content, .content-area, .app-layout {
    margin: 0 !important;
    padding: 0 !important;
    background-color: white !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }
  
  .d-print-block {
    display: block !important;
  }

  table.table-bordered {
    border-color: #000 !important;
  }
  table.table-bordered th, table.table-bordered td {
    border: 1px solid #000 !important;
    color: #000 !important;
  }
  
  /* Hilangkan zebra striping saat di-print agar hemat tinta */
  .table-striped > tbody > tr:nth-of-type(odd) > * {
    --bs-table-bg-type: transparent !important;
  }

  .p-print-0 {
    padding: 0 !important;
  }
  .card {
    border: none !important;
    box-shadow: none !important;
  }
}
</style>