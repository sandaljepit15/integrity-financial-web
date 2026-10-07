<template>
  <div class="laporan-rekap-hutang">
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Laporan Analisa Likuiditas & Hutang</h4>
          <p class="text-muted small mb-0">Manajemen Kartu Pinjaman (SPK) dan Analisa Ketersediaan Aset (Coverage Ratio).</p>
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

      <!-- KOTAK FILTER KOMPREHENSIF -->
      <div class="card border border-secondary shadow-sm rounded-0 mb-4" :class="isFilterApplied ? 'bg-secondary bg-opacity-10' : 'bg-light bg-opacity-50'">
        <div class="card-body p-3 position-relative">
          <div v-if="isFilterApplied" class="position-absolute top-0 end-0 mt-2 me-3"><span class="badge bg-success shadow-sm"><i class="bi bi-lock-fill me-1"></i> Terkunci</span></div>
          
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small fw-bold text-dark mb-1">Maks. Tgl Perjanjian / SPK <i class="bi bi-info-circle ms-1" title="Hanya menarik kontrak/SPK yang dibuat sebelum atau sama dengan tanggal ini."></i></label>
              <input type="date" class="form-control form-control-sm rounded-0 border-secondary fw-bold" v-model="filters.tglSPK" :disabled="isFilterApplied">
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold text-danger mb-1">Cut-Off Transaksi (Mutasi) <i class="bi bi-info-circle ms-1" title="Menghitung saldo hutang & pembayaran HANYA sampai dengan tanggal ini."></i></label>
              <input type="date" class="form-control form-control-sm rounded-0 border-secondary fw-bold text-danger" v-model="filters.tglCutOff" :disabled="isFilterApplied">
            </div>
            
            <!-- CUSTOM DROPDOWN VUE UNTUK SELURUH ASET (KAS/BANK/PIUTANG) -->
            <div class="col-md-6">
              <label class="form-label small fw-bold text-success mb-1">Pilih Variabel Aset (Kas / Bank / Piutang) untuk Analisa</label>
              <div class="position-relative kas-dropdown-container">
                <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0 border-secondary"
                     :class="{'bg-light opacity-75': isFilterApplied}"
                     @click="!isFilterApplied && (isKasDropdownOpen = !isKasDropdownOpen)">
                  <span v-if="filters.kasCoas.length === 0" class="text-muted">-- Pilih Akun Aset --</span>
                  <span v-else class="fw-bold text-success">{{ filters.kasCoas.length }} Akun Dipilih</span>
                  <i class="bi bi-chevron-down small text-muted"></i>
                </div>

                <div v-if="isKasDropdownOpen" class="position-absolute bg-white border border-secondary rounded-0 shadow mt-1 p-2 w-100" style="max-height: 250px; overflow-y: auto; z-index: 1050;">
                  <div v-if="listKas.length === 0" class="text-muted small text-center p-2 fst-italic">
                    Data COA Aset (awalan 1) tidak ditemukan.
                  </div>
                  <div v-for="coa in listKas" :key="coa.coa_code" class="form-check small mb-2 cursor-pointer">
                    <input class="form-check-input border-secondary cursor-pointer" type="checkbox" :value="coa.coa_code" :id="'kas-'+coa.coa_code" v-model="filters.kasCoas">
                    <label class="form-check-label w-100 cursor-pointer text-dark" :for="'kas-'+coa.coa_code">{{ coa.coa_code }} - {{ coa.nama }}</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- DASHBOARD ANALISA LIKUIDITAS -->
      <div class="row g-3 mb-4" v-if="isFilterApplied">
        <div class="col-md-4">
          <div class="card border-0 bg-success text-white shadow-sm rounded-0 p-3 h-100">
            <div class="small fw-bold opacity-75 mb-1 text-uppercase">Total Saldo Aset Terpilih</div>
            <h3 class="mb-0 fw-bold tracking-wide">Rp {{ formatNominal(totalKas) }}</h3>
            <div class="small mt-2 opacity-75"><i class="bi bi-wallet2 me-1"></i> Dari {{ filters.kasCoas.length }} akun variabel likuiditas.</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 bg-danger text-white shadow-sm rounded-0 p-3 h-100">
            <div class="small fw-bold opacity-75 mb-1 text-uppercase">Total Tunggakan Hutang (Cut-Off)</div>
            <h3 class="mb-0 fw-bold tracking-wide">Rp {{ formatNominal(totals.sisa) }}</h3>
            <div class="small mt-2 opacity-75"><i class="bi bi-calculator me-1"></i> Total baki debet saat cut-off.</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm rounded-0 p-3 h-100" :class="cashCoverageRatio >= 100 ? 'bg-primary text-white' : (cashCoverageRatio > 50 ? 'bg-warning text-dark' : 'bg-dark text-white')">
            <div class="small fw-bold opacity-75 mb-1 text-uppercase">Asset Coverage Ratio (ACR)</div>
            <div class="d-flex align-items-end gap-2">
              <h3 class="mb-0 fw-bold tracking-wide">{{ cashCoverageRatio.toFixed(1) }}%</h3>
              <span class="small fw-bold opacity-75 mb-1">ter-cover</span>
            </div>
            <div class="progress mt-2 rounded-0 bg-white bg-opacity-25" style="height: 6px;">
              <div class="progress-bar bg-white" role="progressbar" :style="{ width: cashCoverageRatio + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex mb-3 align-items-center" v-if="reportData.length > 0">
        <div class="input-group input-group-sm w-25">
          <span class="input-group-text rounded-0 bg-white border-secondary"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control rounded-0 border-start-0 border-secondary ps-0" v-model="searchTableQuery" placeholder="Cari nama pihak / SPK...">
        </div>
      </div>

      <!-- TABEL DATA UTAMA -->
      <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden mb-3">
        <div class="card-header bg-dark text-white p-2 px-3 d-flex justify-content-between align-items-center rounded-0">
          <div class="fw-bold" style="font-size: 0.9rem;"><i class="bi bi-journal-check me-2"></i>Rekapitulasi Outstanding Hutang</div>
          <div>
            <button class="btn btn-sm btn-success fw-bold rounded-0 py-0 me-2" @click="exportSummaryToExcel" :disabled="filteredReportData.length === 0">
              <i class="bi bi-file-earmark-excel me-1"></i> Excel
            </button>
            <button class="btn btn-sm btn-light fw-bold rounded-0 py-0" @click="printLaporan('summary')" :disabled="filteredReportData.length === 0">
              <i class="bi bi-printer me-1"></i> Cetak Laporan
            </button>
          </div>
        </div>
        <div class="table-responsive" style="max-height: 60vh;">
          <table class="table table-sm table-hover table-bordered align-middle mb-0" style="font-size: 0.85rem; min-width: 1200px;">
            <thead class="table-secondary text-center align-middle sticky-top">
              <tr>
                <th width="4%" class="py-2">No</th>
                <th width="18%" class="py-2">Pihak Lawan</th>
                <th width="20%" class="py-2">Identitas SPK & Uraian</th>
                <th width="10%" class="py-2">Tgl Perjanjian</th>
                <th width="14%" class="py-2 text-danger">Total Tagihan</th>
                <th width="14%" class="py-2 text-success">Total Terbayar</th>
                <th width="14%" class="py-2">Sisa (Outstanding)</th>
                <th width="6%" class="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading"><td colspan="8" class="text-center py-5"><div class="spinner-border spinner-border-sm me-2"></div> Menghitung agregasi...</td></tr>
              <tr v-else-if="reportData.length === 0"><td colspan="8" class="text-center py-5 text-muted fst-italic">Silakan atur periode dan klik "Tarik Laporan".</td></tr>
              <tr v-else-if="filteredReportData.length === 0"><td colspan="8" class="text-center py-5 text-muted fst-italic">Tidak ada data yang cocok dengan pencarian Anda.</td></tr>
              
              <tr v-for="(item, index) in filteredReportData" :key="item.id" :class="{'bg-light': index % 2 !== 0}">
                <td class="text-center text-muted">{{ index + 1 }}</td>
                <td class="fw-bold text-dark">{{ item.nama }}</td>
                <td>
                  <div class="fw-bold text-primary">{{ item.spk }}</div>
                  <div class="small text-muted text-truncate" style="max-width: 250px;" :title="item.keterangan">{{ item.keterangan }}</div>
                </td>
                <td class="text-center">{{ formatDateStr(item.tgl_perjanjian) }}</td>
                <td class="text-end fw-bold text-danger">Rp {{ formatNominal(item.tagihan) }}</td>
                <td class="text-end fw-bold text-success">Rp {{ formatNominal(item.bayar) }}</td>
                <td class="text-end fw-bold bg-light bg-opacity-50" :class="item.sisa > 0 ? 'text-primary' : 'text-muted'">Rp {{ formatNominal(item.sisa) }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-dark rounded-0 border" @click="openKartuHutang(item)" title="Buka Kartu Hutang / Mutasi">
                    <i class="bi bi-search"></i>
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="!isLoading && filteredReportData.length > 0" class="table-dark fw-bold">
              <tr>
                <td colspan="4" class="text-end py-2 pe-3 text-uppercase">TOTAL KESELURUHAN (CUT-OFF) :</td>
                <td class="text-end py-2 text-danger">Rp {{ formatNominal(totals.tagihan) }}</td>
                <td class="text-end py-2 text-success">Rp {{ formatNominal(totals.bayar) }}</td>
                <td class="text-end py-2 text-warning fs-6">Rp {{ formatNominal(totals.sisa) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL POPUP: KARTU HUTANG (LIFETIME) -->
    <div v-if="isKartuOpen && selectedMaster" class="custom-modal-overlay screen-only">
      <div class="custom-modal-card card border-0 shadow-lg rounded-0 overflow-hidden" style="max-width: 1100px; width: 95%;">
        <div class="card-header bg-dark text-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center flex-shrink-0 rounded-0">
          <h5 class="fw-bold mb-0 tracking-wide text-uppercase">
            <i class="bi bi-card-list me-2 text-warning"></i> Kartu Pinjaman / Baki Debet
          </h5>
          <div>
            <button class="btn btn-sm btn-success fw-bold px-3 me-2 rounded-0" @click="exportKartuToExcel">
              <i class="bi bi-file-earmark-excel me-1"></i> Excel
            </button>
            <button class="btn btn-sm btn-light fw-bold px-3 me-2 rounded-0" @click="printLaporan('kartu')">
              <i class="bi bi-printer me-1"></i> Cetak Kartu
            </button>
            <button type="button" class="btn-close btn-close-white" @click="closeKartu"></button>
          </div>
        </div>

        <div class="card-body p-0 modal-body-scroll custom-scrollbar bg-light">
          <!-- HEADER KARTU (ALA BANK) -->
          <div class="bg-white p-4 border-bottom">
            <div class="row text-dark" style="font-size: 0.9rem;">
              <div class="col-md-6">
                <table class="table table-sm table-borderless mb-0">
                  <tr><td width="30%" class="fw-bold py-1">Pihak / Kreditur</td><td width="5%" class="py-1">:</td><td class="fw-bold text-uppercase py-1">{{ selectedMaster.nama }}</td></tr>
                  <tr><td class="fw-bold py-1">Nomor SPK/Ref</td><td class="py-1">:</td><td class="fw-bold text-primary py-1">{{ selectedMaster.spk }}</td></tr>
                  <tr><td class="fw-bold py-1">Uraian Master</td><td class="py-1">:</td><td class="py-1">{{ selectedMaster.keterangan }}</td></tr>
                </table>
              </div>
              <div class="col-md-6">
                <table class="table table-sm table-borderless mb-0">
                  <tr><td width="35%" class="fw-bold py-1 text-end">Tgl. Perjanjian</td><td width="5%" class="py-1">:</td><td class="py-1">{{ formatDateStr(selectedMaster.tgl_perjanjian) }}</td></tr>
                  <tr><td class="fw-bold py-1 text-end">Total Plafon / Tagihan</td><td class="py-1">:</td><td class="fw-bold text-danger py-1">Rp {{ formatNominal(kartuTotals.tagihan) }}</td></tr>
                  <tr><td class="fw-bold py-1 text-end">Sisa Outstanding Saat Ini</td><td class="py-1">:</td><td class="fw-bold text-primary fs-6 py-0 align-middle border-bottom border-dark border-2 d-inline-block">Rp {{ formatNominal(kartuTotals.sisa) }}</td></tr>
                </table>
              </div>
            </div>
            <div class="alert alert-warning py-2 mb-0 mt-3 rounded-0 small border-warning">
              <i class="bi bi-info-circle me-1"></i> Kartu ini menampilkan <strong>seluruh histori (Lifetime)</strong> tagihan dan pembayaran dari awal hingga saat ini, mengabaikan filter cut-off pada dashboard.
            </div>
          </div>

          <!-- TABEL LEDGER KARTU -->
          <div class="p-3">
            <table class="table table-sm table-bordered table-hover align-middle bg-white mb-0 shadow-sm" style="font-size: 0.85rem;">
              <thead class="text-center align-middle bg-secondary text-white">
                <tr>
                  <th width="10%" class="py-2">Tanggal</th>
                  <th width="18%" class="py-2">No. Bukti / Reff</th>
                  <th width="28%" class="py-2">Uraian Mutasi</th>
                  <th width="14%" class="py-2">Tagihan (+)</th>
                  <th width="14%" class="py-2">Pembayaran (-)</th>
                  <th width="16%" class="py-2">Sisa Baki Debet</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="kartuMutasi.length === 0"><td colspan="6" class="text-center py-4 text-muted">Belum ada pergerakan transaksi.</td></tr>
                <tr v-for="(row, idx) in kartuMutasi" :key="idx" :class="row.jenis === 'TAGIHAN' ? 'bg-danger bg-opacity-10' : 'bg-success bg-opacity-10'">
                  <td class="text-center fw-bold">{{ formatDateStr(row.tanggal) }}</td>
                  <td class="text-center">{{ row.no_bukti }}</td>
                  <td>
                    <span v-if="row.jenis === 'TAGIHAN'" class="badge bg-danger me-2 rounded-0">Tagihan</span>
                    <span v-else class="badge bg-success me-2 rounded-0">Setoran</span>
                    {{ row.keterangan }}
                  </td>
                  <td class="text-end fw-bold text-danger">{{ row.tagihan > 0 ? formatNominal(row.tagihan) : '' }}</td>
                  <td class="text-end fw-bold text-success">{{ row.bayar > 0 ? formatNominal(row.bayar) : '' }}</td>
                  <td class="text-end fw-bold text-dark bg-white border-start border-2 border-dark">Rp {{ formatNominal(row.running_balance) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- AREA CETAK KHUSUS LAPORAN PDF -->
    <!-- ============================================================== -->
    <div id="print-area" v-if="printDataMode !== null">
      <div class="print-container">
        
        <!-- CETAK 1: DASHBOARD SUMMARY -->
        <template v-if="printDataMode === 'summary'">
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
                  REKAP OUTSTANDING HUTANG
                </h4>
              </td>
            </tr>
          </table>

          <div class="mb-3 p-2 border border-dark text-dark" style="font-size: 9pt;">
             <div class="fw-bold mb-1 border-bottom border-dark pb-1 text-uppercase">Parameter Analisa Cut-Off:</div>
             <div class="row g-1 mt-1">
               <div class="col-6"><strong>Maks. Tgl SPK:</strong> {{ formatDateStr(filters.tglSPK) }}</div>
               <div class="col-6 text-danger"><strong>Cut-Off Transaksi:</strong> {{ formatDateStr(filters.tglCutOff) }}</div>
               <div class="col-12 mt-1 border-top border-dark pt-1">
                 <strong>Analisa Likuiditas:</strong> Saldo Aset Rp {{ formatNominal(totalKas) }} 
                 | Total Hutang Rp {{ formatNominal(totals.sisa) }} 
                 | <strong>ACR: {{ cashCoverageRatio.toFixed(1) }}%</strong>
               </div>
             </div>
          </div>

          <table class="w-100 table-print table-bordered border-dark text-dark mb-4">
            <thead class="text-center fw-bold bg-light" style="font-size: 9pt;">
              <tr>
                <th width="4%" class="p-1">No</th>
                <th width="20%" class="p-1">Pihak Lawan</th>
                <th width="26%" class="p-1">SPK & Uraian</th>
                <th width="15%" class="p-1">Total Tagihan</th>
                <th width="15%" class="p-1">Total Terbayar</th>
                <th width="20%" class="p-1">Sisa (Outstanding)</th>
              </tr>
            </thead>
            <tbody style="font-size: 8.5pt;">
              <tr v-for="(item, idx) in filteredReportData" :key="idx">
                <td class="text-center p-1">{{ idx + 1 }}</td>
                <td class="p-1 fw-bold">{{ item.nama }}</td>
                <td class="p-1"><strong>{{ item.spk }}</strong><br><span style="font-size: 7.5pt;">{{ item.keterangan }}</span></td>
                <td class="p-1 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(item.tagihan) }}</span></div></td>
                <td class="p-1 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(item.bayar) }}</span></div></td>
                <td class="p-1 text-end fw-bold"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(item.sisa) }}</span></div></td>
              </tr>
              <tr class="fw-bold bg-light" style="font-size: 9.5pt;">
                <td colspan="3" class="text-end p-2 pe-3 text-uppercase">TOTAL (CUT-OFF) :</td>
                <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(totals.tagihan) }}</span></div></td>
                <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(totals.bayar) }}</span></div></td>
                <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(totals.sisa) }}</span></div></td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- CETAK 2: KARTU PINJAMAN (LIFETIME) -->
        <template v-if="printDataMode === 'kartu' && selectedMaster">
           <table class="w-100 table-print border-0 mb-3">
            <tr>
              <td width="65%" class="p-0 border-0 align-middle">
                <div class="d-flex align-items-center">
                  <img v-if="company.logo_url" :src="company.logo_url" alt="Logo" style="max-height: 50px; margin-right: 15px;">
                  <div>
                    <h4 class="mb-0 fw-bold text-dark text-uppercase" style="font-size: 11pt; letter-spacing: 1px;">{{ company.nama || 'NAMA INSTANSI' }}</h4>
                    <div v-if="company.sub_nama" style="font-size: 9pt; font-weight: bold; margin-bottom: 2px;">{{ company.sub_nama }}</div>
                  </div>
                </div>
              </td>
              <td width="35%" class="text-end border-0 align-bottom pb-1">
                <h4 class="mb-0 fw-bold text-dark text-uppercase" style="font-size: 12pt; border-bottom: 2px solid black; display: inline-block;">
                  KARTU PINJAMAN / BAKI DEBET
                </h4>
              </td>
            </tr>
          </table>

          <div class="border border-dark p-2 mb-3 text-dark" style="font-size: 9pt;">
            <table class="w-100 border-0">
              <tr>
                <td width="15%" class="fw-bold py-1">Pihak / Kreditur</td><td width="2%" class="py-1">:</td><td width="33%" class="fw-bold text-uppercase py-1">{{ selectedMaster.nama }}</td>
                <td width="15%" class="fw-bold py-1 text-end pe-2">Tgl. Perjanjian</td><td width="2%" class="py-1">:</td><td width="33%" class="py-1 fw-bold">{{ formatDateStr(selectedMaster.tgl_perjanjian) }}</td>
              </tr>
              <tr>
                <td class="fw-bold py-1">Nomor SPK</td><td class="py-1">:</td><td class="py-1 fw-bold">{{ selectedMaster.spk }}</td>
                <td class="fw-bold py-1 text-end pe-2">Total Tagihan</td><td class="py-1">:</td><td class="py-1 fw-bold">Rp {{ formatNominal(kartuTotals.tagihan) }}</td>
              </tr>
              <tr>
                <td class="fw-bold py-1">Uraian Master</td><td class="py-1">:</td><td class="py-1" style="font-size: 8pt;">{{ selectedMaster.keterangan }}</td>
                <td class="fw-bold py-1 text-end pe-2">Sisa Outstanding</td><td class="py-1">:</td><td class="py-1 fw-bold text-uppercase fs-6">Rp {{ formatNominal(kartuTotals.sisa) }}</td>
              </tr>
            </table>
          </div>

          <table class="w-100 table-print table-bordered border-dark text-dark">
            <thead class="text-center fw-bold bg-light" style="font-size: 9pt;">
              <tr>
                <th width="10%" class="p-2">Tanggal</th>
                <th width="18%" class="p-2">No. Bukti / Reff</th>
                <th width="28%" class="p-2">Uraian Mutasi</th>
                <th width="14%" class="p-2">Tagihan (+)</th>
                <th width="14%" class="p-2">Pembayaran (-)</th>
                <th width="16%" class="p-2">Saldo Baki Debet</th>
              </tr>
            </thead>
            <tbody style="font-size: 8.5pt;">
              <tr v-if="kartuMutasi.length === 0"><td colspan="6" class="text-center py-4 text-muted">Belum ada pergerakan transaksi.</td></tr>
              <tr v-for="(row, idx) in kartuMutasi" :key="idx">
                <td class="text-center p-1">{{ formatDateStr(row.tanggal) }}</td>
                <td class="text-center p-1">{{ row.no_bukti }}</td>
                <td class="p-1">{{ row.keterangan }}</td>
                <td class="p-1 text-end"><div class="d-flex justify-content-between"><span>{{ row.tagihan > 0 ? 'Rp' : '' }}</span> <span>{{ row.tagihan > 0 ? formatNominal(row.tagihan) : '' }}</span></div></td>
                <td class="p-1 text-end"><div class="d-flex justify-content-between"><span>{{ row.bayar > 0 ? 'Rp' : '' }}</span> <span>{{ row.bayar > 0 ? formatNominal(row.bayar) : '' }}</span></div></td>
                <td class="p-1 text-end fw-bold"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(row.running_balance) }}</span></div></td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- FOOTER TANDA TANGAN BERSAMA -->
        <div class="d-flex justify-content-between align-items-end mt-4 text-dark" style="page-break-inside: avoid;">
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
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'

