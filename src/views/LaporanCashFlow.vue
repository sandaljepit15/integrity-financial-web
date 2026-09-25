<template>
  <div class="laporan-cash-flow">
    <!-- OVERLAY UNTUK MENUTUP DROPDOWN MULTI-SELECT -->
    <div v-if="activeDropdown" class="position-fixed top-0 start-0 w-100 h-100" style="z-index: 1050; background: transparent;" @click="closeAllDropdowns"></div>

    <!-- UI UTAMA -->
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Laporan Arus Kas & Likuiditas</h4>
          <p class="text-muted small mb-0">Pantau pergerakan kas, padukan dengan piutang, dan analisis Cash Ratio.</p>
        </div>
        <div>
          <button class="btn btn-outline-danger fw-bold px-3 me-2 rounded-0" @click="resetFilters" title="Reset Parameter">
            <i class="bi bi-arrow-counterclockwise"></i> Reset
          </button>
          <button class="btn btn-primary fw-bold px-4 rounded-0 shadow-sm" @click="fetchData">
            <i class="bi bi-lightning-charge-fill me-2"></i> Tarik Laporan
          </button>
        </div>
      </div>

      <!-- KOTAK FILTER PARAMETER -->
      <div class="card border border-secondary shadow-sm rounded-0 mb-4 bg-light bg-opacity-50" style="position: relative; z-index: 1055;">
        <div class="card-body p-3 position-relative">
          <div class="row g-3">
            
            <!-- 1. Filter Tanggal (Wajib) -->
            <div class="col-md-4">
              <label class="form-label small fw-bold text-dark mb-1">Periode Transaksi <span class="text-danger">*</span></label>
              <div class="input-group input-group-sm">
                <input type="date" class="form-control rounded-0 border-secondary fw-bold" v-model="filters.startDate">
                <span class="input-group-text border-secondary bg-white">s/d</span>
                <input type="date" class="form-control rounded-0 border-secondary fw-bold" v-model="filters.endDate">
              </div>
            </div>

            <!-- 2. Multi-Select Akun Kas / Aset -->
            <div class="col-md-4 position-relative" :style="{ zIndex: activeDropdown === 'kas' ? 1060 : 1 }">
              <label class="form-label small fw-bold text-success mb-1">Sumber Kas / Aset (Debet)</label>
              <div class="position-relative dropdown-container">
                <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0 border-success" @click="toggleDropdown('kas')">
                  <span class="text-truncate fw-bold text-success">
                    {{ filters.akunKas.length === 0 ? '-- Pilih Akun Kas/Aset --' : `${filters.akunKas.length} Akun Terpilih` }}
                  </span>
                  <i class="bi bi-caret-down-fill small text-muted"></i>
                </div>
                <div v-if="activeDropdown === 'kas'" class="position-absolute w-100 bg-white border rounded-0 shadow mt-1 custom-dropdown-menu">
                  <div class="p-2 border-bottom bg-light sticky-top">
                    <input type="text" class="form-control form-control-sm rounded-0" placeholder="Cari COA..." v-model="searchQuery" @click.stop>
                  </div>
                  <div class="list-group list-group-flush p-1">
                    <label v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-0 d-flex align-items-start cursor-pointer hover-bg">
                      <input class="form-check-input me-2 mt-1 rounded-0" type="checkbox" :value="coa.coa_code" v-model="filters.akunKas">
                      <div>
                        <span class="fw-bold">{{ coa.coa_code }}</span> - {{ coa.nama }}
                        <span v-if="coa.sifat !== 'D'" class="badge bg-secondary ms-1" style="font-size:0.6rem">Group</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Multi-Select Akun Kewajiban -->
            <div class="col-md-4 position-relative" :style="{ zIndex: activeDropdown === 'kewajiban' ? 1060 : 1 }">
              <label class="form-label small fw-bold text-danger mb-1">Akun Liabilitas / Kewajiban (Kredit)</label>
              <div class="position-relative dropdown-container">
                <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0 border-danger" @click="toggleDropdown('kewajiban')">
                  <span class="text-truncate fw-bold text-danger">
                    {{ filters.akunKewajiban.length === 0 ? 'Default (Semua Kewajiban Kepala 2)' : `${filters.akunKewajiban.length} Akun Terpilih` }}
                  </span>
                  <i class="bi bi-caret-down-fill small text-muted"></i>
                </div>
                <div v-if="activeDropdown === 'kewajiban'" class="position-absolute w-100 bg-white border rounded-0 shadow mt-1 custom-dropdown-menu">
                  <div class="p-2 border-bottom bg-light sticky-top">
                    <input type="text" class="form-control form-control-sm rounded-0" placeholder="Cari COA..." v-model="searchQuery" @click.stop>
                  </div>
                  <div class="list-group list-group-flush p-1">
                    <label v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-0 d-flex align-items-start cursor-pointer hover-bg">
                      <input class="form-check-input me-2 mt-1 rounded-0" type="checkbox" :value="coa.coa_code" v-model="filters.akunKewajiban">
                      <div>
                        <span class="fw-bold">{{ coa.coa_code }}</span> - {{ coa.nama }}
                        <span v-if="coa.sifat !== 'D'" class="badge bg-secondary ms-1" style="font-size:0.6rem">Group</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- TABEL DATA LAPORAN & SUMMARY -->
      <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden mb-3" style="z-index: 10;">
        <div class="card-header bg-dark text-white p-2 px-3 d-flex justify-content-between align-items-center rounded-0">
          <div class="fw-bold" style="font-size: 0.9rem;"><i class="bi bi-wallet2 me-2"></i>Buku Arus Kas & Likuiditas</div>
          <div>
            <button class="btn btn-sm btn-success fw-bold rounded-0 py-0 me-2" @click="exportToExcel" :disabled="!isRendered">
              <i class="bi bi-file-earmark-excel me-1"></i> Export Excel
            </button>
            <button class="btn btn-sm btn-light fw-bold rounded-0 py-0" @click="printLaporan" :disabled="!isRendered">
              <i class="bi bi-printer me-1"></i> Cetak Laporan
            </button>
          </div>
        </div>
        
        <div class="table-responsive" style="max-height: 60vh;">
          <table class="table table-sm table-hover table-bordered align-middle mb-0" style="min-width: 1200px; font-size: 0.85rem;">
            <thead class="table-secondary text-center align-middle sticky-top" style="z-index: 10;">
              <tr>
                <th width="4%" class="py-2">No</th>
                <th width="10%" class="py-2">Tanggal</th>
                <th width="14%" class="py-2">No Bukti (Ref)</th>
                <th width="16%" class="py-2">Akun (COA)</th>
                <th width="24%" class="py-2">Uraian / Keterangan</th>
                <th width="10%" class="py-2">Penerimaan (Rp)</th>
                <th width="10%" class="py-2">Pengeluaran (Rp)</th>
                <th width="12%" class="py-2">Saldo Berjalan (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <!-- LOADING STATE -->
              <tr v-if="isLoading">
                <td colspan="8" class="text-center py-5 text-muted">
                  <div class="spinner-border spinner-border-sm me-2"></div> Menghitung kalkulasi mutasi & likuiditas...
                </td>
              </tr>
              <!-- EMPTY STATE -->
              <tr v-else-if="!isRendered">
                <td colspan="8" class="text-center py-5 text-muted fst-italic">
                  <i class="bi bi-funnel fs-2 d-block mb-2"></i> Silakan atur parameter dan klik "Tarik Laporan".
                </td>
              </tr>

              <!-- DATA RENDERED -->
              <template v-if="isRendered && !isLoading">
                <!-- BARIS SALDO AWAL -->
                <tr class="table-warning fw-bold">
                  <td colspan="7" class="text-end py-2 pe-3 text-uppercase">SALDO AWAL KAS (Sebelum {{ formatDateStr(filters.startDate) }}) :</td>
                  <td class="text-end py-2 text-dark fs-6">Rp {{ formatNominal(summary.saldoAwal) }}</td>
                </tr>

                <tr v-if="mutasiData.length === 0">
                  <td colspan="8" class="text-center py-4 text-muted fst-italic">Tidak ada transaksi mutasi pada rentang tanggal ini.</td>
                </tr>

                <!-- BARIS MUTASI TRANSAKSI -->
                <tr v-for="(item, index) in mutasiData" :key="index" :class="{'bg-light': index % 2 !== 0}">
                  <td class="text-center text-muted">{{ index + 1 }}</td>
                  <td class="text-center fw-bold">{{ formatDate(item.tanggal_transaksi) }}</td>
                  <td class="text-center text-primary fw-bold" style="font-size: 0.75rem;">
                    {{ item.kwitansi_internal }}
                    <span v-if="item.jenis_transaksi" class="badge bg-secondary d-block mt-1 bg-opacity-75 rounded-0">{{ item.jenis_transaksi }}</span>
                  </td>
                  <td class="fw-bold">
                    {{ item.coa_saldo }}<br>
                    <span class="text-muted fw-normal small">{{ item.coas?.nama || '-' }}</span>
                  </td>
                  <td>{{ item.keterangan }}</td>
                  <td class="text-end fw-bold text-success">{{ item.debet > 0 ? formatNominal(item.debet) : '-' }}</td>
                  <td class="text-end fw-bold text-danger">{{ item.kredit > 0 ? formatNominal(item.kredit) : '-' }}</td>
                  <td class="text-end fw-bold text-dark bg-light bg-opacity-50">Rp {{ formatNominal(item.saldo_berjalan) }}</td>
                </tr>

                <!-- BARIS SALDO AKHIR -->
                <tr class="table-success fw-bold">
                  <td colspan="7" class="text-end py-2 pe-3 text-uppercase">SALDO AKHIR KAS (Per {{ formatDateStr(filters.endDate) }}) :</td>
                  <td class="text-end py-2 text-dark fs-6 border-bottom border-dark border-2">Rp {{ formatNominal(summary.saldoAkhir) }}</td>
                </tr>

                <!-- GAP -->
                <tr><td colspan="8" class="border-0 bg-white" style="height: 20px;"></td></tr>

                <!-- ANALISIS LIKUIDITAS (KEWAJIBAN & CASH RATIO) -->
                <tr class="table-danger fw-bold">
                  <td colspan="7" class="text-end py-2 pe-3 text-uppercase">TOTAL KEWAJIBAN / LIABILITAS :</td>
                  <td class="text-end py-2 text-dark fs-6">Rp {{ formatNominal(summary.totalKewajiban) }}</td>
                </tr>
                <tr class="table-dark fw-bold">
                  <td colspan="7" class="text-end py-3 pe-3 text-uppercase fs-6 text-warning">CASH RATIO (Ketersediaan Kas vs Kewajiban) :</td>
                  <td class="text-end py-3 text-warning fs-5">
                    {{ summary.cashRatio }} %
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- AREA CETAK KHUSUS LAPORAN PDF -->
    <div id="print-area" v-if="isRendered">
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
                LAPORAN ARUS KAS
              </h4>
            </td>
          </tr>
        </table>

        <!-- PARAMETER FILTER YANG DIPAKAI -->
        <div class="mb-3 p-2 border border-dark text-dark" style="font-size: 9pt;">
           <div class="fw-bold mb-1 border-bottom border-dark pb-1 text-uppercase">Parameter Laporan:</div>
           <div class="row g-1 mt-1">
             <div class="col-12"><strong>Periode Transaksi:</strong> {{ formatDateStr(filters.startDate) }} s/d {{ formatDateStr(filters.endDate) }}</div>
             <div class="col-12"><strong>Akun Kas / Aset Terpilih:</strong> {{ filters.akunKas.length > 0 ? filters.akunKas.join(', ') : 'Belum memilih akun kas' }}</div>
             <div class="col-12"><strong>Akun Kewajiban Terpilih:</strong> {{ filters.akunKewajiban.length > 0 ? filters.akunKewajiban.join(', ') : 'Default (Semua COA Kepala 2)' }}</div>
           </div>
        </div>

        <table class="w-100 table-print table-bordered border-dark text-dark mb-4">
          <thead class="text-center fw-bold bg-light" style="font-size: 9pt;">
            <tr>
              <th width="4%" class="p-1">No</th>
              <th width="10%" class="p-1">Tanggal</th>
              <th width="15%" class="p-1">No Bukti (Ref)</th>
              <th width="16%" class="p-1">Akun (COA)</th>
              <th width="25%" class="p-1">Uraian / Keterangan</th>
              <th width="10%" class="p-1">Penerimaan</th>
              <th width="10%" class="p-1">Pengeluaran</th>
              <th width="10%" class="p-1">Saldo</th>
            </tr>
          </thead>
          <tbody style="font-size: 8.5pt;">
            <!-- SALDO AWAL -->
            <tr class="fw-bold" style="background-color: #fef08a;">
              <td colspan="7" class="text-end p-2 pe-3 text-uppercase">SALDO AWAL KAS (Sebelum {{ formatDateStr(filters.startDate) }}) :</td>
              <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(summary.saldoAwal) }}</span></div></td>
            </tr>

            <!-- MUTASI -->
            <tr v-for="(item, idx) in mutasiData" :key="idx">
              <td class="text-center p-1">{{ idx + 1 }}</td>
              <td class="text-center p-1">{{ formatDateStr(item.tanggal_transaksi) }}</td>
              <td class="p-1 fw-bold">{{ item.kwitansi_internal }}</td>
              <td class="p-1"><strong>{{ item.coa_saldo }}</strong><br>{{ item.coas?.nama }}</td>
              <td class="p-1">{{ item.keterangan }}</td>
              <td class="p-1 text-end">{{ item.debet > 0 ? formatNominal(item.debet) : '-' }}</td>
              <td class="p-1 text-end">{{ item.kredit > 0 ? formatNominal(item.kredit) : '-' }}</td>
              <td class="p-1 text-end fw-bold">{{ formatNominal(item.saldo_berjalan) }}</td>
            </tr>

            <tr v-if="mutasiData.length === 0">
               <td colspan="8" class="text-center p-3 fst-italic text-muted">Tidak ada transaksi mutasi.</td>
            </tr>

            <!-- SALDO AKHIR -->
            <tr class="fw-bold" style="background-color: #bbf7d0;">
              <td colspan="7" class="text-end p-2 pe-3 text-uppercase">SALDO AKHIR KAS (Per {{ formatDateStr(filters.endDate) }}) :</td>
              <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(summary.saldoAkhir) }}</span></div></td>
            </tr>
            
            <!-- BLANK ROW -->
            <tr><td colspan="8" class="border-start-0 border-end-0 border-dark" style="height:15px;"></td></tr>

            <!-- LIKUIDITAS -->
            <tr class="fw-bold" style="background-color: #fecaca;">
              <td colspan="7" class="text-end p-2 pe-3 text-uppercase">TOTAL KEWAJIBAN / LIABILITAS :</td>
              <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(summary.totalKewajiban) }}</span></div></td>
            </tr>
            <tr class="fw-bold text-uppercase" style="background-color: #e2e8f0;">
              <td colspan="7" class="text-end p-2 pe-3">CASH RATIO :</td>
              <td class="p-2 text-end fs-6">{{ summary.cashRatio }} %</td>
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

