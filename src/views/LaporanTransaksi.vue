<template>
  <div class="laporan-transaksi">
    <!-- OVERLAY UNTUK MENUTUP DROPDOWN -->
    <div v-if="activeDropdown" class="position-fixed top-0 start-0 w-100 h-100" style="z-index: 1050; background: transparent;" @click="closeAllDropdowns"></div>

    <!-- UI UTAMA -->
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Laporan Transaksi (Buku Besar)</h4>
          <p class="text-muted small mb-0">Filter, analisis, dan lacak seluruh pergerakan jurnal akuntansi Anda.</p>
        </div>
        <div>
          <button v-if="isFilterApplied" class="btn btn-warning fw-bold px-3 me-2 rounded-0 shadow-sm" @click="unlockFilters" title="Ubah parameter filter">
            <i class="bi bi-unlock-fill"></i> Buka Kunci Filter
          </button>
          <button class="btn btn-outline-danger fw-bold px-3 me-2 rounded-0" @click="resetFilters" title="Reset semua parameter">
            <i class="bi bi-arrow-counterclockwise"></i> Reset
          </button>
          <button class="btn btn-primary fw-bold px-4 rounded-0 shadow-sm" @click="fetchData" :disabled="isFilterApplied">
            <i class="bi bi-funnel-fill me-2"></i> Terapkan Filter
          </button>
        </div>
      </div>

      <!-- KOTAK FILTER UTAMA SERVER-SIDE -->
      <div class="card border border-secondary shadow-sm rounded-0 mb-4" :class="isFilterApplied ? 'bg-secondary bg-opacity-10' : 'bg-light bg-opacity-50'" :style="{ position: 'relative', zIndex: activeDropdown ? 1055 : 1 }">
        <div class="card-body p-3 position-relative">
          <div v-if="isFilterApplied" class="position-absolute top-0 end-0 mt-2 me-3">
             <span class="badge bg-success shadow-sm"><i class="bi bi-lock-fill me-1"></i> Filter Terkunci</span>
          </div>

          <div class="row g-3">
            <!-- BARIS 1 -->
            <div class="col-md-3">
              <label class="form-label small fw-bold text-dark mb-1">Periode Tanggal</label>
              <div class="input-group input-group-sm">
                <input type="date" class="form-control rounded-0 border-secondary" v-model="filters.startDate" :disabled="isFilterApplied">
                <span class="input-group-text border-secondary bg-white">s/d</span>
                <input type="date" class="form-control rounded-0 border-secondary" v-model="filters.endDate" :disabled="isFilterApplied">
              </div>
            </div>

            <div class="col-md-3">
              <label class="form-label small fw-bold text-dark mb-1">Modul / Jenis</label>
              <select class="form-select form-select-sm rounded-0 border-secondary" v-model="filters.jenis_transaksi" :disabled="isFilterApplied">
                <option value="">-- Semua Modul --</option>
                <option value="REKAP_TIKET">Rekap Tiket (TKR)</option>
                <option value="KAS_MASUK">BKM (Kas Masuk)</option>
                <option value="KAS_KELUAR">BKK (Kas Keluar)</option>
                <option value="JURNAL_UMUM">Jurnal Umum (JU)</option>
              </select>
            </div>

            <div class="col-md-2">
              <label class="form-label small fw-bold text-dark mb-1">Status R/T</label>
              <select class="form-select form-select-sm rounded-0 border-secondary" v-model="filters.status_realtime" :disabled="isFilterApplied">
                <option value="">-- Semua --</option>
                <option value="Y">Realtime (Y)</option>
                <option value="T">Backdate (T)</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold text-dark mb-1">Akun Anggaran</label>
              <select class="form-select form-select-sm rounded-0 border-secondary" v-model="filters.anggaran" :disabled="isFilterApplied">
                <option value="">-- Semua Anggaran --</option>
                <option value="NULL" class="fw-bold text-danger">⚠️ TANPA ANGGARAN (Kosong)</option>
                <option v-for="ang in listAnggaran" :key="ang.coa_anggaran" :value="ang.coa_anggaran">{{ ang.coa_anggaran }} - {{ ang.uraian }}</option>
              </select>
            </div>

            <!-- BARIS 2 -->
            <div class="col-md-6 position-relative" :style="{ zIndex: activeDropdown === 'coa' ? 1060 : 1 }">
              <label class="form-label small fw-bold text-dark mb-1">Akun Perkiraan (COA)</label>
              <div class="position-relative dropdown-container">
                <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center rounded-0 border-secondary" 
                     :class="{'cursor-pointer': !isFilterApplied, 'bg-light': isFilterApplied}" 
                     @click="toggleDropdown('coa')">
                  <span class="text-truncate" :class="{'text-muted': !filters.coa}">{{ getCoaLabel(filters.coa) || '-- Semua Akun COA --' }}</span>
                  <i class="bi bi-caret-down-fill small text-muted"></i>
                </div>
                <div v-if="activeDropdown === 'coa' && !isFilterApplied" class="position-absolute w-100 bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu">
                  <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Cari Kode/Nama COA..." v-model="searchQuery" @click.stop>
                  <div class="list-group list-group-flush">
                    <button class="list-group-item list-group-item-action p-2 small border-bottom fw-bold text-danger" @click.stop="selectDropdown('coa', '')">X Batalkan Pilihan (Semua COA)</button>
                    <button v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click.stop="selectDropdown('coa', coa.coa_code)">
                      <span class="fw-bold">{{ coa.coa_code }}</span> - {{ coa.nama }} 
                      <span v-if="coa.sifat !== 'D'" class="badge bg-secondary ms-1" style="font-size:0.6rem">Group</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-3 position-relative" :style="{ zIndex: activeDropdown === 'piutang' ? 1060 : 1 }">
              <label class="form-label small fw-bold text-primary mb-1">Pihak Piutang (Dihutangi)</label>
              <div class="position-relative dropdown-container">
                <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center rounded-0 border-primary" 
                     :class="{'cursor-pointer': !isFilterApplied, 'bg-light': isFilterApplied}"
                     @click="toggleDropdown('piutang')">
                  <span class="text-truncate" :class="{'text-muted': !filters.pihak_piutang}">{{ getPihakLabel(filters.pihak_piutang) || '-- Semua Pihak --' }}</span>
                  <i class="bi bi-caret-down-fill small text-muted"></i>
                </div>
                <div v-if="activeDropdown === 'piutang' && !isFilterApplied" class="position-absolute w-100 bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu">
                  <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Cari entitas..." v-model="searchQuery" @click.stop>
                  <div class="list-group list-group-flush">
                    <button class="list-group-item list-group-item-action p-2 small border-bottom fw-bold text-danger" @click.stop="selectDropdown('pihak_piutang', '')">X Batalkan Pilihan</button>
                    <button v-for="p in filteredPihak" :key="p.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click.stop="selectDropdown('pihak_piutang', p.id)">
                      {{ p.nama }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-3 position-relative" :style="{ zIndex: activeDropdown === 'hutang' ? 1060 : 1 }">
              <label class="form-label small fw-bold text-danger mb-1">Pihak Hutang (Berhutang)</label>
              <div class="position-relative dropdown-container">
                <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center rounded-0 border-danger" 
                     :class="{'cursor-pointer': !isFilterApplied, 'bg-light': isFilterApplied}"
                     @click="toggleDropdown('hutang')">
                  <span class="text-truncate" :class="{'text-muted': !filters.pihak_hutang}">{{ getPihakLabel(filters.pihak_hutang) || '-- Semua Pihak --' }}</span>
                  <i class="bi bi-caret-down-fill small text-muted"></i>
                </div>
                <div v-if="activeDropdown === 'hutang' && !isFilterApplied" class="position-absolute w-100 bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu">
                  <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Cari entitas..." v-model="searchQuery" @click.stop>
                  <div class="list-group list-group-flush">
                    <button class="list-group-item list-group-item-action p-2 small border-bottom fw-bold text-danger" @click.stop="selectDropdown('pihak_hutang', '')">X Batalkan Pilihan</button>
                    <button v-for="p in filteredPihak" :key="p.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click.stop="selectDropdown('pihak_hutang', p.id)">
                      {{ p.nama }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- BARIS 3 -->
            <div class="col-md-3">
              <label class="form-label small fw-bold text-info mb-1">User (Dibuat Oleh)</label>
              <input type="text" class="form-control form-control-sm rounded-0 border-info" v-model="filters.created_by" placeholder="Ketik nama user..." :disabled="isFilterApplied">
            </div>
            
            <div class="col-md-9">
               <label class="form-label small fw-bold text-muted mb-1">Cari Universal Database</label>
               <input type="text" class="form-control form-control-sm rounded-0 border-secondary" v-model="filters.keyword" placeholder="Ketik No. Bukti atau Uraian (dicari di database) lalu klik 'Terapkan Filter'..." :disabled="isFilterApplied">
            </div>

          </div>
        </div>
      </div>

      <!-- FILTER KLIEN (KHUSUS DATA TERTAMPIL) -->
      <div class="d-flex mb-3 gap-2 align-items-center" v-if="reportData.length > 0">
        <select class="form-select form-select-sm w-auto rounded-0 border-secondary fw-bold text-dark" v-model="searchColumn">
          <option value="semua">Semua Kolom</option>
          <option value="kwitansi_internal">No. Bukti (Ref)</option>
          <option value="keterangan">Uraian / Keterangan</option>
          <option value="coa_saldo">Akun (COA)</option>
          <option value="pihak_terkait">Pihak Terkait</option>
          <option value="realtime">Status R/T (Y/T)</option>
        </select>
        <div class="input-group input-group-sm w-25">
          <span class="input-group-text rounded-0 bg-white border-secondary"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control rounded-0 border-start-0 border-secondary ps-0" v-model="searchTableQuery" placeholder="Cari dalam hasil filter ini...">
        </div>
      </div>

      <!-- TABEL DATA LAPORAN -->
      <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden mb-3" style="z-index: 10;">
        <div class="card-header bg-dark text-white p-2 px-3 d-flex justify-content-between align-items-center rounded-0">
          <div class="fw-bold" style="font-size: 0.9rem;"><i class="bi bi-journal-text me-2"></i>Hasil Filter Laporan</div>
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
          <table class="table table-sm table-hover table-bordered align-middle mb-0" style="min-width: 1400px; font-size: 0.8rem;">
            <thead class="table-secondary text-center align-middle sticky-top" style="z-index: 10;">
              <tr>
                <th width="3%" class="py-2">No</th>
                <th width="8%" class="py-2">Tanggal</th>
                <th width="4%" class="py-2" title="Realtime / Backdate">R/T</th>
                <th width="12%" class="py-2">No Bukti (Ref)</th>
                <th width="15%" class="py-2">Akun Perkiraan (COA)</th>
                <th width="12%" class="py-2">Anggaran</th>
                <th width="18%" class="py-2">Uraian / Keterangan</th>
                <th width="12%" class="py-2">Pihak Terkait</th>
                <th width="8%" class="py-2">Debet (Rp)</th>
                <th width="8%" class="py-2">Kredit (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="10" class="text-center py-5 text-muted">
                  <div class="spinner-border spinner-border-sm me-2"></div> Menarik data dari server...
                </td>
              </tr>
              <tr v-else-if="filteredReportData.length === 0">
                <td colspan="10" class="text-center py-5 text-muted fst-italic">
                  <i class="bi bi-inbox fs-2 d-block mb-2"></i> Tidak ada data transaksi yang cocok.
                </td>
              </tr>
              
              <tr v-for="(item, index) in filteredReportData" :key="item.id_transaksi" :class="{'bg-light': index % 2 !== 0}">
                <td class="text-center text-muted">{{ index + 1 }}</td>
                <td class="text-center fw-bold">{{ formatDate(item.tanggal_transaksi) }}</td>
                <td class="text-center fw-bold fs-6">
                  <span v-if="isRealtime(item.tanggal_transaksi, item.created_at)" class="text-success" title="Realtime (Sesuai Tanggal)">Y</span>
                  <span v-else class="text-danger" title="Backdate (Tidak Sesuai Tanggal)">T</span>
                </td>
                <td class="text-center text-primary fw-bold" style="font-size: 0.75rem;">
                  {{ item.kwitansi_internal }}
                  <span v-if="item.jenis_transaksi" class="badge bg-secondary d-block mt-1 bg-opacity-75 rounded-0">{{ item.jenis_transaksi }}</span>
                </td>
                <td class="fw-bold">
                  {{ item.coa_saldo }}<br>
                  <span class="text-muted fw-normal small">{{ item.coas?.nama || '-' }}</span>
                </td>
                <td class="text-center">
                  <span v-if="item.coa_anggaran" class="badge bg-success bg-opacity-10 text-success border border-success rounded-0 p-1 w-100" style="white-space: normal;" :title="getAnggaranLabel(item.coa_anggaran)">
                    {{ item.coa_anggaran }}
                  </span>
                  <span v-else class="text-muted fst-italic" style="font-size: 0.7rem;">Tanpa Anggaran</span>
                </td>
                <td>
                  {{ item.keterangan }}
                  <div class="text-muted mt-1" style="font-size: 0.65rem;"><i class="bi bi-person me-1"></i>{{ item.created_by }}</div>
                </td>
                <td style="font-size: 0.75rem;">
                   <div v-if="item.pihak_piutang" class="text-primary text-truncate" title="Pihak Piutang">D: {{ getPihakLabel(item.pihak_piutang) }}</div>
                   <div v-if="item.pihak_hutang" class="text-danger text-truncate" title="Pihak Hutang">K: {{ getPihakLabel(item.pihak_hutang) }}</div>
                   <div v-if="!item.pihak_piutang && !item.pihak_hutang" class="text-muted fst-italic text-center">-</div>
                </td>
                <td class="text-end fw-bold text-dark">{{ formatNominal(item.debet) }}</td>
                <td class="text-end fw-bold text-dark">{{ formatNominal(item.kredit) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="!isLoading && filteredReportData.length > 0" class="table-dark fw-bold">
              <tr>
                <td colspan="8" class="text-end py-2 pe-3 text-uppercase">Total Terfilter :</td>
                <td class="text-end py-2 text-info">Rp {{ formatNominal(totalDebet) }}</td>
                <td class="text-end py-2 text-warning">Rp {{ formatNominal(totalKredit) }}</td>
              </tr>
              <tr v-if="filters.coa" class="bg-secondary text-white">
                <td colspan="8" class="text-end py-2 pe-3 text-uppercase">Saldo Mutasi Akun (Terfilter) :</td>
                <td colspan="2" class="text-center py-2 fs-6">Rp {{ formatNominal(Math.abs(totalDebet - totalKredit)) }} <span class="fs-6 ms-1 badge bg-light text-dark rounded-0">{{ totalDebet >= totalKredit ? '(DEBET)' : '(KREDIT)' }}</span></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- AREA CETAK KHUSUS LAPORAN -->
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
                BUKU BESAR / LAPORAN TRANSAKSI
              </h4>
            </td>
          </tr>
        </table>

        <!-- PARAMETER FILTER YANG DIPAKAI -->
        <div class="mb-3 p-2 border border-dark text-dark" style="font-size: 9pt;">
           <div class="fw-bold mb-1 border-bottom border-dark pb-1 text-uppercase">Parameter Laporan:</div>
           <div class="row g-1 mt-1">
             <div class="col-6"><strong>Periode:</strong> {{ filters.startDate ? formatDateStr(filters.startDate) : 'Awal' }} s/d {{ filters.endDate ? formatDateStr(filters.endDate) : 'Akhir' }}</div>
             <div class="col-6"><strong>Modul / Dokumen:</strong> {{ filters.jenis_transaksi || 'Semua Modul' }}</div>
             <div class="col-6"><strong>Akun (COA):</strong> {{ getCoaLabel(filters.coa) || 'Semua Akun' }}</div>
             <div class="col-6"><strong>Anggaran:</strong> {{ filters.anggaran === 'NULL' ? 'Tanpa Anggaran (KOSONG)' : (getAnggaranLabel(filters.anggaran) || 'Semua Anggaran') }}</div>
             <div class="col-6"><strong>Pihak Piutang:</strong> {{ getPihakLabel(filters.pihak_piutang) || 'Semua' }}</div>
             <div class="col-6"><strong>Pihak Hutang:</strong> {{ getPihakLabel(filters.pihak_hutang) || 'Semua' }}</div>
             <div class="col-6"><strong>Status R/T:</strong> {{ filters.status_realtime === 'Y' ? 'Realtime (Y)' : (filters.status_realtime === 'T' ? 'Backdate (T)' : 'Semua') }}</div>
             <div class="col-6" v-if="filters.created_by"><strong>User:</strong> {{ filters.created_by }}</div>
             <div class="col-12" v-if="filters.keyword || searchTableQuery">
                <strong>Pencarian:</strong> "{{ filters.keyword }} {{ searchTableQuery ? '(+ Filter: ' + searchTableQuery + ')' : '' }}"
             </div>
           </div>
        </div>

        <table class="w-100 table-print table-bordered border-dark text-dark mb-4">
          <thead class="text-center fw-bold bg-light" style="font-size: 9pt;">
            <tr>
              <th width="4%" class="p-1">No</th>
              <th width="8%" class="p-1">Tanggal</th>
              <th width="4%" class="p-1">R/T</th>
              <th width="14%" class="p-1">No Bukti (Ref)</th>
              <th width="14%" class="p-1">Akun (COA)</th>
              <th width="26%" class="p-1">Uraian / Keterangan</th>
              <th width="15%" class="p-1">Debet</th>
              <th width="15%" class="p-1">Kredit</th>
            </tr>
          </thead>
          <tbody style="font-size: 8.5pt;">
            <tr v-for="(item, idx) in filteredReportData" :key="idx">
              <td class="text-center p-1">{{ idx + 1 }}</td>
              <td class="text-center p-1">{{ formatDateStr(item.tanggal_transaksi) }}</td>
              <td class="text-center p-1 fw-bold">
                 <span v-if="isRealtime(item.tanggal_transaksi, item.created_at)">Y</span>
                 <span v-else>T</span>
              </td>
              <td class="p-1 fw-bold">{{ item.kwitansi_internal }}</td>
              <td class="p-1"><strong>{{ item.coa_saldo }}</strong><br>{{ item.coas?.nama }}</td>
              <td class="p-1">
                 {{ item.keterangan }}
                 <div v-if="item.pihak_piutang || item.pihak_hutang" class="mt-1 fst-italic text-muted" style="font-size: 7.5pt;">
                   Relasi: {{ getPihakLabel(item.pihak_piutang) }} {{ item.pihak_piutang && item.pihak_hutang ? '/' : '' }} {{ getPihakLabel(item.pihak_hutang) }}
                 </div>
                 <div class="mt-1 text-muted" style="font-size: 7pt;">Oleh: {{ item.created_by }}</div>
              </td>
              <td class="p-1 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(item.debet) }}</span></div></td>
              <td class="p-1 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(item.kredit) }}</span></div></td>
            </tr>

            <!-- TOTAL DIMASUKKAN KE DALAM TBODY AGAR HANYA MUNCUL SEKALI DI AKHIR CETAKAN -->
            <tr class="fw-bold bg-light" style="font-size: 9.5pt;">
              <td colspan="6" class="text-end p-2 pe-3 text-uppercase">TOTAL NILAI TRANSAKSI :</td>
              <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(totalDebet) }}</span></div></td>
              <td class="p-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(totalKredit) }}</span></div></td>
            </tr>
            <tr v-if="filters.coa" class="fw-bold bg-light" style="font-size: 9.5pt;">
              <td colspan="6" class="text-end p-2 pe-3 text-uppercase">SALDO MUTASI TERFILTER :</td>
              <td colspan="2" class="p-2 text-center fs-6">
                Rp {{ formatNominal(Math.abs(totalDebet - totalKredit)) }} 
                <span class="fs-6 ms-2">({{ totalDebet >= totalKredit ? 'DEBET' : 'KREDIT' }})</span>
              </td>
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
const listAnggaran = ref<any[]>([])
const listPihak = ref<any[]>([])

// REPORT STATE
const reportData = ref<any[]>([])
const isLoading = ref(false)
const isFilterApplied = ref(false)

// UI STATE
const activeDropdown = ref<string | null>(null)
const searchQuery = ref('') 

// CLIENT SIDE FILTER (KOLOM PENCARIAN TERTAMPIL)
const searchTableQuery = ref('')
const searchColumn = ref('semua')

// FILTER STATE
const filters = ref({
  startDate: '', endDate: '', jenis_transaksi: '', status_realtime: '',
  coa: '', anggaran: '', pihak_piutang: '', pihak_hutang: '',
  created_by: '', keyword: ''
})

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) currentUser.value = JSON.parse(userData)
  
  const today = new Date().toISOString().slice(0,10)
  filters.value.startDate = today
  filters.value.endDate = today

  await fetchCompanyProfile()
  await fetchDropdowns()
  await fetchData() 
})