const company = ref<any>({}) 
const currentUser = ref<any>(null)
const listKas = ref<any[]>([])

const isLoading = ref(false)
const isFilterApplied = ref(false)
const searchTableQuery = ref('')

// VARIABEL KONTROL UNTUK CUSTOM DROPDOWN
const isKasDropdownOpen = ref(false)

// STATE DATA DASHBOARD
const reportData = ref<any[]>([])
const totalKas = ref(0)

// STATE POPUP KARTU
const isKartuOpen = ref(false)
const selectedMaster = ref<any>(null)
const kartuMutasi = ref<any[]>([])

const printDataMode = ref<'summary' | 'kartu' | null>(null)

const filters = ref({ 
  tglSPK: '', 
  tglCutOff: '',
  kasCoas: [] as string[]
})

// FUNGSI DETEKSI KLIK DI LUAR UNTUK MENUTUP DROPDOWN
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.kas-dropdown-container')) {
    isKasDropdownOpen.value = false
  }
}

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) currentUser.value = JSON.parse(userData)
  
  const today = new Date().toISOString().slice(0,10)
  filters.value.tglSPK = today
  filters.value.tglCutOff = today
  
  await fetchCompanyProfile()
  await fetchKasCoas()

  // Daftarkan event listener untuk custom dropdown
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // Hapus event listener saat komponen dihancurkan
  document.removeEventListener('click', handleClickOutside)
})