// DROPDOWN DATA
const listCOA = ref<any[]>([])

// REPORT STATE
const mutasiData = ref<any[]>([])
const isLoading = ref(false)
const isRendered = ref(false)

const summary = ref({
  saldoAwal: 0,
  saldoAkhir: 0,
  totalKewajiban: 0,
  cashRatio: '0.00'
})

// UI STATE
const activeDropdown = ref<string | null>(null)
const searchQuery = ref('') 

// FILTER STATE
const filters = ref({
  startDate: '',
  endDate: '',
  akunKas: [] as string[],
  akunKewajiban: [] as string[]
})

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) currentUser.value = JSON.parse(userData)
  
  const today = new Date().toISOString().slice(0,10)
  filters.value.startDate = today
  filters.value.endDate = today

  await fetchCompanyProfile()
  await fetchDropdowns()
})

// DROPDOWN LOGIC
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

// FETCH REFERENSI
const fetchCompanyProfile = async () => { try { const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single(); if (data) company.value = data } catch (err) {} }

const fetchDropdowns = async () => {
  try {
    const { data: coaData } = await supabase.from('coas').select('*').order('coa_code', { ascending: true })
    listCOA.value = coaData || []
  } catch (err) {}
}

const resetFilters = () => {
  const today = new Date().toISOString().slice(0,10)
  filters.value = {
    startDate: today, endDate: today, akunKas: [], akunKewajiban: []
  }
  isRendered.value = false
  mutasiData.value = []
}