// DROPDOWN LOGIC
const toggleDropdown = (id: string) => {
  if (isFilterApplied.value) return 
  if (activeDropdown.value === id) closeAllDropdowns()
  else {
    activeDropdown.value = id; searchQuery.value = ''
    nextTick(() => { const input = document.querySelector('.custom-dropdown-menu input') as HTMLInputElement; if (input) input.focus() })
  }
}
const closeAllDropdowns = () => { activeDropdown.value = null; searchQuery.value = '' }

const selectDropdown = (field: string, val: string) => { 
  if (isFilterApplied.value) return;
  (filters.value as any)[field] = val; 
  closeAllDropdowns() 
}

const filteredCOA = computed(() => {
  if (!searchQuery.value) return listCOA.value
  const q = searchQuery.value.toLowerCase()
  return listCOA.value.filter(c => c.coa_code.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q))
})

const filteredPihak = computed(() => {
  if (!searchQuery.value) return listPihak.value
  const q = searchQuery.value.toLowerCase()
  return listPihak.value.filter(p => p.nama.toLowerCase().includes(q))
})

// MAPPING HELPERS
const getCoaLabel = (code: string) => {
  if (!code) return ''
  const c = listCOA.value.find(x => x.coa_code === code)
  return c ? `${c.coa_code} - ${c.nama}` : code
}