const fetchCompanyProfile = async () => { try { const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single(); if (data) company.value = data } catch (err) {} }

const fetchKasCoas = async () => {
  try {
    const { data } = await supabase.from('coas').select('coa_code, nama').eq('sifat', 'D').order('coa_code', { ascending: true })
    // Hanya menampilkan seluruh akun Aset (awalan angka '1') agar Piutang dll bisa dipilih
    if (data) listKas.value = data.filter((c: any) => c.coa_code.startsWith('1'))
  } catch (err) {}
}

const unlockFilters = () => { isFilterApplied.value = false }

const fetchData = async () => {
  if (!filters.value.tglSPK || !filters.value.tglCutOff) return AppAlert.error('Validasi', 'Kedua parameter tanggal wajib diisi.')
  
  isLoading.value = true
  reportData.value = []
  searchTableQuery.value = ''
  totalKas.value = 0
  AppAlert.loading('Mengkalkulasi Analisa Hutang & Likuiditas...')

  try {
    // 1. HITUNG SALDO ASET TERPILIH
    if (filters.value.kasCoas.length > 0) {
      const { data: trxKas, error: errKas } = await supabase.from('transaksi')
        .select('debet, kredit, coa_saldo')
        .in('coa_saldo', filters.value.kasCoas)
      
      if (!errKas && trxKas) {
        let kas = 0
        trxKas.forEach((t: any) => kas += (Number(t.debet) - Number(t.kredit)))
        totalKas.value = kas > 0 ? kas : 0
      }
    }

// 2. TARIK MASTER (Dibatasi Tgl SPK / Perjanjian)
    const { data: masterData, error: errMaster } = await supabase.from('master_hutang')
      // MENGGUNAKAN NAMA KOLOM DARI DDL ANDA
      .select('id, nomor_perjanjian, tanggal_mulai, keterangan, created_at, pihak_lawan(nama)')
      .lte('created_at', `${filters.value.tglSPK}T23:59:59.999Z`) 

    if (errMaster) throw errMaster
    
    const calcMap = new Map()
    ;(masterData || []).forEach((m: any) => {
      // Menggunakan tanggal_mulai sesuai DDL
      const tglMst = m.tanggal_mulai || m.created_at.slice(0, 10)
      if (tglMst <= filters.value.tglSPK) {
        calcMap.set(m.id, { 
          id: m.id, 
          nama: m.pihak_lawan?.nama || 'Unknown', 
          spk: m.nomor_perjanjian || '-', // Menggunakan nomor_perjanjian
          tgl_perjanjian: tglMst,
          keterangan: m.keterangan || '-',
          tagihan: 0, bayar: 0, sisa: 0 
        })
      }
    })

    if (calcMap.size === 0) {
      isFilterApplied.value = true; AppAlert.close(); isLoading.value = false; return
    }

    const masterIds = Array.from(calcMap.keys())

    // 3. TARIK TAGIHAN (Dibatasi Cut-Off)
    const { data: tagihanData, error: errTag } = await supabase.from('tagihan_hutang')
      .select('master_hutang_id, jumlah_tagihan')
      .in('master_hutang_id', masterIds)
      .lte('jatuh_tempo', filters.value.tglCutOff)
    
    if (errTag) throw errTag

    ;(tagihanData || []).forEach((t: any) => {
      const row = calcMap.get(t.master_hutang_id)
      if (row) row.tagihan += Number(t.jumlah_tagihan)
    })

    // 4. TARIK PEMBAYARAN (Dibatasi Cut-Off)
    const { data: bayarData, error: errBayar } = await supabase.from('pembayaran_hutang')
      .select('master_hutang_id, jumlah_bayar')
      .in('master_hutang_id', masterIds)
      .lte('tanggal_pembayaran', filters.value.tglCutOff)
    
    if (errBayar) throw errBayar

    ;(bayarData || []).forEach((p: any) => {
      const row = calcMap.get(p.master_hutang_id)
      if (row) row.bayar += Number(p.jumlah_bayar)
    })

    reportData.value = Array.from(calcMap.values()).map(r => {
      r.sisa = r.tagihan - r.bayar
      return r
    }).filter(r => r.tagihan !== 0 || r.bayar !== 0 || r.sisa !== 0)
      .sort((a, b) => b.sisa - a.sisa)

    isFilterApplied.value = true
    AppAlert.close()
  } catch (err: any) { AppAlert.error('Gagal', err.message); console.error(err) } 
  finally { isLoading.value = false }
}

