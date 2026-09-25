<template>
  <div class="laporan-posisi">
    
    <!-- AREA KONTROL -->
    <div class="d-print-none card border border-secondary shadow-sm rounded-0 p-4 mb-4">
      <h4 class="fw-bold text-dark mb-4">Laporan Keuangan</h4>
      
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label small fw-bold">Dari Tanggal</label>
          <input type="date" class="form-control rounded-0" v-model="filters.startDate" />
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold">Sampai Tanggal</label>
          <input type="date" class="form-control rounded-0" v-model="filters.endDate" />
        </div>
        <div class="col-md-6 d-flex gap-2">
          <button class="btn btn-primary fw-bold px-4 rounded-0" @click="generateReport">
            <i class="bi bi-search me-1"></i> Tampilkan
          </button>
          <button class="btn btn-success fw-bold px-3 rounded-0" @click="exportToExcel" :disabled="reportGroups.length === 0">
            <i class="bi bi-file-earmark-excel me-1"></i> Excel
          </button>
          <button class="btn btn-danger fw-bold px-3 rounded-0" @click="printPDF" :disabled="reportGroups.length === 0">
            <i class="bi bi-printer me-1"></i> Cetak / PDF
          </button>
        </div>
      </div>
    </div>

    <!-- KARTU RINGKASAN DI ATAS (UI ONLY) -->
    <div class="row g-2 mb-4 d-print-none" v-if="reportGroups.length > 0">
      <div class="col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm bg-primary text-white h-100 p-2 rounded-0">
          <div class="fw-bold opacity-75 mb-1 text-truncate" style="font-size: 0.65rem;" title="TOTAL ASET">TOTAL ASET</div>
          <div class="fw-bold mb-0 text-truncate" style="font-size: 0.95rem;" :title="'Rp ' + formatNominal(summary.aset)">Rp {{ formatNominal(summary.aset) }}</div>
        </div>
      </div>
      <div class="col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm bg-danger text-white h-100 p-2 rounded-0">
          <div class="fw-bold opacity-75 mb-1 text-truncate" style="font-size: 0.65rem;" title="LIABILITAS">LIABILITAS</div>
          <div class="fw-bold mb-0 text-truncate" style="font-size: 0.95rem;" :title="'Rp ' + formatNominal(summary.liabilitas)">Rp {{ formatNominal(summary.liabilitas) }}</div>
        </div>
      </div>
      <div class="col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm bg-warning text-dark h-100 p-2 rounded-0">
          <div class="fw-bold opacity-75 mb-1 text-truncate" style="font-size: 0.65rem;" title="EKUITAS">EKUITAS</div>
          <div class="fw-bold mb-0 text-truncate" style="font-size: 0.95rem;" :title="'Rp ' + formatNominal(summary.ekuitas)">Rp {{ formatNominal(summary.ekuitas) }}</div>
        </div>
      </div>
      <div class="col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm bg-success text-white h-100 p-2 rounded-0">
          <div class="fw-bold opacity-75 mb-1 text-truncate" style="font-size: 0.65rem;" title="PENDAPATAN">PENDAPATAN</div>
          <div class="fw-bold mb-0 text-truncate" style="font-size: 0.95rem;" :title="'Rp ' + formatNominal(summary.pendapatan)">Rp {{ formatNominal(summary.pendapatan) }}</div>
        </div>
      </div>
      <div class="col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm bg-secondary text-white h-100 p-2 rounded-0">
          <div class="fw-bold opacity-75 mb-1 text-truncate" style="font-size: 0.65rem;" title="BIAYA / BEBAN">BIAYA / BEBAN</div>
          <div class="fw-bold mb-0 text-truncate" style="font-size: 0.95rem;" :title="'Rp ' + formatNominal(summary.biaya)">Rp {{ formatNominal(summary.biaya) }}</div>
        </div>
      </div>
      <div class="col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm h-100 p-2 rounded-0" :class="summary.laba >= 0 ? 'bg-info text-dark' : 'bg-dark text-white'">
          <div class="fw-bold opacity-75 mb-1 text-truncate" style="font-size: 0.65rem;" title="LABA / (RUGI)">LABA / (RUGI)</div>
          <div class="fw-bold mb-0 text-truncate" style="font-size: 0.95rem;" :title="'Rp ' + formatNominal(summary.laba)">Rp {{ formatNominal(summary.laba) }}</div>
        </div>
      </div>
    </div>

    <!-- AREA LAPORAN UTAMA (PDF & LAYAR) -->
    <div id="printable-area" class="bg-white" v-if="reportGroups.length > 0">
      
      <!-- KOP SURAT (Hanya di Print) -->
      <div class="d-none d-print-block mb-3 mt-2">
        <table class="w-100 table-print table-bordered border-dark mb-3">
          <tr>
            <td class="p-2 align-middle">
              <div class="d-flex align-items-center">
                <img v-if="company.logo_url" :src="company.logo_url" alt="Logo" style="max-height: 45px; margin-right: 15px;">
                <div>
                  <h5 class="mb-0 fw-bold text-dark text-uppercase" style="font-size: 11pt;">{{ company.nama || 'NAMA INSTANSI' }}</h5>
                  <div v-if="company.sub_nama" style="font-size: 8pt; font-weight: bold; margin-bottom: 2px;">{{ company.sub_nama }}</div>
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
        
        <div class="text-center mb-4 mt-3">
          <h4 class="fw-bold text-uppercase text-dark mb-1" style="font-size: 13pt; letter-spacing: 1px;">LAPORAN KEUANGAN LENGKAP</h4>
          <div class="text-dark fw-bold" style="font-size: 10pt;">Periode: {{ formatDate(filters.startDate) }} s/d {{ formatDate(filters.endDate) }}</div>
        </div>
      </div>

      <!-- ITERASI PER KELOMPOK AKUN -->
      <div v-for="group in reportGroups" :key="group.id" class="mb-4">
        <h5 class="fw-bold text-dark mb-2 text-muted"><i class="bi bi-folder2-open me-2"></i> {{ group.title }}</h5>
        
        <div class="table-responsive">
          <table class="table table-sm table-striped custom-striped table-bordered table-hover mb-0 align-middle table-print" style="font-size: 0.85rem;">
            <thead class="text-center align-middle bg-light fw-bold d-print-light">
              <tr>
                <th rowspan="2" width="12%" class="py-2">Kode COA</th>
                <th rowspan="2" width="28%" class="py-2">Nama Akun</th>
                <th rowspan="2" width="15%" class="py-2">Saldo Awal</th>
                <th colspan="2" width="30%" class="py-2">Mutasi Periode Ini</th>
                <th rowspan="2" width="15%" class="py-2">Saldo Akhir</th>
              </tr>
              <tr>
                <th class="py-2">Debet</th>
                <th class="py-2">Kredit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in group.items" :key="item.coa_code" 
                  :class="{
                    'fw-bold': item.sifat === 'H' || item.sifat === 'DH',
                    'text-success fw-bold': item.is_laba_rugi_berjalan,
                    'text-danger fw-bold': item.is_laba_rugi_berjalan && item.saldoAkhir < 0
                  }">
                <td class="text-center">
                  <span v-if="item.is_laba_rugi_berjalan"><i class="bi bi-arrow-return-right text-muted me-1"></i></span>
                  {{ item.coa_code }}
                </td>
                <td :style="{ paddingLeft: item.sifat === 'D' && !item.is_laba_rugi_berjalan ? '2rem' : '0.5rem' }">
                  {{ item.nama }}
                </td>
                <td class="text-end">
                  <div class="d-flex justify-content-between px-1" v-if="!item.is_laba_rugi_berjalan">
                    <span>Rp</span> <span>{{ formatNominal(item.saldoAwal) }}</span>
                  </div>
                </td>
                <td class="text-end">
                  <div class="d-flex justify-content-between px-1" v-if="!item.is_laba_rugi_berjalan">
                    <span>Rp</span> <span>{{ formatNominal(item.mutasiDebet) }}</span>
                  </div>
                </td>
                <td class="text-end">
                  <div class="d-flex justify-content-between px-1" v-if="!item.is_laba_rugi_berjalan">
                    <span>Rp</span> <span>{{ formatNominal(item.mutasiKredit) }}</span>
                  </div>
                </td>
                <td class="text-end fw-bold">
                  <div class="d-flex justify-content-between px-1">
                    <span>Rp</span> <span>{{ formatNominal(item.saldoAkhir) }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <!-- TOTAL PER KELOMPOK -->
            <tfoot class="print-bg-dark fw-bold">
              <tr>
                <td colspan="2" class="text-center text-uppercase py-2">TOTAL {{ group.title }}</td>
                <td class="text-end py-2"><div class="d-flex justify-content-between px-1"><span>Rp</span> <span>{{ formatNominal(group.totals.awal) }}</span></div></td>
                <td class="text-end py-2"><div class="d-flex justify-content-between px-1"><span>Rp</span> <span>{{ formatNominal(group.totals.debet) }}</span></div></td>
                <td class="text-end py-2"><div class="d-flex justify-content-between px-1"><span>Rp</span> <span>{{ formatNominal(group.totals.kredit) }}</span></div></td>
                <td class="text-end py-2"><div class="d-flex justify-content-between px-1"><span>Rp</span> <span>{{ formatNominal(group.totals.akhir) }}</span></div></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- HALAMAN RINGKASAN AKHIR (Pindah ke Halaman Baru Saat Print) -->
      <div class="print-page-break mt-5 d-none d-print-block">
        <table class="w-100 table-print table-bordered border-dark mb-0">
          <thead>
            <tr class="print-bg-dark text-center">
              <th colspan="2" class="py-2" style="font-size: 11pt; letter-spacing: 1px;">RINGKASAN TOTAL LAPORAN KEUANGAN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td width="50%" class="fw-bold p-2">TOTAL ASET</td>
              <td class="text-end fw-bold p-2">Rp {{ formatNominal(summary.aset) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-2">TOTAL LIABILITAS</td>
              <td class="text-end fw-bold p-2">Rp {{ formatNominal(summary.liabilitas) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-2">TOTAL EKUITAS (Termasuk Laba/Rugi Berjalan)</td>
              <td class="text-end fw-bold p-2">Rp {{ formatNominal(summary.ekuitas) }}</td>
            </tr>
            <tr class="bg-light d-print-light">
              <td class="fw-bold p-2">STATUS NERACA (Aset = Liabilitas + Ekuitas)</td>
              <td class="text-end fw-bold p-2">{{ isNeracaBalance ? 'SEIMBANG (BALANCE)' : 'TIDAK SEIMBANG' }}</td>
            </tr>
            <tr>
              <td colspan="2" class="p-0 border-0 bg-light d-print-light" style="height: 10px;"></td>
            </tr>
            <tr>
              <td class="fw-bold p-2">TOTAL PENDAPATAN</td>
              <td class="text-end fw-bold p-2">Rp {{ formatNominal(summary.pendapatan) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-2">TOTAL BIAYA / BEBAN</td>
              <td class="text-end fw-bold p-2">Rp {{ formatNominal(summary.biaya) }}</td>
            </tr>
            <tr class="print-bg-dark">
              <td class="fw-bold p-2">LABA / (RUGI) BERSIH</td>
              <td class="text-end fw-bold p-2">Rp {{ formatNominal(summary.laba) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- FOOTER TTD TERINTEGRASI -->
      <div class="d-none d-print-block mt-5 pt-3">
        <p class="fst-italic fw-bold text-center mb-3" style="font-size: 8pt;">
          *Laporan dinyatakan sah apabila telah di stamp (cap) dan ttd oleh petugas yang berwenang.
        </p>
        <div class="d-flex justify-content-end">
          <table class="table-print table-bordered border-dark text-center" style="width: 60%; font-size: 9pt;">
            <thead class="fw-bold bg-light d-print-light">
              <tr><th class="p-2" width="33%">Disiapkan Oleh</th><th class="p-2" width="33%">Diperiksa Oleh</th><th class="p-2" width="33%">Disetujui Oleh</th></tr>
            </thead>
            <tbody><tr><td style="height: 80px;"></td><td></td><td></td></tr></tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'
import * as XLSX from 'xlsx'

const reportGroups = ref<any[]>([])
const company = ref<any>({}) 

const summary = reactive({
  aset: 0,
  liabilitas: 0,
  ekuitas: 0,
  pendapatan: 0,
  biaya: 0,
  laba: 0
})

const isNeracaBalance = computed(() => {
  return summary.aset === (summary.liabilitas + summary.ekuitas)
})

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

  const coaLabaBerjalan = company.value?.coa_laba_rugi_berjalan
  if (!coaLabaBerjalan) {
    AppAlert.error('Konfigurasi Belum Selesai', 'Anda belum mengatur COA Laba/Rugi Periode Berjalan di menu Setting COA (Company Profile).')
    return
  }

  AppAlert.loading('Mengkalkulasi Seluruh Jurnal...')
  try {
    const { data: coas, error: errCoa } = await supabase.from('coas').select('*').order('coa_code', { ascending: true })
    if (errCoa) throw errCoa

    const { data: transactions, error: errTrx } = await supabase.from('transaksi')
      .select('coa_saldo, debet, kredit, tanggal_transaksi')
      .lte('tanggal_transaksi', filters.endDate)
    if (errTrx) throw errTrx

    // 1. Template Pengelompokan Data
    const groups = [
      { id: '1', title: '1 - ASET', items: [] as any[], totals: { awal: 0, debet: 0, kredit: 0, akhir: 0 } },
      { id: '2', title: '2 - LIABILITAS', items: [] as any[], totals: { awal: 0, debet: 0, kredit: 0, akhir: 0 } },
      { id: '3', title: '3 - EKUITAS', items: [] as any[], totals: { awal: 0, debet: 0, kredit: 0, akhir: 0 } },
      { id: '4', title: '4 - PENDAPATAN', items: [] as any[], totals: { awal: 0, debet: 0, kredit: 0, akhir: 0 } },
      { id: '5', title: '5 - BIAYA / BEBAN', items: [] as any[], totals: { awal: 0, debet: 0, kredit: 0, akhir: 0 } }
    ]

    let namaCoaLabaBerjalan = 'LABA / (RUGI) PERIODE BERJALAN'

    // 2. Kalkulasi Item
    coas.forEach(coa => {
      // PERBAIKAN LOGIKA PENCARIAN (Menambahkan batasan titik agar .99 tidak masuk ke .9)
      const relatedTrx = transactions.filter(t => 
        t.coa_saldo === coa.coa_code || t.coa_saldo.startsWith(coa.coa_code + '.')
      )
      
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

      if (coa.coa_code === coaLabaBerjalan) namaCoaLabaBerjalan = coa.nama

      const processedCoa = { ...coa, saldoAwal, mutasiDebet: mutasiD, mutasiKredit: mutasiK, saldoAkhir }
      
      const groupId = coa.kelompok.charAt(0)
      const targetGroup = groups.find(g => g.id === groupId)
      
      if (targetGroup && coa.coa_code !== coaLabaBerjalan) {
        targetGroup.items.push(processedCoa)
        
        if (coa.sifat === 'D') {
          targetGroup.totals.awal += saldoAwal
          targetGroup.totals.debet += mutasiD
          targetGroup.totals.kredit += mutasiK
          targetGroup.totals.akhir += saldoAkhir
        }
      }
    })

    // 3. Menghitung dan Menyuntikkan Laba Rugi ke Ekuitas
    const grpPendapatan = groups.find(g => g.id === '4')!
    const grpBeban = groups.find(g => g.id === '5')!
    const grpEkuitas = groups.find(g => g.id === '3')!

    const labaAwal = grpPendapatan.totals.awal - grpBeban.totals.awal
    const labaAkhir = grpPendapatan.totals.akhir - grpBeban.totals.akhir
    
    const mutasiLaba = labaAkhir - labaAwal
    const labaMutasiD = mutasiLaba < 0 ? Math.abs(mutasiLaba) : 0
    const labaMutasiK = mutasiLaba >= 0 ? mutasiLaba : 0

    const injectedRow = {
      coa_code: coaLabaBerjalan,
      nama: namaCoaLabaBerjalan,
      sifat: 'D',
      is_laba_rugi_berjalan: true,
      saldoAwal: labaAwal,
      mutasiDebet: labaMutasiD,
      mutasiKredit: labaMutasiK,
      saldoAkhir: labaAkhir
    }

    grpEkuitas.items.push(injectedRow)
    grpEkuitas.totals.awal += labaAwal
    grpEkuitas.totals.debet += labaMutasiD
    grpEkuitas.totals.kredit += labaMutasiK
    grpEkuitas.totals.akhir += labaAkhir

    // 4. Set Data dan Summary
    reportGroups.value = groups.filter(g => g.items.length > 0)
    
    summary.aset = groups.find(g => g.id === '1')?.totals.akhir || 0
    summary.liabilitas = groups.find(g => g.id === '2')?.totals.akhir || 0
    summary.ekuitas = grpEkuitas.totals.akhir || 0
    summary.pendapatan = grpPendapatan.totals.akhir || 0
    summary.biaya = grpBeban.totals.akhir || 0
    summary.laba = labaAkhir

    AppAlert.close()
  } catch (err) {
    AppAlert.error('Gagal', err)
  }
}

// FORMAT EXCEL
const exportToExcel = () => {
  const wb = XLSX.utils.book_new()
  const wsData: any[][] = []

  wsData.push(["LAPORAN KEUANGAN"])
  wsData.push(["Periode:", `${formatDate(filters.startDate)} s/d ${formatDate(filters.endDate)}`])
  wsData.push([])

  reportGroups.value.forEach((g: any) => {
    wsData.push([g.title])
    wsData.push(["Kode COA", "Nama Akun", "Saldo Awal", "Mutasi Debet", "Mutasi Kredit", "Saldo Akhir"])
    
    g.items.forEach((item: any) => {
      wsData.push([
        item.coa_code, item.nama, 
        item.saldoAwal, item.mutasiDebet, item.mutasiKredit, item.saldoAkhir
      ])
    })
    
    wsData.push(["", `TOTAL ${g.title}`, g.totals.awal, g.totals.debet, g.totals.kredit, g.totals.akhir])
    wsData.push([])
  })

  wsData.push(["RINGKASAN GLOBAL"])
  wsData.push(["Total Aset", summary.aset])
  wsData.push(["Total Liabilitas", summary.liabilitas])
  wsData.push(["Total Ekuitas", summary.ekuitas])
  wsData.push(["Total Pendapatan", summary.pendapatan])
  wsData.push(["Total Biaya", summary.biaya])
  wsData.push(["Laba / Rugi Bersih", summary.laba])

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan")
  XLSX.writeFile(wb, `Laporan_Keuangan_${filters.startDate}_sd_${filters.endDate}.xlsx`)
}

const printPDF = () => {
  setTimeout(() => window.print(), 400)
}
</script>

<style scoped>
.card { transition: all 0.3s ease; }
</style>

<!-- CSS Global Khusus Print -->
<style>
@media print {
  .screen-only, .sidebar, .topbar, .d-print-none, aside, nav, header {
    display: none !important;
  }
  
  .main-content, .content-area, .app-layout, body, html, #app {
    margin: 0 !important; padding: 0 !important; background-color: white !important;
    width: 100% !important; max-width: 100% !important; height: auto !important;
    overflow: visible !important; position: static !important;
  }

  #printable-area {
    display: block !important; width: 100% !important; padding: 10px !important;
    font-size: 9pt !important; color: black !important; position: absolute !important;
    left: 0 !important; top: 0 !important;
  }

  @page { margin: 10mm; }

  .print-page-break {
    page-break-before: always !important;
  }

  .table-print { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 9pt !important; }
  .table-print th, .table-print td { border: 1px solid black !important; color: black !important; padding: 4px 6px !important; }
  
  .custom-striped > tbody > tr:nth-of-type(odd) > * {
    background-color: #f1f5f9 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .table-print tr.print-bg-dark th, 
  .table-print tr.print-bg-dark td,
  .print-bg-dark th,
  .print-bg-dark td { 
    background-color: #343a40 !important; 
    color: white !important; 
    -webkit-print-color-adjust: exact !important; 
    print-color-adjust: exact !important; 
  }
  
  .d-print-light {
    background-color: #f8f9fa !important;
    color: black !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .tracking-wide { letter-spacing: 2px; }
  .text-dark { color: black !important; }
  .card { border: none !important; box-shadow: none !important; }
}
</style>