const getAnggaranLabel = (coa: string) => {
  if (!coa) return ''
  const a = listAnggaran.value.find(x => x.coa_anggaran === coa)
  return a ? a.uraian : coa
}

const getPihakLabel = (id: string) => {
  if (!id) return ''
  const p = listPihak.value.find(x => x.id === id)
  return p ? p.nama : id
}

// LOGIKA REALTIME CATCHER (Dilengkapi Try Catch Agar Tidak Crash)
const isRealtime = (tanggalTransaksi: string, createdAt: string) => {
  try {
    if (!tanggalTransaksi || !createdAt) return false
    const tglMutasi = new Date(tanggalTransaksi).toISOString().slice(0, 10)
    const tglInput = new Date(createdAt).toISOString().slice(0, 10)
    return tglMutasi === tglInput
  } catch (e) {
    return false
  }
}

// PENCARIAN CLIENT SIDE COMPUTED
const filteredReportData = computed(() => {
  if (!searchTableQuery.value) return reportData.value
  const q = searchTableQuery.value.toLowerCase()
  
  return reportData.value.filter(item => {
    const isRt = isRealtime(item.tanggal_transaksi, item.created_at) ? 'y' : 't'

    if (searchColumn.value === 'semua') {
      return (
        item.kwitansi_internal?.toLowerCase().includes(q) ||
        item.keterangan?.toLowerCase().includes(q) ||
        item.coa_saldo?.toLowerCase().includes(q) ||
        item.coas?.nama?.toLowerCase().includes(q) ||
        getPihakLabel(item.pihak_piutang)?.toLowerCase().includes(q) ||
        getPihakLabel(item.pihak_hutang)?.toLowerCase().includes(q) ||
        isRt === q
      )
    } else if (searchColumn.value === 'coa_saldo') {
      return item.coa_saldo?.toLowerCase().includes(q) || item.coas?.nama?.toLowerCase().includes(q)
    } else if (searchColumn.value === 'pihak_terkait') {
      return getPihakLabel(item.pihak_piutang)?.toLowerCase().includes(q) || getPihakLabel(item.pihak_hutang)?.toLowerCase().includes(q)
    } else if (searchColumn.value === 'realtime') {
      return isRt === q || isRt.includes(q)
    } else {
      return item[searchColumn.value]?.toString().toLowerCase().includes(q)
    }
  })
})