const filteredReportData = computed(() => {
  if (!searchTableQuery.value) return reportData.value
  const q = searchTableQuery.value.toLowerCase()
  return reportData.value.filter(item => item.nama.toLowerCase().includes(q) || item.spk.toLowerCase().includes(q))
})

const totals = computed(() => {
  return filteredReportData.value.reduce((acc, curr) => {
    acc.tagihan += curr.tagihan; acc.bayar += curr.bayar; acc.sisa += curr.sisa
    return acc
  }, { tagihan: 0, bayar: 0, sisa: 0 })
})

const cashCoverageRatio = computed(() => {
  if (totals.value.sisa === 0) return 100
  const ratio = (totalKas.value / totals.value.sisa) * 100
  return ratio > 999 ? 999 : ratio // Limit tampilan persen
})

// ==========================================
// FUNGSI POPUP KARTU HUTANG (LIFETIME)
// ==========================================
const openKartuHutang = async (master: any) => {
  AppAlert.loading('Menarik Histori Rekening Koran...')
  try {
    selectedMaster.value = master
    kartuMutasi.value = []

    // Tarik Tagihan TANPA FILTER TANGGAL
    const { data: tags } = await supabase.from('tagihan_hutang')
      .select('nomor_tagihan, tanggal_tagihan, jumlah_tagihan, keterangan, created_at')
      .eq('master_hutang_id', master.id)
    
    // Tarik Pembayaran TANPA FILTER TANGGAL
    const { data: pays } = await supabase.from('pembayaran_hutang')
      .select('no_bukti_internal, tanggal_pembayaran, jumlah_bayar, keterangan, created_at')
      .eq('master_hutang_id', master.id)
    
    const combined: any[] = []
    
    ;(tags || []).forEach((t: any) => {
      combined.push({
        jenis: 'TAGIHAN', tanggal: t.tanggal_tagihan, no_bukti: t.nomor_tagihan,
        keterangan: t.keterangan || 'Penambahan Tagihan',
        tagihan: Number(t.jumlah_tagihan), bayar: 0, created_at: t.created_at
      })
    })

    ;(pays || []).forEach((p: any) => {
      combined.push({
        jenis: 'PEMBAYARAN', tanggal: p.tanggal_pembayaran, no_bukti: p.no_bukti_internal,
        keterangan: p.keterangan || 'Setoran Pelunasan',
        tagihan: 0, bayar: Number(p.jumlah_bayar), created_at: p.created_at
      })
    })

    // Sort kronologis (Berdasarkan Tanggal, lalu Created_at)
    combined.sort((a, b) => {
      if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal)
      return a.created_at.localeCompare(b.created_at)
    })

    // Hitung Running Balance
    let running = 0
    combined.forEach(mut => {
      running += mut.tagihan
      running -= mut.bayar
      mut.running_balance = running
    })

    kartuMutasi.value = combined
    isKartuOpen.value = true
    AppAlert.close()
  } catch (err: any) { AppAlert.error('Gagal', err.message) }
}

