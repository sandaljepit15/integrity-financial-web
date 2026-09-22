<template>
  <div class="tagihan-hutang">
    <!-- UI UTAMA APLIKASI -->
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Input Tagihan (Invoice)</h4>
          <p class="text-muted small mb-0">Pengakuan hutang dengan multi-jurnal (Split Accounting) terintegrasi</p>
        </div>
        <button v-if="canCreate" class="btn btn-primary fw-bold px-4 shadow-sm" @click="openAddModal">
          <i class="bi bi-plus-lg me-2"></i> Buat Tagihan
        </button>
      </div>

      <!-- TABEL DATA TAGIHAN -->
      <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div class="table-responsive" style="min-height: 400px;">
          <table class="table table-striped table-hover table-bordered align-middle mb-0" style="min-width: 1200px;">
            <thead class="table-dark text-center align-middle">
              <tr>
                <th width="4%" class="py-3">No</th>
                <th width="20%" class="py-3">No. Internal / Eksternal</th>
                <th width="15%" class="py-3">Tgl Tagihan & Jatuh Tempo</th>
                <th width="18%" class="py-3">Nominal Tagihan</th>
                <th width="18%" class="py-3">Status Anggaran</th>
                <th width="13%" class="py-3">Pembuat</th>
                <th width="15%" class="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tagihans.length === 0">
                <td colspan="7" class="text-center text-muted py-5">
                  <i class="bi bi-receipt fs-2 d-block mb-2"></i> Belum ada data tagihan.
                </td>
              </tr>
              
              <tr v-for="(item, index) in tagihans" :key="item.id">
                <td class="text-center text-muted">{{ Number(index) + 1 }}</td>
                <td>
                  <div class="fw-bold text-dark">{{ item.no_bukti_internal }}</div>
                  <div class="small text-muted mt-1">Ref: {{ item.nomor_tagihan }}</div>
                </td>
                <td class="text-center">
                  <div class="small fw-bold">{{ formatDate(item.tanggal_tagihan) }}</div>
                  <div class="small text-danger mt-1">JT: {{ formatDate(item.jatuh_tempo) }}</div>
                </td>
                <td class="text-end fw-bold text-primary">{{ formatRupiah(item.jumlah_tagihan) }}</td>
                <td class="text-center">
                  <span v-if="item.status_anggaran === 'TERPOTONG'" class="badge bg-success bg-opacity-10 text-success border border-success">
                    <i class="bi bi-check-circle me-1"></i> Terpotong
                  </span>
                  <span v-else class="badge bg-warning bg-opacity-10 text-warning border border-warning">
                    <i class="bi bi-hourglass me-1"></i> Ditangguhkan
                  </span>
                </td>
                <td class="text-center small text-muted">{{ item.created_by }}</td>
                <td class="text-center text-nowrap">
                  <!-- TOMBOL CETAK JURNAL INTERNAL -->
                  <button class="btn btn-sm btn-light text-success border me-1 shadow-sm" @click="printJurnal(item)" title="Cetak Bukti Jurnal">
                    <i class="bi bi-printer"></i>
                  </button>
                  <!-- TOMBOL CETAK TANDA TERIMA EKSTERNAL -->
                  <button class="btn btn-sm btn-light text-primary border me-1 shadow-sm" @click="printTandaTerima(item)" title="Cetak Tanda Terima">
                    <i class="bi bi-file-earmark-text"></i>
                  </button>
                  <!-- TOMBOL VOID -->
                  <button v-if="canDelete" class="btn btn-sm btn-light text-danger border shadow-sm" @click="deleteData(item.id, item.no_bukti_internal)" title="Void / Batalkan">
                    <i class="bi bi-x-circle"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <!-- END UI UTAMA -->

    <!-- AREA CETAK KHUSUS -->
    <div id="print-area" v-if="itemToPrint">
      <div class="print-container">
        
        <!-- HEADER KOP SURAT DINAMIS -->
        <table class="w-100 table-print table-bordered border-dark mb-3">
          <tr>
            <td width="70%" class="p-2 align-middle">
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
            <td width="30%" class="text-center align-middle bg-light">
              <!-- Judul Dinamis berdasarkan mode cetak -->
              <h4 class="mb-0 fw-bold text-dark tracking-wide" style="font-size: 14pt;">
                {{ printMode === 'jurnal' ? 'TAGIHAN' : 'TANDA TERIMA' }}
              </h4>
            </td>
          </tr>
        </table>

        <!-- LAYOUT 1: BUKTI JURNAL INTERNAL -->
        <template v-if="printMode === 'jurnal'">
          
          <table class="w-100 mb-2 info-table text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1 px-2">No Bukti</td>
              <td width="35%" class="fw-bold p-1 px-2 pe-2" style="text-align: right;">{{ itemToPrint.no_bukti_internal }}</td>
              <td width="15%" class="fw-bold p-1 px-2">Tanggal</td>
              <td width="35%" class="p-1 px-2 fw-bold pe-2" style="text-align: right;">{{ formatDateStr(itemToPrint.tanggal_tagihan) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1 px-2">Bukti Eksternal</td>
              <td class="p-1 px-2 pe-2" style="text-align: right;">{{ itemToPrint.nomor_tagihan || '-' }}</td>
              <td class="fw-bold p-1 px-2">Timestamp</td>
              <td class="p-1 px-2 pe-2" style="text-align: right;">{{ formatDateTime(itemToPrint.created_at) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1 px-2">Dibuat Oleh</td>
              <td class="p-1 px-2 pe-2" style="text-align: right;">{{ itemToPrint.created_by }}</td>
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
                <td class="p-1 px-2 text-end">
                  <div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(jurnal.debet) }}</span></div>
                </td>
                <td class="p-1 px-2 text-end">
                  <div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(jurnal.kredit) }}</span></div>
                </td>
              </tr>
            </tbody>
            <tfoot class="fw-bold bg-light">
              <tr>
                <td colspan="3" class="text-center p-1">Total Balance:</td>
                <td class="p-1 px-2 text-end">
                  <div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(itemToPrint.totalBalanceD) }}</span></div>
                </td>
                <td class="p-1 px-2 text-end">
                  <div class="d-flex justify-content-between"><span>Rp</span> <span>{{ formatNominal(itemToPrint.totalBalanceK) }}</span></div>
                </td>
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

        <!-- LAYOUT 2: BUKTI TANDA TERIMA EKSTERNAL (MENGIKUTI GAYA BKM) -->
        <template v-if="printMode === 'tanda_terima'">
          
          <table class="w-100 mb-4 text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1">No. Bukti</td>
              <td width="35%" class="p-1 fw-bold pe-2" style="text-align: right;">{{ itemToPrint.no_bukti_internal }}</td>
              <td width="15%" class="fw-bold p-1 ps-4">Tanggal</td>
              <td width="35%" class="p-1 fw-bold pe-2" style="text-align: right;">{{ formatDateStr(itemToPrint.tanggal_tagihan) }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1">Bukti Eksternal</td>
              <td class="p-1 fw-bold pe-2" style="text-align: right;">{{ itemToPrint.nomor_tagihan || '-' }}</td>
              <td class="fw-bold p-1 ps-4">Dibuat Oleh</td>
              <td class="p-1 pe-2" style="text-align: right;">{{ itemToPrint.created_by }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1">Jatuh Tempo</td>
              <td class="p-1 fw-bold pe-2" style="text-align: right;">{{ formatDateStr(itemToPrint.jatuh_tempo) }}</td>
              <td class="fw-bold p-1 ps-4">Timestamp</td>
              <td class="p-1 pe-2" style="text-align: right;">{{ formatDateTime(itemToPrint.created_at) }}</td>
            </tr>
          </table>

          <div class="w-100 p-4 mb-5 mt-3 border border-dark text-dark text-center" style="font-size: 11pt; line-height: 1.8; background-color: #f8f9fa;">
            Telah disetujui tagihan dari <strong class="fs-6">{{ itemToPrint.nama_pihak_lawan }}</strong> 
            sebesar <strong class="fs-6">Rp {{ formatNominal(itemToPrint.jumlah_tagihan) }}</strong><br>
            dengan tujuan <strong>{{ itemToPrint.keterangan }}</strong><br>
            pada tanggal <strong>{{ formatDateStr(itemToPrint.tanggal_tagihan) }}</strong> 
            dan jatuh tempo pada tanggal <strong>{{ formatDateStr(itemToPrint.jatuh_tempo) }}</strong>.
          </div>

          <!-- TANDA TANGAN (MENGIKUTI GAYA BKM) -->
          <table class="w-100 text-center text-dark" style="font-size: 10pt;">
            <tr>
              <td width="40%"></td>
              <td width="30%" class="fw-bold">Bendahara</td>
              <td width="30%" class="fw-bold">Pihak Penagih</td>
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

      </div>
    </div>
    <!-- END AREA CETAK -->

    <!-- MODAL FORM INPUT TAGIHAN -->
    <div v-if="isModalOpen" class="custom-modal-overlay screen-only">
      
      <div class="custom-modal-card card border-0 shadow-lg rounded-4 overflow-hidden" style="max-width: 1000px; width: 95%; z-index: 1050;">
        
        <div class="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center flex-shrink-0">
          <h5 class="fw-bold mb-0 text-dark">
            <i class="bi bi-receipt-cutoff text-primary me-2"></i> Form Input Tagihan & Jurnal
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="card-body p-4 modal-body-scroll custom-scrollbar bg-light bg-opacity-50">
          
          <div class="bg-white p-3 rounded border shadow-sm mb-4">
            <h6 class="fw-bold mb-3 border-bottom pb-2"><i class="bi bi-file-earmark-text me-2"></i>Data Dokumen</h6>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold">Referensi Master Hutang <span class="text-danger">*</span></label>
                <select class="form-select" v-model="form.master_hutang_id">
                  <option value="" disabled>-- Pilih Dokumen Perjanjian --</option>
                  <option v-for="mh in masterHutangs" :key="mh.id" :value="mh.id">
                    {{ mh.nomor_perjanjian }} - {{ mh.pihak_lawan?.nama }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Nomor Tagihan (Invoice Eksternal) <span class="text-danger">*</span></label>
                <input type="text" class="form-control fw-bold" v-model="form.nomor_tagihan" placeholder="INV-...">
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Tanggal Tagihan <span class="text-danger">*</span></label>
                <input type="date" class="form-control" v-model="form.tanggal_tagihan">
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-danger">Jatuh Tempo <span class="text-danger">*</span></label>
                <input type="date" class="form-control border-danger" v-model="form.jatuh_tempo">
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Total Nilai Tagihan <span class="text-danger">*</span></label>
                <div class="input-group">
                  <span class="input-group-text fw-bold">Rp</span>
                  <input type="text" class="form-control fw-bold text-primary" 
                         :value="formatInputRupiah(form.jumlah_tagihan)" 
                         @input="handleMainNominalInput" 
                         placeholder="0">
                </div>
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Uraian / Keterangan Umum <span class="text-danger">*</span></label>
                <input type="text" class="form-control" v-model="form.keterangan" placeholder="Keterangan untuk transaksi ini...">
              </div>
            </div>
          </div>

          <div class="bg-white p-3 rounded border shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h6 class="fw-bold mb-0"><i class="bi bi-calculator me-2"></i>Pemetaan Jurnal (Double Entry)</h6>
              <span class="badge" :class="isBalanced ? 'bg-success' : 'bg-danger'">
                {{ isBalanced ? 'BALANCE' : 'TIDAK BALANCE' }}
              </span>
            </div>

            <div class="p-3 bg-danger bg-opacity-10 border border-danger rounded mb-3 position-relative">
              <div class="row align-items-end">
                <div class="col-md-6">
                  <label class="form-label small fw-bold text-danger">Akun Hutang (Kewajiban Utama) <span class="text-danger">*</span></label>
                  
                  <div class="position-relative dropdown-container" :style="{ zIndex: activeDropdown === 'main-coa' ? 1050 : 1 }">
                    <div class="form-control border-danger bg-white d-flex justify-content-between align-items-center cursor-pointer"
                         @click="toggleDropdown('main-coa')">
                      <span class="text-truncate" :class="{'text-muted': !form.coa_hutang}">{{ getCoaLabel(form.coa_hutang) }}</span>
                      <i class="bi bi-search small text-danger"></i>
                    </div>

                    <div v-if="activeDropdown === 'main-coa'" class="position-absolute w-100 bg-white border border-danger rounded shadow mt-1 p-2 custom-dropdown-menu">
                      <input type="text" class="form-control border-danger mb-2 sticky-top" placeholder="Cari Kode / Nama COA Hutang..." v-model="searchQuery" @click.stop>
                      <div class="list-group list-group-flush">
                        <button v-for="coa in filteredCOA" :key="coa.id"
                                class="list-group-item list-group-item-action p-2 small text-start border-bottom"
                                @click="selectMainCoa(coa.coa_code)">
                          <span class="fw-bold text-danger">{{ coa.coa_code }}</span> - {{ coa.nama }}
                        </button>
                        <div v-if="filteredCOA.length === 0" class="text-muted small text-center p-2">COA tidak ditemukan</div>
                      </div>
                    </div>
                  </div>

                </div>
                <div class="col-md-6 text-end">
                  <small class="text-muted fw-bold d-block mb-1">Posisi & Nominal:</small>
                  <h5 class="mb-0 fw-bold text-danger">
                    (KREDIT) Rp {{ formatNominal(Number(form.jumlah_tagihan)) }}
                  </h5>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label small fw-bold text-primary mb-0">Rincian Akun Lawan (Biaya / Aset / Pajak)</label>
              <button class="btn btn-sm btn-outline-primary fw-bold" @click="addJurnalRow">
                <i class="bi bi-plus-circle me-1"></i> Tambah Baris
              </button>
            </div>
            
            <div class="table-responsive border rounded mb-3 table-visible-overflow position-relative">
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
                        <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer"
                             @click="toggleDropdown(`row-${idx}-coa`)">
                          <span class="text-truncate d-inline-block" style="max-width: 180px;" :class="{'text-muted': !row.coa_code}">
                            {{ getCoaLabel(row.coa_code) }}
                          </span>
                          <i class="bi bi-search small text-muted"></i>
                        </div>

                        <div v-if="activeDropdown === `row-${idx}-coa`" class="position-absolute bg-white border rounded shadow mt-1 p-2 custom-dropdown-menu" style="min-width: 300px;">
                          <input type="text" class="form-control form-control-sm mb-2 sticky-top" placeholder="Ketik Kode / Nama COA..." v-model="searchQuery" @click.stop>
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
                        <div class="form-control form-control-sm bg-white d-flex justify-content-between align-items-center cursor-pointer"
                             @click="toggleDropdown(`row-${idx}-anggaran`)">
                          <span class="text-truncate d-inline-block" style="max-width: 150px;" :class="{'text-muted': !row.pos_anggaran_id}">
                            {{ getAnggaranLabel(row.pos_anggaran_id) }}
                          </span>
                          <i class="bi bi-search small text-muted"></i>
                        </div>

                        <div v-if="activeDropdown === `row-${idx}-anggaran`" class="position-absolute bg-white border rounded shadow mt-1 p-2 custom-dropdown-menu" style="min-width: 280px;">
                          <input type="text" class="form-control form-control-sm mb-2 sticky-top" placeholder="Cari Kode / Nama Pos..." v-model="searchQuery" @click.stop>
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
                      <select class="form-select form-select-sm" v-model="row.posisi" :class="row.posisi === 'D' ? 'text-primary fw-bold' : 'text-danger fw-bold'">
                        <option value="D">DEBET</option>
                        <option value="K">KREDIT</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" class="form-control form-control-sm text-end fw-bold" 
                             :value="formatInputRupiah(row.nominal)" 
                             @input="(e) => handleRowNominalInput(Number(idx), e)" 
                             placeholder="0">
                    </td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-light text-danger" @click="removeJurnalRow(Number(idx))" :disabled="form.jurnal_lawan.length === 1">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- RINGKASAN BALANCE -->
            <div class="row text-center fw-bold bg-light rounded p-2 border mx-0 mt-3">
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
          <button class="btn btn-light border fw-bold px-4 me-2" @click="closeModal">Batal</button>
          <button class="btn btn-primary fw-bold px-4" @click="saveData" :disabled="!isBalanced || selisih !== 0">
            <i class="bi bi-save me-1"></i> Simpan & Posting
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { supabase } from '../utils/supabase'
import { AppAlert } from '../utils/alert'
import Swal from 'sweetalert2'

const tagihans = ref<any[]>([])
const masterHutangs = ref<any[]>([])
const listCOA = ref<any[]>([])
const listAnggaran = ref<any[]>([])
const company = ref<any>({}) 

const isModalOpen = ref(false)
const currentUser = ref<any>(null)
const itemToPrint = ref<any>(null)

const printMode = ref<'jurnal' | 'tanda_terima'>('jurnal')

const activeDropdown = ref<string | null>(null)
const searchQuery = ref('')

const form = ref<any>({
  master_hutang_id: '', 
  nomor_tagihan: '', 
  tanggal_tagihan: '', 
  jatuh_tempo: '', 
  jumlah_tagihan: '', 
  keterangan: '', 
  coa_hutang: '',
  jurnal_lawan: []
})

onMounted(async () => {
  const userData = localStorage.getItem('integrity_user')
  if (userData) currentUser.value = JSON.parse(userData)
  
  await fetchCompanyProfile()
  await fetchDropdowns()
  await fetchData()

  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const canCreate = computed(() => currentUser.value?.can_create === true)
const canDelete = computed(() => currentUser.value?.can_delete === true)

const handleMainNominalInput = (e: Event) => {
  const target = e.target as HTMLInputElement | null
  if (target) {
    form.value.jumlah_tagihan = parseRupiah(target.value)
  }
}

const handleRowNominalInput = (idx: number, e: Event) => {
  const target = e.target as HTMLInputElement | null
  if (target) {
    form.value.jurnal_lawan[idx].nominal = parseRupiah(target.value)
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-container')) {
    closeAllDropdowns()
  }
}

const toggleDropdown = (id: string) => {
  if (activeDropdown.value === id) {
    closeAllDropdowns()
  } else {
    activeDropdown.value = id
    searchQuery.value = ''
    nextTick(() => {
      const input = document.querySelector('.custom-dropdown-menu input') as HTMLInputElement
      if (input) input.focus()
    })
  }
}

const closeAllDropdowns = () => {
  activeDropdown.value = null
  searchQuery.value = ''
}

const filteredCOA = computed(() => {
  if (!searchQuery.value) return listCOA.value
  const q = searchQuery.value.toLowerCase()
  return listCOA.value.filter(c => c.coa_code.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q))
})

const filteredAnggaran = computed(() => {
  if (!searchQuery.value) return listAnggaran.value
  const q = searchQuery.value.toLowerCase()
  return listAnggaran.value.filter(a => 
    (a.kode_pos || '').toLowerCase().includes(q) || 
    (a.nama_pos || '').toLowerCase().includes(q)
  )
})

const getCoaLabel = (code: string) => {
  if (!code) return 'Pilih COA...'
  const c = listCOA.value.find(x => x.coa_code === code)
  return c ? `${c.coa_code} - ${c.nama}` : code
}

const getAnggaranLabel = (id: string) => {
  if (!id) return '-- Tanpa Anggaran --'
  const a = listAnggaran.value.find(x => x.id === id)
  return a ? `${a.kode_pos} - ${a.nama_pos}` : '-- Tanpa Anggaran --'
}

const selectMainCoa = (code: string) => {
  form.value.coa_hutang = code
  closeAllDropdowns()
}

const selectRowCoa = (idx: number, code: string) => {
  form.value.jurnal_lawan[idx].coa_code = code
  closeAllDropdowns()
}

const selectRowAnggaran = (idx: number, id: string) => {
  form.value.jurnal_lawan[idx].pos_anggaran_id = id
  closeAllDropdowns()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
const formatDateStr = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth()+1).padStart(2, '0')}-${d.getFullYear()}`
}
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const formatRupiah = (angka: number) => {
  if (!angka) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
}
const formatNominal = (angka: number) => {
  if (!angka) return '0'
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka)
}

const parseRupiah = (val: string) => {
  if (!val) return 0
  const parsed = Number(val.replace(/[^0-9]/g, ''))
  return isNaN(parsed) ? 0 : parsed
}
const formatInputRupiah = (val: number | string) => {
  if (!val || val === 0 || val === '0') return ''
  return new Intl.NumberFormat('id-ID').format(Number(val))
}

const generateNoBuktiTagihan = () => {
  const now = new Date()
  
  const yyyymmdd = now.toISOString().slice(0,10).replace(/-/g, '')
  const prefix = 'TGH' 
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let uniqCode = ''
  for (let i = 0; i < 6; i++) {
    uniqCode += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
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

const addJurnalRow = () => {
  form.value.jurnal_lawan.push({ coa_code: '', pos_anggaran_id: '', posisi: 'D', nominal: '' })
}
const removeJurnalRow = (idx: number) => {
  if (form.value.jurnal_lawan.length > 1) {
    form.value.jurnal_lawan.splice(idx, 1)
  }
}

const totalDebet = computed(() => {
  let d = 0
  form.value.jurnal_lawan.forEach((row: any) => {
    if (row.posisi === 'D') d += Number(row.nominal) || 0
  })
  return d
})
const totalKredit = computed(() => {
  let k = Number(form.value.jumlah_tagihan) || 0 
  form.value.jurnal_lawan.forEach((row: any) => {
    if (row.posisi === 'K') k += Number(row.nominal) || 0
  })
  return k
})
const selisih = computed(() => Math.abs(totalDebet.value - totalKredit.value))
const isBalanced = computed(() => {
  return totalDebet.value > 0 && totalDebet.value === totalKredit.value
})

const fetchCompanyProfile = async () => {
  try {
    const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single()
    if (data) company.value = data
  } catch (err) { console.error('Gagal memuat profil', err) }
}

const fetchDropdowns = async () => {
  try {
    const { data: mhData } = await supabase
      .from('master_hutang')
      .select('id, nomor_perjanjian, pihak_lawan(id, nama)')
    masterHutangs.value = mhData || []

    let coaQuery = supabase
      .from('coas')
      .select('*')
      .eq('sifat', 'D')
      .order('coa_code', { ascending: true })

    if (company.value?.coa_laba_rugi_berjalan) {
      coaQuery = coaQuery.neq('coa_code', company.value.coa_laba_rugi_berjalan)
    }

    const { data: coaData } = await coaQuery
    listCOA.value = coaData || []

    const { data: angData } = await supabase
      .from('anggaran')
      .select('*')
      .eq('sifat', 'D')
    listAnggaran.value = angData || []

  } catch (err) { 
    console.error('Gagal memuat referensi', err) 
  }
}

const fetchData = async () => {
  AppAlert.loading('Memuat data...')
  try {
    const { data, error } = await supabase.from('tagihan_hutang')
      .select(`*, master_hutang (nomor_perjanjian)`)
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw error
    tagihans.value = data || []
    AppAlert.close()
  } catch (err) { AppAlert.error('Gagal memuat data', err) }
}

const openAddModal = () => {
  if (!canCreate.value) return
  form.value = { 
    master_hutang_id: '', nomor_tagihan: '', tanggal_tagihan: '', jatuh_tempo: '', 
    jumlah_tagihan: '', keterangan: '', coa_hutang: '', 
    jurnal_lawan: [{ coa_code: '', pos_anggaran_id: '', posisi: 'D', nominal: '' }] 
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  closeAllDropdowns()
}

// FUNGSI CETAK: BUKTI JURNAL INTERNAL
const printJurnal = async (item: any) => {
  AppAlert.loading('Mempersiapkan Jurnal Internal...')
  try {
    const { data: trxData, error } = await supabase
      .from('transaksi')
      .select('*')
      .eq('kwitansi_internal', item.no_bukti_internal)
      .order('debet', { ascending: false }) 
      
    if (error) throw error
    
    let totalD = 0, totalK = 0
    const mappedTrx = trxData.map((t: any) => {
      totalD += Number(t.debet)
      totalK += Number(t.kredit)
      const matchedCoa = listCOA.value.find(c => c.coa_code === t.coa_saldo)
      return { ...t, nama_akun: matchedCoa ? matchedCoa.nama : 'Unknown Account' }
    })

    itemToPrint.value = {
      ...item,
      jurnalEntries: mappedTrx || [],
      totalBalanceD: totalD,
      totalBalanceK: totalK
    }
    
    printMode.value = 'jurnal' // SET MODE KE JURNAL
    AppAlert.close()
    await nextTick() 
    setTimeout(() => window.print(), 400)
  } catch (err) {
    AppAlert.error('Gagal memuat jurnal', err)
  }
}

// FUNGSI CETAK: BUKTI TANDA TERIMA EKSTERNAL
const printTandaTerima = async (item: any) => {
  AppAlert.loading('Mempersiapkan Tanda Terima...')
  
  const mh = masterHutangs.value.find(m => m.id === item.master_hutang_id)
  const namaPihakLawan = mh?.pihak_lawan?.nama || 'Pihak Terkait'

  itemToPrint.value = {
    ...item,
    nama_pihak_lawan: namaPihakLawan
  }
  
  printMode.value = 'tanda_terima' // SET MODE KE TANDA TERIMA
  AppAlert.close()
  await nextTick()
  setTimeout(() => window.print(), 400)
}

const saveData = async () => {
  if (!isBalanced.value) {
    AppAlert.error('Validasi Jurnal', 'Total Debet dan Kredit harus Balance (Selisih Rp 0) sebelum disimpan.')
    return
  }
  
  if (!form.value.master_hutang_id || !form.value.nomor_tagihan || !form.value.tanggal_tagihan || !form.value.coa_hutang || !form.value.keterangan || !form.value.jumlah_tagihan) {
    AppAlert.error('Validasi Gagal', 'Harap isi seluruh kolom informasi dokumen, Nilai Tagihan, dan Akun Hutang Utama.')
    return
  }

  const hasEmptyCoa = form.value.jurnal_lawan.some((row: any) => !row.coa_code)
  if (hasEmptyCoa) {
    AppAlert.error('Validasi Gagal', 'Ada baris rincian di tabel Akun Lawan yang belum memilih Kode Akun (COA).')
    return
  }

  AppAlert.loading('Menyimpan & Memposting Jurnal...')
  try {
    const currentUsername = currentUser.value?.nama || currentUser.value?.user_id || 'System'
    const now = new Date()
    
    const internalNoBukti = generateNoBuktiTagihan()

    const tagihanNominal = Number(form.value.jumlah_tagihan)
    const hasAnggaran = form.value.jurnal_lawan.some((row: any) => row.pos_anggaran_id !== '')

    const mh = masterHutangs.value.find(m => m.id === form.value.master_hutang_id)
    const idPihakLawan = mh?.pihak_lawan?.id || null 

    const payloadTagihan = {
      id: generateUUID(),
      no_bukti_internal: internalNoBukti,
      master_hutang_id: form.value.master_hutang_id,
      nomor_tagihan: form.value.nomor_tagihan,
      tanggal_tagihan: form.value.tanggal_tagihan,
      jatuh_tempo: form.value.jatuh_tempo,
      jumlah_tagihan: tagihanNominal,
      coa_debet: 'MULTI_JURNAL', 
      coa_kredit: form.value.coa_hutang,
      pos_anggaran_id: null, 
      status_anggaran: hasAnggaran ? 'TERPOTONG' : 'TIDAK_TERKAIT',
      keterangan: form.value.keterangan,
      created_by: currentUsername,
      created_at: now.toISOString()
    }

    const payloadJurnal = []
    
    payloadJurnal.push({
      tanggal_transaksi: form.value.tanggal_tagihan,
      kwitansi_internal: internalNoBukti, 
      kwitansi_eksternal: form.value.nomor_tagihan, 
      jenis_transaksi: 'HUTANG', 
      keterangan: form.value.keterangan,
      coa_saldo: form.value.coa_hutang,
      pihak_hutang: idPihakLawan, 
      debet: 0,
      kredit: tagihanNominal,
      created_by: currentUsername,
      created_at: now.toISOString()
    })

    form.value.jurnal_lawan.forEach((row: any) => {
      payloadJurnal.push({
        tanggal_transaksi: form.value.tanggal_tagihan,
        kwitansi_internal: internalNoBukti, 
        kwitansi_eksternal: form.value.nomor_tagihan, 
        jenis_transaksi: 'HUTANG', 
        keterangan: form.value.keterangan,
        coa_saldo: row.coa_code,
        pihak_hutang: idPihakLawan, 
        debet: row.posisi === 'D' ? Number(row.nominal) : 0,
        kredit: row.posisi === 'K' ? Number(row.nominal) : 0,
        created_by: currentUsername,
        created_at: now.toISOString()
      })
    })

    const { error: errTagihan } = await supabase.from('tagihan_hutang').insert([payloadTagihan])
    if (errTagihan) throw errTagihan

    const { error: errJurnal } = await supabase.from('transaksi').insert(payloadJurnal)
    if (errJurnal) throw errJurnal 

    AppAlert.success('Tersimpan!', 'Tagihan dibuat dan Jurnal Multi-Line berhasil diposting.')
    closeModal()
    await fetchData()
  } catch (err) { AppAlert.error('Gagal Menyimpan', err) }
}

const deleteData = async (id: string, no_internal: string) => {
  if (!canDelete.value) return
  const result = await Swal.fire({
    title: 'Batalkan / Void Dokumen?', 
    html: `Hapus Tagihan <b>${no_internal}</b>?<br><small class="text-danger">Aksi ini juga akan menghapus/membalik seluruh baris jurnal (multi-line) di Buku Besar secara otomatis.</small>`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Void Dokumen!'
  })
  
  if (result.isConfirmed) {
    AppAlert.loading('Membatalkan...')
    try {
      const { error: errJurnal } = await supabase.from('transaksi').delete().eq('kwitansi_internal', no_internal)
      if (errJurnal) throw errJurnal

      const { error: errTagihan } = await supabase.from('tagihan_hutang').delete().eq('id', id)
      if (errTagihan) throw errTagihan

      AppAlert.success('Dibatalkan!', 'Dokumen tagihan dan Jurnal berhasil di-void.')
      await fetchData()
    } catch (err: any) { AppAlert.error('Gagal Membatalkan', err.message || err) }
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
}
.custom-modal-card { max-height: 95vh; display: flex; flex-direction: column; }
.modal-body-scroll { flex: 1 1 auto; overflow-y: auto; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }

#print-area { display: none; }
</style>

<style>
@media print {
  .screen-only, .sidebar, .topbar, .d-print-none, aside, nav, header {
    display: none !important;
  }
  
  .main-content, .content-area, .app-layout, body, html, #app {
    margin: 0 !important; padding: 0 !important;
    background-color: white !important; width: 100% !important;
    max-width: 100% !important; height: auto !important;
    overflow: visible !important; position: static !important;
  }

  #print-area {
    display: block !important; width: 100% !important;
    padding: 10px !important; font-size: 9pt !important;
    color: black !important;
  }

  @page { margin: 10mm; }
  
  .table-print { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 9pt !important; }
  .table-print th, .table-print td { 
    border: 1px solid black !important; color: black !important; padding: 4px 6px !important; 
  }
  
  .info-table td { border: none !important; padding: 2px 8px !important; }
  .bg-light { background-color: #e9ecef !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .tracking-wide { letter-spacing: 2px; }
  .text-dark { color: black !important; }
}
</style>