// BUILD OR STRING UNTUK MULTI-SELECT COA
const buildCoaOrString = (arr: string[]) => {
  if (!arr || arr.length === 0) return ''
  return arr.map(code => `coa_saldo.like.${code}%`).join(',')
}

// MAIN FETCH LOGIC
const fetchData = async () => {
  if (filters.value.akunKas.length === 0) {
    AppAlert.error('Validasi', 'Anda harus memilih minimal 1 Akun Kas / Aset untuk ditarik.')
    return
  }
  if (!filters.value.startDate || !filters.value.endDate) {
    AppAlert.error('Validasi', 'Periode tanggal tidak boleh kosong.')
    return
  }

  isLoading.value = true
  isRendered.value = false
  mutasiData.value = []
  
  summary.value = { saldoAwal: 0, saldoAkhir: 0, totalKewajiban: 0, cashRatio: '0.00' }

  AppAlert.loading('Menghitung kalkulasi likuiditas...')

  try {
    const kasOrString = buildCoaOrString(filters.value.akunKas)
    const kwjOrString = filters.value.akunKewajiban.length > 0 ? buildCoaOrString(filters.value.akunKewajiban) : 'coa_saldo.like.2%'

    // 1. FETCH SALDO AWAL KAS (Sebelum StartDate)
    const { data: d_awal, error: e_awal } = await supabase.from('transaksi')
        .select('debet, kredit')
        .lt('tanggal_transaksi', filters.value.startDate)
        .or(kasOrString)
    if (e_awal) throw e_awal

    let sumD_Awal = 0; let sumK_Awal = 0
    if (d_awal) { d_awal.forEach((x:any) => { sumD_Awal += Number(x.debet); sumK_Awal += Number(x.kredit) }) }
    const netSaldoAwal = sumD_Awal - sumK_Awal 
    summary.value.saldoAwal = netSaldoAwal

    // 2. FETCH MUTASI KAS (Range Start - End)
    const { data: d_mutasi, error: e_mutasi } = await supabase.from('transaksi')
        .select(`*, coas:coa_saldo(nama)`)
        .gte('tanggal_transaksi', filters.value.startDate)
        .lte('tanggal_transaksi', filters.value.endDate)
        .or(kasOrString)
        .order('tanggal_transaksi', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(10000)
    if (e_mutasi) throw e_mutasi

    let runningSaldo = netSaldoAwal
    const mappedMutasi = (d_mutasi || []).map((m: any) => {
        runningSaldo += (Number(m.debet) - Number(m.kredit))
        return { ...m, saldo_berjalan: runningSaldo }
    })
    mutasiData.value = mappedMutasi
    summary.value.saldoAkhir = runningSaldo

    // 3. FETCH TOTAL KEWAJIBAN (Semua sebelum & sampai EndDate)
    const { data: d_kwj, error: e_kwj } = await supabase.from('transaksi')
        .select('debet, kredit')
        .lte('tanggal_transaksi', filters.value.endDate)
        .or(kwjOrString)
    if (e_kwj) throw e_kwj

    let sumD_Kwj = 0; let sumK_Kwj = 0
    if (d_kwj) { d_kwj.forEach((x:any) => { sumD_Kwj += Number(x.debet); sumK_Kwj += Number(x.kredit) }) }
    const netKewajiban = sumK_Kwj - sumD_Kwj 
    summary.value.totalKewajiban = netKewajiban

    // 4. CALCULATE CASH RATIO
    if (netKewajiban > 0) {
      const ratio = (runningSaldo / netKewajiban) * 100
      summary.value.cashRatio = ratio.toFixed(2)
    } else {
      summary.value.cashRatio = runningSaldo > 0 ? 'Maksimal (Kewajiban 0)' : '0.00'
    }

    isRendered.value = true
    AppAlert.close()
  } catch (err: any) {
    AppAlert.error('Gagal', err.message || 'Gagal menghitung cash flow.')
  } finally {
    isLoading.value = false
  }
}

const printLaporan = async () => {
  await nextTick()
  setTimeout(() => window.print(), 400)
}

// EXPORT TO EXCEL
const exportToExcel = () => {
  if (!isRendered.value) return

  let tsvContent = `LAPORAN ARUS KAS & LIKUIDITAS\n`
  tsvContent += `Periode\t: ${formatDateStr(filters.value.startDate)} s/d ${formatDateStr(filters.value.endDate)}\n`
  tsvContent += `Akun Kas/Aset\t: ${filters.value.akunKas.join(', ')}\n`
  tsvContent += `Akun Kewajiban\t: ${filters.value.akunKewajiban.length > 0 ? filters.value.akunKewajiban.join(', ') : 'Semua Akun Kepala 2'}\n\n`

  tsvContent += "No\tTanggal\tNo Bukti (Ref)\tCOA\tNama Akun\tUraian\tPenerimaan (Debet)\tPengeluaran (Kredit)\tSaldo Berjalan\n"

  tsvContent += `\t\t\t\t\tSALDO AWAL KAS\t\t\t${summary.value.saldoAwal}\n`

  mutasiData.value.forEach((item, index) => {
    const no = index + 1
    const tgl = formatDateStr(item.tanggal_transaksi)
    const bukti = item.kwitansi_internal || ''
    const coa = item.coa_saldo || ''
    const namaAkun = item.coas?.nama || ''
    const uraian = (item.keterangan || '').replace(/\n/g, ' ')
    const debet = item.debet || 0
    const kredit = item.kredit || 0
    const saldo = item.saldo_berjalan || 0

    tsvContent += `${no}\t${tgl}\t${bukti}\t${coa}\t${namaAkun}\t${uraian}\t${debet}\t${kredit}\t${saldo}\n`
  })

  tsvContent += `\t\t\t\t\tSALDO AKHIR KAS\t\t\t${summary.value.saldoAkhir}\n\n`
  tsvContent += `\t\t\t\t\tTOTAL KEWAJIBAN\t\t\t${summary.value.totalKewajiban}\n`
  tsvContent += `\t\t\t\t\tCASH RATIO (%)\t\t\t${summary.value.cashRatio}\n`

  const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `CashFlow_${formatDateStr(new Date().toISOString())}.xls`)
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// FORMATTERS
const formatDate = (dateStr: string) => { if (!dateStr) return '-'; return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }
const formatDateStr = (dateStr: string) => {
  if (!dateStr) return '-'; const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth()+1).padStart(2, '0')}-${d.getFullYear()}`
}
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'; const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const formatNominal = (angka: number) => { if (angka === undefined || angka === null) return '0'; return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka) }

</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.dropdown-container { position: relative; } 
.custom-dropdown-menu { max-height: 300px; overflow-y: auto; z-index: 1070; }
.hover-bg:hover { background-color: #f8f9fa; }
#print-area { display: none; }
</style>

<style>
@media print {
  .screen-only, .sidebar, .topbar, .d-print-none, aside, nav, header { display: none !important; }
  .main-content, .content-area, .app-layout, body, html, #app {
    margin: 0 !important; padding: 0 !important; background-color: white !important; width: 100% !important;
    max-width: 100% !important; height: auto !important; overflow: visible !important; position: static !important;
  }
  #print-area {
    display: block !important; width: 100% !important; padding: 10px !important; color: black !important;
  }
  @page { margin: 10mm; size: landscape; } 
  .table-print { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  .table-print th, .table-print td { border: 1px solid black !important; color: black !important; padding: 4px 6px !important; }
  .bg-light { background-color: #e9ecef !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .text-dark { color: black !important; }
}
</style>