// FETCH REFERENSI
const fetchCompanyProfile = async () => { try { const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single(); if (data) company.value = data } catch (err) {} }

const fetchDropdowns = async () => {
  try {
    const { data: coaData } = await supabase.from('coas').select('*').order('coa_code', { ascending: true })
    listCOA.value = coaData || []
    const { data: angData } = await supabase.from('anggaran').select('coa_anggaran, uraian').order('coa_anggaran', { ascending: true })
    listAnggaran.value = angData || []
    const { data: pkData } = await supabase.from('pihak_lawan').select('id, nama').order('nama', { ascending: true })
    listPihak.value = pkData || []
  } catch (err) {}
}

const unlockFilters = () => {
  isFilterApplied.value = false
}

const resetFilters = () => {
  filters.value = {
    startDate: '', endDate: '', jenis_transaksi: '', status_realtime: '', coa: '',
    anggaran: '', pihak_piutang: '', pihak_hutang: '', created_by: '', keyword: ''
  }
  searchTableQuery.value = ''
  searchColumn.value = 'semua'
  isFilterApplied.value = false
  reportData.value = []
}

// QUERY SUPER KOMPREHENSIF (SERVER-SIDE)
const fetchData = async () => {
  isLoading.value = true
  reportData.value = []
  searchTableQuery.value = '' 
  AppAlert.loading('Menarik data dari database...')

  try {
    let query = supabase.from('transaksi')
      .select(`*, coas:coa_saldo(nama)`)
      .order('tanggal_transaksi', { ascending: true })
      .order('created_at', { ascending: true }) 

    if (filters.value.startDate) query = query.gte('tanggal_transaksi', filters.value.startDate)
    if (filters.value.endDate) query = query.lte('tanggal_transaksi', filters.value.endDate)
    if (filters.value.jenis_transaksi) query = query.eq('jenis_transaksi', filters.value.jenis_transaksi)
    
    // FILTER REALTIME DARI DATABASE
    if (filters.value.status_realtime === 'Y') {
      query = query.or('backdate.eq.false,backdate.is.null')
    } else if (filters.value.status_realtime === 'T') {
      query = query.eq('backdate', true)
    }

    // LOGIKA FILTER COA
    if (filters.value.coa) {
      const selectedCoa = listCOA.value.find(c => c.coa_code === filters.value.coa)
      if (selectedCoa && selectedCoa.sifat !== 'D') {
        query = query.like('coa_saldo', `${filters.value.coa}%`)
      } else {
        query = query.eq('coa_saldo', filters.value.coa)
      }
    }

    if (filters.value.pihak_piutang) query = query.eq('pihak_piutang', filters.value.pihak_piutang)
    if (filters.value.pihak_hutang) query = query.eq('pihak_hutang', filters.value.pihak_hutang)
    if (filters.value.created_by) query = query.ilike('created_by', `%${filters.value.created_by}%`)
    
    if (filters.value.anggaran === 'NULL') {
      query = query.is('coa_anggaran', null)
    } else if (filters.value.anggaran) {
      query = query.eq('coa_anggaran', filters.value.anggaran)
    }

    if (filters.value.keyword) {
      const kw = `%${filters.value.keyword}%`
      query = query.or(`kwitansi_internal.ilike.${kw},kwitansi_eksternal.ilike.${kw},keterangan.ilike.${kw}`)
    }

    const { data, error } = await query.limit(5000) 
    if (error) throw error

    reportData.value = data || []
    isFilterApplied.value = true
    AppAlert.close()
  } catch (err: any) {
    AppAlert.error('Gagal', err.message || 'Gagal menarik data laporan.')
  } finally {
    isLoading.value = false
  }
}

