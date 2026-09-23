<template>
  <div class="rekap-tiket">
    <!-- UI UTAMA APLIKASI -->
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Rekapitulasi Tiket (TKR)</h4>
          <p class="text-muted small mb-0">Automasi Settlement: Tagihan Piutang, Hutang EO (Gross), dan Jurnal Penyesuaian Ganda.</p>
        </div>
        <button v-if="canCreate" class="btn btn-primary fw-bold px-4 shadow-sm rounded-0" @click="openAddModal">
          <i class="bi bi-ticket-perforated me-2"></i> Input Rekap Tiket
        </button>
      </div>

      <!-- FITUR PENCARIAN -->
      <div class="d-flex mb-3 gap-2 align-items-center">
        <select class="form-select form-select-sm w-auto rounded-0 border-secondary" v-model="searchColumn">
          <option value="semua">Semua Kategori</option>
          <option value="no_bukti_internal">No. TKR</option>
          <option value="nama_segmen">Segmen Tiket</option>
          <option value="nama_eo">Event / EO</option>
          <option value="keterangan">Keterangan</option>
        </select>
        <div class="input-group input-group-sm w-25">
          <span class="input-group-text rounded-0 bg-white border-secondary"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control rounded-0 border-start-0 border-secondary ps-0" v-model="searchTableQuery" placeholder="Cari rekap tiket...">
        </div>
      </div>

      <!-- TABEL DATA (GRID KOTAK & FONT KECIL) -->
      <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden">
        <div class="table-responsive" style="min-height: 440px;">
          <table class="table table-sm table-striped table-hover table-bordered align-middle mb-0" style="min-width: 1300px; font-size: 0.85rem;">
            <thead class="table-dark text-center align-middle">
              <tr>
                <th width="4%" class="py-3">No</th>
                <th width="14%" class="py-3 cursor-pointer" @click="handleSort('no_bukti_internal')">
                  No. Bukti TKR <i class="bi ms-1" :class="sortColumn==='no_bukti_internal' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="10%" class="py-3 cursor-pointer" @click="handleSort('tanggal_rekap')">
                  Tanggal <i class="bi ms-1" :class="sortColumn==='tanggal_rekap' ? (sortDirection==='asc' ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="18%" class="py-3 cursor-pointer" @click="handleSort('nama_segmen')">
                  Segmen Tiket & EO <i class="bi ms-1" :class="sortColumn==='nama_segmen' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="10%" class="py-3 cursor-pointer" @click="handleSort('mutasi_qty')">
                  Mutasi Qty <i class="bi ms-1" :class="sortColumn==='mutasi_qty' ? (sortDirection==='asc' ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="12%" class="py-3 cursor-pointer" @click="handleSort('mutasi_kotor')">
                  Mutasi Saldo <i class="bi ms-1" :class="sortColumn==='mutasi_kotor' ? (sortDirection==='asc' ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="12%" class="py-3 cursor-pointer" @click="handleSort('netto_hutang')">
                  Netto Hak EO <i class="bi ms-1" :class="sortColumn==='netto_hutang' ? (sortDirection==='asc' ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="11%" class="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedData.length === 0">
                <td colspan="8" class="text-center text-muted py-5">
                  <i class="bi bi-ticket-detailed fs-2 d-block mb-2"></i> Belum ada historis rekap tiket (TKR).
                </td>
              </tr>
              
              <tr v-for="(item, index) in paginatedData" :key="item.id">
                <td class="text-center text-muted">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td class="fw-bold text-dark text-center">
                  {{ item.no_bukti_internal }}
                  <div class="text-muted mt-1" style="font-size: 0.7rem;">{{ formatDateTime(item.created_at) }}</div>
                </td>
                <td class="text-center fw-bold">{{ formatDate(item.tanggal_rekap) }}</td>
                <td>
                  <div class="fw-bold text-primary">{{ item.nama_segmen }}</div>
                  <div class="small text-muted">{{ item.nama_eo }}</div>
                </td>
                <td class="text-center fw-bold">
                  <span class="badge bg-secondary rounded-0">{{ item.mutasi_qty }} Pcs</span>
                </td>
                <td class="text-end fw-bold text-primary">Rp {{ formatNominal(item.mutasi_kotor) }}</td>
                <td class="text-end fw-bold text-danger">Rp {{ formatNominal(item.netto_hutang) }}</td>
                <td class="text-center text-nowrap">
                  <button class="btn btn-sm btn-light text-success border me-1 rounded-0 shadow-sm" @click="printJurnal(item.no_bukti_internal)" title="Cetak Memorial Jurnal">
                    <i class="bi bi-printer"></i>
                  </button>
                  <button class="btn btn-sm btn-light text-primary border me-1 rounded-0 shadow-sm" @click="printRekap(item.no_bukti_internal)" title="Cetak Bukti Rekap TKR">
                    <i class="bi bi-file-earmark-spreadsheet"></i>
                  </button>
                  <button v-if="canDelete" class="btn btn-sm btn-light text-danger border rounded-0 shadow-sm" @click="deleteData(item.no_bukti_internal)" title="Void / Batalkan">
                    <i class="bi bi-x-circle"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-between align-items-center p-3 bg-light border-top">
          <div class="text-muted fw-bold" style="font-size: 0.85rem;">
            Tampil {{ sortedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1 }} -
            {{ Math.min(currentPage * itemsPerPage, sortedData.length) }} dari {{ sortedData.length }} data
          </div>
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary rounded-0 fw-bold" :disabled="currentPage === 1" @click="currentPage--"><i class="bi bi-chevron-left me-1"></i> Prev</button>
            <button class="btn btn-sm btn-outline-secondary rounded-0 fw-bold" disabled>Hal {{ currentPage }} / {{ totalPages || 1 }}</button>
            <button class="btn btn-sm btn-outline-secondary rounded-0 fw-bold" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage++">Next <i class="bi bi-chevron-right ms-1"></i></button>
          </div>
        </div>
      </div>
    </div>

    <!-- AREA CETAK KHUSUS (HIDDEN ON SCREEN) -->
    <div id="print-area" v-if="itemToPrint">
      <div class="print-container">
        
        <table class="w-100 table-print table-bordered border-dark mb-4">
          <tr>
            <td width="70%" class="p-2 align-middle print-bg-gray">
              <div class="d-flex align-items-center">
                <img v-if="company.logo_url" :src="company.logo_url" alt="Logo" style="max-height: 50px; margin-right: 15px;">
                <div>
                  <h5 class="mb-0 fw-bold text-dark text-uppercase" style="font-size: 11pt;">{{ company.nama || 'NAMA INSTANSI' }}</h5>
                  <div v-if="company.sub_nama" style="font-size: 9pt; font-weight: bold; margin-bottom: 2px;">{{ company.sub_nama }}</div>
                  <div style="font-size: 8pt; margin-bottom: 2px;">{{ company.alamat || 'Alamat Instansi' }}</div>
                </div>
              </div>
            </td>
            <td width="30%" class="text-center align-middle print-bg-gray bg-light">
              <h4 class="mb-0 fw-bold text-dark tracking-wide" style="font-size: 13pt;">
                {{ printMode === 'jurnal' ? 'MEMORIAL TKR' : 'BUKTI REKAP TIKET' }}
              </h4>
            </td>
          </tr>
        </table>

        <!-- LAYOUT 1: BUKTI JURNAL INTERNAL -->
        <template v-if="printMode === 'jurnal'">
          <table class="w-100 mb-2 info-table text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1 px-2">No Bukti</td>
              <td width="35%" class="fw-bold p-1 px-2 pe-2" style="text-align: right; text-transform: uppercase;">{{ itemToPrint.header.kwitansi_internal }}</td>
              <td width="15%" class="fw-bold p-1 px-2 ps-4">Tanggal</td>
              <td width="35%" class="p-1 px-2 fw-bold pe-2" style="text-align: right;">{{ formatDateStr(itemToPrint.header.tanggal_transaksi) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1 px-2">Dibuat Oleh</td>
              <td class="p-1 px-2 pe-2" style="text-align: right; text-transform: uppercase;">{{ itemToPrint.header.created_by }}</td>
              <td class="fw-bold p-1 px-2 ps-4">Timestamp</td>
              <td class="p-1 px-2 pe-2" style="text-align: right;">{{ formatDateTime(itemToPrint.header.created_at) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1 px-2">Pihak Terkait</td>
              <td class="p-1 px-2 pe-2" style="text-align: right; text-transform: uppercase;">{{ itemToPrint.pihak_terkait || '-' }}</td>
              <td class="fw-bold p-1 px-2 ps-4">Dicetak Oleh</td>
              <td class="p-1 px-2 pe-2" style="text-align: right; text-transform: uppercase;">{{ currentUser?.nama || 'System' }}</td>
            </tr>
          </table>

          <div class="w-100 p-2 mb-3 mt-3 border border-dark text-dark" style="font-size: 9pt;">
            <strong>Uraian Transaksi:</strong> {{ itemToPrint.header.keterangan }}
          </div>

          <table class="w-100 table-print table-bordered border-dark text-dark">
            <thead class="text-center fw-bold bg-light">
              <tr>
                <th width="5%" class="p-1">No</th>
                <th width="15%" class="p-1">Kode Akun</th>
                <th width="40%" class="p-1">Nama Akun</th>
                <th width="20%" class="p-1">Debet</th>
                <th width="20%" class="p-1">Kredit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(jurnal, idx) in itemToPrint.details" :key="idx">
                <td class="text-center p-1">{{ Number(idx) + 1 }}</td>
                <td class="text-center p-1 fw-bold">{{ jurnal.coa_saldo }}</td>
                <td class="p-1 px-2">{{ jurnal.nama_akun }}</td>
                <td class="p-1 px-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(jurnal.debet) }}</span></div></td>
                <td class="p-1 px-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(jurnal.kredit) }}</span></div></td>
              </tr>
            </tbody>
            <tfoot class="fw-bold bg-light">
              <tr>
                <td colspan="3" class="text-center p-1">Total Balance:</td>
                <td class="p-1 px-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(itemToPrint.totalDebet) }}</span></div></td>
                <td class="p-1 px-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(itemToPrint.totalKredit) }}</span></div></td>
              </tr>
            </tfoot>
          </table>

          <!-- FOOTER STANDAR UNTUK JURNAL -->
          <div class="d-flex justify-content-between align-items-end mt-4 text-dark">
            <div style="font-size: 9pt; padding-bottom: 5px;">
              <span class="fw-bold d-inline-block" style="width: 70px;">Tgl. Cetak</span> : {{ formatDateTime(new Date().toISOString()) }}
            </div>
            <div style="width: 60%;" class="text-end">
              <div class="fst-italic fw-bold text-center mb-2" style="font-size: 8pt;">
                *Dokumen dinyatakan sah apabila telah di stamp (cap) dan ttd oleh pihak yang berwenang.
              </div>
              <table class="table-print table-bordered border-dark text-center ms-auto mb-0" style="width: 100%; font-size: 9pt;">
                <thead class="fw-bold bg-light">
                  <tr><th class="p-1" width="33%">Dibuat</th><th class="p-1" width="33%">Diperiksa</th><th class="p-1" width="33%">Disetujui</th></tr>
                </thead>
                <tbody><tr><td style="height: 60px;"></td><td></td><td></td></tr></tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- LAYOUT 2: BUKTI REKAP TIKET TERCETAK HISTORIS -->
        <template v-if="printMode === 'rekap'">
          <table class="w-100 mb-4 text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1">No. Rekap (TKR)</td>
              <td width="35%" class="p-1 fw-bold pe-2" style="text-align: right;">{{ itemToPrint.rekap.no_bukti_internal }}</td>
              <td width="15%" class="fw-bold p-1 ps-4">Tanggal Rekap</td>
              <td width="35%" class="p-1 fw-bold pe-2" style="text-align: right;">{{ formatDateStr(itemToPrint.rekap.tanggal_rekap) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1">Segmen Tiket</td>
              <td class="p-1 fw-bold pe-2 text-uppercase text-dark" style="text-align: right;">{{ itemToPrint.segmen_nama }}</td>
              <td class="fw-bold p-1 ps-4">Pihak Event/EO</td>
              <td class="p-1 fw-bold text-uppercase text-danger pe-2" style="text-align: right;">{{ itemToPrint.eo_nama }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1">Timestamp Log</td>
              <td class="p-1 pe-2" style="text-align: right;">{{ formatDateTime(itemToPrint.rekap.created_at) }}</td>
              <td class="fw-bold p-1 ps-4">Platform Tiket</td>
              <td class="p-1 fw-bold text-uppercase text-primary pe-2" style="text-align: right;">{{ itemToPrint.platform_nama }}</td>
            </tr>
          </table>

          <div class="text-dark" style="font-size: 10pt; border-top: 1px solid #dee2e6; padding-top: 15px;">
            <p class="mb-3">
              Bukti sah rekapitulasi data mutasi tiket (Dashboard Platform: <strong>{{ itemToPrint.platform_nama }}</strong>) 
              atas Hak Acara/Event (Klien: <strong>{{ itemToPrint.eo_nama }}</strong>) dengan detail historis sebagai berikut:
            </p>

            <table class="w-100 table-print border-dark text-dark mt-3 mb-3">
              <thead class="bg-light fw-bold">
                <tr><th class="p-2 text-center" colspan="3">HISTORIS KUANTITAS (QTY) & SALDO TIKET</th></tr>
                <tr>
                  <th class="p-2 text-center" width="30%">Indikator</th>
                  <th class="p-2 text-center" width="20%">Qty Tiket</th>
                  <th class="p-2 text-center" width="50%">Saldo Penjualan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="p-2 fw-bold">1. Tercatat Sebelumnya</td>
                  <td class="p-2 text-center">{{ formatNominal(itemToPrint.rekap.qty_tercatat) }} Pcs</td>
                  <td class="p-2 text-end">Rp {{ formatNominal(itemToPrint.rekap.saldo_tercatat) }}</td>
                </tr>
                <tr>
                  <td class="p-2 fw-bold">2. Saat Ini (Dashboard)</td>
                  <td class="p-2 text-center">{{ formatNominal(itemToPrint.rekap.qty_baru) }} Pcs</td>
                  <td class="p-2 text-end">Rp {{ formatNominal(itemToPrint.rekap.saldo_baru) }}</td>
                </tr>
                <tr class="bg-light">
                  <td class="p-2 fw-bold fst-italic text-primary">-> NILAI MUTASI (PIUTANG)</td>
                  <td class="p-2 text-center fw-bold fst-italic text-primary">{{ formatNominal(itemToPrint.rekap.mutasi_qty) }} Pcs</td>
                  <td class="p-2 text-end fw-bold fst-italic text-primary">Rp {{ formatNominal(itemToPrint.rekap.mutasi_kotor) }}</td>
                </tr>
                
                <tr><td colspan="3" class="p-0 border-0" style="height: 10px;"></td></tr>
                <tr><td colspan="3" class="p-2 fw-bold bg-light">Rincian Penyesuaian Jurnal (Mutasi Saat Ini):</td></tr>
                
                <tr v-for="(row, idx) in itemToPrint.adjustments" :key="idx">
                  <td colspan="2" class="p-2"><span class="ps-3">{{ row.dampak === 'pengurang' ? '-' : '+' }} {{ row.keterangan }}</span></td>
                  <td class="p-2 text-end" :class="row.dampak === 'pengurang' ? 'text-danger' : 'text-success'">
                    <span v-if="row.dampak === 'pengurang'">- Rp {{ formatNominal(row.nominal_calculated) }}</span>
                    <span v-else>+ Rp {{ formatNominal(row.nominal_calculated) }}</span>
                  </td>
                </tr>
                
                <tr v-if="itemToPrint.adjustments.length === 0">
                  <td colspan="3" class="p-2 text-center text-muted fst-italic">Tidak ada penyesuaian.</td>
                </tr>
              </tbody>
              <tfoot class="fw-bold">
                <tr style="background-color: #e2e8f0;">
                  <td colspan="2" class="p-2 text-end text-uppercase">HAK EVENT (NETTO) PER MUTASI INI :</td>
                  <td class="p-2 text-end fs-6 text-dark">Rp {{ formatNominal(itemToPrint.rekap.netto_hutang) }}</td>
                </tr>
                <tr style="background-color: #cbd5e1;">
                  <td colspan="2" class="p-2 text-end text-uppercase">TOTAL HAK FINAL (AKUMULASI S/D SAAT INI) :</td>
                  <td class="p-2 text-end fs-5 text-danger fw-bolder">Rp {{ formatNominal(itemToPrint.hak_final) }}</td>
                </tr>
              </tfoot>
            </table>

            <p class="fst-italic fw-bold mb-4" style="font-size: 10pt;">
              Terbilang Total Hak Final : {{ formatTerbilang(itemToPrint.hak_final) }}
            </p>
            <div class="fw-bold mb-1" style="font-size: 10pt;">Uraian Rekapitulasi:</div>
            <div class="border border-dark p-2 mb-5 bg-white" style="font-size: 10pt; min-height: 45px;">
              {{ itemToPrint.rekap.keterangan }}
            </div>
          </div>
        </template>

        <!-- FOOTER TANDA TANGAN BERSAMA (HANYA UNTUK REKAP TIKET) -->
        <table class="w-100 text-center text-dark mt-4" style="font-size: 10pt;" v-if="printMode === 'rekap'">
          <tr>
            <td width="40%"></td>
            <td width="30%" class="fw-bold">Manajemen / Agency</td>
            <td width="30%" class="fw-bold">Pihak Event / EO</td>
          </tr>
          <tr><td style="height: 80px;"></td><td></td><td></td></tr>
          <tr>
            <td class="text-start align-bottom" style="font-size: 9pt;">
              <div class="mb-1"><span class="fw-bold d-inline-block" style="width: 70px;">Tgl. Cetak</span> : {{ formatDateTime(new Date().toISOString()) }}</div>
            </td>
            <td class="fw-bold">{{ company.nama || 'Manajemen' }}</td>
            <td class="fw-bold">{{ itemToPrint?.eo_nama || 'Klien' }}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- MODAL FORM INPUT REKAP TIKET -->
    <div v-if="isModalOpen" class="custom-modal-overlay screen-only">
      <div v-if="activeDropdown" class="position-fixed top-0 start-0 w-100 h-100 overlay-dropdown" @click="closeAllDropdowns"></div>

      <div class="custom-modal-card card border-0 shadow-lg rounded-0 overflow-hidden" style="max-width: 1200px; width: 95%; z-index: 1050;">
        <div class="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center flex-shrink-0">
          <h5 class="fw-bold mb-0 text-dark">
            <i class="bi bi-ticket-detailed text-primary me-2"></i> Form Rekapitulasi Tiket (TKR) & Settlement Jurnal
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="card-body p-4 modal-body-scroll custom-scrollbar bg-light bg-opacity-50">
          
          <div class="bg-white p-3 rounded-0 border shadow-sm mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h6 class="fw-bold mb-0 text-dark">1. Anchor Master Tiket / Segmen</h6>
              <span class="badge bg-secondary rounded-0">{{ form.no_bukti_internal }}</span>
            </div>
            
            <div class="row g-3">
              <div class="col-md-12 border-bottom pb-3 mb-2">
                <label class="form-label small fw-bold text-dark">Pilih Segmen Tiket (Master) <i class="bi bi-info-circle ms-1" title="Pusat relasi EO, Platform, dan Kalkulasi Histori"></i> <span class="text-danger">*</span></label>
                <select class="form-select border-dark rounded-0 fw-bold" v-model="form.master_tiket_id" @change="handleMasterTiketSelect">
                  <option value="" disabled>-- Pilih Segmen Tiket --</option>
                  <option v-for="mt in masterTikets" :key="mt.id" :value="mt.id">
                    {{ mt.kode_tiket }} - {{ mt.nama_segmen }} (EO: {{ mt.master_hutang?.pihak_lawan?.nama }})
                  </option>
                </select>
              </div>

              <!-- PREVIEW RELASI (OTOMATIS) -->
              <div class="col-md-6 border-end" v-if="form.master_tiket_id">
                <label class="form-label small fw-bold text-danger">Master Hutang (Event / EO)</label>
                <input type="text" class="form-control form-control-sm bg-light rounded-0 fw-bold text-danger" :value="previewRelasi.nama_eo" readonly>
                <div class="small text-muted mt-1">Akun (K): {{ previewRelasi.coa_hutang }}</div>
              </div>
              <div class="col-md-6" v-if="form.master_tiket_id">
                <label class="form-label small fw-bold text-primary">Master Piutang (Platform Tiket)</label>
                <input type="text" class="form-control form-control-sm bg-light rounded-0 fw-bold text-primary" :value="previewRelasi.nama_platform" readonly>
                <div class="small text-muted mt-1">Akun (D): {{ previewRelasi.coa_piutang }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white p-3 rounded-0 border shadow-sm mb-4" v-if="form.master_tiket_id">
            <h6 class="fw-bold mb-3 border-bottom pb-2">2. Kalkulasi Histori (Kuantitas & Saldo)</h6>
            
            <div class="row g-3 align-items-end mb-3 pb-3 border-bottom border-light">
              <div class="col-md-4">
                <label class="form-label small fw-bold text-muted">Total Qty Tiket Tercatat (Pcs)</label>
                <input type="text" class="form-control bg-light rounded-0 text-muted fw-bold text-center" :value="formatInputRupiah(form.qty_tercatat)" readonly>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-dark">Total Qty Tiket Saat Ini (Pcs) <span class="text-danger">*</span></label>
                <input type="text" class="form-control rounded-0 border-dark fw-bold text-dark text-center" :value="formatInputRupiah(form.qty_baru)" @input="(e) => handleNumberInput('qty_baru', e)" placeholder="0">
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-secondary">MUTASI QTY TIKET</label>
                <input type="text" class="form-control bg-secondary bg-opacity-10 border-secondary fw-bold text-secondary text-center rounded-0" :value="formatInputRupiah(kalkulasiMutasiQty)" readonly>
              </div>
            </div>

            <div class="row g-3 align-items-end">
              <div class="col-md-4">
                <label class="form-label small fw-bold text-muted">Total Saldo Tercatat (Histori)</label>
                <div class="input-group">
                  <span class="input-group-text bg-light rounded-0 border-secondary text-muted">Rp</span>
                  <input type="text" class="form-control bg-light rounded-0 border-secondary text-muted fw-bold text-end" :value="formatInputRupiah(form.saldo_tercatat)" readonly>
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-dark">Total Saldo Saat Ini (Dashboard) <span class="text-danger">*</span></label>
                <div class="input-group">
                  <span class="input-group-text bg-white rounded-0 border-dark">Rp</span>
                  <input type="text" class="form-control rounded-0 border-dark fw-bold text-dark text-end" :value="formatInputRupiah(form.saldo_baru)" @input="(e) => handleNumberInput('saldo_baru', e)" placeholder="0">
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-primary">NILAI MUTASI KOTOR (PIUTANG)</label>
                <div class="input-group">
                  <span class="input-group-text bg-primary bg-opacity-10 border-primary rounded-0 text-primary fw-bold">Rp</span>
                  <input type="text" class="form-control bg-primary bg-opacity-10 border-primary fw-bold text-primary text-end rounded-0" :value="formatInputRupiah(kalkulasiMutasiSaldo)" readonly>
                </div>
                <small v-if="kalkulasiMutasiSaldo < 0" class="text-danger d-block mt-1" style="font-size: 0.7rem;">Nilai saldo baru lebih kecil dari historis.</small>
              </div>

              <div class="col-md-5 mt-4">
                <label class="form-label small fw-bold">Tanggal Rekap <span class="text-danger">*</span></label>
                <input type="date" class="form-control rounded-0" v-model="form.tanggal_rekap">
              </div>
              <div class="col-md-7 mt-4">
                <label class="form-label small fw-bold">Uraian / Keterangan Mutasi <span class="text-danger">*</span></label>
                <input type="text" class="form-control rounded-0" v-model="form.keterangan" placeholder="Contoh: Rekap Penjualan Tiket Day 1...">
              </div>
            </div>
          </div>

          <div class="bg-white p-3 rounded-0 border shadow-sm position-relative" style="z-index: 10;" v-if="form.master_tiket_id">
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
              <div>
                <h6 class="fw-bold mb-0">3. Grid Jurnal Penyesuaian Fleksibel</h6>
                <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">Anda bisa input nilai Jurnal Mutasi saat ini, atau input nilai Akumulasi Saldo Terakhir agar sistem auto-kalkulasi selisihnya.</small>
              </div>
              <button class="btn btn-sm btn-outline-dark fw-bold rounded-0" @click="addJurnalRow">
                <i class="bi bi-plus-circle me-1"></i> Tambah Jurnal
              </button>
            </div>
            
            <div class="table-responsive border rounded-0 mt-3 mb-3 table-visible-overflow position-relative">
              <table class="table table-sm table-bordered align-middle mb-0">
                <thead class="bg-light text-center small">
                  <tr>
                    <th width="15%" class="align-middle">Keterangan / Nama</th>
                    <th width="12%" class="align-middle">Dampak EO</th>
                    <th width="18%" class="align-middle">COA DEBET</th>
                    <th width="18%" class="align-middle">COA KREDIT</th>
                    <th width="12%" class="align-middle">Mode Input</th>
                    <th width="18%" class="align-middle">Nilai (Rp)</th>
                    <th width="7%" class="align-middle">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in form.penyesuaian" :key="idx">
                    <td>
                      <input type="text" class="form-control form-control-sm rounded-0" v-model="row.keterangan" placeholder="Cth: Fee...">
                    </td>
                    <td>
                      <select class="form-select form-select-sm rounded-0 text-center" v-model="row.dampak" :class="row.dampak === 'penambah' ? 'text-success fw-bold' : 'text-danger fw-bold'" @change="updateNilaiCalculated(Number(idx))">
                        <option value="pengurang">Pengurang (-)</option>
                        <option value="penambah">Penambah (+)</option>
                      </select>
                    </td>
                    <td>
                      <div class="position-relative dropdown-container" :style="{ zIndex: activeDropdown === `row-${idx}-debet` ? 1050 : 1 }">
                        <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0" @click="toggleDropdown(`row-${idx}-debet`)">
                          <span class="text-truncate d-inline-block" style="max-width: 100px;" :class="{'text-muted': !row.coa_debet}">{{ getCoaLabel(row.coa_debet) }}</span>
                          <i class="bi bi-search small text-muted"></i>
                        </div>
                        <div v-if="activeDropdown === `row-${idx}-debet`" class="position-absolute bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu" style="min-width: 300px;">
                          <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Cari COA Debet..." v-model="searchQuery" @click.stop>
                          <div class="list-group list-group-flush">
                            <button v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click="selectGridCoa(Number(idx), 'coa_debet', coa.coa_code)">
                              <span class="fw-bold text-dark">{{ coa.coa_code }}</span> <br> <span class="text-dark">{{ coa.nama }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="position-relative dropdown-container" :style="{ zIndex: activeDropdown === `row-${idx}-kredit` ? 1050 : 1 }">
                        <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0" @click="toggleDropdown(`row-${idx}-kredit`)">
                          <span class="text-truncate d-inline-block" style="max-width: 100px;" :class="{'text-muted': !row.coa_kredit}">{{ getCoaLabel(row.coa_kredit) }}</span>
                          <i class="bi bi-search small text-muted"></i>
                        </div>
                        <div v-if="activeDropdown === `row-${idx}-kredit`" class="position-absolute bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu" style="min-width: 300px;">
                          <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Cari COA Kredit..." v-model="searchQuery" @click.stop>
                          <div class="list-group list-group-flush">
                            <button v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click="selectGridCoa(Number(idx), 'coa_kredit', coa.coa_code)">
                              <span class="fw-bold text-dark">{{ coa.coa_code }}</span> <br> <span class="text-dark">{{ coa.nama }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                       <select class="form-select form-select-sm rounded-0 text-center bg-light" v-model="row.mode_input" @change="updateNilaiCalculated(Number(idx))" title="Pilih cara kalkulasi">
                        <option value="mutasi">Mutasi Langsung</option>
                        <option value="akumulasi">Total Akumulasi</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" class="form-control form-control-sm text-end fw-bold rounded-0" 
                             :value="formatInputRupiah(row.nilai_input)" 
                             @input="(e) => handleGridNilaiInput(Number(idx), e)" 
                             placeholder="0">
                      
                      <div class="text-end mt-1 fw-bold" style="font-size: 0.7rem;" :class="row.dampak === 'pengurang' ? 'text-danger' : 'text-success'">
                        <span class="text-muted fw-normal" v-if="row.mode_input === 'akumulasi'" title="Histori Fee">Histori: {{ formatNominal(getHistoriFee(row.coa_debet, row.coa_kredit)) }} | </span>
                        Jurnal: Rp {{ formatNominal(row.nominal_calculated) }}
                      </div>
                    </td>
                    <td class="text-center align-middle">
                      <button class="btn btn-sm btn-light text-danger rounded-0" @click="removeJurnalRow(Number(idx))" title="Hapus Baris">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="form.penyesuaian.length === 0">
                    <td colspan="7" class="text-center text-muted fst-italic py-3" style="font-size: 0.8rem;">Tidak ada jurnal penyesuaian (Hak Bersih EO akan sama dengan Mutasi Kotor).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- SUMMARY PREVIEW BOX -->
          <div class="mt-4 p-3 bg-dark text-white rounded-0 shadow-sm border border-secondary" v-if="kalkulasiMutasiSaldo > 0">
            <h6 class="fw-bold mb-3 border-bottom border-secondary pb-2 text-warning"><i class="bi bi-diagram-3 me-2"></i>Preview Kalkulasi Hak EO (Settlement)</h6>
            <div class="row text-center fw-bold" style="font-size: 0.9rem;">
              <div class="col-4 border-end border-secondary">
                <div class="small opacity-75 fw-normal mb-1">1. Mutasi Kotor (Hak Awal)</div>
                <div class="text-info fs-5">Rp {{ formatNominal(kalkulasiMutasiSaldo) }}</div>
              </div>
              <div class="col-4 border-end border-secondary">
                <div class="small opacity-75 fw-normal mb-1">2. Total Jurnal Penyesuaian</div>
                <div class="text-light fs-6 mt-1">
                  <span class="text-success"><i class="bi bi-plus-circle"></i> Tambah: Rp {{ formatNominal(totalPenambah) }}</span> | 
                  <span class="text-danger"><i class="bi bi-dash-circle"></i> Kurang: Rp {{ formatNominal(totalPengurang) }}</span>
                </div>
              </div>
              <div class="col-4">
                <div class="small opacity-75 fw-normal mb-1">3. Netto Hak Payout EO</div>
                <div class="fs-5" :class="nilaiHutang < 0 ? 'text-danger' : 'text-warning'">Rp {{ formatNominal(nilaiHutang) }}</div>
                <div v-if="nilaiHutang < 0" class="small text-danger fw-normal" style="font-size: 0.7rem;">Nilai Netto minus! Periksa kembali nominal pengurang.</div>
              </div>
            </div>
          </div>

        </div>
        
        <div class="card-footer bg-white border-top text-end py-3 px-4 flex-shrink-0" style="z-index: 1040;">
          <button class="btn btn-light border fw-bold px-4 me-2 rounded-0" @click="closeModal">Batal</button>
          <button class="btn btn-primary fw-bold px-4 rounded-0" @click="saveData" :disabled="!isFormValid">
            <i class="bi bi-lightning-charge-fill me-1"></i> Proses Automasi
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

const rekapList = ref<any[]>([])
const masterTikets = ref<any[]>([])
const listCOA = ref<any[]>([])
const company = ref<any>({}) 
const feeHistoryMap = ref<any>({})

const isModalOpen = ref(false)
const currentUser = ref<any>(null)
const itemToPrint = ref<any>(null)
const printMode = ref<'jurnal' | 'rekap'>('jurnal')

const activeDropdown = ref<string | null>(null)
const searchQuery = ref('') 

const previewRelasi = ref({
  nama_eo: '-', coa_hutang: '-',
  nama_platform: '-', coa_piutang: '-'
})

const form = ref<any>({
  no_bukti_internal: '', 
  master_tiket_id: '',
  master_piutang_id: '', coa_piutang: '',
  master_hutang_id: '', coa_hutang: '',
  
  qty_tercatat: 0, qty_baru: 0,
  saldo_tercatat: 0, saldo_baru: 0,
  
  tanggal_rekap: '', keterangan: '',
  penyesuaian: [] 
})

// FITUR FILTER & SORTING & PAGINATION UNTUK TABEL
const searchTableQuery = ref('')
const searchColumn = ref('semua')
const sortColumn = ref('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const itemsPerPage = 10

watch(searchTableQuery, () => { currentPage.value = 1 })
watch(searchColumn, () => { currentPage.value = 1 })

const filteredData = computed(() => {
  if (!searchTableQuery.value) return rekapList.value
  const q = searchTableQuery.value.toLowerCase()
  return rekapList.value.filter(item => {
    if (searchColumn.value === 'semua') {
      return (item.no_bukti_internal?.toLowerCase().includes(q) ||
              item.nama_eo?.toLowerCase().includes(q) ||
              item.nama_platform?.toLowerCase().includes(q) ||
              item.nama_segmen?.toLowerCase().includes(q) ||
              item.keterangan?.toLowerCase().includes(q))
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
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedData.value.slice(start, end)
})

const handleSort = (col: string) => {
  if (sortColumn.value === col) { sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc' } 
  else { sortColumn.value = col; sortDirection.value = 'asc' }
  currentPage.value = 1
}

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) currentUser.value = JSON.parse(userData)
  await fetchCompanyProfile()
  await fetchDropdowns()
  await fetchData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })

const canCreate = computed(() => currentUser.value?.can_create === true)
const canDelete = computed(() => currentUser.value?.can_delete === true)

const generateNoBuktiTKR = () => {
  const now = new Date(); const yyyymmdd = now.toISOString().slice(0,10).replace(/-/g, '')
  const prefix = 'TKR' 
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let uniqCode = ''
  for (let i = 0; i < 6; i++) uniqCode += chars.charAt(Math.floor(Math.random() * chars.length))
  let userId = 'SYSTEM'
  if (currentUser.value?.user_id) {
    let rawId = String(currentUser.value.user_id).replace(/\s+/g, '').toUpperCase()
    userId = rawId.length > 8 ? rawId.substring(0, 6) : rawId
  }
  return `${prefix}-${yyyymmdd}-${uniqCode}-${userId}`
}

const generateUUID = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// KALKULASI DINAMIS FORM 
const kalkulasiMutasiQty = computed(() => {
  const mutasi = Number(form.value.qty_baru) - Number(form.value.qty_tercatat)
  return mutasi > 0 ? mutasi : 0
})

const kalkulasiMutasiSaldo = computed(() => {
  const mutasi = Number(form.value.saldo_baru) - Number(form.value.saldo_tercatat)
  return mutasi > 0 ? mutasi : 0
})

const totalPengurang = computed(() => form.value.penyesuaian.reduce((sum: number, row: any) => row.dampak === 'pengurang' ? sum + Number(row.nominal_calculated || 0) : sum, 0))
const totalPenambah = computed(() => form.value.penyesuaian.reduce((sum: number, row: any) => row.dampak === 'penambah' ? sum + Number(row.nominal_calculated || 0) : sum, 0))

// Hutang (Hak EO) = Piutang Kotor(Mutasi Saldo) + Penambah - Pengurang
const nilaiHutang = computed(() => kalkulasiMutasiSaldo.value + totalPenambah.value - totalPengurang.value)

const isFormValid = computed(() => {
  const hasEmptyGrid = form.value.penyesuaian.some((r: any) => !r.keterangan || !r.coa_debet || !r.coa_kredit || Number(r.nominal_calculated) < 0)

  return form.value.master_tiket_id && form.value.tanggal_rekap && form.value.keterangan && 
         kalkulasiMutasiSaldo.value >= 0 && nilaiHutang.value >= 0 && !hasEmptyGrid
})

const handleNumberInput = (field: string, e: Event) => {
  const target = e.target as HTMLInputElement | null
  if (target) form.value[field] = parseRupiah(target.value)
}

const handleGridNilaiInput = (idx: number, e: Event) => {
  const target = e.target as HTMLInputElement | null
  if (target) {
    form.value.penyesuaian[idx].nilai_input = parseRupiah(target.value)
    updateNilaiCalculated(idx)
  }
}

const getHistoriFee = (coaDebet: string, coaKredit: string) => {
  const key = `${coaDebet}-${coaKredit}`
  return feeHistoryMap.value[key] || 0
}

const updateNilaiCalculated = (idx: number) => {
  const row = form.value.penyesuaian[idx]
  if(row.mode_input === 'akumulasi') {
     const histori = getHistoriFee(row.coa_debet, row.coa_kredit)
     const calc = Number(row.nilai_input) - histori
     row.nominal_calculated = calc > 0 ? calc : 0
  } else {
     row.nominal_calculated = Number(row.nilai_input)
  }
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

const selectGridCoa = (idx: number, field: string, code: string) => { 
  form.value.penyesuaian[idx][field] = code; 
  updateNilaiCalculated(idx) 
  closeAllDropdowns() 
}

const addJurnalRow = () => { 
  form.value.penyesuaian.push({ 
    keterangan: '', dampak: 'pengurang', coa_debet: '', coa_kredit: '', 
    mode_input: 'mutasi', nilai_input: 0, nominal_calculated: 0 
  }) 
}
const removeJurnalRow = (idx: number) => { form.value.penyesuaian.splice(idx, 1) }

const handleMasterTiketSelect = async () => {
  const selected = masterTikets.value.find(m => m.id === form.value.master_tiket_id)
  if(selected) {
    form.value.master_piutang_id = selected.master_piutang_id
    form.value.master_hutang_id = selected.master_hutang_id
    form.value.coa_piutang = selected.coa_piutang
    form.value.coa_hutang = selected.coa_hutang

    previewRelasi.value.nama_eo = selected.master_hutang?.pihak_lawan?.nama || '-'
    previewRelasi.value.coa_hutang = getCoaLabel(selected.coa_hutang)
    previewRelasi.value.nama_platform = selected.master_piutang?.pihak_lawan?.nama || '-'
    previewRelasi.value.coa_piutang = getCoaLabel(selected.coa_piutang)

    await fetchHistoriTiket()
  }
}

const fetchHistoriTiket = async () => {
  if (!form.value.master_tiket_id) return
  AppAlert.loading('Menarik histori saldo & fee...')
  try {
    const { data: rekapHist, error } = await supabase.from('rekap_tiket')
      .select('mutasi_qty, mutasi_kotor, detail_penyesuaian')
      .eq('master_tiket_id', form.value.master_tiket_id)
    
    if (error) throw error

    let sumQty = 0
    let sumSaldo = 0
    let historyFee: Record<string, number> = {}

    if (rekapHist && rekapHist.length > 0) {
      rekapHist.forEach((r: any) => {
        sumQty += Number(r.mutasi_qty || 0)
        sumSaldo += Number(r.mutasi_kotor || 0)
        
        if(r.detail_penyesuaian && Array.isArray(r.detail_penyesuaian)) {
          r.detail_penyesuaian.forEach((fee: any) => {
            const key = `${fee.coa_debet}-${fee.coa_kredit}`
            if(!historyFee[key]) historyFee[key] = 0
            historyFee[key] += Number(fee.nominal_calculated || 0)
          })
        }
      })
    }

    form.value.qty_tercatat = sumQty
    form.value.saldo_tercatat = sumSaldo
    feeHistoryMap.value = historyFee
    
    form.value.penyesuaian.forEach((_: any, idx: number) => updateNilaiCalculated(idx))
    
    AppAlert.close()
  } catch (error) {
    console.error('Error fetch histori:', error); 
    form.value.saldo_tercatat = 0; form.value.qty_tercatat = 0
    feeHistoryMap.value = {}
    AppAlert.close()
  }
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
const parseRupiah = (val: string) => { if (!val) return 0; const parsed = Number(val.replace(/[^0-9]/g, '')); return isNaN(parsed) ? 0 : parsed }
const formatInputRupiah = (val: number | string) => { if (!val || val === 0 || val === '0') return ''; return new Intl.NumberFormat('id-ID').format(Number(val)) }

const terbilang = (angka: number): string => {
  const bilangan = ['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan','Sepuluh','Sebelas']
  if (angka < 12) return bilangan[angka]; if (angka < 20) return terbilang(angka - 10) + ' Belas'
  if (angka < 100) return terbilang(Math.floor(angka / 10)) + ' Puluh ' + terbilang(angka % 10)
  if (angka < 200) return 'Seratus ' + terbilang(angka - 100); if (angka < 1000) return terbilang(Math.floor(angka / 100)) + ' Ratus ' + terbilang(angka % 100)
  if (angka < 2000) return 'Seribu ' + terbilang(angka - 1000); if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + ' Ribu ' + terbilang(angka % 1000)
  if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + ' Juta ' + terbilang(angka % 1000000); return ''
}
const formatTerbilang = (angka: number) => { if (!angka) return 'Nol Rupiah'; return terbilang(angka).replace(/\s+/g, ' ').trim() + ' Rupiah' }

const fetchCompanyProfile = async () => { try { const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single(); if (data) company.value = data } catch (err) {} }

const fetchDropdowns = async () => {
  try {
    const { data: mtData } = await supabase.from('master_tiket').select('*, master_hutang(pihak_lawan(id, nama)), master_piutang(pihak_lawan(id, nama))')
    masterTikets.value = mtData || []
    
    const { data: coaData } = await supabase.from('coas').select('*').eq('sifat', 'D').order('coa_code', { ascending: true })
    listCOA.value = coaData || []
  } catch (err) {}
}

const fetchData = async () => {
  AppAlert.loading('Memuat data...')
  try {
    const { data, error } = await supabase.from('rekap_tiket')
      .select(`*, master_tiket(nama_segmen), master_hutang(pihak_lawan(nama)), master_piutang(pihak_lawan(nama))`)
      .order('created_at', { ascending: false }).limit(1000)
      
    if (error) throw error
    rekapList.value = data.map((d: any) => ({ 
      ...d, 
      nama_segmen: d.master_tiket?.nama_segmen || 'Unknown Segmen',
      nama_eo: d.master_hutang?.pihak_lawan?.nama || 'Unknown',
      nama_platform: d.master_piutang?.pihak_lawan?.nama || 'Unknown'
    }))
    AppAlert.close()
  } catch (err) { AppAlert.error('Gagal memuat data', err) }
}

const openAddModal = () => {
  if (!canCreate.value) return
  form.value = { 
    no_bukti_internal: generateNoBuktiTKR(), 
    master_tiket_id: '', master_piutang_id: '', coa_piutang: '', master_hutang_id: '', coa_hutang: '',
    qty_tercatat: 0, qty_baru: 0, saldo_tercatat: 0, saldo_baru: 0, 
    tanggal_rekap: new Date().toISOString().slice(0,10), keterangan: '', 
    penyesuaian: []
  }; 
  previewRelasi.value = { nama_eo: '-', coa_hutang: '-', nama_platform: '-', coa_piutang: '-' }
  feeHistoryMap.value = {}
  isModalOpen.value = true
}
const closeModal = () => { isModalOpen.value = false; closeAllDropdowns() }

const printJurnal = async (no_bukti: string) => {
  AppAlert.loading('Mempersiapkan Jurnal Internal...')
  try {
    const { data } = await supabase.from('rekap_tiket')
      .select('master_hutang(pihak_lawan(nama)), master_piutang(pihak_lawan(nama))')
      .eq('no_bukti_internal', no_bukti).single()
      
    const rekapData: any = data

    let pihakTerkait = '-'
    if (rekapData) {
        const eo = rekapData.master_hutang?.pihak_lawan?.nama || ''
        const plat = rekapData.master_piutang?.pihak_lawan?.nama || ''
        pihakTerkait = eo && plat ? `${eo} / ${plat}` : (eo || plat || '-')
    }

    const { data: trxData, error } = await supabase.from('transaksi').select('*').eq('kwitansi_internal', no_bukti).order('debet', { ascending: false }) 
    if (error) throw error
    if (!trxData || trxData.length === 0) throw new Error('Data jurnal tidak ditemukan.')

    let totalD = 0, totalK = 0
    const mappedTrx = trxData.map((t: any) => {
      totalD += Number(t.debet); totalK += Number(t.kredit)
      const matchedCoa = listCOA.value.find(c => c.coa_code === t.coa_saldo)
      return { ...t, nama_akun: matchedCoa ? matchedCoa.nama : 'Unknown Account' }
    })
    
    itemToPrint.value = { 
        header: trxData[0], 
        details: mappedTrx, 
        totalDebet: totalD, 
        totalKredit: totalK,
        pihak_terkait: pihakTerkait
    }
    printMode.value = 'jurnal'; AppAlert.close(); await nextTick(); setTimeout(() => window.print(), 400)
  } catch (err: any) { AppAlert.error('Gagal', err.message || err) }
}

const printRekap = async (no_bukti: string) => {
  AppAlert.loading('Mempersiapkan Bukti TKR...')
  try {
    const { data: rawRekapData, error: err1 } = await supabase.from('rekap_tiket')
      .select('*, master_tiket(nama_segmen), master_piutang(pihak_lawan(nama)), master_hutang(pihak_lawan(nama))')
      .eq('no_bukti_internal', no_bukti).single()
    if (err1) throw err1
    
    const rekapData: any = rawRekapData

    const { data: historiData, error: errHist } = await supabase.from('rekap_tiket')
      .select('netto_hutang')
      .eq('master_tiket_id', rekapData.master_tiket_id)
      .lte('created_at', rekapData.created_at)

    if (errHist) throw errHist

    let akumulasiHak = 0
    if (historiData) {
      akumulasiHak = historiData.reduce((sum: number, r: any) => sum + Number(r.netto_hutang), 0)
    }

    const rawGrid = rekapData.detail_penyesuaian || []

    itemToPrint.value = {
      rekap: rekapData,
      segmen_nama: rekapData.master_tiket?.nama_segmen || 'Segmen Tiket',
      eo_nama: rekapData.master_hutang?.pihak_lawan?.nama || 'Pihak Event',
      platform_nama: rekapData.master_piutang?.pihak_lawan?.nama || 'Platform Tiket',
      adjustments: rawGrid,
      hak_final: akumulasiHak 
    }

    printMode.value = 'rekap'
    AppAlert.close()
    await nextTick(); setTimeout(() => window.print(), 400)
  } catch (err: any) { AppAlert.error('Gagal', err.message || err) }
}

const saveData = async () => {
  if (!isFormValid.value) {
    AppAlert.error('Gagal', 'Pastikan semua kolom relasi wajib diisi, rincian jurnal lengkap, dan mutasi saldo >= 0!'); 
    return 
  }

  AppAlert.loading('Memproses Automasi TKR...')
  try {
    const currentUsername = currentUser.value?.nama || currentUser.value?.user_id || 'System'
    const now = new Date()
    const internalNoBukti = form.value.no_bukti_internal 
    const mutasiUtuh = kalkulasiMutasiSaldo.value
    const mutasiQty = kalkulasiMutasiQty.value
    const nilaiHtng = nilaiHutang.value

    const mt = masterTikets.value.find(m => m.id === form.value.master_tiket_id)
    const idPihakPiutang = mt?.master_piutang?.pihak_lawan?.id || null 
    const idPihakHutang = mt?.master_hutang?.pihak_lawan?.id || null 

    const payloadRekap = {
      id: generateUUID(),
      no_bukti_internal: internalNoBukti,
      master_tiket_id: form.value.master_tiket_id,
      master_piutang_id: form.value.master_piutang_id,
      master_hutang_id: form.value.master_hutang_id,
      tanggal_rekap: form.value.tanggal_rekap,
      
      qty_tercatat: form.value.qty_tercatat,
      qty_baru: form.value.qty_baru,
      mutasi_qty: mutasiQty,

      saldo_tercatat: form.value.saldo_tercatat,
      saldo_baru: form.value.saldo_baru,
      mutasi_kotor: mutasiUtuh,
      netto_hutang: nilaiHtng,

      detail_penyesuaian: form.value.penyesuaian, 
      keterangan: form.value.keterangan,
      created_by: currentUsername,
      created_at: now.toISOString()
    }

    let payloadTagihanPiutang = null
    if (mutasiUtuh > 0) {
      payloadTagihanPiutang = {
        id: generateUUID(), no_bukti_internal: internalNoBukti, master_piutang_id: form.value.master_piutang_id,
        nomor_tagihan: internalNoBukti, tanggal_tagihan: form.value.tanggal_rekap, jatuh_tempo: form.value.tanggal_rekap,
        jumlah_tagihan: mutasiUtuh, coa_debet: form.value.coa_piutang, coa_kredit: 'MULTI_JURNAL_TKR', 
        status_anggaran: 'TIDAK_TERKAIT', keterangan: form.value.keterangan, created_by: currentUsername, created_at: now.toISOString()
      }
    }

    let payloadTagihanHutang = null
    if (mutasiUtuh > 0) {
      payloadTagihanHutang = {
        id: generateUUID(), no_bukti_internal: internalNoBukti, master_hutang_id: form.value.master_hutang_id,
        nomor_tagihan: internalNoBukti, tanggal_tagihan: form.value.tanggal_rekap, jatuh_tempo: form.value.tanggal_rekap,
        jumlah_tagihan: mutasiUtuh, coa_debet: 'MULTI_JURNAL_TKR', coa_kredit: form.value.coa_hutang, 
        status_anggaran: 'TIDAK_TERKAIT', keterangan: form.value.keterangan, created_by: currentUsername, created_at: now.toISOString()
      }
    }

    const payloadJurnal = []
    
    if (mutasiUtuh > 0) {
      payloadJurnal.push({
        tanggal_transaksi: form.value.tanggal_rekap, kwitansi_internal: internalNoBukti, kwitansi_eksternal: internalNoBukti, 
        jenis_transaksi: 'REKAP_TIKET', keterangan: form.value.keterangan, coa_saldo: form.value.coa_piutang,
        pihak_piutang: idPihakPiutang, debet: mutasiUtuh, kredit: 0, created_by: currentUsername, created_at: now.toISOString()
      })

      payloadJurnal.push({
        tanggal_transaksi: form.value.tanggal_rekap, kwitansi_internal: internalNoBukti, kwitansi_eksternal: internalNoBukti, 
        jenis_transaksi: 'REKAP_TIKET', keterangan: form.value.keterangan, coa_saldo: form.value.coa_hutang,
        pihak_hutang: idPihakHutang, debet: 0, kredit: mutasiUtuh, created_by: currentUsername, created_at: now.toISOString()
      })
    }

    form.value.penyesuaian.forEach((row: any) => {
      const nom = Number(row.nominal_calculated)
      if (nom > 0) {
        payloadJurnal.push({
          tanggal_transaksi: form.value.tanggal_rekap, kwitansi_internal: internalNoBukti, kwitansi_eksternal: internalNoBukti, 
          jenis_transaksi: 'REKAP_TIKET', keterangan: `${row.keterangan} | TKR`, coa_saldo: row.coa_debet,
          debet: nom, kredit: 0, created_by: currentUsername, created_at: now.toISOString()
        })
        payloadJurnal.push({
          tanggal_transaksi: form.value.tanggal_rekap, kwitansi_internal: internalNoBukti, kwitansi_eksternal: internalNoBukti, 
          jenis_transaksi: 'REKAP_TIKET', keterangan: `${row.keterangan} | TKR`, coa_saldo: row.coa_kredit,
          debet: 0, kredit: nom, created_by: currentUsername, created_at: now.toISOString()
        })
      }
    })

    const { error: errRekap } = await supabase.from('rekap_tiket').insert([payloadRekap])
    if (errRekap) throw errRekap

    if (payloadTagihanPiutang) {
      const { error: errTP } = await supabase.from('tagihan_piutang').insert([payloadTagihanPiutang])
      if (errTP) throw errTP
    }

    if (payloadTagihanHutang) {
      const { error: errTH } = await supabase.from('tagihan_hutang').insert([payloadTagihanHutang])
      if (errTH) throw errTH
    }

    if (payloadJurnal.length > 0) {
      const { error: errJurnal } = await supabase.from('transaksi').insert(payloadJurnal)
      if (errJurnal) throw errJurnal 
    }

    AppAlert.success('Sukses!', 'Rekap Tiket (TKR) berhasil diamankan. Master dan Jurnal Ganda otomatis terbentuk.')
    closeModal(); await fetchData()
  } catch (err) { 
    AppAlert.error('Gagal Menyimpan', err) 
    console.error(err)
  }
}

const deleteData = async (no_internal: string) => {
  if (!canDelete.value) return
  const result = await Swal.fire({
    title: 'Void Rekap Tiket?', 
    html: `Batalkan TKR <b>${no_internal}</b>?<br><small class="text-danger">Aksi ini akan menghapus historis Rekap, Tagihan Piutang, Tagihan Hutang, dan seluruh Jurnal yang terbentuk secara simultan.</small>`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444'
  })
  if (result.isConfirmed) {
    AppAlert.loading('Memproses Void...')
    try {
      const { error: errJurnal } = await supabase.from('transaksi').delete().eq('kwitansi_internal', no_internal)
      if (errJurnal) throw errJurnal
      const { error: errTP } = await supabase.from('tagihan_piutang').delete().eq('no_bukti_internal', no_internal)
      if (errTP) throw errTP
      const { error: errTH } = await supabase.from('tagihan_hutang').delete().eq('no_bukti_internal', no_internal)
      if (errTH) throw errTH
      
      const { error: errRekap } = await supabase.from('rekap_tiket').delete().eq('no_bukti_internal', no_internal)
      if (errRekap) throw errRekap

      AppAlert.success('Dibatalkan!', 'Automasi rekap tiket berhasil di-void.')
      await fetchData()
    } catch (err: any) { AppAlert.error('Gagal', err.message || err) }
  }
}
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.dropdown-container { z-index: 1056; }
.custom-dropdown-menu { max-height: 250px; overflow-y: auto; z-index: 1060; }
.table-visible-overflow { overflow: visible !important; }
.custom-modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
  background-color: rgba(15, 23, 42, 0.6); display: flex; 
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
    display: block !important; width: 100% !important; padding: 10px !important; font-size: 9pt !important; color: black !important;
  }
  @page { margin: 10mm; }
  .table-print { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 9pt !important; }
  .table-print th, .table-print td { border: 1px solid black !important; color: black !important; padding: 4px 6px !important; }
  .info-table td { border: none !important; padding: 2px 8px !important; }
  .bg-light { background-color: #e9ecef !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-bg-gray { background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .tracking-wide { letter-spacing: 2px; }
  .text-dark { color: black !important; }
}
</style>