const closeKartu = () => {
  isKartuOpen.value = false
  selectedMaster.value = null
}

const kartuTotals = computed(() => {
  let t = 0, b = 0
  kartuMutasi.value.forEach(m => { t += m.tagihan; b += m.bayar })
  return { tagihan: t, bayar: b, sisa: t - b }
})

// ==========================================
// EXPORT & PRINT LOGIC
// ==========================================
const printLaporan = async (mode: 'summary' | 'kartu') => {
  printDataMode.value = mode
  await nextTick()
  setTimeout(() => {
    window.print()
    printDataMode.value = null // reset after print window closes
  }, 400)
}

const exportSummaryToExcel = () => {
  let tsvContent = `REKAPITULASI OUTSTANDING HUTANG\nCut-Off: ${filters.value.tglCutOff}\n\n`
  tsvContent += "No\tPihak Lawan\tSPK\tUraian\tTgl Perjanjian\tTotal Tagihan\tTotal Terbayar\tSisa Outstanding\n"
  
  filteredReportData.value.forEach((item, index) => { 
    tsvContent += `${index + 1}\t${item.nama}\t${item.spk}\t${item.keterangan}\t${item.tgl_perjanjian}\t${item.tagihan}\t${item.bayar}\t${item.sisa}\n` 
  })
  tsvContent += `\n\tTOTAL KESELURUHAN (CUT-OFF)\t\t\t\t${totals.value.tagihan}\t${totals.value.bayar}\t${totals.value.sisa}\n`

  const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob)
  link.setAttribute("download", `Rekap_Hutang_CutOff_${filters.value.tglCutOff}.xls`)
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
}