// KALKULASI SUMMARY 
const totalDebet = computed(() => {
  return filteredReportData.value.reduce((sum, item) => sum + Number(item.debet || 0), 0)
})

const totalKredit = computed(() => {
  return filteredReportData.value.reduce((sum, item) => sum + Number(item.kredit || 0), 0)
})

const printLaporan = async () => {
  await nextTick()
  setTimeout(() => window.print(), 400)
}

// EXPORT TO EXCEL
const exportToExcel = () => {
  if (filteredReportData.value.length === 0) {
    AppAlert.error('Kosong', 'Tidak ada data untuk diexport.')
    return
  }

  let tsvContent = "No\tTanggal\tStatus R/T\tNo Bukti (Ref)\tCOA\tNama Akun\tAnggaran\tUraian\tPihak Piutang (D)\tPihak Hutang (K)\tDibuat Oleh\tDebet (Rp)\tKredit (Rp)\n"

  filteredReportData.value.forEach((item, index) => {
    const no = index + 1
    const tgl = formatDateStr(item.tanggal_transaksi)
    const rt = isRealtime(item.tanggal_transaksi, item.created_at) ? 'Y' : 'T'
    const bukti = item.kwitansi_internal || ''
    const coa = item.coa_saldo || ''
    const namaAkun = item.coas?.nama || ''
    const anggaran = item.coa_anggaran ? getAnggaranLabel(item.coa_anggaran) : 'Tanpa Anggaran'
    const uraian = (item.keterangan || '').replace(/\n/g, ' ')
    const pihakP = getPihakLabel(item.pihak_piutang) || '-'
    const pihakH = getPihakLabel(item.pihak_hutang) || '-'
    const user = item.created_by || ''
    const debet = item.debet || 0
    const kredit = item.kredit || 0

    tsvContent += `${no}\t${tgl}\t${rt}\t${bukti}\t${coa}\t${namaAkun}\t${anggaran}\t${uraian}\t${pihakP}\t${pihakH}\t${user}\t${debet}\t${kredit}\n`
  })

  // (10 Tabs to align exactly before Debet Column)
  tsvContent += `\n\t\t\t\t\t\t\t\t\t\tTOTAL TERFILTER :\t${totalDebet.value}\t${totalKredit.value}\n`
  
  if(filters.value.coa) {
     const selisih = Math.abs(totalDebet.value - totalKredit.value)
     const ket = totalDebet.value >= totalKredit.value ? '(DEBET)' : '(KREDIT)'
     tsvContent += `\t\t\t\t\t\t\t\t\t\tSALDO MUTASI:\t${selisih} ${ket}\t\n`
  }

  const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `Laporan_BukuBesar_${formatDateStr(new Date().toISOString())}.xls`)
  
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
.custom-dropdown-menu { max-height: 250px; overflow-y: auto; z-index: 1070; }
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