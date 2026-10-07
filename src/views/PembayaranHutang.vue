<template>
  <div class="pembayaran-hutang">
    <!-- UI UTAMA APLIKASI -->
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Pembayaran Tagihan / Hutang</h4>
          <p class="text-muted small mb-0">Pencatatan pelunasan global per entitas/master dan penerbitan BKK.</p>
        </div>
        <button v-if="canCreate" class="btn btn-primary fw-bold px-4 shadow-sm rounded-0" @click="openAddModal">
          <i class="bi bi-wallet2 me-2"></i> Bayar Tagihan
        </button>
      </div>

      <!-- FITUR PENCARIAN -->
      <div class="d-flex mb-3 gap-2 align-items-center">
        <select class="form-select form-select-sm w-auto rounded-0 border-secondary" v-model="searchColumn">
          <option value="semua">Semua Kategori</option>
          <option value="no_bukti_internal">No. BKK</option>
          <option value="nama_pihak_lawan">Pihak Lawan</option>
          <option value="no_reff_transfer">No. Referensi / Trf</option>
          <option value="created_by">Pembuat</option>
        </select>
        <div class="input-group input-group-sm w-25">
          <span class="input-group-text rounded-0 bg-white border-secondary"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control rounded-0 border-start-0 border-secondary ps-0" v-model="searchTableQuery" placeholder="Cari data...">
        </div>
      </div>

      <!-- TABEL DATA PEMBAYARAN -->
      <div class="card border border-secondary shadow-sm rounded-0 overflow-hidden">
        <div class="table-responsive" style="min-height: 440px;">
          <table class="table table-sm table-striped table-hover table-bordered align-middle mb-0" style="min-width: 1200px; font-size: 0.85rem;">
            <thead class="table-dark text-center align-middle">
              <tr>
                <th width="4%" class="py-3">No</th>
                <th width="18%" class="py-3 cursor-pointer" @click="handleSort('no_bukti_internal')">
                  No. BKK & Tgl Bayar <i class="bi ms-1" :class="sortColumn==='no_bukti_internal' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="20%" class="py-3 cursor-pointer" @click="handleSort('nama_pihak_lawan')">
                  Entitas / Pihak Lawan <i class="bi ms-1" :class="sortColumn==='nama_pihak_lawan' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="15%" class="py-3 cursor-pointer" @click="handleSort('metode_pembayaran')">
                  Metode Bayar <i class="bi ms-1" :class="sortColumn==='metode_pembayaran' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="16%" class="py-3 cursor-pointer" @click="handleSort('jumlah_bayar')">
                  Nominal Dibayar <i class="bi ms-1" :class="sortColumn==='jumlah_bayar' ? (sortDirection==='asc' ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="12%" class="py-3 cursor-pointer" @click="handleSort('created_by')">
                  Pembuat <i class="bi ms-1" :class="sortColumn==='created_by' ? (sortDirection==='asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up') : 'bi-arrow-down-up opacity-25'"></i>
                </th>
                <th width="15%" class="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedData.length === 0">
                <td colspan="7" class="text-center text-muted py-5">
                  <i class="bi bi-wallet fs-2 d-block mb-2"></i> Data tidak ditemukan.
                </td>
              </tr>
              
              <tr v-for="(item, index) in paginatedData" :key="item.id">
                <td class="text-center text-muted">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td>
                  <div class="fw-bold text-dark">{{ item.no_bukti_internal }}</div>
                  <div class="text-muted mt-1" style="font-size: 0.75rem;">{{ formatDate(item.tanggal_pembayaran) }}</div>
                </td>
                <td>
                  <div class="fw-bold text-dark">{{ item.nama_pihak_lawan }}</div>
                  <div class="text-muted mt-1" style="font-size: 0.75rem;">
                    {{ item.tagihan_hutang?.nomor_tagihan ? 'Ref: ' + item.tagihan_hutang.nomor_tagihan : 'Pelunasan Akun Master' }}
                  </div>
                </td>
                <td class="text-center">
                  <span class="badge bg-secondary w-100 py-1 rounded-0">{{ item.metode_pembayaran }}</span>
                  <div class="text-muted mt-1" style="font-size: 0.7rem;">{{ item.no_reff_transfer || '-' }}</div>
                </td>
                <td class="text-end fw-bold text-danger">Rp {{ formatNominal(item.jumlah_bayar) }}</td>
                <td class="text-center text-muted">{{ item.created_by }}</td>
                <td class="text-center text-nowrap">
                  <button class="btn btn-sm btn-light text-success border me-1 rounded-0 shadow-sm" @click="printJurnal(item)" title="Cetak Bukti Jurnal Internal">
                    <i class="bi bi-printer"></i>
                  </button>
                  <button class="btn btn-sm btn-light text-primary border me-1 rounded-0 shadow-sm" @click="printKuitansi(item)" title="Cetak Kuitansi BKK">
                    <i class="bi bi-file-earmark-text"></i>
                  </button>
                  <button v-if="canDelete" class="btn btn-sm btn-light text-danger border rounded-0 shadow-sm" @click="deleteData(item.id, item.no_bukti_internal)" title="Void / Batalkan">
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

    <!-- AREA CETAK KHUSUS -->
    <div id="print-area" v-if="itemToPrint">
      <!-- (KODE CETAK PDF SAMA PERSIS SEPERTI SEBELUMNYA, TIDAK ADA YANG DIUBAH) -->
      <div class="print-container">
        
        <template v-if="printMode === 'kuitansi'">
          <table class="w-100 table-print border-dark mb-4">
            <tr>
              <td width="75%" class="p-2 align-middle print-bg-gray">
                <div class="d-flex align-items-center">
                  <img v-if="company.logo_url" :src="company.logo_url" alt="Logo" style="max-height: 55px; margin-right: 15px;">
                  <div>
                    <h5 class="mb-0 fw-bold text-dark text-uppercase" style="font-size: 12pt;">{{ company.nama || 'NAMA INSTANSI' }}</h5>
                    <div v-if="company.sub_nama" style="font-size: 9pt; font-weight: bold; margin-bottom: 2px;">{{ company.sub_nama }}</div>
                    <div style="font-size: 9pt;" v-if="company.alamat || company.email">
                      <span v-if="company.alamat">{{ company.alamat }}</span>
                      <span v-if="company.alamat && company.email"> | </span>
                      <span v-if="company.email">{{ company.email }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td width="25%" class="text-center align-middle print-bg-gray fw-bold" style="font-size: 18pt;">
                BKK
              </td>
            </tr>
          </table>

          <table class="w-100 mb-4 text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1">No. Kwitansi</td>
              <td width="35%" class="p-1 fw-bold pe-2" style="text-align: right;">{{ itemToPrint.no_bukti_internal }}</td>
              <td width="15%" class="fw-bold p-1 ps-4">Tanggal</td>
              <td width="35%" class="p-1 fw-bold pe-2" style="text-align: right;">{{ formatDateStr(itemToPrint.tanggal_pembayaran) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1">Inv. Eksternal</td>
              <td class="p-1 fw-bold pe-2" style="text-align: right;">{{ itemToPrint.tagihan_hutang?.nomor_tagihan || 'Pelunasan Akun' }}</td>
              <td class="fw-bold p-1 ps-4">Dibuat Oleh</td>
              <td class="p-1 pe-2" style="text-align: right;">{{ itemToPrint.created_by }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1">No. Reff Trf</td>
              <td class="p-1 fw-bold pe-2" style="text-align: right;">{{ itemToPrint.no_reff_transfer || '-' }}</td>
              <td class="fw-bold p-1 ps-4">Timestamp</td>
              <td class="p-1 pe-2" style="text-align: right;">{{ formatDateTime(itemToPrint.created_at) }}</td>
            </tr>
          </table>

          <div class="text-dark" style="font-size: 10pt; border-top: 1px solid #dee2e6; padding-top: 15px;">
            <p class="mb-3 fw-bold">
              Telah diberikan kas kepada <span class="text-uppercase">{{ itemToPrint.nama_pihak_lawan }}</span> 
              melalui {{ itemToPrint.metode_pembayaran }} pada tanggal {{ formatDateStr(itemToPrint.tanggal_pembayaran) }} sebesar :
            </p>
            <div class="border border-dark text-center py-2 mb-3 fw-bold bg-white" style="font-size: 13pt;">
              Rp {{ formatNominal(itemToPrint.jumlah_bayar) }}
            </div>
            <p class="fst-italic fw-bold mb-4" style="font-size: 10pt;">
              Terbilang : {{ formatTerbilang(itemToPrint.jumlah_bayar) }}
            </p>
            <div class="fw-bold mb-1" style="font-size: 10pt;">Untuk Tujuan Pembayaran</div>
            <div class="border border-dark p-2 mb-5 bg-white" style="font-size: 10pt; min-height: 45px;">
              {{ itemToPrint.keterangan }}
            </div>
          </div>

          <table class="w-100 text-center text-dark" style="font-size: 10pt;">
            <tr>
              <td width="40%"></td>
              <td width="30%" class="fw-bold">Bendahara</td>
              <td width="30%" class="fw-bold">Penerima</td>
            </tr>
            <tr>
              <td style="height: 80px;"></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td class="text-start align-bottom" style="font-size: 9pt;">
                <div class="mb-1">
                  <span class="fw-bold d-inline-block" style="width: 70px;">Tgl. Cetak</span> 
                  : {{ formatDateTime(new Date().toISOString()) }}
                </div>
                <i style="font-size: 8pt;">*) Bukti dinyatakan sah apabila telah di cap dan di tandatangani</i>
              </td>
              <td class="fw-bold">{{ itemToPrint.created_by }}</td>
              <td class="fw-bold">{{ itemToPrint.nama_pihak_lawan }}</td>
            </tr>
          </table>
        </template>

        <template v-if="printMode === 'jurnal'">
          <table class="w-100 table-print border-dark mb-3">
            <tr>
              <td width="70%" class="p-2 align-middle">
                <div class="d-flex align-items-center">
                  <img v-if="company.logo_url" :src="company.logo_url" alt="Logo" style="max-height: 45px; margin-right: 15px;">
                  <div>
                    <h5 class="mb-0 fw-bold text-dark text-uppercase" style="font-size: 11pt;">{{ company.nama || 'NAMA INSTANSI' }}</h5>
                    <div v-if="company.sub_nama" style="font-size: 8pt; font-weight: bold; margin-bottom: 2px;">{{ company.sub_nama }}</div>
                    <div style="font-size: 8pt; margin-bottom: 2px;">{{ company.alamat || 'Alamat Instansi' }}</div>
                  </div>
                </div>
              </td>
              <td width="30%" class="text-center align-middle bg-light">
                <h4 class="mb-0 fw-bold text-dark tracking-wide" style="font-size: 13pt;">
                  BKK-INTERN
                </h4>
              </td>
            </tr>
          </table>

          <table class="w-100 mb-2 info-table text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1 px-2">No Bukti</td>
              <td width="35%" class="fw-bold p-1 px-2 pe-2" style="text-align: right;">{{ itemToPrint.no_bukti_internal }}</td>
              <td width="15%" class="fw-bold p-1 px-2">Tanggal</td>
              <td width="35%" class="p-1 px-2 fw-bold pe-2" style="text-align: right;">{{ formatDateStr(itemToPrint.tanggal_pembayaran) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1 px-2">Dibuat Oleh</td>
              <td class="p-1 px-2 pe-2" style="text-align: right;">{{ itemToPrint.created_by }}</td>
              <td class="fw-bold p-1 px-2">Timestamp</td>
              <td class="p-1 px-2 pe-2" style="text-align: right;">{{ formatDateTime(itemToPrint.created_at) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1 px-2">Pihak Terkait</td>
              <td class="p-1 px-2 pe-2" style="text-align: right;">{{ itemToPrint.nama_pihak_lawan }}</td>
              <td class="fw-bold p-1 px-2">Dicetak Oleh</td>
              <td class="p-1 px-2 pe-2" style="text-align: right;">{{ currentUser?.nama || 'System' }}</td>
            </tr>
          </table>

          <div class="w-100 p-2 mb-3 mt-3 border border-dark text-dark" style="font-size: 9pt;">
            <strong>Uraian Transaksi:</strong> {{ itemToPrint.keterangan }}
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
              <tr v-for="(jurnal, idx) in itemToPrint.jurnalEntries" :key="idx">
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
                <td class="p-1 px-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(itemToPrint.totalBalanceD) }}</span></div></td>
                <td class="p-1 px-2 text-end"><div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(itemToPrint.totalBalanceK) }}</span></div></td>
              </tr>
            </tfoot>
          </table>

          <div class="mt-4 text-dark">
            <div class="text-start mb-2" style="font-size: 9pt;">
              <span class="fw-bold d-inline-block" style="width: 70px;">Tgl. Cetak</span> 
              : {{ formatDateTime(new Date().toISOString()) }}
            </div>
            <p class="fst-italic fw-bold text-center mb-2" style="font-size: 8pt;">
              *Dokumen dinyatakan sah apabila telah di stamp (cap) dan ttd oleh pihak yang berwenang.
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
        </template>
      </div>
    </div>

    <!-- MODAL FORM INPUT PEMBAYARAN - PENDEKATAN REKENING KORAN -->
    <div v-if="isModalOpen" class="custom-modal-overlay screen-only">
      <div v-if="activeDropdown" class="position-fixed top-0 start-0 w-100 h-100 overlay-dropdown" @click="closeAllDropdowns"></div>

      <div class="custom-modal-card card border-0 shadow-lg rounded-0 overflow-hidden" style="max-width: 1000px; width: 95%; z-index: 1050;">
        <div class="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center flex-shrink-0">
          <h5 class="fw-bold mb-0 text-dark">
            <i class="bi bi-wallet2 text-primary me-2"></i> Form Pembayaran Hutang
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="card-body p-4 modal-body-scroll custom-scrollbar bg-light bg-opacity-50">
          
          <div class="bg-white p-3 rounded-0 border shadow-sm mb-4">
            <h6 class="fw-bold mb-3 border-bottom pb-2">Pilih Entitas / Akun Hutang Tertagih</h6>
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label small fw-bold">Daftar Pihak Lawan yang Memiliki Tagihan <span class="text-danger">*</span></label>
                <select class="form-select border-primary rounded-0 fw-bold text-dark" v-model="form.master_hutang_id" @change="handleMasterSelect">
                  <option value="" disabled>-- Pilih Rekening Entitas --</option>
                  <option v-for="mst in masterTersedia" :key="mst.id" :value="mst.id">
                    {{ mst.nama_pihak_lawan }} &nbsp;|&nbsp; SPK: {{ mst.nomor_spk }} &nbsp;|&nbsp; Tagihan: Rp {{ formatNominal(mst.sisa_hutang) }}
                  </option>
                </select>
                <small class="text-muted mt-1 d-block"><i class="bi bi-info-circle me-1"></i>Sistem akan melunasi Baki Debet (Outstanding) secara otomatis berdasarkan saldo yang tersedia.</small>
              </div>
            </div>
          </div>

          <div v-if="form.master_hutang_id" class="bg-white p-3 rounded-0 border shadow-sm mb-4">
            <h6 class="fw-bold mb-3 border-bottom pb-2">Data Dokumen Kas Keluar (BKK)</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label small fw-bold">No. BKK Internal</label>
                <input type="text" class="form-control fw-bold bg-light rounded-0" v-model="form.no_bukti_internal" readonly>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Tanggal Pembayaran <span class="text-danger">*</span></label>
                <input type="date" class="form-control rounded-0" v-model="form.tanggal_pembayaran">
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Metode Pembayaran <span class="text-danger">*</span></label>
                <select class="form-select rounded-0" v-model="form.metode_pembayaran">
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Tunai (Cash)">Tunai (Cash)</option>
                  <option value="QRIS / E-Wallet">QRIS / E-Wallet</option>
                  <option value="Giro / Cek">Giro / Cek</option>
                </select>
              </div>

              <div class="col-md-5">
                <label class="form-label small fw-bold">Pihak Tertagih / Vendor</label>
                <input type="text" class="form-control bg-light rounded-0 fw-bold" :value="selectedMasterData?.nama_pihak_lawan" readonly>
              </div>
              <div class="col-md-7">
                <label class="form-label small fw-bold">No. Reff Transfer Bank</label>
                <input type="text" class="form-control rounded-0" v-model="form.no_reff_transfer" placeholder="Opsional (Bukti TF)..." :disabled="form.metode_pembayaran === 'Tunai (Cash)'">
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Keterangan / Berita Pembayaran <span class="text-danger">*</span></label>
                <input type="text" class="form-control rounded-0" v-model="form.keterangan" placeholder="Contoh: Pembayaran Pelunasan Akun...">
              </div>
            </div>
          </div>

          <div v-if="form.master_hutang_id" class="bg-white p-3 rounded-0 border shadow-sm position-relative" style="z-index: 20;">
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h6 class="fw-bold mb-0"><i class="bi bi-calculator me-2"></i>Jurnal Pembayaran (Multi-Baris)</h6>
              <span class="badge rounded-0" :class="isBalanced ? 'bg-success' : 'bg-danger'">
                {{ isBalanced ? 'BALANCE' : 'TIDAK BALANCE' }}
              </span>
            </div>

            <div class="p-3 bg-primary bg-opacity-10 border border-primary rounded-0 mb-3 position-relative">
              <div class="row align-items-center">
                <div class="col-md-6">
                  <label class="form-label small fw-bold text-primary">Akun Hutang (Otomatis DEBET)</label>
                  <div class="form-control border-primary bg-white text-dark fw-bold text-truncate rounded-0">
                    {{ getCoaLabel(selectedMasterData?.coa_kredit) }}
                  </div>
                </div>
                <div class="col-md-6 text-end">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="text-start">
                      <small class="text-muted fw-bold d-block mb-1">Total Tunggakan Akun:</small>
                      <h6 class="mb-0 fw-bold text-dark">Rp {{ formatNominal(selectedMasterData?.sisa_hutang) }}</h6>
                    </div>
                    <div class="text-end" style="width: 230px;">
                      <label class="form-label small fw-bold text-primary mb-1">Nominal Dilunasi <span class="text-danger">*</span></label>
                      <div class="input-group input-group-lg shadow-sm">
                        <span class="input-group-text bg-white border-primary fw-bold rounded-0">Rp</span>
                        <input type="text" class="form-control border-primary text-end fw-bold text-primary rounded-0" 
                               :value="formatInputRupiah(form.jumlah_bayar)" 
                               @input="handleNominalInput" 
                               placeholder="0">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label small fw-bold text-danger mb-0">Rincian Akun Lawan (Kas / Bank / Biaya Admin)</label>
              <button class="btn btn-sm btn-outline-danger fw-bold rounded-0" @click="addJurnalRow">
                <i class="bi bi-plus-circle me-1"></i> Tambah Baris
              </button>
            </div>
            
            <div class="table-responsive border rounded-0 mb-3 table-visible-overflow position-relative">
              <table class="table table-sm table-bordered align-middle mb-0">
                <thead class="bg-light text-center small">
                  <tr>
                    <th width="30%">Kode Akun (COA) <span class="text-danger">*</span></th>
                    <th width="25%">Anggaran (Opsional)</th>
                    <th width="15%">Posisi <span class="text-danger">*</span></th>
                    <th width="20%">Nominal <span class="text-danger">*</span></th>
                    <th width="10%">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in form.jurnal_lawan" :key="idx">
                    <td>
                      <div class="position-relative dropdown-container" :style="{ zIndex: activeDropdown === `row-${idx}-coa` ? 1050 : 1 }">
                        <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0"
                             @click="toggleDropdown(`row-${idx}-coa`)">
                          <span class="text-truncate d-inline-block" style="max-width: 180px;" :class="{'text-muted': !row.coa_code}">
                            {{ getCoaLabel(row.coa_code) }}
                          </span>
                          <i class="bi bi-search small text-muted"></i>
                        </div>

                        <div v-if="activeDropdown === `row-${idx}-coa`" class="position-absolute bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu" style="min-width: 300px;">
                          <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Ketik Kode / Nama COA..." v-model="searchQuery" @click.stop>
                          <div class="list-group list-group-flush">
                            <button v-for="coa in filteredCOA" :key="coa.id"
                                    class="list-group-item list-group-item-action p-2 small text-start border-bottom"
                                    @click="selectRowCoa(Number(idx), coa.coa_code)">
                              <span class="fw-bold text-primary">{{ coa.coa_code }}</span> <br>
                              <span class="text-dark">{{ coa.nama }}</span>
                            </button>
                            <div v-if="filteredCOA.length === 0" class="text-muted small text-center p-2">COA tidak ditemukan</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="position-relative dropdown-container" :style="{ zIndex: activeDropdown === `row-${idx}-anggaran` ? 1050 : 1 }">
                        <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer rounded-0"
                             @click="toggleDropdown(`row-${idx}-anggaran`)">
                          <span class="text-truncate d-inline-block" style="max-width: 150px;" :class="{'text-muted': !row.pos_anggaran_id}">
                            {{ getAnggaranLabel(row.pos_anggaran_id) }}
                          </span>
                          <i class="bi bi-search small text-muted"></i>
                        </div>

                        <div v-if="activeDropdown === `row-${idx}-anggaran`" class="position-absolute bg-white border rounded-0 shadow mt-1 p-2 custom-dropdown-menu" style="min-width: 280px;">
                          <input type="text" class="form-control form-control-sm mb-2 sticky-top rounded-0" placeholder="Cari Kode / Nama Pos..." v-model="searchQuery" @click.stop>
                          <div class="list-group list-group-flush">
                            <button class="list-group-item list-group-item-action p-2 small text-start border-bottom text-muted fst-italic" @click="selectRowAnggaran(Number(idx), '')">
                              -- Tanpa Anggaran --
                            </button>
                            <button v-for="ang in filteredAnggaran" :key="ang.id"
                                    class="list-group-item list-group-item-action p-2 small text-start border-bottom"
                                    @click="selectRowAnggaran(Number(idx), ang.id)">
                              <span class="fw-bold text-success">{{ ang.kode_pos }}</span> <br>
                              <span class="text-dark">{{ ang.nama_pos }}</span>
                            </button>
                            <div v-if="filteredAnggaran.length === 0" class="text-muted small text-center p-2">Anggaran tidak ditemukan</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select class="form-select form-select-sm rounded-0" v-model="row.posisi" :class="row.posisi === 'D' ? 'text-primary fw-bold' : 'text-danger fw-bold'">
                        <option value="D">DEBET</option>
                        <option value="K">KREDIT</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" class="form-control form-control-sm text-end fw-bold rounded-0" 
                             :value="formatInputRupiah(row.nominal)" 
                             @input="(e) => handleRowNominalInput(Number(idx), e)" 
                             placeholder="0">
                    </td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-light text-danger rounded-0" @click="removeJurnalRow(Number(idx))" :disabled="form.jurnal_lawan.length === 1">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- RINGKASAN BALANCE -->
            <div class="row text-center fw-bold bg-light rounded-0 p-2 border mx-0 mt-3">
              <div class="col-4 border-end">
                <div class="small text-muted">Total Debet</div>
                <div class="text-primary fs-6">Rp {{ formatNominal(totalDebet) }}</div>
              </div>
              <div class="col-4 border-end">
                <div class="small text-muted">Total Kredit</div>
                <div class="text-danger fs-6">Rp {{ formatNominal(totalKredit) }}</div>
              </div>
              <div class="col-4">
                <div class="small text-muted">Selisih</div>
                <div class="fs-6" :class="selisih === 0 ? 'text-success' : 'text-danger'">
                  Rp {{ formatNominal(selisih) }}
                </div>
              </div>
            </div>

          </div>
        </div>
        
        <div class="card-footer bg-white border-top text-end py-3 px-4 flex-shrink-0" style="z-index: 1040;">
          <button class="btn btn-light border fw-bold px-4 me-2 rounded-0" @click="closeModal">Batal</button>
          <button class="btn btn-primary fw-bold px-4 rounded-0" @click="saveData" :disabled="!isFormValid">
            <i class="bi bi-save me-1"></i> Simpan Pembayaran
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

const pembayarans = ref<any[]>([])
const masterTersedia = ref<any[]>([]) // Menggantikan tagihanTersedia
const listCOA = ref<any[]>([])
const listAnggaran = ref<any[]>([])
const company = ref<any>({}) 

const isModalOpen = ref(false)
const currentUser = ref<any>(null)
const itemToPrint = ref<any>(null)
const printMode = ref<'jurnal' | 'kuitansi'>('kuitansi')

const activeDropdown = ref<string | null>(null)
const searchQuery = ref('')

const form = ref<any>({
  master_hutang_id: '',
  no_bukti_internal: '',
  tanggal_pembayaran: '',
  metode_pembayaran: 'Transfer Bank',
  no_reff_transfer: '',
  jumlah_bayar: 0,
  keterangan: '',
  jurnal_lawan: [{ coa_code: '', pos_anggaran_id: '', posisi: 'K', nominal: '' }] 
})

// FITUR FILTER & SORTING & PAGINATION
const searchTableQuery = ref('')
const searchColumn = ref('semua')
const sortColumn = ref('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const itemsPerPage = 10

watch(searchTableQuery, () => { currentPage.value = 1 })
watch(searchColumn, () => { currentPage.value = 1 })

const filteredData = computed(() => {
  if (!searchTableQuery.value) return pembayarans.value
  const q = searchTableQuery.value.toLowerCase()
  return pembayarans.value.filter(item => {
    if (searchColumn.value === 'semua') {
      return (item.no_bukti_internal?.toLowerCase().includes(q) ||
              item.nama_pihak_lawan?.toLowerCase().includes(q) ||
              item.created_by?.toLowerCase().includes(q) ||
              item.no_reff_transfer?.toLowerCase().includes(q))
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
  return sortedData.value.slice(start, start + itemsPerPage)
})

const handleSort = (col: string) => {
  if (sortColumn.value === col) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
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

const generateNoBuktiBKK = () => {
  const now = new Date(); const yyyymmdd = now.toISOString().slice(0,10).replace(/-/g, '')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let uniqCode = ''
  for (let i = 0; i < 6; i++) uniqCode += chars.charAt(Math.floor(Math.random() * chars.length))
  let userId = 'SYS'
  if (currentUser.value?.user_id) {
    let rawId = String(currentUser.value.user_id).replace(/\s+/g, '').toUpperCase()
    userId = rawId.length > 8 ? rawId.substring(0, 6) : rawId
  }
  return `BKK-${yyyymmdd}-${uniqCode}-${userId}`
}

const selectedMasterData = computed(() => {
  return masterTersedia.value.find(m => m.id === form.value.master_hutang_id) || null
})

const totalDebet = computed(() => {
  let d = Number(form.value.jumlah_bayar) || 0 
  form.value.jurnal_lawan.forEach((row: any) => { if (row.posisi === 'D') d += Number(row.nominal) || 0 })
  return d
})

const totalKredit = computed(() => {
  let k = 0
  form.value.jurnal_lawan.forEach((row: any) => { if (row.posisi === 'K') k += Number(row.nominal) || 0 })
  return k
})

const selisih = computed(() => Math.abs(totalDebet.value - totalKredit.value))
const isBalanced = computed(() => totalDebet.value > 0 && totalDebet.value === totalKredit.value)

const isFormValid = computed(() => {
  const nominal = Number(form.value.jumlah_bayar)
  const maxSisa = Number(selectedMasterData.value?.sisa_hutang || 0)
  const hasEmptyCoa = form.value.jurnal_lawan.some((r: any) => !r.coa_code)

  return form.value.master_hutang_id && form.value.tanggal_pembayaran && 
         form.value.keterangan && nominal > 0 && nominal <= maxSisa && 
         !hasEmptyCoa && isBalanced.value
})

const handleMasterSelect = () => {
  if (selectedMasterData.value) {
    form.value.jumlah_bayar = selectedMasterData.value.sisa_hutang
    form.value.keterangan = `Pelunasan Baki Debet ${selectedMasterData.value.nama_pihak_lawan} (SPK: ${selectedMasterData.value.nomor_spk})`
  }
}

const handleNominalInput = (e: Event) => {
  const target = e.target as HTMLInputElement | null
  if (target) {
    let val = parseRupiah(target.value)
    const maxSisa = selectedMasterData.value?.sisa_hutang || 0
    if (val > maxSisa) val = maxSisa 
    form.value.jumlah_bayar = val
  }
}

const handleRowNominalInput = (idx: number, e: Event) => {
  const target = e.target as HTMLInputElement | null
  if (target) form.value.jurnal_lawan[idx].nominal = parseRupiah(target.value)
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
const filteredAnggaran = computed(() => {
  if (!searchQuery.value) return listAnggaran.value
  const q = searchQuery.value.toLowerCase()
  return listAnggaran.value.filter(a => (a.kode_pos || '').toLowerCase().includes(q) || (a.nama_pos || '').toLowerCase().includes(q))
})

const getCoaLabel = (code: string | undefined) => {
  const c = listCOA.value.find(x => x.coa_code === code)
  return c ? `${c.coa_code} - ${c.nama}` : (code || 'Pilih COA...')
}
const getAnggaranLabel = (id: string) => {
  const a = listAnggaran.value.find(x => x.id === id)
  return a ? `${a.kode_pos} - ${a.nama_pos}` : '-- Tanpa Anggaran --'
}

const selectRowCoa = (idx: number, code: string) => { form.value.jurnal_lawan[idx].coa_code = code; closeAllDropdowns() }
const selectRowAnggaran = (idx: number, id: string) => { form.value.jurnal_lawan[idx].pos_anggaran_id = id; closeAllDropdowns() }
const addJurnalRow = () => { form.value.jurnal_lawan.push({ coa_code: '', pos_anggaran_id: '', posisi: 'K', nominal: '' }) }
const removeJurnalRow = (idx: number) => { if (form.value.jurnal_lawan.length > 1) form.value.jurnal_lawan.splice(idx, 1) }

// HELPER FORMATTER
const formatDate = (dateStr: string) => { if (!dateStr) return '-'; return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }
const formatDateStr = (dateStr: string) => { if (!dateStr) return '-'; const d = new Date(dateStr); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth()+1).padStart(2, '0')}-${d.getFullYear()}` }
const formatDateTime = (dateStr: string) => { if (!dateStr) return '-'; const d = new Date(dateStr); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
const formatNominal = (angka: number) => { if (!angka) return '0'; return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka) }
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
    const { data: coaData } = await supabase.from('coas').select('*').eq('sifat', 'D').order('coa_code', { ascending: true })
    listCOA.value = coaData || []
    const { data: angData } = await supabase.from('anggaran').select('*').eq('sifat', 'D')
    listAnggaran.value = angData || []

    // KONSEP CORE BANKING: Hitung Total per Master
   // KONSEP CORE BANKING: Hitung Total per Master
    // Gunakan select '*' agar kolom SPK ikut ditarik
    const { data: masters } = await supabase.from('master_hutang').select('*, pihak_lawan(id, nama)')
    const { data: tagihans } = await supabase.from('tagihan_hutang').select('master_hutang_id, jumlah_tagihan, coa_kredit')
    const { data: bayars } = await supabase.from('pembayaran_hutang').select('master_hutang_id, jumlah_bayar')

    const map = new Map()
    ;(masters || []).forEach((m: any) => {
      map.set(m.id, {
        id: m.id, 
        id_pihak_lawan: m.pihak_lawan?.id, 
        nama_pihak_lawan: m.pihak_lawan?.nama || 'Unknown',
        // Mengantisipasi nama kolom SPK di DB Anda
        nomor_spk: m.nomor_spk || m.no_spk || m.nomor_kontrak || m.keterangan || '-', 
        total_tagihan: 0, 
        total_bayar: 0, 
        coa_kredit: null
      })
    })

    ;(tagihans || []).forEach((t: any) => {
      if (map.has(t.master_hutang_id)) {
        const mst = map.get(t.master_hutang_id)
        mst.total_tagihan += Number(t.jumlah_tagihan || 0)
        if (!mst.coa_kredit && t.coa_kredit) mst.coa_kredit = t.coa_kredit 
      }
    })

    ;(bayars || []).forEach((b: any) => {
      if (b.master_hutang_id && map.has(b.master_hutang_id)) {
        map.get(b.master_hutang_id).total_bayar += Number(b.jumlah_bayar || 0)
      }
    })

    masterTersedia.value = Array.from(map.values())
      .map(m => ({ ...m, sisa_hutang: m.total_tagihan - m.total_bayar }))
      .filter(m => m.sisa_hutang > 0)
      
  } catch (err) {}
}

const fetchData = async () => {
  AppAlert.loading('Memuat data...')
  try {
    const { data, error } = await supabase
      .from('pembayaran_hutang')
      // Minta data dari relasi baru (master_hutang_id) dan relasi lama (jika masih tersisa)
      .select(`*, master_hutang(pihak_lawan(nama)), tagihan_hutang(nomor_tagihan, master_hutang(pihak_lawan(nama)))`)
      .order('created_at', { ascending: false })
      .limit(1000)
      
    if (error) throw error

    pembayarans.value = data.map((d: any) => ({
      ...d,
      nama_pihak_lawan: d.master_hutang?.pihak_lawan?.nama || d.tagihan_hutang?.master_hutang?.pihak_lawan?.nama || 'Unknown'
    }))
    
    AppAlert.close()
  } catch (err) { AppAlert.error('Gagal memuat data', err) }
}

const openAddModal = () => {
  if (!canCreate.value) return
  form.value = { 
    master_hutang_id: '',
    no_bukti_internal: generateNoBuktiBKK(),
    tanggal_pembayaran: new Date().toISOString().slice(0,10),
    metode_pembayaran: 'Transfer Bank',
    no_reff_transfer: '',
    jumlah_bayar: 0,
    keterangan: '',
    jurnal_lawan: [{ coa_code: '', pos_anggaran_id: '', posisi: 'K', nominal: '' }] 
  }
  isModalOpen.value = true
}

const closeModal = () => { isModalOpen.value = false; closeAllDropdowns() }

// CETAK JURNAL INTERNAL
const printJurnal = async (item: any) => {
  AppAlert.loading('Mempersiapkan Jurnal Internal...')
  try {
    const { data: trxData, error } = await supabase.from('transaksi').select('*').eq('kwitansi_internal', item.no_bukti_internal).order('debet', { ascending: false }) 
    if (error) throw error
    let tD = 0, tK = 0
    const mappedTrx = trxData.map((t: any) => {
      tD += Number(t.debet); tK += Number(t.kredit)
      const matchedCoa = listCOA.value.find(c => c.coa_code === t.coa_saldo)
      return { ...t, nama_akun: matchedCoa ? matchedCoa.nama : 'Unknown' }
    })

    itemToPrint.value = { ...item, jurnalEntries: mappedTrx, totalBalanceD: tD, totalBalanceK: tK }
    printMode.value = 'jurnal'; AppAlert.close(); await nextTick(); setTimeout(() => window.print(), 400)
  } catch (err) { AppAlert.error('Gagal memuat jurnal', err) }
}

// CETAK KUITANSI BKK
const printKuitansi = async (item: any) => {
  AppAlert.loading('Mempersiapkan Kuitansi BKK...')
  itemToPrint.value = item; printMode.value = 'kuitansi'
  AppAlert.close(); await nextTick(); setTimeout(() => window.print(), 400)
}

const saveData = async () => {
  if (!isFormValid.value) return

  AppAlert.loading('Menyimpan Pembayaran...')
  try {
    const currentUsername = currentUser.value?.nama || currentUser.value?.user_id || 'System'
    const now = new Date().toISOString()
    const nominalHutang = Number(form.value.jumlah_bayar)
    
    const idPihakLawan = selectedMasterData.value?.id_pihak_lawan
    const coaHutang = selectedMasterData.value?.coa_kredit // Akun hutang didebet

    // 1. Insert ke tabel pembayaran_hutang (PENGGUNAAN MASTER_ID, BUKAN TAGIHAN_ID)
    const { error: errBayar } = await supabase.from('pembayaran_hutang').insert([{
      master_hutang_id: form.value.master_hutang_id,
      no_bukti_internal: form.value.no_bukti_internal,
      tanggal_pembayaran: form.value.tanggal_pembayaran,
      metode_pembayaran: form.value.metode_pembayaran,
      no_reff_transfer: form.value.no_reff_transfer || null,
      jumlah_bayar: nominalHutang,
      coa_kas: 'MULTI_JURNAL', 
      keterangan: form.value.keterangan,
      created_by: currentUsername,
      created_at: now
    }])
    if (errBayar) throw errBayar

    // 2. Insert Double Entry
    const payloadJurnal = []
    payloadJurnal.push({
      tanggal_transaksi: form.value.tanggal_pembayaran,
      kwitansi_internal: form.value.no_bukti_internal,
      kwitansi_eksternal: 'PELUNASAN_AKUN', // Karena ini menembak master langsung
      jenis_transaksi: 'KAS_KELUAR', 
      keterangan: form.value.keterangan,
      coa_saldo: coaHutang,
      pihak_hutang: idPihakLawan,
      metode_pembayaran: form.value.metode_pembayaran,
      no_reff_transfer: form.value.no_reff_transfer || null,
      debet: nominalHutang,
      kredit: 0,
      created_by: currentUsername,
      created_at: now
    })

    form.value.jurnal_lawan.forEach((row: any) => {
      if (Number(row.nominal) > 0 && row.coa_code) {
        payloadJurnal.push({
          tanggal_transaksi: form.value.tanggal_pembayaran,
          kwitansi_internal: form.value.no_bukti_internal,
          kwitansi_eksternal: 'PELUNASAN_AKUN',
          jenis_transaksi: 'KAS_KELUAR', 
          keterangan: form.value.keterangan,
          coa_saldo: row.coa_code,
          coa_anggaran: row.pos_anggaran_id || null,
          pihak_hutang: idPihakLawan,
          metode_pembayaran: form.value.metode_pembayaran,
          no_reff_transfer: form.value.no_reff_transfer || null,
          debet: row.posisi === 'D' ? Number(row.nominal) : 0,
          kredit: row.posisi === 'K' ? Number(row.nominal) : 0,
          created_by: currentUsername,
          created_at: now
        })
      }
    })

    const { error: errJurnal } = await supabase.from('transaksi').insert(payloadJurnal)
    if (errJurnal) throw errJurnal 

    AppAlert.success('Tersimpan!', 'Pembayaran berhasil memotong saldo Master.')
    closeModal()
    await fetchDropdowns()
    await fetchData()
  } catch (err) { AppAlert.error('Gagal Menyimpan', err) }
}

const deleteData = async (id: string, no_internal: string) => {
  if (!canDelete.value) return
  const result = await Swal.fire({
    title: 'Void Pembayaran?', 
    html: `Batalkan BKK <b>${no_internal}</b>?<br><small class="text-danger">Aksi ini akan menghapus riwayat bayar dan membalik jurnal multi-baris di Buku Besar.</small>`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444'
  })
  
  if (result.isConfirmed) {
    AppAlert.loading('Membatalkan...')
    try {
      const { error: errJurnal } = await supabase.from('transaksi').delete().eq('kwitansi_internal', no_internal)
      if (errJurnal) throw errJurnal
      const { error: errBayar } = await supabase.from('pembayaran_hutang').delete().eq('id', id)
      if (errBayar) throw errBayar

      AppAlert.success('Dibatalkan!', 'BKK berhasil di-void.')
      await fetchDropdowns()
      await fetchData()
    } catch (err: any) { AppAlert.error('Gagal Membatalkan', err.message || err) }
  }
}
</script>

<style scoped>
/* KODE STYLE SAMA PERSIS SEPERTI SEBELUMNYA */
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
/* KODE PRINT SAMA PERSIS SEPERTI SEBELUMNYA */
@media print {
  .screen-only, .sidebar, .topbar, .d-print-none, aside, nav, header { display: none !important; }
  .main-content, .content-area, .app-layout, body, html, #app {
    margin: 0 !important; padding: 0 !important; background-color: white !important; width: 100% !important;
    max-width: 100% !important; height: auto !important; overflow: visible !important; position: static !important;
  }
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