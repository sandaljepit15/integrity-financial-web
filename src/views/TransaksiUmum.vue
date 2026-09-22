<template>
  <div class="transaksi-umum">
    <!-- UI UTAMA APLIKASI -->
    <div class="screen-only">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-0">Kas & Jurnal Umum</h4>
          <p class="text-muted small mb-0">Pencatatan memorial, penerimaan kas, dan pengeluaran kas non-tagihan.</p>
        </div>
        <button v-if="canCreate" class="btn btn-primary fw-bold px-4 shadow-sm" @click="openAddModal">
          <i class="bi bi-journal-plus me-2"></i> Buat Transaksi
        </button>
      </div>

      <!-- TABEL DATA TRANSAKSI UMUM -->
      <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div class="table-responsive" style="min-height: 400px;">
          <table class="table table-striped table-hover table-bordered align-middle mb-0" style="min-width: 1200px;">
            <thead class="table-dark text-center align-middle">
              <tr>
                <th width="4%" class="py-3">No</th>
                <th width="12%" class="py-3">Jenis</th>
                <th width="18%" class="py-3">No. Bukti & Tgl</th>
                <th width="25%" class="py-3">Keterangan & Pihak Terkait</th>
                <th width="16%" class="py-3">Total Transaksi</th>
                <th width="13%" class="py-3">Pembuat</th>
                <th width="12%" class="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="transactions.length === 0">
                <td colspan="7" class="text-center text-muted py-5">
                  <i class="bi bi-journals fs-2 d-block mb-2"></i> Belum ada data transaksi.
                </td>
              </tr>
              
              <tr v-for="(item, index) in transactions" :key="item.kwitansi_internal">
                <td class="text-center text-muted">{{ Number(index) + 1 }}</td>
                <td class="text-center">
                  <span class="badge w-100 py-2" :class="getBadgeClass(item.jenis_transaksi)">
                    {{ formatJenis(item.jenis_transaksi) }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="fw-bold text-dark">{{ item.kwitansi_internal }}</div>
                  <div class="small text-muted mt-1">{{ formatDate(item.tanggal_transaksi) }}</div>
                </td>
                <td>
                  <div class="fw-bold text-dark">{{ item.keterangan || '-' }}</div>
                  <div v-if="item.jenis_transaksi !== 'JURNAL_UMUM'" class="small text-muted mt-1">
                    <i class="bi bi-person-fill me-1"></i> {{ item.pihak_terkait || '-' }}
                  </div>
                </td>
                <td class="text-end fw-bold text-primary">{{ formatRupiah(item.total_nominal) }}</td>
                <td class="text-center small text-muted">{{ item.created_by }}</td>
                <td class="text-center text-nowrap">
                  <!-- BUKTI JURNAL (Untuk Semua Jenis) -->
                  <button class="btn btn-sm btn-light text-success border me-1 shadow-sm" @click="printJurnal(item.kwitansi_internal)" title="Cetak Bukti Jurnal">
                    <i class="bi bi-printer"></i>
                  </button>
                  <!-- TANDA TERIMA / KUITANSI (Hanya Kas Masuk / Keluar) -->
                  <button v-if="item.jenis_transaksi !== 'JURNAL_UMUM'" class="btn btn-sm btn-light text-primary border me-1 shadow-sm" @click="printKuitansi(item.kwitansi_internal)" title="Cetak Kuitansi Eksternal">
                    <i class="bi bi-file-earmark-text"></i>
                  </button>
                  <!-- VOID -->
                  <button v-if="canDelete" class="btn btn-sm btn-light text-danger border shadow-sm" @click="deleteData(item.kwitansi_internal)" title="Void / Batalkan">
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
              <h4 class="mb-0 fw-bold text-dark tracking-wide" style="font-size: 13pt;">
                {{ printTitle }}
              </h4>
            </td>
          </tr>
        </table>

        <!-- INFO BUKTI UMUM (Digunakan oleh Bukti Jurnal Internal) -->
        <template v-if="printMode === 'jurnal'">
          <table class="w-100 mb-2 info-table text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1 px-2">No Bukti</td>
              <td width="35%" class="fw-bold p-1 px-2 text-end">{{ itemToPrint.header.kwitansi_internal }}</td>
              <td width="15%" class="fw-bold p-1 px-2">Dibuat Oleh</td>
              <td width="35%" class="p-1 px-2 text-end">{{ itemToPrint.header.created_by }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1 px-2">Tanggal</td>
              <td class="p-1 px-2 text-end fw-bold">{{ formatDateStr(itemToPrint.header.tanggal_transaksi) }}</td>
              <td class="fw-bold p-1 px-2">Dicetak Oleh</td>
              <td class="p-1 px-2 text-end">{{ currentUser?.nama || 'System' }}</td>
            </tr>
            <tr>
              <td class="fw-bold p-1 px-2">Pihak Terkait</td>
              <td class="p-1 px-2 text-end">{{ itemToPrint.header.pihak_terkait || '-' }}</td>
              <td class="fw-bold p-1 px-2">Waktu Cetak</td>
              <td class="p-1 px-2 text-end">{{ getCurrentPrintTime() }}</td>
            </tr>
          </table>

          <div class="w-100 p-2 mb-3 border border-dark text-dark" style="font-size: 9pt;">
            <strong>Uraian Transaksi:</strong> {{ itemToPrint.header.keterangan }}
          </div>

          <!-- TABEL JURNAL -->
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
        </template>

        <!-- LAYOUT 2: KUITANSI TANDA TERIMA (KAS MASUK / KELUAR) -->
        <template v-if="printMode === 'kuitansi'">
          <table class="w-100 mb-3 info-table text-dark" style="font-size: 9pt;">
            <tr>
              <td width="15%" class="fw-bold p-1 px-2">No Kuitansi</td>
              <td width="35%" class="fw-bold p-1 px-2 text-end">{{ itemToPrint.header.kwitansi_internal }}</td>
              <td width="15%" class="fw-bold p-1 px-2">Tanggal</td>
              <td width="35%" class="p-1 px-2 text-end fw-bold">{{ formatDateStr(itemToPrint.header.tanggal_transaksi) }}</td>
            </tr>
          </table>

          <div class="w-100 p-4 mb-4 mt-2 border border-dark text-dark text-center" style="font-size: 11pt; line-height: 2; background-color: #f8f9fa;">
            Telah 
            <strong>{{ itemToPrint.header.jenis_transaksi === 'KAS_MASUK' ? 'diterima dari' : 'dibayarkan kepada' }}</strong> 
            <strong class="fs-6 text-uppercase text-decoration-underline ms-1">{{ itemToPrint.header.pihak_terkait }}</strong><br>
            
            Uang sebesar <strong class="fs-5 text-primary">Rp {{ formatNominal(itemToPrint.totalDebet) }}</strong><br>
            
            Untuk tujuan/keperluan pembayaran:<br>
            <strong>" {{ itemToPrint.header.keterangan }} "</strong>
          </div>
        </template>

        <!-- FOOTER TTD -->
        <div class="mt-4">
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

      </div>
    </div>
    <!-- END AREA CETAK -->

    <!-- MODAL FORM INPUT TRANSAKSI -->
    <div v-if="isModalOpen" class="custom-modal-overlay screen-only">
      
      <div v-if="activeDropdown" class="position-fixed top-0 start-0 w-100 h-100 overlay-dropdown" @click="closeAllDropdowns"></div>

      <div class="custom-modal-card card border-0 shadow-lg rounded-4 overflow-hidden" style="max-width: 1000px; width: 95%; z-index: 1050;">
        
        <div class="card-header bg-white border-bottom p-0 d-flex justify-content-between align-items-center flex-shrink-0">
          <ul class="nav nav-tabs border-0 mt-3 ms-3" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link fw-bold px-4" :class="{ 'active text-primary border-bottom-0': form.type === 'KAS_MASUK' }" @click="changeFormType('KAS_MASUK')">
                <i class="bi bi-box-arrow-in-right me-1"></i> Kas Masuk (BKM)
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link fw-bold px-4" :class="{ 'active text-danger border-bottom-0': form.type === 'KAS_KELUAR' }" @click="changeFormType('KAS_KELUAR')">
                <i class="bi bi-box-arrow-right me-1"></i> Kas Keluar (BKK)
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link fw-bold px-4" :class="{ 'active text-dark border-bottom-0': form.type === 'JURNAL_UMUM' }" @click="changeFormType('JURNAL_UMUM')">
                <i class="bi bi-journal-text me-1"></i> Jurnal Umum (JU)
              </button>
            </li>
          </ul>
          <button type="button" class="btn-close me-4" @click="closeModal"></button>
        </div>

        <div class="card-body p-4 modal-body-scroll custom-scrollbar bg-light bg-opacity-50">
          
          <div class="bg-white p-3 rounded border shadow-sm mb-4">
            <h6 class="fw-bold mb-3 border-bottom pb-2">Data Header Transaksi</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label small fw-bold">Nomor Bukti <span class="text-danger">*</span></label>
                <input type="text" class="form-control fw-bold" v-model="form.no_bukti" readonly>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Tanggal Transaksi <span class="text-danger">*</span></label>
                <input type="date" class="form-control" v-model="form.tanggal">
              </div>
              
              <!-- Pihak Terkait HANYA TAMPIL untuk Kas -->
              <div class="col-md-4" v-if="form.type !== 'JURNAL_UMUM'">
                <label class="form-label small fw-bold">
                  {{ form.type === 'KAS_MASUK' ? 'Diterima Dari' : 'Dibayarkan Kepada' }} <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-control" v-model="form.pihak_terkait" placeholder="Ketik nama pihak/orang...">
              </div>

              <div :class="form.type === 'JURNAL_UMUM' ? 'col-md-8' : 'col-12'">
                <label class="form-label small fw-bold">Uraian / Keterangan Umum <span class="text-danger">*</span></label>
                <input type="text" class="form-control" v-model="form.keterangan" placeholder="Keterangan transaksi secara keseluruhan...">
              </div>
            </div>
          </div>

          <!-- KELOMPOK AKUN KAS UTAMA (HANYA UNTUK KAS) -->
          <div class="bg-white p-3 rounded border shadow-sm mb-4 position-relative" style="z-index: 20;" v-if="form.type !== 'JURNAL_UMUM'">
            <div class="row align-items-end">
              <div class="col-md-6">
                <label class="form-label small fw-bold" :class="form.type === 'KAS_MASUK' ? 'text-primary' : 'text-danger'">
                  Akun Kas/Bank Utama ({{ form.type === 'KAS_MASUK' ? 'Otomatis DEBET' : 'Otomatis KREDIT' }}) <span class="text-danger">*</span>
                </label>
                
                <div class="position-relative dropdown-container">
                  <div class="form-control bg-white d-flex justify-content-between align-items-center cursor-pointer"
                       :class="form.type === 'KAS_MASUK' ? 'border-primary' : 'border-danger'"
                       @click="toggleDropdown('main-coa')">
                    <span class="text-truncate" :class="{'text-muted': !form.coa_kas}">{{ getCoaLabel(form.coa_kas) }}</span>
                    <i class="bi bi-search small"></i>
                  </div>
                  <div v-if="activeDropdown === 'main-coa'" class="position-absolute w-100 bg-white border rounded shadow mt-1 p-2 custom-dropdown-menu">
                    <input type="text" class="form-control mb-2 sticky-top" placeholder="Cari Kode / Nama Akun..." v-model="searchQuery" @click.stop>
                    <div class="list-group list-group-flush">
                      <button v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click="selectMainCoa(coa.coa_code)">
                        <span class="fw-bold">{{ coa.coa_code }}</span> - {{ coa.nama }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-6 text-end">
                <small class="text-muted fw-bold d-block mb-1">Total Mutasi Kas:</small>
                <h5 class="mb-0 fw-bold" :class="form.type === 'KAS_MASUK' ? 'text-primary' : 'text-danger'">
                  Rp {{ formatNominal(form.type === 'KAS_MASUK' ? totalKredit : totalDebet) }}
                </h5>
              </div>
            </div>
          </div>

          <!-- TABEL JURNAL RINCIAN / LAWAN -->
          <div class="bg-white p-3 rounded border shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
              <h6 class="fw-bold mb-0">
                <i class="bi bi-calculator me-2"></i>
                {{ form.type === 'JURNAL_UMUM' ? 'Rincian Jurnal (Multi-Baris)' : 'Rincian Akun Lawan' }}
              </h6>
              <span class="badge" :class="isBalanced ? 'bg-success' : 'bg-danger'" v-if="form.type === 'JURNAL_UMUM'">
                {{ isBalanced ? 'BALANCE' : 'TIDAK BALANCE' }}
              </span>
              <button class="btn btn-sm btn-outline-primary fw-bold" @click="addJurnalRow">
                <i class="bi bi-plus-circle me-1"></i> Tambah Baris
              </button>
            </div>
            
            <div class="table-responsive border rounded mb-3 table-visible-overflow position-relative" style="z-index: 10;">
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
                  <tr v-for="(row, idx) in form.rincian" :key="idx">
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
                          <input type="text" class="form-control form-control-sm mb-2 sticky-top" placeholder="Cari COA..." v-model="searchQuery" @click.stop>
                          <div class="list-group list-group-flush">
                            <button v-for="coa in filteredCOA" :key="coa.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click="selectRowCoa(Number(idx), coa.coa_code)">
                              <span class="fw-bold">{{ coa.coa_code }}</span> <br> <span class="text-dark">{{ coa.nama }}</span>
                            </button>
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
                          <input type="text" class="form-control form-control-sm mb-2 sticky-top" placeholder="Cari Pos..." v-model="searchQuery" @click.stop>
                          <div class="list-group list-group-flush">
                            <button class="list-group-item list-group-item-action p-2 small border-bottom text-muted fst-italic" @click="selectRowAnggaran(Number(idx), '')">
                              -- Tanpa Anggaran --
                            </button>
                            <button v-for="ang in filteredAnggaran" :key="ang.id" class="list-group-item list-group-item-action p-2 small border-bottom" @click="selectRowAnggaran(Number(idx), ang.id)">
                              <span class="fw-bold text-success">{{ ang.kode_pos }}</span> <br> <span class="text-dark">{{ ang.nama_pos }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <!-- POSISI HANYA BISA DIUBAH JIKA JURNAL UMUM -->
                      <select class="form-select form-select-sm" v-model="row.posisi" 
                              :disabled="form.type !== 'JURNAL_UMUM'"
                              :class="row.posisi === 'D' ? 'text-primary fw-bold' : 'text-danger fw-bold'">
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
                      <button class="btn btn-sm btn-light text-danger" @click="removeJurnalRow(Number(idx))" :disabled="form.rincian.length === 1">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- RINGKASAN BALANCE (HANYA MUNCUL DI JURNAL UMUM) -->
            <div v-if="form.type === 'JURNAL_UMUM'" class="row text-center fw-bold bg-light rounded p-2 border mx-0 mt-3">
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
          <button class="btn btn-primary fw-bold px-4" @click="saveData" :disabled="(form.type==='JURNAL_UMUM' && !isBalanced) || selisih < 0 || (form.type !== 'JURNAL_UMUM' && (totalDebet <= 0 && totalKredit <= 0))">
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

const transactions = ref<any[]>([])
const listCOA = ref<any[]>([])
const listAnggaran = ref<any[]>([])
const company = ref<any>({}) 

const isModalOpen = ref(false)
const currentUser = ref<any>(null)
const itemToPrint = ref<any>(null)
const printMode = ref<'jurnal' | 'kuitansi'>('jurnal')
const printTitle = ref('BUKTI JURNAL')

const activeDropdown = ref<string | null>(null)
const searchQuery = ref('')

const form = ref<any>({
  type: 'KAS_MASUK', // Default
  no_bukti: '', 
  tanggal: '', 
  keterangan: '', 
  pihak_terkait: '', 
  coa_kas: '',
  rincian: []
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

// Auto Generator Nomor Bukti
const generateNoBukti = (type: string) => {
  const now = new Date()
  const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const yyyymmdd = now.toISOString().slice(0,10).replace(/-/g,'')
  const prefix = type === 'KAS_MASUK' ? 'BKM' : (type === 'KAS_KELUAR' ? 'BKK' : 'JU')
  return `${prefix}-${yyyymmdd}-${randomStr}`
}

const changeFormType = (newType: string) => {
  form.value.type = newType
  form.value.no_bukti = generateNoBukti(newType)
  
  // Set default grid lawannya
  let defaultPosisi = 'D'
  if (newType === 'KAS_MASUK') defaultPosisi = 'K' // Lawan kas masuk adalah kredit
  if (newType === 'KAS_KELUAR') defaultPosisi = 'D' // Lawan kas keluar adalah debet
  
  form.value.rincian = [{ coa_code: '', pos_anggaran_id: '', posisi: defaultPosisi, nominal: 0 }]
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-container')) closeAllDropdowns()
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
    (a.kode_pos || '').toLowerCase().includes(q) || (a.nama_pos || '').toLowerCase().includes(q)
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

const selectMainCoa = (code: string) => { form.value.coa_kas = code; closeAllDropdowns() }
const selectRowCoa = (idx: number, code: string) => { form.value.rincian[idx].coa_code = code; closeAllDropdowns() }
const selectRowAnggaran = (idx: number, id: string) => { form.value.rincian[idx].pos_anggaran_id = id; closeAllDropdowns() }

const handleRowNominalInput = (idx: number, e: Event) => {
  const target = e.target as HTMLInputElement | null
  if (target) form.value.rincian[idx].nominal = parseRupiah(target.value)
}

const addJurnalRow = () => {
  let defaultPosisi = 'D'
  if (form.value.type === 'KAS_MASUK') defaultPosisi = 'K'
  if (form.value.type === 'KAS_KELUAR') defaultPosisi = 'D'
  form.value.rincian.push({ coa_code: '', pos_anggaran_id: '', posisi: defaultPosisi, nominal: 0 })
}
const removeJurnalRow = (idx: number) => {
  if (form.value.rincian.length > 1) form.value.rincian.splice(idx, 1)
}

const totalDebet = computed(() => {
  let d = 0
  form.value.rincian.forEach((r: any) => { if (r.posisi === 'D') d += Number(r.nominal) })
  return d
})
const totalKredit = computed(() => {
  let k = 0
  form.value.rincian.forEach((r: any) => { if (r.posisi === 'K') k += Number(r.nominal) })
  return k
})
const selisih = computed(() => Math.abs(totalDebet.value - totalKredit.value))
const isBalanced = computed(() => totalDebet.value > 0 && totalDebet.value === totalKredit.value)

// Formatters
const formatJenis = (jenis: string) => {
  const map: any = { 'KAS_MASUK': 'Kas Masuk', 'KAS_KELUAR': 'Kas Keluar', 'JURNAL_UMUM': 'Jurnal Umum' }
  return map[jenis] || jenis
}
const getBadgeClass = (jenis: string) => {
  const map: any = { 'KAS_MASUK': 'bg-primary', 'KAS_KELUAR': 'bg-danger', 'JURNAL_UMUM': 'bg-dark' }
  return map[jenis] || 'bg-secondary'
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
const getCurrentPrintTime = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth()+1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

const fetchCompanyProfile = async () => {
  try {
    const { data } = await supabase.from('company_profile').select('*').eq('id', 1).single()
    if (data) company.value = data
  } catch (err) {}
}

const fetchDropdowns = async () => {
  try {
    // [Catatan: Biarkan query master_hutang di file Tagihan/Pembayaran tetap ada di bagian ini]

    // 1. Tarik COA (Hanya Detail DAN BUKAN akun Laba Rugi Berjalan)
    let coaQuery = supabase
      .from('coas')
      .select('*')
      .eq('sifat', 'D')
      .order('coa_code', { ascending: true })

    // Mengecualikan COA Laba Rugi Berjalan jika sudah di-setting di profil perusahaan
    if (company.value?.coa_laba_rugi_berjalan) {
      coaQuery = coaQuery.neq('coa_code', company.value.coa_laba_rugi_berjalan)
    }

    const { data: coaData } = await coaQuery
    listCOA.value = coaData || []

    // 2. Tarik ANGGARAN (Hanya Detail)
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
    // Kita men-query tabel transaksi, mengelompokkannya per kwitansi_internal secara unik (Distinct) di level UI
    const { data, error } = await supabase.from('transaksi')
      .select('kwitansi_internal, jenis_transaksi, tanggal_transaksi, keterangan, pihak_terkait, created_by, debet')
      .in('jenis_transaksi', ['KAS_MASUK', 'KAS_KELUAR', 'JURNAL_UMUM'])
      .order('created_at', { ascending: false })
      
    if (error) throw error

    // Grouping data (Karena 1 jurnal ada bnyk baris debet/kredit, kita satukan untuk UI Table)
    const grouped = new Map()
    data.forEach(row => {
      if (!grouped.has(row.kwitansi_internal)) {
        grouped.set(row.kwitansi_internal, { ...row, total_nominal: 0 })
      }
      const existing = grouped.get(row.kwitansi_internal)
      existing.total_nominal += Number(row.debet) // Total debet = total transaksi
    })

    transactions.value = Array.from(grouped.values())
    AppAlert.close()
  } catch (err) { AppAlert.error('Gagal', err) }
}

const openAddModal = () => {
  if (!canCreate.value) return
  form.value = { 
    type: 'KAS_MASUK', no_bukti: generateNoBukti('KAS_MASUK'), tanggal: new Date().toISOString().slice(0,10), 
    keterangan: '', pihak_terkait: '', coa_kas: '', rincian: [{ coa_code: '', pos_anggaran_id: '', posisi: 'K', nominal: 0 }] 
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  closeAllDropdowns()
}

// CETAK JURNAL INTERNAL (Semua Jenis)
const printJurnal = async (kwitansi_internal: string) => {
  AppAlert.loading('Mempersiapkan Jurnal...')
  try {
    const { data, error } = await supabase.from('transaksi')
      .select('*').eq('kwitansi_internal', kwitansi_internal).order('debet', { ascending: false })
    if (error) throw error

    let tD = 0, tK = 0
    const details = data.map(d => {
      tD += Number(d.debet); tK += Number(d.kredit)
      const coa = listCOA.value.find(c => c.coa_code === d.coa_saldo)
      return { ...d, nama_akun: coa ? coa.nama : 'Unknown' }
    })

    itemToPrint.value = { header: data[0], details, totalDebet: tD, totalKredit: tK }
    printMode.value = 'jurnal'
    printTitle.value = 'BUKTI JURNAL'
    
    AppAlert.close()
    await nextTick(); setTimeout(() => window.print(), 400)
  } catch (err) { AppAlert.error('Gagal', err) }
}

// CETAK KUITANSI (Khusus Kas Masuk/Keluar)
const printKuitansi = async (kwitansi_internal: string) => {
  AppAlert.loading('Mempersiapkan Kuitansi...')
  try {
    const { data, error } = await supabase.from('transaksi')
      .select('*').eq('kwitansi_internal', kwitansi_internal)
    if (error) throw error

    // Total Nominal adalah total Debet (karena Debet = Kredit)
    let totalMutasi = 0
    data.forEach(d => totalMutasi += Number(d.debet))

    itemToPrint.value = { header: data[0], totalDebet: totalMutasi }
    printMode.value = 'kuitansi'
    printTitle.value = data[0].jenis_transaksi === 'KAS_MASUK' ? 'KUITANSI PENERIMAAN' : 'KUITANSI PENGELUARAN'
    
    AppAlert.close()
    await nextTick(); setTimeout(() => window.print(), 400)
  } catch (err) { AppAlert.error('Gagal', err) }
}

const saveData = async () => {
  if (!form.value.tanggal || !form.value.keterangan) {
    AppAlert.error('Gagal', 'Tanggal dan Keterangan wajib diisi.')
    return
  }

  // Validasi khusus Kas
  if (form.value.type !== 'JURNAL_UMUM') {
    if (!form.value.pihak_terkait || !form.value.coa_kas) {
      AppAlert.error('Gagal', 'Pihak Terkait dan Akun Kas Utama wajib diisi.')
      return
    }
  }

  // Validasi Rincian & Balance
  const hasEmptyCoa = form.value.rincian.some((r: any) => !r.coa_code || Number(r.nominal) <= 0)
  if (hasEmptyCoa) {
    AppAlert.error('Gagal', 'Semua baris rincian harus memiliki COA dan Nominal lebih dari 0.')
    return
  }

  if (form.value.type === 'JURNAL_UMUM' && !isBalanced.value) {
    AppAlert.error('Gagal', 'Jurnal Umum harus Balance (Debet = Kredit).')
    return
  }

  AppAlert.loading('Menyimpan Transaksi...')
  try {
    const currentUsername = currentUser.value?.nama || currentUser.value?.user_id || 'System'
    const now = new Date().toISOString()
    const payload = []

    // 1. Jika Kas, masukkan Jurnal Utama (Akun Kas) terlebih dahulu
    if (form.value.type !== 'JURNAL_UMUM') {
      const nominalUtama = form.value.type === 'KAS_MASUK' ? totalKredit.value : totalDebet.value
      payload.push({
        tanggal_transaksi: form.value.tanggal,
        kwitansi_internal: form.value.no_bukti,
        jenis_transaksi: form.value.type,
        keterangan: form.value.keterangan,
        pihak_terkait: form.value.pihak_terkait,
        coa_saldo: form.value.coa_kas,
        debet: form.value.type === 'KAS_MASUK' ? nominalUtama : 0,
        kredit: form.value.type === 'KAS_KELUAR' ? nominalUtama : 0,
        created_by: currentUsername,
        created_at: now
      })
    }

    // 2. Masukkan array Rincian
    form.value.rincian.forEach((row: any) => {
      payload.push({
        tanggal_transaksi: form.value.tanggal,
        kwitansi_internal: form.value.no_bukti,
        jenis_transaksi: form.value.type,
        keterangan: form.value.keterangan,
        pihak_terkait: form.value.type !== 'JURNAL_UMUM' ? form.value.pihak_terkait : null,
        coa_saldo: row.coa_code,
        coa_anggaran: row.pos_anggaran_id || null, // Catat realisasi anggaran jika ada
        debet: row.posisi === 'D' ? Number(row.nominal) : 0,
        kredit: row.posisi === 'K' ? Number(row.nominal) : 0,
        created_by: currentUsername,
        created_at: now
      })
    })

    const { error } = await supabase.from('transaksi').insert(payload)
    if (error) throw error

    AppAlert.success('Tersimpan!', 'Transaksi berhasil dibukukan.')
    closeModal()
    await fetchData()
  } catch (err) { AppAlert.error('Gagal Menyimpan', err) }
}

const deleteData = async (kwitansi_internal: string) => {
  if (!canDelete.value) return
  const result = await Swal.fire({
    title: 'Void Transaksi?', 
    text: `Batalkan seluruh jurnal untuk bukti ${kwitansi_internal}?`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444'
  })
  
  if (result.isConfirmed) {
    AppAlert.loading('Membatalkan...')
    try {
      const { error } = await supabase.from('transaksi').delete().eq('kwitansi_internal', kwitansi_internal)
      if (error) throw error
      AppAlert.success('Dibatalkan!', 'Transaksi berhasil di-void.')
      await fetchData()
    } catch (err: any) { AppAlert.error('Gagal Membatalkan', err) }
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
  .table-print th, .table-print td { border: 1px solid black !important; color: black !important; padding: 4px 6px !important; }
  .info-table td { border: none !important; padding: 2px 8px !important; }
  .bg-light { background-color: #e9ecef !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .tracking-wide { letter-spacing: 2px; }
  .text-dark { color: black !important; }
}
</style>