<template>
  <div class="setoran-tiket">
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Setoran Tiket (Pencairan)</h4>
          <p class="text-muted small mb-0">Penerimaan kas dari Reseller/Platform, pelunasan piutang, dan rekonsiliasi fee.</p>
        </div>
        <button v-if="canCreate" class="btn btn-primary fw-bold px-4 shadow-sm rounded-0" @click="openAddModal">
          <i class="bi bi-wallet2 me-2"></i> Input Setoran Baru
        </button>
      </div>

      <!-- FITUR PENCARIAN -->
      <div class="d-flex mb-3 gap-2 align-items-center">
        <select class="form-select form-select-sm w-auto rounded-0 border-secondary" v-model="searchColumn">
          <option value="semua">Semua Kategori</option>
          <option value="no_setoran">No. Setoran</option>
          <option value="nama_reseller">Nama Reseller/Agen</option>
          <option value="keterangan">Keterangan</option>
        </select>
        <div class="input-group input-group-sm w-25">
          <span class="input-group-text rounded-0 bg-white border-secondary"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control rounded-0 border-start-0 border-secondary ps-0" v-model="searchTableQuery" placeholder="Cari setoran...">
        </div>
      </div>

      <!-- TABEL DATA -->
      <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden">
        <div class="table-responsive" style="min-height: 440px;">
          <table class="table table-sm table-striped table-hover table-bordered align-middle mb-0" style="min-width: 1200px; font-size: 0.85rem;">
            <thead class="table-dark text-center align-middle">
              <tr>
                <th width="4%" class="py-3">No</th>
                <th width="14%" class="py-3 cursor-pointer" @click="handleSort('no_setoran')">
                  No. Setoran <i class="bi ms-1" :class="sortColumn==='no_setoran' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="12%" class="py-3 cursor-pointer" @click="handleSort('tanggal_setoran')">
                  Tgl Setor <i class="bi ms-1" :class="sortColumn==='tanggal_setoran' ? (sortDirection==='asc' ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="20%" class="py-3 cursor-pointer" @click="handleSort('nama_reseller')">
                  Reseller / Platform <i class="bi ms-1" :class="sortColumn==='nama_reseller' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="20%" class="py-3">Info Pembayaran</th>
                <th width="15%" class="py-3 cursor-pointer" @click="handleSort('nominal_setoran')">
                  Kas Masuk (Nett) <i class="bi ms-1" :class="sortColumn==='nominal_setoran' ? (sortDirection==='asc' ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="15%" class="py-3">Cetak Dokumen & Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedData.length === 0">
                <td colspan="7" class="text-center text-muted py-5">
                  <i class="bi bi-wallet2 fs-2 d-block mb-2"></i> Belum ada historis setoran tiket.
                </td>
              </tr>
              
              <tr v-for="(item, index) in paginatedData" :key="item.id">
                <td class="text-center text-muted">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td class="fw-bold text-dark text-center">
                  {{ item.no_setoran }}
                  <div class="text-muted mt-1" style="font-size: 0.7rem;">{{ formatDateTime(item.created_at) }}</div>
                </td>
                <td class="text-center fw-bold">{{ formatDate(item.tanggal_setoran) }}</td>
                <td>
                  <div class="fw-bold text-success">{{ item.nama_reseller }}</div>
                  <div class="small text-muted">{{ item.rincian_tkr?.length || 0 }} Tagihan dilunasi</div>
                </td>
                <td>
                  <div class="small"><span class="fw-bold">Akun:</span> {{ item.coa_kas }}</div>
                  <div class="small"><span class="fw-bold">Via:</span> {{ item.metode_pembayaran || '-' }} <span v-if="item.no_reff_transfer">({{ item.no_reff_transfer }})</span></div>
                </td>
                <td class="text-end fw-bold text-primary fs-6">Rp {{ formatNominal(item.nominal_setoran) }}</td>
                <td class="text-center text-nowrap">
                  <!-- TOMBOL CETAK 3 JENIS -->
                  <div class="btn-group me-2 shadow-sm rounded-0">
                    <button class="btn btn-sm btn-outline-danger" @click="printDoc(item.no_setoran, 'invoice')" title="Cetak Invoice Tagihan">
                      <i class="bi bi-receipt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" @click="printDoc(item.no_setoran, 'bkm')" title="Cetak Tanda Terima / BKM">
                      <i class="bi bi-cash-coin"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" @click="printDoc(item.no_setoran, 'jurnal')" title="Cetak Memorial Jurnal">
                      <i class="bi bi-journal-text"></i>
                    </button>
                  </div>
                  
                  <button v-if="canDelete" class="btn btn-sm btn-light text-danger border rounded-0 shadow-sm" @click="deleteData(item.no_setoran)" title="Void / Batalkan">
                    <i class="bi bi-x-circle"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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

    <!-- AREA CETAK KHUSUS (HIDDEN ON SCREEN) -->
    <div id="print-area" v-if="itemToPrint">
      <div class="print-container">
        <!-- KOP SURAT STANDAR -->
        <table class="w-100 table-print table-bordered border-dark mb-4">
          <tr>
            <td width="70%" class="p-2 align-middle print-bg-gray">
              <div class="d-flex align-items-center">
                <img v-if="company.logo_url" :src="company.logo_url" alt="Logo" style="max-height: 50px; margin-right: 15px;">
                <div>
                  <h5 class="mb-0 fw-bold text-dark text-uppercase" style="font-size: 11pt;">{{ company.nama || 'NAMA INSTANSI' }}</h5>
                  <div v-if="company.sub_nama" style="font-size: 9pt; font-weight: bold; margin-bottom: 2px;">{{ company.sub_nama }}</div>
                  <div style="font-size: 8pt; margin-bottom: 2px;">{{ company.alamat || 'Alamat Instansi' }}</div>
                  <div v-if="company.email" style="font-size: 8pt;">Email: {{ company.email }}</div>
                </div>
              </div>
            </td>
            <td width="30%" class="text-center align-middle print-bg-gray bg-light">
              <h4 class="mb-0 fw-bold text-dark tracking-wide" style="font-size: 13pt;">
                {{ printMode === 'invoice' ? 'INVOICE TAGIHAN' : printMode === 'bkm' ? 'TANDA TERIMA' : 'MEMORIAL JURNAL' }}
              </h4>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- LAYOUT 1: INVOICE TAGIHAN (GROSS -> NETT)  -->
        <!-- ========================================== -->
        <template v-if="printMode === 'invoice'">
          <table class="w-100 mb-3 info-table text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1">No. Invoice</td>
              <td width="35%" class="p-1 fw-bold pe-2" style="text-align: right;">{{ itemToPrint.data.no_setoran }}</td>
              <td width="15%" class="fw-bold p-1 ps-4">Tanggal</td>
              <td width="35%" class="p-1 fw-bold pe-2" style="text-align: right;">{{ formatDateStr(itemToPrint.data.tanggal_setoran) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1">Ditagihkan Ke</td>
              <td class="p-1 fw-bold text-uppercase text-success pe-2" style="text-align: right;">{{ itemToPrint.reseller_nama }}</td>
              <td class="fw-bold p-1 ps-4">Dibuat Oleh</td>
              <td class="p-1 text-uppercase pe-2" style="text-align: right;">{{ itemToPrint.data.created_by }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1">Terkait Akun</td>
              <td class="p-1 text-primary fw-bold pe-2" style="text-align: right;">{{ itemToPrint.coa_piutang }}</td>
              <td class="fw-bold p-1 ps-4">Timestamp</td>
              <td class="p-1 pe-2" style="text-align: right;">{{ formatDateTime(itemToPrint.data.created_at) }}</td>
            </tr>
          </table>

          <div class="text-dark" style="font-size: 10pt; border-top: 1px solid #dee2e6; padding-top: 12px;">
            <table class="w-100 table-print border-dark text-dark mt-2 mb-3">
              <thead class="bg-light fw-bold text-center">
                <tr>
                  <th class="p-2" width="5%">No</th>
                  <th class="p-2" width="22%">No. Rekap (TKR)</th>
                  <th class="p-2" width="33%">Segmen Tiket</th>
                  <th class="p-2" width="15%">Mutasi Qty</th>
                  <th class="p-2" width="25%">Subtotal Gross</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tkr, idx) in itemToPrint.data.rincian_tkr" :key="idx">
                  <td class="p-2 text-center">{{ Number(idx) + 1 }}</td>
                  <td class="p-2 text-center fw-bold">{{ tkr.no_bukti_internal }}</td>
                  <td class="p-2">{{ tkr.nama_segmen }}</td>
                  <td class="p-2 text-center">{{ formatNominal(tkr.mutasi_qty) }} Pcs</td>
                  <td class="p-2 text-end">Rp {{ formatNominal(tkr.mutasi_kotor) }}</td>
                </tr>
                <tr class="bg-light fw-bold">
                  <td colspan="4" class="p-2 text-end text-primary fst-italic">SUBTOTAL TAGIHAN (GROSS) :</td>
                  <td class="p-2 text-end text-primary fst-italic">Rp {{ formatNominal(itemToPrint.total_tagihan) }}</td>
                </tr>

                <!-- RINCIAN BIAYA YANG TIMBUL / PENYESUAIAN -->
                <tr><td colspan="5" class="p-0 border-0" style="height: 8px;"></td></tr>
                <tr><td colspan="5" class="p-2 fw-bold bg-light">Biaya yang Timbul / Penyesuaian Pencairan:</td></tr>
                
                <tr v-for="(adj, idx) in itemToPrint.adjustments" :key="'adj-' + idx">
                  <td colspan="4" class="p-2">
                    <span class="ps-3">{{ adj.posisi === 'D' ? '-' : '+' }} {{ adj.keterangan }} <small class="text-muted">({{ adj.coa_code }})</small></span>
                  </td>
                  <td class="p-2 text-end fw-bold" :class="adj.posisi === 'D' ? 'text-danger' : 'text-success'">
                    <span v-if="adj.posisi === 'D'">- Rp {{ formatNominal(adj.nominal) }}</span>
                    <span v-else>+ Rp {{ formatNominal(adj.nominal) }}</span>
                  </td>
                </tr>

                <tr v-if="!itemToPrint.adjustments || itemToPrint.adjustments.length === 0">
                  <td colspan="5" class="p-2 text-center text-muted fst-italic">Tidak ada potongan atau biaya tambahan.</td>
                </tr>
              </tbody>
              <tfoot class="fw-bold">
                <tr style="background-color: #cbd5e1;">
                  <td colspan="4" class="p-2 text-end text-uppercase">TOTAL TAGIHAN NETT (DITERIMA) :</td>
                  <td class="p-2 text-end fs-5 text-dark fw-bolder">Rp {{ formatNominal(itemToPrint.data.nominal_setoran) }}</td>
                </tr>
              </tfoot>
            </table>

            <p class="fst-italic fw-bold mb-4" style="font-size: 10pt;">
              Terbilang : {{ formatTerbilang(itemToPrint.data.nominal_setoran) }}
            </p>

            <div class="fw-bold mb-1" style="font-size: 10pt;">Keterangan Tagihan / Pencairan:</div>
            <div class="border border-dark p-2 mb-5 bg-white" style="font-size: 10pt; min-height: 45px;">
              {{ itemToPrint.data.keterangan || '-' }}
            </div>
          </div>
        </template>

        <!-- ==================================================== -->
        <!-- LAYOUT 2: TANDA TERIMA (SESUAI STANDAR SEBELUMNYA)   -->
        <!-- ==================================================== -->
        <template v-if="printMode === 'bkm'">
          <table class="w-100 mb-3 info-table text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1">No. Bukti</td>
              <td width="35%" class="p-1 fw-bold pe-2" style="text-align: right; text-transform: uppercase;">{{ itemToPrint.data.no_setoran }}</td>
              <td width="15%" class="fw-bold p-1 ps-4">Tanggal</td>
              <td width="35%" class="p-1 fw-bold pe-2" style="text-align: right;">{{ formatDateStr(itemToPrint.data.tanggal_setoran) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1">Bukti Eksternal</td>
              <td class="p-1 fw-bold pe-2" style="text-align: right; text-transform: uppercase;">{{ itemToPrint.data.no_reff_transfer || '-' }} - {{ itemToPrint.data.metode_pembayaran || 'SETORAN' }}</td>
              <td class="fw-bold p-1 ps-4">Dibuat Oleh</td>
              <td class="p-1 pe-2" style="text-align: right; text-transform: uppercase;">{{ itemToPrint.data.created_by }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1">Rekening Tujuan</td>
              <td class="p-1 fw-bold text-primary pe-2" style="text-align: right;">{{ itemToPrint.coa_kas_label }}</td>
              <td class="fw-bold p-1 ps-4">Timestamp</td>
              <td class="p-1 pe-2" style="text-align: right;">{{ formatDateTime(itemToPrint.data.created_at) }}</td>
            </tr>
          </table>

          <div class="text-dark" style="font-size: 10pt; border-top: 1px solid #dee2e6; padding-top: 15px;">
            <p class="fw-bold mb-3">
              Telah diterima pembayaran setoran dari <span class="text-uppercase">{{ itemToPrint.reseller_nama }}</span> pada tanggal {{ formatDateStr(itemToPrint.data.tanggal_setoran) }} sebesar :
            </p>

            <div class="border border-dark p-3 text-center mb-3 bg-white">
              <h3 class="mb-0 fw-bold text-dark" style="font-size: 16pt;">Rp {{ formatNominal(itemToPrint.data.nominal_setoran) }}</h3>
            </div>

            <p class="fst-italic fw-bold mb-4" style="font-size: 10pt;">
              Terbilang : {{ formatTerbilang(itemToPrint.data.nominal_setoran) }}
            </p>

            <div class="fw-bold mb-1" style="font-size: 10pt;">Untuk Tujuan Pembayaran</div>
            <div class="border border-dark p-2 mb-5 bg-white" style="font-size: 10pt; min-height: 45px;">
              Pelunasan {{ itemToPrint.data.rincian_tkr?.length || 0 }} Tagihan Rekap Tiket ({{ itemToPrint.tkr_list_str }}).
              <span v-if="itemToPrint.data.keterangan"> | {{ itemToPrint.data.keterangan }}</span>
            </div>
          </div>
        </template>

        <!-- ========================================== -->
        <!-- LAYOUT 3: JURNAL MEMORIAL                  -->
        <!-- ========================================== -->
        <template v-if="printMode === 'jurnal'">
          <table class="w-100 mb-2 info-table text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1 px-2">No Bukti</td>
              <td width="35%" class="fw-bold p-1 px-2 pe-2" style="text-align: right; text-transform: uppercase;">{{ itemToPrint.data.no_setoran }}</td>
              <td width="15%" class="fw-bold p-1 px-2 ps-4">Tanggal</td>
              <td width="35%" class="p-1 px-2 fw-bold pe-2" style="text-align: right;">{{ formatDateStr(itemToPrint.data.tanggal_setoran) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1 px-2">Dibuat Oleh</td>
              <td class="p-1 px-2 pe-2" style="text-align: right; text-transform: uppercase;">{{ itemToPrint.data.created_by }}</td>
              <td class="fw-bold p-1 px-2 ps-4">Timestamp</td>
              <td class="p-1 px-2 pe-2" style="text-align: right;">{{ formatDateTime(itemToPrint.data.created_at) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1 px-2">Pihak Terkait</td>
              <td class="p-1 px-2 pe-2 fw-bold text-success" style="text-align: right; text-transform: uppercase;">{{ itemToPrint.reseller_nama }}</td>
              <td class="fw-bold p-1 px-2 ps-4">Dicetak Oleh</td>
              <td class="p-1 px-2 pe-2" style="text-align: right; text-transform: uppercase;">{{ currentUser?.nama || 'System' }}</td>
            </tr>
          </table>

          <div class="w-100 p-2 mb-3 mt-3 border border-dark text-dark" style="font-size: 9pt;">
            <strong>Uraian Transaksi:</strong> {{ itemToPrint.data.keterangan || 'Setoran & Realisasi Fee Tiket' }}
          </div>

          <table class="w-100 table-print table-bordered border-dark text-dark mt-3">
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
              <tr v-for="(jurnal, idx) in itemToPrint.jurnal_details" :key="idx">
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
                <td class="p-1 px-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(itemToPrint.total_jurnal_debet) }}</span></div></td>
                <td class="p-1 px-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(itemToPrint.total_jurnal_kredit) }}</span></div></td>
              </tr>
            </tfoot>
          </table>

          <!-- FOOTER KHUSUS JURNAL -->
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

        <!-- FOOTER TANDA TANGAN (UNTUK INVOICE & TANDA TERIMA) -->
        <table class="w-100 text-center text-dark mt-4" style="font-size: 10pt;" v-if="printMode !== 'jurnal'">
          <tr>
            <td width="40%"></td>
            <td width="30%" class="fw-bold">Bendahara</td>
            <td width="30%" class="fw-bold">{{ printMode === 'invoice' ? 'Pihak Tertagih' : 'Pihak Penyetor' }}</td>
          </tr>
          <tr><td style="height: 80px;"></td><td></td><td></td></tr>
          <tr>
            <td class="text-start align-bottom" style="font-size: 9pt;">
              <div class="mb-1"><span class="fw-bold d-inline-block" style="width: 70px;">Tgl. Cetak</span> : {{ formatDateTime(new Date().toISOString()) }}</div>
            </td>
            <td class="fw-bold">{{ company.nama || 'Bendahara' }}</td>
            <td class="fw-bold">{{ itemToPrint?.reseller_nama || '-' }}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- MODAL FORM INPUT SETORAN -->
    <div v-if="isModalOpen" class="custom-modal-overlay screen-only">
      <div v-if="activeDropdown" class="position-fixed top-0 start-0 w-100 h-100 overlay-dropdown" @click="closeAllDropdowns"></div>

      <div class="custom-modal-card card border-0 shadow-lg rounded-0 overflow-hidden" style="max-width: 1200px; width: 95%; z-index: 1050;">
        <div class="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center flex-shrink-0">
          <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-wallet2 text-primary me-2"></i> Form Setoran & Realisasi Fee</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="card-body p-4 modal-body-scroll custom-scrollbar bg-light bg-opacity-50">
          
          <!-- STEP 1: PILIH RESELLER & TAGIHAN TKR -->
          <div class="bg-white p-3 rounded-0 border shadow-sm mb-4">
            <h6 class="fw-bold mb-3 border-bottom pb-2 text-primary">1. Identifikasi Reseller & Pilih Tagihan TKR</h6>
            <div class="row g-3">
              <div class="col-md-5">
                <label class="form-label small fw-bold">No. Setoran</label>
                <input type="text" class="form-control bg-light rounded-0 fw-bold" v-model="form.no_setoran" readonly>
                
                <label class="form-label small fw-bold mt-3">Pilih Reseller / Penyetor <span class="text-danger">*</span></label>
                <select class="form-select border-success rounded-0 fw-bold" v-model="form.master_reseller_id" @change="fetchOutstandingTKR">
                  <option value="" disabled>-- Pilih Reseller --</option>
                  <option v-for="mr in masterResellers" :key="mr.id" :value="mr.id">{{ mr.nama_reseller }}</option>
                </select>
                <small class="text-muted d-block mt-1" v-if="form.master_reseller_id">Akun Piutang: <strong>{{ activeResellerCoa }}</strong></small>
              </div>

              <div class="col-md-7">
                <label class="form-label small fw-bold">Daftar Tagihan Rekap Tiket (TKR) Belum Lunas:</label>
                <div class="border rounded-0 overflow-auto custom-scrollbar p-0" style="height: 140px; background-color: #f8fafc;">
                  <table class="table table-sm table-hover mb-0" style="font-size: 0.8rem;">
                    <thead class="table-light sticky-top">
                      <tr><th class="ps-3" width="5%">☑</th><th width="35%">No. TKR</th><th width="30%">Segmen</th><th width="30%" class="text-end pe-3">Nilai Gross</th></tr>
                    </thead>
                    <tbody>
                      <tr v-if="outstandingTKR.length === 0">
                        <td colspan="4" class="text-center text-muted py-4 fst-italic">Tidak ada tagihan tertunggak.</td>
                      </tr>
                      <tr v-for="tkr in outstandingTKR" :key="tkr.id" class="cursor-pointer" @click="toggleTkrSelection(tkr)">
                        <td class="ps-3"><input class="form-check-input" type="checkbox" :checked="isTkrSelected(tkr.id)" @click.stop="toggleTkrSelection(tkr)"></td>
                        <td class="fw-bold">{{ tkr.no_bukti_internal }}</td>
                        <td>{{ tkr.master_tiket?.nama_segmen }}</td>
                        <td class="text-end pe-3 fw-bold text-primary">Rp {{ formatNominal(tkr.mutasi_kotor) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-4 mb-4">
            <!-- STEP 2: PENERIMAAN KAS RIIL -->
            <div class="col-md-5">
              <div class="bg-white p-3 rounded-0 border border-success shadow-sm h-100">
                <h6 class="fw-bold mb-3 border-bottom border-success pb-2 text-success">2. Penerimaan Kas (Riil Masuk Bank)</h6>
                
                <label class="form-label small fw-bold">Akun Penampung Kas (DEBET) <span class="text-danger">*</span></label>
                <div class="position-relative dropdown-container mb-3">
                  <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0" @click="toggleDropdown('coa_kas')">
                    <span class="text-truncate" :class="{'text-muted': !form.coa_kas}">{{ getCoaLabel(form.coa_kas) || 'Pilih COA Kas/Bank...' }}</span>
                  </div>
                  <div v-if="activeDropdown === 'coa_kas'" class="position-absolute w-100 bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu">
                    <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Cari COA..." v-model="searchQuery" @click.stop>
                    <div class="list-group list-group-flush">
                      <button v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click="selectGridCoa(-1, 'coa_kas', coa.coa_code)">
                        <span class="fw-bold text-success">{{ coa.coa_code }}</span> - {{ coa.nama }}
                      </button>
                    </div>
                  </div>
                </div>

                <label class="form-label small fw-bold">Nominal Kas Diterima (Nett) <span class="text-danger">*</span></label>
                <div class="input-group mb-3">
                  <span class="input-group-text bg-success bg-opacity-10 border-success text-success fw-bold rounded-0">Rp</span>
                  <input type="text" class="form-control text-end fw-bold text-success border-success rounded-0 fs-5" :value="formatInputRupiah(form.nominal_setoran)" @input="(e) => handleNumberInput('nominal_setoran', e)" placeholder="0">
                </div>

                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label small fw-bold">Tanggal Setor <span class="text-danger">*</span></label>
                    <input type="date" class="form-control form-control-sm rounded-0" v-model="form.tanggal_setoran">
                  </div>
                  <div class="col-6">
                    <label class="form-label small fw-bold">Metode Via</label>
                    <input type="text" class="form-control form-control-sm rounded-0" v-model="form.metode_pembayaran" placeholder="Transfer BCA...">
                  </div>
                  <div class="col-6 mt-2">
                    <label class="form-label small fw-bold">No. Referensi Bank</label>
                    <input type="text" class="form-control form-control-sm rounded-0" v-model="form.no_reff_transfer" placeholder="No. Ref / Bukti...">
                  </div>
                  <div class="col-6 mt-2">
                    <label class="form-label small fw-bold">Keterangan</label>
                    <input type="text" class="form-control form-control-sm rounded-0" v-model="form.keterangan" placeholder="Keterangan mutasi...">
                  </div>
                </div>
              </div>
            </div>

            <!-- BALANCING SUMMARY -->
            <div class="col-md-7">
               <div class="bg-dark p-3 rounded-0 shadow-sm h-100 d-flex flex-column justify-content-center text-white border border-secondary">
                  <h6 class="fw-bold mb-3 border-bottom border-secondary pb-2 text-warning text-center"><i class="bi bi-scales me-2"></i>Status Keseimbangan Jurnal</h6>
                  
                  <div class="row text-center mb-3">
                    <div class="col-6 border-end border-secondary">
                      <div class="small text-muted fw-bold mb-1">TOTAL PIUTANG DILUNASI (KREDIT)</div>
                      <div class="fs-4 fw-bold text-info">Rp {{ formatNominal(totalTagihanGross) }}</div>
                    </div>
                    <div class="col-6">
                      <div class="small text-muted fw-bold mb-1">TOTAL KAS MASUK (DEBET)</div>
                      <div class="fs-4 fw-bold text-success">Rp {{ formatNominal(form.nominal_setoran) }}</div>
                    </div>
                  </div>

                  <div class="alert rounded-0 mb-0 py-2 d-flex justify-content-between align-items-center" :class="keseimbangan.selisih === 0 ? 'alert-success border-success' : 'alert-danger border-danger'">
                    <div class="fw-bold">
                      <i class="bi" :class="keseimbangan.selisih === 0 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'"></i>
                      {{ keseimbangan.selisih === 0 ? 'Jurnal Balance (Seimbang)' : 'Jurnal Belum Balance (Selisih)' }}
                    </div>
                    <div class="fs-5 fw-bold font-monospace">Rp {{ formatNominal(Math.abs(keseimbangan.selisih)) }}</div>
                  </div>
                  <div class="text-center mt-2 small text-light opacity-75" v-if="keseimbangan.selisih !== 0">
                    Gunakan <strong>Grid Jurnal (Step 3)</strong> di bawah untuk menyeimbangkan selisih ini (Misal: Catat Beban Admin / Potongan Fee).
                  </div>
               </div>
            </div>
          </div>

          <!-- STEP 3: GRID JURNAL MANUAL (BALANCING) -->
          <div class="bg-white p-3 rounded-0 border shadow-sm position-relative" style="z-index: 10;">
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
              <div>
                <h6 class="fw-bold mb-0">3. Grid Jurnal Penyesuaian (Realisasi Fee / Biaya yang Timbul)</h6>
                <small class="text-muted" style="font-size: 0.75rem;">Baris yang diinput di sini juga akan ditampilkan sebagai rincian potongan/penyesuaian pada cetakan Invoice.</small>
              </div>
              <button class="btn btn-sm btn-outline-dark fw-bold rounded-0" @click="addJurnalRow">
                <i class="bi bi-plus-circle me-1"></i> Tambah Jurnal Baris
              </button>
            </div>
            
            <div class="table-responsive border rounded-0 mt-3 table-visible-overflow position-relative">
              <table class="table table-sm table-bordered align-middle mb-0">
                <thead class="bg-light text-center small">
                  <tr>
                    <th width="30%" class="align-middle">Keterangan Biaya / Jurnal</th>
                    <th width="30%" class="align-middle">Pilih Akun (COA)</th>
                    <th width="15%" class="align-middle">Posisi (D/K)</th>
                    <th width="20%" class="align-middle">Nominal (Rp)</th>
                    <th width="5%" class="align-middle">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in form.penyesuaian" :key="idx">
                    <td><input type="text" class="form-control form-control-sm rounded-0" v-model="row.keterangan" placeholder="Cth: Potongan Fee Platform / Admin Bank..."></td>
                    <td>
                      <div class="position-relative dropdown-container" :style="{ zIndex: activeDropdown === `row-${idx}-coa` ? 1050 : 1 }">
                        <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0" @click="toggleDropdown(`row-${idx}-coa`)">
                          <span class="text-truncate d-inline-block" style="max-width: 180px;" :class="{'text-muted': !row.coa_code}">{{ getCoaLabel(row.coa_code) || 'Pilih COA...' }}</span>
                        </div>
                        <div v-if="activeDropdown === `row-${idx}-coa`" class="position-absolute bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu" style="min-width: 300px;">
                          <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Cari COA..." v-model="searchQuery" @click.stop>
                          <div class="list-group list-group-flush">
                            <button v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click="selectGridCoa(Number(idx), 'coa_code', coa.coa_code)">
                              <span class="fw-bold text-dark">{{ coa.coa_code }}</span> <br> <span class="text-dark">{{ coa.nama }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select class="form-select form-select-sm rounded-0 text-center fw-bold" v-model="row.posisi" :class="row.posisi === 'D' ? 'text-success' : 'text-danger'">
                        <option value="D">DEBET (Potongan -)</option>
                        <option value="K">KREDIT (Penambah +)</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" class="form-control form-control-sm text-end fw-bold rounded-0" :value="formatInputRupiah(row.nominal)" @input="(e) => handleGridNilaiInput(Number(idx), e)" placeholder="0">
                    </td>
                    <td class="text-center align-middle">
                      <button class="btn btn-sm btn-light text-danger rounded-0" @click="removeJurnalRow(Number(idx))"><i class="bi bi-trash"></i></button>
                    </td>
                  </tr>
                  <tr v-if="form.penyesuaian.length === 0">
                    <td colspan="5" class="text-center text-muted fst-italic py-3 small">Kas riil sama persis dengan Piutang. Tidak butuh penyesuaian.</td>
                  </tr>
                </tbody>
                <tfoot class="bg-light fw-bold" style="font-size: 0.8rem;">
                  <tr>
                    <td colspan="3" class="text-end">Total Jurnal Penyesuaian (Debet / Potongan):</td>
                    <td class="text-end text-success">Rp {{ formatNominal(keseimbangan.total_grid_debet) }}</td><td></td>
                  </tr>
                  <tr>
                    <td colspan="3" class="text-end">Total Jurnal Penyesuaian (Kredit / Penambah):</td>
                    <td class="text-end text-danger">Rp {{ formatNominal(keseimbangan.total_grid_kredit) }}</td><td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
        
        <div class="card-footer bg-white border-top text-end py-3 px-4 flex-shrink-0" style="z-index: 1040;">
          <button class="btn btn-light border fw-bold px-4 me-2 rounded-0" @click="closeModal">Batal</button>
          <button class="btn btn-primary fw-bold px-4 rounded-0" @click="saveData" :disabled="!isFormValid || keseimbangan.selisih !== 0">
            <i class="bi bi-save me-1"></i> Simpan Setoran & Jurnal
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

const setoranList = ref<any[]>([])
const masterResellers = ref<any[]>([])
const outstandingTKR = ref<any[]>([]) 
const listCOA = ref<any[]>([])
const company = ref<any>({})

const isModalOpen = ref(false)
const currentUser = ref<any>(null)
const itemToPrint = ref<any>(null)
const printMode = ref<'invoice' | 'bkm' | 'jurnal'>('invoice')

const activeDropdown = ref<string | null>(null)
const searchQuery = ref('') 

const form = ref<any>({
  no_setoran: '', master_reseller_id: '', tanggal_setoran: '',
  selected_tkr: [], coa_kas: '', nominal_setoran: 0, 
  metode_pembayaran: '', no_reff_transfer: '', keterangan: '', penyesuaian: [] 
})

// === BALANCING ENGINE ===
const activeResellerCoa = computed(() => { const r = masterResellers.value.find(x => x.id === form.value.master_reseller_id); return r ? getCoaLabel(r.coa_piutang) : '-' })
const activeResellerCoaCode = computed(() => { const r = masterResellers.value.find(x => x.id === form.value.master_reseller_id); return r ? r.coa_piutang : '' })

const totalTagihanGross = computed(() => { return form.value.selected_tkr.reduce((sum:number, tkr:any) => sum + Number(tkr.mutasi_kotor), 0) })

const keseimbangan = computed(() => {
  const sumGridDebet = form.value.penyesuaian.reduce((sum:number, r:any) => r.posisi === 'D' ? sum + Number(r.nominal) : sum, 0)
  const sumGridKredit = form.value.penyesuaian.reduce((sum:number, r:any) => r.posisi === 'K' ? sum + Number(r.nominal) : sum, 0)
  
  const grandDebet = Number(form.value.nominal_setoran) + sumGridDebet
  const grandKredit = totalTagihanGross.value + sumGridKredit
  const selisih = grandDebet - grandKredit

  return { total_grid_debet: sumGridDebet, total_grid_kredit: sumGridKredit, grand_debet: grandDebet, grand_kredit: grandKredit, selisih: selisih }
})

const isFormValid = computed(() => {
  const hasEmptyGrid = form.value.penyesuaian.some((r: any) => !r.keterangan || !r.coa_code || Number(r.nominal) <= 0)
  return form.value.master_reseller_id && form.value.coa_kas && form.value.tanggal_setoran && form.value.selected_tkr.length > 0 && !hasEmptyGrid
})

const searchTableQuery = ref(''); const searchColumn = ref('semua'); const sortColumn = ref('created_at'); const sortDirection = ref<'asc' | 'desc'>('desc'); const currentPage = ref(1); const itemsPerPage = 10;
watch(searchTableQuery, () => { currentPage.value = 1 }); watch(searchColumn, () => { currentPage.value = 1 });

const filteredData = computed(() => {
  if (!searchTableQuery.value) return setoranList.value
  const q = searchTableQuery.value.toLowerCase()
  return setoranList.value.filter(item => {
    if (searchColumn.value === 'semua') return (item.no_setoran?.toLowerCase().includes(q) || item.nama_reseller?.toLowerCase().includes(q) || item.keterangan?.toLowerCase().includes(q))
    else return item[searchColumn.value]?.toString().toLowerCase().includes(q)
  })
})

const sortedData = computed(() => {
  const data = [...filteredData.value]
  data.sort((a, b) => { let valA = a[sortColumn.value] || ''; let valB = b[sortColumn.value] || ''; if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1; if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1; return 0 })
  return data
})
const totalPages = computed(() => Math.ceil(sortedData.value.length / itemsPerPage))
const paginatedData = computed(() => sortedData.value.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage))
const handleSort = (col: string) => { if (sortColumn.value === col) { sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc' } else { sortColumn.value = col; sortDirection.value = 'asc' }; currentPage.value = 1 }

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

const generateNoSET = () => {
  const now = new Date(); const yyyymmdd = now.toISOString().slice(0,10).replace(/-/g, '')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let uniqCode = ''
  for (let i = 0; i < 5; i++) uniqCode += chars.charAt(Math.floor(Math.random() * chars.length))
  return `SET-${yyyymmdd}-${uniqCode}`
}

const fetchCompanyProfile = async () => {
  try { const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single(); if (data) company.value = data } catch (err) {}
}

const fetchDropdowns = async () => {
  try {
    const { data: mrData } = await supabase.from('master_reseller').select('id, kode_reseller, nama_reseller, coa_piutang')
    masterResellers.value = mrData || []
    
    const { data: coaData } = await supabase.from('coas').select('*').eq('sifat', 'D').order('coa_code', { ascending: true })
    listCOA.value = coaData || []
  } catch (err) {}
}

const fetchData = async () => {
  AppAlert.loading('Memuat data setoran...')
  try {
    const { data, error } = await supabase.from('setoran_tiket')
      .select(`*, master_reseller(nama_reseller)`)
      .order('created_at', { ascending: false }).limit(1000)
      
    if (error) throw error
    setoranList.value = data.map((d: any) => ({ 
      ...d, nama_reseller: d.master_reseller?.nama_reseller || 'Unknown'
    }))
    AppAlert.close()
  } catch (err) { AppAlert.error('Gagal memuat data', err) }
}

const fetchOutstandingTKR = async () => {
  if (!form.value.master_reseller_id) return
  AppAlert.loading('Mencari tagihan pending...')
  form.value.selected_tkr = []
  try {
    const { data: existingSets } = await supabase.from('setoran_tiket').select('rincian_tkr').eq('master_reseller_id', form.value.master_reseller_id)
    let settledTkrIds: string[] = []
    if (existingSets) {
      existingSets.forEach(set => { if (set.rincian_tkr) { set.rincian_tkr.forEach((tkr:any) => settledTkrIds.push(tkr.id)) } })
    }

    const { data, error } = await supabase.from('rekap_tiket')
      .select('id, no_bukti_internal, mutasi_kotor, mutasi_qty, master_tiket(nama_segmen)')
      .eq('master_reseller_id', form.value.master_reseller_id)
      .gt('mutasi_kotor', 0)
    
    if (error) throw error

    outstandingTKR.value = data.filter((d:any) => !settledTkrIds.includes(d.id))
    AppAlert.close()
  } catch(err) {
    AppAlert.error('Gagal', err)
  }
}

const toggleTkrSelection = (tkr: any) => {
  const idx = form.value.selected_tkr.findIndex((x:any) => x.id === tkr.id)
  if (idx > -1) form.value.selected_tkr.splice(idx, 1)
  else form.value.selected_tkr.push({ id: tkr.id, no_bukti_internal: tkr.no_bukti_internal, mutasi_kotor: tkr.mutasi_kotor, mutasi_qty: tkr.mutasi_qty, nama_segmen: tkr.master_tiket?.nama_segmen })
}
const isTkrSelected = (id: string) => form.value.selected_tkr.some((x:any) => x.id === id)

const openAddModal = () => {
  if (!canCreate.value) return
  form.value = { 
    no_setoran: generateNoSET(), master_reseller_id: '', tanggal_setoran: new Date().toISOString().slice(0,10),
    selected_tkr: [], coa_kas: '', nominal_setoran: 0, metode_pembayaran: '', no_reff_transfer: '', keterangan: '', penyesuaian: [] 
  }; 
  outstandingTKR.value = []
  isModalOpen.value = true
}

const saveData = async () => {
  if (!isFormValid.value || keseimbangan.value.selisih !== 0) return 

  AppAlert.loading('Menyimpan Setoran & Jurnal...')
  try {
    const currentUsername = currentUser.value?.nama || currentUser.value?.user_id || 'System'
    const now = new Date()
    const internalNo = form.value.no_setoran

    const payloadSetoran = {
      no_setoran: internalNo,
      master_reseller_id: form.value.master_reseller_id,
      tanggal_setoran: form.value.tanggal_setoran,
      nominal_setoran: Number(form.value.nominal_setoran),
      metode_pembayaran: form.value.metode_pembayaran,
      no_reff_transfer: form.value.no_reff_transfer,
      coa_kas: form.value.coa_kas,
      rincian_tkr: form.value.selected_tkr,
      detail_penyesuaian: form.value.penyesuaian,
      keterangan: form.value.keterangan,
      created_by: currentUsername, created_at: now.toISOString()
    }

    const payloadJurnal = []
    
    // JURNAL 1: KAS BERTAMBAH (DEBET)
    if (payloadSetoran.nominal_setoran > 0) {
      payloadJurnal.push({ tanggal_transaksi: form.value.tanggal_setoran, kwitansi_internal: internalNo, kwitansi_eksternal: form.value.no_reff_transfer || internalNo, jenis_transaksi: 'SETORAN_TIKET', keterangan: `Penerimaan Kas Tiket | ${form.value.keterangan}`, coa_saldo: form.value.coa_kas, debet: payloadSetoran.nominal_setoran, kredit: 0, created_by: currentUsername })
    }

    // JURNAL 2: PIUTANG BERKURANG / LUNAS (KREDIT)
    if (totalTagihanGross.value > 0) {
      payloadJurnal.push({ tanggal_transaksi: form.value.tanggal_setoran, kwitansi_internal: internalNo, kwitansi_eksternal: form.value.no_reff_transfer || internalNo, jenis_transaksi: 'SETORAN_TIKET', keterangan: `Pelunasan Piutang Tiket | ${form.value.keterangan}`, coa_saldo: activeResellerCoaCode.value, debet: 0, kredit: totalTagihanGross.value, created_by: currentUsername })
    }

    // JURNAL 3: GRID PENYESUAIAN MANUAL (FEE DLL)
    form.value.penyesuaian.forEach((row: any) => {
      const nom = Number(row.nominal)
      if (nom > 0) {
        payloadJurnal.push({ tanggal_transaksi: form.value.tanggal_setoran, kwitansi_internal: internalNo, kwitansi_eksternal: internalNo, jenis_transaksi: 'SETORAN_TIKET_FEE', keterangan: `${row.keterangan} | SETORAN TIKET`, coa_saldo: row.coa_code, debet: row.posisi === 'D' ? nom : 0, kredit: row.posisi === 'K' ? nom : 0, created_by: currentUsername })
      }
    })

    const { error: errSet } = await supabase.from('setoran_tiket').insert([payloadSetoran])
    if (errSet) throw errSet

    if (payloadJurnal.length > 0) { const { error } = await supabase.from('transaksi').insert(payloadJurnal); if (error) throw error }

    AppAlert.success('Sukses!', 'Setoran Kas dan Jurnal Realisasi berhasil dicatat dengan seimbang.')
    closeModal(); await fetchData()
  } catch (err) { AppAlert.error('Gagal Menyimpan', err) }
}

const deleteData = async (no_internal: string) => {
  if (!canDelete.value) return
  const result = await Swal.fire({ title: 'Void Setoran?', html: `Batalkan Setoran <b>${no_internal}</b>?<br><small class="text-danger">Tagihan TKR akan kembali berstatus Belum Lunas.</small>`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' })
  if (result.isConfirmed) {
    AppAlert.loading('Memproses Void...')
    try {
      await supabase.from('transaksi').delete().eq('kwitansi_internal', no_internal)
      await supabase.from('setoran_tiket').delete().eq('no_setoran', no_internal)
      AppAlert.success('Dibatalkan!', 'Setoran berhasil di-void.'); await fetchData()
    } catch (err: any) { AppAlert.error('Gagal', err.message || err) }
  }
}

// === FUNGSI CETAK ===
const printDoc = async (no_setoran: string, mode: 'invoice' | 'bkm' | 'jurnal') => {
  AppAlert.loading('Mempersiapkan Dokumen...')
  try {
    const { data: setData } = await supabase.from('setoran_tiket').select('*, master_reseller(nama_reseller, coa_piutang)').eq('no_setoran', no_setoran).single()
    if (!setData) throw new Error('Data setoran tidak ditemukan.')

    const resName = setData.master_reseller?.nama_reseller || '-'
    const coaPiutang = getCoaLabel(setData.master_reseller?.coa_piutang)
    const coaKasLabel = getCoaLabel(setData.coa_kas)
    
    let totalGross = 0
    let tkrCodes: string[] = []
    if (setData.rincian_tkr && Array.isArray(setData.rincian_tkr)) {
      setData.rincian_tkr.forEach((t:any) => {
        totalGross += Number(t.mutasi_kotor)
        if (t.no_bukti_internal) tkrCodes.push(t.no_bukti_internal)
      })
    }

    const { data: trxData } = await supabase.from('transaksi').select('*').eq('kwitansi_internal', no_setoran).order('debet', { ascending: false }) 
    let tD = 0, tK = 0, mappedJurnal: any[] = []
    if (trxData && trxData.length > 0) {
      mappedJurnal = trxData.map((t: any) => {
        tD += Number(t.debet); tK += Number(t.kredit)
        const matchedCoa = listCOA.value.find(c => c.coa_code === t.coa_saldo)
        return { ...t, nama_akun: matchedCoa ? matchedCoa.nama : 'Unknown Account' }
      })
    }

    itemToPrint.value = {
      data: setData,
      reseller_nama: resName,
      coa_piutang: coaPiutang,
      coa_kas_label: coaKasLabel,
      total_tagihan: totalGross,
      tkr_list_str: tkrCodes.join(', '),
      adjustments: setData.detail_penyesuaian || [],
      jurnal_details: mappedJurnal,
      total_jurnal_debet: tD,
      total_jurnal_kredit: tK
    }
    
    printMode.value = mode
    AppAlert.close(); await nextTick(); setTimeout(() => window.print(), 400)
  } catch (err: any) { AppAlert.error('Gagal', err.message || err) }
}

const closeModal = () => { isModalOpen.value = false; closeAllDropdowns() }
const handleNumberInput = (field: string, e: Event) => { const target = e.target as HTMLInputElement | null; if (target) form.value[field] = parseRupiah(target.value) }
const handleGridNilaiInput = (idx: number, e: Event) => { const target = e.target as HTMLInputElement | null; if (target) form.value.penyesuaian[idx].nominal = parseRupiah(target.value) }
const handleClickOutside = (event: MouseEvent) => { const target = event.target as HTMLElement; if (!target.closest('.dropdown-container')) closeAllDropdowns() }
const toggleDropdown = (id: string) => { if (activeDropdown.value === id) closeAllDropdowns(); else { activeDropdown.value = id; searchQuery.value = ''; nextTick(() => { const input = document.querySelector('.custom-dropdown-menu input') as HTMLInputElement; if (input) input.focus() }) } }
const closeAllDropdowns = () => { activeDropdown.value = null; searchQuery.value = '' }
const filteredCOA = computed(() => { if (!searchQuery.value) return listCOA.value; const q = searchQuery.value.toLowerCase(); return listCOA.value.filter(c => c.coa_code.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q)) })
const getCoaLabel = (code: string) => { if (!code) return ''; const c = listCOA.value.find(x => x.coa_code === code); return c ? `${c.coa_code} - ${c.nama}` : code }
const selectGridCoa = (idx: number, field: string, code: string) => { if (idx === -1) form.value[field] = code; else form.value.penyesuaian[idx][field] = code; closeAllDropdowns() }
const addJurnalRow = () => { form.value.penyesuaian.push({ keterangan: '', coa_code: '', posisi: 'D', nominal: 0 }) }
const removeJurnalRow = (idx: number) => { form.value.penyesuaian.splice(idx, 1) }

const formatDate = (dateStr: string) => { if (!dateStr) return '-'; return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }
const formatDateStr = (dateStr: string) => { if (!dateStr) return '-'; const d = new Date(dateStr); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth()+1).padStart(2, '0')}-${d.getFullYear()}` }
const formatDateTime = (dateStr: string) => { if (!dateStr) return '-'; const d = new Date(dateStr); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
const formatNominal = (angka: number) => { if (angka === undefined || angka === null) return '0'; return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka) }
const parseRupiah = (val: string) => { if (!val) return 0; const parsed = Number(val.replace(/[^0-9]/g, '')); return isNaN(parsed) ? 0 : parsed }
const formatInputRupiah = (val: number | string) => { if (!val || val === 0 || val === '0') return ''; return new Intl.NumberFormat('id-ID').format(Number(val)) }
const terbilang = (angka: number): string => { const bilangan = ['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan','Sepuluh','Sebelas']; if (angka < 12) return bilangan[angka]; if (angka < 20) return terbilang(angka - 10) + ' Belas'; if (angka < 100) return terbilang(Math.floor(angka / 10)) + ' Puluh ' + terbilang(angka % 10); if (angka < 200) return 'Seratus ' + terbilang(angka - 100); if (angka < 1000) return terbilang(Math.floor(angka / 100)) + ' Ratus ' + terbilang(angka % 100); if (angka < 2000) return 'Seribu ' + terbilang(angka - 1000); if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + ' Ribu ' + terbilang(angka % 1000); if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + ' Juta ' + terbilang(angka % 1000000); return '' }
const formatTerbilang = (angka: number) => { if (!angka) return 'Nol Rupiah'; return terbilang(angka).replace(/\s+/g, ' ').trim() + ' Rupiah' }
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.dropdown-container { z-index: 1056; }
.custom-dropdown-menu { max-height: 250px; overflow-y: auto; z-index: 1060; }
.table-visible-overflow { overflow: visible !important; }
.custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1050; animation: fadeIn 0.2s ease-out; }
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
  .main-content, .content-area, .app-layout, body, html, #app { margin: 0 !important; padding: 0 !important; background-color: white !important; width: 100% !important; max-width: 100% !important; height: auto !important; overflow: visible !important; position: static !important; }
  #print-area { display: block !important; width: 100% !important; padding: 10px !important; font-size: 9pt !important; color: black !important; }
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