const exportKartuToExcel = () => {
  if (!selectedMaster.value) return
  let tsvContent = `KARTU PINJAMAN / BAKI DEBET\nPihak: ${selectedMaster.value.nama}\nSPK: ${selectedMaster.value.spk}\n\n`
  tsvContent += "Tanggal\tNo Bukti/Reff\tUraian Mutasi\tTagihan (+)\tPembayaran (-)\tSaldo Baki Debet\n"
  
  kartuMutasi.value.forEach(row => { 
    tsvContent += `${row.tanggal}\t${row.no_bukti}\t${row.keterangan}\t${row.tagihan}\t${row.bayar}\t${row.running_balance}\n` 
  })

  const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob)
  link.setAttribute("download", `Kartu_Hutang_${selectedMaster.value.nama.replace(/\s+/g, '_')}.xls`)
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
}

// FORMATTERS
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
.tracking-wide { letter-spacing: 1px; }
.cursor-pointer { cursor: pointer; }

.custom-modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
  background-color: rgba(15, 23, 42, 0.7); display: flex; 
  align-items: center; justify-content: center; z-index: 1050; 
  animation: fadeIn 0.2s ease-out;
}
.custom-modal-card { max-height: 95vh; display: flex; flex-direction: column; animation: slideDown 0.3s ease-out;}
.modal-body-scroll { flex: 1 1 auto; overflow-y: auto; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>

<style>
@media print {
  .screen-only, .sidebar, .topbar, .d-print-none, aside, nav, header { display: none !important; }
  .main-content, .content-area, .app-layout, body, html, #app { margin: 0 !important; padding: 0 !important; background-color: white !important; width: 100% !important; max-width: 100% !important; height: auto !important; overflow: visible !important; position: static !important; }
  #print-area { display: block !important; width: 100% !important; padding: 10px !important; color: black !important; }
  @page { margin: 10mm; size: landscape; } 
  .table-print { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  .table-print th, .table-print td { border: 1px solid black !important; color: black !important; padding: 4px 6px !important; }
  .bg-light { background-color: #e9ecef !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .text-dark { color: black !important; }
}
</style>